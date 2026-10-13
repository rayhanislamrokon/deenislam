$path = Join-Path $PSScriptRoot '..\server\src\index.js'
$text = [IO.File]::ReadAllText($path)
$importMarker = "const{createAdminAuditRouter}=require('./admin-audit');"
if (-not $text.Contains($importMarker)) { throw 'Server import marker not found' }
$text = $text.Replace($importMarker,$importMarker+"`nconst{seedSahabaBiographies}=require('./sahaba-seed');")
$startMarker = "await books.createIndex({published:1,category:1,updatedAt:-1});"
if (-not $text.Contains($startMarker)) { throw 'Books index marker not found' }
$text = $text.Replace($startMarker,$startMarker+"await seedSahabaBiographies(books);")
[IO.File]::WriteAllText($path,$text,[Text.UTF8Encoding]::new($false))
