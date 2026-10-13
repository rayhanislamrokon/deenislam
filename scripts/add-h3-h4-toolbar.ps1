$path = 'J:\REACT NATIVE APPS\DeenIslam\admin-panel\app\islamic-lifestyle\page.tsx'
$s = [IO.File]::ReadAllText($path)
$h2 = '<button type="button" title="Heading 2" onClick={()=>format("## ","","Heading")}>H2</button>'
$headings = $h2 + '<button type="button" title="Heading 3" onClick={()=>format("### ","","Heading")}>H3</button><button type="button" title="Heading 4" onClick={()=>format("#### ","","Heading")}>H4</button>'
if (-not $s.Contains($h2)) { throw 'H2 toolbar button not found.' }
$s = $s.Replace($h2, $headings)
[IO.File]::WriteAllText($path, $s, (New-Object Text.UTF8Encoding($false)))
