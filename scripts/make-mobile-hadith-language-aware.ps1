$appPath=Join-Path $PSScriptRoot '..\App.tsx';$app=Get-Content $appPath -Raw -Encoding utf8
$app=$app.Replace('<HadithScreen onBack={() => setScreen(''home'')} />','<HadithScreen language={selectedLanguage} onBack={() => setScreen(''home'')} />')
Set-Content $appPath $app -NoNewline -Encoding utf8
$screenPath=Join-Path $PSScriptRoot '..\src\screens\HadithScreen.tsx';$screen=Get-Content $screenPath -Raw -Encoding utf8
$screen=$screen.Replace('export function HadithScreen({onBack}:{onBack:()=>void})','export function HadithScreen({onBack,language}:{onBack:()=>void;language:string})')
$screen=$screen.Replace("fetch(DEEN_API+'/api/hadith/admin-content?language=en')", "fetch(DEEN_API+'/api/hadith/admin-content?language='+encodeURIComponent(language))")
$screen=$screen.Replace('.catch(()=>{})},[]);', '.catch(()=>{})},[language]);')
$screen=$screen.Replace('if(searchOpen)return <HadithSearchScreen collections={cols} hadiths={hs}', 'if(searchOpen)return <HadithSearchScreen collections={cols} hadiths={[...managedHadiths,...hs.filter(x=>!managedHadiths.some((m:any)=>m.cid===x.cid&&String(m.no)===String(x.no)))]}')
Set-Content $screenPath $screen -NoNewline -Encoding utf8
