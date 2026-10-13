$quranPath = Join-Path $PSScriptRoot '..\src\screens\QuranScreen.tsx'
$tafsirPath = Join-Path $PSScriptRoot '..\src\screens\TafsirScreen.tsx'
$prayerPath = Join-Path $PSScriptRoot '..\src\screens\PrayerScreen.tsx'

$quran = Get-Content -LiteralPath $quranPath -Raw
$quran = $quran.Replace("Alert.alert('Download complete','This Juz is available inside the app for offline reading.')", "showActionToast('This Juz is ready for offline reading.')")
$quran = $quran.Replace("Alert.alert('Download complete','Recitation, pronunciation and meaning are saved inside the app.')", "showActionToast('Recitation, pronunciation and meaning are ready offline.')")
Set-Content -LiteralPath $quranPath -Value $quran -Encoding utf8

$tafsir = Get-Content -LiteralPath $tafsirPath -Raw
if ($tafsir -notmatch "from '../services/actionFeedback'") {
  $tafsir = "import { showActionToast } from '../services/actionFeedback';`r`n" + $tafsir
}
Set-Content -LiteralPath $tafsirPath -Value $tafsir -Encoding utf8

$prayer = Get-Content -LiteralPath $prayerPath -Raw
if ($prayer -notmatch "from '../services/actionFeedback'") {
  $prayer = "import { showActionToast } from '../services/actionFeedback';`r`n" + $prayer
}
$broken = "showActionToast(,'The switch is enabled. Custom Azan alarms require a development or release APK; Expo Go cannot embed these MP3 sounds.')"
$fixed = "showActionToast('Custom Azan audio requires a development or release APK.','error')"
$prayer = $prayer.Replace($broken, $fixed)
Set-Content -LiteralPath $prayerPath -Value $prayer -Encoding utf8
