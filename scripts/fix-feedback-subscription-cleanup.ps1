$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$path=Join-Path $projectRoot 'src\services\actionFeedback.ts'
$text=[IO.File]::ReadAllText($path)
$old="return()=>listeners.delete(listener)"
$new="return()=>{listeners.delete(listener)}"
if(-not $text.Contains($old)){throw 'Feedback cleanup not found.'}
[IO.File]::WriteAllText($path,$text.Replace($old,$new))
