"use client";
import AdminLanguagePicker, {
  ADMIN_LANGUAGES,
} from "../components/AdminLanguagePicker";
import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { transliterate } from "transliteration";
import BaseRichTextEditor, {
  commitRichTextUploads,
} from "../islamic-lifestyle/RichTextEditor";
import { deleteManagedImage, uploadImageToS3 } from "../lib/imageUpload";
const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");
const RichTextEditor = (
  props: Parameters<typeof BaseRichTextEditor>[0],
) => <BaseRichTextEditor {...props} cleanupUnsavedImages />;
const defaultCollections = [
  ["b", "Sahih al-Bukhari"],
  ["m", "Sahih Muslim"],
  ["a", "Sunan Abu Dawood"],
  ["t", "Jami' at-Tirmidhi"],
  ["s", "Sunan an-Nasa'i"],
  ["i", "Sunan Ibn Majah"],
  ["malik", "Muwatta Malik"],
  ["q", "Forty Hadith Qudsi"],
  ["n", "Forty Hadith Nawawi"],
];
const empty = {
  id: "",
  collectionId: "b",
  collectionName: "Sahih al-Bukhari",
  book: "1",
  sectionName: "",
  hadithNumber: "",
  title: "",
  arabic: "",
  pronunciation: "",
  text: "",
  narrator: "",
  grade: "",
  explanation: "",
  reference: "",
  source: "",
  published: true,
};
const emptyBook = {
  id: "",
  collectionId: "",
  collectionName: "",
  arabicTitle: "",
  author: "",
  coverImageUrl: "",
  coverImageKey: "",
  hadithCount: 0,
  category: "Major",
  languages: "English",
  mark: "",
  published: true,
};
export default function HadithAdmin() {
  const [token, setToken] = useState(""),
    [items, setItems] = useState<any[]>([]),
    [bookCards, setBookCards] = useState<any[]>([]),
    [bookForm, setBookForm] = useState<any>(emptyBook),
    [bookSaving, setBookSaving] = useState(false),
    [coverUploading, setCoverUploading] = useState(false),
    [existing, setExisting] = useState<any[]>([]),
    [existingLoading, setExistingLoading] = useState(false),
    [form, setForm] = useState<any>(empty),
    [language, setLanguage] = useState("en"),
    [languages, setLanguages] = useState<any[]>(ADMIN_LANGUAGES),
    [query, setQuery] = useState(""),
    [message, setMessage] = useState(""),
    [saving, setSaving] = useState(false);
  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  });
  useEffect(() => {
    setToken(sessionStorage.getItem("deenislam_admin_token") || "");
    fetch(API + "/api/translate/languages")
      .then((r) => r.json())
      .then((j) => Array.isArray(j.data) && setLanguages(j.data))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (token) load();
  }, [token]);
  useEffect(() => {
    if (!token) return;
    setExistingLoading(true);
    fetch(API + "/api/admin/hadith/existing/" + form.collectionId, {
      headers: headers(),
    })
      .then((r) => r.json())
      .then((j) => setExisting(j.data || []))
      .catch(() => setExisting([]))
      .finally(() => setExistingLoading(false));
  }, [token, form.collectionId]);
  async function load() {
    const [hadithResponse, cardResponse] = await Promise.all([
        fetch(API + "/api/admin/hadith", { headers: headers() }),
        fetch(API + "/api/admin/hadith/collections", { headers: headers() }),
      ]),
      [hadithJson, cardJson] = await Promise.all([
        hadithResponse.json(),
        cardResponse.json(),
      ]);
    if (hadithResponse.ok) setItems(hadithJson.data || []);
    else setMessage(hadithJson.message);
    if (cardResponse.ok) setBookCards(cardJson.data || []);
  }
  const collections = useMemo(() => {
    const map = new Map(defaultCollections as any);
    bookCards.forEach((x) => map.set(x.collectionId, x.collectionName));
    return Array.from(map.entries()) as string[][];
  }, [bookCards]);
  async function uploadCover(file?: File) {
    if (!file) return;
    setCoverUploading(true);
    try {
      const payload = await uploadImageToS3(API, token, file);
      setBookForm((x: any) => ({
        ...x,
        coverImageUrl: payload.publicUrl,
        coverImageKey: payload.key,
      }));
      setMessage("Cover converted to WebP and uploaded successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Cover upload failed.",
      );
    } finally {
      setCoverUploading(false);
    }
  }
  async function saveBook(e: FormEvent) {
    e.preventDefault();
    setBookSaving(true);
    const url =
        API +
        "/api/admin/hadith/collections" +
        (bookForm.id ? "/" + bookForm.id : ""),
      response = await fetch(url, {
        method: bookForm.id ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify(bookForm),
      }),
      payload = await response.json();
    setMessage(payload.message || "Done");
    if (response.ok) {
      setBookForm(emptyBook);
      await load();
    }
    setBookSaving(false);
  }
  async function edit(row: any, lang = language) {
    const t = lang === "en" ? row : row.translations?.[lang] || {};
    const generatedPronunciation =
      lang === "en" && row.arabic && !t.pronunciation
        ? transliterate(row.arabic)
        : "";
    let explanation = t.explanation || "";
    let source = t.source || "";
    if (lang === "en" && row.external && !explanation) {
      try {
        const response = await fetch(
            API + "/api/admin/hadith/commentary-match",
            {
              method: "POST",
              headers: headers(),
              body: JSON.stringify({ text: row.text, arabic: row.arabic }),
            },
          ),
          result = await response.json();
        if (response.ok && result.data) {
          explanation = result.data.explanation || "";
          source = result.data.source || source;
        }
      } catch {}
    }
    setForm({
      ...empty,
      ...row,
      ...t,
      explanation,
      source,
      pronunciation: t.pronunciation || generatedPronunciation,
      id: row.external ? "" : row.id,
      collectionId: row.collectionId,
      collectionName: row.collectionName,
      arabic: row.arabic,
      published: row.published !== false,
    });
    setLanguage(lang);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (language !== "en" && !form.id)
      return setMessage(
        "First choose an English Hadith from the library, then add its translation.",
      );
    setSaving(true);
    const r = await fetch(
        API + "/api/admin/hadith" + (form.id ? "/" + form.id : ""),
        {
          method: form.id ? "PUT" : "POST",
          headers: headers(),
          body: JSON.stringify({ ...form, language }),
        },
      ),
      j = await r.json();
    setMessage(j.message || "Done");
    if (r.ok) {
      commitRichTextUploads();
      setForm(empty);
      setLanguage("en");
      await load();
    }
    setSaving(false);
  }
  const languageRows = useMemo(
    () =>
      language === "en"
        ? [
            ...items,
            ...existing.filter(
              (x) =>
                !items.some(
                  (saved) =>
                    saved.collectionId === x.collectionId &&
                    String(saved.hadithNumber) === String(x.hadithNumber),
                ),
            ),
          ]
        : items
            .filter((x) => x.translations?.[language])
            .map((x) => ({
              ...x,
              ...x.translations[language],
              id: x.id,
              arabic: x.arabic,
              translations: x.translations,
              published: x.published,
            })),
    [items, existing, language],
  );
  const visible = useMemo(
    () =>
      languageRows
        .filter((x) =>
          `${x.collectionName} ${x.hadithNumber} ${x.title} ${x.text}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .slice(0, 250),
    [languageRows, query],
  );
  const set = (key: string, value: any) =>
    setForm((x: any) => ({ ...x, [key]: value }));
  return (
    <main>
      <header>
        <div>
          <Link href="/">‹ Back to Dashboard</Link>
          <small>HADITH CONTENT MANAGEMENT</small>
          <h1>Hadith Library</h1>
          <p>
            Add verified Hadith and manage translations from your own database.
          </p>
        </div>
        <b>
          {items.length}
          <span>HADITH SAVED</span>
        </b>
      </header>
      {message && <div className="message">{message}</div>}
      <div className="bookManagerLink">
        <Link href="/hadith-books">
          Manage Hadith book cards on separate page →
        </Link>
      </div>
      <section className="bookManager" hidden>
        <form onSubmit={saveBook}>
          <div className="formHead">
            <div>
              <small>
                {bookForm.id ? "EDIT COLLECTION" : "NEW COLLECTION"}
              </small>
              <h2>
                {bookForm.id
                  ? "Update Hadith book card"
                  : "Add a new Hadith book"}
              </h2>
            </div>
            <button disabled={bookSaving || coverUploading}>
              {bookSaving ? "Saving..." : "Save Book Card"}
            </button>
          </div>
          <div className="grid">
            <label>
              Collection ID / URL slug
              <input
                required
                disabled={Boolean(bookForm.id)}
                value={bookForm.collectionId}
                placeholder="riyad-us-saliheen"
                onChange={(e) =>
                  setBookForm((x: any) => ({
                    ...x,
                    collectionId: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "-"),
                  }))
                }
              />
            </label>
            <label>
              English title
              <input
                required
                value={bookForm.collectionName}
                placeholder="Riyad us-Saliheen"
                onChange={(e) =>
                  setBookForm((x: any) => ({
                    ...x,
                    collectionName: e.target.value,
                  }))
                }
              />
            </label>
            <label>
              Arabic title
              <input
                dir="rtl"
                value={bookForm.arabicTitle}
                onChange={(e) =>
                  setBookForm((x: any) => ({
                    ...x,
                    arabicTitle: e.target.value,
                  }))
                }
              />
            </label>
            <label>
              Author / compiler
              <input
                value={bookForm.author}
                onChange={(e) =>
                  setBookForm((x: any) => ({ ...x, author: e.target.value }))
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
                {coverUploading
                  ? "Uploading..."
                  : bookForm.coverImageUrl
                    ? "Cover ready"
                    : "JPG, PNG or WebP"}
              </small>
            </label>
            <label>
              Or cover image URL
              <input
                value={bookForm.coverImageUrl}
                onChange={(e) =>
                  setBookForm((x: any) => ({
                    ...x,
                    coverImageUrl: e.target.value,
                  }))
                }
              />
            </label>
            <label>
              Total Hadith
              <input
                type="number"
                min="0"
                value={bookForm.hadithCount}
                onChange={(e) =>
                  setBookForm((x: any) => ({
                    ...x,
                    hadithCount: Number(e.target.value),
                  }))
                }
              />
            </label>
            <label>
              Section
              <select
                value={bookForm.category}
                onChange={(e) =>
                  setBookForm((x: any) => ({ ...x, category: e.target.value }))
                }
              >
                <option>Major</option>
                <option>Classical</option>
              </select>
            </label>
            <label>
              Languages
              <input
                value={bookForm.languages}
                placeholder="English, Arabic, Bengali"
                onChange={(e) =>
                  setBookForm((x: any) => ({ ...x, languages: e.target.value }))
                }
              />
            </label>
            <label>
              Fallback mark
              <input
                maxLength={8}
                value={bookForm.mark}
                placeholder="بخ"
                onChange={(e) =>
                  setBookForm((x: any) => ({ ...x, mark: e.target.value }))
                }
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={bookForm.published}
                onChange={(e) =>
                  setBookForm((x: any) => ({
                    ...x,
                    published: e.target.checked,
                  }))
                }
              />{" "}
              Publish in app and web
            </label>
          </div>
          <button
            type="button"
            className="clear"
            onClick={() => setBookForm(emptyBook)}
          >
            New card
          </button>
        </form>
        <div className="bookPreview">
          <small>LIVE CARD PREVIEW</small>
          <article>
            <div className="cover">
              {bookForm.coverImageUrl ? (
                <div><img src={bookForm.coverImageUrl} alt="Hadith cover preview" /><button type="button" onClick={() => void deleteManagedImage(API, token, { key: bookForm.coverImageKey, url: bookForm.coverImageUrl }).then(() => setBookForm((current: any) => ({ ...current, coverImageUrl: "", coverImageKey: "" }))).catch((error) => setMessage(error.message))}>Delete image</button></div>
              ) : (
                <b>{bookForm.mark || "◆"}</b>
              )}
            </div>
            <div>
              <h2>{bookForm.collectionName || "Hadith book title"}</h2>
              <p dir="rtl">{bookForm.arabicTitle || "العنوان العربي"}</p>
              <span>{bookForm.author || "Author / compiler"}</span>
              <small>
                ▣ {Number(bookForm.hadithCount || 0).toLocaleString()} Hadiths ·{" "}
                {bookForm.languages || "Multi Language"}
              </small>
            </div>
          </article>
          <b className="readPreview">Read Collection →</b>
          <div className="savedCards">
            {bookCards.map((card) => (
              <button
                type="button"
                key={card.id}
                onClick={() =>
                  setBookForm({
                    ...card,
                    languages: Array.isArray(card.languages)
                      ? card.languages.join(", ")
                      : card.languages || "",
                  })
                }
              >
                {card.collectionName}
                <span>{card.published ? "Published" : "Draft"}</span>
              </button>
            ))}
          </div>
          {bookForm.id && (
            <button
              className="delete"
              type="button"
              onClick={async () => {
                if (!confirm("Delete this empty collection card?")) return;
                const response = await fetch(
                    API + "/api/admin/hadith/collections/" + bookForm.id,
                    { method: "DELETE", headers: headers() },
                  ),
                  payload = await response.json();
                setMessage(payload.message);
                if (response.ok) {
                  setBookForm(emptyBook);
                  await load();
                }
              }}
            >
              Delete collection card
            </button>
          )}
        </div>
      </section>
      <div className="layout">
        <form onSubmit={save}>
          <div className="formHead">
            <div>
              <small>{form.id ? "EDIT HADITH" : "NEW HADITH"}</small>
              <h2>{form.id ? "Update content" : "Add verified Hadith"}</h2>
            </div>
            <button disabled={saving}>
              {saving ? "Saving..." : "Save Hadith"}
            </button>
          </div>
          <section className="language">
            <label>
              Content language
              <AdminLanguagePicker
                section="Hadith"
                value={language}
                onChange={(lang) => {
                  setLanguage(lang);
                  if (form.id)
                    edit(
                      items.find((x) => x.id === form.id),
                      lang,
                    );
                }}
                statusFor={(code) =>
                  code === "en"
                    ? "Original English content Â· Available"
                    : form.id &&
                        items.find((i) => i.id === form.id)?.translations?.[
                          code
                        ]
                      ? "Translation saved"
                      : "Not uploaded yet"
                }
                completeFor={(code) =>
                  code === "en" ||
                  items.some((i) => Boolean(i.translations?.[code]))
                }
              />
            </label>
            <span className={language === "en" ? "base" : "translation"}>
              {language === "en" ? "BASE CONTENT" : "TRANSLATION"}
            </span>
          </section>
          {language !== "en" && !form.id && (
            <label>
              Choose Hadith to translate
              <select
                value=""
                onChange={(e) =>
                  edit(
                    items.find((x) => x.id === e.target.value),
                    language,
                  )
                }
              >
                <option value="">Select English Hadith...</option>
                {items.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.collectionName} #{x.hadithNumber}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="grid">
            <label>
              Collection
              <select
                value={form.collectionId}
                onChange={(e) => {
                  const c = collections.find((x) => x[0] === e.target.value);
                  set("collectionId", e.target.value);
                  set("collectionName", c?.[1] || "");
                }}
              >
                {collections.map((x) => (
                  <option key={x[0]} value={x[0]}>
                    {x[1]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Book / chapter number
              <input
                value={form.book}
                onChange={(e) => set("book", e.target.value)}
              />
            </label>
            <label>
              Section name
              <input
                value={form.sectionName}
                onChange={(e) => set("sectionName", e.target.value)}
              />
            </label>
            <label>
              Hadith number
              <input
                required
                value={form.hadithNumber}
                onChange={(e) => set("hadithNumber", e.target.value)}
              />
            </label>
            <label className="wide">
              Title
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </label>
            {language === "en" && (
              <label className="wide">
                Arabic text
                <textarea
                  className="arabic"
                  dir="rtl"
                  value={form.arabic}
                  onChange={(e) => set("arabic", e.target.value)}
                />
              </label>
            )}
            <div className="wide pronunciationEditor">
              <label>Hadith pronunciation</label>
              <RichTextEditor
                value={form.pronunciation || ""}
                onChange={(html) => set("pronunciation", html)}
                api={API}
                token={token}
                onMessage={setMessage}
                recordId={`hadith-pronunciation:${form.id || form.collectionId + ":" + form.hadithNumber}:${language}`}
              />
            </div>
            <div className="wide hadithTextEditor">
              <label>
                {language === "en"
                  ? "English Hadith text"
                  : "Translated Hadith text"}
              </label>
              <RichTextEditor
                value={form.text || ""}
                onChange={(html) => set("text", html)}
                api={API}
                token={token}
                onMessage={setMessage}
                recordId={`hadith-text:${form.id || form.collectionId + ":" + form.hadithNumber}:${language}`}
              />
            </div>
            <label className="wide">
              Narrator
              <input
                value={form.narrator}
                onChange={(e) => set("narrator", e.target.value)}
              />
            </label>
            <label>
              Grade
              <input
                value={form.grade}
                onChange={(e) => set("grade", e.target.value)}
                placeholder="Sahih, Hasan..."
              />
            </label>
            <label>
              Reference
              <input
                value={form.reference}
                onChange={(e) => set("reference", e.target.value)}
                placeholder="Book and Hadith number"
              />
            </label>
            <div className="wide explanationEditor">
              <label>Explanation</label>
              <RichTextEditor
                value={form.explanation || ""}
                onChange={(html) => set("explanation", html)}
                api={API}
                token={token}
                onMessage={setMessage}
                recordId={`hadith:${form.id || form.collectionId + ":" + form.hadithNumber}:${language}`}
              />
            </div>
            <label className="wide">
              Verified source
              <input
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
              />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => set("published", e.target.checked)}
              />{" "}
              Publish in mobile app
            </label>
          </div>
          <button
            type="button"
            className="clear"
            onClick={() => {
              setForm(empty);
              setLanguage("en");
            }}
          >
            Clear form
          </button>
        </form>
        <section className="library">
          <div className="libraryHead">
            <div>
              <small>CONTENT LIBRARY</small>
              <h2>Saved & existing app Hadith</h2>
              <p>
                {language === "en"
                  ? existingLoading
                    ? "Loading existing app content..."
                    : `${existing.length} English records in selected collection`
                  : `${languageRows.length} Hadith translated in ${languages.find((x) => x.code === language)?.label || language.toUpperCase()}`}
              </p>
            </div>
            <input
              placeholder="Search Hadith number or text (e.g. 1, 7563)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="resultStatus">
            <b>
              {query
                ? `${visible.length} matching result(s) shown`
                : `Showing first ${Math.min(250, visible.length)} records`}
            </b>
            <span>
              {language === "en"
                ? `Total source records: ${existing.length}`
                : `Only saved ${languages.find((x) => x.code === language)?.label || language.toUpperCase()} translations are shown`}
            </span>
          </div>
          {visible.length ? (
            visible.map((x) => (
              <article key={x.id}>
                <i>{x.hadithNumber}</i>
                <div>
                  <small>
                    {x.collectionName} · Book {x.book}
                  </small>
                  <b>{x.title || `Hadith ${x.hadithNumber}`}</b>
                  <p>{x.text}</p>
                  <span>
                    {1 + Object.keys(x.translations || {}).length} language(s) ·{" "}
                    {x.published ? "Published" : "Draft"}
                  </span>
                </div>
                <nav>
                  <button onClick={() => edit(x, language)}>
                    {x.external ? "Import & Edit" : "Edit"}
                  </button>
                  {!x.external && (
                    <button
                      className="delete"
                      onClick={async () => {
                        if (!confirm("Delete this Hadith?")) return;
                        await fetch(API + "/api/admin/hadith/" + x.id, {
                          method: "DELETE",
                          headers: headers(),
                        });
                        await load();
                      }}
                    >
                      Delete
                    </button>
                  )}
                </nav>
              </article>
            ))
          ) : (
            <div className="noResults">
              <b>No content found for this language</b>
              <span>
                {language === "en"
                  ? "Try another Hadith number or text."
                  : "Import an English Hadith, then save its translation in the selected language."}
              </span>
            </div>
          )}
        </section>
      </div>
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
        .layout,
        .message {
          max-width: 1300px;
          margin: auto;
        }
        header {
          display: flex;
          justify-content: space-between;
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
        .formHead small,
        .libraryHead small {
          display: block;
          margin-top: 7px;
          color: #d8ba5d;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1px;
        }
        header h1 {
          margin: 5px 0;
        }
        header p {
          margin: 0;
        }
        header > b {
          font-size: 28px;
          text-align: center;
        }
        header > b span {
          display: block;
          font-size: 8px;
        }
        .message {
          margin-top: 12px;
          padding: 12px;
          border-radius: 10px;
          background: #e2f3e7;
        }
        .layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-top: 18px;
        }
        .layout > form,
        .library {
          padding: 22px;
          border: 1px solid #d6e5da;
          border-radius: 20px;
          background: #fff;
        }
        .formHead,
        .libraryHead,
        .language {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .formHead > div,
        .libraryHead > div,
        .language label {
          flex: 1;
        }
        .formHead h2,
        .libraryHead h2 {
          margin: 4px 0;
        }
        .language {
          margin: 16px 0;
          padding: 14px;
          border-radius: 14px;
          background: #eff8f2;
        }
        .language span {
          padding: 7px 9px;
          border-radius: 9px;
          background: #e3f2e7;
          color: #087a4d;
          font-size: 9px;
          font-weight: 900;
        }
        .grid {
          display: grid;
          grid-template-columns-columns: 1fr 1fr;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 14px;
        }
        label {
          font-size: 11px;
          font-weight: 800;
        }
        .wide {
          grid-column: 1/-1;
        }
        input,
        select,
        textarea {
          width: 100%;
          margin-top: 6px;
          padding: 11px;
          border: 1px solid #c8dccf;
          border-radius: 9px;
          background: #fff;
        }
        .arabic {
          min-height: 100px;
          font-size: 22px;
          line-height: 1.8;
        }
        .pronunciation {
          min-height: 90px;
          background: #fffaf0;
          border-color: #dfcf9e;
        }
        .story {
          min-height: 170px;
        }
        .pronunciationEditor,
        .hadithTextEditor,
        .explanationEditor {
          display: grid;
          gap: 6px;
        }
        .pronunciationEditor :global(.richEditorBody) {
          min-height: 220px;
        }
        .hadithTextEditor :global(.richEditorBody) {
          min-height: 320px;
        }
        .explanationEditor {
          display: grid;
          gap: 6px;
        }
        .explanationEditor :global(.richEditorBody) {
          min-height: 280px;
        }
        textarea {
          min-height: 90px;
          resize: vertical;
        }
        button {
          padding: 10px 13px;
          border: 0;
          border-radius: 9px;
          background: #087a4d;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
        }
        .check {
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .check input {
          width: auto;
          margin: 0;
        }
        .clear {
          margin-top: 14px;
          background: #e9f2ec;
          color: #174432;
        }
        .libraryHead input {
          width: 310px;
        }
        .resultStatus {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin: 14px 0;
          padding: 10px 12px;
          border-radius: 10px;
          background: #eef7f1;
          color: #496458;
          font-size: 10px;
        }
        .noResults {
          padding: 70px 20px;
          text-align: center;
          color: #687a71;
        }
        .noResults b,
        .noResults span {
          display: block;
        }
        .noResults span {
          margin-top: 7px;
        }
        .library article {
          display: flex;
          gap: 11px;
          padding: 14px 0;
          border-bottom: 1px solid #e2ebe5;
        }
        .library article > i {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          flex: none;
          border-radius: 12px;
          background: #087a4d;
          color: #fff;
          font-style: normal;
          font-weight: 900;
        }
        .library article > div {
          min-width: 0;
          flex: 1;
        }
        .library article small,
        .library article b,
        .library article span {
          display: block;
        }
        .library article p {
          max-height: 42px;
          overflow: hidden;
          margin: 5px 0;
          color: #66776e;
          font-size: 10px;
        }
        .library article span {
          font-size: 9px;
          color: #087a4d;
        }
        .library nav {
          display: flex;
          gap: 5px;
          align-items: center;
        }
        .delete {
          background: #bc503d;
        }
        @media (max-width: 900px) {
          main {
            padding: 14px;
          }
          .layout {
            grid-template-columns: 1fr;
          }
          .grid {
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
      <style jsx>{`
        .bookManager[hidden] {
          display: none !important;
        }
        .bookManagerLink {
          max-width: 1300px;
          margin: 18px auto 0;
        }
        .bookManagerLink a {
          display: block;
          padding: 14px 18px;
          border: 1px solid #cfe1d5;
          border-radius: 12px;
          background: #fff;
          color: #087a4d;
          font-weight: 800;
          text-align: center;
          text-decoration: none;
        }
        .bookManagerLink a:hover {
          background: #e7f5ec;
        }
      `}</style>
    </main>
  );
}
