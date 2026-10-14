"use client";

import {useEffect} from "react";
import {usePathname,useRouter} from "next/navigation";
import {hasPermission,NAV_PERMISSION,tokenPermissions} from "../lib/adminPermissions";

const ROUTE_PERMISSION:Record<string,string>={"/team":"admins.manage","/access-control":"admins.manage","/deletion-requests":"deletions.review","/activity-log":"audit.view","/premium-packages":"premium_packages.manage","/billing-history":"billing.view","/book-library":"books.manage","/islamic-lifestyle":"lifestyle.manage","/prophets":"prophets.manage","/islamic-history":"islamic_history.manage","/sahaba":"sahaba.manage","/quran":"quran.manage","/tafsir":"tafsir.manage","/tafsir-books":"tafsir.manage","/hadith":"hadith.manage","/hadith-books":"hadith.manage","/duas":"duas.manage","/daily-prayer":"daily_prayer.manage","/about-content":"about.manage","/privacy-content":"privacy.manage","/notifications":"notifications.manage","/amol":"amol.manage","/ad-rewards":"rewards.view","/ad-revenue":"revenue.view"};

export default function AdminPermissionGuard(){
 const pathname=usePathname(),router=useRouter();
 useEffect(()=>{
  const apply=()=>{const token=sessionStorage.getItem("deenislam_admin_token")||"",permissions=tokenPermissions(token),buttons=[...document.querySelectorAll("aside nav button")] as HTMLButtonElement[];buttons.forEach(button=>{const label=button.textContent?.trim()||"",permission=NAV_PERMISSION[label];button.hidden=Boolean(permission&&!hasPermission(permissions,permission))});const active=buttons.find(button=>button.classList.contains("active"));if(active?.hidden)buttons.find(button=>!button.hidden)?.click();const required=Object.entries(ROUTE_PERMISSION).find(([route])=>pathname===route||pathname.startsWith(route+"/"))?.[1];if(token&&required&&!hasPermission(permissions,required))router.replace("/")};
  apply();const observer=new MutationObserver(apply);observer.observe(document.body,{childList:true,subtree:true});const timer=window.setInterval(apply,1000);return()=>{observer.disconnect();window.clearInterval(timer)};
 },[pathname,router]);
 useEffect(()=>{
  const receive=(event:MessageEvent)=>{
   if(event.origin!==window.location.origin||event.data?.type!=="deenislam-admin-back")return;
   const overview=[...document.querySelectorAll("aside nav button")].find(button=>button.textContent?.trim()==="Overview") as HTMLButtonElement|undefined;
   overview?.click();
  };
  window.addEventListener("message",receive);
  return()=>window.removeEventListener("message",receive);
 },[]);
 return null;
}
