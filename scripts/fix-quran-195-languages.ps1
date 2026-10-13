$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$path = Join-Path $projectRoot 'admin-panel\app\quran\page.tsx'
$source = [IO.File]::ReadAllText($path)

if ($source -notmatch 'ADMIN_LANGUAGES') {
  $source = $source.Replace('"use client";', '"use client";' + [Environment]::NewLine + 'import{ADMIN_LANGUAGES}from"../components/AdminLanguagePicker";')
}

$source = $source.Replace('[languages,setLanguages]=useState<Language[]>([{code:"en",label:"English"},{code:"bn",label:"Bengali"},{code:"ar",label:"Arabic"}])', '[languages,setLanguages]=useState<Language[]>(ADMIN_LANGUAGES)')
$source = $source.Replace('fetch(API+"/api/translate/languages").then(r=>r.json()).then(j=>Array.isArray(j.data)&&setLanguages(j.data)).catch(()=>undefined)', 'fetch(API+"/api/translate/languages").then(r=>r.json()).then(j=>{if(!Array.isArray(j.data))return;const remote=new Map(j.data.map((item:Language)=>[item.code,item]));setLanguages(ADMIN_LANGUAGES.map(item=>({...item,...(remote.get(item.code)||{})}))) }).catch(()=>undefined)')

[IO.File]::WriteAllText($path,$source,[Text.UTF8Encoding]::new($false))
