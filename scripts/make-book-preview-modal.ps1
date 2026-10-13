$path=Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx';$content=[IO.File]::ReadAllText($path)
$content=$content.Replace('[previewPage,setPreviewPage(0),', '[previewPage,setPreviewPage(0),')
$stateNeedle='[previewPage,setPreviewPage]=useState(0),'
$stateReplacement='[previewPage,setPreviewPage]=useState(0),[bookPreviewOpen,setBookPreviewOpen]=useState(false),'
if(-not $content.Contains($stateNeedle)){throw 'Preview page state not found'};$content=$content.Replace($stateNeedle,$stateReplacement)
$actionsNeedle='<div className="bookFormActions"><button type="button" className="clearFormButton"'
$actionsReplacement='<div className="bookFormActions"><button type="button" onClick={()=>{setPreviewPage(0);setBookPreviewOpen(true)}}>Preview</button><button type="button" className="clearFormButton"'
if(-not $content.Contains($actionsNeedle)){throw 'Book form actions not found'};$content=$content.Replace($actionsNeedle,$actionsReplacement)
$previewNeedle='<div className="liveBookPreview"><div className="previewTop">'
$previewReplacement='{bookPreviewOpen&&<div className="bookPreviewOverlay" role="dialog" aria-modal="true" aria-label="Book reader preview"><button type="button" className="previewOverlayClose" onClick={()=>setBookPreviewOpen(false)}>× Close</button><div className="liveBookPreview"><div className="previewTop">'
if(-not $content.Contains($previewNeedle)){throw 'Live book preview start not found'};$content=$content.Replace($previewNeedle,$previewReplacement)
$endNeedle='</div><div className="usersHead"><div><h2>Library Books</h2>'
$endReplacement='</div></div>}<div className="usersHead"><div><h2>Library Books</h2>'
if(-not $content.Contains($endNeedle)){throw 'Live book preview end not found'};$content=$content.Replace($endNeedle,$endReplacement)
$styleNeedle='.liveBookPreview{'
$overlayStyles='.bookPreviewOverlay{position:fixed;inset:0;z-index:1000;overflow:auto;padding:65px 20px 35px;background:rgba(8,38,27,.78);backdrop-filter:blur(5px)}.bookPreviewOverlay .liveBookPreview{width:min(720px,100%);margin:auto;border-radius:22px;box-shadow:0 25px 80px rgba(0,0,0,.35)}.previewOverlayClose{position:fixed;z-index:1001;top:18px;right:25px;padding:11px 16px;border:1px solid rgba(255,255,255,.35);border-radius:11px;background:#087a4d;color:#fff;font-weight:900;cursor:pointer}.bookPreviewOverlay .phonePreview{margin-left:auto;margin-right:auto}'
if(-not $content.Contains($styleNeedle)){throw 'Live preview CSS not found'};$content=$content.Replace($styleNeedle,$overlayStyles+$styleNeedle)
[IO.File]::WriteAllText($path,$content,[Text.UTF8Encoding]::new($false))
