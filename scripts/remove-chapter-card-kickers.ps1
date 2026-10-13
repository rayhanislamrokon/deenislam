$path = 'src/screens/AqidahLifeScreen.tsx'
$text = Get-Content -Raw $path
$pattern = '<Text style=\{styles\.chapterIndexKicker\}>\{chapter\.category \? chapter\.category\.toUpperCase\(\)\+'' • '' : ''''\}CHAPTER \{chapter\.number\}</Text>'
$updated = [regex]::Replace($text, $pattern, '')
if ($updated -eq $text) { throw 'Chapter card labels were not found.' }
Set-Content -Path $path -Value $updated -Encoding utf8
