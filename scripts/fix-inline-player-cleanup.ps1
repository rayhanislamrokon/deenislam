$target = Join-Path $PSScriptRoot '..\src\screens\DownloadedLibraryScreen.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = $source.Replace("return()=>{live=false;player.pause()}", "return()=>{live=false}")
Set-Content -LiteralPath $target -Value $source -Encoding utf8
