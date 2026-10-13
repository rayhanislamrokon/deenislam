$path = Join-Path $PSScriptRoot '..\admin-panel\app\access-control\page.tsx'
$text = [IO.File]::ReadAllText($path)
$oldState = '[saving,setSaving]=useState(""),[message,setMessage]'
$newState = '[saving,setSaving]=useState(""),[editing,setEditing]=useState(""),[message,setMessage]'
if (-not $text.Contains($oldState)) { throw 'Access state marker not found' }
$text = $text.Replace($oldState,$newState)
$text = $text.Replace('disabled={full} checked={full||member.permissions?', 'disabled={full||editing!==member.id} checked={full||member.permissions?')
$oldRole = 'disabled={member.email==="mdrokon909000@gmail.com"} onChange={e=>{const role=e.target.value;'
$newRole = 'disabled={member.email==="mdrokon909000@gmail.com"||editing!==member.id} onChange={e=>{const role=e.target.value;'
if (-not $text.Contains($oldRole)) { throw 'Role selector marker not found' }
$text = $text.Replace($oldRole,$newRole)
$oldActions = '<div className="accountActions"><button className="deleteAccount" disabled={saving===member.id||member.email==="mdrokon909000@gmail.com"} onClick={()=>void remove(member)}>Delete</button><button disabled={saving===member.id||member.email==="mdrokon909000@gmail.com"} onClick={()=>void save(member)}>{member.email==="mdrokon909000@gmail.com"?"Protected":saving===member.id?"Saving...":"Save Access"}</button></div>'
$newActions = '<div className="accountActions">{member.email==="mdrokon909000@gmail.com"?<button className="lockedAccess" onClick={()=>alert("The primary Super Admin must always keep full access.")}>Full Access Locked</button>:<><button className="editAccess" onClick={()=>setEditing(editing===member.id?"":member.id)}>{editing===member.id?"Cancel Edit":"Edit Access"}</button><button className="deleteAccount" disabled={saving===member.id} onClick={()=>void remove(member)}>Delete</button>{editing===member.id&&<button disabled={saving===member.id} onClick={async()=>{await save(member);setEditing("")}}>{saving===member.id?"Saving...":"Save Access"}</button>}</>}</div>'
if (-not $text.Contains($oldActions)) { throw 'Account actions marker not found' }
$text = $text.Replace($oldActions,$newActions)
$text = $text.Replace('.accountActions{display:flex;gap:7px}', '.accountActions{display:flex;gap:7px;flex-wrap:wrap}.accountActions .editAccess{background:#e2f3e8;color:#087a4d}.accountActions .lockedAccess{background:#087a4d;color:#fff}')
[IO.File]::WriteAllText($path,$text,[Text.UTF8Encoding]::new($false))
