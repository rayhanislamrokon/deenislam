$path = Join-Path $PSScriptRoot '..\admin-panel\app\islamic-lifestyle\RichTextEditor.tsx'
$content = [IO.File]::ReadAllText($path)

$content = $content.Replace('import Blockquote from "@tiptap/extension-blockquote";', 'import Blockquote from "@tiptap/extension-blockquote";' + "`r`n" + 'import { Mark, mergeAttributes } from "@tiptap/core";')

$needle = 'const ColoredBlockquote = Blockquote.extend({'
$inline = @'
const InlineQuote = Mark.create({
  name: "inlineQuote",
  addAttributes() {
    return { tone: { default: "gold", parseHTML: element => element.getAttribute("data-tone") || "gold" } };
  },
  parseHTML() { return [{ tag: "span[data-inline-quote]" }]; },
  renderHTML({ HTMLAttributes }) { return ["span", mergeAttributes(HTMLAttributes, { "data-inline-quote": "true" }), 0]; },
});

'@
if (-not $content.Contains($needle)) { throw 'ColoredBlockquote declaration not found.' }
$content = $content.Replace($needle,$inline+$needle)
$content = $content.Replace('      ColoredBlockquote,', "      ColoredBlockquote,`r`n      InlineQuote,")

$oldTool = '<Tool title="Block quote and color" icon=">" label="Quote" active={editor.isActive("blockquote")} action={() => { if(!editor.isActive("blockquote")) editor.chain().focus().toggleBlockquote().updateAttributes("blockquote",{tone:"gold"}).run(); setQuotePanel(current=>!current); }} />'
$newTool = '<Tool title="Quote selected text or paragraph" icon=">" label="Quote" active={editor.isActive("blockquote")||editor.isActive("inlineQuote")} action={() => { const partial=!editor.state.selection.empty; if(partial){editor.chain().focus().toggleMark("inlineQuote",{tone:"gold"}).run()}else if(!editor.isActive("blockquote")){editor.chain().focus().toggleBlockquote().updateAttributes("blockquote",{tone:"gold"}).run()} setQuotePanel(current=>!current); }} />'
if (-not $content.Contains($oldTool)) { throw 'Quote toolbar action not found.' }
$content = $content.Replace($oldTool,$newTool)

$oldTone = 'className={editor.getAttributes("blockquote").tone===option.tone?`quoteTone ${option.tone} selected`:`quoteTone ${option.tone}`} onMouseDown={event=>{event.preventDefault();editor.chain().focus().updateAttributes("blockquote",{tone:option.tone}).run();setQuotePanel(false)}}'
$newTone = 'className={(editor.getAttributes("inlineQuote").tone||editor.getAttributes("blockquote").tone)===option.tone?`quoteTone ${option.tone} selected`:`quoteTone ${option.tone}`} onMouseDown={event=>{event.preventDefault();const type=editor.isActive("inlineQuote")?"inlineQuote":"blockquote";editor.chain().focus().updateAttributes(type,{tone:option.tone}).run();setQuotePanel(false)}}'
if (-not $content.Contains($oldTone)) { throw 'Quote colour action not found.' }
$content = $content.Replace($oldTone,$newTone)

$oldRemove = 'onMouseDown={event=>{event.preventDefault();if(editor.isActive("blockquote"))editor.chain().focus().toggleBlockquote().run();setQuotePanel(false)}}>Remove quote</button>'
$newRemove = 'onMouseDown={event=>{event.preventDefault();if(editor.isActive("inlineQuote"))editor.chain().focus().unsetMark("inlineQuote").run();else if(editor.isActive("blockquote"))editor.chain().focus().toggleBlockquote().run();setQuotePanel(false)}}>Remove quote</button>'
if (-not $content.Contains($oldRemove)) { throw 'Remove quote action not found.' }
$content = $content.Replace($oldRemove,$newRemove)

$cssNeedle = '      .richEditorBody blockquote{position:relative;'
$css = '      .richEditorBody span[data-inline-quote]{display:inline;padding:2px 5px;border-radius:5px;background:#fff8df;color:#5c5132;box-decoration-break:clone;-webkit-box-decoration-break:clone}.richEditorBody span[data-inline-quote][data-tone="green"]{background:#eaf8ef;color:#28533d}.richEditorBody span[data-inline-quote][data-tone="blue"]{background:#edf6ff;color:#294b68}.richEditorBody span[data-inline-quote][data-tone="rose"]{background:#fff0f2;color:#684047}.richEditorBody span[data-inline-quote][data-tone="red"]{background:#fff0f0;color:#a12626}`r`n' + $cssNeedle
if (-not $content.Contains($cssNeedle)) { throw 'Blockquote CSS not found.' }
$content = $content.Replace($cssNeedle,$css)

[IO.File]::WriteAllText($path,$content,[Text.UTF8Encoding]::new($false))
