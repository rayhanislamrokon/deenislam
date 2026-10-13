$path = 'J:\REACT NATIVE APPS\DeenIslam\admin-panel\app\islamic-lifestyle\page.tsx'
$s = [IO.File]::ReadAllText($path)
$startMarker = '<div className="markdownToolbar"'
$endMarker = '</div><textarea ref={editorRef}'
$start = $s.IndexOf($startMarker)
$end = $s.IndexOf($endMarker, $start)
if ($start -lt 0 -or $end -lt 0) { throw 'Markdown toolbar block not found.' }
$toolbar = '<div className="markdownToolbar" role="toolbar" aria-label="Markdown formatting"><button type="button" title="Heading 1" onClick={()=>format("# ","","Heading")}>H1</button><button type="button" title="Heading 2" onClick={()=>format("## ","","Heading")}>H2</button><i/><button type="button" title="Bold" onClick={()=>format("**","**","bold text")}><b>B</b></button><button type="button" title="Italic" onClick={()=>format("*","*","italic text")}><em>I</em></button><button type="button" title="Bullet list" onClick={()=>lineFormat("- ")}>Bullets</button><button type="button" title="Numbered list" onClick={()=>lineFormat("1. ")}>Numbers</button><button type="button" title="Quote" onClick={()=>lineFormat("> ","Quoted text")}>Quote</button><button type="button" title="Link" onClick={()=>format("[","](https://)","link title")}>Link</button><button type="button" title="Quran reference block" onClick={()=>format("\n> **Quran ","**\n> Translation and explanation\n","51:56")}>Quran</button><button type="button" title="Divider" onClick={()=>format("\n---\n","","")}>Divider</button></div><textarea ref={editorRef}'
$s = $s.Remove($start, ($end + $endMarker.Length) - $start).Insert($start, $toolbar)
$s = [regex]::Replace($s, 'Quran 51:56 [^<"\r\n]*explanation\.\.\.', 'Quran 51:56 - explanation...')
[IO.File]::WriteAllText($path, $s, (New-Object Text.UTF8Encoding($false)))
