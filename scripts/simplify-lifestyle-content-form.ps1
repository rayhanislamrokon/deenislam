$path = 'J:\REACT NATIVE APPS\DeenIslam\admin-panel\app\islamic-lifestyle\page.tsx'
$s = [IO.File]::ReadAllText($path)
$s = $s.Replace('summary:"",sources:"",published:true', 'summary:"",sources:"",content:"",published:true')
$s = $s.Replace('summary:x.summary||"",sources:', 'summary:x.summary||"",content:(x.introduction||[]).join("\n\n"),sources:')
$s = $s.Replace('introduction:lines(form.introduction)', 'introduction:form.kind==="chapter"?[form.content.trim()].filter(Boolean):[]')
$pattern = '\{form\.kind==="chapter"&&<>\{field\("reference".*?\{area\("sources","Sources — Label \| Note \| URL"\)\}</>\}'
$replacement = '{form.kind==="chapter"&&<label className="wide contentUpload"><span>Complete Chapter Content</span><small>Paste the complete content here. Quran references, Arabic ayahs, meanings, lessons and sources can all remain together in this single document.</small><textarea required value={form.content} onChange={e=>setForm({...form,content:e.target.value})} placeholder={"# Chapter introduction\n\nWrite or paste the full Islamic chapter here...\n\n## Quran Sources\nQuran 51:56 — explanation..."}/><em>{form.content.length.toLocaleString()} characters ready</em></label>}'
$updated = [regex]::Replace($s, $pattern, $replacement, [Text.RegularExpressions.RegexOptions]::Singleline)
if ($updated -eq $s) { throw 'Detailed chapter fields block was not found.' }
$cssMarker = '.check{grid-column:1/-1;display:flex;gap:8px;align-items:center}'
$css = '.contentUpload small{display:block;margin:-1px 0 8px;color:#73837a;font-weight:400;line-height:1.5}.contentUpload textarea{min-height:440px;font:14px/1.7 Georgia,serif}.contentUpload em{display:block;margin-top:7px;text-align:right;font-size:10px;color:#087a4d}.check{grid-column:1/-1;display:flex;gap:8px;align-items:center}'
$updated = $updated.Replace($cssMarker, $css)
[IO.File]::WriteAllText($path, $updated, (New-Object Text.UTF8Encoding($false)))
