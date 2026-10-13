$path=Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx';$content=[IO.File]::ReadAllText($path)
$typeOld='"ads"|"books"|"lifestyle"';if(-not $content.Contains($typeOld)){throw 'View type marker not found'};$content=$content.Replace($typeOld,'"ads"|"books"|"book-library"|"lifestyle"')
$buttonEnd='<span>Books Manager</span></button>';$buttonAdd=$buttonEnd+'<button className={view==="book-library"?"active":""} onClick={()=>setView("book-library")}><span>Book Library</span></button>'
if(-not $content.Contains($buttonEnd)){throw 'Books button ending not found'};$content=$content.Replace($buttonEnd,$buttonAdd)
$frameMarker='{view==="lifestyle"&&<section';$frame='{view==="book-library"&&<section style={{height:"calc(100vh - 125px)",overflow:"hidden",borderRadius:18,background:"#fff",boxShadow:"0 8px 28px rgba(20,60,43,.08)"}}><iframe title="Book Library" src="/book-library" style={{width:"100%",height:"100%",border:0}}/></section>}'
if(-not $content.Contains($frameMarker)){throw 'Iframe insertion marker not found'};$content=$content.Replace($frameMarker,$frame+$frameMarker)
$effectMarker='useEffect(()=>{setPreviewPage(0)},[bookForm.pages?.length]);';$effect=$effectMarker+'useEffect(()=>{if(!token)return;const slug=new URLSearchParams(window.location.search).get("editBook");if(!slug)return;setView("books");void editBook({slug});window.history.replaceState({},"",window.location.pathname)},[token]);'
if(-not $content.Contains($effectMarker)){throw 'Effect marker not found'};$content=$content.Replace($effectMarker,$effect)
[IO.File]::WriteAllText($path,$content,[Text.UTF8Encoding]::new($false))
