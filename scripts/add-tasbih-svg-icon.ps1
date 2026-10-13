$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$screenPath = Join-Path $projectRoot 'src\screens\HomeScreen.tsx'
$text = [IO.File]::ReadAllText($screenPath)
$anchor = "if(name==='prophets-icon')return"
$tasbih = @'
if(name==='tasbih-icon')return <Svg width={30} height={30} viewBox="0 0 32 32"><Path d="M16 4.8c6.2 0 11.2 4.8 11.2 10.7 0 4.5-2.9 8.3-7 9.9" fill="none" stroke="#B98918" strokeWidth="1.2" strokeLinecap="round"/><Circle cx="16" cy="5" r="2.15" fill="#087A45"/><Circle cx="22" cy="7" r="2.15" fill="#0B8A52"/><Circle cx="26" cy="11.5" r="2.15" fill="#087A45"/><Circle cx="26.5" cy="17.5" r="2.15" fill="#0B8A52"/><Circle cx="23.5" cy="22.5" r="2.15" fill="#087A45"/><Circle cx="10" cy="7" r="2.15" fill="#0B8A52"/><Circle cx="6" cy="11.5" r="2.15" fill="#087A45"/><Circle cx="5.5" cy="17.5" r="2.15" fill="#0B8A52"/><Circle cx="8.5" cy="22.5" r="2.15" fill="#087A45"/><Path d="M19.8 24.8c-1.2 1-2.5 1.7-3.8 1.7m0 0v2.3m-2.2 0h4.4L16 25.6l-2.2 3.2Z" fill="#E6B83E" stroke="#B98918" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
'@
if (-not $text.Contains($anchor)) { throw 'Custom icon component anchor was not found.' }
$text = $text.Replace($anchor, $tasbih + $anchor)
$next = [regex]::Replace($text,"\{icon:'[^']+',label:uiText\(p\.language,'Tasbih'\),go:p\.onOpenTasbih\}","{icon:'tasbih-icon',label:uiText(p.language,'Tasbih'),go:p.onOpenTasbih}",1)
if ($next -eq $text) { throw 'Tasbih card was not found.' }
[IO.File]::WriteAllText($screenPath, $next)
