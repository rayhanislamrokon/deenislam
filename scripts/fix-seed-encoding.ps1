$path = Join-Path $PSScriptRoot '..\server\src\seed-lifestyle-chapters.js'
$content = Get-Content -LiteralPath $path -Raw
$content = [regex]::Replace($content, '\$\{escapeHtml\(foundation\.surah\)\}[^$]+\$\{escapeHtml\(foundation\.reference\)\}', '${escapeHtml(foundation.surah)} &mdash; ${escapeHtml(foundation.reference)}')
$content = [regex]::Replace($content, '\$\{ref\.note\?` [^$]+\$\{escapeHtml\(ref\.note\)\}`:', '${ref.note?` &mdash; ${escapeHtml(ref.note)}`:')
$content = [regex]::Replace($content, "icon:'[^']*',order", "icon:'\u{1F4D6}',order")
[IO.File]::WriteAllText((Resolve-Path $path), $content, [Text.UTF8Encoding]::new($false))
