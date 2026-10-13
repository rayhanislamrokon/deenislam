$path = 'J:\REACT NATIVE APPS\DeenIslam\admin-panel\app\islamic-lifestyle\page.tsx'
$s = [IO.File]::ReadAllText($path)
$s = $s.Replace('<div className="markdownToolbar" role="toolbar" aria-label="Markdown formatting">', '<div className="markdownToolbar" role="toolbar" aria-label="Markdown formatting" onMouseDown={event=>event.preventDefault()}>')
$old = '<textarea ref={editorRef} required value={form.content} onChange={e=>setForm({...form,content:e.target.value})}'
$new = '<textarea ref={editorRef} required value={form.content} onChange={e=>setForm({...form,content:e.target.value})} onKeyDown={event=>{if(!(event.ctrlKey||event.metaKey))return;if(event.key.toLowerCase()==="b"){event.preventDefault();format("**","**","Bold text")}else if(event.key.toLowerCase()==="i"){event.preventDefault();format("*","*","Italic text")}}}'
if (-not $s.Contains($old)) { throw 'Chapter editor textarea not found.' }
$s = $s.Replace($old, $new)
$s = $s.Replace('title="Make selected text bold"', 'title="Bold selected text (Ctrl+B)"')
$s = $s.Replace('title="Make selected text italic"', 'title="Italicize selected text (Ctrl+I)"')
$s = $s.Replace('.markdownToolbar button:hover{background:#505050;border-color:#777}', '.markdownToolbar button:hover{background:#505050;border-color:#777}.markdownToolbar button:active{transform:translateY(1px);background:#087a4d}.markdownToolbar button:focus-visible{outline:2px solid #8bd5a8;outline-offset:1px}')
[IO.File]::WriteAllText($path, $s, (New-Object Text.UTF8Encoding($false)))
