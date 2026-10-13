$path = Join-Path $PSScriptRoot '..\server\src\seed-lifestyle-chapters.js'
$content = Get-Content -LiteralPath $path -Raw
$old = " const start=source.indexOf(open,startAt);"
$new = " const assignment=source.indexOf('=',startAt);`r`n if(assignment<0)throw Error('Missing assignment for '+marker);`r`n const start=source.indexOf(open,assignment);"
if (-not $content.Contains($old)) { throw 'Expected seed parser line was not found.' }
[IO.File]::WriteAllText((Resolve-Path $path), $content.Replace($old,$new), [Text.UTF8Encoding]::new($false))
