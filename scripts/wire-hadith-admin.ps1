$indexPath = Join-Path $PSScriptRoot '..\server\src\index.js'
$index = Get-Content -LiteralPath $indexPath -Raw -Encoding utf8
$index = $index.Replace("const{createQuranAdminRouter}=require('./quran-admin');", "const{createQuranAdminRouter}=require('./quran-admin');`nconst{createHadithRouter}=require('./hadith-admin');")
$index = $index.Replace('let users,surahs,books,lifestyleContent,prophetsContent,appSettings', 'let users,surahs,books,lifestyleContent,prophetsContent,hadithContent,appSettings')
$index = $index.Replace('app.use(createQuranAdminRouter(()=>surahs,process.env.ADMIN_API_KEY,jwtSecret));', 'app.use(createQuranAdminRouter(()=>surahs,process.env.ADMIN_API_KEY,jwtSecret));'+"`n"+'app.use(createHadithRouter(()=>hadithContent,process.env.ADMIN_API_KEY,jwtSecret));')
$index = $index.Replace("prophetsContent=db.collection('prophets_content');appSettings", "prophetsContent=db.collection('prophets_content');hadithContent=db.collection('hadith_content');appSettings")
$index = $index.Replace("await prophetsContent.createIndex({published:1,order:1});", "await prophetsContent.createIndex({published:1,order:1});await hadithContent.createIndex({collectionId:1,book:1,hadithNumber:1},{unique:true});await hadithContent.createIndex({published:1,updatedAt:-1});")
Set-Content -LiteralPath $indexPath -Value $index -NoNewline -Encoding utf8

$pagePath = Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx'
$page = Get-Content -LiteralPath $pagePath -Raw -Encoding utf8
$page = $page.Replace('<button className={view==="quran"?"active":""} onClick={()=>setView("quran")}><span>Quran Content</span></button>', '<button className={view==="quran"?"active":""} onClick={()=>setView("quran")}><span>Quran Content</span></button><button className={view==="hadith"?"active":""} onClick={()=>setView("hadith")}><span>Hadith Content</span></button>')
$quranFrame = '{view==="quran"&&<section style={{height:"calc(100vh - 125px)",overflow:"hidden",borderRadius:18,background:"#fff",boxShadow:"0 8px 28px rgba(20,60,43,.08)"}}><iframe title="Quran Content Manager" src="/quran" style={{width:"100%",height:"100%",border:0}}/></section>}'
$hadithFrame = $quranFrame + '{view==="hadith"&&<section style={{height:"calc(100vh - 125px)",overflow:"hidden",borderRadius:18,background:"#fff",boxShadow:"0 8px 28px rgba(20,60,43,.08)"}}><iframe title="Hadith Content Manager" src="/hadith" style={{width:"100%",height:"100%",border:0}}/></section>}'
$page = $page.Replace($quranFrame,$hadithFrame)
Set-Content -LiteralPath $pagePath -Value $page -NoNewline -Encoding utf8
