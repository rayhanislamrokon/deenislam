$target = Join-Path $PSScriptRoot '..\admin-panel\app\quran\page.tsx'
$source = Get-Content -LiteralPath $target -Raw
$openMarker = '`}<style jsx>{`'
$closeMarker = '</style></style></main>'
$openCount = ([regex]::Matches($source,[regex]::Escape($openMarker))).Count
$closeCount = ([regex]::Matches($source,[regex]::Escape($closeMarker))).Count
if ($openCount -lt 1 -or $closeCount -ne 1) { throw "Unexpected style structure: openings=$openCount closing=$closeCount" }
$source = $source.Replace($openMarker,'`}</style><style jsx>{`')
$source = $source.Replace($closeMarker,'</style></main>')
Set-Content -LiteralPath $target -Value $source -NoNewline -Encoding utf8
