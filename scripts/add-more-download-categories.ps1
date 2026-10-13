$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$servicePath=Join-Path $projectRoot 'src\services\offlineDownloads.ts'
$screenPath=Join-Path $projectRoot 'src\screens\DownloadedLibraryScreen.tsx'
$service=[IO.File]::ReadAllText($servicePath)
$service=$service.Replace("'quran'|'hadith'|'duas'|'books'|'lifestyle'|'prophets'","'quran'|'tafsir'|'hadith'|'duas'|'books'|'lifestyle'|'prophets'|'sahaba'|'islamic-history'")
$old="{id:'quran',title:'Quran',subtitle:'All 114 Surahs with the selected translation'},"
$new="{id:'quran',title:'Quran',subtitle:'All 114 Surahs with the selected translation'},`n  {id:'tafsir',title:'Tafsir',subtitle:'Downloaded Tafsir and Ayah explanations'},"
if(-not $service.Contains($old)){throw 'Quran download definition not found.'};$service=$service.Replace($old,$new)
$old="{id:'prophets',title:'Prophets',subtitle:'Prophet stories and life-history parts'},"
$new="{id:'prophets',title:'Prophets',subtitle:'Prophet stories and life-history parts'},`n  {id:'sahaba',title:'Sahaba',subtitle:'Downloaded Sahaba biographies and stories'},`n  {id:'islamic-history',title:'Islamic History',subtitle:'Downloaded Islamic history content'},"
if(-not $service.Contains($old)){throw 'Prophets download definition not found.'};$service=$service.Replace($old,$new)
$service=$service.Replace("if(section==='books'){","if(section==='books'||section==='sahaba'||section==='islamic-history'){")
$service=$service.Replace("const books=await json(`${API_URL}/api/books?language=${lang}`)","const category=section==='sahaba'?'Sahaba':section==='islamic-history'?'Islamic History':'';const books=await json(`${API_URL}/api/books?language=${lang}${category?'&category='+encodeURIComponent(category):''}`)")
$service=$service.Replace("const endpoints:Record<Exclude<OfflineSection,'quran'|'books'>,string>","if(section==='tafsir')throw Error('Download a Tafsir from its reading page.');`n  const endpoints:Record<Exclude<OfflineSection,'quran'|'books'|'sahaba'|'islamic-history'|'tafsir'>,string>")
[IO.File]::WriteAllText($servicePath,$service)
$screen=[IO.File]::ReadAllText($screenPath)
$oldMap="{quran:'Quran',hadith:'Hadith',duas:'Duas',books:'Books',lifestyle:'Islamic Lifestyle',prophets:'Prophets'}"
$newMap="{quran:'Quran',tafsir:'Tafsir',hadith:'Hadith',duas:'Duas',books:'Books',lifestyle:'Islamic Lifestyle',prophets:'Prophets',sahaba:'Sahaba','islamic-history':'Islamic History'}"
if(-not $screen.Contains($oldMap)){throw 'Download section names not found.'};$screen=$screen.Replace($oldMap,$newMap)
[IO.File]::WriteAllText($screenPath,$screen)
