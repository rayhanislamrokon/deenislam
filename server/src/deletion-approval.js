const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function createDeletionApprovalRouter(getRequests, getUsers, jwtSecret, port) {
  const router = express.Router(),
    internalSecret = crypto.randomBytes(32).toString("hex");
  const actor = (req) => {
    const raw = String(req.get("authorization") || "").replace(
      /^Bearer\s+/i,
      "",
    );
    if (!raw) return null;
    try {
      const value = jwt.verify(raw, jwtSecret);
      return value.role === "admin" ? value : null;
    } catch {
      return null;
    }
  };
  const canApprove = (value) =>
    value &&
    (value.adminRole === "super_admin" ||
      value.permissions?.includes("*") ||
      value.permissions?.includes("deletions.review"));
  router.get("/api/admin/deletion-requests", async (req, res) => {
    const user = actor(req);
    if (!canApprove(user))
      return res.status(403).json({
        message: "Only Super Admin or Admin can review deletion requests.",
      });
    const items = await getRequests()
      .find({ resourceType: { $ne: "user-account" } })
      .sort({ createdAt: -1 })
      .limit(300)
      .toArray();
    res.json({
      data: items.map((x) => ({ ...x, id: x._id.toString(), _id: undefined })),
    });
  });
  router.get("/api/admin/user-deletion-requests", async (req, res) => {
    const user = actor(req);
    if (!canApprove(user))
      return res.status(403).json({ message: "Only Super Admin or Admin can review user deletion requests." });
    const items = await getRequests()
      .find({ resourceType: "user-account" })
      .sort({ createdAt: -1 })
      .limit(300)
      .toArray();
    res.json({ data: items.map((item) => ({ ...item, id: item._id.toString(), _id: undefined })) });
  });
  router.patch(
    "/api/admin/deletion-requests/:id",
    express.json(),
    async (req, res) => {
      try {
        const user = actor(req);
        if (!canApprove(user))
          return res.status(403).json({
            message: "Only Super Admin or Admin can review deletion requests.",
          });
        const { ObjectId } = require("mongodb");
        if (!ObjectId.isValid(req.params.id))
          return res.status(400).json({ message: "Invalid request ID." });
        const id = new ObjectId(req.params.id),
          decision = String(req.body.decision || "");
        if (!["approve", "reject", "restore"].includes(decision))
          return res.status(400).json({ message: "Choose approve, reject or restore." });
        const item = await getRequests().findOne({ _id: id });
        if (!item)
          return res
            .status(404)
            .json({ message: "Deletion request not found." });
        if (decision === "restore") {
          if (item.resourceType !== "user-account" || !item.userId)
            return res.status(400).json({ message: "Only a user account request can be restored." });
          if (!["approved", "rejected", "restored"].includes(item.status))
            return res.status(409).json({ message: "Accept the request before restoring this account." });
          const { ObjectId } = require("mongodb");
          if (!ObjectId.isValid(item.userId)) return res.status(400).json({ message: "Invalid user account ID." });
          await getUsers().updateOne(
            { _id: new ObjectId(item.userId) },
            { $set: { accountStatus: "active", restoredAt: new Date(), restoredBy: user.email || user.sub, updatedAt: new Date() }, $unset: { deletionRequestedAt: "", deletionRequestId: "" } },
          );
          await getRequests().updateOne(
            { _id: id },
            {
              $set: { status: "restored", restoredAt: new Date(), reviewedAt: new Date(), reviewedBy: user.email || user.sub, result: "Account restored without removing stored user data." },
              $push: { activityHistory: { action: "restored", at: new Date(), by: user.email || user.sub } },
            },
          );
          return res.json({ message: "User account restored successfully. The user can now use the account normally." });
        }
        if (item.status !== "pending")
          return res
            .status(409)
            .json({ message: "This request was already reviewed." });
        if (decision === "reject") {
          if (item.resourceType === "user-account" && item.userId) {
            const { ObjectId } = require("mongodb");
            if (ObjectId.isValid(item.userId)) await getUsers().updateOne(
              { _id: new ObjectId(item.userId) },
              { $set: { accountStatus: "active", deletionRejectedAt: new Date(), updatedAt: new Date() }, $unset: { deletionRequestedAt: "" } },
            );
          }
          await getRequests().updateOne(
            { _id: id, status: "pending" },
            {
              $set: {
                status: "rejected",
                reviewedAt: new Date(),
                reviewedBy: user.email || user.sub,
              },
              $push: { activityHistory: { action: "restored", at: new Date(), by: user.email || user.sub } },
            },
          );
          return res.json({ message: "Deletion request rejected." });
        }
        await getRequests().updateOne(
          { _id: id, status: "pending" },
          {
            $set: {
              status: "processing",
              reviewedAt: new Date(),
              reviewedBy: user.email || user.sub,
            },
          },
        );
        if (item.manualReviewOnly || item.resourceType === "user-account") {
          await getRequests().updateOne(
            { _id: id },
            {
              $set: { status: "approved", completedAt: new Date(), result: "Account disabled; retained data awaits retention-policy processing." },
              $push: { activityHistory: { action: "accepted", at: new Date(), by: user.email || user.sub } },
            },
          );
          return res.json({ message: "Account deletion request approved. The account remains disabled and its data was not physically deleted." });
        }
        const response = await fetch("http://127.0.0.1:" + port + item.path, {
            method: "DELETE",
            headers: { "x-deletion-approval": internalSecret },
          }),
          body = await response
            .json()
            .catch(() => ({ message: "Delete operation failed." }));
        if (!response.ok) {
          await getRequests().updateOne(
            { _id: id },
            {
              $set: {
                status: "pending",
                lastError: body.message || "Delete failed",
              },
            },
          );
          return res
            .status(response.status)
            .json({ message: body.message || "Delete failed." });
        }
        await getRequests().updateOne(
          { _id: id },
          {
            $set: {
              status: "approved",
              completedAt: new Date(),
              result: body.message || "Deleted",
            },
          },
        );
        res.json({ message: "Deletion approved and completed." });
      } catch (error) {
        console.error("Deletion approval failed:", error);
        res.status(500).json({ message: "Unable to review deletion request." });
      }
    },
  );
  router.use(async (req, res, next) => {
    if (req.method !== "DELETE" || !req.path.startsWith("/api/admin/"))
      return next();
    if (req.get("x-deletion-approval") === internalSecret) return next();
    const user = actor(req);
    if (!user) return next();
    if (["super_admin", "admin"].includes(user.adminRole)) return next();
    try {
      const existing = await getRequests().findOne({
        path: req.originalUrl,
        status: "pending",
      });
      if (existing)
        return res.status(202).json({
          message: "A deletion request is already waiting for approval.",
          data: { requestId: existing._id.toString(), status: "pending" },
        });
      const now = new Date(),
        record = {
          path: req.originalUrl,
          resourceType: req.path.split("/")[3] || "content",
          resourceId: req.params?.id || req.path.split("/").pop(),
          requestedBy: user.email || user.sub || "Moderator",
          requestedByRole: user.adminRole || "moderator",
          reason: String(req.body?.reason || "").slice(0, 500),
          status: "pending",
          createdAt: now,
        };
      const result = await getRequests().insertOne(record);
      res.status(202).json({
        message: "Deletion request sent to Super Admin and Admin for approval.",
        data: { requestId: result.insertedId.toString(), status: "pending" },
      });
    } catch (error) {
      console.error("Deletion request failed:", error);
      res.status(500).json({ message: "Unable to create deletion request." });
    }
  });
  return router;
}
module.exports = { createDeletionApprovalRouter };
