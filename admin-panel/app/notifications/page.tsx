"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { deleteManagedImage, uploadImageToS3 } from "../lib/imageUpload";
const API = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  ).replace(/\/$/, ""),
  DEFAULT_IMAGE = "/deen-islam-app-icon.png";
const headers = () => ({
  "Content-Type": "application/json",
  Authorization:
    "Bearer " +
    (typeof window === "undefined"
      ? ""
      : sessionStorage.getItem("deenislam_admin_token") || ""),
});
type Notice = {
  id: string;
  title: string;
  body: string;
  category: string;
  imageUrl?: string;
  createdAt: string;
  sentCount: number;
  failedCount: number;
  createdBy: string;
};
const blank = () => ({
  title: "",
  body: "",
  fullBody: "",
  category: "general",
  screen: "notifications",
  contentId: "",
  surahNumber: "",
  ayahNumber: "",
  imageUrl: "",
  imageKey: "",
});
const CATEGORY_OPTIONS = [
  { value: "general", label: "General", screen: "notifications" },
  { value: "quran", label: "Quran", screen: "quran" },
  { value: "hadith", label: "Hadith", screen: "hadith" },
  { value: "tafsir", label: "Tafsir", screen: "tafsir" },
  { value: "prayer", label: "Prayer Times", screen: "prayer" },
  { value: "dua", label: "Dua & Amol", screen: "duas-hub" },
  { value: "daily_prayer", label: "Daily Prayer", screen: "daily-prayer" },
  { value: "books", label: "Islamic Books", screen: "books" },
  {
    value: "islamic_history",
    label: "Islamic History",
    screen: "islamic-history",
  },
  { value: "prophets", label: "Prophets", screen: "prophets" },
  { value: "sahaba", label: "Sahaba", screen: "sahaba" },
  { value: "aqidah", label: "Aqidah & Lifestyle", screen: "aqidah" },
  { value: "qibla", label: "Qibla Direction", screen: "qibla" },
  { value: "mosques", label: "Nearby Mosques", screen: "nearby-mosques" },
  { value: "zakat", label: "Zakat", screen: "zakat" },
  { value: "tasbih", label: "Tasbih", screen: "tasbih" },
  { value: "ai", label: "Islamic AI", screen: "ai-chat" },
  { value: "event", label: "Islamic Event", screen: "home" },
  { value: "help", label: "Help Center", screen: "help-center" },
  { value: "contact", label: "Contact", screen: "contact" },
] as const;
export default function NotificationsAdmin() {
  const [form, setForm] = useState(blank()),
    [items, setItems] = useState<Notice[]>([]),
    [devices, setDevices] = useState(0),
    [loading, setLoading] = useState(true),
    [sending, setSending] = useState(false),
    [uploading, setUploading] = useState(false),
    [message, setMessage] = useState("");
  async function load() {
    setLoading(true);
    try {
      const response = await fetch(
          API + "/api/admin/notifications?refresh=" + Date.now(),
          { headers: headers(), cache: "no-store" },
        ),
        body = await response.json();
      if (!response.ok) throw Error(body.message);
      setItems(body.data.items || []);
      setDevices(body.data.activeDevices || 0);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const updateCategory = (category: string) => {
    setForm((current) => ({
      ...current,
      category,
      screen: "notifications",
      surahNumber: "",
      ayahNumber: "",
    }));
  };
  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setMessage("Preparing notification image...");
    try {
      const body = await uploadImageToS3(API, sessionStorage.getItem("deenislam_admin_token") || "", file);
      setForm((current) => ({
        ...current,
        imageUrl: body.publicUrl,
        imageKey: body.key,
      }));
      setMessage("Notification image uploaded successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Image upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }
  async function send(event: FormEvent) {
    event.preventDefault();
    if (
      !confirm(
        devices
          ? `Send this notification to ${devices} active device(s)?`
          : "Publish this notification to the inbox? No push-enabled device is registered.",
      )
    )
      return;
    setSending(true);
    setMessage("");
    try {
      const response = await fetch(API + "/api/admin/notifications", {
          method: "POST",
          headers: headers(),
          body: JSON.stringify(form),
        }),
        body = await response.json();
      if (!response.ok) throw Error(body.message);
      setMessage(body.message);
      setForm(blank());
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to send notification.",
      );
    } finally {
      setSending(false);
    }
  }
  async function remove(item: Notice) {
    if (
      !confirm(
        `Delete "${item.title}"? It will also disappear from the app and web notification inbox.`,
      )
    )
      return;
    setMessage("");
    try {
      const response = await fetch(
          API + "/api/admin/notifications/" + item.id,
          { method: "DELETE", headers: headers() },
        ),
        body = await response.json();
      if (!response.ok) throw Error(body.message);
      setItems((current) => current.filter((row) => row.id !== item.id));
      setMessage(body.message);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete notification.",
      );
    }
  }
  const previewImage = form.imageUrl || DEFAULT_IMAGE;
  return (
    <main>
      <header>
        <div>
          <Link href="/">‹ Back to Dashboard</Link>
          <small>COMMUNICATION CENTER</small>
          <h1>Push Notifications</h1>
          <p>Create rich notifications for the Deen Islam app and website.</p>
        </div>
        <div className="deviceCount">
          <b>{devices}</b>
          <span>ACTIVE DEVICES</span>
          <i>Mobile + Web</i>
        </div>
      </header>
      {message && <div className="message">{message}</div>}
      <section className="grid">
        <form onSubmit={send} className="composer">
          <div className="head">
            <div>
              <small>NEW BROADCAST</small>
              <h2>Create notification</h2>
              <p>Compose, preview and publish in one place.</p>
            </div>
            <button disabled={sending || uploading}>
              {sending
                ? "Sending..."
                : devices
                  ? "Send notification"
                  : "Publish in app"}
            </button>
          </div>
          <div className="fields">
            <label>
              Notification title
              <input
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                maxLength={100}
                required
                placeholder="Enter a clear notification title"
              />
            </label>
            <label>
              Message
              <textarea
                value={form.body}
                onChange={(event) =>
                  setForm({ ...form, body: event.target.value })
                }
                maxLength={500}
                required
                placeholder="Write the message users will receive..."
              />
              <small>{form.body.length}/500 characters</small>
            </label>
            <label>
              Full content <em className="optional">Optional</em>
              <textarea
                className="fullContent"
                value={form.fullBody}
                onChange={(event) =>
                  setForm({ ...form, fullBody: event.target.value })
                }
                maxLength={30000}
                placeholder="Write the complete article, announcement or details users will read after tapping the notification..."
              />
              <small>
                {form.fullBody.length}/30,000 characters · If empty, the short
                message will be shown.
              </small>
            </label>
            <label className="categoryField">
              Category
              <select
                value={form.category}
                onChange={(event) => updateCategory(event.target.value)}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="target">
              <div>
                <b>Click destination</b>
                <small>
                  Choose the exact content users should see after tapping.
                </small>
              </div>
              <label>
                Website link / destination URL
                <input
                  value={form.contentId}
                  onChange={(event) =>
                    setForm({ ...form, contentId: event.target.value })
                  }
                  type="url"
                  placeholder="https://www.deenislam.app/quran?surah=2&ayah=255"
                />
              </label>
            </div>
            <label className="upload">
              <span>
                Notification image <em>Optional</em>
              </span>
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(event) => {
                  void upload(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
              <small>
                {uploading
                  ? "Converting and uploading..."
                  : form.imageUrl
                    ? "Custom image ready. Recommended ratio 2:1."
                    : "JPG, PNG or WebP. Deen Islam logo is used when empty."}
              </small>
              {form.imageUrl && (
                <div className="uploaded">
                  <img src={form.imageUrl} alt="Uploaded notification" />
                  <div>
                    <b>Custom image selected</b>
                    <button
                      type="button"
                      onClick={() => void deleteManagedImage(API, sessionStorage.getItem("deenislam_admin_token") || "", { key: form.imageKey, url: form.imageUrl }).then(() => setForm({ ...form, imageUrl: "", imageKey: "" })).catch((error) => setMessage(error.message))}
                    >
                      Use app logo instead
                    </button>
                  </div>
                </div>
              )}
            </label>
          </div>
          <div className="previewLabel">
            <small>LIVE PREVIEW</small>
            <span>{form.imageUrl ? "Custom image" : "Default app logo"}</span>
          </div>
          <div className="preview">
            <img src={previewImage} alt="Notification preview" />
            <div>
              <small>DEEN ISLAM · NOW</small>
              <h3>{form.title || "Your notification title"}</h3>
              <p>
                {form.body ||
                  "Your message will appear here exactly as users receive it."}
              </p>
            </div>
          </div>
        </form>
        <section className="history">
          <div className="head">
            <div>
              <small>DELIVERY HISTORY</small>
              <h2>Recent notifications</h2>
              <p>Latest broadcasts and delivery results.</p>
            </div>
            <button
              className="reload"
              onClick={() => void load()}
              disabled={loading}
            >
              {loading ? "Loading..." : "Reload"}
            </button>
          </div>
          <div className="historyList">
            {items.map((item) => (
              <article key={item.id}>
                <img src={item.imageUrl || DEFAULT_IMAGE} alt="" />
                <div>
                  <b>{item.title}</b>
                  <p>{item.body}</p>
                  <small>
                    {new Date(item.createdAt).toLocaleString()} ·{" "}
                    {item.createdBy || "Admin"}
                  </small>
                </div>
                <aside>
                  <strong>{item.sentCount}</strong>
                  <span>sent</span>
                  {item.failedCount ? (
                    <em>{item.failedCount} failed</em>
                  ) : (
                    <i>Delivered</i>
                  )}
                  <button
                    type="button"
                    className="deleteNotice"
                    onClick={() => void remove(item)}
                  >
                    Delete
                  </button>
                </aside>
              </article>
            ))}
            {!loading && !items.length ? (
              <p className="empty">No notifications sent yet.</p>
            ) : null}
          </div>
        </section>
      </section>
      <style jsx>{`
        * {
          box-sizing: border-box;
        }
        main {
          min-height: 100vh;
          padding: 28px;
          background: linear-gradient(180deg, #f1f8f3, #f8fbf9);
          color: #173d2e;
          font-family: Arial;
        }
        header,
        .message,
        .grid {
          max-width: 1450px;
          margin: auto;
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 25px;
          padding: 30px 36px;
          border-radius: 24px;
          background: linear-gradient(125deg, #034b34, #078454);
          color: #fff;
          box-shadow: 0 18px 45px #07583b20;
        }
        header a {
          color: #dcefe3;
          text-decoration: none;
          font-weight: 700;
        }
        header small,
        .head small,
        .previewLabel small {
          display: block;
          color: #f0ca5f;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.3px;
        }
        header h1 {
          margin: 9px 0 7px;
          font-size: 34px;
        }
        header p {
          margin: 0;
          color: #dcebe2;
        }
        .deviceCount {
          min-width: 150px;
          padding: 16px;
          text-align: center;
          border: 1px solid #ffffff35;
          border-radius: 18px;
          background: #ffffff12;
        }
        .deviceCount b,
        .deviceCount span,
        .deviceCount i {
          display: block;
        }
        .deviceCount b {
          font-size: 38px;
        }
        .deviceCount span {
          font-size: 9px;
          font-weight: 900;
        }
        .deviceCount i {
          margin-top: 5px;
          color: #cde6d7;
          font-size: 10px;
          font-style: normal;
        }
        .message {
          margin-top: 15px;
          padding: 14px 17px;
          border: 1px solid #bfe0c9;
          border-radius: 13px;
          background: #e2f5e7;
          color: #176043;
        }
        .grid {
          display: grid;
          grid-template-columns: minmax(440px, 0.9fr) minmax(520px, 1.1fr);
          gap: 20px;
          margin-top: 20px;
        }
        .composer,
        .history {
          padding: 25px;
          border: 1px solid #d4e5d9;
          border-radius: 21px;
          background: #fff;
          box-shadow: 0 14px 38px #153d2c0b;
        }
        .head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }
        .head h2 {
          margin: 5px 0;
          font-size: 23px;
        }
        .head p {
          margin: 0;
          color: #7b8981;
          font-size: 11px;
        }
        .head button {
          padding: 12px 18px;
          border: 0;
          border-radius: 11px;
          background: #087a4d;
          color: #fff;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 7px 17px #087a4d25;
        }
        .head button:disabled {
          opacity: 0.5;
        }
        .head .reload {
          background: #e9f5ed;
          color: #176043;
          box-shadow: none;
        }
        .fields {
          display: grid;
          gap: 2px;
          margin-top: 18px;
        }
        label {
          display: block;
          margin-top: 13px;
          color: #314e40;
          font-size: 11px;
          font-weight: 900;
        }
        input,
        textarea,
        select {
          width: 100%;
          margin-top: 7px;
          padding: 13px;
          border: 1px solid #c9ddd0;
          border-radius: 11px;
          background: #fbfdfb;
          color: #173d2e;
          font: 14px Arial;
          outline: none;
        }
        input:focus,
        textarea:focus,
        select:focus {
          border-color: #258c5d;
          box-shadow: 0 0 0 3px #16825312;
        }
        textarea {
          min-height: 125px;
          resize: vertical;
        }
        label > small {
          display: block;
          margin-top: 6px;
          color: #849188;
          font-weight: 500;
        }
        .two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .target {
          margin-top: 13px;
          padding: 15px;
          border: 1px solid #d8e8de;
          border-radius: 14px;
          background: #f8fbf9;
        }
        .target > div:first-child b,
        .target > div:first-child small {
          display: block;
        }
        .target > div:first-child small {
          margin-top: 4px;
          color: #7d8c83;
          font-size: 10px;
        }
        .upload {
          padding: 15px;
          border: 1px dashed #8dc3a0;
          border-radius: 14px;
          background: #f3faf5;
        }
        .upload > span {
          display: block;
        }
        .upload em {
          margin-left: 6px;
          color: #839087;
          font-style: normal;
          font-weight: 500;
        }
        .upload input {
          padding: 10px;
          background: #fff;
        }
        .uploaded {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 12px;
        }
        .uploaded img {
          width: 72px;
          height: 72px;
          object-fit: cover;
          border-radius: 15px;
          border: 1px solid #d7e5da;
        }
        .uploaded b {
          display: block;
        }
        .uploaded button {
          margin-top: 7px;
          padding: 7px 10px;
          border: 0;
          border-radius: 8px;
          background: #fff0ed;
          color: #ad4335;
          font-size: 10px;
          font-weight: 800;
        }
        .previewLabel {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 22px 2px 8px;
        }
        .previewLabel span {
          color: #7c8b82;
          font-size: 10px;
        }
        .preview {
          min-height: 122px;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px;
          border-radius: 19px;
          background: linear-gradient(135deg, #075c3e, #088b59);
          color: #fff;
          box-shadow: 0 12px 26px #075b3b26;
        }
        .preview > img {
          width: 82px;
          height: 82px;
          flex: none;
          object-fit: cover;
          border: 2px solid #e2c45e;
          border-radius: 19px;
          background: #fff;
        }
        .preview small {
          color: #f0d06f;
          font-size: 9px;
          font-weight: 900;
        }
        .preview h3 {
          margin: 8px 0 5px;
          font-family: Georgia;
          font-size: 18px;
        }
        .preview p {
          margin: 0;
          color: #dcebe2;
          font-size: 12px;
          line-height: 1.5;
        }
        .historyList {
          margin-top: 15px;
        }
        .history article {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 15px 0;
          border-bottom: 1px solid #e5eee8;
        }
        .history article > img {
          width: 54px;
          height: 54px;
          flex: none;
          object-fit: cover;
          border-radius: 13px;
          background: #edf5ef;
        }
        .history article > div {
          min-width: 0;
          flex: 1;
        }
        .history article b {
          font-family: Georgia;
          font-size: 15px;
        }
        .history article p {
          margin: 5px 0;
          color: #53645b;
          font-size: 12px;
          line-height: 1.4;
        }
        .history article small {
          color: #89948d;
          font-size: 9px;
        }
        .history article > aside {
          position: static;
          top: auto;
          width: auto;
          height: auto;
          min-width: 70px;
          padding: 0;
          border: 0;
          background: transparent;
          display: block;
          flex: none;
          text-align: center;
        }
        .history strong,
        .history aside span {
          display: block;
        }
        .history strong {
          font-size: 24px;
          color: #087a4d;
        }
        .history aside span {
          font-size: 9px;
          text-transform: uppercase;
        }
        .history em,
        .history aside i {
          display: block;
          margin-top: 5px;
          font-size: 9px;
          font-style: normal;
        }
        .history em {
          color: #b42318;
        }
        .history aside i {
          color: #188355;
        }
        .history .deleteNotice {
          height: auto;
          margin-top: 8px;
          padding: 6px 9px;
          border: 1px solid #f0cbc6;
          border-radius: 8px;
          background: #fff1ef;
          color: #ad382f;
          font-size: 9px;
          font-weight: 900;
          box-shadow: none;
        }
        .history .deleteNotice:hover {
          background: #ad382f;
          color: #fff;
        }
        .empty {
          text-align: center;
          color: #87928c;
          padding: 60px;
        }
        @media (max-width: 1000px) {
          .grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 600px) {
          main {
            padding: 14px;
          }
          header {
            padding: 23px;
            align-items: flex-start;
          }
          .deviceCount {
            min-width: 95px;
          }
          .two {
            grid-template-columns: 1fr;
          }
          .head {
            flex-wrap: wrap;
          }
          .preview > img {
            width: 65px;
            height: 65px;
          }
        }
      `}</style>
    </main>
  );
}
