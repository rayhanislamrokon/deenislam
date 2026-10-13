$path = 'J:\REACT NATIVE APPS\DeenIslam\admin-panel\app\page.tsx'
$s = [IO.File]::ReadAllText($path)
$s = $s.Replace('useState<"overview"|"users"|"devices"|"ads"|"books"|"security">("overview")', 'useState<"overview"|"users"|"devices"|"ads"|"books"|"lifestyle"|"security">("overview")')
$s = $s.Replace('<button onClick={()=>window.location.href="/islamic-lifestyle"}>☘ <span>Lifestyle Content</span></button>', '<button className={view==="lifestyle"?"active":""} onClick={()=>setView("lifestyle")}>☘ <span>Lifestyle Content</span></button>')
$marker = '{view==="overview"&&<>'
$embedded = '{view==="lifestyle"&&<section style={{height:"calc(100vh - 125px)",overflow:"hidden",borderRadius:18,background:"#fff",boxShadow:"0 8px 28px rgba(20,60,43,.08)"}}><iframe title="Islamic Lifestyle Content Manager" src="/islamic-lifestyle" style={{width:"100%",height:"100%",border:0}}/></section>}' + $marker
if (-not $s.Contains($marker)) { throw 'Dashboard content marker not found.' }
$s = $s.Replace($marker, $embedded)
[IO.File]::WriteAllText($path, $s, (New-Object Text.UTF8Encoding($false)))
