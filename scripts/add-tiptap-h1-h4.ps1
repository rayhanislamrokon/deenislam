$component = 'admin-panel/app/islamic-lifestyle/RichTextEditor.tsx'
$text = Get-Content -Raw $component
$h2 = '<Tool title="Heading 2" icon="H2" label="Heading" active={editor.isActive("heading", { level: 2 })} action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />'
$h1 = '<Tool title="Heading 1" icon="H1" label="Title" active={editor.isActive("heading", { level: 1 })} action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />'
if (-not $text.Contains($h2)) { throw 'H2 toolbar button was not found.' }
$text = $text.Replace($h2, $h1 + "`r`n" + '      ' + $h2)
$h3 = '<Tool title="Heading 3" icon="H3" label="Subheading" active={editor.isActive("heading", { level: 3 })} action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />'
$h4 = '<Tool title="Heading 4" icon="H4" label="Minor heading" active={editor.isActive("heading", { level: 4 })} action={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} />'
if (-not $text.Contains($h3)) { throw 'H3 toolbar button was not found.' }
$text = $text.Replace($h3, $h3 + "`r`n" + '      ' + $h4)
$text = $text.Replace('.richEditorBody h1,.richEditorBody h2,.richEditorBody h3{', '.richEditorBody h1,.richEditorBody h2,.richEditorBody h3,.richEditorBody h4{')
$text = $text.Replace('.richEditorBody h3{font-size:21px}', '.richEditorBody h3{font-size:21px}.richEditorBody h4{font-size:17px}')
Set-Content -Path $component -Value $text -Encoding utf8

$mobile = 'src/screens/AqidahLifeScreen.tsx'
$mobileText = Get-Content -Raw $mobile
$mobileText = $mobileText.Replace('h3:styles.richH3,p:styles.richP', 'h3:styles.richH3,h4:styles.richH4,p:styles.richP')
$mobileText = $mobileText.Replace("richH3:{fontSize:19,lineHeight:26,color:'#176143',marginTop:16,marginBottom:8},", "richH3:{fontSize:19,lineHeight:26,color:'#176143',marginTop:16,marginBottom:8},richH4:{fontSize:16,lineHeight:23,color:'#176143',marginTop:14,marginBottom:7},")
Set-Content -Path $mobile -Value $mobileText -Encoding utf8
