$path=Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx';$content=[IO.File]::ReadAllText($path)
$content=$content.Replace('"ads"|"books"|"lifestyle"','"ads"|"books"|"book-library"|"lifestyle"')
$bookButton='<button className={view==="books"?"active":""} onClick={()=>setView("books")}>▤ <span>Books Manager</span></button>'
$buttons=$bookButton+'<button className={view==="book-library"?"active":""} onClick={()=>setView("book-library")}>▦ <span>Book Library</span></button>'
if(-not $content.Contains($bookButton)){throw 'Books Manager sidebar button not found'};$content=$content.Replace($bookButton,$buttons)
$lifestyleFrame='{view==="lifestyle"&&<section'
$libraryFrame='{view==="book-library"&&<section style={{height:"calc(100vh - 125px)",overflow:"hidden",borderRadius:18,background:"#fff",boxShadow:"0 8px 28px rgba(20,60,43,.08)"}}><iframe title="Book Library" src="/book-library" style={{width:"100%",height:"100%",border:0}}/></section>}'
if(-not $content.Contains($lifestyleFrame)){throw 'Lifestyle frame marker not found'};$content=$content.Replace($lifestyleFrame,$libraryFrame+$lifestyleFrame)
$effectMarker='useEffect(()=>{setPreviewPage(0)},[bookForm.pages?.length]);'
$effect=$effectMarker+'useEffect(()=>{if(!token)return;const slug=new URLSearchParams(window.location.search).get("editBook");if(!slug)return;setView("books");void editBook({slug});window.history.replaceState({},"",window.location.pathname)},[token]);'
if(-not $content.Contains($effectMarker)){throw 'Book preview effect marker not found'};$content=$content.Replace($effectMarker,$effect)
[IO.File]::WriteAllText($path,$content,[Text.UTF8Encoding]::new($false))
