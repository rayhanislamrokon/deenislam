$target=Join-Path $PSScriptRoot 'add-admin-rbac.ps1'
$source=Get-Content -LiteralPath $target -Raw
$source=$source.Replace('},{$set:{role:''super_admin''', '},{`$set:{role:''super_admin''')
Set-Content -LiteralPath $target -Value $source -Encoding utf8
