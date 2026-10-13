$target = Join-Path $PSScriptRoot '..\src\screens\HadithScreen.tsx'
$source = Get-Content -LiteralPath $target -Raw -Encoding utf8
$source = $source.Replace("const API_BASE='https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';", "const API_BASE='https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';`nconst DEEN_API=(process.env.EXPO_PUBLIC_API_URL??'http://10.0.2.2:4000').replace(/\/$/,'');")
$source = $source.Replace('[remoteHadiths,setRemoteHadiths]=useState<any[]>([]),[loadingHadiths', '[remoteHadiths,setRemoteHadiths]=useState<any[]>([]),[managedHadiths,setManagedHadiths]=useState<any[]>([]),[loadingHadiths')
$needle = "useEffect(()=>{AsyncStorage.getItem(BOOKMARK_KEY)"
$replacement = "useEffect(()=>{fetch(DEEN_API+'/api/hadith/admin-content?language=en').then(r=>r.json()).then(j=>Array.isArray(j.data)&&setManagedHadiths(j.data)).catch(()=>{})},[]);`n" + $needle
$source = $source.Replace($needle,$replacement)
$old = "const activeHadiths=open&&remoteHadiths.length?remoteHadiths:hs.filter(x=>x.cid===open?.id);"
$new = "const managedForOpen=managedHadiths.filter(x=>x.cid===open?.id),fallbackHadiths=open&&remoteHadiths.length?remoteHadiths:hs.filter(x=>x.cid===open?.id),activeHadiths=[...managedForOpen,...fallbackHadiths.filter(x=>!managedForOpen.some((m:any)=>String(m.no)===String(x.no)))];"
$source = $source.Replace($old,$new)
Set-Content -LiteralPath $target -Value $source -NoNewline -Encoding utf8
