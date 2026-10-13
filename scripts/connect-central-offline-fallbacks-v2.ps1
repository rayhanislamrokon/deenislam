$ErrorActionPreference='Stop'
function Replace-One([string]$Path,[string]$Old,[string]$New){$text=[IO.File]::ReadAllText($Path);$index=$text.IndexOf($Old);if($index -lt 0){throw "Expected text not found in $Path"};$text=$text.Remove($index,$Old.Length).Insert($index,$New);[IO.File]::WriteAllText($Path,$text)}
$projectRoot=Split-Path $PSScriptRoot -Parent
$offlinePath=Join-Path $projectRoot 'src\services\offlineDownloads.ts'
$quranPath=Join-Path $projectRoot 'src\services\quran.ts'
Replace-One $offlinePath "try{return JSON.parse(await FileSystem.readAsStringAsync(row.fileUri)) as T}catch{return null}" "try{const parsed=JSON.parse(await FileSystem.readAsStringAsync(row.fileUri));return (parsed?.data??parsed) as T}catch{return null}"
Replace-One $offlinePath "bytes:new TextEncoder().encode(payload).length" "bytes:payload.length"
Replace-One $quranPath "import { readOfflineJuz, readOfflineSurah } from './offlineQuran';" "import { readOfflineJuz, readOfflineSurah } from './offlineQuran';`r`nimport { readOfflineSection } from './offlineDownloads';"
Replace-One $quranPath "const offline=await readOfflineSurah(number,language,edition);`r`n    if(offline) return offline;" "const offline=await readOfflineSurah(number,language,edition);`r`n    if(offline) return offline;`r`n    const complete=await readOfflineSection<QuranSurah[]>('quran',language);`r`n    const downloaded=complete?.find(item=>item.number===number);`r`n    if(downloaded) return downloaded;"
Replace-One $quranPath "catch { throw new Error('Cannot connect to the Quran server.'); }" "catch { const complete=await readOfflineSection<QuranSurah[]>('quran',language);if(complete)return complete.map(({ayahs,...surah})=>surah);throw new Error('Cannot connect to the Quran server.'); }"
