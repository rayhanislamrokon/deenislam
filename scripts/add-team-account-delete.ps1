$server = Join-Path $PSScriptRoot '..\server\src\admin-panel\index.js'
$text = [IO.File]::ReadAllText($server)
$marker = "r.patch('/api/admin/team/:id',admin,superAdmin,"
$start = $text.IndexOf($marker)
if ($start -lt 0) { throw 'Team update endpoint not found' }
$endMarker = "r.get('/api/admin/dashboard'"
$end = $text.IndexOf($endMarker,$start)
if ($end -lt 0) { throw 'Dashboard endpoint marker not found' }
$endpoint = @'
r.delete('/api/admin/team/:id',admin,superAdmin,async(req,res)=>{try{if(!ObjectId.isValid(req.params.id))return res.status(400).json({message:'Invalid team member ID.'});const target=await getAdmins().findOne({_id:new ObjectId(req.params.id)},{projection:{email:1,role:1}});if(!target)return res.status(404).json({message:'Team member not found.'});if(target.email==='mdrokon909000@gmail.com')return res.status(400).json({message:'The primary Super Admin cannot be deleted.'});if(req.admin?.adminId===target._id.toString()||req.admin?.email===target.email)return res.status(400).json({message:'You cannot delete your currently signed-in account.'});await getAdmins().deleteOne({_id:target._id});res.json({message:'Team member deleted successfully.',data:{id:target._id.toString(),email:target.email,role:target.role}})}catch(error){console.error('Team member deletion failed:',error);res.status(500).json({message:'Unable to delete this team member.'})}});
'@
$text = $text.Insert($end,$endpoint)
[IO.File]::WriteAllText($server,$text,[Text.UTF8Encoding]::new($false))

$ui = Join-Path $PSScriptRoot '..\admin-panel\app\access-control\page.tsx'
$text = [IO.File]::ReadAllText($ui)
$saveMarker = 'function picker(member:any)'
$deleteFn = 'async function remove(member:any){if(!confirm("Permanently delete "+member.email+" from the admin team? This account will immediately lose all admin access."))return;setSaving(member.id);setMessage("");try{const r=await fetch(API+"/api/admin/team/"+member.id,{method:"DELETE",headers:headers()}),j=await json(r);if(!r.ok)throw Error(j.message);setTeam(rows=>rows.filter(row=>row.id!==member.id));setMessage(j.message)}catch(e:any){setMessage(e.message)}finally{setSaving("")}}'
if (-not $text.Contains($saveMarker)) { throw 'Access Control function marker not found' }
$text = $text.Replace($saveMarker,$deleteFn+$saveMarker)
$oldButton = '<button disabled={saving===member.id||member.email==="mdrokon909000@gmail.com"} onClick={()=>void save(member)}>{member.email==="mdrokon909000@gmail.com"?"Protected":saving===member.id?"Saving...":"Save Access"}</button>'
$newButton = '<div className="accountActions"><button className="deleteAccount" disabled={saving===member.id||member.email==="mdrokon909000@gmail.com"} onClick={()=>void remove(member)}>Delete</button><button disabled={saving===member.id||member.email==="mdrokon909000@gmail.com"} onClick={()=>void save(member)}>{member.email==="mdrokon909000@gmail.com"?"Protected":saving===member.id?"Saving...":"Save Access"}</button></div>'
if (-not $text.Contains($oldButton)) { throw 'Access Control save button marker not found' }
$text = $text.Replace($oldButton,$newButton)
$text = $text.Replace('.permissions{display:grid;gap:9px}', '.accountActions{display:flex;gap:7px}.accountActions .deleteAccount{background:#fff0ed;color:#ad4335}.permissions{display:grid;gap:9px}')
[IO.File]::WriteAllText($ui,$text,[Text.UTF8Encoding]::new($false))
