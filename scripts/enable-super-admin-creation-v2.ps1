$path = Join-Path $PSScriptRoot '..\admin-panel\app\team\page.tsx'
$text = [IO.File]::ReadAllText($path)
$oldCreate = 'async function create(e:FormEvent){e.preventDefault();setSaving("new")'
$newCreate = 'async function create(e:FormEvent){e.preventDefault();if(form.role==="super_admin"&&!confirm("Create this account as Super Admin? It will receive complete access, including team roles, deletion approvals and activity logs."))return;setSaving("new")'
if (-not $text.Contains($oldCreate)) { throw 'Create handler marker not found' }
$text = $text.Replace($oldCreate, $newCreate)
$oldOptions = '<option value="admin">Admin</option><option value="moderator">Moderator</option></select>'
$newOptions = '<option value="super_admin">Super Admin</option><option value="admin">Admin</option><option value="moderator">Moderator</option></select>'
$index = $text.IndexOf($oldOptions)
if ($index -lt 0) { throw 'New member role options not found' }
$text = $text.Substring(0,$index) + $newOptions + $text.Substring($index+$oldOptions.Length)
$oldPicker = '{permissionPicker(form.permissions,(permissions)=>setForm({...form,permissions}))}</form>'
$newPicker = '{form.role==="super_admin"&&<p className="superNotice">Super Admin receives complete access automatically.</p>}{permissionPicker(form.role==="super_admin"?["*"]:form.permissions,(permissions)=>setForm({...form,permissions}),form.role==="super_admin")}</form>'
if (-not $text.Contains($oldPicker)) { throw 'Permission picker marker not found' }
$text = $text.Replace($oldPicker, $newPicker)
$text = $text.Replace('.permissionGroups{display:grid;gap:9px}', '.superNotice{margin:0 0 12px;padding:11px 13px;border-radius:9px;background:#fff6dc;color:#7d6117;font-weight:800}.permissionGroups{display:grid;gap:9px}')
[IO.File]::WriteAllText($path, $text, [Text.UTF8Encoding]::new($false))
