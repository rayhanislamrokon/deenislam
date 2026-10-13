$path = 'src/screens/AqidahLifeScreen.tsx'
$text = Get-Content -Raw $path
$old = '<View style={styles.headerCopy}><Text style={styles.headerTitle}>Chapter {activeChapter.number}</Text><Text style={styles.headerSubtitle}>How a Muslim Should Live</Text></View>'
if (-not $text.Contains($old)) { throw 'Chapter detail header title was not found.' }
$text = $text.Replace($old, '<View style={styles.headerCopy}/>')
Set-Content -Path $path -Value $text -Encoding utf8
