"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLanguagePicker, {
  ADMIN_LANGUAGES,
} from "../components/AdminLanguagePicker";
import { deleteManagedImage, uploadImageToS3 } from "../lib/imageUpload";

const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");
type Source = {
  id?: string;
  _id?: string;
  sourceId: string;
  name: string;
  author_name: string;
  language: string;
  language_name?: string;
  description?: string;
  coverImageUrl?: string;
  coverImageKey?: string;
  order?: number;
  published: boolean;
  managed?: boolean;
  external?: boolean;
};
const empty: Source = {
  sourceId: "",
  name: "",
  author_name: "",
  language: "bn",
  language_name: "bengali",
  description: "",
  coverImageUrl: "",
  coverImageKey: "",
  order: 1,
  published: true,
};

export default function TafsirBooksPage() {
  const [token, setToken] = useState(""),
    [items, setItems] = useState<Source[]>([]),
    [form, setForm] = useState<Source>(empty),
    [query, setQuery] = useState(""),
    [message, setMessage] = useState(""),
    [saving, setSaving] = useState(false),
    [uploading, setUploading] = useState(false),
    [loading, setLoading] = useState(true);
  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  });
  const load = async (currentToken = token) => {
    if (!currentToken) return;
    setLoading(true);
    try {
      const response = await fetch(API + "/api/admin/tafsir/sources", {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + currentToken,
          },
        }),
        body = await response.json();
      if (!response.ok) throw Error(body.message);
      setItems(
        Array.isArray(body.data)
          ? body.data.map((item: Source) => ({ ...item, managed: true }))
          : [],
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load Tafsir books.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const saved = sessionStorage.getItem("deenislam_admin_token") || "";
    setToken(saved);
    void load(saved);
  }, []);
  const visible = useMemo(() => {
    const value = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        !value ||
        `${item.name} ${item.author_name} ${item.language_name} ${item.language} ${item.sourceId}`
          .toLowerCase()
          .includes(value),
    );
  }, [items, query]);
  const reset = () => setForm({ ...empty, order: items.length + 1 });
  const edit = (item: Source) => {
    setForm({ ...item, published: item.published !== false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const uploadCover = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const body = await uploadImageToS3(API, token, file);
      setForm((current) => ({
        ...current,
        coverImageUrl: body.publicUrl,
        coverImageKey: body.key,
      }));
      setMessage("Cover converted to WebP and uploaded successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Cover image upload failed.",
      );
    } finally {
      setUploading(false);
    }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.sourceId.trim() || !form.name.trim())
      return setMessage("Book ID and name are required.");
    setSaving(true);
    setMessage("");
    try {
      const id = form.id || form._id,
        response = await fetch(
          API +
            (id
              ? `/api/admin/tafsir/sources/${id}`
              : "/api/admin/tafsir/sources"),
          {
            method: id ? "PUT" : "POST",
            headers: headers(),
            body: JSON.stringify(form),
          },
        ),
        body = await response.json();
      if (!response.ok) throw Error(body.message);
      setMessage(
        id
          ? "Tafsir book updated successfully."
          : "New Tafsir book added successfully.",
      );
      reset();
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to save Tafsir book.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <main>
      <header>
        <div>
          <Link href="/">‹ Dashboard</Link>
          <small>TAFSIR LIBRARY</small>
          <h1>Tafsir Books</h1>
          <p>
            Add and edit the Tafsir sources shared by the mobile app and web.
          </p>
        </div>
        <b>
          {items.length}
          <span>BOOKS</span>
        </b>
      </header>
      {message && <p className="message">{message}</p>}
      <section className="layout">
        <form className="panel" onSubmit={save}>
          <div className="head">
            <div>
              <small>{form.id || form._id ? "EDIT BOOK" : "NEW BOOK"}</small>
              <h2>{form.id || form._id ? form.name : "Add Tafsir Book"}</h2>
            </div>
            <button disabled={saving}>
              {saving
                ? "Saving..."
                : form.id || form._id
                  ? "Update Book"
                  : "Add Book"}
            </button>
          </div>
          <div className="fields">
            <label>
              Unique Book ID
              <input
                required
                value={form.sourceId}
                onChange={(e) => setForm({ ...form, sourceId: e.target.value })}
                placeholder="e.g. 195 or bn-tafsir-jalalayn"
              />
            </label>
            <label>
              Book Name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              Author Name
              <input
                value={form.author_name}
                onChange={(e) =>
                  setForm({ ...form, author_name: e.target.value })
                }
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
                  ? "Uploading image..."
                  : form.coverImageUrl
                    ? "Image ready"
                    : "Choose JPG, PNG or WebP"}
              </small>
            </label>
            <label>
              Cover image URL
              <input
                value={form.coverImageUrl || ""}
                onChange={(e) =>
                  setForm({ ...form, coverImageUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </label>
            <label>
              Language (195 available)
              <AdminLanguagePicker
                section="Tafsir Books"
                value={form.language}
                onChange={(code) => {
                  const selected = ADMIN_LANGUAGES.find(
                    (item) => item.code === code,
                  );
                  setForm({
                    ...form,
                    language: code,
                    language_name: (selected?.label || code).toLowerCase(),
                  });
                }}
                statusFor={(code) => {
                  const count = items.filter(
                    (item) => item.language === code,
                  ).length;
                  return count
                    ? `${count} Tafsir book(s)`
                    : "No Tafsir book yet";
                }}
                completeFor={(code) =>
                  items.some((item) => item.language === code)
                }
              />
            </label>
            <label className="wide">
              Description
              <textarea
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>
            <label className="check wide">
              <input
                type="checkbox"
                checked={form.published !== false}
                onChange={(e) =>
                  setForm({ ...form, published: e.target.checked })
                }
              />{" "}
              Published in mobile app and web
            </label>
          </div>
          {(form.id || form._id) && (
            <button type="button" className="cancel" onClick={reset}>
              Cancel editing
            </button>
          )}
        </form>
        <section className="panel">
          <div className="libraryHead">
            <div>
              <small>SHARED LIBRARY</small>
              <h2>Saved Tafsir Books</h2>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search book, author or language..."
            />
          </div>
          <div className="coverPreview">
            {form.coverImageUrl ? (
              <div><img src={form.coverImageUrl} alt="Tafsir book cover" /><button type="button" onClick={() => void deleteManagedImage(API, token, { key: form.coverImageKey, url: form.coverImageUrl }).then(() => setForm((current) => ({ ...current, coverImageUrl: "", coverImageKey: "" }))).catch((error) => setMessage(error.message))}>Delete image</button></div>
            ) : (
              <div className="generatedPreview">
                <b>ق</b>
                <span>{form.name || "Tafsir book cover"}</span>
              </div>
            )}
          </div>
          <div className="books">
            {loading ? (
              <p className="empty">Loading books...</p>
            ) : (
              visible.map((item, index) => (
                <article key={item.id || item.sourceId}>
                  {item.coverImageUrl ? (
                    <img
                      className="bookCover"
                      src={item.coverImageUrl}
                      alt=""
                    />
                  ) : (
                    <div
                      className="bookCover generatedCover"
                      style={{
                        backgroundColor: [
                          "#185B3D",
                          "#7C3E1E",
                          "#213C76",
                          "#256644",
                        ][index % 4],
                      }}
                    >
                      <b>ق</b>
                      <small>{item.name}</small>
                    </div>
                  )}
                  <div>
                    <b>{item.name}</b>
                    <small>
                      ID: {item.sourceId} ·{" "}
                      {(item.language_name || item.language).toUpperCase()}
                    </small>
                    <p>{item.author_name || "No author"}</p>
                    <span>
                      {item.published === false ? "Draft" : "Published"}
                    </span>
                  </div>
                  <button type="button" onClick={() => edit(item)}>
                    Edit
                  </button>
                </article>
              ))
            )}
            {!loading && !visible.length && (
              <p className="empty">No matching Tafsir books.</p>
            )}
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
          max-width: 1400px;
          margin-left: auto;
          margin-right: auto;
        }
        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 25px 30px;
          border-radius: 21px;
          background: linear-gradient(135deg, #064b32, #088154);
          color: #fff;
        }
        header a {
          color: #def1e4;
          text-decoration: none;
        }
        header small,
        .head small,
        .libraryHead small {
          display: block;
          color: #e2c45e;
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
          font-size: 31px;
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
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-top: 18px;
        }
        .panel {
          padding: 22px;
          border: 1px solid #d6e5da;
          border-radius: 18px;
          background: #fff;
        }
        .head,
        .libraryHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .head h2,
        .libraryHead h2 {
          margin: 4px 0;
        }
        .head button,
        .books button {
          padding: 10px 14px;
          border: 0;
          border-radius: 9px;
          background: #087a4d;
          color: #fff;
          font-weight: 800;
        }
        .fields {
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
        label small {
          display: block;
          margin-top: 5px;
          color: #6d7c74;
        }
        .coverPreview {
          height: 180px;
          margin-top: 15px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border: 1px dashed #bcd4c4;
          border-radius: 14px;
          background: #f4faf6;
          color: #6d7c74;
        }
        .coverPreview img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .generatedPreview {
          width: 92px;
          height: 132px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #185b3d;
          text-align: center;
          box-shadow: 0 8px 18px #173d2e26;
        }
        .generatedPreview b {
          font-family: serif;
          font-size: 30px;
          color: #d8bc62;
        }
        .generatedPreview span {
          margin-top: 8px;
          font-family: serif;
          font-size: 10px;
          line-height: 1.25;
          color: #fff;
        }
        .bookCover {
          width: 58px !important;
          height: 78px !important;
          min-width: 58px;
          flex: 0 0 58px !important;
          object-fit: cover;
          border-radius: 7px;
          background: #075b3f;
          color: #e6c34d;
        }
        .generatedCover {
          display: flex !important;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-width: 58px !important;
          padding: 5px;
          text-align: center;
        }
        .generatedCover b {
          font-family: serif;
          font-size: 19px;
          color: #d8bc62;
        }
        .generatedCover small {
          display: -webkit-box !important;
          margin-top: 4px !important;
          overflow: hidden;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          font-family: serif;
          font-size: 7px !important;
          line-height: 1.15;
          color: #fff !important;
        }
        input,
        textarea {
          width: 100%;
          margin-top: 6px;
          padding: 12px;
          border: 1px solid #cbded1;
          border-radius: 10px;
          background: #fff;
          color: #173d2e;
        }
        textarea {
          min-height: 105px;
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
        .cancel {
          margin-top: 14px;
          padding: 10px 14px;
          border: 0;
          border-radius: 9px;
          background: #edf4ef;
          color: #285342;
          font-weight: 800;
        }
        .libraryHead input {
          width: 260px;
          margin: 0;
        }
        .books {
          margin-top: 15px;
          max-height: 690px;
          overflow: auto;
        }
        .books article {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #e1ebe4;
        }
        .books article > div:not(.bookCover) {
          flex: 1;
          min-width: 0;
        }
        .books b,
        .books small {
          display: block;
        }
        .books small {
          margin-top: 4px;
          color: #6d7c74;
        }
        .books p {
          margin: 6px 0;
          font-size: 11px;
        }
        .books span {
          padding: 3px 7px;
          border-radius: 8px;
          background: #e4f3e9;
          color: #087a4d;
          font-size: 9px;
          font-weight: 800;
        }
        .empty {
          padding: 45px;
          text-align: center;
          color: #78857e;
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
          .fields {
            grid-template-columns: 1fr;
          }
          .wide {
            grid-column: auto;
          }
          .libraryHead {
            align-items: stretch;
            flex-direction: column;
          }
          .libraryHead input {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
