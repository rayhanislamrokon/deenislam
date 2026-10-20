const express = require("express");
const jwt = require("jsonwebtoken");

const SECTION_PERMISSION = {
  quran: "quran.manage",
  tafsir: "tafsir.manage",
  hadith: "hadith.manage",
  books: "books.manage",
  duas: "duas.manage",
  amol: "amol.manage",
  sahaba: "sahaba.manage",
  prophets: "prophets.manage",
  islamic_history: "islamic_history.manage",
  islamic_lifestyle: "lifestyle.manage",
  daily_prayer: "daily_prayer.manage",
};

function authenticate(req, secret) {
  try {
    const token = String(req.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const payload = jwt.verify(token, secret);
    return payload.role === "admin" ? payload : null;
  } catch {
    return null;
  }
}

function allowedSections(admin) {
  if (admin.adminRole === "super_admin" || admin.permissions?.includes("*")) return Object.keys(SECTION_PERMISSION);
  return Object.entries(SECTION_PERMISSION).filter(([, permission]) => admin.permissions?.includes(permission)).map(([section]) => section);
}

function createContentEngagementAdminRouter(getAnalytics, jwtSecret) {
  const router = express.Router();
  router.get("/api/admin/content-engagement", async (req, res) => {
    const admin = authenticate(req, jwtSecret);
    if (!admin) return res.status(401).json({ message: "Admin session is invalid or expired." });
    try {
      const days = Math.max(1, Math.min(90, Math.floor(Number(req.query.days) || 30)));
      const sections = allowedSections(admin);
      const superAdmin = admin.adminRole === "super_admin" || admin.permissions?.includes("*");
      const requestedSection = String(req.query.section || "").trim().toLowerCase();
      if (requestedSection && !sections.includes(requestedSection)) return res.status(403).json({ message: "You do not have access to this content category." });
      if (!sections.length && !superAdmin) return res.json({ data: { days, scope: [], totals: { views: 0, readers: 0, webViews: 0, webReaders: 0, appViews: 0, appReaders: 0, staySeconds: 0, completions: 0 }, sections: [], topContent: [], daily: [] } });
      const from = new Date(Date.now() - (days - 1) * 86400000);
      from.setHours(0, 0, 0, 0);
      const match = { type: { $in: ["content_view", "content_heartbeat", "content_complete"] }, createdAt: { $gte: from }, ...(requestedSection ? { section: requestedSection } : superAdmin ? {} : { section: { $in: sections } }) };
      const collection = getAnalytics();
      const [totalsRows, sectionRows, contentRows, dailyRows] = await Promise.all([
        collection.aggregate([{ $match: match }, { $group: { _id: null, views: { $sum: { $cond: [{ $eq: ["$type", "content_view"] }, 1, 0] } }, readers: { $addToSet: "$deviceId" }, webViews: { $sum: { $cond: [{ $and: [{ $eq: ["$type", "content_view"] }, { $eq: ["$platform", "web"] }] }, 1, 0] } }, appViews: { $sum: { $cond: [{ $and: [{ $eq: ["$type", "content_view"] }, { $ne: ["$platform", "web"] }] }, 1, 0] } }, webReaders: { $addToSet: { $cond: [{ $eq: ["$platform", "web"] }, "$deviceId", "$$REMOVE"] } }, appReaders: { $addToSet: { $cond: [{ $ne: ["$platform", "web"] }, "$deviceId", "$$REMOVE"] } }, staySeconds: { $sum: "$durationSeconds" }, completions: { $sum: { $cond: [{ $eq: ["$type", "content_complete"] }, 1, 0] } } } }]).toArray(),
        collection.aggregate([{ $match: match }, { $group: { _id: "$section", views: { $sum: { $cond: [{ $eq: ["$type", "content_view"] }, 1, 0] } }, readers: { $addToSet: "$deviceId" }, staySeconds: { $sum: "$durationSeconds" }, completions: { $sum: { $cond: [{ $eq: ["$type", "content_complete"] }, 1, 0] } } } }, { $sort: { views: -1 } }]).toArray(),
        collection.aggregate([{ $match: { ...match, type: { $in: ["content_view", "content_heartbeat"] } } }, { $group: { _id: { section: "$section", contentId: "$contentId", title: "$contentTitle" }, views: { $sum: { $cond: [{ $eq: ["$type", "content_view"] }, 1, 0] } }, readers: { $addToSet: "$deviceId" }, staySeconds: { $sum: "$durationSeconds" } } }, { $sort: { views: -1, staySeconds: -1 } }, { $limit: 20 }]).toArray(),
        collection.aggregate([{ $match: match }, { $group: { _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Dhaka" } }, type: "$type" }, count: { $sum: 1 }, readers: { $addToSet: "$deviceId" }, staySeconds: { $sum: "$durationSeconds" } } }, { $sort: { "_id.date": 1 } }]).toArray(),
      ]);
      const totals = totalsRows[0] || { views: 0, readers: [], staySeconds: 0, completions: 0 };
      const dailyMap = new Map();
      dailyRows.forEach(row => { const date = row._id.date, current = dailyMap.get(date) || { date, views: 0, readers: new Set(), staySeconds: 0, completions: 0 }; if (row._id.type === "content_view") current.views += row.count; if (row._id.type === "content_complete") current.completions += row.count; current.staySeconds += row.staySeconds || 0; row.readers.forEach(id => id && current.readers.add(id)); dailyMap.set(date, current); });
      const sectionStats = new Map(sectionRows.map(row => [row._id, row]));
      const visibleSections = requestedSection ? [requestedSection] : sections;
      res.json({ data: {
        days,
        scope: sections,
        superAdmin,
        selectedSection: requestedSection || "all",
        totals: { views: totals.views || 0, readers: (totals.readers || []).filter(Boolean).length, webViews: totals.webViews || 0, webReaders: (totals.webReaders || []).filter(Boolean).length, appViews: totals.appViews || 0, appReaders: (totals.appReaders || []).filter(Boolean).length, staySeconds: totals.staySeconds || 0, completions: totals.completions || 0 },
        sections: visibleSections.map(section => {
          const row = sectionStats.get(section) || {};
          return { section, views: row.views || 0, readers: (row.readers || []).filter(Boolean).length, staySeconds: row.staySeconds || 0, completions: row.completions || 0 };
        }),
        topContent: contentRows.map(row => ({ section: row._id.section || "other", contentId: row._id.contentId || "", title: row._id.title || row._id.contentId || "Untitled", views: row.views || 0, readers: (row.readers || []).filter(Boolean).length, staySeconds: row.staySeconds || 0 })),
        daily: [...dailyMap.values()].map(row => ({ ...row, readers: row.readers.size })),
      } });
    } catch (error) {
      console.error("Content engagement analytics failed:", error);
      res.status(500).json({ message: "Unable to load content engagement analytics." });
    }
  });
  return router;
}

module.exports = { createContentEngagementAdminRouter };
