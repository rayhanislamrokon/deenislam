$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$pagePath = Join-Path $projectRoot 'admin-panel\app\sahaba\page.tsx'
$source = [IO.File]::ReadAllText($pagePath)

if ($source -notmatch 'const SAHABA_LANGUAGES') {
  $source = $source.Replace('const API=', 'const SAHABA_LANGUAGES=HOME_LANGUAGES.filter(item=>!["iw","jw"].includes(item.code));' + [Environment]::NewLine + 'const API=')
}

$source = $source.Replace('[languages,setLanguages]=useState<any[]>(HOME_LANGUAGES)', '[languages,setLanguages]=useState<any[]>(SAHABA_LANGUAGES)')
$source = $source.Replace('const merged=new Map(HOME_LANGUAGES.map(item=>[item.code,item]));j.data.forEach((item:any)=>item?.code&&merged.set(item.code,{...merged.get(item.code),...item}));setLanguages(Array.from(merged.values()).sort((a:any,b:any)=>a.label.localeCompare(b.label)))', 'const remote=new Map(j.data.map((item:any)=>[item.code,item]));setLanguages(SAHABA_LANGUAGES.map(item=>({...item,...(remote.get(item.code)||{})})).sort((a:any,b:any)=>a.label.localeCompare(b.label)))')
$source = $source.Replace('<label>Language<select', '<label>Language <small>195 available</small><select')

[IO.File]::WriteAllText($pagePath, $source, [Text.UTF8Encoding]::new($false))
