$target = Join-Path $PSScriptRoot '..\src\screens\DownloadedLibraryScreen.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = $source.Replace("{'â€¹'}", "{'\u2039'}")
$source = $source.Replace('>â€¹</Text>', ">{'\u2039'}</Text>")
$source = $source.Replace('>â€º</Text>', ">{'\u203A'}</Text>")
$source = $source.Replace('>â†“</Text>', ">{'\u2193'}</Text>")
$source = $source.Replace('Â·', '\u00B7')
Set-Content -LiteralPath $target -Value $source -Encoding utf8
