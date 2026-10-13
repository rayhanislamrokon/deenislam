$path = Join-Path $PSScriptRoot '..\admin-panel\app\islamic-lifestyle\RichTextEditor.tsx'
$content = [IO.File]::ReadAllText($path)

$needle = 'const InlineQuote = Mark.create({'
$mark = @'
const SelectionStyle = Mark.create({
  name: "selectionStyle",
  addAttributes() {
    return { kind: { default: "heading1", parseHTML: element => element.getAttribute("data-selection-style") || "heading1", renderHTML: attributes => ({ "data-selection-style": attributes.kind }) } };
  },
  parseHTML() { return [{ tag: "span[data-selection-style]" }]; },
  renderHTML({ HTMLAttributes }) { return ["span", mergeAttributes(HTMLAttributes), 0]; },
});

'@
if (-not $content.Contains($needle)) { throw 'InlineQuote marker not found.' }
$content = $content.Replace($needle,$mark+$needle)
$content = $content.Replace('      InlineQuote,', "      InlineQuote,`r`n      SelectionStyle,")

$helperNeedle = '  const clearFormatting = () => {'
$helper = @'
  const selectedStyle = (kind: string, blockAction: () => void) => {
    if (editor.state.selection.empty) { blockAction(); return; }
    const current=editor.getAttributes("selectionStyle").kind;
    if(editor.isActive("selectionStyle")&&current===kind) editor.chain().focus().unsetMark("selectionStyle").run();
    else editor.chain().focus().setMark("selectionStyle",{kind}).run();
  };
  const selectedList = (type: "bullet"|"number", blockAction: () => void) => {
    const {from,to,empty}=editor.state.selection;
    if(empty){blockAction();return}
    const selected=editor.state.doc.textBetween(from,to," ");
    editor.chain().focus().deleteSelection().insertContent(`${type==="bullet"?"• ":"1. "}${selected}`).run();
  };

'@
if (-not $content.Contains($helperNeedle)) { throw 'clearFormatting marker not found.' }
$content = $content.Replace($helperNeedle,$helper+$helperNeedle)

$replacements = @(
  @('<Tool title="Heading 1" icon="H1" label="Title" active={editor.isActive("heading", { level: 1 })} action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />','<Tool title="Heading 1" icon="H1" label="Title" active={editor.isActive("heading", { level: 1 })||editor.getAttributes("selectionStyle").kind==="heading1"} action={() => selectedStyle("heading1",()=>editor.chain().focus().toggleHeading({ level: 1 }).run())} />'),
  @('<Tool title="Heading 2" icon="H2" label="Heading" active={editor.isActive("heading", { level: 2 })} action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />','<Tool title="Heading 2" icon="H2" label="Heading" active={editor.isActive("heading", { level: 2 })||editor.getAttributes("selectionStyle").kind==="heading2"} action={() => selectedStyle("heading2",()=>editor.chain().focus().toggleHeading({ level: 2 }).run())} />'),
  @('<Tool title="Heading 3" icon="H3" label="Subheading" active={editor.isActive("heading", { level: 3 })} action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />','<Tool title="Heading 3" icon="H3" label="Subheading" active={editor.isActive("heading", { level: 3 })||editor.getAttributes("selectionStyle").kind==="heading3"} action={() => selectedStyle("heading3",()=>editor.chain().focus().toggleHeading({ level: 3 }).run())} />'),
  @('<Tool title="Heading 4" icon="H4" label="Minor heading" active={editor.isActive("heading", { level: 4 })} action={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} />','<Tool title="Heading 4" icon="H4" label="Minor heading" active={editor.isActive("heading", { level: 4 })||editor.getAttributes("selectionStyle").kind==="heading4"} action={() => selectedStyle("heading4",()=>editor.chain().focus().toggleHeading({ level: 4 }).run())} />'),
  @('<Tool title="Bullet list" icon="-" label="Bullets" active={editor.isActive("bulletList")} action={() => editor.chain().focus().toggleBulletList().run()} />','<Tool title="Bullet list" icon="-" label="Bullets" active={editor.isActive("bulletList")} action={() => selectedList("bullet",()=>editor.chain().focus().toggleBulletList().run())} />'),
  @('<Tool title="Numbered list" icon="1." label="Numbers" active={editor.isActive("orderedList")} action={() => editor.chain().focus().toggleOrderedList().run()} />','<Tool title="Numbered list" icon="1." label="Numbers" active={editor.isActive("orderedList")} action={() => selectedList("number",()=>editor.chain().focus().toggleOrderedList().run())} />')
)
foreach($pair in $replacements){if(-not $content.Contains($pair[0])){throw "Toolbar target missing: $($pair[0].Substring(0,30))"};$content=$content.Replace($pair[0],$pair[1])}

$cssNeedle = '      .richEditorBody span[data-inline-quote]{'
$css = '      .richEditorBody span[data-selection-style]{display:inline;color:#075b3b;font-weight:800;line-height:1.3}.richEditorBody span[data-selection-style="heading1"]{font-size:2em}.richEditorBody span[data-selection-style="heading2"]{font-size:1.65em}.richEditorBody span[data-selection-style="heading3"]{font-size:1.35em}.richEditorBody span[data-selection-style="heading4"]{font-size:1.12em}' + "`r`n" + $cssNeedle
if (-not $content.Contains($cssNeedle)) { throw 'Inline quote CSS marker missing.' }
$content = $content.Replace($cssNeedle,$css)
[IO.File]::WriteAllText($path,$content,[Text.UTF8Encoding]::new($false))
