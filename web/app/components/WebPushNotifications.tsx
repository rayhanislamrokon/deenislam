"use client";
import { useCallback, useEffect, useState } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:6002").replace(/\/$/, "");
const LAST_NOTICE = "deenislam_web_last_notification", DEVICE_ID = "deenislam_web_notification_device";

function deviceId() {
  const existing = localStorage.getItem(DEVICE_ID);
  if (existing) return existing;
  const value = `web:${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
  localStorage.setItem(DEVICE_ID, value);
  return value;
}
function applicationServerKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), character => character.charCodeAt(0));
}

export default function WebPushNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const register = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || Notification.permission !== "granted") return false;
    const keyResponse = await fetch(`${API}/api/notifications/web-public-key`, { cache: "no-store" });
    const keyBody = await keyResponse.json().catch(() => ({}));
    if (!keyResponse.ok || !keyBody.data?.publicKey) throw new Error("Web push is not configured on the server.");

    await navigator.serviceWorker.register("/deen-islam-push-sw.js", { scope: "/" });
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("Notification service could not start. Reload the page and try again.")), 10000)),
    ]);
    if (!registration.active) throw new Error("Notification service is still starting. Please try again.");
    const existing = await registration.pushManager.getSubscription();
    const subscription = existing || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey(keyBody.data.publicKey),
    });
    const response = await fetch(`${API}/api/notifications/web-register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: deviceId(), subscription: subscription.toJSON() }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || "Could not register browser notifications.");
    }
    return true;
  }, []);

  const check = useCallback(async (initial = false) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const response = await fetch(`${API}/api/notifications?deviceId=${encodeURIComponent(deviceId())}&refresh=${Date.now()}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.data?.length) return;
      const latest = result.data[0], previous = localStorage.getItem(LAST_NOTICE);
      if (!previous || initial) return void localStorage.setItem(LAST_NOTICE, latest.id);
      if (previous !== latest.id) {
        localStorage.setItem(LAST_NOTICE, latest.id);
        if (Notification.permission === "granted" && !("serviceWorker" in navigator)) {
          const notice = new Notification(latest.title, { body: latest.body, icon: "/deen-islam-app-icon.png", badge: "/deen-islam-app-icon.png", tag: latest.id, data: latest.data });
          notice.onclick = () => {
            window.focus();
            window.location.href = latest.data?.contentId || latest.data?.url || `/notification/${latest.id}`;
            notice.close();
          };
        }
      }
    } catch { /* Inbox polling must never break the page. */ }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setSupported(true);
    setPermission(Notification.permission);
    void check(true);
    if (Notification.permission === "granted") void register().catch(() => undefined);
    const timer = window.setInterval(() => void check(), 10000), focus = () => void check();
    window.addEventListener("focus", focus);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", focus); };
  }, [check, register]);

  async function enable() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const value = await Notification.requestPermission();
      setPermission(value);
      if (value !== "granted") return setError("Browser notification permission was not granted.");
      await register();
      await check(true);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Browser notifications could not be enabled.");
    } finally { setBusy(false); }
  }

  if (!supported || (permission !== "default" && !error)) return null;
  return <div className='webPushWrap'>
    {error && <span role='alert'>{error}</span>}
    <button className='webPushButton' disabled={busy} onClick={() => void enable()} aria-label='Enable Deen Islam notifications'><span>🔔</span><b>{busy ? "Enabling…" : "Enable notifications"}</b></button>
    <style jsx>{`.webPushWrap{position:fixed;right:20px;bottom:20px;z-index:1000;display:grid;justify-items:end;gap:8px}.webPushWrap>span{max-width:330px;padding:9px 12px;border:1px solid #efc9c5;border-radius:10px;background:#fff1ef;color:#983a31;font-size:11px;box-shadow:0 8px 25px #40120d18}.webPushButton{display:flex;align-items:center;gap:9px;padding:12px 17px;border:1px solid #d3b755;border-radius:999px;background:#076b43;color:#fff;box-shadow:0 10px 30px rgba(0,67,45,.25);cursor:pointer}.webPushButton:disabled{opacity:.65;cursor:wait}.webPushButton span{font-size:17px}.webPushButton b{font-size:12px}@media(max-width:700px){.webPushWrap{right:12px;bottom:12px}.webPushButton{padding:11px 14px}}`}</style>
  </div>;
}
