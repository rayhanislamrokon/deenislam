$target = Join-Path $PSScriptRoot '..\src\screens\DownloadedLibraryScreen.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = $source.Replace('</View>}</>}</>}</></ScrollView>', '</View>}</>}</>}</ScrollView>')
Set-Content -LiteralPath $target -Value $source -Encoding utf8
