$path = 'src/screens/AqidahLifeScreen.tsx'
$text = Get-Content -Raw $path
$cp1252 = [System.Text.Encoding]::GetEncoding(1252)
$utf8 = [System.Text.Encoding]::UTF8
$pattern = '[^\x00-\x7F]+'
$fixed = [System.Text.RegularExpressions.Regex]::Replace($text, $pattern, [System.Text.RegularExpressions.MatchEvaluator]{
  param($match)
  $value = $match.Value
  $passes = 0
  while ($value -match '[ÃÂâðÙØÛ]' -and $passes -lt 4) {
    $candidate = $utf8.GetString($cp1252.GetBytes($value))
    if ($candidate -eq $value -or $candidate.Contains([char]0xFFFD)) { break }
    $value = $candidate
    $passes++
  }
  return $value
})
Set-Content -Path $path -Value $fixed -Encoding utf8
