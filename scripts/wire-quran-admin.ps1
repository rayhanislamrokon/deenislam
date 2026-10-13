$server = Join-Path $PSScriptRoot '..\server\src\index.js'
$source = Get-Content -LiteralPath $server -Raw
$source = $source.Replace("const{createProphetsRouter}=require('./prophets-admin');", "const{createProphetsRouter}=require('./prophets-admin');`nconst{createQuranAdminRouter}=require('./quran-admin');")
$source = $source.Replace("app.use(createProphetsRouter(()=>prophetsContent,process.env.ADMIN_API_KEY,jwtSecret));", "app.use(createProphetsRouter(()=>prophetsContent,process.env.ADMIN_API_KEY,jwtSecret));`napp.use(createQuranAdminRouter(()=>surahs,process.env.ADMIN_API_KEY,jwtSecret));")
$oldLocalize = "async function localize(items,lv,eid){const requested=String(lv||'en'),key=requested.toLowerCase(),lang=languageOf(requested),edition=await editionFor(lang,eid),remote=await remoteQuran(edition);if(!remote&&lang!=='en')await ensureAyahTranslations(items,key,requested);return items.map(s=>{const rs=remote?.find(x=>x.number===s.number),localized=s.localizedNames?.[requested]||s.localizedNames?.[key]||s.localizedNames?.[lang];const pronunciation=localized?.pronunciation||s.englishName,cleanPronunciation=pronunciation.toLowerCase().startsWith(String(s.englishName||'').toLowerCase())&&pronunciation.length>String(s.englishName||'').length+3?s.englishName:pronunciation;return{...s,englishName:cleanPronunciation,englishNameTranslation:localized?.meaning||s.englishNameTranslation,ayahs:s.ayahs.map((a,i)=>{const translation=rs?.ayahs?.[i]?.text||a.translations?.[key]||a.translations?.[lang]||a.translations?.en||a.translation||'';return{...a,translation,translations:{...(a.translations||{}),[key]:translation}}})}})}"
$newLocalize = "async function localize(items,lv,eid){const requested=String(lv||'en'),key=requested.toLowerCase(),lang=languageOf(requested),hasSaved=items.some(s=>(s.ayahs||[]).some(a=>a.translations?.[key]||a.translations?.[lang])),edition=hasSaved?'':await editionFor(lang,eid),remote=await remoteQuran(edition);return items.map(s=>{const rs=remote?.find(x=>x.number===s.number),localized=s.localizedNames?.[requested]||s.localizedNames?.[key]||s.localizedNames?.[lang];const pronunciation=localized?.pronunciation||s.englishName,cleanPronunciation=pronunciation.toLowerCase().startsWith(String(s.englishName||'').toLowerCase())&&pronunciation.length>String(s.englishName||'').length+3?s.englishName:pronunciation;return{...s,englishName:cleanPronunciation,englishNameTranslation:localized?.meaning||s.englishNameTranslation,ayahs:s.ayahs.map((a,i)=>{const translation=a.translations?.[key]||a.translations?.[lang]||rs?.ayahs?.[i]?.text||a.translations?.en||a.translation||'';return{...a,translation,translations:{...(a.translations||{}),[key]:translation}}})}})}"
if (-not $source.Contains($oldLocalize)) { throw 'Quran localize marker not found' }
$source = $source.Replace($oldLocalize,$newLocalize)
Set-Content -LiteralPath $server -Value $source -NoNewline

$admin = Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx'
$page = Get-Content -LiteralPath $admin -Raw
$page = $page.Replace('"lifestyle"|"prophets"|"security"','"lifestyle"|"prophets"|"quran"|"security"')
$prophetButton = '<button className={view==="prophets"?"active":""} onClick={()=>setView("prophets")}><span>Prophets Content</span></button>'
$quranButton = $prophetButton + '<button className={view==="quran"?"active":""} onClick={()=>setView("quran")}><span>Quran Content</span></button>'
if (-not $page.Contains($prophetButton)) { throw 'Prophets menu marker not found' }
$page = $page.Replace($prophetButton,$quranButton)
$prophetFrame = '{view==="prophets"&&<section style={{height:"calc(100vh - 125px)",overflow:"hidden",borderRadius:18,background:"#fff",boxShadow:"0 8px 28px rgba(20,60,43,.08)"}}><iframe title="Prophets Content Manager" src="/prophets" style={{width:"100%",height:"100%",border:0}}/></section>}'
$quranFrame = $prophetFrame + '{view==="quran"&&<section style={{height:"calc(100vh - 125px)",overflow:"hidden",borderRadius:18,background:"#fff",boxShadow:"0 8px 28px rgba(20,60,43,.08)"}}><iframe title="Quran Content Manager" src="/quran" style={{width:"100%",height:"100%",border:0}}/></section>}'
if (-not $page.Contains($prophetFrame)) { throw 'Prophets frame marker not found' }
$page = $page.Replace($prophetFrame,$quranFrame)
Set-Content -LiteralPath $admin -Value $page -NoNewline
