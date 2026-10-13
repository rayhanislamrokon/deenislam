$target = Join-Path $PSScriptRoot '..\admin-panel\app\prophets\page.tsx'
$source = Get-Content -LiteralPath $target -Raw

$oldState = '[preview,setPreview]=useState<any|null>(null);'
$newState = '[preview,setPreview]=useState<any|null>(null),[openPreviewPart,setOpenPreviewPart]=useState<number|null>(null);'
if (-not $source.Contains($oldState)) { throw 'Preview state marker not found' }
$source = $source.Replace($oldState, $newState)

$source = $source.Replace('onClick={()=>setPreview(item)}>View</button>', 'onClick={()=>{setPreview(item);setOpenPreviewPart(null)}}>View</button>')

$oldPreview = '{(preview.parts||[]).map((item:any,index:number)=><article key={index}><b>PART {index+1}</b><h3>{item.title}</h3><p>{item.story}</p><small>{item.reference}</small></article>)}'
$newPreview = @'
<div className="previewParts">{(preview.parts||[]).map((item:any,index:number)=>{const open=openPreviewPart===index;return <article className={open?"previewPart open":"previewPart"} key={index}><button type="button" className="previewPartHead" onClick={()=>setOpenPreviewPart(open?null:index)} aria-expanded={open}><span><b>PART {String(index+1).padStart(2,"0")}</b><strong>{item.title}</strong></span><i>{open?"−":"+"}</i></button>{open&&<div className="previewPartBody"><p>{item.story}</p>{item.reference&&<small>QURAN / VERIFIED SOURCE<br/><span>{item.reference}</span></small>}</div>}</article>})}</div>
'@
$newPreview = $newPreview.Trim()
if (-not $source.Contains($oldPreview)) { throw 'Preview parts marker not found' }
$source = $source.Replace($oldPreview, $newPreview)

$oldCss = '.modal article{margin-top:15px;padding:15px;border-radius:13px;background:#f4f9f5}.modal article p{white-space:pre-wrap;line-height:1.7}.modal article small{color:#a27f24}'
$newCss = '.previewParts{display:grid;gap:10px;margin-top:18px}.modal .previewPart{margin:0;padding:0;overflow:hidden;border:1px solid #d8e7dc;border-radius:14px;background:#f7fbf8}.previewPartHead{width:100%;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px 16px;border-radius:0;background:transparent;color:#173d2e;text-align:left}.previewPartHead span{display:grid;gap:4px}.previewPartHead b{color:#a27f24;font-size:9px;letter-spacing:1px}.previewPartHead strong{font-size:15px}.previewPartHead i{width:29px;height:29px;display:grid;place-items:center;flex:0 0 auto;border-radius:50%;background:#e1f2e6;color:#087a4d;font-size:18px;font-style:normal}.previewPart.open{border-color:#87b99a;box-shadow:0 7px 20px #173d2e12}.previewPart.open .previewPartHead{background:#edf7f0}.previewPartBody{padding:4px 16px 17px;border-top:1px solid #dfebe2}.previewPartBody p{white-space:pre-wrap;line-height:1.75;color:#314d40}.previewPartBody small{display:block;padding:12px;border-left:3px solid #d7b84f;border-radius:8px;background:#fff7df;color:#9b7720;font-size:8px;font-weight:900;letter-spacing:.8px}.previewPartBody small span{display:inline-block;margin-top:5px;color:#665b3a;font-size:11px;font-weight:400;letter-spacing:0}'
if (-not $source.Contains($oldCss)) { throw 'Preview CSS marker not found' }
$source = $source.Replace($oldCss, $newCss)

Set-Content -LiteralPath $target -Value $source -NoNewline
