$path = 'admin-panel/app/islamic-lifestyle/RichTextEditor.tsx'
$text = Get-Content -Raw $path
$text = $text.Replace('onUpdate: ({ editor: activeEditor }) => onChange(activeEditor.getHTML()),', 'onCreate: ({ editor: activeEditor }) => { if (activeEditor.isEmpty) activeEditor.chain().setParagraph().unsetAllMarks().run(); },' + "`r`n" + '    onFocus: ({ editor: activeEditor }) => { if (activeEditor.isEmpty) activeEditor.chain().setParagraph().unsetAllMarks().run(); },' + "`r`n" + '    onUpdate: ({ editor: activeEditor }) => onChange(activeEditor.getHTML()),')
$oldEffect = 'if (editor && editor.getHTML() !== value) editor.commands.setContent(value || "", { emitUpdate: false });'
$newEffect = 'if (editor && editor.getHTML() !== value) {' + "`r`n" + '      editor.commands.setContent(value || "", { emitUpdate: false });' + "`r`n" + '      if (!value || value === "<p></p>") editor.chain().setParagraph().unsetAllMarks().run();' + "`r`n" + '    }'
$text = $text.Replace($oldEffect, $newEffect)
$text = [regex]::Replace($text, '<Tool title="Block quote" icon="[^"]*"', '<Tool title="Block quote" icon="Quote"')
$text = [regex]::Replace($text, '<Tool title="Bullet list" icon="[^"]*"', '<Tool title="Bullet list" icon="-"')
$text = [regex]::Replace($text, '<Tool title="Add or edit link" icon="[^"]*"', '<Tool title="Add or edit link" icon="@"')
Set-Content -Path $path -Value $text -Encoding utf8
