$ErrorActionPreference = 'Stop'
function Replace-Text([string]$Path,[string]$Old,[string]$New){$text=[IO.File]::ReadAllText($Path);if(-not $text.Contains($Old)){throw "Expected text not found in $Path"};[IO.File]::WriteAllText($Path,$text.Replace($Old,$New))}
$root=Split-Path $PSScriptRoot -Parent
$home=Join-Path $root 'src\screens\HomeScreen.tsx'
$app=Join-Path $root 'App.tsx'
$books=Join-Path $root 'src\screens\BooksScreen.tsx'
Replace-Text $home 'onOpenAqidah:()=>void;onOpenSeerah:()=>void;onOpenDuas:()=>void;' 'onOpenAqidah:()=>void;onOpenSeerah:()=>void;onOpenSahaba:()=>void;onOpenIslamicHistory:()=>void;onOpenDuas:()=>void;'
$homeText=[IO.File]::ReadAllText($home)
$nextHome=[regex]::Replace($homeText,"\{icon:'[^']+',label:c\.history\}","{icon:'SH',label:uiText(p.language,'Sahaba'),go:p.onOpenSahaba},{icon:'H',label:uiText(p.language,'Islamic History'),go:p.onOpenIslamicHistory}",1)
if($nextHome -eq $homeText){throw 'History card was not found.'};[IO.File]::WriteAllText($home,$nextHome)
Replace-Text $app "useState<'All' | 'Books' | 'Aqidah' | 'Seerah'>('All')" "useState<'All' | 'Books' | 'Aqidah' | 'Seerah' | 'Sahaba' | 'Islamic History'>('All')"
Replace-Text $app "onOpenAqidah={() => setScreen('aqidah-life')} onOpenSeerah={() => setScreen('seerah')} onOpenDuas" "onOpenAqidah={() => setScreen('aqidah-life')} onOpenSeerah={() => setScreen('seerah')} onOpenSahaba={() => { setBooksInitialCategory('Sahaba'); setBooksReturnScreen('home'); setScreen('books'); }} onOpenIslamicHistory={() => { setBooksInitialCategory('Islamic History'); setBooksReturnScreen('home'); setScreen('books'); }} onOpenDuas"
Replace-Text $books "type Category='All'|'Books'|'Tafsir'|'Hadith'|'Fiqh'|'Aqidah'|'History'|'Seerah';" "type Category='All'|'Books'|'Tafsir'|'Hadith'|'Fiqh'|'Aqidah'|'History'|'Seerah'|'Sahaba'|'Islamic History';"
Replace-Text $books "['All','Books','Tafsir','Hadith','Fiqh','Aqidah','History','Seerah']" "['All','Books','Tafsir','Hadith','Fiqh','Aqidah','Sahaba','Islamic History','History','Seerah']"
