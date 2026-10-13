$target = Join-Path $PSScriptRoot '..\src\screens\HomeScreen.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = $source.Replace("{icon:'duas-icon-v2',label:'Duas',go:p.onOpenDuas}", "{icon:'duas-icon-v2',label:'Duas & Amol',go:p.onOpenDuas}")
Set-Content -LiteralPath $target -Value $source -Encoding utf8
