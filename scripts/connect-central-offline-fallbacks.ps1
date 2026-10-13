$ErrorActionPreference='Stop'
function Replace-Text([string]$Path,[string]$Old,[string]$New){$text=[IO.File]::ReadAllText($Path);if(-not $text.Contains($Old)){throw "Expected text not found in $Path"};[IO.File]::WriteAllText($Path,$text.Replace($Old,$New))}
$projectRoot=Split-Path $PSScriptRoot -Parent
$offlinePath=Join-Path $projectRoot 'src\services\offlineDownloads.ts'
$quranPath=Join-Path $projectRoot 'src\services\quran.ts'
Replace-Text $offlinePath "try{return JSON.parse(await FileSystem.readAsStringAsync(row.fileUri)) as T}catch{return null}" "try{const parsed=JSON.parse(await FileSystem.readAsStringAsync(row.fileUri));return (parsed?.data??parsed) as T}catch{return null}"
Replace-Text $offlinePath "bytes:new TextEncoder().encode(payload).length" "bytes:payload.length"
Replace-Text $quranPath "import { readOfflineJuz, readOfflineSurah } from './offlineQuran';" "import { readOfflineJuz, readOfflineSurah } from './offlineQuran';`r`nimport { readOfflineSection } from './offlineDownloads';"
Replace-Text $quranPath "const offline=await readOfflineSurah(number,language,edition);`r`n    if(offline) return offline;" "const offline=await readOfflineSurah(number,language,edition);`r`n    if(offline) return offline;`r`n    const complete=await readOfflineSection<QuranSurah[]>('quran',language);`r`n    const downloaded=complete?.find(item=>item.number===number);`r`n    if(downloaded) return downloaded;"
$oldSurahs="catch { throw new Error('Cannot connect to the Quran server.'); }"
$newSurahs="catch { const complete=await readOfflineSection<QuranSurah[]>('quran',language);if(complete)return complete.map(({ayahs,...surah})=>surah);throw new Error('Cannot connect to the Quran server.'); }"
Replace-Text $quranPath $oldSurahs $newSurahs
