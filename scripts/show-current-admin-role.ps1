$path = Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx'
$text = [IO.File]::ReadAllText($path)
$oldState = '[email,setEmail]=useState(""),[password,setPassword]'
$newState = '[email,setEmail]=useState(""),[adminRole,setAdminRole]=useState("admin"),[password,setPassword]'
if (-not $text.Contains($oldState)) { throw 'Email state marker not found' }
$text = $text.Replace($oldState, $newState)
$oldSession = 'async function openSession(sessionToken:string){const root='
$newSession = 'async function openSession(sessionToken:string){try{const payload=JSON.parse(atob(sessionToken.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));setAdminRole(payload.adminRole||"admin")}catch{setAdminRole("admin")}const root='
if (-not $text.Contains($oldSession)) { throw 'Session handler marker not found' }
$text = $text.Replace($oldSession, $newSession)
$oldLabel = '<small>Administrator</small>'
$newLabel = '<small>{adminRole==="super_admin"?"Super Admin":adminRole==="moderator"?"Moderator":"Administrator"}</small>'
if (-not $text.Contains($oldLabel)) { throw 'Role label marker not found' }
$text = $text.Replace($oldLabel, $newLabel)
[IO.File]::WriteAllText($path, $text, [Text.UTF8Encoding]::new($false))
