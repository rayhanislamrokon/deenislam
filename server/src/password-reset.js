const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

function createPasswordResetRouter(getUsers, mail) {
  const router = express.Router();
  const codeHash = (email, code) =>
    crypto
      .createHmac("sha256", mail.secret)
      .update(email + ":" + code)
      .digest("hex");

  router.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const email = String(req.body.email || "")
        .trim()
        .toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email))
        return res
          .status(400)
          .json({ message: "Please enter a valid email address." });
      const users = getUsers();
      const user = await users.findOne({ email });
      let developmentCode;
      if (user) {
        const now = new Date();
        if (
          user.passwordResetRequestedAt &&
          now - new Date(user.passwordResetRequestedAt) < 60000
        ) {
          return res.status(429).json({
            message: "Please wait one minute before requesting another code.",
          });
        }
        const code = String(crypto.randomInt(100000, 1000000));
        await users.updateOne(
          { _id: user._id },
          {
            $set: {
              passwordResetCodeHash: codeHash(email, code),
              passwordResetExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
              passwordResetRequestedAt: now,
              passwordResetAttempts: 0,
            },
          },
        );
        const smtpReady = Boolean(mail.host && mail.user && mail.pass);
        if (smtpReady) {
          const transport = nodemailer.createTransport({
            host: mail.host,
            port: Number(mail.port || 587),
            secure: String(mail.secure) === "true",
            auth: { user: mail.user, pass: mail.pass },
          });
          await transport.sendMail({
            from: mail.from || mail.user,
            to: email,
            subject: "Reset your DeenIslam password",
            text: `Your DeenIslam password reset code is ${code}. It expires in 10 minutes.`,
            html: `<div style="font-family:Arial,sans-serif;padding:24px;color:#153b2e"><h2>DeenIslam</h2><p>Use this code to reset your password:</p><p style="font-size:30px;font-weight:700;letter-spacing:8px;color:#087a4b">${code}</p><p>This code expires in 10 minutes and can be used only once.</p><p>If you did not request this, you can safely ignore this email.</p></div>`,
          });
        } else if (process.env.NODE_ENV !== "production")
          developmentCode = code;
        else
          return res.status(503).json({
            message:
              "Password recovery email is not configured. Please contact support.",
          });
      }
      res.json({
        message:
          "If an account exists for this email, a reset code has been sent.",
        ...(developmentCode ? { developmentCode } : {}),
      });
    } catch (error) {
      console.error("Password reset request failed:", error);
      res
        .status(500)
        .json({ message: "Unable to send a reset code right now." });
    }
  });

  router.post("/api/auth/verify-reset-code", async (req, res) => {
    try {
      const email = String(req.body.email || "")
        .trim()
        .toLowerCase();
      const code = String(req.body.code || "").trim();
      if (!/^\S+@\S+\.\S+$/.test(email) || !/^\d{6}$/.test(code))
        return res
          .status(400)
          .json({ message: "Enter your email and the 6-digit reset code." });
      const user = await getUsers().findOne({ email });
      const validWindow =
        user &&
        user.passwordResetCodeHash &&
        user.passwordResetExpiresAt &&
        new Date(user.passwordResetExpiresAt) > new Date() &&
        (user.passwordResetAttempts || 0) < 5;
      const expected = codeHash(email, code);
      const stored = String(user?.passwordResetCodeHash || "");
      const valid =
        validWindow &&
        stored.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(expected));
      if (!valid) {
        if (user)
          await getUsers().updateOne(
            { _id: user._id },
            { $inc: { passwordResetAttempts: 1 } },
          );
        return res.status(400).json({
          message: "The verification code is invalid or has expired.",
        });
      }
      res.json({ message: "Code verified." });
    } catch (error) {
      console.error("Password reset verification failed:", error);
      res.status(500).json({ message: "Unable to verify the code right now." });
    }
  });
  router.post("/api/auth/reset-password", async (req, res) => {
    try {
      const email = String(req.body.email || "")
        .trim()
        .toLowerCase();
      const code = String(req.body.code || "").trim();
      const password = String(req.body.password || "");
      if (!/^\S+@\S+\.\S+$/.test(email) || !/^\d{6}$/.test(code))
        return res
          .status(400)
          .json({ message: "Enter your email and the 6-digit reset code." });
      if (password.length < 8)
        return res
          .status(400)
          .json({ message: "New password must be at least 8 characters." });
      const users = getUsers();
      const user = await users.findOne({ email });
      const invalid =
        !user ||
        !user.passwordResetCodeHash ||
        !user.passwordResetExpiresAt ||
        new Date(user.passwordResetExpiresAt) < new Date() ||
        user.passwordResetAttempts >= 5;
      if (
        invalid ||
        !crypto.timingSafeEqual(
          Buffer.from(user.passwordResetCodeHash || "".padEnd(64, "0")),
          Buffer.from(codeHash(email, code)),
        )
      ) {
        if (user)
          await users.updateOne(
            { _id: user._id },
            { $inc: { passwordResetAttempts: 1 } },
          );
        return res
          .status(400)
          .json({ message: "The reset code is invalid or has expired." });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            passwordHash,
            authProvider:
              user.authProvider === "google" ? "google+email" : "email",
            updatedAt: new Date(),
          },
          $unset: {
            passwordResetCodeHash: "",
            passwordResetExpiresAt: "",
            passwordResetRequestedAt: "",
            passwordResetAttempts: "",
          },
        },
      );
      res.json({
        message: "Your password has been reset. You can now sign in.",
      });
    } catch (error) {
      console.error("Password reset confirmation failed:", error);
      res
        .status(500)
        .json({ message: "Unable to reset your password right now." });
    }
  });

  return router;
}

module.exports = { createPasswordResetRouter };
