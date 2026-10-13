$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
function Edit([string]$relative,[scriptblock]$change){$path=Join-Path $root $relative;$text=[IO.File]::ReadAllText($path);$text=& $change $text;[IO.File]::WriteAllText($path,$text,[Text.UTF8Encoding]::new($false))}
Edit 'server\src\dua-admin.js' {
 param($t)
 $t=$t.Replace('name:clean(b.name,500),arabic:clean(b.arabic)','name:clean(b.name,500),description:clean(b.description,1200),arabic:clean(b.arabic)')
 $t=$t.Replace('name:t?.name||row.name,arabic:row.arabic','name:t?.name||row.name,description:t?.description||row.description||"",arabic:row.arabic')
 return $t
}
Edit 'admin-panel\app\duas\page.tsx' {
 param($t)
 $t=$t.Replace('name:"",arabic:""','name:"",description:"",arabic:""')
 $t=$t.Replace('name:x.label,arabic:x.arabic','name:x.label,description:x.meaning||"",arabic:x.arabic')
 $needle='<label>Dua name<input required value={form.name} onChange={e=>set("name",e.target.value)}/></label><label>Category<input value={form.category} onChange={e=>set("category",e.target.value)}/></label>'
 $replacement=$needle+'<label className="wide">Short description<textarea value={form.description||""} onChange={e=>set("description",e.target.value)} placeholder="Write a short summary of when and why this Dua is read..."/></label>'
 $t=$t.Replace($needle,$replacement)
 $t=$t.Replace('${x.name} ${x.meaning} ${x.pronunciation} ${x.source}','${x.name} ${x.description||""} ${x.meaning} ${x.pronunciation} ${x.source}')
 $t=$t.Replace('<div><b>{x.name}</b><small>{x.pronunciation}</small>','<div><b>{x.name}</b>{x.description&&<em className="duaDescription">{x.description}</em>}<small>{x.pronunciation}</small>')
 $t=$t.Replace('.library article small{margin-top:3px;color:#087a4d}', '.duaDescription{display:block;margin-top:4px;color:#6b7d73;font-size:10px;font-style:normal}.library article small{margin-top:3px;color:#087a4d}')
 return $t
}
