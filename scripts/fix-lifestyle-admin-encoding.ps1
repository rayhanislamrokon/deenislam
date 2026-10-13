$page = 'admin-panel/app/islamic-lifestyle/page.tsx'
$text = Get-Content -Raw $page
$text = [regex]::Replace($text, '(const empty=\{.*?title:"",icon:)"[^"]*"(,subtitle:)', '$1"\uD83C\uDF3F"$2', 1)
$text = [regex]::Replace($text, '(const edit=.*?icon:x\.icon\|\|)"[^"]*"(,subtitle:)', '$1"\uD83C\uDF3F"$2', 1)
$text = [regex]::Replace($text, '<Link href="/">.*?Back to Dashboard</Link>', '<Link href="/">{"\u2039"} Back to Dashboard</Link>', 1)
$text = [regex]::Replace($text, '<div className="mobileIcon">\{form\.icon\|\|"[^"]*"\}</div>', '<div className="mobileIcon">{form.icon||"\uD83C\uDF3F"}</div>', 1)
$text = [regex]::Replace($text, '<span>Open guide .*?</span>', '<span>Open guide {"\u203A"}</span>', 1)
$text = [regex]::Replace($text, '(\}\s*chapters)\s+[^\s{]+\s+(\{cat\.published\?)', '$1 {"\u2022"} $2')
Set-Content -Path $page -Value $text -Encoding utf8

$editor = 'admin-panel/app/islamic-lifestyle/RichTextEditor.tsx'
$editorText = Get-Content -Raw $editor
$editorText = [regex]::Replace($editorText, 'uploading \? "[^"]*" : "Image"', 'uploading ? "Uploading..." : "Image"')
$editorText = [regex]::Replace($editorText, "Write or paste the complete Islamic chapter here[^']*'", "Write or paste the complete Islamic chapter here...'" )
Set-Content -Path $editor -Value $editorText -Encoding utf8
