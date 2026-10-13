$target = Join-Path $PSScriptRoot '..\admin-panel\app\islamic-lifestyle\RichTextEditor.tsx'
$source = Get-Content -LiteralPath $target -Raw
$oldOptions = '{tone:"blue",label:"Blue"},{tone:"rose",label:"Rose"}'
$newOptions = '{tone:"blue",label:"Blue"},{tone:"rose",label:"Rose"},{tone:"red",label:"Red"}'
if (-not $source.Contains($oldOptions)) { throw 'Quote colour options marker not found' }
$source = $source.Replace($oldOptions,$newOptions)
$oldSwatch = '.quoteTone.rose i{background:#ce6b78}'
$newSwatch = '.quoteTone.rose i{background:#ce6b78}.quoteTone.red i{background:#d84343}'
if (-not $source.Contains($oldSwatch)) { throw 'Rose swatch marker not found' }
$source = $source.Replace($oldSwatch,$newSwatch)
$oldStyle = '.richEditorBody blockquote[data-tone="gold"]{border-left-color:#d0ad45;background:#fff8df;color:#5c5132}'
$newStyle = '.richEditorBody blockquote[data-tone="gold"]{border-left-color:#d0ad45;background:#fff8df;color:#5c5132}.richEditorBody blockquote[data-tone="red"]{border-left-color:#d84343;background:#fff0f0;color:#742d2d}'
if (-not $source.Contains($oldStyle)) { throw 'Gold quote style marker not found' }
$source = $source.Replace($oldStyle,$newStyle)
Set-Content -LiteralPath $target -Value $source -NoNewline
