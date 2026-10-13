"use client";
import {useMemo,useState} from "react";
import {HOME_LANGUAGES} from "../../../web/app/data/homeLanguages";

export const ADMIN_LANGUAGES=HOME_LANGUAGES.filter(item=>!["iw","jw"].includes(item.code));

type Props={value:string;onChange:(code:string)=>void;section:string;statusFor?:(code:string)=>string;completeFor?:(code:string)=>boolean;disabled?:boolean};

export default function AdminLanguagePicker({value,onChange,section,statusFor,completeFor,disabled}:Props){
 const[open,setOpen]=useState(false),[query,setQuery]=useState("");
 const current=ADMIN_LANGUAGES.find(item=>item.code===value)||ADMIN_LANGUAGES[0];
 const visible=useMemo(()=>{const q=query.trim().toLowerCase();return q?ADMIN_LANGUAGES.filter(item=>(item.label+" "+item.code).toLowerCase().includes(q)):ADMIN_LANGUAGES},[query]);
 const close=()=>{setOpen(false);setQuery("")};
 return <>
  <button type="button" disabled={disabled} onClick={()=>setOpen(true)} style={pickerStyle}><i style={badgeStyle}>{current.code.slice(0,3).toUpperCase()}</i><span style={{display:"grid",gap:3,flex:1,textAlign:"left"}}><b>{current.label}{current.code==="en"?" (Base)":""}</b><small style={{color:"#718078"}}>Choose from 195 languages</small></span><strong style={{fontSize:22,color:"#087a4d"}}>{"\u203A"}</strong></button>
  {open&&<div style={overlayStyle} role="dialog" aria-modal="true" aria-label={`Select ${section} language`} onMouseDown={event=>event.target===event.currentTarget&&close()}><section style={modalStyle}><div style={headStyle}><div><small style={eyebrowStyle}>{section.toUpperCase()} CONTENT</small><h2 style={{margin:"5px 0 2px",font:"700 29px Georgia,serif",color:"#173d2e"}}>Select Language</h2><p style={{margin:0,color:"#718078",fontSize:12}}>195 languages available</p></div><button type="button" onClick={close} style={closeStyle}>{"\u00D7"}</button></div><label style={searchStyle}><span style={{color:"#087a4d",fontSize:20}}>{"\u2315"}</span><input autoFocus value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search language or code..." style={inputStyle}/></label><div style={listStyle}>{visible.map(item=>{const active=item.code===value,complete=completeFor?completeFor(item.code):item.code==="en",status=statusFor?.(item.code)||(item.code==="en"?"Original English content - Available":"Select to manage content");return <button type="button" key={item.code} onClick={()=>{onChange(item.code);close()}} style={{...rowStyle,...(active?activeRowStyle:{})}}><i style={badgeStyle}>{item.code.slice(0,3).toUpperCase()}</i><span style={{display:"grid",gap:4,flex:1,textAlign:"left"}}><b style={{color:"#173d2e",fontSize:15}}>{item.label}{item.code==="en"?" (Base)":""}</b><small style={{color:"#7d8b84",fontSize:11,lineHeight:1.35}}>{status}</small></span>{complete?<em style={checkStyle}>{"\u2713"}</em>:<em style={emptyCheckStyle}/>}<strong style={{color:"#079052",fontSize:22}}>{"\u203A"}</strong></button>})}</div></section></div>}
 </>;
}

const pickerStyle={width:"100%",minHeight:54,marginTop:6,padding:"10px 14px",display:"flex",alignItems:"center",gap:10,border:"1px solid #cbded1",borderRadius:10,background:"#fff",color:"#173d2e",cursor:"pointer"} as const;
const badgeStyle={width:44,height:44,display:"grid",placeItems:"center",flex:"0 0 auto",borderRadius:"50%",background:"#edf3ef",color:"#65776e",fontSize:9,fontStyle:"normal",fontWeight:900} as const;
const overlayStyle={position:"fixed",inset:0,zIndex:3000,display:"grid",placeItems:"center",padding:20,background:"rgba(18,60,47,.72)",backdropFilter:"blur(5px)"} as const;
const modalStyle={position:"relative",width:"min(620px,calc(100vw - 32px))",maxHeight:"min(760px,calc(100vh - 32px))",display:"flex",flexDirection:"column",padding:26,borderRadius:24,background:"#f9fcfa",boxShadow:"0 24px 70px rgba(16,45,35,.25)"} as const;
const headStyle={width:"100%",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:20,flex:"0 0 auto",background:"transparent",padding:"0 58px 0 0"} as const;
const eyebrowStyle={color:"#a27f24",fontSize:10,fontWeight:900,letterSpacing:1.2} as const;
const closeStyle={position:"absolute",right:22,top:22,width:42,height:42,padding:0,border:0,borderRadius:"50%",background:"#e8f4eb",color:"#087a4d",fontSize:18,fontWeight:900,cursor:"pointer"} as const;
const searchStyle={height:54,display:"flex",alignItems:"center",gap:10,marginTop:16,padding:"0 15px",border:"1px solid #cbded1",borderRadius:12,background:"#fff"} as const;
const inputStyle={width:"100%",height:"100%",margin:0,padding:0,border:0,outline:"none",background:"transparent",fontSize:13,fontWeight:700} as const;
const listStyle={minHeight:0,maxHeight:470,display:"grid",gap:10,marginTop:16,paddingRight:7,overflowY:"auto",overscrollBehavior:"contain"} as const;
const rowStyle={width:"100%",display:"flex",alignItems:"center",gap:14,minHeight:66,padding:"11px 15px",border:"1px solid #d6e5da",borderRadius:15,background:"#fff",cursor:"pointer"} as const;
const activeRowStyle={borderColor:"#61ad7d",background:"#f0faf3"} as const;
const emptyCheckStyle={width:20,height:20,display:"block",borderRadius:"50%",background:"#e7f0ea"} as const;
const checkStyle={width:20,height:20,display:"grid",placeItems:"center",borderRadius:"50%",background:"#0a955b",color:"#fff",fontStyle:"normal",fontWeight:900} as const;
