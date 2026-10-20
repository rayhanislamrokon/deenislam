"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {hasPermission, tokenPermissions} from "../lib/adminPermissions";

const items=[
 {label:"Overview",href:"/",permission:"dashboard.view"},
 {label:"Users",href:"/?view=users",permission:"users.view"},
 {label:"Quran Content",href:"/quran",permission:"quran.manage"},
 {label:"Tafsir Content",href:"/tafsir",permission:"tafsir.manage"},
 {label:"Hadith Content",href:"/hadith",permission:"hadith.manage"},
 {label:"Books Manager",href:"/?view=books",permission:"books.manage"},
 {label:"Duas Content",href:"/duas",permission:"duas.manage"},
 {label:"Daily Prayer",href:"/daily-prayer",permission:"daily_prayer.manage"},
 {label:"Prophets",href:"/prophets",permission:"prophets.manage"},
 {label:"Sahaba",href:"/sahaba",permission:"sahaba.manage"},
 {label:"Islamic History",href:"/islamic-history",permission:"islamic_history.manage"},
 {label:"Islamic Lifestyle",href:"/islamic-lifestyle",permission:"lifestyle.manage"},
 {label:"Push Notifications",href:"/notifications",permission:"notifications.manage"},
 {label:"Change Password",href:"/?view=security",permission:"settings.manage"},
];

export default function StandaloneAdminNav({active}:{active:string}){
 const[open,setOpen]=useState(false),[permissions,setPermissions]=useState<string[]>([]);
 useEffect(()=>setPermissions(tokenPermissions(sessionStorage.getItem("deenislam_admin_token")||"")),[]);
 const visible=items.filter(item=>item.label==="Overview"||hasPermission(permissions,item.permission));
 return <><button type="button" className="adminMenuButton" onClick={()=>setOpen(value=>!value)} aria-label="Toggle admin navigation">☰</button>{open&&<button type="button" className="adminNavBackdrop" onClick={()=>setOpen(false)} aria-label="Close navigation"/>}<aside className={`standaloneAdminNav ${open?"open":""}`}><Link className="brand" href="/"><b>DI</b><span><strong>DeenIslam</strong><small>Admin Console</small></span></Link><p>WORKSPACE</p><nav>{visible.map(item=><Link key={item.label} className={item.label===active?"active":""} href={item.href} onClick={()=>setOpen(false)}><i aria-hidden="true">{item.label.charAt(0)}</i><span>{item.label}</span></Link>)}</nav><Link className="signout" href="/">↪ Back to Dashboard</Link></aside><style jsx>{`.standaloneAdminNav{position:fixed;inset:0 auto 0 0;z-index:80;width:255px;display:flex;flex-direction:column;padding:22px 16px;background:#fff;border-right:1px solid #d9e5dd;color:#294b3d;font-family:Arial}.brand{display:flex;align-items:center;gap:11px;color:#173d2e;text-decoration:none}.brand>b{width:46px;height:46px;display:grid;place-items:center;border-radius:12px;background:#087a4d;color:#fff}.brand strong,.brand small{display:block}.brand small{margin-top:3px;font-size:10px;color:#708078}.standaloneAdminNav>p{margin:30px 10px 12px;color:#89988f;font-size:10px;font-weight:900;letter-spacing:1.4px}.standaloneAdminNav nav{display:grid;gap:4px;overflow:auto}.standaloneAdminNav nav a{display:flex;align-items:center;gap:11px;padding:11px 12px;border-radius:11px;color:#355447;text-decoration:none;font-size:13px;font-weight:700}.standaloneAdminNav nav a:hover,.standaloneAdminNav nav a.active{background:#e2f3e8;color:#087a4d}.standaloneAdminNav nav i{width:24px;height:24px;display:grid;place-items:center;border:1px solid currentColor;border-radius:7px;font-size:10px;font-style:normal}.signout{margin-top:auto;padding:12px;border:1px solid #d6e2da;border-radius:11px;color:#355447;text-align:center;text-decoration:none;font-size:12px;font-weight:700}.adminMenuButton,.adminNavBackdrop{display:none}@media(max-width:900px){.standaloneAdminNav{transform:translateX(-105%);transition:transform .22s ease}.standaloneAdminNav.open{transform:none;box-shadow:20px 0 50px rgba(0,0,0,.2)}.adminMenuButton{position:fixed;top:12px;left:12px;z-index:90;width:42px;height:42px;display:grid;place-items:center;border:0;border-radius:11px;background:#087a4d;color:#fff;font-size:21px}.adminNavBackdrop{position:fixed;inset:0;z-index:70;display:block;border:0;background:rgba(4,28,19,.45)}}`}</style></>
}
