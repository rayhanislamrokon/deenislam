$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$appPath=Join-Path $projectRoot 'App.tsx'
$text=[IO.File]::ReadAllText($appPath)
$old="import { DownloadsScreen } from './src/screens/DownloadsScreen';"
$new="import { DownloadedLibraryScreen } from './src/screens/DownloadedLibraryScreen';"
if(-not $text.Contains($old)){throw 'Downloads screen import not found.'};$text=$text.Replace($old,$new)
$oldRender="<DownloadsScreen language={selectedLanguage} onBack={() => setScreen('home')} />"
$newRender="<DownloadedLibraryScreen language={selectedLanguage} onBack={() => setScreen('home')} onOpenQuran={() => { setContentReturnScreen('downloads'); setScreen('quran'); }} />"
if(-not $text.Contains($oldRender)){throw 'Downloads screen render not found.'};$text=$text.Replace($oldRender,$newRender)
[IO.File]::WriteAllText($appPath,$text)
