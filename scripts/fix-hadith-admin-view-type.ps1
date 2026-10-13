$target = Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx'
$source = Get-Content -LiteralPath $target -Raw -Encoding utf8
$source = $source.Replace('"lifestyle"|"prophets"|"quran"|"security">("overview")', '"lifestyle"|"prophets"|"quran"|"hadith"|"security">("overview")')
Set-Content -LiteralPath $target -Value $source -NoNewline -Encoding utf8
