$path = Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx'
$text = [IO.File]::ReadAllText($path)
$oldType = '[adLoading,setAdLoading]=useState(false),[view,setView]=useState<"overview"|"users"|"devices"|"ads"|"books"|"book-library"|"lifestyle"|"prophets"|"quran"|"hadith"|"duas"|"security">("overview")'
$newType = '[adLoading,setAdLoading]=useState(false),[view,setView]=useState<"overview"|"users"|"team"|"devices"|"ads"|"books"|"book-library"|"lifestyle"|"prophets"|"quran"|"hadith"|"duas"|"security">("overview")'
if ($text.Contains($oldType)) { $text = $text.Replace($oldType, $newType) }
$navPattern = '(<button className=\{view==="users"\?"active":""\} onClick=\{\(\)=>setView\("users"\)\}>.*?<span>Users</span></button>)(<button className=\{view==="devices")'
if (-not [regex]::IsMatch($text, $navPattern)) { throw 'Users navigation marker not found' }
$text = [regex]::Replace($text, $navPattern, '$1<button className={view==="team"?"active":""} onClick={()=>setView("team")}>&#9813; <span>Team &amp; Permissions</span></button>$2', 1)
$oldPage = '{view==="book-library"&&<section style={{height:"calc(100vh - 125px)"'
$newPage = '{view==="team"&&<section style={{height:"calc(100vh - 125px)",overflow:"hidden",borderRadius:18,background:"#fff",boxShadow:"0 8px 28px rgba(20,60,43,.08)"}}><iframe title="Team and Permissions" src="/team" style={{width:"100%",height:"100%",border:0}}/></section>}{view==="book-library"&&<section style={{height:"calc(100vh - 125px)"'
if (-not $text.Contains($oldPage)) { throw 'Page insertion marker not found' }
$text = $text.Replace($oldPage, $newPage)
[IO.File]::WriteAllText($path, $text, [Text.UTF8Encoding]::new($false))
