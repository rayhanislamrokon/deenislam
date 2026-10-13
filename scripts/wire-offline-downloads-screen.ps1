$ErrorActionPreference='Stop'
function Replace-Text([string]$Path,[string]$Old,[string]$New){$text=[IO.File]::ReadAllText($Path);if(-not $text.Contains($Old)){throw "Expected text not found in $Path"};[IO.File]::WriteAllText($Path,$text.Replace($Old,$New))}
$projectRoot=Split-Path $PSScriptRoot -Parent
$appPath=Join-Path $projectRoot 'App.tsx'
Replace-Text $appPath "import { ProphetsListScreen } from './src/screens/ProphetsListScreen';" "import { ProphetsListScreen } from './src/screens/ProphetsListScreen';`r`nimport { DownloadsScreen } from './src/screens/DownloadsScreen';"
Replace-Text $appPath "'tasbih' | 'duas' | 'seerah'" "'tasbih' | 'duas' | 'downloads' | 'seerah'"
Replace-Text $appPath "onOpenDownloads={() => { setBooksInitialCategory('All'); setBooksReturnScreen('home'); setScreen('books'); }}" "onOpenDownloads={() => setScreen('downloads')}"
$anchor="{screen === 'books' && <BooksScreen"
$text=[IO.File]::ReadAllText($appPath)
$download="{screen === 'downloads' && <DownloadsScreen language={selectedLanguage} onBack={() => setScreen('home')} />}`r`n      "
if(-not $text.Contains($anchor)){throw 'Books screen render anchor not found.'}
$text=$text.Replace($anchor,$download+$anchor)
[IO.File]::WriteAllText($appPath,$text)
