$path = Join-Path $PSScriptRoot '..\admin-panel\app\islamic-lifestyle\page.tsx'
$content = [IO.File]::ReadAllText((Resolve-Path $path), [Text.Encoding]::UTF8)
$content = $content.Replace('`n', [Environment]::NewLine)
[IO.File]::WriteAllText((Resolve-Path $path), $content, [Text.UTF8Encoding]::new($false))
