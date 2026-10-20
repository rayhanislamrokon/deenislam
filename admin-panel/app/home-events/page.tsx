"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { deleteManagedImage, uploadImageToS3 } from "../lib/imageUpload";

const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:6002"
).replace(/\/$/, "");
const empty = {
  id: "",
  label: "Upcoming Islamic Event",
  title: "",
  eventDate: "",
  imageUrl: "",
  imageKey: "",
  link: "",
  order: 0,
  published: true,
};
type EventCard = typeof empty;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization:
    "Bearer " +
    (typeof window === "undefined"
      ? ""
      : sessionStorage.getItem("deenislam_admin_token") || ""),
});

export default function HomeEventsAdmin() {
  const [items, setItems] = useState<EventCard[]>([]);
  const [form, setForm] = useState<EventCard>(empty);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(
        API + "/api/admin/home-events?refresh=" + Date.now(),
        { headers: authHeaders(), cache: "no-store" },
      );
      const body = await response.json();
      if (!response.ok) throw Error(body.message);
      setItems(body.data || []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load event cards.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setMessage("Uploading event image...");
    try {
      const body = await uploadImageToS3(API, sessionStorage.getItem("deenislam_admin_token") || "", file);
      setForm((current) => ({
        ...current,
        imageUrl: body.publicUrl,
        imageKey: body.key,
      }));
      setMessage("Image uploaded. Save the card to publish it.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Image upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(
        API + "/api/admin/home-events" + (form.id ? "/" + form.id : ""),
        {
          method: form.id ? "PUT" : "POST",
          headers: authHeaders(),
          body: JSON.stringify(form),
        },
      );
      const body = await response.json();
      if (!response.ok) throw Error(body.message);
      setMessage(body.message);
      setForm(empty);
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save event card.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: EventCard) {
    if (!confirm("Remove " + item.title + " from the home slider?")) return;
    try {
      const response = await fetch(API + "/api/admin/home-events/" + item.id, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const body = await response.json();
      if (!response.ok) throw Error(body.message);
      setMessage(body.message);
      if (form.id === item.id) setForm(empty);
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to remove event card.",
      );
    }
  }

  const previewDays = useMemo(
    () =>
      form.eventDate
        ? Math.max(
            0,
            Math.ceil(
              (new Date(form.eventDate + "T23:59:59").getTime() - Date.now()) /
                86400000,
            ),
          )
        : 0,
    [form.eventDate],
  );

  return (
    <main>
      <header>
        <div>
          <Link href="/">‹ Back to Dashboard</Link>
          <small>HOME CONTENT</small>
          <h1>Upcoming Event Slider</h1>
          <p>
            Add multiple image cards for the website home page. Published cards
            slide automatically.
          </p>
        </div>
        <b>
          {items.filter((item) => item.published).length}
          <span>PUBLISHED CARDS</span>
        </b>
      </header>
      {message && <div className="message">{message}</div>}
      <section className="layout">
        <form className="panel editor" onSubmit={save}>
          <div className="head">
            <div>
              <small>{form.id ? "EDIT EVENT CARD" : "NEW EVENT CARD"}</small>
              <h2>{form.id ? "Update card" : "Create a card"}</h2>
            </div>
            <button disabled={saving || uploading}>
              {saving ? "Saving..." : form.id ? "Update Card" : "Add Card"}
            </button>
          </div>
          <div className="fields">
            <label>
              Small label
              <input
                value={form.label}
                onChange={(event) =>
                  setForm({ ...form, label: event.target.value })
                }
                maxLength={60}
              />
            </label>
            <label>
              Event title
              <input
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                maxLength={120}
                required
              />
            </label>
            <label>
              Event date
              <input
                type="date"
                value={form.eventDate}
                onChange={(event) =>
                  setForm({ ...form, eventDate: event.target.value })
                }
                required
              />
            </label>
            <label>
              Display order
              <input
                type="number"
                min="0"
                max="999"
                value={form.order}
                onChange={(event) =>
                  setForm({ ...form, order: Number(event.target.value) })
                }
              />
            </label>
            <label className="wide">
              Open link (optional)
              <input
                value={form.link}
                onChange={(event) =>
                  setForm({ ...form, link: event.target.value })
                }
                placeholder="/islamic-calendar or https://..."
              />
            </label>
            <label className="wide upload">
              Event image
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
                  : "Recommended wide image: 900 × 360px. JPG, PNG or WebP."}
              </small>
              {form.imageUrl && (
                <span>
                  <img src={form.imageUrl} alt="Event card preview" />
                  <button
                    type="button"
                    onClick={() => void deleteManagedImage(API, sessionStorage.getItem("deenislam_admin_token") || "", { key: form.imageKey, url: form.imageUrl }).then(() => setForm({ ...form, imageUrl: "", imageKey: "" })).catch((error) => setMessage(error.message))}
                  >
                    Remove image
                  </button>
                </span>
              )}
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) =>
                  setForm({ ...form, published: event.target.checked })
                }
              />{" "}
              Publish on website
            </label>
          </div>
          <div
            className="preview"
            style={
              form.imageUrl
                ? {
                    backgroundImage: `linear-gradient(90deg,rgba(255,252,245,.98),rgba(255,252,245,.35)),url(${form.imageUrl})`,
                  }
                : undefined
            }
          >
            <small>{form.label}</small>
            <strong>{form.title || "Event title"}</strong>
            <span>{form.eventDate || "Event date"}</span>
            <b>{previewDays} Days Left</b>
          </div>
          {form.id && (
            <button
              type="button"
              className="cancel"
              onClick={() => setForm(empty)}
            >
              Cancel editing
            </button>
          )}
        </form>
        <section className="panel library">
          <div className="head">
            <div>
              <small>SLIDER CARDS</small>
              <h2>Saved events</h2>
            </div>
            <button
              className="reload"
              onClick={() => void load()}
              disabled={loading}
            >
              {loading ? "Loading..." : "Reload"}
            </button>
          </div>
          {items.map((item) => (
            <article key={item.id}>
              <div className="thumb">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" />
                ) : (
                  <span>EVENT</span>
                )}
              </div>
              <div>
                <b>{item.title}</b>
                <p>
                  {item.eventDate} · Order {item.order}
                </p>
                <small>{item.published ? "Published" : "Draft"}</small>
              </div>
              <nav>
                <button
                  onClick={() => {
                    setForm(item);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  Edit
                </button>
                <button className="delete" onClick={() => void remove(item)}>
                  Remove
                </button>
              </nav>
            </article>
          ))}
          {!loading && !items.length && (
            <p className="empty">No event cards yet. Create the first card.</p>
          )}
        </section>
      </section>
      <style jsx>{`
        * {
          box-sizing: border-box;
        }
        main {
          min-height: 100vh;
          padding: 28px;
          background: #f3f8f4;
          color: #173d2e;
          font-family: Arial;
        }
        header,
        .message,
        .layout {
          max-width: 1450px;
          margin-left: auto;
          margin-right: auto;
        }
        header {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          padding: 28px 34px;
          border-radius: 22px;
          background: linear-gradient(135deg, #064b32, #088154);
          color: #fff;
        }
        header a {
          color: #dcefe3;
          text-decoration: none;
        }
        header small,
        .head small {
          display: block;
          color: #e7c95f;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }
        header h1 {
          margin: 7px 0;
        }
        header p {
          margin: 0;
          color: #dcebe2;
        }
        header > b {
          font-size: 34px;
          text-align: center;
        }
        header > b span {
          display: block;
          font-size: 8px;
        }
        .message {
          margin-top: 14px;
          padding: 13px 16px;
          border-radius: 12px;
          background: #dff3e6;
        }
        .layout {
          display: grid;
          grid-template-columns: minmax(420px, 1fr) minmax(380px, 0.8fr);
          gap: 18px;
          margin-top: 18px;
        }
        .panel {
          padding: 22px;
          border: 1px solid #d7e6db;
          border-radius: 18px;
          background: #fff;
        }
        .head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .head h2 {
          margin: 5px 0;
        }
        .head button,
        .library button {
          padding: 10px 15px;
          border: 0;
          border-radius: 9px;
          background: #087a4d;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
        }
        .fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 13px;
          margin-top: 18px;
        }
        .wide {
          grid-column: 1/-1;
        }
        label {
          font-size: 11px;
          font-weight: 800;
        }
        input {
          width: 100%;
          margin-top: 7px;
          padding: 11px;
          border: 1px solid #cbded1;
          border-radius: 9px;
          background: #fff;
        }
        .upload {
          padding: 14px;
          border: 1px dashed #8fc5a2;
          border-radius: 13px;
          background: #f1f9f3;
        }
        .upload small {
          display: block;
          margin-top: 7px;
          color: #718078;
        }
        .upload span {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 12px;
        }
        .upload img {
          width: 150px;
          height: 70px;
          object-fit: cover;
          border-radius: 9px;
        }
        .upload button,
        .cancel {
          padding: 8px 12px;
          border: 0;
          border-radius: 8px;
          background: #fff0ed;
          color: #a33e35;
        }
        .check {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .check input {
          width: auto;
          margin: 0;
        }
        .preview {
          position: relative;
          min-height: 150px;
          margin-top: 18px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 7px;
          overflow: hidden;
          border: 1px solid #e8ddc5;
          border-radius: 16px;
          background: linear-gradient(90deg, #fffaf0, #eaf5ed);
          background-size: cover;
          background-position: center right;
        }
        .preview small {
          font-weight: 800;
        }
        .preview strong {
          font: 700 24px Georgia;
        }
        .preview span {
          font-size: 12px;
        }
        .preview b {
          position: absolute;
          top: 13px;
          right: 13px;
          padding: 7px 10px;
          border-radius: 10px;
          background: #087a4d;
          color: #fff;
          font-size: 10px;
        }
        .cancel {
          margin-top: 13px;
        }
        .library .reload {
          background: #edf6ef;
          color: #176043;
        }
        .library article {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #e6eee8;
        }
        .thumb {
          width: 100px;
          height: 58px;
          display: grid;
          place-items: center;
          flex: none;
          overflow: hidden;
          border-radius: 9px;
          background: #eaf5ed;
          color: #087a4d;
          font-size: 9px;
          font-weight: 900;
        }
        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .library article > div:nth-child(2) {
          min-width: 0;
          flex: 1;
        }
        .library article b,
        .library article small {
          display: block;
        }
        .library article p {
          margin: 5px 0;
          color: #718078;
          font-size: 11px;
        }
        .library article small {
          color: #087a4d;
        }
        .library nav {
          display: flex;
          gap: 6px;
        }
        .library .delete {
          background: #fff0ed;
          color: #a33e35;
        }
        .empty {
          padding: 50px 10px;
          text-align: center;
          color: #7b8981;
        }
        @media (max-width: 950px) {
          .layout {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 620px) {
          main {
            padding: 14px;
          }
          header {
            padding: 22px 20px;
          }
          header > b {
            display: none;
          }
          .fields {
            grid-template-columns: 1fr;
          }
          .wide {
            grid-column: auto;
          }
          .head {
            align-items: stretch;
            flex-direction: column;
          }
          .head > button {
            width: 100%;
          }
          .library article {
            align-items: flex-start;
            flex-wrap: wrap;
          }
          .library nav {
            width: 100%;
            justify-content: flex-end;
          }
          .preview {
            min-height: 130px;
          }
        }
      `}</style>
    </main>
  );
}
