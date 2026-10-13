$target = Join-Path $PSScriptRoot '..\admin-panel\app\islamic-lifestyle\RichTextEditor.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = $source.Replace('import Image from "@tiptap/extension-image";', 'import Image from "@tiptap/extension-image";' + "`n" + 'import Blockquote from "@tiptap/extension-blockquote";')
$extension = 'const ColoredBlockquote = Blockquote.extend({' + "`n" + '  addAttributes() {' + "`n" + '    return { tone: { default: "gold", parseHTML: element => element.getAttribute("data-tone") || "gold", renderHTML: attributes => ({ "data-tone": attributes.tone || "gold" }) } };' + "`n" + '  },' + "`n" + '});' + "`n`n"
$source = $source.Replace('type Props = {',$extension+'type Props = {')
$source = $source.Replace('const [linkText, setLinkText] = useState("");','const [linkText, setLinkText] = useState("");'+"`n"+'  const [quotePanel, setQuotePanel] = useState(false);')
$source = $source.Replace('StarterKit.configure({ gapcursor: false, dropcursor: false }),','StarterKit.configure({ gapcursor: false, dropcursor: false, blockquote: false }),'+"`n"+'      ColoredBlockquote,')
$oldTool = '<Tool title="Block quote" icon=">" label="Quote" active={editor.isActive("blockquote")} action={() => editor.chain().focus().toggleBlockquote().run()} />'
$newTool = '<Tool title="Block quote and color" icon=">" label="Quote" active={editor.isActive("blockquote")} action={() => { if(!editor.isActive("blockquote")) editor.chain().focus().toggleBlockquote().updateAttributes("blockquote",{tone:"gold"}).run(); setQuotePanel(current=>!current); }} />'
if (-not $source.Contains($oldTool)) { throw 'Quote tool marker not found' }
$source = $source.Replace($oldTool,$newTool)
$inputLine = '      <input ref={fileRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={event => void uploadImage(event.target.files?.[0])} />'
$pattern = [regex]::Escape($inputLine) + '\r?\n    </div>'
$replacement = $inputLine + "`n    </div>`n" + '    {quotePanel&&<div className="quotePalette"><b>Quote colour</b>{[{tone:"gold",label:"Gold"},{tone:"green",label:"Green"},{tone:"blue",label:"Blue"},{tone:"rose",label:"Rose"}].map(option=><button key={option.tone} type="button" className={editor.getAttributes("blockquote").tone===option.tone?`quoteTone ${option.tone} selected`:`quoteTone ${option.tone}`} onMouseDown={event=>{event.preventDefault();editor.chain().focus().updateAttributes("blockquote",{tone:option.tone}).run();setQuotePanel(false)}}><i/>{option.label}</button>)}<button type="button" className="removeQuote" onMouseDown={event=>{event.preventDefault();if(editor.isActive("blockquote"))editor.chain().focus().toggleBlockquote().run();setQuotePanel(false)}}>Remove quote</button></div>}'
$updated = [regex]::Replace($source,$pattern,[System.Text.RegularExpressions.MatchEvaluator]{param($m)$replacement},1)
if ($updated -eq $source) { throw 'Toolbar end marker not found' }
$source = $updated
$paletteCss = '      .quotePalette{display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:9px 11px;border-bottom:1px solid #c8d9cd;background:#f5faf6}.quotePalette>b{margin-right:4px;color:#315747;font-size:10px}.quotePalette button{display:flex;align-items:center;gap:5px;padding:7px 9px;border:1px solid #c9d9ce;border-radius:8px;background:#fff;color:#315747;font-size:10px;font-weight:800;cursor:pointer}.quotePalette button.selected{box-shadow:0 0 0 2px #087a4d33;border-color:#087a4d}.quoteTone i{width:13px;height:13px;border-radius:4px}.quoteTone.gold i{background:#d0ad45}.quoteTone.green i{background:#27a36a}.quoteTone.blue i{background:#4285c5}.quoteTone.rose i{background:#ce6b78}.quotePalette .removeQuote{margin-left:auto;background:#fff0ed;color:#a84432}' + "`n"
$source = $source.Replace('      .richEditorBody blockquote{',$paletteCss+'      .richEditorBody blockquote{')
$oldQuoteCss = '.richEditorBody blockquote p{margin:0}'
$newQuoteCss = '.richEditorBody blockquote p{margin:0}.richEditorBody blockquote[data-tone="green"]{border-left-color:#27a36a;background:#eaf8ef;color:#28533d}.richEditorBody blockquote[data-tone="blue"]{border-left-color:#4285c5;background:#edf6ff;color:#294b68}.richEditorBody blockquote[data-tone="rose"]{border-left-color:#ce6b78;background:#fff0f2;color:#684047}.richEditorBody blockquote[data-tone="gold"]{border-left-color:#d0ad45;background:#fff8df;color:#5c5132}'
$source = $source.Replace($oldQuoteCss,$newQuoteCss)
Set-Content -LiteralPath $target -Value $source -NoNewline
