$path = Join-Path $PSScriptRoot '..\src\screens\AqidahLifeScreen.tsx'
$content = Get-Content -LiteralPath $path -Raw
$content = [regex]::Replace($content, '<Text style=\{styles\.chapterNavButtonText\}>[^<]*Previous</Text>', '<Text style={styles.chapterNavButtonText}>Previous</Text>')
$content = [regex]::Replace($content, '<Text style=\{styles\.chapterNavButtonText\}>Next[^<]*</Text>', '<Text style={styles.chapterNavButtonText}>Next</Text>')
[IO.File]::WriteAllText((Resolve-Path $path), $content, [Text.UTF8Encoding]::new($false))
