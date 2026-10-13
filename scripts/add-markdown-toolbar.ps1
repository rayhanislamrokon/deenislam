$path = 'J:\REACT NATIVE APPS\DeenIslam\admin-panel\app\islamic-lifestyle\page.tsx'
$s = [IO.File]::ReadAllText($path)
$s = $s.Replace('import {FormEvent,useEffect,useState} from "react";', 'import {FormEvent,useEffect,useRef,useState} from "react";')
$stateMarker = ' const[form,setForm]=useState<Form>(empty),[items,setItems]=useState<any[]>([]),[token,setToken]=useState("")'
$stateReplacement = ' const editorRef=useRef<HTMLTextAreaElement>(null);' + "`r`n" + ' const[form,setForm]=useState<Form>(empty),[items,setItems]=useState<any[]>([]),[token,setToken]=useState("")'
if (-not $s.Contains($stateMarker)) { throw 'State marker missing.' }
$s = $s.Replace($stateMarker, $stateReplacement)
$functionMarker = ' const categories=items.filter(x=>x.kind==="category");'
$functionCode = @'
 const format=(before:string,after="",placeholder="text")=>{const editor=editorRef.current;if(!editor)return;const start=editor.selectionStart??form.content.length,end=editor.selectionEnd??start,selected=form.content.slice(start,end)||placeholder,next=form.content.slice(0,start)+before+selected+after+form.content.slice(end);setForm({...form,content:next});requestAnimationFrame(()=>{editor.focus();editor.setSelectionRange(start+before.length,start+before.length+selected.length)})};
 const lineFormat=(prefix:string,placeholder="List item")=>{const editor=editorRef.current;if(!editor)return;const start=editor.selectionStart??form.content.length,end=editor.selectionEnd??start,selected=form.content.slice(start,end)||placeholder,formatted=selected.split("\n").map((line,index)=>prefix==="1. "?`${index+1}. ${line}`:prefix+line).join("\n"),next=form.content.slice(0,start)+formatted+form.content.slice(end);setForm({...form,content:next});requestAnimationFrame(()=>{editor.focus();editor.setSelectionRange(start,start+formatted.length)})};
 const categories=items.filter(x=>x.kind==="category");
'@
$s = $s.Replace($functionMarker, $functionCode.Trim())
$textareaMarker = '<textarea required value={form.content} onChange={e=>setForm({...form,content:e.target.value})}'
$toolbar = @'
<div className="markdownToolbar" role="toolbar" aria-label="Markdown formatting"><button type="button" title="Heading 1" onClick={()=>format("# ","","Heading")}>H1</button><button type="button" title="Heading 2" onClick={()=>format("## ","","Heading")}>H2</button><i/><button type="button" title="Bold" onClick={()=>format("**","**","bold text")}><b>B</b></button><button type="button" title="Italic" onClick={()=>format("*","*","italic text")}><em>I</em></button><button type="button" title="Bullet list" onClick={()=>lineFormat("- ")}>• List</button><button type="button" title="Numbered list" onClick={()=>lineFormat("1. ")}>1. List</button><button type="button" title="Quote" onClick={()=>lineFormat("> ","Quoted text")}>❝</button><button type="button" title="Link" onClick={()=>format("[","](https://)","link title")}>🔗</button><button type="button" title="Quran reference block" onClick={()=>format("\n> **Quran ","**\n> Translation and explanation\n","51:56")}>Quran</button><button type="button" title="Divider" onClick={()=>format("\n---\n","","")}>—</button></div><textarea ref={editorRef} required value={form.content} onChange={e=>setForm({...form,content:e.target.value})}
'@
if (-not $s.Contains($textareaMarker)) { throw 'Content textarea marker missing.' }
$s = $s.Replace($textareaMarker, $toolbar.Trim())
$cssMarker = '.contentUpload small{'
$toolbarCss = '.markdownToolbar{display:flex;flex-wrap:wrap;gap:6px;padding:8px;border:1px solid #cfddd3;border-bottom:0;border-radius:11px 11px 0 0;background:#f3f8f4}.markdownToolbar button{min-width:35px;padding:7px 9px;border:1px solid #d5e3d9;border-radius:7px;background:#fff;color:#214b39;font-size:11px}.markdownToolbar button:hover{background:#e5f3e9;border-color:#9ac5a7}.markdownToolbar i{width:1px;margin:2px 2px;background:#d3dfd6}.markdownToolbar+textarea{border-radius:0 0 11px 11px}.contentUpload small{'
if (-not $s.Contains($cssMarker)) { throw 'Content CSS marker missing.' }
$s = $s.Replace($cssMarker, $toolbarCss)
[IO.File]::WriteAllText($path, $s, (New-Object Text.UTF8Encoding($false)))
