"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:6002").replace(/\/$/, "");
type Notice = { title: string; body: string; fullBody?: string; category: string; imageUrl?: string; createdAt: string };

export default function NotificationArticle({ params }: { params: Promise<{ id: string }> }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void params.then(({ id }) => {
      const key = "deenislam_web_notification_device";
      let deviceId = localStorage.getItem(key);
      if (!deviceId) {
        deviceId = `web:${crypto.randomUUID?.() || Date.now()}`;
        localStorage.setItem(key, deviceId);
      }
      fetch(`${API}/api/notifications/${encodeURIComponent(id)}?deviceId=${encodeURIComponent(deviceId)}`, { cache: "no-store" })
        .then(response => response.json().then(body => ({ response, body })))
        .then(({ response, body }) => {
          if (!response.ok) throw new Error(body.message || "Notification not found.");
          if (active) setNotice(body.data);
        })
        .catch(value => { if (active) setError(value instanceof Error ? value.message : "Unable to load notification."); });
    });
    return () => { active = false; };
  }, [params]);

  return <main className='noticePage'>
    <article>
      <Link href='/'>← Back to Deen Islam</Link>
      {error ? <div className='state'>{error}</div> : !notice ? <div className='state'>Loading notification…</div> : <>
        {notice.imageUrl && <img src={notice.imageUrl} alt='' />}
        <small>{notice.category.replace(/_/g, " ").toUpperCase()}</small>
        <h1>{notice.title}</h1>
        <time>{new Date(notice.createdAt).toLocaleString()}</time>
        <i />
        <p>{notice.fullBody || notice.body}</p>
      </>}
    </article>
    <style jsx>{`.noticePage{min-height:100vh;padding:36px 18px;background:linear-gradient(180deg,#edf6f0,#fffdf6);color:#173d2e}.noticePage article{max-width:820px;margin:auto;padding:28px;border:1px solid #d8e5dc;border-radius:24px;background:#fff;box-shadow:0 18px 55px #123b2912}.noticePage a{color:#087a4d;font-weight:800;text-decoration:none}.noticePage img{display:block;width:100%;max-height:390px;margin:24px 0;object-fit:cover;border-radius:20px;background:#edf4ef}.noticePage small{display:block;margin-top:24px;color:#aa7d1d;font-size:11px;font-weight:900;letter-spacing:1.4px}.noticePage h1{margin:9px 0;color:#123e2d;font:700 38px/1.2 Georgia,serif}.noticePage time{color:#819087;font-size:12px}.noticePage i{display:block;width:58px;height:3px;margin:22px 0;border-radius:2px;background:#d2af49}.noticePage p{margin:0;white-space:pre-wrap;color:#364a40;font-size:17px;line-height:1.8}.state{padding:90px 10px;text-align:center;color:#6f7e76}@media(max-width:600px){.noticePage{padding:14px}.noticePage article{padding:20px}.noticePage h1{font-size:29px}.noticePage p{font-size:15px}}`}</style>
  </main>;
}
