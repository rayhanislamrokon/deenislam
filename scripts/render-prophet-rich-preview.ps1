$target = Join-Path $PSScriptRoot '..\admin-panel\app\prophets\page.tsx'
$source = Get-Content -LiteralPath $target -Raw
$old = '<div className="previewPartBody"><p>{item.story}</p>{item.reference&&'
$new = '<div className="previewPartBody">{/<[a-z][\s\S]*>/i.test(item.story||"")?<div className="richStoryPreview" dangerouslySetInnerHTML={{__html:item.story}}/>:<p>{item.story}</p>}{item.reference&&'
if (-not $source.Contains($old)) { throw 'Preview story marker not found' }
$source = $source.Replace($old,$new)
$cssMarker = '.previewPartBody p{white-space:pre-wrap;line-height:1.75;color:#314d40}'
$cssValue = '.previewPartBody p{white-space:pre-wrap;line-height:1.75;color:#314d40}.richStoryPreview{padding:8px 0;color:#314d40;font-size:14px;line-height:1.75}.richStoryPreview :global(h1),.richStoryPreview :global(h2),.richStoryPreview :global(h3),.richStoryPreview :global(h4){color:#075b3b;line-height:1.3}.richStoryPreview :global(blockquote){margin:14px 0;padding:10px 14px;border-left:4px solid #d0ad45;background:#fff8df}.richStoryPreview :global(img){display:block;max-width:100%;height:auto;margin:15px auto;border-radius:12px}.richStoryPreview :global(a){color:#087a4d;font-weight:700}.richStoryPreview :global(li){margin:6px 0}'
if (-not $source.Contains($cssMarker)) { throw 'Preview CSS marker not found' }
$source = $source.Replace($cssMarker,$cssValue)
Set-Content -LiteralPath $target -Value $source -NoNewline
