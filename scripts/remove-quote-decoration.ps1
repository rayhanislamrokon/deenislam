$target = Join-Path $PSScriptRoot '..\admin-panel\app\islamic-lifestyle\RichTextEditor.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = $source.Replace('padding:18px 20px 18px 50px','padding:18px 20px')
$decoration = '.richEditorBody blockquote:before{content:"“";position:absolute;left:16px;top:8px;font:700 38px/1 Georgia,serif;color:currentColor;opacity:.28;pointer-events:none}'
if (-not $source.Contains($decoration)) { throw 'Quote decoration marker not found' }
$source = $source.Replace($decoration,'')
Set-Content -LiteralPath $target -Value $source -NoNewline
