$approval = Join-Path $PSScriptRoot '..\server\src\deletion-approval.js'
$approvalText = [IO.File]::ReadAllText($approval)
$oldGuard = "const canApprove=value=>value&&['super_admin','admin'].includes(value.adminRole);"
$newGuard = "const canApprove=value=>value&&(value.adminRole==='super_admin'||value.permissions?.includes('*')||value.permissions?.includes('deletions.review'));"
if (-not $approvalText.Contains($oldGuard)) { throw 'Approval guard marker not found' }
$approvalText = $approvalText.Replace($oldGuard, $newGuard)
[IO.File]::WriteAllText($approval, $approvalText, [Text.UTF8Encoding]::new($false))

$backend = Join-Path $PSScriptRoot '..\server\src\admin-panel\index.js'
$backendText = [IO.File]::ReadAllText($backend)
$oldList = "'content.delete','admins.manage']"
$newList = "'content.delete','admins.manage','deletions.review']"
if (-not $backendText.Contains($oldList)) { throw 'Permission list marker not found' }
$backendText = $backendText.Replace($oldList, $newList)
[IO.File]::WriteAllText($backend, $backendText, [Text.UTF8Encoding]::new($false))

$ui = Join-Path $PSScriptRoot '..\admin-panel\app\team\page.tsx'
$uiText = [IO.File]::ReadAllText($ui)
$oldOption = '["admins.manage","Manage admin team"]]'
$newOption = '["admins.manage","Manage admin team"],["deletions.review","Review deletion requests"]]'
if (-not $uiText.Contains($oldOption)) { throw 'Team permission option marker not found' }
$uiText = $uiText.Replace($oldOption, $newOption)
$uiText = $uiText.Replace('setTeam(j.data||[])', 'setTeam(j.data?.items||j.data||[])')
[IO.File]::WriteAllText($ui, $uiText, [Text.UTF8Encoding]::new($false))
