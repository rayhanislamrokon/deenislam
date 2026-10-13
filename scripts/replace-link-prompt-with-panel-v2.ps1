$path = 'admin-panel/app/islamic-lifestyle/RichTextEditor.tsx'
$text = Get-Content -Raw $path
$text = $text.Replace('const imagePositionRef = useRef<number | null>(null);', 'const imagePositionRef = useRef<number | null>(null);' + "`r`n" + '  const linkSelectionRef = useRef({ from: 1, to: 1 });')
$text = $text.Replace('const [uploading, setUploading] = useState(false);', 'const [uploading, setUploading] = useState(false);' + "`r`n" + '  const [linkPanel, setLinkPanel] = useState(false);' + "`r`n" + '  const [linkUrl, setLinkUrl] = useState("");' + "`r`n" + '  const [linkText, setLinkText] = useState("");')
$functionPattern = '(?s)  const addLink = \(\) => \{.*?\r?\n  \};\r?\n\r?\n  const clearFormatting'
$functionReplacement = @'
  const addLink = () => {
    const { from, to } = editor.state.selection;
    linkSelectionRef.current = { from, to };
    setLinkUrl(editor.getAttributes("link").href || "");
    setLinkText(from === to ? "" : editor.state.doc.textBetween(from, to, " "));
    setLinkPanel(true);
  };
  const normalizeUrl = (raw: string) => { const clean=raw.trim(); return /^(https?:\/\/|mailto:|tel:|#)/i.test(clean)?clean:`https://${clean}`; };
  const applyLink = () => {
    if (!linkUrl.trim()) { onMessage("Enter a website address."); return; }
    const href=normalizeUrl(linkUrl),{from,to}=linkSelectionRef.current;
    const chain=editor.chain().focus().setTextSelection({from,to});
    if(from===to){if(!linkText.trim()){onMessage("Enter the text that should be displayed.");return}chain.insertContent({type:"text",text:linkText.trim(),marks:[{type:"link",attrs:{href}}]}).run()}else chain.extendMarkRange("link").setLink({href}).run();
    setLinkPanel(false);onMessage("Link added successfully.");
  };
  const removeLink = () => {const{from,to}=linkSelectionRef.current;editor.chain().focus().setTextSelection({from,to}).extendMarkRange("link").unsetLink().run();setLinkPanel(false);onMessage("Link removed.")};

  const clearFormatting
'@
$updated = [regex]::Replace($text,$functionPattern,$functionReplacement,1)
if($updated -eq $text){throw 'Link function not found'}
$text=$updated
$toolbarPattern = '(?s)(<input ref=\{fileRef\} type="file" hidden accept="image/jpeg,image/png,image/webp".*?/>)\r?\n\s*</div>\r?\n\s*<EditorContent editor=\{editor\} />'
$toolbarReplacement = @'
$1
    </div>
    {linkPanel&&<div className="linkPanel"><div className="linkPanelTitle"><div><b>Add a link</b><span>Connect text to a website</span></div><button type="button" onClick={()=>setLinkPanel(false)}>x</button></div><div className="linkFields"><label><span>Website address</span><input autoFocus value={linkUrl} onChange={event=>setLinkUrl(event.target.value)} onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();applyLink()}}} placeholder="https://example.com"/></label><label><span>Display text</span><input value={linkText} disabled={linkSelectionRef.current.from!==linkSelectionRef.current.to} onChange={event=>setLinkText(event.target.value)} placeholder="Text shown to readers"/></label></div><div className="linkActions"><button type="button" className="removeLink" onClick={removeLink}>Remove link</button><button type="button" className="cancelLink" onClick={()=>setLinkPanel(false)}>Cancel</button><button type="button" className="applyLink" onClick={applyLink}>Apply link</button></div></div>}
    <EditorContent editor={editor} />
'@
$updated=[regex]::Replace($text,$toolbarPattern,$toolbarReplacement,1)
if($updated -eq $text){throw 'Toolbar point not found'}
$text=$updated
$styleNeedle='      .richEditorBody{min-height:430px;'
$styles='      .linkPanel{padding:15px 16px;border-bottom:1px solid #c8d9cd;background:#f5faf6}.linkPanelTitle{display:flex;justify-content:space-between;margin-bottom:12px}.linkPanelTitle b{display:block;font-size:15px;color:#173d2e}.linkPanelTitle span{display:block;margin-top:3px;font-size:10px;color:#718078}.linkPanelTitle>button{width:28px;height:28px;padding:0;border:0;border-radius:50%;background:#e2eee6;color:#315747}.linkFields{display:grid;grid-template-columns:1.25fr 1fr;gap:10px}.linkFields label span{display:block;margin-bottom:5px;font-size:10px;font-weight:800;color:#315747}.linkFields input{width:100%;height:40px;padding:0 11px;border:1px solid #bed1c4;border-radius:9px;background:#fff;outline:none}.linkFields input:focus{border-color:#087a4d;box-shadow:0 0 0 3px rgba(8,122,77,.1)}.linkFields input:disabled{background:#e9f0eb}.linkActions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}.linkActions button{padding:9px 13px;border:0;border-radius:8px;font-size:11px;font-weight:800}.removeLink{margin-right:auto;background:#fff0ed!important;color:#a84432!important}.cancelLink{background:#e6eee8!important;color:#315747!important}.applyLink{background:#087a4d!important;color:#fff!important}@media(max-width:700px){.linkFields{grid-template-columns:1fr}}' + "`r`n" + $styleNeedle
if(-not $text.Contains($styleNeedle)){throw 'Style point not found'}
$text=$text.Replace($styleNeedle,$styles)
Set-Content -Path $path -Value $text -Encoding utf8
