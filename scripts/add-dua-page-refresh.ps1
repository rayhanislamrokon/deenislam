$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$path=Join-Path $root 'src\screens\DuasCollectionScreen.tsx'
$source=[IO.File]::ReadAllText($path)
$source=$source.Replace("import { useEffect, useMemo, useState } from 'react';","import { useCallback,useEffect, useMemo, useState } from 'react';")
$source=$source.Replace("Dimensions, FlatList, Pressable, StyleSheet, Text, TextInput, View","ActivityIndicator, Dimensions, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View")
$old=" const[query,setQuery]=useState(''),[managed,setManaged]=useState<any[]>([]);`r`n useEffect(()=>{let active=true;fetch(`${API_URL}/api/duas/admin-content?language=${encodeURIComponent(language)}`).then(r=>r.json()).then(j=>{if(active)setManaged(Array.isArray(j.data)?j.data:[])}).catch(()=>{if(active)setManaged([])});return()=>{active=false}},[language]);"
if(-not $source.Contains($old)){$old=" const[query,setQuery]=useState(''),[managed,setManaged]=useState<any[]>([]);`n useEffect(()=>{let active=true;fetch(`${API_URL}/api/duas/admin-content?language=${encodeURIComponent(language)}`).then(r=>r.json()).then(j=>{if(active)setManaged(Array.isArray(j.data)?j.data:[])}).catch(()=>{if(active)setManaged([])});return()=>{active=false}},[language]);"}
$new=@'
 const[query,setQuery]=useState(''),[managed,setManaged]=useState<any[]>([]),[refreshing,setRefreshing]=useState(false);
 const load=useCallback(async(showRefresh=false)=>{if(showRefresh)setRefreshing(true);try{const response=await fetch(`${API_URL}/api/duas/admin-content?language=${encodeURIComponent(language)}&refresh=${Date.now()}`,{headers:{'Cache-Control':'no-cache'}}),body=await response.json();setManaged(Array.isArray(body.data)?body.data:[])}catch{}finally{if(showRefresh)setRefreshing(false)}},[language]);
 useEffect(()=>{void load()},[load]);
'@
$source=$source.Replace($old,$new.TrimEnd())
$source=$source.Replace('<View style={s.backButton}/></View>','<Pressable onPress={()=>void load(true)} accessibilityLabel="Refresh Duas" style={s.backButton}>{refreshing?<ActivityIndicator size="small" color={GREEN}/>:<Text style={s.refreshIcon}>{"\u21BB"}</Text>}</Pressable></View>')
$source=$source.Replace('<FlatList data={list}','<FlatList data={list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>void load(true)} colors={[GREEN]} tintColor={GREEN}/>}')
$source=$source.Replace("back:{fontSize:38,lineHeight:40,color:GREEN},title:","back:{fontSize:38,lineHeight:40,color:GREEN},refreshIcon:{fontSize:25,color:GREEN},title:")
[IO.File]::WriteAllText($path,$source,[Text.UTF8Encoding]::new($false))
