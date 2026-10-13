$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$appPath=Join-Path $projectRoot 'App.tsx'
$text=[IO.File]::ReadAllText($appPath)
$text=$text.Replace("import { DownloadedLibraryScreen } from './src/screens/DownloadedLibraryScreen';","import { DownloadedLibraryScreen } from './src/screens/DownloadedLibraryScreen';`nimport { BookmarksLibraryScreen } from './src/screens/BookmarksLibraryScreen';")
$text=$text.Replace("'tasbih' | 'duas' | 'downloads' | 'seerah'","'tasbih' | 'duas' | 'downloads' | 'bookmarks' | 'seerah'")
$old="onOpenBookmarks={() => { setBooksInitialCategory('All'); setBooksReturnScreen('home'); setScreen('books'); }}"
if(-not $text.Contains($old)){throw 'Home bookmarks route not found.'};$text=$text.Replace($old,"onOpenBookmarks={() => setScreen('bookmarks')}")
$anchor="{screen === 'downloads' && <DownloadedLibraryScreen"
$render="{screen === 'bookmarks' && <BookmarksLibraryScreen onBack={() => setScreen('home')} onOpen={(item) => { if(item.target?.type==='surah'){setSelectedSurah(Number(item.target.value));setScreen('surah-reader')}else if(item.target?.type==='juz'){setSelectedJuz(Number(item.target.value));setScreen('juz-reader')}else if(item.target?.type==='book'){setSelectedBookSlug(item.target.value);setScreen('book-reader')}else if(item.target?.type==='tafsir'){setSelectedSurah(Number(item.target.value));setScreen('tafsir')} }} />}`n      "
if(-not $text.Contains($anchor)){throw 'Downloads render anchor not found.'};$text=$text.Replace($anchor,$render+$anchor)
[IO.File]::WriteAllText($appPath,$text)
