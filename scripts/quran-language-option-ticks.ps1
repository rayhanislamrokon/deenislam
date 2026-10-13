$target = Join-Path $PSScriptRoot '..\admin-panel\app\quran\page.tsx'
$source = Get-Content -LiteralPath $target -Raw
$pattern = 'return <option value=\{x\.code\} key=\{x\.code\}>\{count\?`[^`]*`:`\$\{x\.label\} \(\$\{x\.code\.toUpperCase\(\)\}\)`\}</option>'
$replacement = 'return <option className={count?"savedOption":""} value={x.code} key={x.code}>{count===total&&total>0?`\u2713 ${x.label} — COMPLETE (${count}/${total})`:count>0?`\u2713 ${x.label} — IN PROGRESS (${count}/${total})`:`${x.label} (${x.code.toUpperCase()})`}</option>'
$updated = [regex]::Replace($source,$pattern,$replacement,1)
if ($updated -eq $source) { throw 'Language option renderer marker not found' }
$source = $updated
$styleEnd = '</style></main>'
$css = '<style jsx>{`select option.savedOption{color:#087a4d;font-weight:800;background:#eef9f1}select option:checked{background:#dff3e5;color:#075b3b;font-weight:800}`}</style>'
if (-not $source.Contains($styleEnd)) { throw 'Style end marker not found' }
$source = $source.Replace($styleEnd,$css+$styleEnd)
Set-Content -LiteralPath $target -Value $source -NoNewline -Encoding utf8
