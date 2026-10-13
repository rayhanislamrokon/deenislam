$path = Join-Path $PSScriptRoot '..\admin-panel\app\hadith\page.tsx'
$content = [IO.File]::ReadAllText($path)
$needle = 'import Link from"next/link";'
$replacement = "import Link from`"next/link`";`r`nimport {transliterate} from`"transliteration`";"
if (-not $content.Contains($needle)) { throw 'Next Link import not found.' }
$content = $content.Replace($needle, $replacement)
[IO.File]::WriteAllText($path, $content, [Text.UTF8Encoding]::new($false))
