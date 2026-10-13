$path='scripts/functionalize-lifestyle-edit-delete.ps1'
$text=Get-Content -Raw $path
$text=$text.Replace('$updated=[Remove)=$null' + "`r`n",'')
$text=$text.Replace('$updated=[Remove)=$null' + "`n",'')
Set-Content -Path $path -Value $text -Encoding utf8
