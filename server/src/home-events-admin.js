const express = require("express");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const { deleteReplacedImages, deleteStoredImages } = require("./s3-books");

const text = (value, max = 180) => String(value || "").trim().slice(0, max);
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));

function admin(req, secret) {
  try {
    const raw = String(req.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const payload = jwt.verify(raw, secret);
    const allowed = payload.role === "admin" && (
      payload.adminRole === "super_admin" ||
      payload.permissions?.includes("*") ||
      payload.permissions?.includes("notifications.manage")
    );
    return allowed ? payload : null;
  } catch {
    return null;
  }
}

function clean(body, existing = {}) {
  const eventDate = text(body.eventDate ?? existing.eventDate, 10);
  if (!text(body.title ?? existing.title, 120)) throw Error("Event title is required.");
  if (!validDate(eventDate)) throw Error("Choose a valid event date.");
  return {
    title: text(body.title ?? existing.title, 120),
    label: text(body.label ?? existing.label, 60) || "Upcoming Islamic Event",
    eventDate,
    imageUrl: text(body.imageUrl ?? existing.imageUrl, 2000),
    imageKey: text(body.imageKey ?? existing.imageKey, 1000),
    link: text(body.link ?? existing.link, 500),
    published: body.published !== false,
    order: Math.max(0, Math.min(999, Math.floor(Number(body.order ?? existing.order) || 0))),
    updatedAt: new Date(),
  };
}

const output = (item) => {
  const { _id, ...data } = item;
  return { id: _id.toString(), ...data };
};

function createHomeEventsRouter(getCollection, jwtSecret) {
  const router = express.Router();

  router.get("/api/home-events", async (_req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      const rows = await getCollection().find({ published: true }).sort({ order: 1, eventDate: 1, createdAt: 1 }).limit(20).toArray();
      res.json({ data: rows.map(output) });
    } catch (error) {
      console.error("Home events public load failed:", error);
      res.status(500).json({ message: "Unable to load upcoming events." });
    }
  });

  router.use("/api/admin/home-events", (req, res, next) => {
    const payload = admin(req, jwtSecret);
    if (!payload) return res.status(403).json({ message: "Home Events permission is required." });
    req.homeEventsAdmin = payload;
    next();
  });

  router.get("/api/admin/home-events", async (_req, res) => {
    try {
      const rows = await getCollection().find({}).sort({ order: 1, eventDate: 1, createdAt: 1 }).toArray();
      res.json({ data: rows.map(output) });
    } catch (error) {
      res.status(500).json({ message: "Unable to load home events." });
    }
  });

  router.post("/api/admin/home-events", async (req, res) => {
    try {
      const now = new Date();
      const item = { ...clean(req.body), createdAt: now };
      const result = await getCollection().insertOne(item);
      res.status(201).json({ data: { id: result.insertedId.toString(), ...item }, message: "Event card added successfully." });
    } catch (error) {
      res.status(400).json({ message: error.message || "Unable to add event card." });
    }
  });

  router.put("/api/admin/home-events/:id", async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid event card." });
      const _id = new ObjectId(req.params.id), existing = await getCollection().findOne({ _id });
      if (!existing) return res.status(404).json({ message: "Event card not found." });
      const update = clean(req.body, existing);
      const item = await getCollection().findOneAndUpdate({ _id }, { $set: update }, { returnDocument: "after" });
      await deleteReplacedImages(existing, item);
      res.json({ data: output(item), message: "Event card updated successfully." });
    } catch (error) {
      res.status(400).json({ message: error.message || "Unable to update event card." });
    }
  });

  router.delete("/api/admin/home-events/:id", async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid event card." });
      const _id = new ObjectId(req.params.id), item = await getCollection().findOne({ _id });
      if (!item) return res.status(404).json({ message: "Event card not found." });
      await deleteStoredImages(item);
      await getCollection().deleteOne({ _id });
      res.json({ message: "Event card removed successfully." });
    } catch (error) {
      res.status(500).json({ message: "Unable to remove event card." });
    }
  });

  return router;
}

module.exports = { createHomeEventsRouter };
