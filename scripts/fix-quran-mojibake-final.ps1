$target = Join-Path $PSScriptRoot '..\admin-panel\app\quran\page.tsx'
$source = Get-Content -LiteralPath $target -Raw -Encoding utf8
$source = [regex]::Replace($source, '<strong>[^<]*</strong></button>\}\)</div></section></div>\}', '<strong>&gt;</strong></button>})</div></section></div>}')
$source = $source.Replace('<label>Surah name meaning<input value={meaning} onChange={e=>setMeaning(e.target.value)} placeholder="Enter localized name"/>', '<label>Surah name meaning<input value={meaning} onChange={e=>setMeaning(e.target.value)} placeholder="Enter Surah name meaning"/>')
Set-Content -LiteralPath $target -Value $source -NoNewline -Encoding utf8
