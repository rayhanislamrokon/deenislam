$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$path=Join-Path $root 'admin-panel\app\page.tsx'
$source=[IO.File]::ReadAllText($path)
$source=$source.Replace('{(view==="books"||view==="amol")&&<section className="booksWorkspace">','{view==="books"&&<section className="booksWorkspace">')
$marker='{view==="duas"&&<section style={{height:"calc(100vh - 125px)",overflow:"hidden",borderRadius:18,background:"#fff",boxShadow:"0 8px 28px rgba(20,60,43,.08)"}}><iframe title="Duas Content Manager" src="/duas" style={{width:"100%",height:"100%",border:0}}/></section>}'
$amol=$marker+'{view==="amol"&&<section style={{height:"calc(100vh - 125px)",overflow:"hidden",borderRadius:18,background:"#fff",boxShadow:"0 8px 28px rgba(20,60,43,.08)"}}><iframe title="Amol Content Manager" src="/amol" style={{width:"100%",height:"100%",border:0}}/></section>}'
if($source -notmatch 'src="/amol"'){$source=$source.Replace($marker,$amol)}
[IO.File]::WriteAllText($path,$source,[Text.UTF8Encoding]::new($false))
