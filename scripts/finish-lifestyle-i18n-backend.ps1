$path = Join-Path $PSScriptRoot '..\server\src\lifestyle-admin.js'
$content = [IO.File]::ReadAllText((Resolve-Path $path), [Text.Encoding]::UTF8)
$content = $content.Replace("res.json({data:items.map(publicItem)})});`r`n r.post", "res.json({data:items.map(item=>publicItem(item,'en',true))})});`r`n r.post")
$content = [regex]::Replace($content, "icon:clean\(body\.icon,20\)\|\|'[^']*'", "icon:clean(body.icon,20)||'\u25C6'")
[IO.File]::WriteAllText((Resolve-Path $path), $content, [Text.UTF8Encoding]::new($false))
