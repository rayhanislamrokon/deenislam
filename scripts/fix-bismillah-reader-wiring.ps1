$target = Join-Path $PSScriptRoot '..\src\screens\SurahReaderScreen.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = $source.Replace("import { ayahTranslation, ayahTransliteration, getSurah", "import { ayahArabicText, ayahTranslation, ayahTransliteration, getSurah")
$source = $source.Replace("function VerseCard({verse,fontSize,showDetails,active,language,onRecite,onPronounce,onMeaning}:", "function VerseCard({verse,fontSize,showDetails,active,language,onRecite,onPronounce,onMeaning,surahNumber}:")
Set-Content -LiteralPath $target -Value $source -Encoding utf8
