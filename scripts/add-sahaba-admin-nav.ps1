$path = Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx'
$text = [IO.File]::ReadAllText($path)
$text = $text.Replace('"lifestyle"|"prophets"|"quran"', '"lifestyle"|"prophets"|"sahaba"|"quran"')
$oldMenu = '<button className={view==="prophets"?"active":""} onClick={()=>setView("prophets")}><NavIcon name="prophets"/><span>Prophets Content</span></button><button className={view==="quran"'
$newMenu = '<button className={view==="prophets"?"active":""} onClick={()=>setView("prophets")}><NavIcon name="prophets"/><span>Prophets Content</span></button><button className={view==="sahaba"?"active":""} onClick={()=>setView("sahaba")}><NavIcon name="users"/><span>Sahaba Content</span></button><button className={view==="quran"'
if (-not $text.Contains($oldMenu)) { throw 'Prophets menu marker not found' }
$text = $text.Replace($oldMenu,$newMenu)
$marker = '{view==="quran"&&<section style={{height:"calc(100vh - 125px)"'
$insert = '{view==="sahaba"&&<section style={{height:"calc(100vh - 125px)",overflow:"hidden",borderRadius:18,background:"#fff",boxShadow:"0 8px 28px rgba(20,60,43,.08)"}}><iframe title="Sahaba Content Manager" src="/sahaba" style={{width:"100%",height:"100%",border:0}}/></section>}' + $marker
if (-not $text.Contains($marker)) { throw 'Quran page marker not found' }
$text = $text.Replace($marker,$insert)
[IO.File]::WriteAllText($path,$text,[Text.UTF8Encoding]::new($false))
