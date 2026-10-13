$target = Join-Path $PSScriptRoot '..\src\services\quran.ts'
$source = Get-Content -LiteralPath $target -Raw
$source = $source.Replace('\u0627[\u064B-\u065F\u0670]*\u0644', '[\u0627\u0671][\u064B-\u065F\u0670]*\u0644')
Set-Content -LiteralPath $target -Value $source -Encoding utf8
