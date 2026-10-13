$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$pagePath = Join-Path $projectRoot 'admin-panel\app\sahaba\page.tsx'
$source = [IO.File]::ReadAllText($pagePath)

if ($source -notmatch 'homeLanguages') {
  $source = $source.Replace('import BookPageBuilder from"../books/BookPageBuilder";', 'import BookPageBuilder from"../books/BookPageBuilder";' + [Environment]::NewLine + 'import{HOME_LANGUAGES}from"../../../app/src/data/homeLanguages";')
}

$source = $source.Replace('[languages,setLanguages]=useState<any[]>([{code:"en",label:"English"},{code:"bn",label:"Bengali"},{code:"ar",label:"Arabic"}])', '[languages,setLanguages]=useState<any[]>(HOME_LANGUAGES)')

$oldEffect = 'useEffect(()=>{setTokenValue(sessionStorage.getItem("deenislam_admin_token")||"");void load()},[]);'
$newEffect = 'useEffect(()=>{setTokenValue(sessionStorage.getItem("deenislam_admin_token")||"");void load();fetch(API+"/api/translate/languages").then(r=>r.json()).then(j=>{if(!Array.isArray(j.data))return;const merged=new Map(HOME_LANGUAGES.map(item=>[item.code,item]));j.data.forEach((item:any)=>item?.code&&merged.set(item.code,{...merged.get(item.code),...item}));setLanguages(Array.from(merged.values()).sort((a:any,b:any)=>a.label.localeCompare(b.label))) }).catch(()=>undefined)},[]);'
$source = $source.Replace($oldEffect, $newEffect)

[IO.File]::WriteAllText($pagePath, $source, [Text.UTF8Encoding]::new($false))
