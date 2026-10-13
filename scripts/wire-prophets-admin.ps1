$path = Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx'
$content = [IO.File]::ReadAllText((Resolve-Path $path), [Text.Encoding]::UTF8)
$nav = '<button className={view==="lifestyle"?"active":""} onClick={()=>setView("lifestyle")}><span>Lifestyle Categories</span></button>'
$content = $content.Replace($nav,$nav+'<button className={view==="prophets"?"active":""} onClick={()=>setView("prophets")}><span>Prophets Content</span></button>')
$frame = '{view==="lifestyle"&&<section style={{height:"calc(100vh - 125px)",overflow:"hidden",borderRadius:18,background:"#fff",boxShadow:"0 8px 28px rgba(20,60,43,.08)"}}><iframe title="Islamic Lifestyle Content Manager" src="/islamic-lifestyle" style={{width:"100%",height:"100%",border:0}}/></section>}'
$content = $content.Replace($frame,$frame+'{view==="prophets"&&<section style={{height:"calc(100vh - 125px)",overflow:"hidden",borderRadius:18,background:"#fff",boxShadow:"0 8px 28px rgba(20,60,43,.08)"}}><iframe title="Prophets Content Manager" src="/prophets" style={{width:"100%",height:"100%",border:0}}/></section>}')
[IO.File]::WriteAllText((Resolve-Path $path), $content, [Text.UTF8Encoding]::new($false))
