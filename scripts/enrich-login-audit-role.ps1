$audit = Join-Path $PSScriptRoot '..\server\src\admin-audit.js'
$text = [IO.File]::ReadAllText($audit)
$text = $text.Replace('function createAdminAuditRouter(getLogs,jwtSecret){', 'function createAdminAuditRouter(getLogs,getAdmins,jwtSecret){')
$old = "void getLogs().insertOne({email,adminRole,action,method:req.method,path:req.originalUrl,statusCode:res.statusCode,success:res.statusCode<400,changedFields:safeKeys,ip:String(req.ip||req.socket?.remoteAddress||'').slice(0,100),userAgent:String(req.get('user-agent')||'').slice(0,300),durationMs:Date.now()-started,createdAt:new Date()}).catch(error=>console.error('Admin audit write failed:',error))"
$new = "void (async()=>{const account=login&&email?await getAdmins().findOne({email},{projection:{role:1}}):null;await getLogs().insertOne({email,adminRole:account?.role||adminRole,action,method:req.method,path:req.originalUrl,statusCode:res.statusCode,success:res.statusCode<400,changedFields:safeKeys,ip:String(req.ip||req.socket?.remoteAddress||'').slice(0,100),userAgent:String(req.get('user-agent')||'').slice(0,300),durationMs:Date.now()-started,createdAt:new Date()})})().catch(error=>console.error('Admin audit write failed:',error))"
if (-not $text.Contains($old)) { throw 'Audit insert marker not found' }
$text = $text.Replace($old, $new)
[IO.File]::WriteAllText($audit, $text, [Text.UTF8Encoding]::new($false))
$index = Join-Path $PSScriptRoot '..\server\src\index.js'
$text = [IO.File]::ReadAllText($index)
$text = $text.Replace('createAdminAuditRouter(()=>adminAuditLogs,jwtSecret)', 'createAdminAuditRouter(()=>adminAuditLogs,()=>adminUsers,jwtSecret)')
[IO.File]::WriteAllText($index, $text, [Text.UTF8Encoding]::new($false))
