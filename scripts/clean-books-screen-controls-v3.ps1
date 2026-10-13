$ErrorActionPreference = 'Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$screenPath=Join-Path $projectRoot 'src\screens\BooksScreen.tsx'
$text=[IO.File]::ReadAllText($screenPath)
$next=[regex]::Replace($text,':<Text style=\{s\.filterIcon\}>[^<]*</Text>',':null',1)
if($next -eq $text){throw 'Search filter icon was not found.'};$text=$next
$match=[regex]::Match($text,'<View style=\{s\.switch\}>.*?</View>')
if(-not $match.Success){throw 'Grid and list controls were not found.'}
$switch='{shown.length>0?'+$match.Value.Replace('<Pressable ','<Pressable accessibilityLabel="Book view option" ') + ':null}'
$text=$text.Remove($match.Index,$match.Length).Insert($match.Index,$switch)
[IO.File]::WriteAllText($screenPath,$text)
