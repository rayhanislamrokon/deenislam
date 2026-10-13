$ErrorActionPreference = 'Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$screenPath=Join-Path $projectRoot 'src\screens\BooksScreen.tsx'
$text=[IO.File]::ReadAllText($screenPath)
$next=[regex]::Replace($text,'<Text style=\{s\.headerIcons\}>[^<]*</Text>','<View style={{width:34}}/>',1)
if($next -eq $text){throw 'Books header actions were not found.'}
[IO.File]::WriteAllText($screenPath,$next)
