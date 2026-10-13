$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$path = Join-Path $projectRoot 'App.tsx'
$source = [IO.File]::ReadAllText($path)
if($source -notmatch "IslamicHistoryScreen"){$source=$source.Replace("import { BooksScreen } from './src/screens/BooksScreen';","import { BooksScreen } from './src/screens/BooksScreen';"+[Environment]::NewLine+"import { IslamicHistoryScreen } from './src/screens/IslamicHistoryScreen';")}
$source=$source.Replace(" | 'tafsir';"," | 'tafsir' | 'islamic-history';")
$source=$source.Replace(" || screen === 'aqidah-life' || screen === 'login'"," || screen === 'aqidah-life' || screen === 'islamic-history' || screen === 'login'")
$source=$source.Replace("onOpenIslamicHistory={() => { setBooksInitialCategory('Islamic History'); setBooksReturnScreen('home'); setScreen('books'); }}","onOpenIslamicHistory={() => setScreen('islamic-history')}")
$marker="      {screen === 'books' && <BooksScreen"
if($source -notmatch "screen === 'islamic-history' &&"){$index=$source.IndexOf($marker);if($index -lt 0){throw 'Books render marker not found.'};$line="      {screen === 'islamic-history' && <IslamicHistoryScreen onBack={() => setScreen('home')} />}"+[Environment]::NewLine;$source=$source.Insert($index,$line)}
[IO.File]::WriteAllText($path,$source,[Text.UTF8Encoding]::new($false))
