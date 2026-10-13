$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$quranPath=Join-Path $projectRoot 'src\services\quran.ts'
$text=[IO.File]::ReadAllText($quranPath)
$old="if(offline) return offline;`n    throw reason"
$new="if(offline) return offline;`n    const complete=await readOfflineSection<QuranSurah[]>('quran',language);`n    const downloaded=complete?.find(item=>item.number===number);`n    if(downloaded) return downloaded;`n    throw reason"
if(-not $text.Contains($old)){throw 'Surah offline fallback anchor not found.'};$text=$text.Replace($old,$new)
$pattern="catch \{ throw new Error\('Cannot connect to the Quran server\.'\); \}"
$replacement="catch { const complete=await readOfflineSection<QuranSurah[]>('quran',language);if(complete)return complete.map(({ayahs,...surah})=>surah);throw new Error('Cannot connect to the Quran server.'); }"
$next=[regex]::Replace($text,$pattern,$replacement,1)
if($next -eq $text){throw 'Surah list fallback anchor not found.'}
[IO.File]::WriteAllText($quranPath,$next)
