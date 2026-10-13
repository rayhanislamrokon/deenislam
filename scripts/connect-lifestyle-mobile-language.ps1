$screenPath = Join-Path $PSScriptRoot '..\src\screens\AqidahLifeScreen.tsx'
$screen = [IO.File]::ReadAllText((Resolve-Path $screenPath), [Text.Encoding]::UTF8)
$screen = $screen.Replace('export function AqidahLifeScreen({ onBack }: { onBack: () => void }) {','export function AqidahLifeScreen({ onBack, language }: { onBack: () => void; language: string }) {')
$screen = $screen.Replace("const response=await fetch(lifestyleApi+'?fresh='+Date.now()", "const response=await fetch(lifestyleApi+'?language='+encodeURIComponent(language)+'&fresh='+Date.now()")
$screen = $screen.Replace('useEffect(()=>{void loadLifestyle()},[]);','useEffect(()=>{setSelected(null);setActiveChapterNumber(null);void loadLifestyle()},[language]);')
$screen = $screen.Replace('const quranFoundation = activeChapter ? QURAN_FOUNDATIONS[activeChapter.number] : null;','const quranFoundation = activeChapter ? (activeChapter.managed ? activeChapter.quran : QURAN_FOUNDATIONS[activeChapter.number]) : null;')
[IO.File]::WriteAllText((Resolve-Path $screenPath), $screen, [Text.UTF8Encoding]::new($false))
$appPath = Join-Path $PSScriptRoot '..\App.tsx'
$app = [IO.File]::ReadAllText((Resolve-Path $appPath), [Text.Encoding]::UTF8)
$app = $app.Replace('<AqidahLifeScreen onBack={() => setScreen(''home'')} />','<AqidahLifeScreen language={selectedLanguage} onBack={() => setScreen(''home'')} />')
[IO.File]::WriteAllText((Resolve-Path $appPath), $app, [Text.UTF8Encoding]::new($false))
