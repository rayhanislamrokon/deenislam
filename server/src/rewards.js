const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const REQUIRED = 20;
const FREE_PREMIUM_MS = 24 * 60 * 60 * 1000;
const FREE_PREMIUM_USES = 5;
const FREE_CONTENT_USES = 5;
const FREE_AI_DAILY_LIMIT = 0;
const ESSENTIAL_AI_DAILY_LIMIT = 4;
const PAID_AI_DAILY_LIMIT = 12;
const PRO_AI_DAILY_LIMIT = 25;
const COMPLIMENTARY_AI_DAILY_LIMIT = 5;

const KEY_URL = "https://www.gstatic.com/admob/reward/verifier-keys.json";
let keyCache = { expires: 0, keys: new Map() };

function safeTimeZone(value) {
  const timeZone = String(value || "UTC")
    .trim()
    .slice(0, 80);
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone }).format();
    return timeZone;
  } catch {
    return "UTC";
  }
}
function dayKey(date, timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
function nextLocalMidnight(date, timeZone) {
  const current = dayKey(date, timeZone);
  let low = date.getTime(),
    high = low + 30 * 60 * 60 * 1000;
  while (dayKey(new Date(high), timeZone) === current)
    high += 6 * 60 * 60 * 1000;
  for (let i = 0; i < 50; i++) {
    const middle = Math.floor((low + high) / 2);
    if (dayKey(new Date(middle), timeZone) === current) low = middle + 1;
    else high = middle;
  }
  return new Date(high);
}
function summary(account = {}, timeZone = "UTC") {
  const now = new Date(),
    today = dayKey(now, timeZone),
    totalRewardedAds =
      account.rewardModelVersion === 4 && account.rewardDayKey === today
        ? Math.max(0, Number(account.dailyRewardedAds) || 0)
        : 0,
    completedBatches = Math.floor(totalRewardedAds / REQUIRED),
    cycleCompleted = totalRewardedAds % REQUIRED,
    paidUntil = account.paidPremiumUntil
      ? new Date(account.paidPremiumUntil)
      : null,
    rewardUntil = account.rewardPremiumUntil
      ? new Date(account.rewardPremiumUntil)
      : null,
    paidActive = Boolean(paidUntil && paidUntil > now),
    rewardedActive = Boolean(
      account.rewardPremiumDayKey === today &&
      rewardUntil &&
      rewardUntil > now &&
      Number(account.rewardPremiumUsesRemaining) > 0,
    ),
    paidLimit =
      account.premiumSource === "admin_complimentary"
        ? COMPLIMENTARY_AI_DAILY_LIMIT
        : account.premiumPlan === "essential"
          ? ESSENTIAL_AI_DAILY_LIMIT
          : account.premiumPlan === "pro"
            ? PRO_AI_DAILY_LIMIT
            : PAID_AI_DAILY_LIMIT,
    aiUsed =
      account.aiUsageDayKey === today
        ? Math.max(0, Number(account.aiUsesToday) || 0)
        : 0,
    dailyUsageLimit = paidActive
      ? paidLimit
      : rewardedActive
        ? completedBatches * FREE_PREMIUM_USES
        : FREE_AI_DAILY_LIMIT,
    dailyUsageUsed = paidActive
      ? Math.min(paidLimit, aiUsed)
      : rewardedActive
        ? Math.max(
            0,
            completedBatches * FREE_PREMIUM_USES -
              Number(account.rewardPremiumUsesRemaining || 0),
          )
        : aiUsed;
  return {
    completed: cycleCompleted,
    required: REQUIRED,
    remaining: REQUIRED - cycleCompleted,
    percentage: Math.round((cycleCompleted / REQUIRED) * 100),
    totalRewardedAds,
    completedBatches,
    remainingToNextBatch: REQUIRED - cycleCompleted,
    dailyCompleted: cycleCompleted,
    dailyMaximum: REQUIRED,
    adsPerPremiumDay: REQUIRED,
    earnedPremiumDaysToday: completedBatches,
    remainingToNextPremiumDay: REQUIRED - cycleCompleted,
    premiumUnlocked: paidActive || rewardedActive,
    accessType: paidActive ? "paid" : rewardedActive ? "rewarded" : "none",
    premiumExpiresAt: paidActive
      ? paidUntil.toISOString()
      : rewardedActive
        ? rewardUntil.toISOString()
        : null,
    premiumUsesRemaining: paidActive
      ? Math.max(0, paidLimit - aiUsed)
      : rewardedActive
        ? Math.max(0, Number(account.rewardPremiumUsesRemaining) || 0) +
          Math.max(0, Number(account.rewardContentUsesRemaining) || 0)
        : Math.max(0, FREE_AI_DAILY_LIMIT - aiUsed),
    premiumUsesLimit: paidActive
      ? dailyUsageLimit
      : completedBatches * (FREE_PREMIUM_USES + FREE_CONTENT_USES),
    aiSearchCreditsRemaining: paidActive
      ? Math.max(0, paidLimit - aiUsed)
      : rewardedActive
        ? Math.max(0, Number(account.rewardPremiumUsesRemaining) || 0)
        : Math.max(0, FREE_AI_DAILY_LIMIT - aiUsed),
    aiSearchCreditsLimit: paidActive
      ? paidLimit
      : rewardedActive
        ? completedBatches * FREE_PREMIUM_USES
        : FREE_AI_DAILY_LIMIT,
    contentCreditsRemaining: paidActive
      ? null
      : Math.max(0, Number(account.rewardContentUsesRemaining) || 0),
    contentCreditsLimit: paidActive
      ? null
      : completedBatches * FREE_CONTENT_USES,
    dailyUsageLimit,
    dailyUsageUsed,
    dailyUsageRemaining: Math.max(0, dailyUsageLimit - dailyUsageUsed),
    dailyLimitReached: dailyUsageUsed >= dailyUsageLimit,
    timeZone,
  };
}
function owner(req, secret) {
  const token = String(req.get("authorization") || "").replace(
    /^Bearer\s+/i,
    "",
  );
  if (token) {
    try {
      const data = jwt.verify(token, secret);
      if (data.sub) return "user:" + data.sub;
    } catch {}
  }
  const deviceId = String(
    req.get("x-device-id") || req.query.deviceId || req.body?.deviceId || "",
  )
    .trim()
    .slice(0, 128);
  return deviceId ? "device:" + deviceId : "";
}
async function accountFor(accounts, ownerKey) {
  await accounts.updateOne(
    { ownerKey },
    {
      $setOnInsert: {
        ownerKey,
        verificationUserId: crypto.randomUUID(),
        dailyRewardedAds: 0,
        rewardPremiumUsesRemaining: 0,
        createdAt: new Date(),
      },
    },
    { upsert: true },
  );
  return accounts.findOne({ ownerKey });
}
async function recordReward(accounts, account, timeZone) {
  const now = new Date(),
    today = dayKey(now, timeZone);
  if (account.rewardModelVersion !== 4 || account.rewardDayKey !== today)
    await accounts.updateOne(
      { _id: account._id },
      {
        $set: {
          rewardModelVersion: 4,
          rewardDayKey: today,
          dailyRewardedAds: 0,
          rewardPremiumGrantedBlocksToday: 0,
          rewardPremiumUsesRemaining: 0,
          rewardContentUsesRemaining: 0,
          rewardPremiumDayKey: today,
          rewardPremiumUntil: null,
          rewardTimeZone: timeZone,
        },
      },
    );
  const raw = await accounts.findOneAndUpdate(
      { _id: account._id, rewardDayKey: today },
      {
        $inc: { dailyRewardedAds: 1 },
        $set: { lastRewardedAdAt: now, rewardTimeZone: timeZone },
      },
      { returnDocument: "after" },
    ),
    updated = raw?.value || raw;
  if (updated) {
    const earnedBlocks = Math.floor(
        Number(updated.dailyRewardedAds || 0) / REQUIRED,
      ),
      grantedBlocks = Math.max(
        0,
        Number(updated.rewardPremiumGrantedBlocksToday) || 0,
      );
    if (earnedBlocks > grantedBlocks) {
      const newBlocks = earnedBlocks - grantedBlocks;
      await accounts.updateOne(
        {
          _id: account._id,
          rewardDayKey: today,
          rewardPremiumGrantedBlocksToday: { $lt: earnedBlocks },
        },
        {
          $set: {
            rewardPremiumUntil: nextLocalMidnight(now, timeZone),
            rewardPremiumGrantedAt: now,
            rewardPremiumDayKey: today,
            rewardPremiumGrantedBlocksToday: earnedBlocks,
          },
          $inc: {
            rewardPremiumUsesRemaining: newBlocks * FREE_PREMIUM_USES,
            rewardContentUsesRemaining: newBlocks * FREE_CONTENT_USES,
          },
        },
      );
    }
  }
  return accounts.findOne({ _id: account._id });
}
function base64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(
    normalized + "=".repeat((4 - (normalized.length % 4)) % 4),
    "base64",
  );
}
async function verifyingKeys() {
  if (Date.now() < keyCache.expires && keyCache.keys.size) return keyCache.keys;
  const response = await fetch(KEY_URL);
  if (!response.ok) throw new Error("Unable to load AdMob verification keys.");
  const data = await response.json();
  const keys = new Map(
    (data.keys || []).map((item) => [String(item.keyId), item.pem]),
  );
  if (!keys.size) throw new Error("No AdMob verification keys are available.");
  keyCache = { expires: Date.now() + 23 * 60 * 60 * 1000, keys };
  return keys;
}
async function verifySsv(req) {
  const raw = String(req.originalUrl || "").split("?")[1] || "";
  const signatureAt = raw.indexOf("&signature=");
  const keyAt = raw.indexOf("&key_id=", signatureAt + 1);
  if (signatureAt < 0 || keyAt < 0) return false;
  const content = raw.slice(0, signatureAt);
  const signature = decodeURIComponent(raw.slice(signatureAt + 11, keyAt));
  const keyId = decodeURIComponent(raw.slice(keyAt + 8));
  const pem = (await verifyingKeys()).get(keyId);
  return Boolean(
    pem &&
    crypto.verify(
      "sha256",
      Buffer.from(content, "utf8"),
      pem,
      base64Url(signature),
    ),
  );
}

