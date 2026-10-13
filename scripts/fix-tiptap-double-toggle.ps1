$component = 'admin-panel/app/islamic-lifestyle/RichTextEditor.tsx'
$text = Get-Content -Raw $component
$old = 'onMouseDown={event => event.preventDefault()} onClick={action}'
$new = 'onMouseDown={event => { event.preventDefault(); action(); }}'
if (-not $text.Contains($old)) { throw 'Toolbar button event pattern was not found.' }
$text = $text.Replace($old, $new)
$text = $text.Replace('  }, [editor, value, recordId, onChange]);', '  }, [editor, value, recordId]);')
Set-Content -Path $component -Value $text -Encoding utf8

$page = 'admin-panel/app/islamic-lifestyle/page.tsx'
$pageText = Get-Content -Raw $page
$start = '{form.kind==="chapter"&&<label className="wide contentUpload">'
$end = ' recordId={form.id}/></label>}'
if (-not $pageText.Contains($start)) { throw 'Chapter editor label start was not found.' }
if (-not $pageText.Contains($end)) { throw 'Chapter editor label end was not found.' }
$pageText = $pageText.Replace($start, '{form.kind==="chapter"&&<div className="wide contentUpload">')
$pageText = $pageText.Replace($end, ' recordId={form.id}/></div>}')
Set-Content -Path $page -Value $pageText -Encoding utf8
