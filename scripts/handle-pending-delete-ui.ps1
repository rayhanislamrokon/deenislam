$path = Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx'
$text = [IO.File]::ReadAllText($path)
$userOld = 'if(!r.ok)throw Error(j.message);setMembers(items=>items.filter(item=>item.id!==user.id));'
$userNew = 'if(!r.ok)throw Error(j.message);if(j.data?.status==="pending"){setMessage(j.message);return}setMembers(items=>items.filter(item=>item.id!==user.id));'
if (-not $text.Contains($userOld)) { throw 'User delete response marker not found' }
$text = $text.Replace($userOld, $userNew)
$bookOld = 'if(!r.ok)throw Error(j.message);setLibrary(items=>items.filter(item=>item.slug!==book.slug));'
$bookNew = 'if(!r.ok)throw Error(j.message);if(j.data?.status==="pending"){setBookMessage(j.message);return}setLibrary(items=>items.filter(item=>item.slug!==book.slug));'
if (-not $text.Contains($bookOld)) { throw 'Book delete response marker not found' }
$text = $text.Replace($bookOld, $bookNew)
[IO.File]::WriteAllText($path, $text, [Text.UTF8Encoding]::new($false))
