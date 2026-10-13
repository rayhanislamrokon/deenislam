$path = Join-Path $PSScriptRoot '..\admin-panel\app\access-control\page.tsx'
$text = [IO.File]::ReadAllText($path)
$oldState = '[editing,setEditing]=useState(""),[message,setMessage]'
$newState = '[editing,setEditing]=useState(""),[query,setQuery]=useState(""),[roleFilter,setRoleFilter]=useState(""),[message,setMessage]'
if (-not $text.Contains($oldState)) { throw 'Access state marker not found' }
$text = $text.Replace($oldState,$newState)
$oldToolbar = '<section className="toolbar"><div><b>Team accounts</b><span>Control roles, permissions and account status</span></div><button onClick={()=>void load()}>Refresh list</button></section>'
$newToolbar = '<section className="toolbar"><div className="toolbarTitle"><b>Team accounts</b><span>Control roles, permissions and account status</span></div><label className="teamSearch">Search team<input placeholder="Email address..." value={query} onChange={e=>setQuery(e.target.value)}/></label><label className="roleFilter">Role<select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}><option value="">All roles</option><option value="super_admin">Super Admin</option><option value="admin">Admin</option><option value="moderator">Moderator</option></select></label><button onClick={()=>void load()}>Refresh</button></section>'
if (-not $text.Contains($oldToolbar)) { throw 'Toolbar marker not found' }
$text = $text.Replace($oldToolbar,$newToolbar)
$oldMap = 'team.map(member=><article key={member.id} className={member.role==="super_admin"?"super":""}>'
$newMap = 'team.filter(member=>(!roleFilter||member.role===roleFilter)&&member.email.toLowerCase().includes(query.toLowerCase())).map(member=><article key={member.id} className={`${member.role==="super_admin"?"super":""} ${editing===member.id?"editing":""}`.trim()}>'
if (-not $text.Contains($oldMap)) { throw 'Team map marker not found' }
$text = $text.Replace($oldMap,$newMap)
$oldPicker = '}</div>{picker(member)}</article>)'
$newPicker = '}</div>{editing===member.id&&picker(member)}</article>)'
if (-not $text.Contains($oldPicker)) { throw 'Permission display marker not found' }
$text = $text.Replace($oldPicker,$newPicker)
$text = $text.Replace('.toolbar{display:flex;align-items:center;justify-content:space-between;', '.toolbar{display:grid;grid-template-columns:minmax(190px,1fr) minmax(220px,320px) 180px auto;align-items:end;')
$text = $text.Replace('.toolbar b,.toolbar span{display:block}', '.toolbar b,.toolbar span{display:block}.teamSearch,.roleFilter{font-size:11px;font-weight:800}.teamSearch input,.roleFilter select{width:100%;margin-top:6px;padding:10px;border:1px solid #cbded1;border-radius:9px;background:#fff}')
$text = $text.Replace('grid-template-columns:repeat(2,minmax(0,1fr));gap:16px', 'grid-template-columns:repeat(3,minmax(0,1fr));gap:14px')
$text = $text.Replace('.members article.super{', '.members article.editing{grid-column:span 2}.members article.super{')
$text = $text.Replace('.roleRow{margin:18px 0;padding:14px;', '.roleRow{margin:16px 0 0;padding:12px;')
$text = $text.Replace('@media(max-width:1050px){.members{grid-template-columns:1fr}}', '@media(max-width:1350px){.members{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:950px){.members{grid-template-columns:1fr}.members article.editing{grid-column:auto}.toolbar{grid-template-columns:1fr 1fr}.toolbarTitle{grid-column:1/-1}}')
$text = $text.Replace('@media(max-width:700px){main{padding:14px}', '@media(max-width:700px){main{padding:14px}.toolbar{grid-template-columns:1fr}')
[IO.File]::WriteAllText($path,$text,[Text.UTF8Encoding]::new($false))
