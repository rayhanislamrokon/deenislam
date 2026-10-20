const express = require("express");
const nodemailer = require("nodemailer");

const attempts = new Map();
const clean = (value, max) => String(value || "").trim().slice(0, max);

function createContactSupportRouter() {
  const router = express.Router();
  router.post("/api/contact-support", async (req, res) => {
    try {
      const name = clean(req.body.name, 100);
      const email = clean(req.body.email, 180).toLowerCase();
      const subject = clean(req.body.subject, 160);
      const message = clean(req.body.message, 5000);
      const source = clean(req.body.source, 30) === "Website" ? "Website" : "Mobile App";
      const website = clean(req.body.website, 100);
      if (website) return res.json({ message: "Your message has been sent." });
      if (name.length < 2) return res.status(400).json({ message: "Please enter your name." });
      if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: "Please enter a valid email address." });
      if (subject.length < 3) return res.status(400).json({ message: "Please enter a subject." });
      if (message.length < 10) return res.status(400).json({ message: "Please describe how we can help." });

      const key = String(req.ip || req.socket.remoteAddress || "unknown");
      const now = Date.now();
      const recent = (attempts.get(key) || []).filter((time) => now - time < 15 * 60 * 1000);
      if (recent.length >= 3) return res.status(429).json({ message: "Too many messages. Please try again in 15 minutes." });
      attempts.set(key, [...recent, now]);

      const host = process.env.SMTP_HOST;
      const port = Number(process.env.SMTP_PORT || 587);
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      if (!host || !user || !pass) return res.status(503).json({ message: "Email support is temporarily unavailable." });

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
        auth: { user, pass },
      });
      const recipient = process.env.SUPPORT_EMAIL || user;
      const receivedAt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" }).format(new Date());
      await transporter.sendMail({
        from: process.env.MAIL_FROM || `DeenIslam <${user}>`,
        to: recipient,
        replyTo: `${name} <${email}>`,
        subject: `[DeenIslam Support] ${subject}`,
        text: `New DeenIslam support request\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\nSource: ${source}\nReceived: ${receivedAt} (Dhaka)\n\nMessage\n${message}`,
        html: supportEmailTemplate({ name, email, subject, message, source, receivedAt }),
      });
      res.json({ message: "Your message has been sent successfully." });
    } catch (error) {
      console.error("Contact support email failed:", error?.message || error);
      res.status(502).json({ message: "Unable to send your message right now. Please try again." });
    }
  });
  return router;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function supportEmailTemplate({ name, email, subject, message, source, receivedAt }) {
  const safeName = escapeHtml(name), safeEmail = escapeHtml(email), safeSubject = escapeHtml(subject), safeMessage = escapeHtml(message).replace(/\n/g, "<br>"), safeSource = escapeHtml(source), safeTime = escapeHtml(receivedAt);
  const replyUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Re: ${subject}`)}`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DeenIslam Support Request</title></head><body style="margin:0;padding:0;background:#eef5f0;font-family:Arial,Helvetica,sans-serif;color:#173d2e"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef5f0"><tr><td align="center" style="padding:32px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #dbe8df;border-radius:22px;overflow:hidden;box-shadow:0 12px 32px rgba(8,76,50,.10)"><tr><td style="padding:34px 38px;background:#075b3b;background-image:linear-gradient(135deg,#064a32,#098158);color:#ffffff"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td><div style="font-size:11px;font-weight:800;letter-spacing:1.8px;color:#f1ca61">DEEN ISLAM SUPPORT</div><h1 style="margin:9px 0 5px;font-family:Georgia,serif;font-size:30px;line-height:1.2;color:#ffffff">New support request</h1><p style="margin:0;color:#d9eee5;font-size:14px">A new message was submitted from ${safeSource}.</p></td><td width="66" align="right" valign="top"><div style="width:56px;height:56px;line-height:56px;text-align:center;border-radius:16px;background:rgba(255,255,255,.14);color:#f4ce69;font-size:27px">&#9993;</div></td></tr></table></td></tr><tr><td style="padding:30px 38px"><div style="margin-bottom:22px;padding:18px 20px;border:1px solid #dce9e0;border-radius:15px;background:#f7fbf8"><div style="margin-bottom:13px;font-size:10px;font-weight:800;letter-spacing:1.3px;color:#b47b13">SENDER DETAILS</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:6px 0;color:#718078;font-size:12px">Name</td><td align="right" style="padding:6px 0;color:#173d2e;font-size:14px;font-weight:700">${safeName}</td></tr><tr><td style="padding:6px 0;color:#718078;font-size:12px">Email</td><td align="right" style="padding:6px 0"><a href="mailto:${safeEmail}" style="color:#08754f;font-size:14px;font-weight:700;text-decoration:none">${safeEmail}</a></td></tr><tr><td style="padding:6px 0;color:#718078;font-size:12px">Source</td><td align="right" style="padding:6px 0;color:#173d2e;font-size:14px;font-weight:700">${safeSource}</td></tr><tr><td style="padding:6px 0;color:#718078;font-size:12px">Received</td><td align="right" style="padding:6px 0;color:#173d2e;font-size:13px">${safeTime} (Dhaka)</td></tr></table></div><div style="margin-bottom:8px;font-size:10px;font-weight:800;letter-spacing:1.3px;color:#b47b13">SUBJECT</div><h2 style="margin:0 0 22px;font-family:Georgia,serif;font-size:22px;line-height:1.35;color:#123e30">${safeSubject}</h2><div style="margin-bottom:8px;font-size:10px;font-weight:800;letter-spacing:1.3px;color:#b47b13">MESSAGE</div><div style="padding:20px;border-left:4px solid #c8952e;border-radius:4px 14px 14px 4px;background:#fbfaf4;color:#43574e;font-size:15px;line-height:1.7">${safeMessage}</div><table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:26px"><tr><td style="border-radius:999px;background:#08754f"><a href="${replyUrl}" style="display:inline-block;padding:13px 24px;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none">Reply to ${safeName} &nbsp;&#8594;</a></td></tr></table></td></tr><tr><td align="center" style="padding:20px 30px;border-top:1px solid #e4ece7;background:#f8fbf9;color:#7b8982;font-size:11px;line-height:1.6"><strong style="color:#315346">Deen Islam</strong> &middot; Muslim Guide &amp; Path<br>This notification was sent automatically by the DeenIslam support system.</td></tr></table></td></tr></table></body></html>`;
}

module.exports = { createContactSupportRouter };
