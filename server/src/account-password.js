const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

function createAccountPasswordRouter(getUsers, jwtSecret) {
  const router = express.Router();
  router.patch("/api/account/password", async (req, res) => {
    try {
      const raw = String(req.get("authorization") || "").replace(
        /^Bearer\s+/i,
        "",
      );
      let payload;
      try {
        payload = jwt.verify(raw, jwtSecret);
      } catch {
        return res
          .status(401)
          .json({ message: "Please sign in to change your password." });
      }
      if (!payload.sub || !ObjectId.isValid(payload.sub))
        return res
          .status(401)
          .json({ message: "Please sign in to change your password." });
      const currentPassword = String(req.body.currentPassword || ""),
        newPassword = String(req.body.newPassword || "");
      if (newPassword.length < 8)
        return res.status(400).json({
          message: "New password must contain at least 8 characters.",
        });
      if (currentPassword === newPassword)
        return res.status(400).json({
          message: "Choose a password different from your current password.",
        });
      const user = await getUsers().findOne({ _id: new ObjectId(payload.sub) });
      if (!user) return res.status(404).json({ message: "Account not found." });
      if (!user.passwordHash)
        return res.status(400).json({
          message:
            "This account uses Google sign-in. Use Forgot Password to create an email password.",
        });
      if (!(await bcrypt.compare(currentPassword, user.passwordHash)))
        return res
          .status(400)
          .json({ message: "Current password is incorrect." });
      const passwordHash = await bcrypt.hash(newPassword, 12);
      await getUsers().updateOne(
        { _id: user._id },
        {
          $set: {
            passwordHash,
            passwordChangedAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );
      res.json({ message: "Password changed successfully." });
    } catch (error) {
      console.error("Account password change failed:", error);
      res
        .status(500)
        .json({ message: "Unable to change your password right now." });
    }
  });
  return router;
}
module.exports = { createAccountPasswordRouter };
