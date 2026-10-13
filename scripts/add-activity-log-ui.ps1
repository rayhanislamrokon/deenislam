$path = Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx'
$text = [IO.File]::ReadAllText($path)
$text = $text.Replace('"team"|"deletion-requests"|"devices"', '"team"|"deletion-requests"|"activity-log"|"devices"')
$old = '<button className={view==="deletion-requests"?"active":""} onClick={()=>setView("deletion-requests")}><NavIcon name="security"/><span>Deletion Requests</span></button><button className={view==="devices"'
$new = '<button className={view==="deletion-requests"?"active":""} onClick={()=>setView("deletion-requests")}><NavIcon name="security"/><span>Deletion Requests</span></button><button className={view==="activity-log"?"active":""} onClick={()=>setView("activity-log")}><NavIcon name="ads"/><span>Admin Activity Log</span></button><button className={view==="devices"'
if (-not $text.Contains($old)) { throw 'Deletion menu marker not found' }
$text = $text.Replace($old, $new)
$marker = '{view==="deletion-requests"&&<section style={{height:"calc(100vh - 125px)"'
$insert = '{view==="activity-log"&&<section style={{height:"calc(100vh - 125px)",overflow:"hidden",borderRadius:18,background:"#fff",boxShadow:"0 8px 28px rgba(20,60,43,.08)"}}><iframe title="Admin Activity Log" src="/activity-log" style={{width:"100%",height:"100%",border:0}}/></section>}' + $marker
if (-not $text.Contains($marker)) { throw 'Deletion page marker not found' }
$text = $text.Replace($marker, $insert)
[IO.File]::WriteAllText($path, $text, [Text.UTF8Encoding]::new($false))
