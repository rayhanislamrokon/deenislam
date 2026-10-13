$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$screenPath = Join-Path $projectRoot 'src\screens\HomeScreen.tsx'
$text = [IO.File]::ReadAllText($screenPath)
$old = "{icon:'\u{1F3DB}\u{FE0F}',label:uiText(p.language,'Islamic')+'\n'+uiText(p.language,'History'),go:p.onOpenIslamicHistory}"
$new = "{icon:'\u{1F4DC}',label:uiText(p.language,'Islamic')+'\n'+uiText(p.language,'History'),go:p.onOpenIslamicHistory}"
if (-not $text.Contains($old)) { throw 'Islamic History icon was not found.' }
[IO.File]::WriteAllText($screenPath, $text.Replace($old, $new))
