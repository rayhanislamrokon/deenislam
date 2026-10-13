$path = Join-Path $PSScriptRoot '..\server\src\index.js'
$content = [IO.File]::ReadAllText((Resolve-Path $path), [Text.Encoding]::UTF8)
$content = $content.Replace('`r`n', [Environment]::NewLine).Replace('`n', [Environment]::NewLine)
[IO.File]::WriteAllText((Resolve-Path $path), $content, [Text.UTF8Encoding]::new($false))
