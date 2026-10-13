$path = 'J:\REACT NATIVE APPS\DeenIslam\admin-panel\app\islamic-lifestyle\page.tsx'
$s = [IO.File]::ReadAllText($path)
$s = $s.Replace('<small>{form.id?"EDIT CONTENT":"NEW CONTENT"}</small>', '<small>{form.id?"EDIT LIFESTYLE CONTENT":form.kind==="category"?"LIFESTYLE CARD FORM":"NEW CHAPTER FORM"}</small>')
$s = $s.Replace('<h2>{form.kind==="category"?"Category card":"Chapter"}</h2>', '<h2>{form.kind==="category"?"Create Lifestyle Card":"Create Chapter"}</h2>')
$marker = '<button type="button" className="secondary" onClick={()=>setForm(empty)}>Clear form</button>'
$preview = '<div className="formActions"><button type="button" className="secondary" onClick={()=>setForm(empty)}>Clear form</button></div>{form.kind==="category"&&<div className="livePreview"><div className="previewLabel"><span>LIVE APP CARD PREVIEW</span><small>Updates while you type</small></div><div className="mobileCard"><div className="mobileIcon">{form.icon||"🌿"}</div><b>{form.title||"Lifestyle category title"}</b><p>{form.subtitle||"A short description of this lifestyle category"}</p><span>Open guide ›</span></div></div>}'
if (-not $s.Contains($marker)) { throw 'Form action marker missing.' }
$s = $s.Replace($marker, $preview)
$cssMarker = '.secondary{margin-top:15px;background:#edf4ef;color:#275342}'
$css = '.formActions{margin-top:15px}.secondary{background:#edf4ef;color:#275342}.livePreview{margin-top:20px;padding:16px;border-radius:17px;background:#f2f8f4;border:1px dashed #b8d3c0}.previewLabel{margin-bottom:12px;display:flex;justify-content:space-between}.previewLabel span{font-size:9px;font-weight:900;letter-spacing:1px;color:#087a4d}.previewLabel small{color:#7a8b82}.mobileCard{width:230px;min-height:190px;padding:16px;border-radius:20px;background:#fff;border:1px solid #dbe7de;box-shadow:0 5px 12px #173d2e18;display:flex;flex-direction:column}.mobileIcon{width:48px;height:48px;border-radius:15px;background:#e8f5eb;display:grid;place-items:center;font-size:25px}.mobileCard b{margin-top:13px;font-size:15px;line-height:20px}.mobileCard p{margin:7px 0;font-size:11px;line-height:16px;color:#718078}.mobileCard>span{margin-top:auto;font-size:10px;font-weight:900;color:#087a4d}'
if (-not $s.Contains($cssMarker)) { throw 'CSS marker missing.' }
$s = $s.Replace($cssMarker, $css)
[IO.File]::WriteAllText($path, $s, (New-Object Text.UTF8Encoding($false)))
