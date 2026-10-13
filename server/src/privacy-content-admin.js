const express = require("express");
const jwt = require("jsonwebtoken");

const defaults = {
  title: "Your Privacy Matters",
  subtitle: "Clear information about your data and choices",
  body: "\u003cp\u003e\u003cstrong\u003eDeenIslam respects your privacy.\u003c/strong\u003e This policy clearly explains what information the app processes, why it is needed, and the choices available to you.\u003c/p\u003e\u003ch3\u003eINFORMATION YOU PROVIDE\u003c/h3\u003e\u003cp\u003eWhen you sign up or log in, we collect your name, email address, login method, Device/Installation ID and authentication information. Passwords are stored only as secure password hashes. If you sign in with Google, we receive the verified name, email and Google account identifier needed to sign you in. We do not receive your Google password.\u003c/p\u003e\u003ch3\u003eDEVICE AND APP INFORMATION\u003c/h3\u003e\u003cp\u003eWe collect a Device/Installation ID and, if you enable push notifications, an Expo push notification token, together with the device platform, app version, approximate country, first and last app-open time, and app-open count. The Device/Installation ID is used to recognize the app installation, connect it to an account after sign-in, synchronize eligible progress, maintain security and support basic service analytics. It is not your IMEI, SIM serial number or contact list.\u003c/p\u003e\u003ch3\u003eLOCATION\u003c/h3\u003e\u003cp\u003eWith your permission, the app accesses your current location when the app opens, when you sign in, and when the app becomes active. The latest coordinates, accuracy, city, region, country and update time may be linked to the Device/Installation ID and, when signed in, your account so prayer times and other location-based features work correctly and administrators can view the latest installation location. Nearby-mosque coordinates may also be sent to the map or mosque-data provider to return nearby results. The device record is updated with the latest location rather than using background location tracking while the app is closed.\u003c/p\u003e\u003ch3\u003eAPP ACTIVITY AND ADVERTISING\u003c/h3\u003e\u003cp\u003eWe may record app-open events and advertisement impressions or clicks, including event time, placement, ad format, installation identifier and, when signed in, account identifier. Advertising providers may process device, network and advertising information under their own privacy policies.\u003c/p\u003e\u003ch3\u003eWORSHIP PROGRESS AND SAVED CONTENT\u003c/h3\u003e\u003cp\u003eTasbih counts, custom dhikr, favourites, completion history and related settings may be saved on your device and synced to our server. Daily Prayer progress, bookmarks, downloads, reading progress, language preferences and Tafsir study notes may be stored locally on your device.\u003c/p\u003e\u003ch3\u003eDEEN AI\u003c/h3\u003e\u003cp\u003eQuestions sent to Deen AI are processed to generate an answer. Recent chat history may be kept locally on your device. AI requests may be handled by our AI service provider according to its applicable privacy terms.\u003c/p\u003e\u003ch3\u003ePAYMENTS AND SUBSCRIPTIONS\u003c/h3\u003e\u003cp\u003eIf paid products are enabled, purchases are processed by the relevant app store or payment provider. We may receive purchase status, product identifier and entitlement information, but we do not collect your full card number or security code.\u003c/p\u003e\u003ch3\u003eHOW WE USE INFORMATION\u003c/h3\u003e\u003cul\u003e\u003cli\u003eProvide accounts and requested app features.\u003c/li\u003e\u003cli\u003eRemember preferences and synchronize eligible progress.\u003c/li\u003e\u003cli\u003eCalculate location-dependent results after permission is granted.\u003c/li\u003e\u003cli\u003eMaintain security, prevent misuse and troubleshoot problems.\u003c/li\u003e\u003cli\u003eUnderstand basic app and advertising performance.\u003c/li\u003e\u003c/ul\u003e\u003ch3\u003eHOW INFORMATION IS SHARED\u003c/h3\u003e\u003cp\u003eWe do not sell your personal information. Limited information may be processed by service providers needed for hosting, authentication, maps, mosque search, AI, analytics, advertising, notifications or payments. Information may also be disclosed when required by law or to protect users and the service.\u003c/p\u003e\u003ch3\u003eDATA RETENTION AND SECURITY\u003c/h3\u003e\u003cp\u003eWe retain information only while it is reasonably needed to provide the service, meet legal obligations, resolve disputes and protect the platform. We use technical and organizational safeguards, but no online system can guarantee absolute security.\u003c/p\u003e\u003ch3\u003eYOUR CHOICES AND ACCOUNT DELETION\u003c/h3\u003e\u003cp\u003eYou can control location and notification permissions from your device settings. A signed-in user can open \u003cstrong\u003eProfile → Account Control → Delete Account\u003c/strong\u003e to permanently delete the account and linked personal server data. Analytics records may be retained only in de-identified form. Content saved locally on the device can be removed by clearing app data or uninstalling the app.\u003c/p\u003e\u003ch3\u003eCHILDREN\u003c/h3\u003e\u003cp\u003eDeenIslam is not intended to knowingly collect personal information from children without the permission required by applicable law. A parent or guardian may contact us regarding a child\u0026apos;s information.\u003c/p\u003e\u003ch3\u003ePOLICY UPDATES\u003c/h3\u003e\u003cp\u003eWe may update this policy when features, providers or legal requirements change. The current version will be available inside the app.\u003c/p\u003e\u003ch3\u003eCONTACT\u003c/h3\u003e\u003cp\u003eFor privacy questions or requests, use the Help \u0026amp; Support contact information provided in DeenIslam.\u003c/p\u003e",
  published: true,
};
const clean = (value, max) =>
  String(value || "")
    .trim()
    .slice(0, max);
