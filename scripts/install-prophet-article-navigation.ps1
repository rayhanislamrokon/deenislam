$root = Join-Path $PSScriptRoot '..'
Copy-Item -LiteralPath (Join-Path $root 'src\screens\ProphetDetailScreen.article.tsx') -Destination (Join-Path $root 'src\screens\ProphetDetailScreen.tsx') -Force
