$target = Join-Path $PSScriptRoot '..\admin-panel\app\quran\page.tsx'
$source = Get-Content -LiteralPath $target -Raw
$stateMarker = 'const completed=useMemo(()=>Object.values(values).filter(x=>x.trim()).length,[values]),visible='
$stateValue = 'const savedLanguages=useMemo(()=>{const progress=surahs.find(s=>s.number===surahNo)?.translationProgress||{},total=surah?.ayahs?.length||0;return languages.filter(item=>item.code!=="en"&&(progress[item.code]||0)>0).map(item=>({...item,count:progress[item.code]||0,total}))},[surahs,surahNo,surah,languages]);' + "`n" + ' const completed=useMemo(()=>Object.values(values).filter(x=>x.trim()).length,[values]),visible='
if (-not $source.Contains($stateMarker)) { throw 'Quran computed state marker not found' }
$source = $source.Replace($stateMarker,$stateValue)
$controlsEnd = '>+ Add selected language</button></div>{language!=="en"&&completed>0&&'
$checklist = '>+ Add selected language</button></div><div className="languageChecklist"><div className="checklistTitle"><div><b>Saved languages for this Surah</b><span>Green tick means an editor has already added meaning content.</span></div><strong>{savedLanguages.length} SAVED</strong></div>{savedLanguages.length?<div className="languageChips">{savedLanguages.map(item=><button type="button" key={item.code} className={language===item.code?"languageChip selected":"languageChip"} onClick={()=>setLanguage(item.code)}><i>{"\u2713"}</i><span><b>{item.label}</b><small>{item.count===item.total?"Complete":`${item.count}/${item.total} Ayahs`}</small></span></button>)}</div>:<div className="noSavedLanguage">No translation has been added for this Surah yet.</div>}</div>{language!=="en"&&completed>0&&'
if (-not $source.Contains($controlsEnd)) { throw 'Quran controls end marker not found' }
$source = $source.Replace($controlsEnd,$checklist)
$source = $source.Replace('`âœ“ ${x.label}', '`${"\u2713"} ${x.label}')
$source = $source.Replace('<i>âœ“</i>','<i>{"\u2713"}</i>')
$source = $source.Replace('"âœ“ Translation ready"','"\u2713 Translation ready"')
$styleEnd = '</style></main>'
$css = @'
<style jsx>{`
.languageChecklist{margin-top:13px;padding:15px;border:1px solid #d7e6db;border-radius:16px;background:linear-gradient(135deg,#fbfefc,#f2f9f4)}.checklistTitle{display:flex;align-items:center;justify-content:space-between;gap:12px}.checklistTitle b,.checklistTitle span{display:block}.checklistTitle b{font-size:12px;color:#214b39}.checklistTitle span{margin-top:3px;color:#74857b;font-size:9px}.checklistTitle>strong{padding:6px 9px;border-radius:8px;background:#e3f3e8;color:#087a4d;font-size:8px;letter-spacing:.8px}.languageChips{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.languageChip{display:flex;align-items:center;gap:8px;padding:8px 11px;border:1px solid #c9dfd0;border-radius:11px;background:#fff;color:#244b3a;box-shadow:none}.languageChip:hover{border-color:#70ad83;background:#f5fbf7}.languageChip.selected{border-color:#087a4d;background:#e8f6ec;box-shadow:0 0 0 3px rgba(8,122,77,.1)}.languageChip>i{width:25px;height:25px;display:grid;place-items:center;border-radius:8px;background:#087a4d;color:#fff;font-style:normal;font-weight:900}.languageChip>span{text-align:left}.languageChip b,.languageChip small{display:block}.languageChip b{font-size:10px}.languageChip small{margin-top:2px;color:#718078;font-size:8px}.noSavedLanguage{margin-top:11px;padding:12px;border:1px dashed #c7d8cc;border-radius:10px;background:#fff;color:#718078;font-size:10px;text-align:center}
`}</style>
'@
if (-not $source.Contains($styleEnd)) { throw 'Quran style end marker not found' }
$source = $source.Replace($styleEnd,$css.TrimEnd()+$styleEnd)
Set-Content -LiteralPath $target -Value $source -NoNewline -Encoding utf8
