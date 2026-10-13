$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$screenPath = Join-Path $projectRoot 'src\screens\HomeScreen.tsx'
$text = [IO.File]::ReadAllText($screenPath)
$anchor = "if(name==='tasbih-icon')return"
$mosque = @'
if(name==='mosque-icon')return <Svg width={31} height={31} viewBox="0 0 32 32"><Path d="M5.5 27V14.5h4V27m13 0V14.5h4V27M4 27.2h24" fill="#F8FCF8" stroke="#087A45" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><Path d="M6.3 12.7h2.4L7.5 9.8l-1.2 2.9Zm17 0h2.4l-1.2-2.9-1.2 2.9Z" fill="#E6B83E" stroke="#B98918" strokeWidth="1"/><Path d="M10.2 27V20c0-3.3 2.6-6 5.8-7.5 3.2 1.5 5.8 4.2 5.8 7.5v7H10.2Z" fill="#EAF7EE" stroke="#087A45" strokeWidth="1.6" strokeLinejoin="round"/><Path d="M16 12.4V9.8m0 0c1.8.2 2.8-.8 3.3-2.1-1.8.5-3.1-.2-3.6-1.4-.5 1.4-.3 2.6.3 3.5Z" fill="#E6B83E" stroke="#B98918" strokeWidth="1" strokeLinecap="round"/><Path d="M14.1 27v-4.2c0-1.2.8-2.1 1.9-2.1s1.9.9 1.9 2.1V27" fill="#FFF" stroke="#087A45" strokeWidth="1.3"/></Svg>;
'@
if (-not $text.Contains($anchor)) { throw 'Custom icon component anchor was not found.' }
$text = $text.Replace($anchor, $mosque + $anchor)
$next = [regex]::Replace($text,"\{icon:'[^']+',label:uiText\(p\.language,'Nearby Mosques'\),go:p\.onOpenNearbyMosques\}","{icon:'mosque-icon',label:uiText(p.language,'Nearby Mosques'),go:p.onOpenNearbyMosques}",1)
if ($next -eq $text) { throw 'Nearby Mosques card was not found.' }
[IO.File]::WriteAllText($screenPath, $next)
