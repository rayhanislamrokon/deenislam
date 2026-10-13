$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$quranPath=Join-Path $projectRoot 'src\screens\QuranScreen.tsx'
$text=[IO.File]::ReadAllText($quranPath)
$anchor='const toggleJuzDownload='
$handler="const showJuzSurahs=async(number:number)=>{setJuzModal(number);setJuzSections([]);setJuzSectionsLoading(true);try{setJuzSections((await getJuz(number)).sections)}catch(value){Alert.alert('Unable to load Surahs',value instanceof Error?value.message:'Please try again.');setJuzModal(null)}finally{setJuzSectionsLoading(false)}};const toggleJuzDownload="
if(-not $text.Contains($anchor)){throw 'Juz download anchor not found.'}
[IO.File]::WriteAllText($quranPath,$text.Replace($anchor,$handler))
