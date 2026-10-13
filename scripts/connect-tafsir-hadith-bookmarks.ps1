$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$tafsirPath=Join-Path $projectRoot 'src\screens\TafsirScreen.tsx';$hadithPath=Join-Path $projectRoot 'src\screens\HadithScreen.tsx'
$tafsir=[IO.File]::ReadAllText($tafsirPath)
if(-not $tafsir.Contains("from '../services/bookmarks'")){$tafsir="import { toggleBookmarkItem } from '../services/bookmarks';`n"+$tafsir}
$replacement=@'
const toggleBookmark=async()=>{const next=!bookmarked;setBookmarked(next);await SecureStore.setItemAsync(`bookmark-tafsir-${surahNumber}-${ayahNumber}`,next?'1':'0');await toggleBookmarkItem({id:'tafsir-'+surahNumber+'-'+ayahNumber,section:'tafsir',title:surahName+' - Ayah '+ayahNumber,subtitle:sources[source]?.name||'Tafsir explanation',language,target:{type:'tafsir',value:String(surahNumber),extra:String(ayahNumber)}})};
'@
$next=[regex]::Replace($tafsir,'const toggleBookmark=async\(\)=>\{.*?\};',$replacement.Trim(),[System.Text.RegularExpressions.RegexOptions]::Singleline)
if($next -eq $tafsir){throw 'Tafsir bookmark function not found.'};[IO.File]::WriteAllText($tafsirPath,$next)
$hadith=[IO.File]::ReadAllText($hadithPath)
if(-not $hadith.Contains("from '../services/bookmarks'")){$hadith="import { listBookmarks, removeBookmark, saveBookmark } from '../services/bookmarks';`n"+$hadith}
$anchor="useEffect(()=>{if(savedReady)void AsyncStorage.setItem(BOOKMARK_KEY,JSON.stringify(saved))},[saved,savedReady]);"
$sync=@'
useEffect(()=>{if(savedReady)void AsyncStorage.setItem(BOOKMARK_KEY,JSON.stringify(saved))},[saved,savedReady]);useEffect(()=>{if(!savedReady)return;const all=[...managedHadiths,...hs.filter(item=>!managedHadiths.some((managed:any)=>managed.id===item.id))];void listBookmarks().then(async rows=>{await Promise.all(rows.filter(row=>row.section==='hadith'&&!saved.includes(row.target?.value||'')).map(row=>removeBookmark(row.id)));await Promise.all(saved.map(id=>{const item=all.find((row:any)=>row.id===id);return saveBookmark({id:'hadith-'+id,section:'hadith',title:item?.title||('Hadith '+(item?.no||id)),subtitle:item?.by||item?.reference||'Saved Hadith',language,target:{type:'content',value:id}})}))})},[saved,savedReady,managedHadiths,language]);
'@
if(-not $hadith.Contains($anchor)){throw 'Hadith saved effect not found.'};$hadith=$hadith.Replace($anchor,$sync.Trim());[IO.File]::WriteAllText($hadithPath,$hadith)
