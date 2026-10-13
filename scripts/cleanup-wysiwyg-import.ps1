$path = 'admin-panel/app/islamic-lifestyle/page.tsx'
$text = Get-Content -Raw $path
$text = $text -replace 'import ReactMarkdown from "react-markdown";\r?\n', ''
Set-Content -Path $path -Value $text -Encoding utf8
