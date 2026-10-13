$target = Join-Path $PSScriptRoot '..\admin-panel\app\quran\page.tsx'
$source = Get-Content -LiteralPath $target -Raw -Encoding utf8
$source = $source.Replace('languages.filter(item=>item.code!=="en"&&(!languageSearch.trim()||', 'languages.filter(item=>(!languageSearch.trim()||')
$source = $source.Replace('const count=surahs.find(s=>s.number===surahNo)?.translationProgress?.[item.code]||0,total=', 'const count=item.code==="en"?(surah?.ayahs?.length||surahs.find(s=>s.number===surahNo)?.numberOfAyahs||0):(surahs.find(s=>s.number===surahNo)?.translationProgress?.[item.code]||0),total=')
$source = $source.Replace('<b>{item.label}</b><small>{complete?', '<b>{item.label}{item.code==="en"?" (Base)":""}</b><small>{item.code==="en"?"Original English content - Available":complete?')
$source = $source.Replace(':count?`${count}/${total} Ayahs - In progress`:"Not uploaded"}</small>', ':count?`${count}/${total} Ayahs - In progress`:"Not uploaded"}</small>')
Set-Content -LiteralPath $target -Value $source -NoNewline -Encoding utf8
