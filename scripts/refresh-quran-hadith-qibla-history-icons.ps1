$ErrorActionPreference = 'Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$screenPath=Join-Path $projectRoot 'src\screens\HomeScreen.tsx'
$text=[IO.File]::ReadAllText($screenPath)
$anchor="if(name==='sahaba-icon')return"
$icons=@'
if(name==='quran-icon')return <Svg width={30} height={30} viewBox="0 0 32 32"><Path d="M4.8 7.2c4.7-1.7 8.3-.7 11.2 2.2v17c-2.9-2.9-6.5-3.9-11.2-2.2v-17Zm22.4 0c-4.7-1.7-8.3-.7-11.2 2.2v17c2.9-2.9 6.5-3.9 11.2-2.2v-17Z" fill="#EAF7EE" stroke="#087A45" strokeWidth="1.6" strokeLinejoin="round"/><Path d="M16 9.4v17M9 11.5c1.8-.2 3.3.2 4.6 1.2m4.8 0c1.3-1 2.8-1.4 4.6-1.2" stroke="#B98918" strokeWidth="1.2" strokeLinecap="round"/><Path d="m16 13.2.8 1.5 1.6.3-1.2 1.2.3 1.7-1.5-.8-1.5.8.3-1.7-1.2-1.2 1.6-.3.8-1.5Z" fill="#E6B83E"/></Svg>;if(name==='hadith-icon')return <Svg width={30} height={30} viewBox="0 0 32 32"><Path d="M25.8 5.5C18.4 5.8 11 11 8.2 21.8c4.6-1.1 8.5-3.1 11.3-6.1-2.7 1.4-5.2 2.1-7.4 2.1 4.7-1.9 8.3-4.9 10.8-8.5-2.8 1.8-5.5 2.9-8 3.3 3.7-2 7.4-4.4 10.9-7.1Z" fill="#FFF7D8" stroke="#B98918" strokeWidth="1.5" strokeLinejoin="round"/><Path d="M7 26.5c3.8-7.4 8.9-12.7 15.5-16.1" stroke="#087A45" strokeWidth="1.8" strokeLinecap="round"/></Svg>;if(name==='qibla-icon')return <Svg width={30} height={30} viewBox="0 0 32 32"><Path d="m7 10 9-4 9 4-9 4-9-4Z" fill="#FFF7D8" stroke="#B98918" strokeWidth="1.5" strokeLinejoin="round"/><Path d="M7 10v15l9 2V14L7 10Z" fill="#173D30" stroke="#087A45" strokeWidth="1.5" strokeLinejoin="round"/><Path d="M25 10v15l-9 2V14l9-4Z" fill="#0B6B47" stroke="#087A45" strokeWidth="1.5" strokeLinejoin="round"/><Path d="M8 15.2 16 17l9-2.2" stroke="#E6B83E" strokeWidth="1.7"/><Path d="M19.3 17.5h3.1v4.1h-3.1z" fill="#E6B83E"/></Svg>;if(name==='history-icon')return <Svg width={30} height={30} viewBox="0 0 32 32"><Path d="M9 6.5h14v19H9z" fill="#F8FCF8" stroke="#087A45" strokeWidth="1.6"/><Path d="M6 7.5A2.5 2.5 0 0 1 8.5 5H11v5H8.5A2.5 2.5 0 0 1 6 7.5Zm20 17a2.5 2.5 0 0 1-2.5 2.5H21v-5h2.5a2.5 2.5 0 0 1 2.5 2.5Z" fill="#FFF7D8" stroke="#B98918" strokeWidth="1.4"/><Path d="M13 12h7m-7 4h7m-7 4h5" stroke="#087A45" strokeWidth="1.5" strokeLinecap="round"/><Circle cx="21.5" cy="9.5" r="3.2" fill="#E6B83E" stroke="#B98918" strokeWidth="1"/><Path d="M21.5 7.8v1.9l1.2.8" stroke="#087A45" strokeWidth="1" strokeLinecap="round"/></Svg>;
'@
if(-not $text.Contains($anchor)){throw 'Icon component anchor not found.'}
$text=$text.Replace($anchor,$icons+$anchor)
$rules=@(
 @{Pattern="\{icon:'[^']+',label:c\.quran,go:p\.onOpenQuran\}";Replacement="{icon:'quran-icon',label:c.quran,go:p.onOpenQuran}"},
 @{Pattern="\{icon:'[^']+',label:c\.hadith,go:p\.onOpenHadith\}";Replacement="{icon:'hadith-icon',label:c.hadith,go:p.onOpenHadith}"},
 @{Pattern="\{icon:'[^']+',label:c\.qibla,go:p\.onOpenQibla\}";Replacement="{icon:'qibla-icon',label:c.qibla,go:p.onOpenQibla}"},
 @{Pattern="\{icon:'[^']+',label:uiText\(p\.language,'Islamic'\)\+'\\n'\+uiText\(p\.language,'History'\),go:p\.onOpenIslamicHistory\}";Replacement="{icon:'history-icon',label:uiText(p.language,'Islamic')+'\n'+uiText(p.language,'History'),go:p.onOpenIslamicHistory}"}
)
foreach($rule in $rules){$next=[regex]::Replace($text,$rule.Pattern,$rule.Replacement,1);if($next -eq $text){throw "Card not found: $($rule.Pattern)"};$text=$next}
[IO.File]::WriteAllText($screenPath,$text)
