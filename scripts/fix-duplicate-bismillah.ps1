$servicePath = Join-Path $PSScriptRoot '..\src\services\quran.ts'
$readerPath = Join-Path $PSScriptRoot '..\src\screens\SurahReaderScreen.tsx'
$audioPath = Join-Path $PSScriptRoot '..\src\screens\QuranAudioPlayerScreen.tsx'

$service = Get-Content -LiteralPath $servicePath -Raw
$anchor = "export function ayahTranslation(ayah:QuranAyah,language:string){return ayah.translations?.[language]||ayah.translations?.en||ayah.translation||''}"
$addition = $anchor + "`r`nconst LEADING_BISMILLAH=/^\s*\u0628[\u064B-\u065F\u0670]*\u0633[\u064B-\u065F\u0670]*\u0645[\u064B-\u065F\u0670]*\s+\u0627[\u064B-\u065F\u0670]*\u0644[\u064B-\u065F\u0670]*\u0644[\u064B-\u065F\u0670]*\u0647[\u064B-\u065F\u0670]*\s+\u0627[\u064B-\u065F\u0670]*\u0644[\u064B-\u065F\u0670]*\u0631[\u064B-\u065F\u0670]*\u062D[\u064B-\u065F\u0670]*\u0645[\u064B-\u065F\u0670]*\u0646[\u064B-\u065F\u0670]*\s+\u0627[\u064B-\u065F\u0670]*\u0644[\u064B-\u065F\u0670]*\u0631[\u064B-\u065F\u0670]*\u062D[\u064B-\u065F\u0670]*\u064A[\u064B-\u065F\u0670]*\u0645[\u064B-\u065F\u0670]*[\s\u06DD\u06DE]*/u;`r`nexport function ayahArabicText(ayah:QuranAyah,surahNumber:number){return surahNumber!==1&&surahNumber!==9&&ayah.numberInSurah===1?ayah.text.replace(LEADING_BISMILLAH,'').trim():ayah.text}"
if ($service -notmatch 'ayahArabicText') { $service = $service.Replace($anchor, $addition) }
Set-Content -LiteralPath $servicePath -Value $service -Encoding utf8

$reader = Get-Content -LiteralPath $readerPath -Raw
$reader = $reader.Replace("import { getSurah, QuranSurah", "import { ayahArabicText, getSurah, QuranSurah")
$reader = $reader.Replace("onMeaning:()=>void})", "onMeaning:()=>void;surahNumber:number})")
$reader = $reader.Replace("{verse.text}</Text>", "{ayahArabicText(verse,surahNumber)}</Text>")
$reader = $reader.Replace("<VerseCard verse={item}", "<VerseCard surahNumber={surahNumber} verse={item}")
Set-Content -LiteralPath $readerPath -Value $reader -Encoding utf8

$audio = Get-Content -LiteralPath $audioPath -Raw
$audio = $audio.Replace("import { getSurah, QuranSurah }", "import { ayahArabicText, getSurah, QuranSurah }")
$audio = $audio.Replace("{ayah?.text}</Text>", "{ayah?ayahArabicText(ayah,activeSurah):''}</Text>")
$audio = $audio.Replace("{nextAyah?.text??uiText(language,'End of Surah')}</Text>", "{nextAyah?ayahArabicText(nextAyah,activeSurah):uiText(language,'End of Surah')}</Text>")
Set-Content -LiteralPath $audioPath -Value $audio -Encoding utf8
