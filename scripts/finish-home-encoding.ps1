$target = Join-Path $PSScriptRoot '..\src\screens\HomeScreen.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = [regex]::Replace($source, '>Hijri .*?</Text>', '>Hijri {"\u00B7"} {"\u0647\u062C\u0631\u064A"}</Text>', 1)
$source = [regex]::Replace($source, "mode===\x27hijri\x27\?\[[^\]]+\]", "mode==='hijri'?['\u062D','\u0646','\u062B','\u0631','\u062E','\u062C','\u0633']", 1)
$source = [regex]::Replace($source, '<Text style=\{s\.languageSubtitle\}>.*?</Text>', '<Text style={s.languageSubtitle}>{new Intl.NumberFormat(p.language).format(QURAN_TRANSLATION_LANGUAGES.size)} Quran translations complete {"\u00B7"} {"\u2713"} marked</Text>', 1)
Set-Content -LiteralPath $target -Value $source -Encoding utf8
