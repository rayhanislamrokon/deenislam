$target = Join-Path $PSScriptRoot '..\src\screens\DownloadedLibraryScreen.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = [regex]::Replace($source, "\{\x27[^\x27]+\x27\} Downloads", "{'\u2039'} Downloads")
$source = [regex]::Replace($source, '<Text style=\{s\.back\}>[^<]+</Text>', "<Text style={s.back}>{'\u2039'}</Text>")
$source = [regex]::Replace($source, '<Text style=\{s\.categoryArrow\}>[^<]+</Text>', "<Text style={s.categoryArrow}>{'\u203A'}</Text>")
$source = [regex]::Replace($source, '<Text style=\{s\.categoriesBackText\}>[^<]* Categories</Text>', "<Text style={s.categoriesBackText}>{'\u2039'} Categories</Text>")
$source = [regex]::Replace($source, '<Text style=\{s\.emptyArrow\}>[^<]+</Text>', "<Text style={s.emptyArrow}>{'\u2193'}</Text>")
$source = [regex]::Replace($source, '<Text style=\{s\.readerSub\}>.*?</Text>', '<Text style={s.readerSub}>{surah.englishNameTranslation} {"\u00B7"} {surah.numberOfAyahs} Ayahs</Text>')
$source = [regex]::Replace($source, 'subtitle:`\$\{row\.ayahCount\} Ayahs .*? Audio included`', 'subtitle:`${row.ayahCount} Ayahs ${"\u00B7"} ${row.language.toUpperCase()} ${"\u00B7"} Audio included`')
$source = [regex]::Replace($source, 'subtitle:`\$\{row\.items\} saved items .*? \$\{row\.language\.toUpperCase\(\)\}`', 'subtitle:`${row.items} saved items ${"\u00B7"} ${row.language.toUpperCase()}`')
Set-Content -LiteralPath $target -Value $source -Encoding utf8
