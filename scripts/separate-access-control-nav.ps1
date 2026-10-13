$dashboardPath = Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx'
$text = [IO.File]::ReadAllText($dashboardPath)
$text = $text.Replace('"team"|"deletion-requests"|"activity-log"', '"team"|"access-control"|"deletion-requests"|"activity-log"')
$oldMenu = '<button className={view==="team"?"active":""} onClick={()=>setView("team")}><NavIcon name="team"/><span>Team &amp; Permissions</span></button><button className={view==="deletion-requests"'
$newMenu = '<button className={view==="team"?"active":""} onClick={()=>setView("team")}><NavIcon name="team"/><span>Add Team Member</span></button><button className={view==="access-control"?"active":""} onClick={()=>setView("access-control")}><NavIcon name="security"/><span>Access Control</span></button><button className={view==="deletion-requests"'
if (-not $text.Contains($oldMenu)) { throw 'Team navigation marker not found' }
$text = $text.Replace($oldMenu,$newMenu)
$marker = '{view==="activity-log"&&<section style={{height:"calc(100vh - 125px)"'
$insert = '{view==="access-control"&&<section style={{height:"calc(100vh - 125px)",overflow:"hidden",borderRadius:18,background:"#fff",boxShadow:"0 8px 28px rgba(20,60,43,.08)"}}><iframe title="Access Control" src="/access-control" style={{width:"100%",height:"100%",border:0}}/></section>}' + $marker
if (-not $text.Contains($marker)) { throw 'Activity page marker not found' }
$text = $text.Replace($marker,$insert)
[IO.File]::WriteAllText($dashboardPath,$text,[Text.UTF8Encoding]::new($false))
