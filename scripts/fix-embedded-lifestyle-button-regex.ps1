$path = 'J:\REACT NATIVE APPS\DeenIslam\admin-panel\app\page.tsx'
$s = [IO.File]::ReadAllText($path)
$pattern = '<button onClick=\{\(\)=>window\.location\.href="/islamic-lifestyle"\}>.*?<span>Lifestyle Content</span></button>'
$new = '<button className={view==="lifestyle"?"active":""} onClick={()=>setView("lifestyle")}><span>Lifestyle Content</span></button>'
$updated = [regex]::Replace($s, $pattern, $new, 1)
if ($updated -eq $s) { throw 'Lifestyle sidebar button not found.' }
[IO.File]::WriteAllText($path, $updated, (New-Object Text.UTF8Encoding($false)))
