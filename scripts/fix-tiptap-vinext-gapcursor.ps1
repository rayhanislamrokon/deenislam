$path = 'admin-panel/app/islamic-lifestyle/RichTextEditor.tsx'
$text = Get-Content -Raw $path
$text = $text.Replace('StarterKit,', 'StarterKit.configure({ gapcursor: false, dropcursor: false }),')
Set-Content -Path $path -Value $text -Encoding utf8
