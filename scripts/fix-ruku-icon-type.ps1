$target = Join-Path $PSScriptRoot '..\src\screens\QuranScreen.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = $source.Replace("'sajdah'|back'", "'sajdah'|'back'")
Set-Content -LiteralPath $target -Value $source -Encoding utf8
