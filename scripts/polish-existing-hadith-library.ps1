$target=Join-Path $PSScriptRoot '..\admin-panel\app\hadith\page.tsx';$source=Get-Content $target -Raw -Encoding utf8
$source=$source.Replace('includes(query.toLowerCase())),[items,existing,query])','includes(query.toLowerCase())).slice(0,250),[items,existing,query])')
$old=@'
<nav><button onClick={()=>edit(x,'en')}>Edit</button><button className="delete" onClick={async()=>{if(!confirm('Delete this Hadith?'))return;await fetch(API+'/api/admin/hadith/'+x.id,{method:'DELETE',headers:headers()});await load()}}>Delete</button></nav>
'@
$new=@'
<nav><button onClick={()=>edit(x,'en')}>{x.external?'Import & Edit':'Edit'}</button>{!x.external&&<button className="delete" onClick={async()=>{if(!confirm('Delete this Hadith?'))return;await fetch(API+'/api/admin/hadith/'+x.id,{method:'DELETE',headers:headers()});await load()}}>Delete</button>}</nav>
'@
$source=$source.Replace($old.Trim(),$new.Trim());Set-Content $target $source -NoNewline -Encoding utf8
