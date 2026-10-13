$target = Join-Path $PSScriptRoot '..\admin-panel\app\prophets\page.tsx'
$source = Get-Content -LiteralPath $target -Raw
$importMarker = 'import Link from"next/link";'
$importValue = 'import Link from"next/link";' + [Environment]::NewLine + 'import RichTextEditor from"../islamic-lifestyle/RichTextEditor";'
if (-not $source.Contains($importMarker)) { throw 'Import marker not found' }
$source = $source.Replace($importMarker,$importValue)
$oldEditor = '<label>Complete story text<textarea className="story" value={item.story} onChange={e=>part(index,"story",e.target.value)} required/></label>'
$newEditor = '<div className="storyEditor"><label>Complete story text</label><RichTextEditor value={item.story} onChange={value=>part(index,"story",value)} api={API} token={token} onMessage={setMessage} recordId={`${form.id||"new"}-part-${index}`}/></div>'
if (-not $source.Contains($oldEditor)) { throw 'Story textarea marker not found' }
$source = $source.Replace($oldEditor,$newEditor)
$oldPreview = '<p>{item.story}</p>{item.reference&&<small>'
$newPreview = '<div className="richStory" dangerouslySetInnerHTML={{__html:item.story}}/>{item.reference&&<small>'
if (-not $source.Contains($oldPreview)) { throw 'Story preview marker not found' }
$source = $source.Replace($oldPreview,$newPreview)
$cssMarker = '.story{min-height:170px;line-height:1.6}'
$cssValue = '.story{min-height:170px;line-height:1.6}.storyEditor>label{display:block;margin-bottom:7px}.storyEditor .richEditorBody{min-height:260px}.richStory{padding:12px 0;line-height:1.75;color:#314d40}.richStory h1,.richStory h2,.richStory h3,.richStory h4{color:#075b3b}.richStory blockquote{margin-left:0;padding:10px 14px;border-left:4px solid #d0ad45;background:#fff8df}.richStory img{max-width:100%;height:auto;border-radius:12px}.richStory a{color:#087a4d;font-weight:700}'
if (-not $source.Contains($cssMarker)) { throw 'Story CSS marker not found' }
$source = $source.Replace($cssMarker,$cssValue)
Set-Content -LiteralPath $target -Value $source -NoNewline
