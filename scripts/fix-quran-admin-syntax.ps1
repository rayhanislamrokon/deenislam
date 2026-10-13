$target = Join-Path $PSScriptRoot '..\admin-panel\app\quran\page.tsx'
$source = Get-Content -LiteralPath $target -Raw
$old = 'a.translations?.[language]||""]))}).catch'
$new = 'a.translations?.[language]||""])))}).catch'
if (-not $source.Contains($old)) { throw 'Quran setValues marker not found' }
$source = $source.Replace($old,$new)
Set-Content -LiteralPath $target -Value $source -NoNewline -Encoding utf8
