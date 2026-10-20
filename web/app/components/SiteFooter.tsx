"use client";

import React, { useState } from "react";
import { BookOpen, Boxes, CircleHelp, FileText, GraduationCap, Home, Landmark, LibraryBig, Mail, MapPin, MessageCircle, Phone, Settings, ShieldCheck, Sparkles, Users } from "lucide-react";

interface SiteFooterProps { navigate: (feature: string) => void; act: (text: string) => void }
const quick = [[Home,"Home","Home"],[BookOpen,"Quran","Quran"],[Landmark,"Prayer Times","Prayer Times"],[LibraryBig,"Hadith","Hadith"],[Sparkles,"Islamic AI","Islamic AI"],[Boxes,"Books","Islamic Books"]] as const;
const company = [[Users,"About Us"],[Settings,"Features"],[FileText,"Blogs"],[GraduationCap,"Scholars"],[Users,"Community"]] as const;
const support = [[CircleHelp,"Help Center","Help Center"],[Mail,"Contact","Contact"],[ShieldCheck,"Privacy Policy","Privacy Policy"],[FileText,"Terms & Conditions","Terms & Conditions"]] as const;

export function SiteFooter({ navigate, act }: SiteFooterProps) {
  const [email,setEmail]=useState("");
  const subscribe=(event:React.FormEvent)=>{event.preventDefault();if(!/^\S+@\S+\.\S+$/.test(email.trim()))return act("Please enter a valid email address");act("Thank you for subscribing to the Deen Islam newsletter!");setEmail("")};
  return <footer className='site-footer footer-live' role='contentinfo'>
    <img className='site-footer-original' src='/images/deen-islam-footer-background.png?v=blank-clear' alt='' draggable={false}/>
    <div className='footer-live-content'>
      <section className='footer-about'>
        <button className='footer-brand' onClick={()=>navigate("Home")}><img src='/images/sidebar-logo-reference.png' alt=''/><strong>Deen Islam</strong></button>
        <p><strong>Deen Islam</strong> is a complete Islamic lifestyle app designed to help Muslims stay connected with Islam in their everyday lives. The app brings essential Islamic knowledge, worship tools, and daily guidance together in one simple, clean, modern, and user-friendly platform.</p>
        <p>Users can read and listen to the <strong>Holy Quran</strong>, explore <strong>Hadith, Tafsir, Fiqh, Aqidah, Seerah, Islamic history, and Islamic books</strong>, check accurate daily prayer times, find the <strong>Qibla direction</strong>, use a digital <strong>Tasbih</strong>, and follow daily Islamic tasks and activities to build better habits.</p>
        <p>Deen Islam also provides <strong>Daily Ayah, Hadith of the Day, prayer reminders, Hijri date information, Ramadan Sehri and Iftar times, Islamic events, and useful reminders</strong> for daily life.</p>
        <p>With easy navigation and a beautiful modern design, Deen Islam makes Islamic learning and daily practice easier. It aims to become a trusted digital companion for Muslims who want to increase their knowledge, improve their worship, build good Islamic habits, and stay connected with their faith anytime and anywhere.</p>
        <nav className='footer-socials'><a href='https://facebook.com' target='_blank' rel='noreferrer'>f</a><a href='https://instagram.com' target='_blank' rel='noreferrer'>◎</a><a href='https://youtube.com' target='_blank' rel='noreferrer'>▶</a><a href='https://x.com' target='_blank' rel='noreferrer'>𝕏</a><a href='https://whatsapp.com' target='_blank' rel='noreferrer'><MessageCircle/></a></nav>
      </section>
      <FooterColumn title='Quick Links'>{quick.map(([Icon,label,target])=><button key={label} onClick={()=>navigate(target)}><i><Icon/></i>{label}</button>)}</FooterColumn>
      <FooterColumn title='Company'>{company.map(([Icon,label])=><button key={label} onClick={()=>label==="About Us"?navigate("About Us"):label==="Community"?navigate("Community"):act(`${label} opened`)}><i><Icon/></i>{label}</button>)}</FooterColumn>
      <FooterColumn title='Support'>{support.map(([Icon,label,target])=><button key={label} onClick={()=>navigate(target)}><i><Icon/></i>{label}</button>)}</FooterColumn>
      <section className='footer-contact'><h2>Contact Us</h2><a href='mailto:info@deenislam.com'><Mail/><span>info@deenislam.com</span></a><a href='tel:+15551234567'><Phone/><span>+1 (555) 123-4567</span></a><button onClick={()=>act("Location: New York, NY, USA")}><MapPin/><span>New York, NY, USA</span></button><h2>Newsletter</h2><p>Get the latest Islamic content, updates and resources straight to your inbox.</p><form onSubmit={subscribe}><input type='email' value={email} onChange={event=>setEmail(event.target.value)} placeholder='Enter your email address'/><button type='submit'>Subscribe →</button></form></section>
    </div>
    <small className='footer-copyright'>© {new Date().getFullYear()} Deen Islam. All rights reserved.</small>
  </footer>
}

function FooterColumn({title,children}:{title:string;children:React.ReactNode}){return <section className='footer-column'><h2>{title}</h2><nav>{children}</nav></section>}
