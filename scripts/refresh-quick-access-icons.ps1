$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$screenPath = Join-Path $projectRoot 'src\screens\HomeScreen.tsx'
$text = [IO.File]::ReadAllText($screenPath)
$replacements = @(
    @{ Old = "{icon:'📖',label:c.tafsir,go:p.onOpenTafsir}"; New = "{icon:'\u{1F50E}',label:c.tafsir,go:p.onOpenTafsir}" },
    @{ Old = "{icon:'✿',label:uiText(p.language,'Islamic Lifestyle'),go:p.onOpenAqidah}"; New = "{icon:'\u{1F33F}',label:uiText(p.language,'Islamic Lifestyle'),go:p.onOpenAqidah}" },
    @{ Old = "{icon:'🕌',label:uiText(p.language,'Prophets'),go:p.onOpenSeerah}"; New = "{icon:'\u{2B50}',label:uiText(p.language,'Prophets'),go:p.onOpenSeerah}" }
)
foreach ($item in $replacements) {
    if (-not $text.Contains($item.Old)) { throw "Quick Access icon entry was not found: $($item.Old)" }
    $text = $text.Replace($item.Old, $item.New)
}
[IO.File]::WriteAllText($screenPath, $text)
