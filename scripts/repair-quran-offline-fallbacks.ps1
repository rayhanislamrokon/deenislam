$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$quranPath=Join-Path $projectRoot 'src\services\quran.ts'
$text=[IO.File]::ReadAllText($quranPath)
$extra="    const complete=await readOfflineSection<QuranSurah[]>('quran',language);`n    const downloaded=complete?.find(item=>item.number===number);`n    if(downloaded) return downloaded;`n"
$first=$text.IndexOf($extra);$second=$text.IndexOf($extra,$first+$extra.Length)
if($second -lt 0){throw 'Duplicate Juz fallback was not found.'}
$text=$text.Remove($second,$extra.Length)
$changedCatch="catch { const complete=await readOfflineSection<QuranSurah[]>('quran',language);if(complete)return complete.map(({ayahs,...surah})=>surah);throw new Error('Cannot connect to the Quran server.'); }"
$last=$text.LastIndexOf($changedCatch)
if($last -lt 0){throw 'Search fallback was not found.'}
$text=$text.Remove($last,$changedCatch.Length).Insert($last,"catch { throw new Error('Cannot connect to the Quran server.'); }")
[IO.File]::WriteAllText($quranPath,$text)