function createRewardsRouter(getAccounts, getEvents, jwtSecret) {
  const router = express.Router();
  router.get("/api/rewards/admob/progress", async (req, res) => {
    try {
      const ownerKey = owner(req, jwtSecret),
        timeZone = safeTimeZone(req.get("x-time-zone"));
      if (!ownerKey)
        return res
          .status(400)
          .json({ message: "Device identity is required." });
      const account = await accountFor(getAccounts(), ownerKey);
      res.json({
        data: {
          ...summary(account, timeZone),
          verificationUserId: account.verificationUserId,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Unable to load premium progress." });
    }
  });
  router.get("/api/rewards/admob/history", async (req, res) => {
    try {
      const ownerKey = owner(req, jwtSecret),
        timeZone = safeTimeZone(req.get("x-time-zone"));
      if (!ownerKey)
        return res
          .status(400)
          .json({ message: "Device identity is required." });
      const items = await getEvents()
        .find(
          { ownerKey, status: "verified" },
          {
            projection: {
              _id: 0,
              transactionId: 1,
              rewardAmount: 1,
              rewardType: 1,
              createdAt: 1,
            },
          },
        )
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();
      res.json({ data: items });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Unable to load reward history." });
    }
  });
  router.post("/api/rewards/admob/client-earned", async (req, res) => {
    try {
      const ownerKey = owner(req, jwtSecret),
        clientEventId = String(req.body?.clientEventId || "").slice(0, 100),
        timeZone = safeTimeZone(req.get("x-time-zone"));
      if (!ownerKey || !clientEventId)
        return res
          .status(400)
          .json({ message: "Reward details are incomplete." });
      const account = await accountFor(getAccounts(), ownerKey);
      const testMode =
        process.env.NODE_ENV !== "production" &&
        process.env.ADMOB_REWARD_TEST_MODE === "true" &&
        String(req.body?.testMode) === "true";
      const event = {
        ownerKey,
        provider: "google_admob",
        adType: "rewarded",
        transactionId: "client:" + clientEventId,
        adUnitId: String(req.body?.adUnitId || "").slice(0, 100),
        rewardAmount: Number(req.body?.rewardAmount) || 1,
        rewardType: String(req.body?.rewardType || "premium_progress").slice(
          0,
          80,
        ),
        status: testMode ? "verified" : "pending_ssv",
        source: testMode ? "development_test_ad" : "client_callback",
        createdAt: new Date(),
      };
      try {
        await getEvents().insertOne(event);
      } catch (error) {
        if (error?.code !== 11000) throw error;
        const current = await getAccounts().findOne({ _id: account._id });
        return res.json({
          data: {
            ...summary(current, timeZone),
            verificationUserId: account.verificationUserId,
            pendingVerification: !testMode,
          },
        });
      }
      const updated = testMode
        ? await recordReward(getAccounts(), account, timeZone)
        : account;
      res.json({
        data: {
          ...summary(updated, timeZone),
          verificationUserId: account.verificationUserId,
          pendingVerification: !testMode,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Unable to record rewarded ad." });
    }
  });
  router.post("/api/rewards/premium/consume", async (req, res) => {
    try {
      const ownerKey = owner(req, jwtSecret),
        timeZone = safeTimeZone(req.get("x-time-zone"));
      if (!ownerKey)
        return res
          .status(400)
          .json({ message: "Device identity is required." });
      const account = await accountFor(getAccounts(), ownerKey),
        state = summary(account, timeZone);
      if (!state.premiumUnlocked)
        return res
          .status(403)
          .json({ message: "Premium access is not active." });
      if (state.accessType === "rewarded") {
        const result = await getAccounts().updateOne(
          {
            _id: account._id,
            rewardPremiumUntil: { $gt: new Date() },
            rewardPremiumUsesRemaining: { $gt: 0 },
          },
          {
            $inc: { rewardPremiumUsesRemaining: -1 },
            $set: { lastPremiumUseAt: new Date() },
          },
        );
        if (!result.modifiedCount)
          return res.status(429).json({
            message: "Your free Premium usage limit has been reached.",
          });
      }
      const updated = await getAccounts().findOne({ _id: account._id });
      res.json({
        data: {
          ...summary(updated, timeZone),
          verificationUserId: account.verificationUserId,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Unable to use Premium right now." });
    }
  });
  router.post("/api/rewards/content/consume", async (req, res) => {
    try {
      const ownerKey = owner(req, jwtSecret),
        timeZone = safeTimeZone(req.get("x-time-zone"));
      if (!ownerKey)
        return res
          .status(400)
          .json({ message: "Device identity is required." });
      const account = await accountFor(getAccounts(), ownerKey),
        state = summary(account, timeZone);
      if (state.accessType === "paid")
        return res.json({
          data: { ...state, verificationUserId: account.verificationUserId },
        });
      const today = dayKey(new Date(), timeZone),
        result = await getAccounts().updateOne(
          {
            _id: account._id,
            rewardPremiumDayKey: today,
            rewardPremiumUntil: { $gt: new Date() },
            rewardContentUsesRemaining: { $gt: 0 },
          },
          {
            $inc: { rewardContentUsesRemaining: -1 },
            $set: {
              lastContentUseAt: new Date(),
              lastContentUseType: String(
                req.body?.type || "premium_content",
              ).slice(0, 60),
            },
          },
        );
      if (!result.modifiedCount)
        return res.status(429).json({
          message:
            "You need a Content credit. Watch 20 rewarded ads to earn 5 Content credits.",
        });
      const updated = await getAccounts().findOne({ _id: account._id });
      res.json({
        data: {
          ...summary(updated, timeZone),
          verificationUserId: account.verificationUserId,
        },
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Unable to use Content credit right now." });
    }
  });
  router.get("/api/rewards/admob/ssv", async (req, res) => {
    try {
      if (!(await verifySsv(req)))
        return res.status(401).send("Invalid signature");
      const verificationUserId = String(req.query.user_id || ""),
        transactionId = String(req.query.transaction_id || ""),
        account = await getAccounts().findOne({ verificationUserId });
      if (!account || !transactionId)
        return res.status(400).send("Invalid reward");
      const event = {
        ownerKey: account.ownerKey,
        provider: "google_admob",
        adType: "rewarded",
        transactionId,
        adUnitId: String(req.query.ad_unit || ""),
        rewardAmount: Number(req.query.reward_amount) || 1,
        rewardType: String(req.query.reward_item || "premium_progress"),
        status: "verified",
        source: "admob_ssv",
        createdAt: new Date(Number(req.query.timestamp) || Date.now()),
      };
      try {
        await getEvents().insertOne(event);
      } catch (error) {
        if (error?.code === 11000) return res.status(200).send("OK");
        throw error;
      }
      await recordReward(
        getAccounts(),
        account,
        safeTimeZone(account.rewardTimeZone),
      );
      res.status(200).send("OK");
    } catch (error) {
      console.error("AdMob SSV error", error);
      res.status(500).send("Verification failed");
    }
  });
  return router;
}

module.exports = { createRewardsRouter };
