$ErrorActionPreference = 'Stop'

function Update-File([string]$Path, [hashtable]$Replacements) {
    $text = [IO.File]::ReadAllText($Path)
    foreach ($old in $Replacements.Keys) {
        if (-not $text.Contains($old)) { throw "Expected text not found in $Path`: $old" }
        $text = $text.Replace($old, $Replacements[$old])
    }
    [IO.File]::WriteAllText($Path, $text)
}

$root = Split-Path $PSScriptRoot -Parent
$home = Join-Path $root 'src\screens\HomeScreen.tsx'
$app = Join-Path $root 'App.tsx'
$books = Join-Path $root 'src\screens\BooksScreen.tsx'

Update-File $home @{
    'onOpenAqidah:()=>void;onOpenSeerah:()=>void;onOpenDuas:()=>void;' = 'onOpenAqidah:()=>void;onOpenSeerah:()=>void;onOpenSahaba:()=>void;onOpenIslamicHistory:()=>void;onOpenDuas:()=>void;'
    "{icon:'🏛️',label:c.history},{icon:'📚'" = "{icon:'👥',label:uiText(p.language,'Sahaba'),go:p.onOpenSahaba},{icon:'🏛️',label:uiText(p.language,'Islamic History'),go:p.onOpenIslamicHistory},{icon:'📚'"
}

Update-File $app @{
    "useState<'All' | 'Books' | 'Aqidah' | 'Seerah'>('All')" = "useState<'All' | 'Books' | 'Aqidah' | 'Seerah' | 'Sahaba' | 'Islamic History'>('All')"
    "onOpenAqidah={() => setScreen('aqidah-life')} onOpenSeerah={() => setScreen('seerah')} onOpenDuas" = "onOpenAqidah={() => setScreen('aqidah-life')} onOpenSeerah={() => setScreen('seerah')} onOpenSahaba={() => { setBooksInitialCategory('Sahaba'); setBooksReturnScreen('home'); setScreen('books'); }} onOpenIslamicHistory={() => { setBooksInitialCategory('Islamic History'); setBooksReturnScreen('home'); setScreen('books'); }} onOpenDuas"
}

Update-File $books @{
    "type Category='All'|'Books'|'Tafsir'|'Hadith'|'Fiqh'|'Aqidah'|'History'|'Seerah';" = "type Category='All'|'Books'|'Tafsir'|'Hadith'|'Fiqh'|'Aqidah'|'History'|'Seerah'|'Sahaba'|'Islamic History';"
    "['All','Books','Tafsir','Hadith','Fiqh','Aqidah','History','Seerah']" = "['All','Books','Tafsir','Hadith','Fiqh','Aqidah','Sahaba','Islamic History','History','Seerah']"
}
