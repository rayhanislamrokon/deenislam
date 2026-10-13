$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$quranPath=Join-Path $projectRoot 'src\screens\QuranScreen.tsx'
$booksPath=Join-Path $projectRoot 'src\screens\BooksScreen.tsx'
$tafsirPath=Join-Path $projectRoot 'src\screens\TafsirScreen.tsx'

$quran=[IO.File]::ReadAllText($quranPath)
$quran=$quran.Replace("import {", "import { toggleBookmarkItem } from '../services/bookmarks';`nimport {",1)
$old="const toggleBookmark=(number:number)=>setBookmarks(current=>current.includes(number)?current.filter(item=>item!==number):[...current,number]);const toggleJuzBookmark=(number:number)=>setJuzBookmarks(current=>current.includes(number)?current.filter(item=>item!==number):[...current,number]);"
$new="const toggleBookmark=(number:number)=>setBookmarks(current=>{const exists=current.includes(number),row=localizedSurahs.find(item=>Number(item[0])===number);void toggleBookmarkItem({id:`quran-surah-${number}`,section:'quran',title:row?.[2]||`Surah ${number}`,subtitle:`Surah ${number} · ${row?.[3]||'Quran'}`,language,target:{type:'surah',value:String(number)}});return exists?current.filter(item=>item!==number):[...current,number]});const toggleJuzBookmark=(number:number)=>setJuzBookmarks(current=>{void toggleBookmarkItem({id:`quran-juz-${number}`,section:'quran',title:`Juz ${number}`,subtitle:'Quran Juz',language,target:{type:'juz',value:String(number)}});return current.includes(number)?current.filter(item=>item!==number):[...current,number]});"
if(-not $quran.Contains($old)){throw 'Quran bookmark functions not found.'};$quran=$quran.Replace($old,$new)
[IO.File]::WriteAllText($quranPath,$quran)

$books=[IO.File]::ReadAllText($booksPath)
$books=$books.Replace("import {", "import { listBookmarks, toggleBookmarkItem } from '../services/bookmarks';`nimport {",1)
$anchor="const availableBooks=remoteBooks??[];"
$insert="useEffect(()=>{void listBookmarks().then(rows=>setSaved(rows.filter(row=>row.target?.type==='book').map(row=>row.target!.value)))},[]);const toggleBookBookmark=(x:Book)=>{void toggleBookmarkItem({id:`book-${x.slug||x.id}`,section:x.category==='Sahaba'?'sahaba':x.category==='Islamic History'?'islamic-history':'books',title:x.title,subtitle:x.author,language,target:{type:'book',value:x.slug||x.id}});setSaved(values=>values.includes(x.slug||x.id)?values.filter(id=>id!==(x.slug||x.id)):[...values,x.slug||x.id])};const availableBooks=remoteBooks??[];"
if(-not $books.Contains($anchor)){throw 'Books bookmark anchor not found.'};$books=$books.Replace($anchor,$insert)
$books=$books.Replace("setSaved(v=>v.includes(x.id)?v.filter(i=>i!==x.id):[...v,x.id])","toggleBookBookmark(x)")
$books=$books.Replace("saved.includes(x.id)?'▣':'▯'","saved.includes(x.slug||x.id)?'▣':'▯'")
[IO.File]::WriteAllText($booksPath,$books)

$tafsir=[IO.File]::ReadAllText($tafsirPath)
$tafsir=$tafsir.Replace("import {", "import { toggleBookmarkItem } from '../services/bookmarks';`nimport {",1)
$old="const toggleBookmark=async()=>{const next=!bookmarked;setBookmarked(next);await SecureStore.setItemAsync(`bookmark-tafsir-${surahNumber}-${ayahNumber}`,next?'1':'0')};"
$new="const toggleBookmark=async()=>{const next=!bookmarked;setBookmarked(next);await SecureStore.setItemAsync(`bookmark-tafsir-${surahNumber}-${ayahNumber}`,next?'1':'0');await toggleBookmarkItem({id:`tafsir-${surahNumber}-${ayahNumber}`,section:'tafsir',title:`${surahName} · Ayah ${ayahNumber}`,subtitle:sources[source]?.name||'Tafsir explanation',language,target:{type:'tafsir',value:String(surahNumber),extra:String(ayahNumber)}})};"
if(-not $tafsir.Contains($old)){throw 'Tafsir bookmark function not found.'};$tafsir=$tafsir.Replace($old,$new)
[IO.File]::WriteAllText($tafsirPath,$tafsir)
