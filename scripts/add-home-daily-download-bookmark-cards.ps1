$ErrorActionPreference = 'Stop'
function Replace-Text([string]$Path,[string]$Old,[string]$New){$text=[IO.File]::ReadAllText($Path);if(-not $text.Contains($Old)){throw "Expected text not found in $Path"};[IO.File]::WriteAllText($Path,$text.Replace($Old,$New))}
$projectRoot=Split-Path $PSScriptRoot -Parent
$homeScreenPath=Join-Path $projectRoot 'src\screens\HomeScreen.tsx'
$appPath=Join-Path $projectRoot 'App.tsx'

$text=[IO.File]::ReadAllText($homeScreenPath)
$anchor="if(name==='mosque-icon')return"
$icons=@'
if(name==='daily-prayer-icon')return <Svg width={30} height={30} viewBox="0 0 32 32"><Path d="M7 7.5h18v19H7zM11 4.8v5.4m10-5.4v5.4M7 12h18" fill="#F8FCF8" stroke="#087A45" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><Path d="M18.8 15.3a4.8 4.8 0 1 0 3.4 7.8 4.1 4.1 0 1 1-3.4-7.8Z" fill="#E6B83E" stroke="#B98918" strokeWidth="1"/></Svg>;if(name==='download-icon')return <Svg width={30} height={30} viewBox="0 0 32 32"><Path d="M16 5.5v14m-5-5 5 5 5-5M7 21.5v5h18v-5" fill="none" stroke="#087A45" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><Circle cx="16" cy="6" r="2" fill="#E6B83E"/></Svg>;if(name==='bookmark-icon')return <Svg width={30} height={30} viewBox="0 0 32 32"><Path d="M9 5.5h14v21L16 22l-7 4.5v-21Z" fill="#EAF7EE" stroke="#087A45" strokeWidth="1.8" strokeLinejoin="round"/><Path d="m16 10 1.2 2.4 2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4L16 10Z" fill="#E6B83E" stroke="#B98918" strokeWidth=".8"/></Svg>;
'@
if(-not $text.Contains($anchor)){throw 'Custom icon component anchor not found.'}
$text=$text.Replace($anchor,$icons+$anchor)
$duasPattern="\{icon:'[^']+',label:'Duas',go:p\.onOpenDuas\}"
$duasReplacement="{icon:'\u{1F932}',label:'Duas',go:p.onOpenDuas},{icon:'daily-prayer-icon',label:uiText(p.language,'Daily Prayer'),go:p.onOpenDailyPrayer},{icon:'download-icon',label:uiText(p.language,'Downloads'),go:p.onOpenDownloads},{icon:'bookmark-icon',label:uiText(p.language,'Bookmarks'),go:p.onOpenBookmarks}"
$next=[regex]::Replace($text,$duasPattern,$duasReplacement,1)
if($next -eq $text){throw 'Duas card not found.'}
[IO.File]::WriteAllText($homeScreenPath,$next)

Replace-Text $homeScreenPath 'onOpenSahaba:()=>void;onOpenIslamicHistory:()=>void;onOpenDuas:()=>void;' 'onOpenSahaba:()=>void;onOpenIslamicHistory:()=>void;onOpenDuas:()=>void;onOpenDailyPrayer:()=>void;onOpenDownloads:()=>void;onOpenBookmarks:()=>void;'
Replace-Text $appPath "onOpenDuas={() => setScreen('duas')} />" "onOpenDuas={() => setScreen('duas')} onOpenDailyPrayer={() => setScreen('prayer')} onOpenDownloads={() => { setBooksInitialCategory('All'); setBooksReturnScreen('home'); setScreen('books'); }} onOpenBookmarks={() => { setBooksInitialCategory('All'); setBooksReturnScreen('home'); setScreen('books'); }} />"
