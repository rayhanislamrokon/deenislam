$indexPath=Join-Path $PSScriptRoot '..\server\src\index.js';$index=[IO.File]::ReadAllText($indexPath)
$index=$index.Replace("const{createHadithRouter}=require('./hadith-admin');","const{createHadithRouter}=require('./hadith-admin');`r`nconst{createDuaRouter}=require('./dua-admin');")
$index=$index.Replace('hadithContent,appSettings','hadithContent,duaContent,appSettings')
$index=$index.Replace("app.use(createHadithRouter(()=>hadithContent,process.env.ADMIN_API_KEY,jwtSecret));","app.use(createHadithRouter(()=>hadithContent,process.env.ADMIN_API_KEY,jwtSecret));`r`napp.use(createDuaRouter(()=>duaContent,process.env.ADMIN_API_KEY,jwtSecret));")
$index=$index.Replace("hadithContent=db.collection('hadith_content');","hadithContent=db.collection('hadith_content');duaContent=db.collection('dua_content');")
$index=$index.Replace("await hadithContent.createIndex({published:1,updatedAt:-1});","await hadithContent.createIndex({published:1,updatedAt:-1});await duaContent.createIndex({key:1},{unique:true});await duaContent.createIndex({published:1,order:1});")
[IO.File]::WriteAllText($indexPath,$index,[Text.UTF8Encoding]::new($false))

$adminPath=Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx';$admin=[IO.File]::ReadAllText($adminPath)
$admin=$admin.Replace('"quran"|"hadith"|"security"','"quran"|"hadith"|"duas"|"security"')
$admin=$admin.Replace('<button className={view==="hadith"?"active":""} onClick={()=>setView("hadith")}><span>Hadith Content</span></button>','<button className={view==="hadith"?"active":""} onClick={()=>setView("hadith")}><span>Hadith Content</span></button><button className={view==="duas"?"active":""} onClick={()=>setView("duas")}><span>Duas Content</span></button>')
$hadithFrame='{view==="hadith"&&<section style={{height:"calc(100vh - 125px)",overflow:"hidden",borderRadius:18,background:"#fff",boxShadow:"0 8px 28px rgba(20,60,43,.08)"}}><iframe title="Hadith Content Manager" src="/hadith" style={{width:"100%",height:"100%",border:0}}/></section>}'
$duaFrame=$hadithFrame+'{view==="duas"&&<section style={{height:"calc(100vh - 125px)",overflow:"hidden",borderRadius:18,background:"#fff",boxShadow:"0 8px 28px rgba(20,60,43,.08)"}}><iframe title="Duas Content Manager" src="/duas" style={{width:"100%",height:"100%",border:0}}/></section>}'
if(-not $admin.Contains($hadithFrame)){throw 'Hadith iframe not found'};$admin=$admin.Replace($hadithFrame,$duaFrame)
[IO.File]::WriteAllText($adminPath,$admin,[Text.UTF8Encoding]::new($false))

$appPath=Join-Path $PSScriptRoot '..\App.tsx';$app=[IO.File]::ReadAllText($appPath)
$app=$app.Replace('<DuasCollectionScreen onBack={() => setScreen(''home'')} />','<DuasCollectionScreen language={selectedLanguage} onBack={() => setScreen(''home'')} />')
[IO.File]::WriteAllText($appPath,$app,[Text.UTF8Encoding]::new($false))
