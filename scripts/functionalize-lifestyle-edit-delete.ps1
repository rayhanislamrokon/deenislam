$page='admin-panel/app/islamic-lifestyle/page.tsx'
$text=Get-Content -Raw $page
$text=$text.Replace('import {FormEvent,useEffect,useState} from "react";','import {FormEvent,useEffect,useRef,useState} from "react";')
$text=$text.Replace('export default function LifestyleContentPage(){', 'export default function LifestyleContentPage(){' + "`r`n" + ' const formRef=useRef<HTMLFormElement>(null);')
$state='const[form,setForm]=useState<Form>(empty),[items,setItems]=useState<any[]>([]),[token,setToken]=useState(""),[message,setMessage]=useState(""),[saving,setSaving]=useState(false);'
$newState='const[form,setForm]=useState<Form>(empty),[items,setItems]=useState<any[]>([]),[token,setToken]=useState(""),[message,setMessage]=useState(""),[saving,setSaving]=useState(false),[deleteTarget,setDeleteTarget]=useState<any|null>(null),[deleting,setDeleting]=useState(false);'
if(-not $text.Contains($state)){throw 'State declaration not found'}
$text=$text.Replace($state,$newState)
$editPattern=' const edit=\(x:any\)=>setForm\(\{.*?\}\);'
$editMatch=[regex]::Match($text,$editPattern)
if(-not $editMatch.Success){throw 'Edit handler not found'}
$original=$editMatch.Value.Trim().Replace('const edit=(x:any)=>setForm(','').TrimEnd(';')
$editReplacement=' const edit=(x:any)=>{setForm('+$original+');setMessage("Editing: "+x.title);requestAnimationFrame(()=>formRef.current?.scrollIntoView({behavior:"smooth",block:"start"}))};'
$text=[regex]::Replace($text,$editPattern,$editReplacement,1)
$removePattern=' const remove=async\(x:any\)=>\{.*?\};'
$removeReplacement=@'
 const confirmDelete=async()=>{const target=deleteTarget;if(!target)return;setDeleting(true);setMessage("");try{const response=await fetch(API+"/api/admin/islamic-lifestyle/"+target.id,{method:"DELETE",headers:headers()}),body=await response.json();if(!response.ok)throw Error(body.message||"Delete failed.");if(form.id===target.id)setForm(empty);setDeleteTarget(null);setMessage(target.kind==="category"?"Category and its chapters deleted successfully.":"Chapter deleted successfully.");await load()}catch(error){setMessage(error instanceof Error?error.message:"Unable to delete content.")}finally{setDeleting(false)}};
'@
$newText=[regex]::Replace($text,$removePattern,$removeReplacement,1)
if($newText -eq $text){throw 'Remove handler not found'}
$text=$newText
$text=$text.Replace('<form onSubmit={save} className="panel">','<form ref={formRef} onSubmit={save} className="panel">')
$text=$text.Replace('onClick={()=>void remove(cat)}>Delete</button>','onClick={()=>setDeleteTarget(cat)}>Delete</button>')
$text=$text.Replace('onClick={()=>void remove(ch)}>Delete</button>','onClick={()=>setDeleteTarget(ch)}>Delete</button>')
$modal='<div className="deleteModal" role="dialog" aria-modal="true"><div className="deleteDialog"><div className="deleteIcon">!</div><h3>Delete {deleteTarget.title}?</h3><p>{deleteTarget.kind==="category"?"This category card will be deleted only when it has no chapters.":"This chapter will be permanently deleted."}</p><div><button type="button" className="secondary" disabled={deleting} onClick={()=>setDeleteTarget(null)}>Cancel</button><button type="button" className="delete" disabled={deleting} onClick={()=>void confirmDelete()}>{deleting?"Deleting...":"Delete"}</button></div></div></div>'
$needle='</section></div><style jsx>'
if(-not $text.Contains($needle)){throw 'Modal insertion point not found'}
$text=$text.Replace($needle,'</section></div>{deleteTarget&&'+$modal+'}<style jsx>')
$css='.deleteModal{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;background:rgba(10,35,25,.52);backdrop-filter:blur(3px)}.deleteDialog{width:min(420px,100%);padding:25px;border-radius:22px;background:#fff;text-align:center;box-shadow:0 24px 70px rgba(0,0,0,.24)}.deleteDialog .deleteIcon{width:48px;height:48px;margin:0 auto 12px;border-radius:50%;display:grid;place-items:center;background:#fff0ed;color:#b54d3b;font-size:24px;font-weight:900}.deleteDialog h3{margin:0;color:#173d2e;font-size:20px}.deleteDialog p{margin:10px 0 20px;color:#65776e;line-height:1.55}.deleteDialog>div:last-child{display:flex;justify-content:center;gap:10px}.deleteDialog button{min-width:100px}'
$text=$text.Replace('*{box-sizing:border-box}', '*{box-sizing:border-box}'+$css)
Set-Content -Path $page -Value $text -Encoding utf8


