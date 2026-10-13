$target = Join-Path $PSScriptRoot '..\admin-panel\app\quran\page.tsx'
$source = Get-Content -LiteralPath $target -Raw -Encoding utf8
$source = [regex]::Replace($source, '<strong>[^<]*</strong>(?=</button>\}\)\}</div>)', '<strong>&gt;</strong>')
Set-Content -LiteralPath $target -Value $source -NoNewline -Encoding utf8
