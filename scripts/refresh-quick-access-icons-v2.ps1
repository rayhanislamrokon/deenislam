$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$screenPath = Join-Path $projectRoot 'src\screens\HomeScreen.tsx'
$text = [IO.File]::ReadAllText($screenPath)
$rules = @(
    @{ Pattern = "\{icon:'[^']+',label:c\.tafsir,go:p\.onOpenTafsir\}"; Replacement = '{icon:''\u{1F50E}'',label:c.tafsir,go:p.onOpenTafsir}' },
    @{ Pattern = "\{icon:'[^']+',label:uiText\(p\.language,'Islamic Lifestyle'\),go:p\.onOpenAqidah\}"; Replacement = '{icon:''\u{1F33F}'',label:uiText(p.language,''Islamic Lifestyle''),go:p.onOpenAqidah}' },
    @{ Pattern = "\{icon:'[^']+',label:uiText\(p\.language,'Prophets'\),go:p\.onOpenSeerah\}"; Replacement = '{icon:''\u{2B50}'',label:uiText(p.language,''Prophets''),go:p.onOpenSeerah}' }
)
foreach ($rule in $rules) {
    $next = [regex]::Replace($text, $rule.Pattern, $rule.Replacement, 1)
    if ($next -eq $text) { throw "Quick Access icon entry was not found: $($rule.Pattern)" }
    $text = $next
}
[IO.File]::WriteAllText($screenPath, $text)
