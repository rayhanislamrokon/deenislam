$target = Join-Path $PSScriptRoot '..\src\screens\QuranScreen.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = [regex]::Replace($source, '<Text numberOfLines=\{1\} style=\{styles\.surahProgressSubtitle\}>.*?\{item\[1\]\}</Text>', '<Text numberOfLines={1} style={styles.surahProgressSubtitle}>{item[1]}</Text>')
Set-Content -LiteralPath $target -Value $source -Encoding utf8
