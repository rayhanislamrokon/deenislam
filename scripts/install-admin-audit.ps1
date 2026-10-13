$path = Join-Path $PSScriptRoot '..\server\src\index.js'
$text = [IO.File]::ReadAllText($path)
$text = $text.Replace("const{createDeletionApprovalRouter}=require('./deletion-approval');", "const{createDeletionApprovalRouter}=require('./deletion-approval');`nconst{createAdminAuditRouter}=require('./admin-audit');")
$text = $text.Replace('rewardAccounts,rewardedAdEvents,deletionRequests;', 'rewardAccounts,rewardedAdEvents,deletionRequests,adminAuditLogs;')
$text = $text.Replace("deletionRequests=db.collection('deletion_requests');", "deletionRequests=db.collection('deletion_requests');adminAuditLogs=db.collection('admin_audit_logs');")
$text = $text.Replace("await deletionRequests.createIndex({status:1,createdAt:-1});", "await deletionRequests.createIndex({status:1,createdAt:-1});await adminAuditLogs.createIndex({createdAt:-1});await adminAuditLogs.createIndex({email:1,createdAt:-1});")
$text = $text.Replace('app.use(createDeletionApprovalRouter(()=>deletionRequests,jwtSecret,port));', "app.use(createAdminAuditRouter(()=>adminAuditLogs,jwtSecret));`napp.use(createDeletionApprovalRouter(()=>deletionRequests,jwtSecret,port));")
[IO.File]::WriteAllText($path, $text, [Text.UTF8Encoding]::new($false))

$admin = Join-Path $PSScriptRoot '..\server\src\admin-panel\index.js'
$text = [IO.File]::ReadAllText($admin)
$text = $text.Replace("'admins.manage','deletions.review']", "'admins.manage','deletions.review','audit.view']")
[IO.File]::WriteAllText($admin, $text, [Text.UTF8Encoding]::new($false))

$team = Join-Path $PSScriptRoot '..\admin-panel\app\team\page.tsx'
$text = [IO.File]::ReadAllText($team)
$text = $text.Replace('["deletions.review","Review deletion requests"]]', '["deletions.review","Review deletion requests"],["audit.view","View admin activity logs"]]')
[IO.File]::WriteAllText($team, $text, [Text.UTF8Encoding]::new($false))
