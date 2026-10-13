$path = 'admin-panel/app/islamic-lifestyle/RichTextEditor.tsx'
$text = Get-Content -Raw $path
$oldConfig = 'Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } })'
$newConfig = 'Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true, HTMLAttributes: { target: "_blank", rel: "noopener noreferrer nofollow" } })'
if (-not $text.Contains($oldConfig)) { throw 'Link extension configuration was not found.' }
$text = $text.Replace($oldConfig, $newConfig)
$text = $text.Replace('const url = window.prompt("Enter the complete link", previous);', 'const enteredUrl = window.prompt("Enter website address", previous);')
$text = $text.Replace('if (url === null) return;', 'if (enteredUrl === null) return;' + "`r`n" + '    const rawUrl = enteredUrl.trim();' + "`r`n" + '    const url = !rawUrl || /^(https?:\/\/|mailto:|tel:|#)/i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;')
$text = $text.Replace('if (!url.trim())', 'if (!url)')
$text = $text.Replace('href: url.trim()', 'href: url')
$oldStyle = '.richEditorBody a{color:#087a4d;text-decoration:underline;font-weight:700}'
$newStyle = '.richEditorBody a{color:#087a4d!important;text-decoration:underline!important;text-decoration-thickness:2px!important;text-underline-offset:3px!important;font-weight:700!important;cursor:pointer}.richEditorBody a:hover{color:#075b3b!important;background:#e5f4e9;border-radius:3px}.richEditorBody a::selection{color:#087a4d!important;background:#cbd5e1}'
if (-not $text.Contains($oldStyle)) { throw 'Link editor style was not found.' }
$text = $text.Replace($oldStyle, $newStyle)
Set-Content -Path $path -Value $text -Encoding utf8
