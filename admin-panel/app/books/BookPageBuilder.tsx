"use client";
import RichTextEditor from "../islamic-lifestyle/RichTextEditor";

type SubPage = {
  number: number;
  originalPage?: number;
  text?: string;
  markdown?: string;
};
type Page = {
  number: number;
  title?: string;
  reference?: string;
  text?: string;
  markdown?: string;
  pages?: SubPage[];
  confidence?: number;
  needsReview?: boolean;
};
type Props = {
  pages: Page[];
  content: string;
  api: string;
  token: string;
  language: string;
  recordId: string;
  kind?: "book" | "structured-book" | "biography";
  onMessage: (value: string) => void;
  onChange: (pages: Page[], content: string) => void;
};
const value = (page: { text?: string; markdown?: string }) =>
  String(page.markdown || page.text || "")
    .replace(/^## Page \d+\s*/i, "")
    .trim();

export default function BookPageBuilder({
  pages,
  content,
  api,
  token,
  language,
  recordId,
  kind = "book",
  onMessage,
  onChange,
}: Props) {
  const bio = kind === "biography",
    structured = kind !== "book",
    unit = structured ? "Part" : "Page";
  const list = pages.length
    ? pages
    : [
        {
          number: 1,
          title: "",
          reference: "",
          markdown: content || "",
          text: content || "",
        },
      ];
  const subPages = (part: Page): SubPage[] =>
    part.pages?.length
      ? part.pages
      : [{ number: 1, markdown: value(part), text: value(part) }];
  const commit = (next: Page[]) => {
    const normalized = next.map((part, i) => ({
      ...part,
      number: i + 1,
      pages: structured
        ? subPages(part).map((p, n) => ({ ...p, number: n + 1 }))
        : part.pages,
    }));
    const combined = normalized
      .map(
        (part) =>
          `## ${part.title || `${unit} ${part.number}`}\n\n${(structured ? subPages(part) : [part]).map(value).join("\n\n")}`,
      )
      .join("\n\n")
      .trim();
    onChange(normalized, combined);
  };
  const update = (index: number, patch: Partial<Page>) =>
    commit(list.map((part, i) => (i === index ? { ...part, ...patch } : part)));
  const add = () =>
    commit([
      ...list,
      {
        number: list.length + 1,
        title: `${unit} ${list.length + 1}`,
        reference: "",
        pages: structured ? [{ number: 1, markdown: "", text: "" }] : undefined,
        markdown: "",
        text: "",
      },
    ]);
  const remove = (index: number) => {
    if (list.length === 1)
      return onMessage(`At least one ${unit.toLowerCase()} is required.`);
    if (confirm(`Remove ${list[index].title || `${unit} ${index + 1}`}?`))
      commit(list.filter((_, i) => i !== index));
  };
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const next = [...list],
      [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    commit(next);
  };
  const updateSub = (partIndex: number, pageIndex: number, html: string) =>
    update(partIndex, {
      pages: subPages(list[partIndex]).map((p, i) =>
        i === pageIndex ? { ...p, markdown: html, text: html } : p,
      ),
    });
  const addSub = (partIndex: number) =>
    update(partIndex, {
      pages: [
        ...subPages(list[partIndex]),
        {
          number: subPages(list[partIndex]).length + 1,
          markdown: "",
          text: "",
        },
      ],
    });
  const removeSub = (partIndex: number, pageIndex: number) => {
    const current = subPages(list[partIndex]);
    if (current.length === 1)
      return onMessage("A part must contain at least one page.");
    if (confirm(`Remove Page ${pageIndex + 1}?`))
      update(partIndex, { pages: current.filter((_, i) => i !== pageIndex) });
  };
  return (
    <section className="builder">
      <header>
        <div>
          <small>
            {structured
              ? bio
                ? "PARTS AND PAGES BIOGRAPHY BUILDER"
                : "BOOK PARTS AND PAGES BUILDER"
              : "PAGE-BY-PAGE BOOK BUILDER"}
          </small>
          <h3>
            {language} {bio ? "biography parts" : structured ? "book parts" : "book pages"}
          </h3>
          <p>
            {structured
              ? "Create parts, then add as many pages as needed inside each part."
              : "Write manually or review pages created from your PDF."}
          </p>
        </div>
        <button type="button" onClick={add}>
          + Add {unit.toLowerCase()}
        </button>
      </header>
      <nav className="pageTabs">
        {list.map((part, i) => (
          <a key={i} href={`#book-page-${i + 1}`}>
            {part.title || `${unit} ${i + 1}`}
          </a>
        ))}
      </nav>
      <div className="parts">
        {list.map((part, index) => (
          <article id={`book-page-${index + 1}`} key={`${recordId}-${index}`}>
            <div className="partHead">
              <div>
                <b>
                  {unit.toUpperCase()} {index + 1}
                </b>
                <span>
                  {structured
                    ? `${subPages(part).length} PAGE${subPages(part).length === 1 ? "" : "S"}`
                    : "MANUAL PAGE"}
                </span>
              </div>
              <nav>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === list.length - 1}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="remove"
                  onClick={() => remove(index)}
                >
                  Remove
                </button>
              </nav>
            </div>
            <div className="partFields">
              <label>
                {structured ? "Part" : "Page"} name
                <input
                  value={part.title || ""}
                  placeholder={`${unit} ${index + 1} name`}
                  onChange={(e) => update(index, { title: e.target.value })}
                />
              </label>
              <label>
                Reference (optional)
                <input
                  value={part.reference || ""}
                  placeholder="Quran, Hadith or source"
                  onChange={(e) => update(index, { reference: e.target.value })}
                />
              </label>
            </div>
            {structured ? (
              <div className="subPages">
                {subPages(part).map((page, pageIndex) => (
                  <section key={pageIndex}>
                    <header>
                      <b>
                        PAGE {pageIndex + 1}
                        {page.originalPage
                          ? ` · PDF PAGE ${page.originalPage}`
                          : ""}
                      </b>
                      <button
                        type="button"
                        className="remove"
                        onClick={() => removeSub(index, pageIndex)}
                      >
                        Remove page
                      </button>
                    </header>
                    <RichTextEditor
                      value={value(page)}
                      onChange={(html) => updateSub(index, pageIndex, html)}
                      api={api}
                      token={token}
                      onMessage={onMessage}
                      recordId={`${recordId}:part:${index + 1}:page:${pageIndex + 1}`}
                      largeText
                    />
                  </section>
                ))}
                <button
                  type="button"
                  className="addPage"
                  onClick={() => addSub(index)}
                >
                  + Add page inside this part
                </button>
              </div>
            ) : (
              <RichTextEditor
                value={value(part)}
                onChange={(html) =>
                  update(index, { markdown: html, text: html })
                }
                api={api}
                token={token}
                onMessage={onMessage}
                recordId={`${recordId}:page:${index + 1}`}
                largeText
              />
            )}
          </article>
        ))}
      </div>
      <button type="button" className="addBottom" onClick={add}>
        + Add another {unit.toLowerCase()}
      </button>
      <style jsx>{`
        .builder {
          grid-column: 1/-1;
          width: 100%;
          min-width: 0;
          padding: 16px;
          border: 1px solid #cfe0d4;
          border-radius: 16px;
          background: #f7fbf8;
        }
        .builder > header,
        .partHead,
        .subPages section > header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .builder h3 {
          margin: 4px 0;
          color: #173d2e;
        }
        .builder small {
          color: #a27f24;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1px;
        }
        .builder p {
          margin: 0;
          color: #6d7d74;
          font-size: 10px;
        }
        .builder button {
          border: 0;
          border-radius: 9px;
          padding: 9px 12px;
          background: #087a4d;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
        }
        .pageTabs {
          display: flex;
          gap: 7px;
          overflow: auto;
          margin: 14px 0;
        }
        .pageTabs a {
          flex: none;
          padding: 8px 11px;
          border: 1px solid #cfe0d4;
          border-radius: 9px;
          background: #fff;
          color: #087a4d;
          font-size: 10px;
          font-weight: 800;
          text-decoration: none;
        }
        .parts {
          display: grid;
          gap: 14px;
        }
        .parts > article {
          min-width: 0;
          padding: 14px;
          border: 1px solid #d8e6dc;
          border-radius: 14px;
          background: #fff;
        }
        .partHead {
          margin-bottom: 10px;
        }
        .partHead > div {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .partHead b,
        .subPages header b {
          color: #087a4d;
          font-size: 11px;
        }
        .partHead span {
          padding: 5px 7px;
          border-radius: 7px;
          background: #fff4d7;
          color: #8b6a18;
          font-size: 8px;
          font-weight: 900;
        }
        .partHead nav {
          display: flex;
          gap: 5px;
        }
        .partHead button {
          padding: 7px 9px;
        }
        .builder .remove {
          background: #fff0ed;
          color: #ad4736;
        }
        .partFields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }
        .partFields label {
          font-size: 10px;
          font-weight: 800;
          color: #294a3c;
        }
        .partFields input {
          width: 100%;
          box-sizing: border-box;
          margin-top: 5px;
          padding: 10px;
          border: 1px solid #cfe0d4;
          border-radius: 9px;
        }
        .subPages {
          display: grid;
          gap: 12px;
        }
        .subPages > section {
          padding: 12px;
          border: 1px solid #dce9e0;
          border-radius: 12px;
          background: #f9fcfa;
        }
        .subPages section > header {
          margin-bottom: 9px;
        }
        .pages :global(.tiptapShell),
        .subPages :global(.tiptapShell) {
          width: 100%;
          min-width: 0;
        }
        .subPages :global(.richEditorBody) {
          min-height: 240px;
          font-size: 18px !important;
          line-height: 1.85 !important;
        }
        .addPage,
        .addBottom {
          width: 100%;
          background: #e2f2e7 !important;
          color: #087a4d !important;
        }
        .addBottom {
          margin-top: 13px;
        }
        @media (max-width: 700px) {
          .builder > header,
          .partHead {
            align-items: flex-start;
            flex-direction: column;
          }
          .partFields {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
