$path = Join-Path $PSScriptRoot '..\server\src\index.js'
$text = [IO.File]::ReadAllText($path)
$text = $text.Replace("const{createDuaRouter}=require('./dua-admin');", "const{createDuaRouter}=require('./dua-admin');`nconst{createDeletionApprovalRouter}=require('./deletion-approval');")
$text = $text.Replace('rewardAccounts,rewardedAdEvents;', 'rewardAccounts,rewardedAdEvents,deletionRequests;')
$text = $text.Replace("rewardedAdEvents=db.collection('rewarded_ad_events');", "rewardedAdEvents=db.collection('rewarded_ad_events');deletionRequests=db.collection('deletion_requests');")
$text = $text.Replace("await rewardedAdEvents.createIndex({ownerKey:1,createdAt:-1});", "await rewardedAdEvents.createIndex({ownerKey:1,createdAt:-1});await deletionRequests.createIndex({status:1,createdAt:-1});")
$marker = 'app.use(createAppAdminRouter('
if (-not $text.Contains($marker)) { throw 'Admin router marker not found' }
$text = $text.Replace($marker, "app.use(createDeletionApprovalRouter(()=>deletionRequests,jwtSecret,port));`n" + $marker)
[IO.File]::WriteAllText($path, $text, [Text.UTF8Encoding]::new($false))
