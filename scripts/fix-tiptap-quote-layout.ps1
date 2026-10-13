$path = 'admin-panel/app/islamic-lifestyle/RichTextEditor.tsx'
$text = Get-Content -Raw $path
$old = '.richEditorBody blockquote{margin:15px 0;padding:13px 17px;border-left:4px solid #d0ad45;border-radius:0 10px 10px 0;background:#fff8df;color:#5c5132}'
$new = '.richEditorBody blockquote{display:table;max-width:100%;margin:15px 0;padding:10px 15px;border-left:4px solid #d0ad45;border-radius:0 10px 10px 0;background:#fff8df;color:#5c5132}.richEditorBody blockquote p{margin:0}'
if (-not $text.Contains($old)) { throw 'Quote style was not found.' }
$text = $text.Replace($old, $new)
Set-Content -Path $path -Value $text -Encoding utf8