function auth(req, secret) {
  const raw = String(req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  try {
    const p = jwt.verify(raw, secret);
    return p.role === "admin" ? p : null;
  } catch {
    return null;
  }
}
function canManage(p) {
  return (
    p &&
    (p.adminRole === "super_admin" ||
      p.permissions?.includes("*") ||
      p.permissions?.includes("settings.manage"))
  );
}
const publicContent = (item) => ({ ...defaults, ...(item?.privacyPage || {}) });
function createPrivacyContentRouter(getSettings, jwtSecret) {
  const router = express.Router();
  router.get("/api/privacy-content", async (_req, res) => {
    try {
      const item = await getSettings().findOne(
          { _id: "primary" },
          { projection: { privacyPage: 1 } },
        ),
        data = publicContent(item);
      res.set("Cache-Control", "no-store");
      res.json({ data: data.published === false ? defaults : data });
    } catch (error) {
      res.status(500).json({ message: "Unable to load Privacy Policy." });
    }
  });
  router.use("/api/admin/privacy-content", (req, res, next) => {
    const p = auth(req, jwtSecret);
    if (!canManage(p))
      return res
        .status(403)
        .json({ message: "Settings permission is required." });
    req.privacyAdmin = p;
    next();
  });
  router.get("/api/admin/privacy-content", async (_req, res) => {
    try {
      const item = await getSettings().findOne(
        { _id: "primary" },
        { projection: { privacyPage: 1 } },
      );
      res.json({ data: publicContent(item) });
    } catch (error) {
      res.status(500).json({ message: "Unable to load Privacy Policy." });
    }
  });
  router.put("/api/admin/privacy-content", async (req, res) => {
    try {
      const privacyPage = {
        title: clean(req.body.title, 100) || defaults.title,
        subtitle: clean(req.body.subtitle, 180) || defaults.subtitle,
        body: clean(req.body.body, 16000) || defaults.body,
        published: req.body.published !== false,
        updatedAt: new Date(),
        updatedBy: req.privacyAdmin?.email || "",
      };
      await getSettings().updateOne(
        { _id: "primary" },
        { $set: { privacyPage }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true },
      );
      res.json({ data: privacyPage, message: "Privacy Policy saved." });
    } catch (error) {
      res.status(500).json({ message: "Unable to save Privacy Policy." });
    }
  });
  return router;
}
module.exports = { createPrivacyContentRouter };
