$serverPath = Join-Path $PSScriptRoot '..\server\src\index.js'
$server = Get-Content -LiteralPath $serverPath -Raw -Encoding utf8
$old = "const translation=a.translations?.[key]||a.translations?.[lang]||rs?.ayahs?.[i]?.text||a.translations?.en||a.translation||'';return{...a,translation,translations:{...(a.translations||{}),[key]:translation}}"
$new = "const translation=a.translations?.[key]||a.translations?.[lang]||rs?.ayahs?.[i]?.text||a.translations?.en||a.translation||'',transliteration=a.pronunciations?.[key]||a.pronunciations?.[lang]||a.transliteration||'';return{...a,translation,transliteration,translations:{...(a.translations||{}),[key]:translation}}"
$server = $server.Replace($old,$new)
Set-Content -LiteralPath $serverPath -Value $server -NoNewline -Encoding utf8

$screenPath = Join-Path $PSScriptRoot '..\src\screens\SurahReaderScreen.tsx'
$screen = Get-Content -LiteralPath $screenPath -Raw -Encoding utf8
$screen = $screen.Replace("Speech.speak(text,{language:kind==='pronunciation'?'en-US':language,voice:naturalVoice(kind==='pronunciation'?'en-US':language)", "Speech.speak(text,{language:language==='en'?'en-US':language,voice:naturalVoice(language==='en'?'en-US':language)")
Set-Content -LiteralPath $screenPath -Value $screen -NoNewline -Encoding utf8

$servicePath = Join-Path $PSScriptRoot '..\src\services\quran.ts'
$service = Get-Content -LiteralPath $servicePath -Raw -Encoding utf8
$service = $service.Replace('translations?:Record<string,string> };', 'translations?:Record<string,string>; pronunciations?:Record<string,string> };')
Set-Content -LiteralPath $servicePath -Value $service -NoNewline -Encoding utf8
