$page = Join-Path $PSScriptRoot '..\admin-panel\app\quran\page.tsx'
$source = Get-Content -LiteralPath $page -Raw -Encoding utf8
$source = $source.Replace('[values,setValues]=useState<Record<number,string>>({}),[pronunciation,setPronunciation]', '[values,setValues]=useState<Record<number,string>>({}),[ayahPronunciations,setAyahPronunciations]=useState<Record<number,string>>({}),[pronunciation,setPronunciation]')
$source = $source.Replace('setValues(Object.fromEntries((row.ayahs||[]).map((a:any)=>[a.numberInSurah,language==="en"?(a.translations?.en||a.translation||""):(a.translations?.[language]||"")])))', 'setValues(Object.fromEntries((row.ayahs||[]).map((a:any)=>[a.numberInSurah,language==="en"?(a.translations?.en||a.translation||""):(a.translations?.[language]||"")])));setAyahPronunciations(Object.fromEntries((row.ayahs||[]).map((a:any)=>[a.numberInSurah,language==="en"?(a.transliteration||""):(a.pronunciations?.[language]||"")])))')
$source = $source.Replace('text:values[a.numberInSurah]||""}))', 'text:values[a.numberInSurah]||"",pronunciation:ayahPronunciations[a.numberInSurah]||""}))')
$needle = '<label>Ayah {ayah.numberInSurah} meaning<textarea dir={["ar","fa","ur","he","ps"].includes(language)?"rtl":"auto"} value={values[ayah.numberInSurah]||""} onChange={e=>setValues({...values,[ayah.numberInSurah]:e.target.value})} placeholder={`Type or paste Ayah ${ayah.numberInSurah} meaning here...`}/></label>'
$replacement = $needle + '<label className="pronunciationField">Ayah {ayah.numberInSurah} pronunciation<textarea dir={["ar","fa","ur","he","ps"].includes(language)?"rtl":"auto"} value={ayahPronunciations[ayah.numberInSurah]||""} onChange={e=>setAyahPronunciations({...ayahPronunciations,[ayah.numberInSurah]:e.target.value})} placeholder={`Type the pronunciation for Ayah ${ayah.numberInSurah}...`}/></label>'
$source = $source.Replace($needle, $replacement)
$marker = '`}</style></main>'
$css = @'
`}</style><style jsx>{`
.pronunciationField{display:block!important;flex:0!important;margin-top:12px}.pronunciationField textarea{min-height:76px!important;background:#fffaf0!important;border-color:#dfcf9e!important}
`}</style></main>
'@
if (-not $source.Contains('.pronunciationField{')) {$source = $source.Replace($marker,$css.TrimEnd())}
Set-Content -LiteralPath $page -Value $source -NoNewline -Encoding utf8

$api = Join-Path $PSScriptRoot '..\server\src\quran-admin.js'
$server = Get-Content -LiteralPath $api -Raw -Encoding utf8
$server = $server.Replace("byAyah=new Map(translations.map(row=>[Number(row.numberInSurah),clean(row.text,12000)]));const ayahs=(surah.ayahs||[]).map(ayah=>{const text=byAyah.get(Number(ayah.numberInSurah));return text===undefined?ayah:{...ayah,translations:{...(ayah.translations||{}),[language]:text}}})", "byAyah=new Map(translations.map(row=>[Number(row.numberInSurah),{text:clean(row.text,12000),pronunciation:clean(row.pronunciation,12000)}]));const ayahs=(surah.ayahs||[]).map(ayah=>{const localized=byAyah.get(Number(ayah.numberInSurah));return localized===undefined?ayah:{...ayah,translations:{...(ayah.translations||{}),[language]:localized.text},pronunciations:{...(ayah.pronunciations||{}),[language]:localized.pronunciation}}})")
Set-Content -LiteralPath $api -Value $server -NoNewline -Encoding utf8
