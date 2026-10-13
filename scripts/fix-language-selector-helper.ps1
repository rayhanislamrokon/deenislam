$target = Join-Path $PSScriptRoot 'quran-custom-language-selector.ps1'
$source = Get-Content -LiteralPath $target -Raw
$old = '$updated = [regex]::Replace($source,$pattern,[System.Text.RegularExpressions.MatchEvaluator]{param($m)$replacement},1,[System.Text.RegularExpressions.RegexOptions]::Singleline)'
$new = '$selectorRegex = [regex]::new($pattern,[System.Text.RegularExpressions.RegexOptions]::Singleline)' + "`r`n" + '$updated = $selectorRegex.Replace($source,[System.Text.RegularExpressions.MatchEvaluator]{param($m)$replacement},1)'
if (-not $source.Contains($old)) { throw 'Regex overload marker not found' }
$source = $source.Replace($old,$new)
Set-Content -LiteralPath $target -Value $source -NoNewline -Encoding utf8
