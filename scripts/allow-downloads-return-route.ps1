$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$appPath=Join-Path $projectRoot 'App.tsx'
$text=[IO.File]::ReadAllText($appPath)
$old="useState<'home' | 'library' | 'profile'>('home')"
$new="useState<'home' | 'library' | 'profile' | 'downloads'>('home')"
if(-not $text.Contains($old)){throw 'Content return route type not found.'}
[IO.File]::WriteAllText($appPath,$text.Replace($old,$new))
