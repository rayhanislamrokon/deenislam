$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$screenPath = Join-Path $projectRoot 'src\screens\HomeScreen.tsx'
$text = [IO.File]::ReadAllText($screenPath)
$old = "{icon:'SH',label:uiText(p.language,'Sahaba'),go:p.onOpenSahaba},{icon:'H',label:uiText(p.language,'Islamic History'),go:p.onOpenIslamicHistory}"
$new = "{icon:'\u{1F465}',label:uiText(p.language,'Sahaba'),go:p.onOpenSahaba},{icon:'\u{1F3DB}\u{FE0F}',label:uiText(p.language,'Islamic')+'\n'+uiText(p.language,'History'),go:p.onOpenIslamicHistory}"
if (-not $text.Contains($old)) { throw 'Sahaba and Islamic History cards were not found.' }
[IO.File]::WriteAllText($screenPath, $text.Replace($old, $new))
