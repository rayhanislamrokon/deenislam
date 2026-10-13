$page = 'admin-panel/app/islamic-lifestyle/page.tsx'
$pageText = Get-Content -Raw $page
$pageText = [regex]::Replace($pageText, '\.contentUpload em\{display:block;margin-top:7px;text-align:right;font-size:10px;color:#087a4d\}', '')
Set-Content -Path $page -Value $pageText -Encoding utf8

$component = 'admin-panel/app/islamic-lifestyle/RichTextEditor.tsx'
$text = Get-Content -Raw $component
$text = $text.Replace('.richEditorBody em{font-style:italic}', '.richEditorBody em{display:inline!important;margin:0!important;text-align:inherit!important;font-size:inherit!important;line-height:inherit!important;color:inherit!important;font-style:italic!important}')
Set-Content -Path $component -Value $text -Encoding utf8
