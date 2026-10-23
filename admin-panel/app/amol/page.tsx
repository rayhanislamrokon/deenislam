"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLanguagePicker, {
  ADMIN_LANGUAGES,
} from "../components/AdminLanguagePicker";
import BookPageBuilder from "./AmolPartBuilder";
import { commitRichTextUploads } from "../islamic-lifestyle/RichTextEditor";

const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");
const blank = {
  slug: "",
  title: "",
  author: "DeenIslam Editorial",
  category: "Amol",
  language: "English",
  languageCode: "en",
  description: "",
  license: "Verified Islamic sources",
  sourceUrl: "",
  coverImageUrl: "",
  coverImageKey: "",
  content: "",
  pages: [] as any[],
  extraction: {},
  publicDomain: true,
  published: true,
};
const parse = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: text || "Unexpected server response." };
  }
};

export default function AmolAdmin() {
  const [token, setToken] = useState(""),
    [items, setItems] = useState<any[]>([]),
    [form, setForm] = useState<any>(blank),
    [query, setQuery] = useState(""),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [working, setWorking] = useState(""),
    [preview, setPreview] = useState<any | null>(null),
    [openPreviewPart, setOpenPreviewPart] = useState<number | null>(null);
  const headers = () => ({
    "Content-Type": "application/json",
    Authorization:
      "Bearer " + (sessionStorage.getItem("deenislam_admin_token") || ""),
  });
  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch(API + "/api/admin/library-books", {
          headers: headers(),
        }),
        body = await parse(response);
      if (!response.ok) throw Error(body.message);
      setItems(
        (body.data || []).filter((item: any) => item.category === "Amol"),
      );
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setToken(sessionStorage.getItem("deenislam_admin_token") || "");
    void load();
  }, []);
  const visible = useMemo(
    () =>
      items.filter((item) =>
        `${item.title} ${item.description || ""} ${item.language || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [items, query],
  );
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (
      !(form.content || "").replace(/<[^>]+>/g, " ").trim() &&
      !form.pages?.length
    )
      return setMessage("Add the complete Amol content before saving.");
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
        payload = {
          ...form,
          category: "Amol",
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
        response = await fetch(
          API +
            "/api/admin/library-books" +
            (form.slug ? "/" + encodeURIComponent(form.slug) : ""),
          {
            method: form.slug ? "PUT" : "POST",
            headers: headers(),
            body: JSON.stringify(payload),
          },
        ),
        body = await parse(response);
      if (!response.ok) throw Error(body.message);
      commitRichTextUploads();
      setMessage(body.message || "Amol saved successfully.");
      setForm(blank);
      await load();
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };
  const getFull = async (item: any) => {
    const response = await fetch(
        API + "/api/admin/library-books/" + encodeURIComponent(item.slug),
        { headers: headers() },
      ),
      body = await parse(response);
    if (!response.ok) throw Error(body.message);
    return body.data;
  };
  const edit = async (item: any) => {
    setWorking(item.slug);
    try {
      setForm({ ...blank, ...(await getFull(item)), category: "Amol" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setWorking("");
    }
  };
  const view = async (item: any) => {
    setWorking(item.slug);
    try {
      setPreview(await getFull(item));
      setOpenPreviewPart(null);
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setWorking("");
    }
  };
  const remove = async (item: any) => {
    if (!confirm("Remove " + item.title + "?")) return;
    setWorking(item.slug);
    try {
      const response = await fetch(
          API + "/api/admin/library-books/" + encodeURIComponent(item.slug),
          { method: "DELETE", headers: headers() },
        ),
        body = await parse(response);
      if (!response.ok) throw Error(body.message);
      setMessage(body.message);
      if (body.data?.status !== "pending")
        setItems((rows) => rows.filter((row) => row.slug !== item.slug));
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setWorking("");
    }
  };
  const languageCount = (code: string) =>
    items.filter((item) => (item.languageCode || "en") === code).length;
  return (
    <main>
      <header>
        <div>
          <Link href="/">{"\u2039"} Back to Dashboard</Link>
          <small>DAILY DEEDS CONTENT</small>
          <h1>Amol Content</h1>
          <p>
            Create and manage worship, Sunnah practices and beneficial daily
            deeds.
          </p>
        </div>
        <b>
          {items.length}
          <span>AMOL SAVED</span>
        </b>
      </header>
      {message && <div className="message">{message}</div>}
      <section className="layout">
        <form className="panel" onSubmit={save}>
          <div className="panelHead">
            <div>
              <small>{form.slug ? "EDIT AMOL" : "NEW AMOL"}</small>
              <h2>
                {form.slug ? form.title || "Edit Amol" : "Add daily Amol"}
              </h2>
            </div>
            <button disabled={saving}>
              {saving ? "Saving..." : "Save Amol"}
            </button>
          </div>
          <div className="categoryLock">
            <span>CONTENT CATEGORY</span>
            <b>Amol</b>
            <small>
              This page always saves content inside the Amol section.
            </small>
          </div>
          <div className="fields">
            <label>
              Content language
              <AdminLanguagePicker
                section="Amol"
                value={form.languageCode}
                onChange={(code) => {
                  const selected = ADMIN_LANGUAGES.find(
                    (item) => item.code === code,
                  );
                  setForm({
                    ...form,
                    languageCode: code,
                    language: selected?.label || code.toUpperCase(),
                  });
                }}
                statusFor={(code) =>
                  languageCount(code)
                    ? `${languageCount(code)} Amol uploaded`
                    : "Not uploaded yet"
                }
                completeFor={(code) => languageCount(code) > 0}
              />
            </label>
            <label>
              Amol title
              <input
                required
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                placeholder="e.g. Morning Adhkar"
              />
            </label>
            <label>
              Writer / reviewer
              <input
                value={form.author}
                onChange={(event) =>
                  setForm({ ...form, author: event.target.value })
                }
              />
            </label>
            <label>
              Verified source
              <input
                value={form.sourceUrl}
                onChange={(event) =>
                  setForm({ ...form, sourceUrl: event.target.value })
                }
                placeholder="Quran, Hadith or scholarly reference"
              />
            </label>
            <label className="wide">
              Short introduction
              <textarea
                required
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="What this Amol is, its benefit and when it is performed"
              />
            </label>
            <div className="wide editor">
              <label>Complete Amol pages</label>
              <BookPageBuilder
                pages={form.pages || []}
                content={form.content || ""}
                api={API}
                token={token}
                language={form.language}
                recordId={`amol:${form.slug || "new"}:${form.languageCode}`}
                onMessage={setMessage}
                onChange={(pages, content) =>
                  setForm({ ...form, pages, content })
                }
              />
            </div>
            <label className="publish">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) =>
                  setForm({ ...form, published: event.target.checked })
                }
              />{" "}
              Publish in mobile app
            </label>
          </div>
          {form.slug && (
            <button
              type="button"
              className="clear"
              onClick={() => setForm(blank)}
            >
              Cancel editing
            </button>
          )}
        </form>
        <section className="panel library">
          <div className="libraryHead">
            <div>
              <small>AMOL LIBRARY</small>
              <h2>Saved Amol</h2>
              <p>
                {visible.length} of {items.length} items
              </p>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Amol..."
            />
          </div>
          {loading ? (
            <p className="empty">Loading Amol content...</p>
          ) : (
            visible.map((item) => (
              <article key={item.slug}>
                <div className="number">
                  {String(items.indexOf(item) + 1).padStart(2, "0")}
                </div>
                <div>
                  <b>{item.title}</b>
                  <small>
                    {item.language || "English"} ·{" "}
                    {item.published === false ? "Draft" : "Published"}
                  </small>
                  <p>{item.description || "No introduction"}</p>
                </div>
                <nav>
                  <button
                    className="view"
                    disabled={working === item.slug}
                    onClick={() => void view(item)}
                  >
                    View
                  </button>
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
            <p className="empty">No Amol content found.</p>
          )}
        </section>
      </section>
      {preview && (
        <div className="modal" role="dialog" aria-modal="true">
          <section>
            <button className="modalClose" onClick={() => setPreview(null)}>
              ×
            </button>
            <small>APP & WEB PREVIEW</small>
            <h2>{preview.title}</h2>
            <p className="modalIntro">{preview.description}</p>
            <div className="previewParts">
              {(preview.pages?.length
                ? preview.pages
                : [{ title: preview.title, markdown: preview.content }]
              ).map((part: any, index: number) => {
                const opened = openPreviewPart === index;
                const content = part.markdown || part.text || "";
                return (
                  <article key={index}>
                    <button
                      type="button"
                      className="previewPartHead"
                      onClick={() => setOpenPreviewPart(opened ? null : index)}
                    >
                      <span>
                        <b>PART {String(index + 1).padStart(2, "0")}</b>
                        <strong>{part.title || preview.title}</strong>
                      </span>
                      <i>{opened ? "−" : "+"}</i>
                    </button>
                    {opened && (
                      <div className="previewPartBody">
                        {/<[a-z][\s\S]*>/i.test(content) ? (
                          <div dangerouslySetInnerHTML={{ __html: content }} />
                        ) : (
                          content
                            .split(/\n{2,}/)
                            .filter(Boolean)
                            .map((paragraph: string, row: number) => (
                              <p key={row}>
                                {paragraph.replace(/^#{1,6}\s+/, "")}
                              </p>
                            ))
                        )}
                        {(part.reference || preview.sourceUrl) && (
                          <aside>
                            <small>VERIFIED SOURCE</small>
                            <b>{part.reference || preview.sourceUrl}</b>
                          </aside>
                        )}
                      </div>
                    )}
                  </article>
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
          max-width: 1450px;
          margin-left: auto;
          margin-right: auto;
        }
        header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 27px 32px;
          border-radius: 22px;
          background:
            radial-gradient(circle at 88% 15%, #e4bd4b3b, transparent 26%),
            linear-gradient(135deg, #064b32, #088154);
          color: #fff;
          box-shadow: 0 18px 42px #16452d24;
        }
        header a {
          color: #def1e4;
          text-decoration: none;
        }
        header small,
        .panelHead small,
        .libraryHead small {
          display: block;
          color: #d9bd65;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.1px;
        }
        header h1 {
          margin: 6px 0;
        }
        header p {
          margin: 0;
          color: #dfeee5;
        }
        header > b {
          min-width: 88px;
          padding: 14px;
          border: 1px solid #ffffff38;
          border-radius: 16px;
          background: #ffffff16;
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
          grid-template-columns: 1.08fr 0.92fr;
          gap: 18px;
          margin-top: 18px;
        }
        .panel {
          padding: 22px;
          border: 1px solid #d7e6db;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 12px 32px #163d2e0d;
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
          cursor: pointer;
          transition:
            transform 0.18s,
            box-shadow 0.18s;
        }
        .panelHead button:hover,
        .library button:hover {
          transform: translateY(-1px);
          box-shadow: 0 7px 16px #087a4d24;
        }
        .panelHead button:disabled,
        .library button:disabled {
          cursor: wait;
          opacity: 0.55;
        }
        .categoryLock {
          margin-top: 17px;
          padding: 14px;
          border-left: 4px solid #d0a93b;
          border-radius: 12px;
          background: #fff9e7;
        }
        .categoryLock span,
        .categoryLock b,
        .categoryLock small {
          display: block;
        }
        .categoryLock span {
          font-size: 8px;
          font-weight: 900;
          color: #9b7821;
        }
        .categoryLock b {
          margin-top: 4px;
          font-size: 17px;
        }
        .categoryLock small {
          margin-top: 3px;
          color: #756b4e;
        }
        .fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 13px;
          margin-top: 16px;
        }
        .wide {
          grid-column: 1/-1;
        }
        label {
          font-size: 11px;
          font-weight: 800;
        }
        input,
        textarea {
          width: 100%;
          margin-top: 6px;
          padding: 11px;
          border: 1px solid #cbded1;
          border-radius: 9px;
          background: #fff;
          color: #173d2e;
          outline: none;
          transition:
            border-color 0.18s,
            box-shadow 0.18s;
        }
        input:focus,
        textarea:focus {
          border-color: #57aa7c;
          box-shadow: 0 0 0 3px #087a4d14;
        }
        textarea {
          min-height: 90px;
          resize: vertical;
        }
        .editor {
          display: grid;
          gap: 7px;
        }
        .editor :global(.richEditorBody) {
          min-height: 360px;
        }
        .publish {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 13px 15px;
          border: 1px solid #cde1d3;
          border-radius: 12px;
          background: #f1f8f3;
        }
        .publish input {
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
          position: sticky;
          top: 0;
          z-index: 2;
          margin: -8px -8px 0;
          padding: 8px 8px 14px;
          border-bottom: 1px solid #e1ebe4;
          background: #fff;
        }
        .libraryHead input {
          width: 240px;
          margin: 0;
        }
        .library article {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin-top: 10px;
          padding: 14px;
          border: 1px solid #e0ebe3;
          border-radius: 14px;
          background: #fbfdfb;
          transition:
            border-color 0.18s,
            box-shadow 0.18s;
        }
        .library article:hover {
          border-color: #9bc9ab;
          box-shadow: 0 8px 20px #173d2e0d;
        }
        .number {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          flex: none;
          border-radius: 13px;
          background: #e5f3e9;
          color: #087a4d;
          font-size: 10px;
          font-weight: 900;
        }
        .library article > div:nth-child(2) {
          min-width: 0;
          flex: 1;
        }
        .library article b,
        .library article small {
          display: block;
        }
        .library article small {
          margin-top: 4px;
          color: #9a7925;
        }
        .library article p {
          margin: 7px 0;
          color: #65766d;
          font-size: 11px;
          line-height: 1.45;
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
        .library .view {
          background: #e5f3e9;
          color: #087a4d;
        }
        .empty {
          margin-top: 12px;
          padding: 70px 25px;
          border: 1px dashed #bfd8c7;
          border-radius: 15px;
          background: #f7fbf8;
          text-align: center;
          color: #758179;
        }
        .modal {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: grid;
          place-items: center;
          padding: 24px;
          background: #102d23b8;
          backdrop-filter: blur(5px);
        }
        .modal > section {
          width: min(760px, 100%);
          max-height: 90vh;
          overflow: auto;
          position: relative;
          padding: 28px;
          border-radius: 22px;
          background: #fff;
          box-shadow: 0 28px 80px #071d1652;
        }
        .modal > section > small {
          color: #a27f24;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1px;
        }
        .modal h2 {
          margin: 6px 45px 6px 0;
          font-family: Georgia, serif;
          font-size: 28px;
        }
        .modalIntro {
          color: #65766d;
          line-height: 1.6;
        }
        .modalClose {
          width: 38px;
          height: 38px;
          position: absolute;
          top: 18px;
          right: 18px;
          border: 0;
          border-radius: 50%;
          background: #e7f3eb;
          color: #087a4d;
          font-size: 23px;
          cursor: pointer;
        }
        .previewParts {
          display: grid;
          gap: 10px;
          margin-top: 20px;
        }
        .previewParts article {
          overflow: hidden;
          border: 1px solid #d8e7dc;
          border-radius: 14px;
          background: #f8fbf9;
        }
        .previewPartHead {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 17px;
          border: 0;
          background: transparent;
          color: #173d2e;
          text-align: left;
          cursor: pointer;
        }
        .previewPartHead span,
        .previewPartHead b,
        .previewPartHead strong {
          display: block;
        }
        .previewPartHead b {
          color: #a27f24;
          font-size: 8px;
          letter-spacing: 1px;
        }
        .previewPartHead strong {
          margin-top: 4px;
        }
        .previewPartHead i {
          font-size: 21px;
          font-style: normal;
        }
        .previewPartBody {
          padding: 17px;
          border-top: 1px solid #deebe2;
          background: #fff;
          line-height: 1.75;
        }
        .previewPartBody :global(img) {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
        }
        .previewPartBody aside {
          margin-top: 16px;
          padding: 12px;
          border-left: 3px solid #d0ad45;
          border-radius: 8px;
          background: #fff8df;
        }
        .previewPartBody aside small,
        .previewPartBody aside b {
          display: block;
        }
        @media (max-width: 950px) {
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
          .libraryHead input {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
