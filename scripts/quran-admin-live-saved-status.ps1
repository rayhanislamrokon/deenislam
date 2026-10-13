$target = Join-Path $PSScriptRoot '..\admin-panel\app\quran\page.tsx'
$source = Get-Content -LiteralPath $target -Raw
$oldSave = 'setMessage(`${body.message} ${body.data.saved}/${body.data.total} Ayahs completed.`)'
$newSave = 'setSurahs(current=>current.map(row=>row.number===surahNo?{...row,translationProgress:{...(row.translationProgress||{}),[language]:body.data.saved}}:row));setMessage(`${body.message} ${body.data.saved}/${body.data.total} Ayahs completed.`)'
if (-not $source.Contains($oldSave)) { throw 'Save status marker not found' }
$source = $source.Replace($oldSave,$newSave)
$controlsEnd = '>+ Add selected language</button></div><div className="meta">'
$banner = '>+ Add selected language</button></div>{language!=="en"&&completed>0&&<div className={completed===(surah?.ayahs?.length||0)?"savedLanguageBanner complete":"savedLanguageBanner"}><i>✓</i><div><b>{languages.find(x=>x.code===language)?.label||language.toUpperCase()} content {completed===(surah?.ayahs?.length||0)?"is complete":"is in progress"}</b><span>{completed} of {surah?.ayahs?.length||0} Ayahs saved{completed!==(surah?.ayahs?.length||0)?` • ${(surah?.ayahs?.length||0)-completed} remaining`:""}</span></div></div>}<div className="meta">'
if (-not $source.Contains($controlsEnd)) { throw 'Controls banner marker not found' }
$source = $source.Replace($controlsEnd,$banner)
$styleEnd = '</style></main>'
$css = '<style jsx>{`.savedLanguageBanner{display:flex;align-items:center;gap:11px;margin-top:12px;padding:12px 15px;border:1px solid #d8c98d;border-radius:13px;background:#fff9e8}.savedLanguageBanner.complete{border-color:#a8d5b7;background:#e9f7ed}.savedLanguageBanner>i{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:#c39e35;color:#fff;font-style:normal;font-weight:900}.savedLanguageBanner.complete>i{background:#087a4d}.savedLanguageBanner b,.savedLanguageBanner span{display:block}.savedLanguageBanner span{margin-top:3px;color:#66776e;font-size:10px}`}</style>'
if (-not $source.Contains($styleEnd)) { throw 'Style closing marker not found' }
$source = $source.Replace($styleEnd,$css+$styleEnd)
Set-Content -LiteralPath $target -Value $source -NoNewline -Encoding utf8
