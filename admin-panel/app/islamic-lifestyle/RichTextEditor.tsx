"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Blockquote from "@tiptap/extension-blockquote";
import { Mark, mergeAttributes } from "@tiptap/core";
import { deleteManagedImage, uploadImageToS3 } from "../lib/imageUpload";

const RICH_TEXT_UPLOADS_COMMITTED = "deenislam:rich-text-uploads-committed";

/** Call only after the content API confirms that the rich text was saved. */
export const commitRichTextUploads = () => {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(RICH_TEXT_UPLOADS_COMMITTED));
};

const SelectionStyle = Mark.create({
  name: "selectionStyle",
  addAttributes() {
    return {
      kind: {
        default: "heading1",
        parseHTML: (element) =>
          element.getAttribute("data-selection-style") || "heading1",
        renderHTML: (attributes) => ({
          "data-selection-style": attributes.kind,
        }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-selection-style]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});
const TextColor = Mark.create({
  name: "textColor",
  addAttributes() {
    return {
      color: {
        default: "",
        parseHTML: (element) => element.style.color || "",
        renderHTML: (attributes) =>
          attributes.color ? { style: `color:${attributes.color}` } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[style*=color]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});
const InlineQuote = Mark.create({
  name: "inlineQuote",
  addAttributes() {
    return {
      tone: {
        default: "gold",
        parseHTML: (element) => element.getAttribute("data-tone") || "gold",
        renderHTML: (attributes) => ({
          "data-tone": attributes.tone || "gold",
        }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-inline-quote]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-inline-quote": "true" }),
      0,
    ];
  },
});
const ColoredBlockquote = Blockquote.extend({
  addAttributes() {
    return {
      tone: {
        default: "gold",
        parseHTML: (element) => element.getAttribute("data-tone") || "gold",
        renderHTML: (attributes) => ({
          "data-tone": attributes.tone || "gold",
        }),
      },
    };
  },
});

type Props = {
  value: string;
  onChange: (html: string) => void;
  api: string;
  token: string;
  onMessage: (message: string) => void;
  recordId: string;
  largeText?: boolean;
  compact?: boolean;
  autoArrange?: (html: string) => string;
  showPreviewTabs?: boolean;
  cleanupUnsavedImages?: boolean;
};

type EditorView = "editor" | "app" | "web";

const sanitizePreviewHtml = (html: string) =>
  String(html || "")
    .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '$1="#"');

export default function RichTextEditor({
  value,
  onChange,
  api,
  token,
  onMessage,
  recordId,
  largeText = false,
  compact = false,
  autoArrange,
  showPreviewTabs = true,
  cleanupUnsavedImages = false,
}: Props) {
  const initializedRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imagePositionRef = useRef<number | null>(null);
  const pendingImagesRef = useRef(new Map<string, { key: string; url: string }>());
  const linkSelectionRef = useRef({ from: 1, to: 1 });
  const [uploading, setUploading] = useState(false);
  const [linkPanel, setLinkPanel] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [quotePanel, setQuotePanel] = useState(false);
  const [colorPanel, setColorPanel] = useState(false);
  const [view, setView] = useState<EditorView>("editor");
  const [, refreshToolbar] = useState(0);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        gapcursor: false,
        dropcursor: false,
        blockquote: false,
      }),
      ColoredBlockquote,
      InlineQuote,
      TextColor,
      SelectionStyle,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer nofollow",
        },
      }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: value,
    editorProps: {
      attributes: { class: "richEditorBody", spellcheck: "true" },
    },
    onCreate: ({ editor: activeEditor }) => {
      if (activeEditor.isEmpty)
        activeEditor.chain().setParagraph().unsetAllMarks().run();
    },
    onFocus: ({ editor: activeEditor }) => {
      if (activeEditor.isEmpty)
        activeEditor.chain().setParagraph().unsetAllMarks().run();
    },
    // A selection move does not change the document, so it does not trigger
    // onUpdate. Re-render the toolbar to reflect the marks at the new range.
    onSelectionUpdate: () => refreshToolbar((version) => version + 1),
    onUpdate: ({ editor: activeEditor }) => onChange(activeEditor.getHTML()),
  });

  useEffect(() => {
    if (!cleanupUnsavedImages) return;
    const discardPendingImages = (keepalive = false) => {
      const pending = [...pendingImagesRef.current.values()];
      pendingImagesRef.current.clear();
      for (const image of pending)
        void deleteManagedImage(api, token, image, { keepalive }).catch(() => undefined);
    };
    const commitPendingImages = () => pendingImagesRef.current.clear();
    const onPageHide = () => discardPendingImages(true);

    window.addEventListener(RICH_TEXT_UPLOADS_COMMITTED, commitPendingImages);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener(RICH_TEXT_UPLOADS_COMMITTED, commitPendingImages);
      window.removeEventListener("pagehide", onPageHide);
      discardPendingImages(true);
    };
  }, [api, cleanupUnsavedImages, token]);

  useEffect(() => {
    if (!cleanupUnsavedImages) return;
    for (const [url, image] of pendingImagesRef.current) {
      if (value.includes(url)) continue;
      pendingImagesRef.current.delete(url);
      void deleteManagedImage(api, token, image).catch(() => undefined);
    }
  }, [api, cleanupUnsavedImages, token, value]);

  useEffect(() => {
    if (!editor) return;
    if (!initializedRef.current) {
      initializedRef.current = true;
      if (!recordId) {
        editor.commands.clearContent(false);
        editor.view.dispatch(editor.state.tr.setStoredMarks([]));
        if (value) onChange("");
        return;
      }
    }
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || "", { emitUpdate: false });
      if (!value || value === "<p></p>")
        editor.view.dispatch(editor.state.tr.setStoredMarks([]));
    }
  }, [editor, value, recordId]);

  if (!editor)
    return <div className="richEditorLoading">Loading editor...</div>;

  const addLink = () => {
    const { from, to } = editor.state.selection;
    linkSelectionRef.current = { from, to };
    setLinkUrl(editor.getAttributes("link").href || "");
    setLinkText(from === to ? "" : editor.state.doc.textBetween(from, to, " "));
    setLinkPanel(true);
  };
  const normalizeUrl = (raw: string) => {
    const clean = raw.trim();
    return /^(https?:\/\/|mailto:|tel:|#)/i.test(clean)
      ? clean
      : `https://${clean}`;
  };
  const applyLink = () => {
    if (!linkUrl.trim()) {
      onMessage("Enter a website address.");
      return;
    }
    const href = normalizeUrl(linkUrl),
      { from, to } = linkSelectionRef.current;
    const chain = editor.chain().focus().setTextSelection({ from, to });
    if (from === to) {
      if (!linkText.trim()) {
        onMessage("Enter the text that should be displayed.");
        return;
      }
      chain
        .insertContent({
          type: "text",
          text: linkText.trim(),
          marks: [{ type: "link", attrs: { href } }],
        })
        .run();
    } else chain.extendMarkRange("link").setLink({ href }).run();
    setLinkPanel(false);
    onMessage("Link added successfully.");
  };
  const removeLink = () => {
    const { from, to } = linkSelectionRef.current;
    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .extendMarkRange("link")
      .unsetLink()
      .run();
    setLinkPanel(false);
    onMessage("Link removed.");
  };

  const selectedStyle = (kind: string, blockAction: () => void) => {
    if (editor.state.selection.empty) {
      blockAction();
      return;
    }
    const current = editor.getAttributes("selectionStyle").kind;
    if (editor.isActive("selectionStyle") && current === kind)
      editor.chain().focus().unsetMark("selectionStyle").run();
    else editor.chain().focus().setMark("selectionStyle", { kind }).run();
  };
  const selectedList = (type: "bullet" | "number") => {
    // TipTap already expands a text selection to every paragraph/list item it
    // intersects. Keep that complete range intact so every selected line is
    // converted, instead of collapsing the command onto the first block.
    const { from, to } = editor.state.selection;
    const chain = editor.chain().focus().setTextSelection({ from, to });
    if (type === "bullet") chain.toggleBulletList().run();
    else chain.toggleOrderedList().run();
  };
  const clearFormatting = () => {
    const emptySelection = editor.state.selection.empty;
    if (emptySelection)
      editor.chain().focus().unsetAllMarks().clearNodes().run();
    else editor.chain().focus().unsetAllMarks().run();
    if (emptySelection)
      editor.view.dispatch(editor.state.tr.setStoredMarks([]));
  };

  const chooseImage = () => {
    imagePositionRef.current = editor.state.selection.from;
    fileRef.current?.click();
  };

  const uploadImage = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    onMessage("");
    try {
      const payload = await uploadImageToS3(api, token, file);
      if (cleanupUnsavedImages)
        pendingImagesRef.current.set(payload.publicUrl, {
          key: payload.key,
          url: payload.publicUrl,
        });
      const position = imagePositionRef.current;
      const chain = editor.chain().focus();
      if (position !== null) chain.setTextSelection(position);
      chain
        .setImage({
          src: payload.publicUrl,
          alt: file.name.replace(/\.[^.]+$/, ""),
        })
        .run();
      onMessage(
        "Image converted to WebP, uploaded and inserted into the chapter.",
      );
    } catch (error) {
      onMessage(
        error instanceof Error ? error.message : "Unable to upload image.",
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const Tool = ({
    active = false,
    title,
    icon,
    label,
    action,
  }: {
    active?: boolean;
    title: string;
    icon: string;
    label: string;
    action: () => void;
  }) => (
    <button
      type="button"
      title={title}
      className={active ? "active" : ""}
      onMouseDown={(event) => {
        event.preventDefault();
        action();
      }}
    >
      <strong>{icon}</strong>
      <span>{label}</span>
    </button>
  );

  const updateFromPreview = (html: string) => {
    const next = sanitizePreviewHtml(html);
    editor.commands.setContent(next, { emitUpdate: false });
    onChange(next);
  };

  const previewHtml =
    sanitizePreviewHtml(value || editor.getHTML()) ||
    "<p>Start writing to see the preview.</p>";

  return (
    <div
      className={`tiptapShell${largeText ? " largeText" : ""}${compact ? " compact" : ""}`}
    >
      {showPreviewTabs && (
        <div
          className="richViewTabs"
          role="tablist"
          aria-label="Content editor and previews"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === "editor"}
            className={view === "editor" ? "active" : ""}
            onClick={() => setView("editor")}
          >
            Edit text
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "app"}
            className={view === "app" ? "active" : ""}
            onClick={() => setView("app")}
          >
            App preview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "web"}
            className={view === "web" ? "active" : ""}
            onClick={() => setView("web")}
          >
            Web preview
          </button>
        </div>
      )}
      {(!showPreviewTabs || view === "editor") && (
        <>
          <div
            className="richToolbar"
            role="toolbar"
            aria-label="Rich text formatting"
          >
            <Tool
              title="Bold"
              icon="B"
              label="Bold"
              active={editor.isActive("bold")}
              action={() => editor.chain().focus().toggleBold().run()}
            />
            <Tool
              title="Italic"
              icon="I"
              label="Italic"
              active={editor.isActive("italic")}
              action={() => editor.chain().focus().toggleItalic().run()}
            />
            <Tool
              title="Heading 1"
              icon="H1"
              label="Title"
              active={
                editor.isActive("heading", { level: 1 }) ||
                editor.getAttributes("selectionStyle").kind === "heading1"
              }
              action={() =>
                selectedStyle("heading1", () =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run(),
                )
              }
            />
            <Tool
              title="Heading 2"
              icon="H2"
              label="Heading"
              active={
                editor.isActive("heading", { level: 2 }) ||
                editor.getAttributes("selectionStyle").kind === "heading2"
              }
              action={() =>
                selectedStyle("heading2", () =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run(),
                )
              }
            />
            <Tool
              title="Heading 3"
              icon="H3"
              label="Subheading"
              active={
                editor.isActive("heading", { level: 3 }) ||
                editor.getAttributes("selectionStyle").kind === "heading3"
              }
              action={() =>
                selectedStyle("heading3", () =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run(),
                )
              }
            />
            <Tool
              title="Heading 4"
              icon="H4"
              label="Minor heading"
              active={
                editor.isActive("heading", { level: 4 }) ||
                editor.getAttributes("selectionStyle").kind === "heading4"
              }
              action={() =>
                selectedStyle("heading4", () =>
                  editor.chain().focus().toggleHeading({ level: 4 }).run(),
                )
              }
            />
            <Tool
              title="Quote selected text or paragraph"
              icon=">"
              label="Quote"
              active={
                editor.isActive("blockquote") || editor.isActive("inlineQuote")
              }
              action={() => {
                const partial = !editor.state.selection.empty;
                if (partial) {
                  editor
                    .chain()
                    .focus()
                    .toggleMark("inlineQuote", { tone: "gold" })
                    .run();
                } else if (!editor.isActive("blockquote")) {
                  editor
                    .chain()
                    .focus()
                    .toggleBlockquote()
                    .updateAttributes("blockquote", { tone: "gold" })
                    .run();
                }
                setQuotePanel((current) => !current);
              }}
            />
            <Tool
              title="Bullet list"
              icon="-"
              label="Bullets"
              active={editor.isActive("bulletList")}
              action={() => selectedList("bullet")}
            />
            <Tool
              title="Numbered list"
              icon="1."
              label="Numbers"
              active={editor.isActive("orderedList")}
              action={() => selectedList("number")}
            />
            <Tool
              title="Add or edit link"
              icon="@"
              label="Link"
              active={editor.isActive("link")}
              action={addLink}
            />
            <Tool
              title="Text colour"
              icon="A"
              label="Color"
              active={editor.isActive("textColor")}
              action={() => setColorPanel((current) => !current)}
            />
            <Tool
              title="Clear formatting"
              icon="Tx"
              label="Clear"
              action={clearFormatting}
            />
            {autoArrange && (
              <Tool
                title="Automatically create paragraphs and numbered lists"
                icon="↕"
                label="Auto arrange"
                action={() => {
                  const arranged = autoArrange(editor.getHTML());
                  editor.commands.setContent(arranged, { emitUpdate: true });
                  onChange(arranged);
                  onMessage(
                    "Text arranged into readable paragraphs and numbered points.",
                  );
                }}
              />
            )}
            <Tool
              title="Upload image"
              icon="IMG"
              label={uploading ? "Uploading..." : "Image"}
              action={() => !uploading && chooseImage()}
            />
            <input
              ref={fileRef}
              type="file"
              hidden
              accept="image/*"
              onChange={(event) => void uploadImage(event.target.files?.[0])}
            />
          </div>
          {colorPanel && (
            <div className="textColorPalette">
              <b>Text colour</b>
              {[
                "#173D2E",
                "#087A4D",
                "#B98918",
                "#C23B3B",
                "#315D9B",
                "#7B3FA1",
                "#111827",
              ].map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  className={
                    editor.getAttributes("textColor").color === color
                      ? "selected"
                      : ""
                  }
                  style={{ backgroundColor: color }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    editor
                      .chain()
                      .focus()
                      .setMark("textColor", { color })
                      .run();
                    setColorPanel(false);
                  }}
                />
              ))}
              <label title="Choose custom colour">
                <span>Custom</span>
                <input
                  type="color"
                  value={editor.getAttributes("textColor").color || "#087A4D"}
                  onChange={(event) =>
                    editor
                      .chain()
                      .focus()
                      .setMark("textColor", { color: event.target.value })
                      .run()
                  }
                />
              </label>
              <button
                type="button"
                className="removeTextColor"
                onMouseDown={(event) => {
                  event.preventDefault();
                  editor.chain().focus().unsetMark("textColor").run();
                  setColorPanel(false);
                }}
              >
                Reset
              </button>
            </div>
          )}
          {quotePanel && (
            <div className="quotePalette">
              <b>Quote colour</b>
              {[
                { tone: "gold", label: "Gold" },
                { tone: "green", label: "Green" },
                { tone: "blue", label: "Blue" },
                { tone: "rose", label: "Rose" },
                { tone: "red", label: "Red" },
              ].map((option) => (
                <button
                  key={option.tone}
                  type="button"
                  className={
                    (editor.getAttributes("inlineQuote").tone ||
                      editor.getAttributes("blockquote").tone) === option.tone
                      ? `quoteTone ${option.tone} selected`
                      : `quoteTone ${option.tone}`
                  }
                  onMouseDown={(event) => {
                    event.preventDefault();
                    const type = editor.isActive("inlineQuote")
                      ? "inlineQuote"
                      : "blockquote";
                    editor
                      .chain()
                      .focus()
                      .updateAttributes(type, { tone: option.tone })
                      .run();
                    setQuotePanel(false);
                  }}
                >
                  <i />
                  {option.label}
                </button>
              ))}
              <button
                type="button"
                className="removeQuote"
                onMouseDown={(event) => {
                  event.preventDefault();
                  if (editor.isActive("inlineQuote"))
                    editor.chain().focus().unsetMark("inlineQuote").run();
                  else if (editor.isActive("blockquote"))
                    editor.chain().focus().toggleBlockquote().run();
                  setQuotePanel(false);
                }}
              >
                Remove quote
              </button>
            </div>
          )}
          {linkPanel && (
            <div className="linkPanel">
              <div className="linkPanelTitle">
                <div>
                  <b>Add a link</b>
                  <span>Connect text to a website</span>
                </div>
                <button type="button" onClick={() => setLinkPanel(false)}>
                  x
                </button>
              </div>
              <div className="linkFields">
                <label>
                  <span>Website address</span>
                  <input
                    autoFocus
                    value={linkUrl}
                    onChange={(event) => setLinkUrl(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        applyLink();
                      }
                    }}
                    placeholder="https://example.com"
                  />
                </label>
                <label>
                  <span>Display text</span>
                  <input
                    value={linkText}
                    disabled={
                      linkSelectionRef.current.from !==
                      linkSelectionRef.current.to
                    }
                    onChange={(event) => setLinkText(event.target.value)}
                    placeholder="Text shown to readers"
                  />
                </label>
              </div>
              <div className="linkActions">
                <button
                  type="button"
                  className="removeLink"
                  onClick={removeLink}
                >
                  Remove link
                </button>
                <button
                  type="button"
                  className="cancelLink"
                  onClick={() => setLinkPanel(false)}
                >
                  Cancel
                </button>
                <button type="button" className="applyLink" onClick={applyLink}>
                  Apply link
                </button>
              </div>
            </div>
          )}
          <EditorContent editor={editor} />
          <div className="editorFooter">
            <span>Rich text - formatting saves automatically</span>
            <b>{editor.getText().length.toLocaleString()} characters</b>
          </div>
        </>
      )}
      {showPreviewTabs && view === "app" && (
        <div className="sharedPreviewStage appStage">
          <div className="sharedAppPhone">
            <div className="sharedAppTop">
              <span>9:41</span>
              <b>Deen Islam</b>
              <span>● ●</span>
            </div>
            <div className="sharedAppHeader">
              <span>‹</span>
              <b>Content preview</b>
              <span>♡</span>
            </div>
            <div
              className="sharedAppPreview richPreviewContent"
              contentEditable
              suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: previewHtml }}
              onBlur={(event) =>
                updateFromPreview(event.currentTarget.innerHTML)
              }
            />
          </div>
          <p className="previewEditHint">
            Preview text is editable. Changes save when you click outside.
          </p>
        </div>
      )}
      {showPreviewTabs && view === "web" && (
        <div className="sharedPreviewStage webStage">
          <div className="sharedWebBrowser">
            <div className="sharedBrowserBar">
              <i />
              <i />
              <i />
              <span>deenislam.app</span>
            </div>
            <div className="sharedWebHeader">
              <b>Deen Islam</b>
              <span>Islamic knowledge and guidance</span>
            </div>
            <div
              className="sharedWebPreview richPreviewContent"
              contentEditable
              suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: previewHtml }}
              onBlur={(event) =>
                updateFromPreview(event.currentTarget.innerHTML)
              }
            />
          </div>
          <p className="previewEditHint">
            Preview text is editable. Changes save when you click outside.
          </p>
        </div>
      )}
      <style jsx global>{`
        .tiptapShell {
          border: 1px solid #c8d9cd;
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 2px 10px rgba(23, 61, 46, 0.06);
        }
        .richViewTabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          padding: 7px;
          background: #edf4ef;
          border-bottom: 1px solid #c8d9cd;
        }
        .richViewTabs button {
          min-height: 43px;
          border: 0;
          border-radius: 9px;
          background: transparent;
          color: #315747;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }
        .richViewTabs button:hover {
          background: #dfece3;
        }
        .richViewTabs button.active {
          background: #087a4d;
          color: #fff;
          box-shadow: 0 4px 12px rgba(8, 122, 77, 0.2);
        }
        .richToolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          padding: 10px;
          background: #173d2e;
          border-bottom: 1px solid #315a49;
        }
        .richToolbar button {
          height: 38px;
          padding: 0 11px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          background: #295343;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font: 700 12px Arial;
        }
        .richToolbar button:hover {
          background: #356b56;
        }
        .richToolbar button.active {
          background: #d6b95d;
          border-color: #f3dc91;
          color: #173d2e;
          box-shadow: 0 0 0 2px rgba(214, 185, 93, 0.2);
        }
        .richToolbar strong {
          min-width: 18px;
          font: 800 15px Georgia;
          text-align: center;
        }
        .richToolbar span {
          font-size: 11px;
        }
        .linkPanel {
          padding: 15px 16px;
          border-bottom: 1px solid #c8d9cd;
          background: #f5faf6;
        }
        .linkPanelTitle {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .linkPanelTitle b {
          display: block;
          font-size: 15px;
          color: #173d2e;
        }
        .linkPanelTitle span {
          display: block;
          margin-top: 3px;
          font-size: 10px;
          color: #718078;
        }
        .linkPanelTitle > button {
          width: 28px;
          height: 28px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: #e2eee6;
          color: #315747;
        }
        .linkFields {
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 10px;
        }
        .linkFields label span {
          display: block;
          margin-bottom: 5px;
          font-size: 10px;
          font-weight: 800;
          color: #315747;
        }
        .linkFields input {
          width: 100%;
          height: 40px;
          padding: 0 11px;
          border: 1px solid #bed1c4;
          border-radius: 9px;
          background: #fff;
          outline: none;
        }
        .linkFields input:focus {
          border-color: #087a4d;
          box-shadow: 0 0 0 3px rgba(8, 122, 77, 0.1);
        }
        .linkFields input:disabled {
          background: #e9f0eb;
        }
        .linkActions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 12px;
        }
        .linkActions button {
          padding: 9px 13px;
          border: 0;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 800;
        }
        .removeLink {
          margin-right: auto;
          background: #fff0ed !important;
          color: #a84432 !important;
        }
        .cancelLink {
          background: #e6eee8 !important;
          color: #315747 !important;
        }
        .applyLink {
          background: #087a4d !important;
          color: #fff !important;
        }
        @media (max-width: 700px) {
          .linkFields {
            grid-template-columns: 1fr;
          }
        }
        .richEditorBody {
          min-height: 430px;
          padding: 22px;
          outline: none;
          color: #263f34;
          font:
            16px/1.75 "Nirmala UI",
            "Vrinda",
            "Noto Sans Bengali",
            "Noto Sans",
            Arial,
            sans-serif;
          font-variant-ligatures: common-ligatures;
          font-feature-settings: "liga" 1, "clig" 1;
          text-rendering: optimizeLegibility;
        }
        .tiptapShell.compact .richEditorBody {
          min-height: 180px !important;
          font-size: 16px !important;
          line-height: 1.7 !important;
          padding: 16px;
        }
        .tiptapShell.compact .richToolbar button {
          height: 35px;
          padding: 0 9px;
        }
        .tiptapShell.largeText {
          width: 100%;
          max-width: 100%;
          min-width: 0;
          overflow: hidden;
        }
        .tiptapShell.largeText .richToolbar {
          max-width: 100%;
          flex-wrap: wrap;
        }
        .tiptapShell.largeText .richEditorBody {
          max-width: 100%;
          font-size: 22px !important;
          line-height: 1.85 !important;
          overflow-wrap: break-word !important;
          word-break: normal !important;
          white-space: normal !important;
        }
        .tiptapShell.largeText .richEditorBody p {
          max-width: 100%;
          font-size: 22px !important;
          line-height: 1.85 !important;
          overflow-wrap: break-word !important;
          word-break: normal !important;
          margin-bottom: 18px;
        }
        .richEditorBody p {
          margin: 8px 0 13px;
        }
        .richEditorBody h1,
        .richEditorBody h2,
        .richEditorBody h3,
        .richEditorBody h4 {
          color: inherit;
          line-height: 1.3;
          margin: 22px 0 10px;
        }
        .richEditorBody h2 {
          font-size: 27px;
        }
        .richEditorBody h3 {
          font-size: 21px;
        }
        .richEditorBody h4 {
          font-size: 17px;
        }
        .richEditorBody strong {
          font-weight: 800;
          color: #173d2e;
        }
        .richEditorBody em {
          display: inline !important;
          margin: 0 !important;
          text-align: inherit !important;
          font-size: inherit !important;
          line-height: inherit !important;
          color: inherit !important;
          font-style: italic !important;
        }
        .richEditorBody ul,
        .richEditorBody ol {
          display: block !important;
          padding-left: 30px !important;
          margin: 12px 0 !important;
        }
        .richEditorBody ul {
          list-style-type: disc !important;
        }
        .richEditorBody ol {
          list-style-type: decimal !important;
        }
        .richEditorBody li {
          display: list-item !important;
          margin: 6px 0 !important;
          padding-left: 4px;
        }
        .richEditorBody li::marker {
          color: #087a4d;
          font-weight: 800;
        }
        .richEditorBody li p {
          display: inline;
          margin: 0;
        }
        .textColorPalette {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding: 11px 13px;
          border-bottom: 1px solid #c8d9cd;
          background: #f5faf6;
        }
        .textColorPalette > b {
          margin-right: 4px;
          font-size: 10px;
          color: #315747;
        }
        .textColorPalette > button:not(.removeTextColor) {
          width: 27px;
          height: 27px;
          padding: 0;
          border: 2px solid #fff;
          border-radius: 50%;
          box-shadow: 0 0 0 1px #b9cbbf;
          cursor: pointer;
        }
        .textColorPalette > button.selected {
          box-shadow: 0 0 0 3px #d6b95d;
        }
        .textColorPalette label {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: 4px;
          font-size: 10px;
          font-weight: 800;
          color: #315747;
        }
        .textColorPalette input {
          width: 31px;
          height: 28px;
          padding: 2px;
          border: 1px solid #b9cbbf;
          border-radius: 7px;
          background: #fff;
        }
        .removeTextColor {
          margin-left: auto;
          padding: 7px 11px;
          border: 0;
          border-radius: 8px;
          background: #e5eee8;
          color: #315747;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
        }
        .quotePalette {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-wrap: wrap;
          padding: 10px 12px;
          border-bottom: 1px solid #c8d9cd;
          background: linear-gradient(180deg, #f8fcf9, #f0f7f2);
          animation: quotePaletteIn 0.2s ease-out;
          transform-origin: top;
        }
        @keyframes quotePaletteIn {
          from {
            opacity: 0;
            transform: translateY(-5px) scaleY(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scaleY(1);
          }
        }
        .quotePalette > b {
          margin-right: 4px;
          color: #315747;
          font-size: 10px;
        }
        .quotePalette button {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 7px 9px;
          border: 1px solid #c9d9ce;
          border-radius: 8px;
          background: #fff;
          color: #315747;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          transition:
            transform 0.16s ease,
            box-shadow 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease;
        }
        .quotePalette button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(23, 61, 46, 0.1);
        }
        .quotePalette button.selected {
          box-shadow: 0 0 0 2px #087a4d33;
          border-color: #087a4d;
        }
        .quoteTone i {
          width: 13px;
          height: 13px;
          border-radius: 4px;
        }
        .quoteTone.gold i {
          background: #d0ad45;
        }
        .quoteTone.green i {
          background: #27a36a;
        }
        .quoteTone.blue i {
          background: #4285c5;
        }
        .quoteTone.rose i {
          background: #ce6b78;
        }
        .quoteTone.red i {
          background: #d84343;
        }
        .quotePalette .removeQuote {
          margin-left: auto;
          background: #fff0ed;
          color: #a84432;
        }
        .richEditorBody span[data-selection-style] {
          display: inline;
          color: inherit;
          font-weight: 800;
          line-height: 1.3;
        }
        .richEditorBody span[data-selection-style="heading1"] {
          font-size: 2em;
        }
        .richEditorBody span[data-selection-style="heading2"] {
          font-size: 1.65em;
        }
        .richEditorBody span[data-selection-style="heading3"] {
          font-size: 1.35em;
        }
        .richEditorBody span[data-selection-style="heading4"] {
          font-size: 1.12em;
        }
        .richEditorBody span[data-inline-quote] {
          display: inline;
          padding: 2px 5px;
          border-radius: 5px;
          background: #fff8df;
          color: #5c5132;
          box-decoration-break: clone;
          -webkit-box-decoration-break: clone;
        }
        .richEditorBody span[data-inline-quote][data-tone="green"] {
          background: #eaf8ef;
          color: #28533d;
        }
        .richEditorBody span[data-inline-quote][data-tone="blue"] {
          background: #edf6ff;
          color: #294b68;
        }
        .richEditorBody span[data-inline-quote][data-tone="rose"] {
          background: #fff0f2;
          color: #684047;
        }
        .richEditorBody span[data-inline-quote][data-tone="red"] {
          background: #fff0f0;
          color: #a12626;
        }
        .richEditorBody blockquote {
          position: relative;
          display: block;
          max-width: 100%;
          margin: 18px 0;
          padding: 18px 20px;
          border: 1px solid #ead99b;
          border-left: 5px solid #d0ad45;
          border-radius: 14px;
          background: #fff8df;
          color: #5c5132;
          box-shadow: 0 5px 18px rgba(74, 62, 26, 0.08);
          transition:
            background-color 0.28s ease,
            border-color 0.28s ease,
            color 0.28s ease,
            box-shadow 0.28s ease,
            transform 0.2s ease;
        }
        .richEditorBody blockquote:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(23, 61, 46, 0.11);
        }
        .richEditorBody blockquote p {
          margin: 0;
        }
        .richEditorBody blockquote[data-tone="green"] {
          border-color: #bfe5ce;
          border-left-color: #27a36a;
          background: #eaf8ef;
          color: #28533d;
        }
        .richEditorBody blockquote[data-tone="blue"] {
          border-color: #c5dcf1;
          border-left-color: #4285c5;
          background: #edf6ff;
          color: #294b68;
        }
        .richEditorBody blockquote[data-tone="rose"] {
          border-color: #f0cbd1;
          border-left-color: #ce6b78;
          background: #fff0f2;
          color: #684047;
        }
        .richEditorBody blockquote[data-tone="gold"] {
          border-color: #ead99b;
          border-left-color: #d0ad45;
          background: #fff8df;
          color: #5c5132;
        }
        .richEditorBody blockquote[data-tone="red"] {
          border-color: #f1c4c4;
          border-left-color: #d84343;
          background: #fff0f0;
          color: #742d2d;
        }
        .richEditorBody a {
          color: #087a4d !important;
          text-decoration: underline !important;
          text-decoration-thickness: 2px !important;
          text-underline-offset: 3px !important;
          font-weight: 700 !important;
          cursor: pointer;
        }
        .richEditorBody a:hover {
          color: #075b3b !important;
          background: #e5f4e9;
          border-radius: 3px;
        }
        .richEditorBody a::selection {
          color: #087a4d !important;
          background: #cbd5e1;
        }
        .richEditorBody img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 18px auto;
          border-radius: 14px;
          box-shadow: 0 5px 18px rgba(23, 61, 46, 0.18);
        }
        .richEditorBody p.is-editor-empty:first-child:before {
          content: "Write or paste the complete Islamic chapter here...";
          float: left;
          color: #89968f;
          pointer-events: none;
          height: 0;
        }
        .editorFooter {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          border-top: 1px solid #e1ebe4;
          background: #f2f8f4;
          color: #60766a;
          font-size: 10px;
        }
        .editorFooter b {
          color: #087a4d;
        }
        .sharedPreviewStage {
          padding: 22px;
          background: linear-gradient(145deg, #eef7f1, #f8fbf9);
          min-height: 430px;
        }
        .sharedPreviewStage.appStage {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .sharedAppPhone {
          width: min(100%, 390px);
          min-height: 560px;
          border: 9px solid #173d2e;
          border-radius: 34px;
          overflow: hidden;
          background: #f8fbf8;
          box-shadow: 0 18px 42px rgba(23, 61, 46, 0.18);
        }
        .sharedAppTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 9px 17px 7px;
          background: #fff;
          color: #315747;
          font-size: 9px;
        }
        .sharedAppTop b {
          font-size: 10px;
        }
        .sharedAppHeader {
          display: grid;
          grid-template-columns: 30px 1fr 30px;
          align-items: center;
          padding: 13px 16px;
          border-bottom: 1px solid #dce8df;
          background: #fff;
          color: #075b3b;
        }
        .sharedAppHeader b {
          text-align: center;
          font: 700 18px Georgia;
        }
        .sharedAppHeader span:last-child {
          text-align: right;
        }
        .sharedAppPreview {
          margin: 14px;
          padding: 20px;
          border: 1px solid #d6e4da;
          border-radius: 17px;
          background: #fff;
          box-shadow: 0 4px 14px rgba(23, 61, 46, 0.07);
        }
        .sharedWebBrowser {
          max-width: 1040px;
          margin: auto;
          border: 1px solid #c9d9ce;
          border-radius: 15px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 15px 38px rgba(23, 61, 46, 0.12);
        }
        .sharedBrowserBar {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 11px 15px;
          background: #e7f0ea;
        }
        .sharedBrowserBar i {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #d0ad45;
        }
        .sharedBrowserBar i:nth-child(2) {
          background: #7db996;
        }
        .sharedBrowserBar i:nth-child(3) {
          background: #087a4d;
        }
        .sharedBrowserBar span {
          margin-left: 10px;
          padding: 5px 13px;
          border-radius: 12px;
          background: #fff;
          color: #718078;
          font-size: 10px;
        }
        .sharedWebHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 17px 24px;
          background: linear-gradient(105deg, #075b3b, #0b8a59);
          color: #fff;
        }
        .sharedWebHeader b {
          font: 700 22px Georgia;
        }
        .sharedWebHeader span {
          font-size: 11px;
        }
        .sharedWebPreview {
          padding: 30px 34px;
          min-height: 430px;
        }
        .previewEditHint {
          margin: 12px 0 0;
          color: #60766a;
          font-size: 10px;
          text-align: center;
        }
        .richPreviewContent {
          outline: none;
          color: #263f34;
          font:
            16px/1.75 Arial,
            sans-serif;
          overflow-wrap: anywhere;
        }
        .richPreviewContent:focus {
          box-shadow: inset 0 0 0 2px rgba(8, 122, 77, 0.22);
        }
        .richPreviewContent p {
          margin: 8px 0 13px;
        }
        .richPreviewContent h1,
        .richPreviewContent h2,
        .richPreviewContent h3,
        .richPreviewContent h4 {
          color: inherit;
          line-height: 1.3;
          margin: 22px 0 10px;
        }
        .richPreviewContent h1 {
          font-size: 32px;
        }
        .richPreviewContent h2 {
          font-size: 27px;
        }
        .richPreviewContent h3 {
          font-size: 21px;
        }
        .richPreviewContent h4 {
          font-size: 17px;
        }
        .richPreviewContent strong {
          font-weight: 800;
          color: #173d2e;
        }
        .richPreviewContent em {
          font-style: italic;
        }
        .richPreviewContent ul,
        .richPreviewContent ol {
          display: block !important;
          padding-left: 30px;
          margin: 12px 0;
        }
        .richPreviewContent ul {
          list-style: disc outside !important;
        }
        .richPreviewContent ol {
          list-style: decimal outside !important;
        }
        .richPreviewContent li {
          display: list-item !important;
          margin: 6px 0;
          padding-left: 4px;
        }
        .richPreviewContent li::marker {
          color: #087a4d;
          font-weight: 800;
        }
        .richPreviewContent blockquote {
          margin: 18px 0;
          padding: 16px 19px;
          border: 1px solid #ead99b;
          border-left: 5px solid #d0ad45;
          border-radius: 13px;
          background: #fff8df;
          color: #5c5132;
        }
        .richPreviewContent blockquote[data-tone="green"] {
          border-color: #bfe5ce;
          border-left-color: #27a36a;
          background: #eaf8ef;
          color: #28533d;
        }
        .richPreviewContent blockquote[data-tone="blue"] {
          border-color: #c5dcf1;
          border-left-color: #4285c5;
          background: #edf6ff;
          color: #294b68;
        }
        .richPreviewContent blockquote[data-tone="rose"],
        .richPreviewContent blockquote[data-tone="red"] {
          border-color: #f0cbd1;
          border-left-color: #ce6b78;
          background: #fff0f2;
          color: #684047;
        }
        .richPreviewContent span[data-selection-style] {
          color: inherit;
          font-weight: 800;
          line-height: 1.3;
        }
        .richPreviewContent span[data-selection-style="heading1"] {
          font-size: 2em;
        }
        .richPreviewContent span[data-selection-style="heading2"] {
          font-size: 1.65em;
        }
        .richPreviewContent span[data-selection-style="heading3"] {
          font-size: 1.35em;
        }
        .richPreviewContent span[data-selection-style="heading4"] {
          font-size: 1.12em;
        }
        .richPreviewContent span[data-inline-quote] {
          padding: 2px 5px;
          border-radius: 5px;
          background: #fff8df;
          color: #5c5132;
        }
        .richPreviewContent a {
          color: #087a4d;
          text-decoration: underline;
          font-weight: 700;
        }
        .richPreviewContent img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 18px auto;
          border-radius: 14px;
        }
        .sharedAppPreview.richPreviewContent {
          font-size: 17px;
          line-height: 1.72;
        }
        .sharedAppPreview.richPreviewContent h1 {
          font-size: 28px;
        }
        .sharedAppPreview.richPreviewContent h2 {
          font-size: 24px;
        }
        .sharedAppPreview.richPreviewContent h3 {
          font-size: 20px;
        }
        @media (max-width: 700px) {
          .sharedPreviewStage {
            padding: 12px;
          }
          .sharedWebPreview {
            padding: 20px;
          }
          .sharedWebHeader span {
            display: none;
          }
        }
        .richEditorLoading {
          min-height: 160px;
          padding: 25px;
          border: 1px solid #cfddd3;
          border-radius: 12px;
          color: #718078;
        }
      `}</style>
    </div>
  );
}
