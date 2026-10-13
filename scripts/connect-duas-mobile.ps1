$path=Join-Path $PSScriptRoot '..\src\screens\DuasCollectionScreen.tsx';$content=[IO.File]::ReadAllText($path)
$content=$content.Replace("import { useMemo, useState } from 'react';","import { useEffect, useMemo, useState } from 'react';")
$content=$content.Replace("import { DUA_DISPLAY_NAMES } from '../data/duaDisplayNames';","import { DUA_DISPLAY_NAMES } from '../data/duaDisplayNames';`r`nimport { API_URL } from '../config/api';")
$content=$content.Replace('const DUAS=DUA_PRESETS.map(item=>({','const DUAS=DUA_PRESETS.map((item,index)=>({`r`n key:`dua-${index+1}`,')
$old=@'
export function DuasCollectionScreen({onBack}:{onBack:()=>void}){
 const[query,setQuery]=useState('');
 const list=useMemo(()=>{const value=query.trim().toLowerCase();return DUAS.filter(item=>!value||`${item.name} ${item.pronunciation} ${item.meaning}`.toLowerCase().includes(value))},[query]);
'@
$new=@'
export function DuasCollectionScreen({onBack,language}:{onBack:()=>void;language:string}){
 const[query,setQuery]=useState(''),[managed,setManaged]=useState<any[]>([]);
 useEffect(()=>{let active=true;fetch(`${API_URL}/api/duas/admin-content?language=${encodeURIComponent(language)}`).then(r=>r.json()).then(j=>{if(active)setManaged(Array.isArray(j.data)?j.data:[])}).catch(()=>{if(active)setManaged([])});return()=>{active=false}},[language]);
 const all=useMemo(()=>[...managed,...DUAS.filter(local=>!managed.some(remote=>remote.key===local.key))],[managed]);
 const list=useMemo(()=>{const value=query.trim().toLowerCase();return all.filter(item=>!value||`${item.name} ${item.pronunciation} ${item.meaning}`.toLowerCase().includes(value))},[query,all]);
'@
if(-not $content.Contains($old)){throw 'Duas component target not found'};$content=$content.Replace($old,$new)
[IO.File]::WriteAllText($path,$content,[Text.UTF8Encoding]::new($false))
