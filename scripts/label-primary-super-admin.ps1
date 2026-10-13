$path = Join-Path $PSScriptRoot '..\admin-panel\app\access-control\page.tsx'
$text = [IO.File]::ReadAllText($path)
$oldHeader = '<span>{String(member.role||"admin").replace("_"," ")}</span>'
$newHeader = '<span>{member.email==="mdrokon909000@gmail.com"?"Primary Super Admin":String(member.role||"admin").replace("_"," ")}</span>'
if (-not $text.Contains($oldHeader)) { throw 'Member role label marker not found' }
$text = $text.Replace($oldHeader,$newHeader)
$oldOption = '<option value="super_admin">Super Admin</option><option value="admin">Admin</option><option value="moderator">Moderator</option></select></label><div className="roleInfo">'
$newOption = '<option value="super_admin">{member.email==="mdrokon909000@gmail.com"?"Primary Super Admin":"Super Admin"}</option><option value="admin">Admin</option><option value="moderator">Moderator</option></select></label><div className="roleInfo">'
if (-not $text.Contains($oldOption)) { throw 'Role dropdown marker not found' }
$text = $text.Replace($oldOption,$newOption)
[IO.File]::WriteAllText($path,$text,[Text.UTF8Encoding]::new($false))
