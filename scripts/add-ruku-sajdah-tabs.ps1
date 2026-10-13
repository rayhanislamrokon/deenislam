$target = Join-Path $PSScriptRoot '..\src\screens\QuranScreen.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = $source.Replace("useState<'Surah'|'Juz'|'Bookmarks'|'Downloads'>('Surah')", "useState<'Surah'|'Juz'|'Ruku'|'Sajdah'|'Bookmarks'|'Downloads'>('Surah')")
$oldDisplay = "let items=activeTab==='Bookmarks'?localizedSurahs.filter(item=>bookmarks.includes(Number(item[0]))):activeTab==='Downloads'?localizedSurahs.filter(item=>downloads.includes(Number(item[0]))):activeTab==='Juz'?juzBoundaries:localizedSurahs;"
$newDisplay = "const sajdahSurahs=[7,13,16,17,19,22,25,27,32,38,41,53,84,96];let items=activeTab==='Bookmarks'?localizedSurahs.filter(item=>bookmarks.includes(Number(item[0]))):activeTab==='Downloads'?localizedSurahs.filter(item=>downloads.includes(Number(item[0]))):activeTab==='Juz'?juzBoundaries:activeTab==='Sajdah'?localizedSurahs.filter(item=>sajdahSurahs.includes(Number(item[0]))):localizedSurahs;"
$source = $source.Replace($oldDisplay, $newDisplay)
$oldTabs = '<View style={styles.tabs}><Tab icon="book" label={t.surah} active={activeTab==="Surah"} onPress={()=>setActiveTab("Surah")}/><Tab icon="layers" label={t.juz} active={activeTab==="Juz"} onPress={()=>setActiveTab("Juz")}/></View>'
$newTabs = '<View style={styles.tabs}><Tab icon="book" label={t.surah} active={activeTab==="Surah"} onPress={()=>setActiveTab("Surah")}/><Tab icon="layers" label={t.juz} active={activeTab==="Juz"} onPress={()=>setActiveTab("Juz")}/><Tab icon="ruku" label="Ruku" active={activeTab==="Ruku"} onPress={()=>setActiveTab("Ruku")}/><Tab icon="sajdah" label="Sajdah" active={activeTab==="Sajdah"} onPress={()=>setActiveTab("Sajdah")}/></View>'
$source = $source.Replace($oldTabs, $newTabs)
$source = $source.Replace("activeTab==='Juz'?t.juz:activeTab==='Bookmarks'?t.bookmarks:t.downloads", "activeTab==='Juz'?t.juz:activeTab==='Ruku'?'Ruku by Surah':activeTab==='Sajdah'?'Sajdah Surahs':activeTab==='Bookmarks'?t.bookmarks:t.downloads")
$source = $source.Replace("type IconName='", "type IconName='ruku'|'sajdah'|")
$source = $source.Replace("const paths:Record<IconName,string>={", "const paths:Record<IconName,string>={ruku:'M6 9h20M9 9v8c0 5 3 8 7 8s7-3 7-8V9M12 14h8',sajdah:'M6 24h20M9 20c2-5 5-7 9-7h5M18 13l3-5 4 3',")
Set-Content -LiteralPath $target -Value $source -Encoding utf8
