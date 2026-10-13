$path = Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx'
$text = [IO.File]::ReadAllText($path)
$text = $text.Replace('"overview"|"users"|"team"|"devices"', '"overview"|"users"|"team"|"deletion-requests"|"devices"')
$old = '<button className={view==="team"?"active":""} onClick={()=>setView("team")}>&#9813; <span>Team &amp; Permissions</span></button><button className={view==="devices"'
if (-not $text.Contains($old)) {
 $old = '<button className={view==="team"?"active":""} onClick={()=>setView("team")}><NavIcon name="team"/><span>Team &amp; Permissions</span></button><button className={view==="devices"'
}
$new = '<button className={view==="team"?"active":""} onClick={()=>setView("team")}><NavIcon name="team"/><span>Team &amp; Permissions</span></button><button className={view==="deletion-requests"?"active":""} onClick={()=>setView("deletion-requests")}><NavIcon name="security"/><span>Deletion Requests</span></button><button className={view==="devices"'
if (-not $text.Contains($old)) { throw 'Team menu marker not found' }
$text = $text.Replace($old, $new)
$marker = '{view==="team"&&<section style={{height:"calc(100vh - 125px)"'
$insert = '{view==="deletion-requests"&&<section style={{height:"calc(100vh - 125px)",overflow:"hidden",borderRadius:18,background:"#fff",boxShadow:"0 8px 28px rgba(20,60,43,.08)"}}><iframe title="Deletion Requests" src="/deletion-requests" style={{width:"100%",height:"100%",border:0}}/></section>}' + $marker
if (-not $text.Contains($marker)) { throw 'Team page marker not found' }
$text = $text.Replace($marker, $insert)
[IO.File]::WriteAllText($path, $text, [Text.UTF8Encoding]::new($false))
