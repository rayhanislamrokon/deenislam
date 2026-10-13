$path = 'src/screens/AqidahLifeScreen.tsx'
$text = Get-Content -Raw $path
$cp1252 = [System.Text.Encoding]::GetEncoding(1252)
$utf8 = [System.Text.Encoding]::UTF8
$markerCodes = @(194,195,216,217,219,226,240)
$fixed = [System.Text.RegularExpressions.Regex]::Replace($text, '[^\x00-\x7F]+', [System.Text.RegularExpressions.MatchEvaluator]{
  param($match)
  $value = $match.Value
  $passes = 0
  while ($passes -lt 4) {
    $hasMarker = $false
    foreach ($character in $value.ToCharArray()) {
      if ($markerCodes -contains [int]$character) { $hasMarker = $true; break }
    }
    if (-not $hasMarker) { break }
    $candidate = $utf8.GetString($cp1252.GetBytes($value))
    if ($candidate -eq $value -or $candidate.Contains([char]0xFFFD)) { break }
    $value = $candidate
    $passes++
  }
  return $value
})
Set-Content -Path $path -Value $fixed -Encoding utf8
