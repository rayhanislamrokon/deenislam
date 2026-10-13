$target = Join-Path $PSScriptRoot '..\admin-panel\app\prophets\page.tsx'
$source = Get-Content -LiteralPath $target -Raw
$importMarker = 'import Link from"next/link";'
$importValue = 'import Link from"next/link";' + [Environment]::NewLine + 'import RichTextEditor from"../islamic-lifestyle/RichTextEditor";'
if (-not $source.Contains($importMarker)) { throw 'Import marker not found' }
$source = $source.Replace($importMarker,$importValue)
$old = '<label>Complete story text<textarea className="story" value={item.story} onChange={e=>part(index,"story",e.target.value)} required/></label>'
$new = '<div className="storyEditor"><label>Complete story text</label><RichTextEditor value={item.story} onChange={html=>part(index,"story",html)} api={API} token={token} onMessage={setMessage} recordId={`${form.id||"new"}:${index}`}/></div>'
if (-not $source.Contains($old)) { throw 'Story textarea marker not found' }
$source = $source.Replace($old,$new)
$cssMarker = '.story{min-height:170px;line-height:1.6}'
$cssValue = '.story{min-height:170px;line-height:1.6}.storyEditor{display:grid;gap:6px}.storyEditor :global(.richEditorBody){min-height:280px}'
if (-not $source.Contains($cssMarker)) { throw 'Story CSS marker not found' }
$source = $source.Replace($cssMarker,$cssValue)
Set-Content -LiteralPath $target -Value $source -NoNewline
