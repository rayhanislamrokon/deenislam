$target = Join-Path $PSScriptRoot '..\src\screens\QuranScreen.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = [regex]::Replace($source, '<View style=\{styles\.tabs\}><Tab icon="book"[\s\S]*?</View>\r?\n <View style=\{styles\.sectionHead\}>', '<View style={styles.tabs}><Tab icon="book" label={t.surah} active={activeTab==="Surah"} onPress={()=>setActiveTab("Surah")}/><Tab icon="layers" label={t.juz} active={activeTab==="Juz"} onPress={()=>setActiveTab("Juz")}/></View>' + "`r`n <View style={styles.sectionHead}>", 1)
Set-Content -LiteralPath $target -Value $source -Encoding utf8
