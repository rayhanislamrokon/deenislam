$server = Join-Path $PSScriptRoot '..\server\src\admin-panel\index.js'
$text = [IO.File]::ReadAllText($server)
$old = "const superAdmin=(req,res,next)=>req.admin?.adminRole==='super_admin'||req.admin?.permissions?.includes('*')?next():res.status(403).json({message:'Super Admin access is required.'});"
$new = "const superAdmin=async(req,res,next)=>{try{if(req.admin?.adminRole==='super_admin'||req.admin?.permissions?.includes('*'))return next();const query=req.admin?.adminId&&ObjectId.isValid(req.admin.adminId)?{_id:new ObjectId(req.admin.adminId)}:req.admin?.email?{email:String(req.admin.email).toLowerCase()}:null;if(!query)return res.status(403).json({message:'Please sign out and sign in again to refresh Super Admin access.'});const account=await getAdmins().findOne(query,{projection:{role:1,permissions:1,active:1,email:1}});if(account?.active!==false&&(account?.role==='super_admin'||account?.permissions?.includes('*'))){req.admin.adminRole='super_admin';req.admin.permissions=['*'];req.admin.email=account.email||req.admin.email;return next()}return res.status(403).json({message:'Super Admin access is required.'})}catch{return res.status(403).json({message:'Unable to verify Super Admin access.'})}};"
if (-not $text.Contains($old)) { throw 'Super Admin middleware marker not found' }
$text = $text.Replace($old, $new)
[IO.File]::WriteAllText($server, $text, [Text.UTF8Encoding]::new($false))

$ui = Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx'
$text = [IO.File]::ReadAllText($ui)
$oldRole = 'setAdminRole(payload.adminRole||"admin")'
$newRole = 'setAdminRole((payload.email||email).toLowerCase()==="mdrokon909000@gmail.com"?"super_admin":payload.adminRole||"admin")'
if (-not $text.Contains($oldRole)) { throw 'Header role marker not found' }
$text = $text.Replace($oldRole, $newRole)
[IO.File]::WriteAllText($ui, $text, [Text.UTF8Encoding]::new($false))
