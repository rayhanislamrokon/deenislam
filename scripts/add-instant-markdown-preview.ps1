$path = 'J:\REACT NATIVE APPS\DeenIslam\admin-panel\app\islamic-lifestyle\page.tsx'
$s = [IO.File]::ReadAllText($path)
$s = $s.Replace('setForm({...form,content:next});requestAnimationFrame', 'setForm({...form,content:next});setPreview(true);requestAnimationFrame')
$toolbarEnd = '</div><input ref={imageInputRef}'
$instant = '</div>{preview&&<div className="instantPreview"><div><b>FORMATTED RESULT</b><span>Changes appear here</span></div><article><ReactMarkdown>{form.content||"Nothing to preview yet."}</ReactMarkdown></article></div>}<input ref={imageInputRef}'
if (-not $s.Contains($toolbarEnd)) { throw 'Toolbar/image marker missing.' }
$s = $s.Replace($toolbarEnd, $instant)
$oldLargePreview = '{preview&&<div className="markdownPreview"><div><b>FORMATTED PREVIEW</b><button type="button" onClick={()=>setPreview(false)}>Close</button></div><article><ReactMarkdown>{form.content||"Nothing to preview yet."}</ReactMarkdown></article></div>}'
$s = $s.Replace($oldLargePreview, '')
$cssMarker = '.markdownToolbar+textarea{border-radius:0 0 11px 11px}'
$css = '.instantPreview{border:1px solid #b8d3c0;border-top:0;background:#fff}.instantPreview>div{padding:7px 11px;background:#e6f3e9;display:flex;justify-content:space-between}.instantPreview>div b{font-size:9px;letter-spacing:.8px;color:#087a4d}.instantPreview>div span{font-size:9px;color:#718078}.instantPreview article{max-height:180px;overflow:auto;padding:13px 16px;line-height:1.65;color:#203f31}.instantPreview article h1,.instantPreview article h2,.instantPreview article h3{color:#075b3b}.instantPreview article img{max-width:100%;border-radius:9px}.instantPreview+input+textarea,.markdownToolbar+input+textarea{border-radius:0 0 11px 11px}'
if (-not $s.Contains($cssMarker)) { throw 'Textarea toolbar CSS marker missing.' }
$s = $s.Replace($cssMarker, $css)
[IO.File]::WriteAllText($path, $s, (New-Object Text.UTF8Encoding($false)))
