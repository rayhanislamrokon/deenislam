$path = Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx'
$content = [IO.File]::ReadAllText((Resolve-Path $path), [Text.Encoding]::UTF8)
$content = $content.Replace('"books"|"lifestyle"|"security">("overview")','"books"|"lifestyle"|"prophets"|"security">("overview")')
[IO.File]::WriteAllText((Resolve-Path $path), $content, [Text.UTF8Encoding]::new($false))
