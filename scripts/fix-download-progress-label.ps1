$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$screenPath=Join-Path $projectRoot 'src\screens\DownloadsScreen.tsx'
$text=[IO.File]::ReadAllText($screenPath)
$old="{loading?`${progress}%:record?'Update':'Download'}"
$new="{loading?(progress+'%'):record?'Update':'Download'}"
if(-not $text.Contains($old)){throw 'Malformed progress label not found.'}
[IO.File]::WriteAllText($screenPath,$text.Replace($old,$new))
