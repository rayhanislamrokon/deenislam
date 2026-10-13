$backend = Join-Path $PSScriptRoot '..\server\src\quran-admin.js'
$server = Get-Content -LiteralPath $backend -Raw
$oldRoute = "router.get('/api/admin/quran/surahs',admin,async(_req,res)=>{try{const rows=await getSurahs().find({},{projection:{_id:0,number:1,name:1,englishName:1,englishNameTranslation:1,numberOfAyahs:1,revelationType:1,localizedNames:1}}).sort({number:1}).toArray();res.json({data:rows})}catch(error){console.error(error);res.status(500).json({message:'Unable to load Quran content.'})}});"
$newRoute = "router.get('/api/admin/quran/surahs',admin,async(_req,res)=>{try{const rows=await getSurahs().find({},{projection:{_id:0,number:1,name:1,englishName:1,englishNameTranslation:1,numberOfAyahs:1,revelationType:1,localizedNames:1,'ayahs.translations':1}}).sort({number:1}).toArray();const data=rows.map(row=>{const progress={};for(const ayah of row.ayahs||[])for(const [code,text] of Object.entries(ayah.translations||{}))if(code!=='en'&&String(text||'').trim())progress[code]=(progress[code]||0)+1;const{ayahs,...summary}=row;return{...summary,translationProgress:progress}});res.json({data})}catch(error){console.error(error);res.status(500).json({message:'Unable to load Quran content.'})}});"
if (-not $server.Contains($oldRoute)) { throw 'Quran summary route marker not found' }
$server = $server.Replace($oldRoute,$newRoute)
Set-Content -LiteralPath $backend -Value $server -NoNewline -Encoding utf8

$target = Join-Path $PSScriptRoot '..\admin-panel\app\quran\page.tsx'
$source = Get-Content -LiteralPath $target -Raw
$oldOptions = '{languages.filter(x=>x.code!=="en").map(x=><option value={x.code} key={x.code}>{x.label} ({x.code.toUpperCase()})</option>)}'
$newOptions = '{languages.filter(x=>x.code!=="en").map(x=>{const count=surahs.find(s=>s.number===surahNo)?.translationProgress?.[x.code]||0,total=surah?.ayahs?.length||surahs.find(s=>s.number===surahNo)?.numberOfAyahs||0;return <option value={x.code} key={x.code}>{count?`✓ ${x.label} (${count}/${total} saved)`:`${x.label} (${x.code.toUpperCase()})`}</option>})}'
if (-not $source.Contains($oldOptions)) { throw 'Language options marker not found' }
$source = $source.Replace($oldOptions,$newOptions)
$oldProgressClose = '<small>translations completed</small></div></div>'
$newProgressClose = '<small>translations completed</small></div><button type="button" className="startButton" disabled={language==="en"} onClick={()=>document.getElementById("ayah-editor")?.scrollIntoView({behavior:"smooth",block:"start"})}>+ Add selected language</button></div>'
if (-not $source.Contains($oldProgressClose)) { throw 'Progress controls marker not found' }
$source = $source.Replace($oldProgressClose,$newProgressClose)
$source = $source.Replace('<div className="ayahHead">','<div className="ayahHead" id="ayah-editor">')
$oldCard = '<div className="copy"><p dir="rtl">{ayah.text}</p><small>ENGLISH BASE</small><blockquote>{ayah.translations?.en||ayah.translation}</blockquote><label>{languages.find(x=>x.code===language)?.label||language.toUpperCase()} meaning<textarea dir={["ar","fa","ur","he","ps"].includes(language)?"rtl":"auto"} value={values[ayah.numberInSurah]||""} onChange={e=>setValues({...values,[ayah.numberInSurah]:e.target.value})} placeholder={`Enter Ayah ${ayah.numberInSurah} meaning…`}/></label></div>'
$newCard = '<div className="copy"><div className="sourcePane"><span className="paneLabel">ORIGINAL — LOCKED</span><p dir="rtl">{ayah.text}</p><small>ENGLISH BASE MEANING</small><blockquote>{ayah.translations?.en||ayah.translation}</blockquote></div><div className="translationPane"><span className="paneLabel">YOUR {languages.find(x=>x.code===language)?.label?.toUpperCase()||language.toUpperCase()} CONTENT</span><label>Ayah {ayah.numberInSurah} meaning<textarea dir={["ar","fa","ur","he","ps"].includes(language)?"rtl":"auto"} value={values[ayah.numberInSurah]||""} onChange={e=>setValues({...values,[ayah.numberInSurah]:e.target.value})} placeholder={`Type or paste Ayah ${ayah.numberInSurah} meaning here…`}/></label><small className={values[ayah.numberInSurah]?.trim()?"savedHint ready":"savedHint"}>{values[ayah.numberInSurah]?.trim()?"✓ Translation ready":"Not added yet"}</small></div></div>'
if (-not $source.Contains($oldCard)) { throw 'Ayah card marker not found' }
$source = $source.Replace($oldCard,$newCard)
$styleClose = '</style></main>'
$extra = @'
<style jsx>{`
.controls{grid-template-columns:minmax(260px,1fr) minmax(260px,1fr) 190px auto;align-items:end}.startButton{height:46px;white-space:nowrap;background:linear-gradient(135deg,#0a8d59,#08714a);box-shadow:0 7px 16px rgba(8,122,77,.18)}
.copy{display:grid;grid-template-columns:minmax(0,1fr) 1px minmax(0,1fr);gap:22px;align-items:stretch}.copy:before{content:"";grid-column:2;grid-row:1;display:block;width:1px;background:linear-gradient(transparent,#c8dbce 12%,#c8dbce 88%,transparent)}.sourcePane{grid-column:1;grid-row:1}.translationPane{grid-column:3;grid-row:1;display:flex;flex-direction:column}.paneLabel{display:inline-flex;width:max-content;margin-bottom:11px;padding:5px 8px;border-radius:7px;background:#e8f4eb;color:#087a4d;font-size:8px;font-weight:900;letter-spacing:.9px}.translationPane .paneLabel{background:#fff5d9;color:#91701d}.sourcePane>p{margin:0 0 15px;padding:2px 4px 14px;border-bottom:1px solid #edf2ee;font-size:27px;line-height:1.9;color:#102f23}.translationPane label{display:flex;flex:1;flex-direction:column}.translationPane textarea{flex:1;min-height:175px;margin-top:9px;padding:15px;border:1px solid #bcd6c5;background:#fbfefc;font-size:14px;line-height:1.7}.savedHint{display:block;margin-top:8px;color:#9a6858;font-size:9px}.savedHint.ready{color:#087a4d;font-weight:800}
@media(max-width:1100px){.controls{grid-template-columns:1fr 1fr}.startButton{width:100%}}@media(max-width:760px){.controls{grid-template-columns:1fr}.copy{grid-template-columns:1fr;gap:15px}.copy:before{display:none}.sourcePane,.translationPane{grid-column:1}.sourcePane{grid-row:1}.translationPane{grid-row:2;padding-top:15px;border-top:1px solid #d8e6dc}}
`}</style>
'@
if (-not $source.Contains($styleClose)) { throw 'Quran style end marker not found' }
$source = $source.Replace($styleClose,$extra.TrimEnd()+$styleClose)
Set-Content -LiteralPath $target -Value $source -NoNewline -Encoding utf8
