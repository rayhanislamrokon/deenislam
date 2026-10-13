$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$quranPath=Join-Path $projectRoot 'src\screens\QuranScreen.tsx';$booksPath=Join-Path $projectRoot 'src\screens\BooksScreen.tsx'
$quran=[IO.File]::ReadAllText($quranPath)
$replacement=@'
const toggleBookmark=(number:number)=>setBookmarks(current=>{const row=localizedSurahs.find(item=>Number(item[0])===number);void toggleBookmarkItem({id:'quran-surah-'+number,section:'quran',title:row?.[2]||('Surah '+number),subtitle:'Surah '+number+' - '+(row?.[3]||'Quran'),language,target:{type:'surah',value:String(number)}});return current.includes(number)?current.filter(item=>item!==number):[...current,number]});const toggleJuzBookmark=(number:number)=>setJuzBookmarks(current=>{void toggleBookmarkItem({id:'quran-juz-'+number,section:'quran',title:'Juz '+number,subtitle:'Quran Juz',language,target:{type:'juz',value:String(number)}});return current.includes(number)?current.filter(item=>item!==number):[...current,number]});const toggleJuzDownload
'@
$next=[regex]::Replace($quran,'const toggleBookmark=.*?const toggleJuzDownload',$replacement.Trim(),[System.Text.RegularExpressions.RegexOptions]::Singleline)
if($next -eq $quran){throw 'Malformed Quran bookmarks block not found.'};[IO.File]::WriteAllText($quranPath,$next)
$books=[IO.File]::ReadAllText($booksPath)
$replacement=@'
const toggleBookBookmark=(x:Book)=>{const value=x.slug||x.id;void toggleBookmarkItem({id:'book-'+value,section:x.category==='Sahaba'?'sahaba':x.category==='Islamic History'?'islamic-history':'books',title:x.title,subtitle:x.author,language,target:{type:'book',value}});setSaved(values=>values.includes(value)?values.filter(id=>id!==value):[...values,value])};const availableBooks
'@
$next=[regex]::Replace($books,'const toggleBookBookmark=.*?const availableBooks',$replacement.Trim(),[System.Text.RegularExpressions.RegexOptions]::Singleline)
if($next -eq $books){throw 'Malformed Books bookmark block not found.'};[IO.File]::WriteAllText($booksPath,$next)
