$ErrorActionPreference = 'Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$screenPath=Join-Path $projectRoot 'src\screens\BooksScreen.tsx'
$text=[IO.File]::ReadAllText($screenPath)
$tabs="<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>{(['All','Books','Tafsir','Hadith','Fiqh','Aqidah','Sahaba','Islamic History','History','Seerah']as Category[]).map(x=><Pressable key={x} onPress={()=>setCategory(x)} style={[s.chip,category===x&&s.chipOn]}><Text style={[s.chipText,category===x&&s.chipTextOn]}>{x}</Text></Pressable>)}</ScrollView>"
if(-not $text.Contains($tabs)){throw 'Books category tabs were not found.'}
$text=$text.Replace($tabs,'')
$oldHeader='<Text style={s.headerTitle}>All Books</Text>'
$newHeader="<Text style={s.headerTitle}>{initialCategory==='Books'?'Books':initialCategory==='All'?'All Books':initialCategory}</Text>"
if(-not $text.Contains($oldHeader)){throw 'Books screen header was not found.'}
$text=$text.Replace($oldHeader,$newHeader)
[IO.File]::WriteAllText($screenPath,$text)
