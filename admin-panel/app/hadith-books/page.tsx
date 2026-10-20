"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { deleteManagedImage, uploadImageToS3 } from "../lib/imageUpload";

const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");
const empty = {
  id: "",
  collectionId: "",
  collectionName: "",
  arabicTitle: "",
  author: "",
  coverImageUrl: "",
  hadithCount: 0,
  category: "Major",
  languages: "English",
  mark: "",
  published: true,
};
const builtInBooks = [
  {
    id: "",
    collectionId: "b",
    collectionName: "Sahih al-Bukhari",
    arabicTitle: "صحيح البخاري",
    author: "Imam Muhammad al-Bukhari",
    coverImageUrl: "/hadith-covers/sahih-bukhari-cover.png",
    hadithCount: 7580,
    category: "Major",
    languages: "English, Arabic, Bengali",
    mark: "بخ",
    published: true,
  },
  {
    id: "",
    collectionId: "m",
    collectionName: "Sahih Muslim",
    arabicTitle: "صحيح مسلم",
    author: "Imam Muslim ibn al-Hajjaj",
    coverImageUrl: "/hadith-covers/sahih-muslim-cover.png",
    hadithCount: 7459,
    category: "Major",
    languages: "English, Arabic",
    mark: "مس",
    published: true,
  },
  {
    id: "",
    collectionId: "a",
    collectionName: "Sunan Abu Dawood",
    arabicTitle: "سنن أبي داود",
    author: "Imam Abu Dawood",
    coverImageUrl: "/hadith-covers/sunan-abu-dawood-cover.png",
    hadithCount: 5272,
    category: "Major",
    languages: "English, Arabic",
    mark: "د",
    published: true,
  },
  {
    id: "",
    collectionId: "t",
    collectionName: "Jami' at-Tirmidhi",
    arabicTitle: "جامع الترمذي",
    author: "Imam Muhammad at-Tirmidhi",
    coverImageUrl: "/hadith-covers/jami-at-tirmidhi-cover.png",
    hadithCount: 3924,
    category: "Major",
    languages: "English, Arabic",
    mark: "تر",
    published: true,
  },
  {
    id: "",
    collectionId: "s",
    collectionName: "Sunan an-Nasa'i",
    arabicTitle: "سنن النسائي",
    author: "Imam Ahmad an-Nasa'i",
    coverImageUrl: "/hadith-covers/sunan-an-nasai-cover.png",
    hadithCount: 5679,
    category: "Major",
    languages: "English, Arabic",
    mark: "نس",
    published: true,
  },
  {
    id: "",
    collectionId: "i",
    collectionName: "Sunan Ibn Majah",
    arabicTitle: "سنن ابن ماجه",
    author: "Imam Ibn Majah",
    coverImageUrl: "/hadith-covers/sunan-ibn-majah-cover.png",
    hadithCount: 4338,
    category: "Major",
    languages: "English, Arabic",
    mark: "مج",
    published: true,
  },
  {
    id: "",
    collectionId: "malik",
    collectionName: "Muwatta Malik",
    arabicTitle: "موطأ مالك",
    author: "Imam Malik ibn Anas",
    coverImageUrl: "/hadith-covers/muwatta-malik-cover.png",
    hadithCount: 1818,
    category: "Classical",
    languages: "English, Arabic",
    mark: "مو",
    published: true,
  },
  {
    id: "",
    collectionId: "q",
    collectionName: "Forty Hadith Qudsi",
    arabicTitle: "الأحاديث القدسية",
    author: "Prophetic narrations from Allah",
    coverImageUrl: "/hadith-covers/forty-hadith-qudsi-cover.png",
    hadithCount: 40,
    category: "Classical",
    languages: "English, Arabic",
    mark: "قد",
    published: true,
  },
  {
    id: "",
    collectionId: "n",
    collectionName: "Forty Hadith Nawawi",
    arabicTitle: "الأربعون النووية",
    author: "Imam Yahya ibn Sharaf an-Nawawi",
    coverImageUrl: "/hadith-covers/forty-hadith-nawawi-cover.png",
    hadithCount: 42,
    category: "Classical",
    languages: "English, Arabic",
    mark: "نو",
    published: true,
  },
];

