"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { HOME_LANGUAGES } from "../../../web/app/data/homeLanguages";
import { deleteManagedImage } from "../lib/imageUpload";
import BaseRichTextEditor, {
  commitRichTextUploads,
} from "../islamic-lifestyle/RichTextEditor";
const SAHABA_LANGUAGES = HOME_LANGUAGES.filter(
  (item) => !["iw", "jw"].includes(item.code),
);
const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");
const RichTextEditor = (
  props: Parameters<typeof BaseRichTextEditor>[0],
) => <BaseRichTextEditor {...props} cleanupUnsavedImages />;
const empty = {
  slug: "",
  title: "",
  author: "DeenIslam Editorial",
  category: "Male Sahaba",
  language: "English",
  languageCode: "en",
  description: "",
  content: "",
  coverImageUrl: "",
  coverImageKey: "",
  license: "Original educational summary",
  sourceUrl: "",
  publicDomain: false,
  published: true,
  pages: [],
  extraction: {},
};
async function json(r: Response) {
  if (!(r.headers.get("content-type") || "").includes("application/json"))
    throw Error("Restart the backend server, then refresh this page.");
  return r.json();
}
export default function SahabaAdmin() {
  const [tokenValue, setTokenValue] = useState(""),
    [languages, setLanguages] = useState<any[]>(SAHABA_LANGUAGES),
    [items, setItems] = useState<any[]>([]),
    [form, setForm] = useState<any>(empty),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState(""),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [uploading, setUploading] = useState(false),
    [coverStatus, setCoverStatus] = useState(""),
    [selectedCoverPreview, setSelectedCoverPreview] = useState(""),
    [working, setWorking] = useState(""),
    [languageOpen, setLanguageOpen] = useState(false),
    [languageSearch, setLanguageSearch] = useState("");
  const token = () => sessionStorage.getItem("deenislam_admin_token") || "",
    headers = () => ({
      "Content-Type": "application/json",
      Authorization: "Bearer " + token(),
    });
  async function load() {
    setLoading(true);
    try {
      const r = await fetch(API + "/api/admin/library-books", {
          headers: headers(),
        }),
        j = await json(r);
      if (!r.ok) throw Error(j.message);
      setItems(
        (j.data || []).filter((x: any) =>
          ["Sahaba", "Male Sahaba", "Female Sahabiyat"].includes(x.category),
        ),
      );
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    setTokenValue(sessionStorage.getItem("deenislam_admin_token") || "");
    void load();
    fetch(API + "/api/translate/languages")
      .then((r) => r.json())
      .then((j) => {
        if (!Array.isArray(j.data)) return;
        const remote = new Map(j.data.map((item: any) => [item.code, item]));
        setLanguages(
          SAHABA_LANGUAGES.map((item) => ({
            ...item,
            ...(remote.get(item.code) || {}),
          })).sort((a: any, b: any) => a.label.localeCompare(b.label)),
        );
      })
      .catch(() => undefined);
  }, []);
  const visible = useMemo(
    () =>
      items.filter(
        (x) =>
          (!filter || x.category === filter) &&
          `${x.title} ${x.author}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [items, query, filter],
  );
  async function upload(file: File | null) {
    if (!file) return;
    if (file.type && !file.type.startsWith("image/"))
      return setMessage("Choose a valid image file.");
    const sourceType = file.type || "application/octet-stream";
    setSelectedCoverPreview((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setUploading(true);
    setCoverStatus(`Uploading ${file.name} and converting it to WebP...`);
    setMessage("Uploading cover image...");
    try {
      const r = await fetch(API + "/api/admin/books/cover-upload", {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            fileName: file.name,
            contentType: sourceType,
          }),
        }),
        j = await json(r);
      if (!r.ok) throw Error(j.message);
      const put = await fetch(j.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": sourceType },
        body: file,
      });
      if (!put.ok) {
        const failure = await put.json().catch(() => ({}));
        throw Error(failure.message || "Cover upload failed.");
      }
      setForm((x: any) => ({
        ...x,
        coverImageUrl: j.data.publicUrl,
        coverImageKey: j.data.key,
      }));
      setCoverStatus(`${file.name} uploaded successfully as WebP.`);
      setMessage("Cover converted to WebP and uploaded successfully.");
    } catch (e: any) {
      const detail = String(e.message || "Cover upload failed.");
      const friendly = /credentials|credential provider/i.test(detail)
        ? "AWS credentials are missing. Add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to server/.env, save it, then restart the backend."
        : detail;
      setCoverStatus(friendly);
      setMessage(friendly);
    } finally {
      setUploading(false);
    }
  }
  async function removeCover() {
    if (!form.coverImageKey && !form.coverImageUrl) {
      if (selectedCoverPreview.startsWith("blob:"))
        URL.revokeObjectURL(selectedCoverPreview);
      setSelectedCoverPreview("");
      setCoverStatus("");
      return;
    }
    setUploading(true);
    setMessage("Removing cover image...");
    try {
      const cleared = { ...form, coverImageUrl: "", coverImageKey: "" };
      if (form.slug) {
        const response = await fetch(
          API + "/api/admin/library-books/" + encodeURIComponent(form.slug),
          { method: "PUT", headers: headers(), body: JSON.stringify(cleared) },
        );
        const body = await json(response);
        if (!response.ok) throw Error(body.message || "Unable to update biography.");
      }
      await deleteManagedImage(API, token(), {
        key: form.coverImageKey,
        url: form.coverImageUrl,
      });
      setForm(cleared);
      if (selectedCoverPreview.startsWith("blob:"))
        URL.revokeObjectURL(selectedCoverPreview);
      setSelectedCoverPreview("");
      setMessage("Cover removed from the biography and AWS S3.");
      if (form.slug) await load();
    } catch (e: any) {
      setMessage(e.message || "Unable to remove the cover image.");
    } finally {
      setUploading(false);
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (form.content.replace(/<[^>]+>/g, " ").trim().length < 20)
      return setMessage("Add a complete biography before saving.");
    setSaving(true);
    setMessage("");
    try {
      const pages = (
          form.pages?.length
            ? form.pages
            : [
                {
                  number: 1,
                  text: form.content,
                  markdown: form.content,
                  confidence: 100,
                  needsReview: false,
                },
              ]
        ).map((page: any, index: number) => ({ ...page, number: index + 1 })),
        body = {
          ...form,
          pages,
          content: pages
            .map((page: any) => page.markdown || page.text || "")
            .join("\n\n"),
          extraction: {
            method: "editorial",
            pageCount: pages.length,
            averageConfidence: 100,
            needsReview: [],
          },
        },
        url =
          API +
          "/api/admin/library-books" +
          (form.slug ? "/" + encodeURIComponent(form.slug) : ""),
        r = await fetch(url, {
          method: form.slug ? "PUT" : "POST",
          headers: headers(),
          body: JSON.stringify(body),
        }),
        j = await json(r);
      if (!r.ok) throw Error(j.message);
      commitRichTextUploads();
      setMessage(j.message || "Biography saved successfully.");
      setForm(empty);
      if (selectedCoverPreview.startsWith("blob:"))
        URL.revokeObjectURL(selectedCoverPreview);
      setSelectedCoverPreview("");
      setCoverStatus("");
      await load();
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function edit(item: any) {
    setWorking(item.slug);
    try {
      const r = await fetch(
          API + "/api/admin/library-books/" + encodeURIComponent(item.slug),
          { headers: headers() },
        ),
        j = await json(r);
      if (!r.ok) throw Error(j.message);
      setForm({ ...empty, ...j.data });
      if (selectedCoverPreview.startsWith("blob:"))
        URL.revokeObjectURL(selectedCoverPreview);
      setSelectedCoverPreview("");
      setCoverStatus("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setWorking("");
    }
  }
  async function remove(item: any) {
    if (
      !confirm(
        "Remove " +
          item.title +
          "? A Moderator deletion will wait for approval.",
      )
    )
      return;
    setWorking(item.slug);
    try {
      const r = await fetch(
          API + "/api/admin/library-books/" + encodeURIComponent(item.slug),
          { method: "DELETE", headers: headers() },
        ),
        j = await json(r);
      if (!r.ok) throw Error(j.message);
      setMessage(j.message);
      if (j.data?.status !== "pending")
        setItems((rows) => rows.filter((x) => x.slug !== item.slug));
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setWorking("");
    }
  }
  return (
    <main>
      <header>
        <div>
          <a href="/">&#8249; Back to Dashboard</a>
          <small>ISLAMIC BIOGRAPHY LIBRARY</small>
          <h1>Sahaba Content</h1>
          <p>Add and manage the lives of Male Sahaba and Female Sahabiyat.</p>
        </div>
        <b>
          {items.length}
          <span>BIOGRAPHIES</span>
        </b>
      </header>
      {message && <div className="message">{message}</div>}
      <section className="layout">
        <form className="panel form" onSubmit={save}>
          <div className="panelHead">
            <div>
              <small>{form.slug ? "EDIT BIOGRAPHY" : "NEW BIOGRAPHY"}</small>
              <h2>
                {form.slug
                  ? form.title || "Edit Sahaba"
                  : "Add Sahaba life story"}
              </h2>
            </div>
            <button disabled={saving || uploading}>
              {saving ? "Saving..." : "Save Biography"}
            </button>
          </div>
          <div className="fields">
            <label>
              Biography category
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option>Male Sahaba</option>
                <option>Female Sahabiyat</option>
              </select>
            </label>
            <label>
              Language <small>195 available</small>
              <button
                type="button"
                className="languagePicker"
                onClick={() => setLanguageOpen(true)}
              >
                <i>{form.languageCode.toUpperCase()}</i>
                <span>
                  <b>
                    {languages.find((item) => item.code === form.languageCode)
                      ?.label || form.language}
                  </b>
                  <small>Select content language</small>
                </span>
                <strong>{"\u203A"}</strong>
              </button>
            </label>
            <label>
              Sahabi / Sahabiyah name
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </label>
            <label>
              Writer / editor
              <input
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
              />
            </label>
            <label className="wide">
              Short description
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                required
              />
            </label>
            <label className="wide cover">
              <span>Cover image</span>
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => {
                  void upload(e.target.files?.[0] || null);
                }}
              />
              {coverStatus && (
                <small className={form.coverImageUrl ? "coverStatus success" : "coverStatus"}>
                  {coverStatus}
                </small>
              )}
              {(selectedCoverPreview || form.coverImageUrl) && (
                <div className="coverPreview sahabaDetailPreview">
                  <img
                    src={selectedCoverPreview || form.coverImageUrl}
                    alt="Selected biography cover preview"
                  />
                  <div>
                    <span>{form.category || "Sahaba"}</span>
                    <h3>{form.title || "Biography title"}</h3>
                    <p>{form.description || "Biography description will appear here."}</p>
                    <b>
                      {form.coverImageUrl
                        ? "Uploaded cover preview"
                        : "Selected image preview"}
                    </b>
                    <small>
                      {form.coverImageUrl
                        ? "Stored as an optimized WebP image in AWS S3."
                        : "This preview is local. Fix the error above to upload it to S3."}
                    </small>
                    <div className="previewParts">
                      <span>
                        {(form.pages || []).length || 1} biography {(form.pages || []).length === 1 ? "part" : "parts"}
                      </span>
                      <b>Profile → Parts → Full reader</b>
                    </div>
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => void removeCover()}
                    >
                      {uploading ? "Working..." : "Delete image"}
                    </button>
                  </div>
                </div>
              )}
            </label>
            <div className="wide editor">
              <label>Complete biography text</label>
              <RichTextEditor
                value={form.content || ""}
                api={API}
                token={tokenValue}
                recordId={`sahaba:${form.slug || "new"}:${form.languageCode}`}
                onMessage={setMessage}
                onChange={(content) =>
                  setForm((current: any) => ({
                    ...current,
                    content,
                    pages: [
                      {
                        number: 1,
                        text: content,
                        markdown: content,
                        confidence: 100,
                        needsReview: false,
                      },
                    ],
                  }))
                }
              />
            </div>
            <label className="wide">
              Verified sources / references
              <input
                value={form.sourceUrl}
                onChange={(e) =>
                  setForm({ ...form, sourceUrl: e.target.value })
                }
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) =>
                  setForm({ ...form, published: e.target.checked })
                }
              />{" "}
              Publish in mobile app
            </label>
          </div>
          {form.slug && (
            <button
              type="button"
              className="clear"
              onClick={() => setForm(empty)}
            >
              Cancel editing
            </button>
          )}
        </form>
        <section className="panel library">
          <div className="libraryHead">
            <div>
              <small>CONTENT LIBRARY</small>
              <h2>Saved biographies</h2>
              <p>
                {visible.length} of {items.length} biographies
              </p>
            </div>
            <div>
              <input
                placeholder="Search name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">All categories</option>
                <option>Male Sahaba</option>
                <option>Female Sahabiyat</option>
              </select>
            </div>
          </div>
          {loading ? (
            <p className="empty">Loading biographies...</p>
          ) : (
            visible.map((item) => (
              <article key={item.slug}>
                <div className="thumb">
                  {item.coverImageUrl ? (
                    <img src={item.coverImageUrl} alt="" />
                  ) : (
                    <span>{item.title.slice(0, 2)}</span>
                  )}
                </div>
                <div>
                  <b>{item.title}</b>
                  <strong>{item.category}</strong>
                  <p>{item.description}</p>
                  <small>
                    {item.language || "English"} -{" "}
                    {item.published === false ? "Draft" : "Published"}
                  </small>
                </div>
                <nav>
                  <button
                    disabled={working === item.slug}
                    onClick={() => void edit(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete"
                    disabled={working === item.slug}
                    onClick={() => void remove(item)}
                  >
                    Remove
                  </button>
                </nav>
              </article>
            ))
          )}
          {!loading && !visible.length && (
            <p className="empty">No biography found.</p>
          )}
        </section>
      </section>
      {languageOpen && (
        <div
          className="languageModal"
          role="dialog"
          aria-modal="true"
          aria-label="Select Sahaba content language"
        >
          <section>
            <div className="languageModalHead">
              <div>
                <small>SAHABA CONTENT</small>
                <h2>Select Language</h2>
                <p>
                  {new Set(items.map((item) => item.languageCode || "en")).size}{" "}
                  languages uploaded - 195 available
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLanguageOpen(false);
                  setLanguageSearch("");
                }}
              >
                {"\u00D7"}
              </button>
            </div>
            <label className="languageSearch">
              <span>{"\u2315"}</span>
              <input
                autoFocus
                value={languageSearch}
                onChange={(e) => setLanguageSearch(e.target.value)}
                placeholder="Search language or code..."
              />
            </label>
            <div className="languageList">
              {languages
                .filter(
                  (item) =>
                    !languageSearch.trim() ||
                    `${item.label} ${item.code}`
                      .toLowerCase()
                      .includes(languageSearch.trim().toLowerCase()),
                )
                .map((item) => {
                  const count = items.filter(
                      (book) => (book.languageCode || "en") === item.code,
                    ).length,
                    selected = form.languageCode === item.code;
                  return (
                    <button
                      type="button"
                      key={item.code}
                      className={
                        selected ? "languageRow selected" : "languageRow"
                      }
                      onClick={() => {
                        setForm({
                          ...form,
                          languageCode: item.code,
                          language: item.label,
                        });
                        setLanguageOpen(false);
                        setLanguageSearch("");
                      }}
                    >
                      <i>{item.code.slice(0, 3).toUpperCase()}</i>
                      <span>
                        <b>
                          {item.label}
                          {item.code === "en" ? " (Base)" : ""}
                        </b>
                        <small>
                          {count
                            ? `${count} ${count === 1 ? "biography" : "biographies"} uploaded`
                            : "Not uploaded yet"}
                        </small>
                      </span>
                      {count > 0 ? (
                        <em>{"\u2713"}</em>
                      ) : (
                        <em className="emptyMark" />
                      )}
                      <strong>{"\u203A"}</strong>
                    </button>
                  );
                })}
            </div>
          </section>
        </div>
      )}
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
          max-width: 1500px;
          margin-left: auto;
          margin-right: auto;
        }
        header {
          display: flex;
          justify-content: space-between;
          padding: 27px 32px;
          border-radius: 22px;
          background: linear-gradient(135deg, #064b32, #088154);
          color: #fff;
        }
        header a {
          color: #def1e4;
          text-decoration: none;
        }
        header small,
        .panelHead small,
        .libraryHead small {
          display: block;
          margin-top: 7px;
          color: #d9bd65;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.1px;
        }
        header h1 {
          margin: 5px 0;
        }
        header p {
          margin: 0;
          color: #dfeee5;
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
          padding: 13px;
          border-radius: 10px;
          background: #def2e5;
        }
        .layout {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 17px;
          margin-top: 17px;
        }
        .panel {
          padding: 22px;
          border: 1px solid #d7e6db;
          border-radius: 17px;
          background: #fff;
        }
        .panelHead,
        .libraryHead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .panelHead h2,
        .libraryHead h2 {
          margin: 4px 0;
        }
        .panelHead button,
        .library button {
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
          margin-top: 18px;
        }
        .wide {
          grid-column: 1/-1;
        }
        label {
          font-size: 11px;
          font-weight: 800;
        }
        input,
        select,
        textarea {
          width: 100%;
          margin-top: 6px;
          padding: 11px;
          border: 1px solid #cbded1;
          border-radius: 9px;
          background: #fff;
        }
        textarea {
          min-height: 90px;
          resize: vertical;
        }
        .cover {
          padding: 14px;
          border: 1px dashed #8fc5a2;
          border-radius: 13px;
          background: #f1f9f3;
        }
        .coverPreview {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 10px;
        }
        .coverStatus {
          display: block;
          margin-top: 8px;
          color: #9b3c30;
          font-weight: 700;
        }
        .coverStatus.success {
          color: #087a4d;
        }
        .coverPreview img {
          width: 112px;
          height: 142px;
          flex: none;
          object-fit: cover;
          border: 3px solid rgba(255, 255, 255, 0.85);
          border-radius: 15px;
          background: #fff;
        }
        .sahabaDetailPreview {
          padding: 16px;
          border-radius: 18px;
          background: linear-gradient(135deg, #075b3b, #0b8758);
          color: #fff;
        }
        .sahabaDetailPreview span {
          color: #f1ca65;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .sahabaDetailPreview h3 {
          margin: 5px 0;
          color: #fff;
          font-family: Georgia, serif;
          font-size: 20px;
        }
        .sahabaDetailPreview p {
          max-width: 330px;
          margin: 0 0 8px;
          color: #dff2e9;
          font-size: 11px;
          line-height: 1.5;
        }
        .coverPreview b {
          display: block;
        }
        .coverPreview small {
          display: block;
          max-width: 280px;
          margin-top: 5px;
          color: #d9ebe3;
          font-weight: 500;
          line-height: 1.45;
        }
        .coverPreview button {
          margin-top: 7px;
          padding: 7px;
          border: 0;
          border-radius: 7px;
          background: #fff0ed;
          color: #ad4335;
        }
        .previewParts {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 9px;
        }
        .previewParts span,
        .previewParts b {
          padding: 6px 9px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.13);
          color: #fff;
          font-size: 9px;
        }
        .editor {
          display: grid;
          gap: 7px;
        }
        .editor :global(.richEditorBody) {
          min-height: 360px;
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
        .clear {
          margin-top: 15px;
          padding: 10px 14px;
          border: 0;
          border-radius: 9px;
          background: #edf4ef;
          color: #275342;
        }
        .libraryHead {
          padding-bottom: 14px;
          border-bottom: 1px solid #e1ebe4;
        }
        .libraryHead > div:last-child {
          display: grid;
          grid-template-columns: 1fr 150px;
          gap: 8px;
        }
        .libraryHead input,
        .libraryHead select {
          margin: 0;
        }
        .library article {
          display: flex;
          gap: 11px;
          padding: 14px 0;
          border-bottom: 1px solid #e5ede7;
        }
        .thumb {
          width: 62px;
          height: 82px;
          display: grid;
          place-items: center;
          flex: none;
          overflow: hidden;
          border-radius: 9px;
          background: #e6f3ea;
          color: #087a4d;
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
        .library article strong,
        .library article small {
          display: block;
        }
        .library article strong {
          margin-top: 4px;
          color: #9b7926;
          font-size: 10px;
        }
        .library article p {
          margin: 6px 0;
          color: #65766d;
          font-size: 11px;
          line-height: 1.45;
        }
        .library article small {
          color: #849188;
        }
        .library nav {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .library .delete {
          background: #fff0ed;
          color: #ad4335;
        }
        .empty {
          padding: 40px;
          text-align: center;
          color: #758179;
        }
        .languagePicker {
          width: 100%;
          min-height: 54px;
          margin-top: 6px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #cbded1;
          border-radius: 10px;
          background: #fff;
          color: #173d2e;
          text-align: left;
        }
        .languagePicker > i {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #eaf4ed;
          color: #087a4d;
          font-size: 10px;
          font-style: normal;
          font-weight: 900;
        }
        .languagePicker > span {
          display: block;
          flex: 1;
        }
        .languagePicker > span b,
        .languagePicker > span small {
          display: block;
        }
        .languagePicker > span small {
          margin-top: 3px;
          color: #7b8981;
          font-weight: 500;
        }
        .languagePicker > strong {
          color: #087a4d;
          font-size: 24px;
        }
        .languageModal {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: grid;
          place-items: center;
          padding: 20px;
          background: #123c2fb3;
          backdrop-filter: blur(5px);
        }
        .languageModal > section {
          width: min(560px, 100%);
          max-height: 88vh;
          display: flex;
          flex-direction: column;
          padding: 22px;
          border-radius: 24px;
          background: #f9fcfa;
          box-shadow: 0 24px 70px #102d2340;
        }
        .languageModalHead {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }
        .languageModalHead small {
          color: #a27f24;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }
        .languageModalHead h2 {
          margin: 5px 0 2px;
          font-family: Georgia, serif;
          font-size: 29px;
        }
        .languageModalHead p {
          margin: 0;
          color: #718078;
          font-size: 12px;
        }
        .languageModalHead > button {
          width: 40px;
          height: 40px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: #e8f4eb;
          color: #087a4d;
          font-size: 18px;
          font-weight: 900;
        }
        .languageSearch {
          position: relative;
          margin-top: 16px;
        }
        .languageSearch span {
          position: absolute;
          left: 16px;
          top: 19px;
          color: #087a4d;
          font-size: 21px;
        }
        .languageSearch input {
          height: 50px;
          margin: 0;
          padding-left: 44px;
          font-size: 13px;
          font-weight: 700;
        }
        .languageList {
          display: grid;
          gap: 8px;
          margin-top: 14px;
          padding-right: 4px;
          overflow: auto;
        }
        .languageRow {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 13px;
          border: 1px solid #d6e5da;
          border-radius: 15px;
          background: #fff;
          color: #173d2e;
          text-align: left;
        }
        .languageRow.selected {
          border-color: #61ad7d;
          background: #f0faf3;
        }
        .languageRow > i {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          flex: none;
          border-radius: 50%;
          background: #edf3ef;
          color: #65776e;
          font-size: 9px;
          font-style: normal;
          font-weight: 900;
        }
        .languageRow > span {
          min-width: 0;
          flex: 1;
        }
        .languageRow > span b,
        .languageRow > span small {
          display: block;
        }
        .languageRow > span b {
          font-size: 14px;
        }
        .languageRow > span small {
          margin-top: 4px;
          color: #7d8b84;
          font-size: 10px;
        }
        .languageRow > em {
          width: 20px;
          height: 20px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #0a955b;
          color: #fff;
          font-style: normal;
          font-weight: 900;
        }
        .languageRow > em.emptyMark {
          background: #e7f0ea;
        }
        .languageRow > strong {
          color: #079052;
          font-size: 22px;
        }
        @media (max-width: 1000px) {
          .layout {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 650px) {
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
          .library article {
            flex-wrap: wrap;
          }
          .library nav {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </main>
  );
}
