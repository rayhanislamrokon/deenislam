$ErrorActionPreference = 'Stop'
function Replace-Text([string]$Path,[string]$Old,[string]$New){$text=[IO.File]::ReadAllText($Path);if(-not $text.Contains($Old)){throw "Expected text not found in $Path"};[IO.File]::WriteAllText($Path,$text.Replace($Old,$New))}
$projectRoot=Split-Path $PSScriptRoot -Parent
$homeScreenPath=Join-Path $projectRoot 'src\screens\HomeScreen.tsx'
$appPath=Join-Path $projectRoot 'App.tsx'
$booksScreenPath=Join-Path $projectRoot 'src\screens\BooksScreen.tsx'
Replace-Text $homeScreenPath 'onOpenAqidah:()=>void;onOpenSeerah:()=>void;onOpenDuas:()=>void;' 'onOpenAqidah:()=>void;onOpenSeerah:()=>void;onOpenSahaba:()=>void;onOpenIslamicHistory:()=>void;onOpenDuas:()=>void;'
$homeScreenText=[IO.File]::ReadAllText($homeScreenPath)
$nextHomeScreen=[regex]::Replace($homeScreenText,"\{icon:'[^']+',label:c\.history\}","{icon:'SH',label:uiText(p.language,'Sahaba'),go:p.onOpenSahaba},{icon:'H',label:uiText(p.language,'Islamic History'),go:p.onOpenIslamicHistory}",1)
if($nextHomeScreen -eq $homeScreenText){throw 'History card was not found.'};[IO.File]::WriteAllText($homeScreenPath,$nextHomeScreen)
Replace-Text $appPath "useState<'All' | 'Books' | 'Aqidah' | 'Seerah'>('All')" "useState<'All' | 'Books' | 'Aqidah' | 'Seerah' | 'Sahaba' | 'Islamic History'>('All')"
Replace-Text $appPath "onOpenAqidah={() => setScreen('aqidah-life')} onOpenSeerah={() => setScreen('seerah')} onOpenDuas" "onOpenAqidah={() => setScreen('aqidah-life')} onOpenSeerah={() => setScreen('seerah')} onOpenSahaba={() => { setBooksInitialCategory('Sahaba'); setBooksReturnScreen('home'); setScreen('books'); }} onOpenIslamicHistory={() => { setBooksInitialCategory('Islamic History'); setBooksReturnScreen('home'); setScreen('books'); }} onOpenDuas"
Replace-Text $booksScreenPath "type Category='All'|'Books'|'Tafsir'|'Hadith'|'Fiqh'|'Aqidah'|'History'|'Seerah';" "type Category='All'|'Books'|'Tafsir'|'Hadith'|'Fiqh'|'Aqidah'|'History'|'Seerah'|'Sahaba'|'Islamic History';"
Replace-Text $booksScreenPath "['All','Books','Tafsir','Hadith','Fiqh','Aqidah','History','Seerah']" "['All','Books','Tafsir','Hadith','Fiqh','Aqidah','Sahaba','Islamic History','History','Seerah']"