export default function HadithBooksPage() {
  const [token, setToken] = useState(""),
    [items, setItems] = useState<any[]>(builtInBooks),
    [form, setForm] = useState<any>(empty),
    [saving, setSaving] = useState(false),
    [uploading, setUploading] = useState(false),
    [message, setMessage] = useState("");
  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  });
  const load = async (current = token) => {
    if (!current) return setItems(builtInBooks);
    try {
      const response = await fetch(API + "/api/admin/hadith/collections", {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + current,
          },
        }),
        body = await response.json();
      if (!response.ok)
        throw Error(body.message || "Unable to load saved books.");
      const saved = Array.isArray(body.data) ? body.data : [],
        savedByCollection = new Map(
          saved.map((item: any) => [item.collectionId, item]),
        );
      setItems([
        ...builtInBooks.map((item) => {
          const stored: any = savedByCollection.get(item.collectionId);
          return stored
            ? {
                ...item,
                ...stored,
                coverImageUrl: stored.coverImageUrl || item.coverImageUrl,
              }
            : item;
        }),
        ...saved.filter(
          (item: any) =>
            !builtInBooks.some(
              (book) => book.collectionId === item.collectionId,
            ),
        ),
      ]);
    } catch (error) {
      setItems(builtInBooks);
      setMessage(
        error instanceof Error ? error.message : "Showing built-in app books.",
      );
    }
  };
  useEffect(() => {
    const saved = sessionStorage.getItem("deenislam_admin_token") || "";
    setToken(saved);
    void load(saved);
  }, []);
  const uploadCover = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const payload = await uploadImageToS3(API, token, file);
      setForm((value: any) => ({
        ...value,
        coverImageUrl: payload.publicUrl,
        coverImageKey: payload.key,
      }));
      setMessage("Cover converted to WebP and uploaded successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Cover upload failed.",
      );
    } finally {
      setUploading(false);
    }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(
          API +
            "/api/admin/hadith/collections" +
            (form.id ? "/" + form.id : ""),
          {
            method: form.id ? "PUT" : "POST",
            headers: headers(),
            body: JSON.stringify(form),
          },
        ),
        payload = await response.json();
      if (!response.ok) throw Error(payload.message);
      setMessage(form.id ? "Hadith book updated." : "Hadith book created.");
      setForm(empty);
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save book.",
      );
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!form.id || !confirm("Delete this empty collection card?")) return;
    const response = await fetch(
        API + "/api/admin/hadith/collections/" + form.id,
        { method: "DELETE", headers: headers() },
      ),
      payload = await response.json();
    setMessage(payload.message || "Done");
    if (response.ok) {
      setForm(empty);
      await load();
    }
  };
  return (
    <main>
      <header>
        <div>
          <Link href="/">‹ Dashboard</Link>
          <small>HADITH COLLECTION MANAGEMENT</small>
          <h1>Hadith Books</h1>
          <p>
            Create and edit collection cards shared by the mobile app and web.
          </p>
        </div>
        <b>
          {items.length}
          <span>BOOK CARDS</span>
        </b>
      </header>
      {message && <p className="message">{message}</p>}
      <section className="layout">
        <form className="panel" onSubmit={save}>
          <div className="head">
            <div>
              <small>{form.id ? "EDIT COLLECTION" : "NEW COLLECTION"}</small>
              <h2>
                {form.id ? "Update Hadith book card" : "Add a new Hadith book"}
              </h2>
            </div>
            <button disabled={saving || uploading}>
              {saving ? "Saving..." : "Save Book Card"}
            </button>
          </div>
          <div className="grid">
            <label>
              Collection ID / URL slug
              <input
                required
                disabled={Boolean(form.id)}
                value={form.collectionId}
                placeholder="riyad-us-saliheen"
                onChange={(e) =>
                  setForm({
                    ...form,
                    collectionId: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "-"),
                  })
                }
              />
            </label>
            <label>
              English title
              <input
                required
                value={form.collectionName}
                onChange={(e) =>
                  setForm({ ...form, collectionName: e.target.value })
                }
              />
            </label>
            <label>
              Arabic title
              <input
                dir="rtl"
                value={form.arabicTitle}
                onChange={(e) =>
                  setForm({ ...form, arabicTitle: e.target.value })
                }
              />
            </label>
            <label>
              Author / compiler
              <input
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
              />
            </label>
            <label>
              Upload cover image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => void uploadCover(e.target.files?.[0])}
              />
              <small>
                {uploading
                  ? "Uploading..."
                  : form.coverImageUrl
                    ? "Cover ready"
                    : "JPG, PNG or WebP"}
              </small>
            </label>
            <label>
              Or cover image URL
              <input
                value={form.coverImageUrl}
                onChange={(e) =>
                  setForm({ ...form, coverImageUrl: e.target.value })
                }
              />
            </label>
            <label>
              Total Hadith
              <input
                type="number"
                min="0"
                value={form.hadithCount}
                onChange={(e) =>
                  setForm({ ...form, hadithCount: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Section
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option>Major</option>
                <option>Classical</option>
              </select>
            </label>
            <label>
              Languages
              <input
                value={form.languages}
                placeholder="English, Arabic, Bengali"
                onChange={(e) =>
                  setForm({ ...form, languages: e.target.value })
                }
              />
            </label>
            <label>
              Fallback mark
              <input
                maxLength={8}
                value={form.mark}
                onChange={(e) => setForm({ ...form, mark: e.target.value })}
              />
            </label>
            <label className="check wide">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) =>
                  setForm({ ...form, published: e.target.checked })
                }
              />{" "}
              Publish in app and web
            </label>
          </div>
          <div className="actions">
            <button
              type="button"
              className="light"
              onClick={() => setForm(empty)}
            >
              New card
            </button>
            {form.id && (
              <button
                type="button"
                className="delete"
                onClick={() => void remove()}
              >
                Delete card
              </button>
            )}
          </div>
        </form>
        <section className="panel preview">
          <small>LIVE CARD PREVIEW</small>
          <article>
            <div className="cover">
              {form.coverImageUrl ? (
                <div><img src={form.coverImageUrl} alt="Hadith cover preview" /><button type="button" onClick={() => void deleteManagedImage(API, token, { key: form.coverImageKey, url: form.coverImageUrl }).then(() => setForm((current: any) => ({ ...current, coverImageUrl: "", coverImageKey: "" }))).catch((error) => setMessage(error.message))}>Delete image</button></div>
              ) : (
                <b>{form.mark || "◆"}</b>
              )}
            </div>
            <div>
              <h2>{form.collectionName || "Hadith book title"}</h2>
              <p dir="rtl">{form.arabicTitle || "العنوان العربي"}</p>
              <span>{form.author || "Author / compiler"}</span>
              <small>
                ▣ {Number(form.hadithCount || 0).toLocaleString()} Hadiths ·{" "}
                {form.languages || "Multi Language"}
              </small>
            </div>
          </article>
          <b className="read">Read Collection →</b>
          <h3>Saved collection cards</h3>
          <div className="saved">
            {items.map((item) => (
              <button
                type="button"
                key={item.id || item.collectionId}
                onClick={() => {
                  setForm({
                    ...item,
                    languages: Array.isArray(item.languages)
                      ? item.languages.join(", ")
                      : item.languages || "",
                  });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <i className="savedCover">
                  {item.coverImageUrl ? (
                    <img src={item.coverImageUrl} alt="" />
                  ) : (
                    <b>{item.mark || "◆"}</b>
                  )}
                </i>
                <span>
                  <b>{item.collectionName}</b>
                  <small>
                    {item.author || "No author"} ·{" "}
                    {item.published ? "Published" : "Draft"}
                  </small>
                </span>
                <em>Edit →</em>
              </button>
            ))}
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
          background: #f3f8f4;
          color: #173d2e;
          font-family: Arial;
        }
        header,
        .message,
        .layout {
          max-width: 1300px;
          margin-left: auto;
          margin-right: auto;
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 27px 33px;
          border-radius: 22px;
          background: linear-gradient(135deg, #065437, #09885a);
          color: #fff;
        }
        header a {
          color: #def0e4;
          text-decoration: none;
        }
        header small,
        .head small,
        .preview > small {
          display: block;
          color: #ebc853;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1px;
        }
        header h1 {
          margin: 5px 0;
        }
        header p {
          margin: 0;
          color: #dceee4;
        }
        header > b {
          font-size: 30px;
          text-align: center;
        }
        header > b span {
          display: block;
          font-size: 9px;
        }
        .message {
          margin-top: 13px;
          padding: 12px 15px;
          border-radius: 10px;
          background: #def2e5;
          font-weight: 700;
        }
        .layout {
          display: grid;
          grid-template-columns: 1.18fr 0.82fr;
          gap: 18px;
          margin-top: 18px;
        }
        .panel {
          padding: 22px;
          border: 1px solid #d4e4d8;
          border-radius: 18px;
          background: #fff;
        }
        .head {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .head h2 {
          margin: 4px 0;
        }
        .head button,
        .actions button {
          padding: 11px 15px;
          border: 0;
          border-radius: 9px;
          background: #087a4d;
          color: #fff;
          font-weight: 800;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 13px;
          margin-top: 17px;
        }
        .wide {
          grid-column: 1/-1;
        }
        label {
          font-size: 11px;
          font-weight: 800;
        }
        input,
        select {
          width: 100%;
          margin-top: 6px;
          padding: 12px;
          border: 1px solid #c9dccf;
          border-radius: 10px;
          background: #fff;
        }
        label small {
          display: block;
          margin-top: 5px;
          color: #708078;
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
        .actions {
          display: flex;
          gap: 8px;
          margin-top: 15px;
        }
        .actions .light {
          background: #e9f3ec;
          color: #087a4d;
        }
        .actions .delete {
          background: #b64a3d;
        }
        .preview article {
          display: flex;
          gap: 18px;
          margin-top: 12px;
          padding: 20px;
          border: 1px solid #d3e2d7;
          border-radius: 14px 14px 0 0;
        }
        .cover {
          width: 78px;
          height: 108px;
          flex: none;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 7px;
          background: #086044;
          color: #f2c54d;
          font-size: 22px;
        }
        .cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .preview h2 {
          margin: 4px 0;
          font-size: 17px;
        }
        .preview p {
          margin: 8px 0;
          color: #087a4d;
        }
        .preview span,
        .preview article small {
          display: block;
          margin-top: 8px;
          color: #5f7067;
        }
        .read {
          display: block;
          padding: 13px;
          border-radius: 0 0 13px 13px;
          background: #e4f3e9;
          text-align: center;
          color: #087a4d;
        }
        .preview h3 {
          margin: 22px 0 9px;
        }
        .saved {
          max-height: 390px;
          overflow: auto;
        }
        .saved > button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 12px;
          min-height: 74px;
          padding: 8px 12px;
          margin-bottom: 8px;
          overflow: hidden;
          border: 1px solid #dbe7de;
          border-radius: 10px;
          background: #fff;
          color: #173d2e;
          text-align: left;
        }
        .savedCover {
          width: 42px;
          height: 56px;
          min-width: 42px;
          display: grid;
          place-items: center;
          align-self: center;
          flex: 0 0 42px;
          overflow: hidden;
          border-radius: 6px;
          background: #075b3f;
          color: #e9c34a;
          font-style: normal;
        }
        .savedCover img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .saved > button > span {
          display: block;
          min-width: 0;
          flex: 1;
          margin: 0;
        }
        .saved > button > span > b {
          display: block;
          white-space: normal;
          line-height: 1.25;
        }
        .saved small {
          display: block;
          margin-top: 4px;
          color: #718078;
        }
        .saved em {
          margin-left: auto;
          color: #087a4d;
          font-style: normal;
          font-weight: 800;
        }
        @media (max-width: 900px) {
          .layout {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 620px) {
          main {
            padding: 14px;
          }
          .grid {
            grid-template-columns: 1fr;
          }
          .wide {
            grid-column: auto;
          }
        }
      `}</style>
    </main>
  );
}
