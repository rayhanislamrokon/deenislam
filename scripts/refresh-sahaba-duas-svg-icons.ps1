$ErrorActionPreference = 'Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$screenPath=Join-Path $projectRoot 'src\screens\HomeScreen.tsx'
$text=[IO.File]::ReadAllText($screenPath)
$anchor="if(name==='duas-icon')return"
$icons=@'
if(name==='sahaba-icon')return <Svg width={30} height={30} viewBox="0 0 32 32"><Circle cx="16" cy="9" r="4" fill="#FFF7D8" stroke="#B98918" strokeWidth="1.5"/><Circle cx="8.5" cy="12" r="3" fill="#EAF7EE" stroke="#087A45" strokeWidth="1.4"/><Circle cx="23.5" cy="12" r="3" fill="#EAF7EE" stroke="#087A45" strokeWidth="1.4"/><Path d="M9.5 26c.2-5 2.8-8.4 6.5-8.4s6.3 3.4 6.5 8.4h-13Z" fill="#EAF7EE" stroke="#087A45" strokeWidth="1.6" strokeLinejoin="round"/><Path d="M3.8 25c.2-4.1 2-6.8 4.8-6.8 1.3 0 2.4.6 3.2 1.6M28.2 25c-.2-4.1-2-6.8-4.8-6.8-1.3 0-2.4.6-3.2 1.6" fill="none" stroke="#087A45" strokeWidth="1.5" strokeLinecap="round"/></Svg>;if(name==='duas-icon-v2')return <Svg width={30} height={30} viewBox="0 0 32 32"><Path d="M15.9 14.2c-2.8-4.1-8.1-1.6-6.9 2.5 1 3.3 6.9 6.7 6.9 6.7s5.9-3.4 6.9-6.7c1.2-4.1-4.1-6.6-6.9-2.5Z" fill="#FFF7D8" stroke="#B98918" strokeWidth="1.4" strokeLinejoin="round"/><Path d="M4.5 16.7c2.1 6.2 5.8 9.5 11.5 10.2M27.5 16.7c-2.1 6.2-5.8 9.5-11.5 10.2M6.2 12.5l2.3 7.1m17.3-7.1-2.3 7.1" fill="none" stroke="#087A45" strokeWidth="1.8" strokeLinecap="round"/><Path d="M6.2 12.5c-.5-1.5-2.8-.8-2.4.8l.7 3.4m21.3-4.2c.5-1.5 2.8-.8 2.4.8l-.7 3.4" fill="#EAF7EE" stroke="#087A45" strokeWidth="1.4" strokeLinecap="round"/></Svg>;
'@
if(-not $text.Contains($anchor)){throw 'Icon component anchor not found.'}
$text=$text.Replace($anchor,$icons+$anchor)
$sahabaPattern="\{icon:'[^']+',label:uiText\(p\.language,'Sahaba'\),go:p\.onOpenSahaba\}"
$next=[regex]::Replace($text,$sahabaPattern,"{icon:'sahaba-icon',label:uiText(p.language,'Sahaba'),go:p.onOpenSahaba}",1)
if($next -eq $text){throw 'Sahaba card not found.'};$text=$next
$duasPattern="\{icon:'duas-icon',label:'Duas',go:p\.onOpenDuas\}"
$next=[regex]::Replace($text,$duasPattern,"{icon:'duas-icon-v2',label:'Duas',go:p.onOpenDuas}",1)
if($next -eq $text){throw 'Duas card not found.'}
[IO.File]::WriteAllText($screenPath,$next)
