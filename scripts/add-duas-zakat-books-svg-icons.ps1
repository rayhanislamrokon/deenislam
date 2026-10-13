$ErrorActionPreference = 'Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$screenPath=Join-Path $projectRoot 'src\screens\HomeScreen.tsx'
$text=[IO.File]::ReadAllText($screenPath)
$anchor="if(name==='daily-prayer-icon')return"
$icons=@'
if(name==='duas-icon')return <Svg width={30} height={30} viewBox="0 0 32 32"><Path d="M14.3 26.2c-3.8-.7-6.7-3.3-7.7-7.1l-1.4-5.4c-.3-1.1.2-2 1.1-2.2.8-.2 1.5.3 1.9 1.2l1.6 4.1-.9-7.2c-.1-1 .5-1.8 1.4-1.9.9-.1 1.6.5 1.8 1.5l1.2 6.6.1-8.1c0-1 .7-1.7 1.6-1.7.9 0 1.6.7 1.6 1.7v8.7" fill="#EAF7EE" stroke="#087A45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><Path d="M17.7 26.2c3.8-.7 6.7-3.3 7.7-7.1l1.4-5.4c.3-1.1-.2-2-1.1-2.2-.8-.2-1.5.3-1.9 1.2l-1.6 4.1.9-7.2c.1-1-.5-1.8-1.4-1.9-.9-.1-1.6.5-1.8 1.5l-1.2 6.6-.1-8.1c0-1-.7-1.7-1.6-1.7-.9 0-1.6.7-1.6 1.7v8.7" fill="#FFF7D8" stroke="#B98918" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></Svg>;if(name==='zakat-icon')return <Svg width={30} height={30} viewBox="0 0 32 32"><Circle cx="16" cy="12" r="6.5" fill="#FFF7D8" stroke="#B98918" strokeWidth="1.6"/><Path d="M18.3 8.5a4.1 4.1 0 1 0 2.4 6.9 3.5 3.5 0 1 1-2.4-6.9Z" fill="#087A45"/><Path d="M4.8 23.5h7.4l3.2 2.3c.8.6 1.9.6 2.7.1l8.5-5.2c.8-.5 1-1.5.5-2.2-.5-.7-1.3-.8-2.1-.5l-5.8 2.8m-7-1.8h5.2c2.5 0 2.6 3.3.2 3.3h-4" fill="#EAF7EE" stroke="#087A45" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></Svg>;if(name==='books-icon')return <Svg width={30} height={30} viewBox="0 0 32 32"><Path d="m6 20.5 18-3 2 4.5-18 3-2-4.5Z" fill="#EAF7EE" stroke="#087A45" strokeWidth="1.5" strokeLinejoin="round"/><Path d="m7 14.5 18-3 1.5 4.2-18 3L7 14.5Z" fill="#FFF7D8" stroke="#B98918" strokeWidth="1.5" strokeLinejoin="round"/><Path d="m5.5 9 18-3 2 4-18 3-2-4Z" fill="#EAF7EE" stroke="#087A45" strokeWidth="1.5" strokeLinejoin="round"/><Path d="M10 8.2v4.2m2.5 2.8v3.2m-1.2 3v3" stroke="#D39F23" strokeWidth="1.3"/></Svg>;
'@
if(-not $text.Contains($anchor)){throw 'Custom icon component anchor not found.'}
$text=$text.Replace($anchor,$icons+$anchor)
$rules=@(
  @{Pattern="\{icon:'[^']+',label:uiText\(p\.language,'Zakat'\),go:p\.onOpenZakat\}";Replacement="{icon:'zakat-icon',label:uiText(p.language,'Zakat'),go:p.onOpenZakat}"},
  @{Pattern="\{icon:'[^']+',label:c\.books,go:p\.onOpenBooks\}";Replacement="{icon:'books-icon',label:c.books,go:p.onOpenBooks}"},
  @{Pattern="\{icon:'[^']+',label:'Duas',go:p\.onOpenDuas\}";Replacement="{icon:'duas-icon',label:'Duas',go:p.onOpenDuas}"}
)
foreach($rule in $rules){$next=[regex]::Replace($text,$rule.Pattern,$rule.Replacement,1);if($next -eq $text){throw "Card not found: $($rule.Pattern)"};$text=$next}
[IO.File]::WriteAllText($screenPath,$text)
