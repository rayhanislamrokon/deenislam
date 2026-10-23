"use client";

import BaseRichTextEditor from "../islamic-lifestyle/RichTextEditor";

const RichTextEditor = (
  props: Parameters<typeof BaseRichTextEditor>[0],
) => <BaseRichTextEditor {...props} cleanupUnsavedImages />;

export type AmolPart = {
  number: number;
  title?: string;
  reference?: string;
  text?: string;
  markdown?: string;
  confidence?: number;
  needsReview?: boolean;
};

type Props = {
  parts?: AmolPart[];
  pages?: AmolPart[];
  content: string;
  api: string;
  token: string;
  language: string;
  recordId: string;
  onMessage: (value: string) => void;
  onChange: (parts: AmolPart[], content: string) => void;
};

const valueOf = (part: AmolPart) => String(part.markdown || part.text || "").trim();

export default function AmolPartBuilder({
  parts,
  pages,
  content,
  api,
  token,
  language,
  recordId,
  onMessage,
  onChange,
}: Props) {
  const savedParts = parts || pages || [];
  const list = savedParts.length
    ? savedParts
    : [{ number: 1, title: "", reference: "", markdown: content, text: content }];

  const commit = (next: AmolPart[]) => {
    const normalized = next.map((part, index) => ({ ...part, number: index + 1 }));
    onChange(
      normalized,
      normalized.map((part) => valueOf(part)).filter(Boolean).join("\n\n"),
    );
  };
  const update = (index: number, patch: Partial<AmolPart>) =>
    commit(list.map((part, current) => (current === index ? { ...part, ...patch } : part)));
  const add = () =>
    commit([...list, { number: list.length + 1, title: "", reference: "", markdown: "", text: "" }]);
  const remove = (index: number) => {
    if (list.length === 1) return onMessage("An Amol must contain at least one part.");
    if (confirm(`Remove Part ${index + 1}?`)) commit(list.filter((_, current) => current !== index));
  };
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    commit(next);
  };

  return (
    <section className='builder'>
      <header>
        <div>
          <small>APP & WEB CONTENT STRUCTURE</small>
          <h3>{language} Amol parts</h3>
          <p>Each part becomes a separate card before the full reader opens.</p>
        </div>
        <button type='button' onClick={add}>+ Add part</button>
      </header>
      <nav className='tabs'>
        {list.map((part, index) => (
          <a key={index} href={`#amol-part-${index + 1}`}>
            Part {index + 1}{part.title ? ` · ${part.title.slice(0, 22)}` : ""}
          </a>
        ))}
      </nav>
      <div className='parts'>
        {list.map((part, index) => (
          <article id={`amol-part-${index + 1}`} key={`${recordId}-${index}`}>
            <div className='partHead'>
              <div><b>PART {String(index + 1).padStart(2, "0")}</b><span>APP & WEB CARD</span></div>
              <nav>
                <button type='button' disabled={index === 0} onClick={() => move(index, -1)}>↑</button>
                <button type='button' disabled={index === list.length - 1} onClick={() => move(index, 1)}>↓</button>
                <button type='button' className='remove' onClick={() => remove(index)}>Remove</button>
              </nav>
            </div>
            <div className='meta'>
              <label>
                Part card title
                <input
                  value={part.title || ""}
                  onChange={(event) => update(index, { title: event.target.value })}
                  placeholder='e.g. Morning remembrance and protection'
                />
              </label>
              <label>
                Quran / Hadith / verified source
                <input
                  value={part.reference || ""}
                  onChange={(event) => update(index, { reference: event.target.value })}
                  placeholder='e.g. Quran 33:41–42 · Sahih Muslim'
                />
              </label>
            </div>
            <label className='contentLabel'>Complete part content</label>
            <RichTextEditor
              value={valueOf(part)}
              onChange={(html) => update(index, { markdown: html, text: html })}
              api={api}
              token={token}
              onMessage={onMessage}
              recordId={`${recordId}:part:${index + 1}`}
            />
          </article>
        ))}
      </div>
      <button type='button' className='addBottom' onClick={add}>+ Add another part</button>
      <style jsx>{`
        .builder{width:100%;min-width:0;overflow:hidden;padding:16px;border:1px solid #cfe0d4;border-radius:16px;background:#f7fbf8}
        .builder>header,.partHead{display:flex;align-items:center;justify-content:space-between;gap:12px}
        h3{margin:4px 0;color:#173d2e} small{color:#a27f24;font-size:9px;font-weight:900;letter-spacing:1px} p{margin:0;color:#6d7d74;font-size:10px}
        button{border:0;border-radius:9px;padding:9px 12px;background:#087a4d;color:#fff;font-weight:800;cursor:pointer}
        .tabs{display:flex;gap:7px;overflow:auto;margin:14px 0;padding-bottom:5px}.tabs a{flex:none;max-width:230px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:8px 11px;border:1px solid #cfe0d4;border-radius:9px;background:#fff;color:#087a4d;font-size:10px;font-weight:800;text-decoration:none}
        .parts{display:grid;gap:14px}.parts>article{min-width:0;overflow:hidden;scroll-margin-top:15px;padding:15px;border:1px solid #d8e6dc;border-radius:14px;background:#fff}
        .partHead{margin-bottom:13px}.partHead>div{display:flex;align-items:center;gap:8px}.partHead b{color:#087a4d;font-size:11px}.partHead span{padding:5px 7px;border-radius:7px;background:#fff4d7;color:#8b6a18;font-size:8px;font-weight:900}.partHead nav{display:flex;gap:5px}.partHead button{padding:7px 9px}.partHead button:disabled{opacity:.3}.partHead .remove{background:#fff0ed;color:#ad4736}
        .meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:13px}label{font-size:10px;font-weight:800;color:#294c3d}input{width:100%;margin-top:6px;padding:10px;border:1px solid #cdded2;border-radius:9px;background:#fcfefc}.contentLabel{display:block;margin-bottom:7px}
        .parts :global(.tiptapShell){width:100%;max-width:100%;min-width:0}.parts :global(.richToolbar){max-width:100%;flex-wrap:wrap}.parts :global(.richEditorBody){min-height:280px;max-width:100%;overflow-wrap:anywhere}
        .addBottom{width:100%;margin-top:13px;background:#e2f2e7;color:#087a4d}
        @media(max-width:700px){.builder>header,.partHead{align-items:flex-start;flex-direction:column}.partHead nav{width:100%;justify-content:flex-end}.meta{grid-template-columns:1fr}}
      `}</style>
    </section>
  );
}
