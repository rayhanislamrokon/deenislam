"use client";

import {FormEvent, useEffect, useRef, useState} from "react";
import {createPortal} from "react-dom";
import {usePathname, useRouter} from "next/navigation";

export default function AdminHeaderTools(){
  const pathname=usePathname(),router=useRouter(),inputRef=useRef<HTMLInputElement>(null);
  const[host,setHost]=useState<HTMLElement|null>(null),[query,setQuery]=useState(""),[message,setMessage]=useState("");

  useEffect(()=>{
    if(pathname==="/"){setHost(null);return}
    let header:HTMLElement|null=null;
    const attach=()=>{
      header=document.querySelector("main > header, .page > header, main header") as HTMLElement|null;
      if(!header)return false;
      header.classList.add("adminEnhancedHeader");
      setHost(header);
      return true;
    };
    if(attach())return()=>header?.classList.remove("adminEnhancedHeader");
    const observer=new MutationObserver(()=>{if(attach())observer.disconnect()});
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>{observer.disconnect();header?.classList.remove("adminEnhancedHeader")};
  },[pathname]);

  useEffect(()=>{
    const shortcut=(event:KeyboardEvent)=>{
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){event.preventDefault();inputRef.current?.focus();inputRef.current?.select()}
      if(event.key==="Escape"&&document.activeElement===inputRef.current){setQuery("");setMessage("");inputRef.current?.blur()}
    };
    window.addEventListener("keydown",shortcut);
    return()=>window.removeEventListener("keydown",shortcut);
  },[]);

  if(pathname==="/"||!host)return null;
  const search=(event:FormEvent)=>{event.preventDefault();const value=query.trim();if(!value){inputRef.current?.focus();return}const find=(window as Window&{find?:(text:string,caseSensitive?:boolean,backwards?:boolean,wrapAround?:boolean)=>boolean}).find;setMessage(find?.call(window,value,false,false,true)?"Match selected":"No match")};
  return createPortal(<div className="adminHeaderTools">
    <button type="button" className="adminHeaderBack" onClick={()=>router.push("/")}><span>‹</span> Back to Dashboard</button>
    <form onSubmit={search}><span>⌕</span><input ref={inputRef} value={query} onChange={event=>{setQuery(event.target.value);setMessage("")}} placeholder="Search this page..." aria-label="Search this page"/>{query&&<button type="button" className="adminHeaderClear" onClick={()=>{setQuery("");setMessage("");inputRef.current?.focus()}}>×</button>}<button type="submit" className="adminHeaderSearch">Search</button></form>
    <small className={message==="No match"?"notFound":""}>{message||"Ctrl K"}</small>
  </div>,host);
}
