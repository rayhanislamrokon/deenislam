"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");
export default function BookLibrary() {
  const [token, setToken] = useState(""),
    [books, setBooks] = useState<any[]>([]),
    [languages, setLanguages] = useState<any[]>([]),
    [query, setQuery] = useState(""),
    [language, setLanguage] = useState(""),
    [status, setStatus] = useState(""),
    [preview, setPreview] = useState<any | null>(null),
    [loading, setLoading] = useState(true),
    [message, setMessage] = useState(""),
    [pdfFile, setPdfFile] = useState<File | null>(null),
    [pdfTitle, setPdfTitle] = useState(""),
    [pdfAuthor, setPdfAuthor] = useState("DeenIslam Editorial"),
    [pdfLanguage, setPdfLanguage] = useState("en"),
    [pdfPublished, setPdfPublished] = useState(true),
    [pdfBusy, setPdfBusy] = useState(false),
    [pdfProgress, setPdfProgress] = useState(0),
    [editing, setEditing] = useState<any | null>(null),
    [editBusy, setEditBusy] = useState(false);
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  };
  useEffect(() => {
    const next = sessionStorage.getItem("deenislam_admin_token") || "";
    setToken(next);
    fetch(API + "/api/translate/languages")
      .then((r) => r.json())
      .then((j) => setLanguages(j.data || []))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (token) load();
  }, [token]);
  async function load() {
    setLoading(true);
    const r = await fetch(API + "/api/admin/library-books", { headers }),
      j = await r.json();
    if (r.ok)
      setBooks(
        (j.data || []).filter(
          (book: any) =>
            !["Sahaba", "Male Sahaba", "Female Sahabiyat", "Amol"].includes(
              book.category,
            ),
        ),
      );
    else setMessage(j.message || "Unable to load books");
    setLoading(false);
  }
  const visible = useMemo(
    () =>
      books.filter(
        (book) =>
          (!language || book.languageCode === language) &&
          (!status ||
            (status === "published"
              ? book.published !== false
              : book.published === false)) &&
          (!query ||
            `${book.title} ${book.author || ""} ${book.category || ""} ${book.language || ""}`
              .toLowerCase()
              .includes(query.toLowerCase())),
      ),
    [books, language, status, query],
  );
  async function view(book: any) {
    setMessage("Loading complete book...");
    const r = await fetch(
        API + "/api/admin/library-books/" + encodeURIComponent(book.slug),
        { headers },
      ),
      j = await r.json();
    if (r.ok) {
      setPreview(j.data);
      setMessage("");
    } else setMessage(j.message || "Unable to open book");
  }
  async function edit(book: any) {
    setMessage("Loading book for editing...");
    const r = await fetch(
        API + "/api/admin/library-books/" + encodeURIComponent(book.slug),
        { headers },
      ),
      j = await r.json();
    if (r.ok) {
      setEditing(j.data);
      setMessage("");
    } else setMessage(j.message || "Unable to load this book.");
  }
  async function updateBook(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setEditBusy(true);
    setMessage("Updating book...");
    try {
      const r = await fetch(
          API + "/api/admin/library-books/" + encodeURIComponent(editing.slug),
          { method: "PUT", headers, body: JSON.stringify(editing) },
        ),
        j = await r.json();
      if (!r.ok) throw Error(j.message || "Unable to update this book.");
      setBooks((rows) =>
        rows.map((book) =>
          book.slug === editing.slug
            ? {
                ...book,
                ...j.data,
                pageCount: book.pageCount,
                partCount: book.partCount,
              }
            : book,
        ),
      );
      setEditing(null);
      setMessage(j.message || "Book updated successfully.");
    } catch (error: any) {
      setMessage(error.message || "Unable to update this book.");
    } finally {
      setEditBusy(false);
    }
  }
  async function remove(book: any) {
    if (!confirm(`Delete “${book.title}” permanently?`)) return;
    const r = await fetch(
        API + "/api/admin/library-books/" + encodeURIComponent(book.slug),
        { method: "DELETE", headers },
      ),
      j = await r.json();
    setMessage(j.message || "Done");
    if (r.ok) setBooks((rows) => rows.filter((x) => x.slug !== book.slug));
  }
  async function importPdf(event: React.FormEvent) {
    event.preventDefault();
    if (!pdfFile) {
      setMessage("Select a PDF book first.");
      return;
    }
    const selectedLanguage =
      languages.find((item) => item.code === pdfLanguage) || null;
    const languageName = selectedLanguage?.label || "English";
    setPdfBusy(true);
    setPdfProgress(15);
    setMessage("Reading PDF pages and extracting book text...");
    try {
      const form = new FormData();
      form.append("pdf", pdfFile);
      form.append("language", languageName);
      const extracted = await fetch(API + "/api/admin/books/extract-pdf", {
          method: "POST",
          headers: { Authorization: "Bearer " + token },
          body: form,
        }),
        extractedBody = await extracted.json();
      if (!extracted.ok)
        throw Error(extractedBody.message || "Unable to read this PDF.");
      setPdfProgress(75);
      setMessage("Saving extracted pages to the book library...");
      const report = extractedBody.data,
        title =
          pdfTitle.trim() || pdfFile.name.replace(/\.pdf$/i, "").trim(),
        saved = await fetch(API + "/api/admin/library-books", {
          method: "POST",
          headers,
          body: JSON.stringify({
            title,
            author: pdfAuthor.trim() || "DeenIslam Editorial",
            category: "Books",
            language: languageName,
            languageCode: pdfLanguage,
            description: `Imported from ${pdfFile.name}`,
            license: "Public domain",
            publicDomain: true,
            published: pdfPublished,
            coverImageUrl: "",
            coverImageKey: "",
            content: report.text,
            pages: report.pages || [],
            extraction: {
              method: report.method,
              pageCount: report.pageCount,
              averageConfidence: report.averageConfidence,
              needsReview: report.needsReview || [],
              sourceFile: report.fileName,
              extractedAt: new Date().toISOString(),
            },
          }),
        }),
        savedBody = await saved.json();
      if (!saved.ok)
        throw Error(savedBody.message || "Unable to save this PDF book.");
      setBooks((rows) => [
        {
          ...savedBody.data,
          pageCount: report.pageCount,
          partCount: report.pageCount,
        },
        ...rows,
      ]);
      setPdfProgress(100);
      setPdfFile(null);
      setPdfTitle("");
      const input = document.getElementById("pdf-book-file") as HTMLInputElement;
      if (input) input.value = "";
      setMessage(
        `${title} imported successfully with ${report.pageCount} pages.`,
      );
    } catch (error: any) {
      setPdfProgress(0);
      setMessage(error.message || "PDF import failed.");
    } finally {
      setPdfBusy(false);
    }
  }
  return (
    <main>
      <header>
        <div>
          <Link href="/" target="_top">
            ‹ Back to Dashboard
          </Link>
          <small>BOOK CONTENT MANAGEMENT</small>
          <h1>PDF Books Manager</h1>
          <p>Upload PDF books, extract their pages and manage the library.</p>
        </div>
        <b>
          {visible.length}
          <span>OF {books.length} BOOKS</span>
        </b>
      </header>
      {message && <div className="message">{message}</div>}
      <form className="pdfImporter" onSubmit={importPdf}>
        <div className="pdfImporterHead">
          <div>
            <small>PDF BOOK UPLOAD</small>
            <h2>Import a PDF book</h2>
            <p>
              The PDF is converted into readable pages. The original PDF file
              is discarded after processing.
            </p>
          </div>
          <strong>{pdfProgress}%</strong>
        </div>
        <div className="pdfFields">
          <label className="pdfFile">
            PDF file
            <input
              id="pdf-book-file"
              type="file"
              accept="application/pdf,.pdf"
              disabled={pdfBusy}
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setPdfFile(file);
                if (file && !pdfTitle)
                  setPdfTitle(file.name.replace(/\.pdf$/i, ""));
              }}
            />
          </label>
          <label>
            Book title
            <input
              value={pdfTitle}
              disabled={pdfBusy}
              placeholder="Defaults to PDF filename"
              onChange={(event) => setPdfTitle(event.target.value)}
            />
          </label>
          <label>
            Writer / editor
            <input
              value={pdfAuthor}
              disabled={pdfBusy}
              onChange={(event) => setPdfAuthor(event.target.value)}
            />
          </label>
          <label>
            Content language
            <select
              value={pdfLanguage}
              disabled={pdfBusy}
              onChange={(event) => setPdfLanguage(event.target.value)}
            >
              {languages.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="pdfImportActions">
          <label>
            <input
              type="checkbox"
              checked={pdfPublished}
              disabled={pdfBusy}
              onChange={(event) => setPdfPublished(event.target.checked)}
            />
            Publish in app and web
          </label>
          <button type="submit" disabled={pdfBusy || !pdfFile}>
            {pdfBusy ? "Importing PDF..." : "Upload & Import PDF"}
          </button>
        </div>
        <div className="pdfProgress">
          <i style={{ width: `${pdfProgress}%` }} />
        </div>
      </form>
      <section className="toolbar">
        <label>
          Find a book
          <input
            placeholder="Title, author or category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Language
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="">All languages</option>
            {languages.map((x) => (
              <option key={x.code} value={x.code}>
                {x.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </label>
        <button
          disabled={!query && !language && !status}
          onClick={() => {
            setQuery("");
            setLanguage("");
            setStatus("");
          }}
        >
          Clear filters
        </button>
      </section>
      <section className="library">
        {loading ? (
          <div className="empty">Loading books...</div>
        ) : (
          visible.map((book) => (
            <article key={book.slug}>
              {book.coverImageUrl ? (
                <img src={book.coverImageUrl} alt="" />
              ) : (
                <div className="cover">BOOK</div>
              )}
              <div className="copy">
                <small>
                  {book.language || "English"} · {book.category || "Books"}
                </small>
                <h2>{book.title}</h2>
                <p>{book.author || "Unknown author"}</p>
                <span
                  className={book.published !== false ? "published" : "draft"}
                >
                  {book.published !== false ? "Published" : "Draft"}
                </span>
                <em>
                  {book.pageCount || book.extraction?.pageCount || "—"} pages
                  {book.partCount ? ` · ${book.partCount} parts` : ""}
                </em>
              </div>
              <nav>
                <button onClick={() => view(book)}>Preview</button>
                <button onClick={() => edit(book)}>Edit / Update</button>
                <a href={`/?editBook=${encodeURIComponent(book.slug)}`} target="_top">
                  Full editor
                </a>
                <button className="delete" onClick={() => remove(book)}>
                  Delete
                </button>
              </nav>
            </article>
          ))
        )}
        {!loading && !visible.length && (
          <div className="empty">
            {books.length
              ? "No books match these filters."
              : "No books saved yet."}
          </div>
        )}
      </section>
      {editing && (
        <div className="overlay">
          <form className="editModal" onSubmit={updateBook}>
            <div className="editModalHead">
              <div>
                <small>PDF BOOK</small>
                <h2>Edit / Update Book</h2>
                <p>Update the book information and publishing status.</p>
              </div>
              <button type="button" onClick={() => setEditing(null)}>
                ×
              </button>
            </div>
            <div className="editFields">
              <label>
                Book title
                <input
                  required
                  value={editing.title || ""}
                  onChange={(event) =>
                    setEditing({ ...editing, title: event.target.value })
                  }
                />
              </label>
              <label>
                Writer / editor
                <input
                  value={editing.author || ""}
                  onChange={(event) =>
                    setEditing({ ...editing, author: event.target.value })
                  }
                />
              </label>
              <label>
                Language
                <select
                  value={editing.languageCode || "en"}
                  onChange={(event) => {
                    const selected = languages.find(
                      (item) => item.code === event.target.value,
                    );
                    setEditing({
                      ...editing,
                      languageCode: event.target.value,
                      language: selected?.label || editing.language,
                    });
                  }}
                >
                  {languages.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="editDescription">
                Description
                <textarea
                  value={editing.description || ""}
                  onChange={(event) =>
                    setEditing({ ...editing, description: event.target.value })
                  }
                />
              </label>
            </div>
            <label className="editPublish">
              <input
                type="checkbox"
                checked={editing.published !== false}
                onChange={(event) =>
                  setEditing({ ...editing, published: event.target.checked })
                }
              />
              Publish in app and web
            </label>
            <div className="editActions">
              <button type="button" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" disabled={editBusy}>
                {editBusy ? "Updating..." : "Save Update"}
              </button>
            </div>
          </form>
        </div>
      )}
      {preview && (
        <div
          className="overlay"
          onMouseDown={(e) => e.target === e.currentTarget && setPreview(null)}
        >
          <section className="preview">
            <button className="close" onClick={() => setPreview(null)}>
              ×
            </button>
            <div className="previewHead">
              {preview.coverImageUrl && (
                <img src={preview.coverImageUrl} alt="" />
              )}
              <div>
                <small>
                  {preview.language} · {preview.category}
                </small>
                <h1>{preview.title}</h1>
                <p>{preview.author}</p>
                <span>{preview.description}</span>
              </div>
            </div>
            <div className="previewPages">
              {(preview.pages?.length
                ? preview.pages
                : [
                    {
                      number: 1,
                      markdown: preview.content,
                      text: preview.content,
                    },
                  ]
              ).flatMap((part: any, partIndex: number) =>
                part.pages?.length
                  ? part.pages.map((page: any, pageIndex: number) => ({
                      ...page,
                      partTitle: part.title || `Part ${partIndex + 1}`,
                      pageIndex,
                    }))
                  : [{ ...part, partTitle: part.title || `Part ${partIndex + 1}`, pageIndex: 0 }],
              ).map((page: any, index: number) => (
                <article key={index}>
                  <b>{page.partTitle} · PAGE {page.pageIndex + 1}</b>
                  {/<[a-z][\s\S]*>/i.test(page.markdown || page.text || "") ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: page.markdown || page.text,
                      }}
                    />
                  ) : (
                    <p>{page.markdown || page.text}</p>
                  )}
                </article>
              ))}
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
        main > header,
        .toolbar,
        .library,
        .message {
          max-width: 1400px;
          margin: auto;
        }
        main > header {
          display: flex;
          justify-content: space-between;
          padding: 28px 34px;
          border-radius: 22px;
          background: linear-gradient(135deg, #064b32, #088154);
          color: #fff;
        }
        header a {
          color: #def2e5;
          text-decoration: none;
        }
        header small {
          display: block;
          margin-top: 9px;
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
          background: #def2e5;
        }
        .pdfImporter {
          max-width: 1400px;
          margin: 16px auto 0;
          padding: 20px;
          border: 1px solid #d5e5da;
          border-radius: 17px;
          background: #fff;
          box-shadow: 0 10px 30px rgba(18, 71, 46, 0.06);
        }
        .pdfImporterHead,
        .pdfImportActions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .pdfImporterHead small {
          color: #a27f24;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }
        .pdfImporterHead h2 {
          margin: 5px 0 4px;
          font-size: 19px;
        }
        .pdfImporterHead p {
          margin: 0;
          color: #6d7d74;
          font-size: 11px;
        }
        .pdfImporterHead strong {
          display: grid;
          width: 50px;
          height: 50px;
          flex: 0 0 50px;
          place-items: center;
          border-radius: 50%;
          background: #e3f3e8;
          color: #087a4d;
          font-size: 12px;
        }
        .pdfFields {
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr 180px;
          gap: 11px;
          margin-top: 17px;
        }
        .pdfFields label {
          font-size: 10px;
          font-weight: 800;
        }
        .pdfFields input,
        .pdfFields select {
          width: 100%;
          height: 42px;
          margin-top: 6px;
          padding: 0 11px;
          border: 1px solid #c8dacd;
          border-radius: 9px;
          background: #fff;
        }
        .pdfFields input[type="file"] {
          padding: 8px;
          background: #f5faf7;
        }
        .pdfImportActions {
          margin-top: 14px;
        }
        .pdfImportActions label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #365c49;
          font-size: 11px;
          font-weight: 800;
        }
        .pdfImportActions input {
          width: 16px;
          height: 16px;
          margin: 0;
          accent-color: #087a4d;
        }
        .pdfImportActions button {
          min-width: 170px;
          padding: 11px 16px;
          border: 0;
          border-radius: 9px;
          background: #087a4d;
          color: #fff;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }
        .pdfImportActions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pdfProgress {
          height: 6px;
          margin-top: 13px;
          overflow: hidden;
          border-radius: 9px;
          background: #e5eee8;
        }
        .pdfProgress i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #087a4d, #43b779);
          transition: width 0.25s ease;
        }
        .editModal {
          width: min(680px, 96vw);
          max-height: 92vh;
          overflow: auto;
          padding: 24px;
          border-radius: 20px;
          background: #f8fcf9;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.28);
        }
        .editModalHead {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
          padding-bottom: 16px;
          border-bottom: 1px solid #d8e7dd;
        }
        .editModalHead small {
          color: #a27f24;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1px;
        }
        .editModalHead h2 {
          margin: 5px 0;
        }
        .editModalHead p {
          margin: 0;
          color: #718078;
          font-size: 11px;
        }
        .editModalHead > button {
          width: 38px;
          height: 38px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: #e3f1e7;
          color: #087a4d;
          font-size: 22px;
          cursor: pointer;
        }
        .editFields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 13px;
          margin-top: 17px;
        }
        .editFields label {
          font-size: 10px;
          font-weight: 800;
        }
        .editFields input,
        .editFields select,
        .editFields textarea {
          width: 100%;
          margin-top: 6px;
          padding: 11px;
          border: 1px solid #c8dacd;
          border-radius: 9px;
          background: #fff;
        }
        .editDescription {
          grid-column: 1 / -1;
        }
        .editDescription textarea {
          min-height: 100px;
          resize: vertical;
        }
        .editPublish {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 14px;
          font-size: 11px;
          font-weight: 800;
        }
        .editPublish input {
          width: 16px;
          height: 16px;
          margin: 0;
          accent-color: #087a4d;
        }
        .editActions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          margin-top: 18px;
        }
        .editActions button {
          padding: 11px 17px;
          border: 0;
          border-radius: 9px;
          background: #e4eee7;
          color: #315b47;
          font-size: 10px;
          font-weight: 900;
          cursor: pointer;
        }
        .editActions button[type="submit"] {
          background: #087a4d;
          color: #fff;
        }
        .toolbar {
          display: grid;
          grid-template-columns: 1fr 220px 170px auto;
          gap: 10px;
          align-items: end;
          margin-top: 17px;
          padding: 15px;
          border: 1px solid #d5e5da;
          border-radius: 15px;
          background: #fff;
        }
        .toolbar label {
          font-size: 10px;
          font-weight: 800;
        }
        .toolbar input,
        .toolbar select {
          width: 100%;
          margin-top: 6px;
          padding: 11px;
          border: 1px solid #c8dacd;
          border-radius: 9px;
          background: #fff;
        }
        .toolbar button,
        .library button,
        .library a {
          padding: 10px 12px;
          border: 0;
          border-radius: 9px;
          background: #087a4d;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          text-decoration: none;
          cursor: pointer;
        }
        .library {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 13px;
          margin-top: 14px;
        }
        .library > article {
          display: flex;
          gap: 14px;
          min-width: 0;
          padding: 15px;
          border: 1px solid #d5e4d9;
          border-radius: 16px;
          background: #fff;
        }
        .library img,
        .cover {
          width: 74px;
          height: 98px;
          object-fit: cover;
          flex: none;
          border-radius: 9px;
        }
        .cover {
          display: grid;
          place-items: center;
          background: #087a4d;
          color: #e9cf7c;
          font-size: 10px;
          font-weight: 900;
        }
        .copy {
          min-width: 0;
          flex: 1;
        }
        .copy small {
          color: #a27f24;
          font-size: 9px;
          font-weight: 800;
        }
        .copy h2 {
          margin: 6px 0;
          font-size: 16px;
        }
        .copy p {
          margin: 0 0 8px;
          color: #66766d;
          font-size: 10px;
        }
        .copy span,
        .copy em {
          display: inline-block;
          margin-right: 6px;
          padding: 5px 7px;
          border-radius: 7px;
          font-size: 8px;
          font-style: normal;
        }
        .published {
          background: #dff2e5;
          color: #087a4d;
        }
        .draft {
          background: #fff0df;
          color: #a05b24;
        }
        .copy em {
          background: #eef3ef;
        }
        .library nav {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          flex-direction: column;
          gap: 6px;
        }
        .library .delete {
          background: #bd4e3c;
        }
        .empty {
          grid-column: 1/-1;
          padding: 80px;
          text-align: center;
          border: 1px dashed #cbded1;
          border-radius: 16px;
          background: #fff;
          color: #718078;
        }
        .overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: grid;
          place-items: center;
          padding: 20px;
          background: #092c21bd;
          backdrop-filter: blur(5px);
        }
        .preview {
          position: relative;
          width: min(850px, 96vw);
          max-height: 94vh;
          overflow: auto;
          padding: 25px;
          border-radius: 22px;
          background: #f6fbf7;
        }
        .close {
          position: absolute;
          right: 15px;
          top: 15px;
        }
        .previewHead {
          display: flex;
          gap: 18px;
          padding: 18px;
          border-radius: 16px;
          background: #fff;
        }
        .previewHead img {
          width: 100px;
          height: 138px;
          object-fit: cover;
          border-radius: 10px;
        }
        .previewHead small {
          color: #a27f24;
        }
        .previewHead h1 {
          margin: 7px 0;
        }
        .previewHead p,
        .previewHead span {
          color: #64766c;
        }
        .previewPages {
          display: grid;
          gap: 12px;
          margin-top: 14px;
        }
        .previewPages article {
          padding: 20px;
          border: 1px solid #d6e5da;
          border-radius: 15px;
          background: #fff;
          line-height: 1.75;
        }
        .previewPages article > b {
          color: #087a4d;
          font-size: 9px;
        }
        .previewPages img {
          max-width: 100%;
          height: auto;
        }
        @media (max-width: 900px) {
          .toolbar {
            grid-template-columns: 1fr 1fr;
          }
          .library {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 1050px) {
          .pdfFields {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 620px) {
          .pdfFields {
            grid-template-columns: 1fr;
          }
          .pdfImporterHead,
          .pdfImportActions {
            align-items: stretch;
            flex-direction: column;
          }
          .pdfImportActions button {
            width: 100%;
          }
          .editFields {
            grid-template-columns: 1fr;
          }
          .editDescription {
            grid-column: auto;
          }
        }
      `}</style>
    </main>
  );
}
