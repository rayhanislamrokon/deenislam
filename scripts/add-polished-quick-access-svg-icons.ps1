$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$screenPath = Join-Path $projectRoot 'src\screens\HomeScreen.tsx'
$text = [IO.File]::ReadAllText($screenPath)

$component = @'
function QuickAccessIcon({name}:{name:string}){if(name==='tafsir-icon')return <Svg width={30} height={30} viewBox="0 0 32 32"><Path d="M4.5 7.5c4.8-1.8 8.5-.8 11.5 2.2v16c-3-3-6.7-4-11.5-2.2v-16Zm23 0c-4.8-1.8-8.5-.8-11.5 2.2v16c3-3 6.7-4 11.5-2.2v-16Z" fill="#EEF8F1" stroke="#087A45" strokeWidth="1.7" strokeLinejoin="round"/><Circle cx="23.2" cy="19.7" r="3.2" fill="#FFF" stroke="#D5A62A" strokeWidth="1.7"/><Path d="m25.6 22.1 2.5 2.5" stroke="#D5A62A" strokeWidth="1.8" strokeLinecap="round"/></Svg>;if(name==='lifestyle-icon')return <Svg width={30} height={30} viewBox="0 0 32 32"><Path d="M20.8 5.2a10.5 10.5 0 1 0 5.9 17.9A9 9 0 1 1 20.8 5.2Z" fill="#E8F6ED" stroke="#087A45" strokeWidth="1.7" strokeLinejoin="round"/><Path d="M18.2 22.8c.3-5 3-8.1 8.1-9.4-.1 4.9-2.8 8-8.1 9.4Zm0 0-2.1 2.5" fill="#FFF7D8" stroke="#D5A62A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></Svg>;if(name==='prophets-icon')return <Svg width={30} height={30} viewBox="0 0 32 32"><Path d="M8 7.5h16v17H8z" fill="#F8FCF8" stroke="#087A45" strokeWidth="1.7"/><Path d="M6 7.5c0-1.4 1.1-2.5 2.5-2.5H11v5H8.5A2.5 2.5 0 0 1 6 7.5Zm20 17c0 1.4-1.1 2.5-2.5 2.5H21v-5h2.5a2.5 2.5 0 0 1 2.5 2.5Z" fill="#E8F6ED" stroke="#087A45" strokeWidth="1.7"/><Path d="m16 11 1.2 2.5 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4L16 11Z" fill="#E6B83E" stroke="#C79519" strokeWidth=".8"/></Svg>;return <Text style={s.icon}>{name}</Text>}
'@

if (-not $text.Contains('function QuickAccessIcon(')) {
    $text = $text.Replace('export function HomeScreen', $component + 'export function HomeScreen')
}
$text = [regex]::Replace($text,"\{icon:'[^']+',label:c\.tafsir,go:p\.onOpenTafsir\}","{icon:'tafsir-icon',label:c.tafsir,go:p.onOpenTafsir}",1)
$text = [regex]::Replace($text,"\{icon:'[^']+',label:uiText\(p\.language,'Islamic Lifestyle'\),go:p\.onOpenAqidah\}","{icon:'lifestyle-icon',label:uiText(p.language,'Islamic Lifestyle'),go:p.onOpenAqidah}",1)
$text = [regex]::Replace($text,"\{icon:'[^']+',label:uiText\(p\.language,'Prophets'\),go:p\.onOpenSeerah\}","{icon:'prophets-icon',label:uiText(p.language,'Prophets'),go:p.onOpenSeerah}",1)
$text = $text.Replace('<Text style={s.icon}>{x.icon}</Text>', '<QuickAccessIcon name={x.icon}/>')
[IO.File]::WriteAllText($screenPath, $text)
