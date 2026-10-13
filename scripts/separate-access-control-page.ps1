$team = Join-Path $PSScriptRoot '..\admin-panel\app\team\page.tsx'
$text = [IO.File]::ReadAllText($team)
$pattern = '<section className="panel members">.*?</section></section><style jsx>'
if (-not [regex]::IsMatch($text,$pattern)) { throw 'Current team panel marker not found' }
$text = [regex]::Replace($text,$pattern,'</section><style jsx>',1)
$text = $text.Replace('.layout{display:grid;grid-template-columns:minmax(540px,1fr) minmax(540px,1fr);gap:20px;margin-top:18px;align-items:start}', '.layout{display:block;max-width:860px;margin-top:18px}')
[IO.File]::WriteAllText($team,$text,[Text.UTF8Encoding]::new($false))

$home = Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx'
$text = [IO.File]::ReadAllText($home)
$text = $text.Replace('"team"|"deletion-requests"|"activity-log"', '"team"|"access-control"|"deletion-requests"|"activity-log"')
$oldMenu = '<button className={view==="team"?"active":""} onClick={()=>setView("team")}><NavIcon name="team"/><span>Team &amp; Permissions</span></button><button className={view==="deletion-requests"'
$newMenu = '<button className={view==="team"?"active":""} onClick={()=>setView("team")}><NavIcon name="team"/><span>Add Team Member</span></button><button className={view==="access-control"?"active":""} onClick={()=>setView("access-control")}><NavIcon name="security"/><span>Access Control</span></button><button className={view==="deletion-requests"'
if (-not $text.Contains($oldMenu)) { throw 'Team navigation marker not found' }
$text = $text.Replace($oldMenu,$newMenu)
$marker = '{view==="activity-log"&&<section style={{height:"calc(100vh - 125px)"'
$insert = '{view==="access-control"&&<section style={{height:"calc(100vh - 125px)",overflow:"hidden",borderRadius:18,background:"#fff",boxShadow:"0 8px 28px rgba(20,60,43,.08)"}}><iframe title="Access Control" src="/access-control" style={{width:"100%",height:"100%",border:0}}/></section>}' + $marker
if (-not $text.Contains($marker)) { throw 'Activity page marker not found' }
$text = $text.Replace($marker,$insert)
[IO.File]::WriteAllText($home,$text,[Text.UTF8Encoding]::new($false))
