$path = 'J:\REACT NATIVE APPS\DeenIslam\admin-panel\app\islamic-lifestyle\page.tsx'
$s = [IO.File]::ReadAllText($path)
$startMarker = '<div className="markdownToolbar"'
$endMarker = '</div><textarea ref={editorRef}'
$start = $s.IndexOf($startMarker)
$end = $s.IndexOf($endMarker, $start)
if ($start -lt 0 -or $end -lt 0) { throw 'Markdown toolbar block not found.' }
$toolbar = '<div className="markdownToolbar" role="toolbar" aria-label="Markdown formatting"><button type="button" title="Bold" onClick={()=>format("**","**","bold text")}><b>B</b></button><button type="button" title="Italic" onClick={()=>format("*","*","italic text")}><em>I</em></button><button type="button" title="Heading" onClick={()=>format("## ","","Heading")}>H</button><i/><button type="button" title="Quote" onClick={()=>lineFormat("> ","Quoted text")}>&#8220;</button><button type="button" title="Bullet list" onClick={()=>lineFormat("- ")}>&#8226;&#8801;</button><button type="button" title="Numbered list" onClick={()=>lineFormat("1. ")}>1&#8801;</button><i/><button type="button" title="Link" onClick={()=>format("[","](https://)","link title")}>&#128279;</button><button type="button" title="Image" onClick={()=>format("![","](https://image-url)","image description")}>&#128444;</button><i/><button type="button" className={preview?"selected":""} title="Toggle preview" onClick={()=>setPreview(value=>!value)}>&#9673;</button><button type="button" className={markdownHelp?"selected":""} title="Markdown help" onClick={()=>setMarkdownHelp(value=>!value)}>?</button></div><textarea ref={editorRef}'
$s = $s.Remove($start, ($end + $endMarker.Length) - $start).Insert($start, $toolbar)
$oldCss = [regex]::Match($s, '\.markdownToolbar\{.*?\.markdownToolbar button\.selected\{.*?\}', [Text.RegularExpressions.RegexOptions]::Singleline).Value
if (-not $oldCss) { throw 'Markdown toolbar CSS block not found.' }
$newCss = '.markdownToolbar{display:flex;align-items:center;gap:2px;padding:8px 10px;border:1px solid #292929;border-bottom:0;border-radius:8px 8px 0 0;background:#303030}.markdownToolbar button{min-width:31px;height:31px;padding:4px 7px;border:0;border-radius:4px;background:transparent;color:#fff;font:700 17px Georgia,serif}.markdownToolbar button:hover{background:#4a4a4a}.markdownToolbar i{width:1px;height:22px;margin:0 5px;background:#737373}.markdownToolbar button.selected{background:#087a4d;color:#fff}'
$s = $s.Replace($oldCss, $newCss)
[IO.File]::WriteAllText($path, $s, (New-Object Text.UTF8Encoding($false)))
