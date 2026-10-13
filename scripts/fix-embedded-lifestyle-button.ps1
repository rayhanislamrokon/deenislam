$path = 'J:\REACT NATIVE APPS\DeenIslam\admin-panel\app\page.tsx'
$s = [IO.File]::ReadAllText($path)
$old = '<button onClick={()=>window.location.href="/islamic-lifestyle"}>☘ <span>Lifestyle Content</span></button>'
$new = '<button className={view==="lifestyle"?"active":""} onClick={()=>setView("lifestyle")}>☘ <span>Lifestyle Content</span></button>'
if (-not $s.Contains($old)) { throw 'Lifestyle sidebar button not found.' }
$s = $s.Replace($old, $new)
[IO.File]::WriteAllText($path, $s, (New-Object Text.UTF8Encoding($false)))
