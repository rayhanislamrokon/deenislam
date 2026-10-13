$path = 'admin-panel/app/islamic-lifestyle/RichTextEditor.tsx'
$text = Get-Content -Raw $path
$old = '.richEditorBody ul,.richEditorBody ol{padding-left:28px;margin:12px 0}.richEditorBody li{margin:6px 0}'
$new = '.richEditorBody ul,.richEditorBody ol{display:block!important;padding-left:30px!important;margin:12px 0!important}.richEditorBody ul{list-style-type:disc!important}.richEditorBody ol{list-style-type:decimal!important}.richEditorBody li{display:list-item!important;margin:6px 0!important;padding-left:4px}.richEditorBody li::marker{color:#087a4d;font-weight:800}.richEditorBody li p{display:inline;margin:0}'
if (-not $text.Contains($old)) { throw 'List style block was not found.' }
$text = $text.Replace($old, $new)
Set-Content -Path $path -Value $text -Encoding utf8
