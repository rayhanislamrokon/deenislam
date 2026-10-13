$path='scripts/functionalize-lifestyle-edit-delete.ps1'
$text=Get-Content -Raw $path
$serverIndex=$text.IndexOf("`r`n`$server='server/src/lifestyle-admin.js'")
if($serverIndex -lt 0){$serverIndex=$text.IndexOf("`n`$server='server/src/lifestyle-admin.js'")}
if($serverIndex -ge 0){$text=$text.Substring(0,$serverIndex)+"`r`n"}
$text=$text.Replace('This category and every chapter inside it will be deleted.','This category card will be deleted only when it has no chapters.')
Set-Content -Path $path -Value $text -Encoding utf8
