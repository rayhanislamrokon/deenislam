$path = 'src/screens/AqidahLifeScreen.tsx'
$text = Get-Content -Raw $path
$updated = [regex]::Replace($text, '<Text style=\{styles\.chapterIndexKicker\}>.*?</Text>', '', 1)
if ($updated -eq $text) { throw 'Chapter card labels were not found.' }
Set-Content -Path $path -Value $updated -Encoding utf8
