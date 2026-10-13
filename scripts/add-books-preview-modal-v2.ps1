$path=Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx';$content=[IO.File]::ReadAllText($path)
$content=$content.Replace('[previewPage,setPreviewPage]=useState(0),','[previewPage,setPreviewPage]=useState(0),[bookPreviewOpen,setBookPreviewOpen]=useState(false),')
$oldActions='<div className="bookFormActions"><button type="button" className="clearFormButton" disabled={loading||pdfLoading||coverLoading} onClick={clearBookForm}>Clear form</button>'
$newActions='<div className="bookFormActions"><button type="button" onClick={()=>setBookPreviewOpen(true)}>Preview</button><button type="button" className="clearFormButton" disabled={loading||pdfLoading||coverLoading} onClick={clearBookForm}>Clear form</button>'
if(-not $content.Contains($oldActions)){throw 'Book form actions not found'};$content=$content.Replace($oldActions,$newActions)
$oldOpen='<section className="usersPanel bookListPanel"><div className="liveBookPreview">'
$newOpen='<section className="usersPanel bookListPanel">{bookPreviewOpen&&<div role="dialog" aria-modal="true" aria-label="Book preview" style={{position:"fixed",inset:0,zIndex:1000,display:"grid",placeItems:"center",padding:20,background:"rgba(8,35,25,.72)",backdropFilter:"blur(5px)"}} onMouseDown={event=>{if(event.target===event.currentTarget)setBookPreviewOpen(false)}}><div style={{position:"relative",width:"min(720px,96vw)",maxHeight:"94vh",overflow:"auto",borderRadius:22,background:"#eef8f1",boxShadow:"0 24px 70px rgba(0,0,0,.3)"}}><button type="button" onClick={()=>setBookPreviewOpen(false)} style={{position:"sticky",top:12,zIndex:5,float:"right",margin:12,padding:"10px 15px",border:0,borderRadius:10,background:"#087a4d",color:"#fff",fontWeight:800,cursor:"pointer"}}>× Close preview</button><div className="liveBookPreview">'
if(-not $content.Contains($oldOpen)){throw 'Live preview opening not found'};$content=$content.Replace($oldOpen,$newOpen)
$marker='</div></div></div><div className="usersHead"><div><h2>Library Books</h2>'
$replacement='</div></div></div></div></div>}<div className="usersHead"><div><h2>Library Books</h2>'
if(-not $content.Contains($marker)){throw 'Library heading boundary not found'};$content=$content.Replace($marker,$replacement)
[IO.File]::WriteAllText($path,$content,[Text.UTF8Encoding]::new($false))
