$path = Join-Path $PSScriptRoot '..\admin-panel\app\prophets\page.tsx'
$content = [IO.File]::ReadAllText((Resolve-Path $path), [Text.Encoding]::UTF8)
$content = $content.Replace('{message&&<aside className="message">{message}</aside>}', '{message&&<div className="message">{message}</div>}')
[IO.File]::WriteAllText((Resolve-Path $path), $content, [Text.UTF8Encoding]::new($false))
