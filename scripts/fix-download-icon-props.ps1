$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$screenPath=Join-Path $projectRoot 'src\screens\DownloadsScreen.tsx'
$text=[IO.File]::ReadAllText($screenPath)
$old="const p={fill:'none',stroke:'#087A45'"
$new="const p={stroke:'#087A45'"
if(-not $text.Contains($old)){throw 'Shared icon props not found.'}
[IO.File]::WriteAllText($screenPath,$text.Replace($old,$new))
