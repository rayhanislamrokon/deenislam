$path='admin-panel/app/islamic-lifestyle/page.tsx'
$text=Get-Content -Raw $path
$old='published:x.published!==false}));setMessage('
$new='published:x.published!==false});setMessage('
if(-not $text.Contains($old)){throw 'Extra edit-handler parenthesis not found'}
$text=$text.Replace($old,$new)
Set-Content -Path $path -Value $text -Encoding utf8
