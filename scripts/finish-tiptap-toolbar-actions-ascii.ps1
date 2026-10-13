$path = 'admin-panel/app/islamic-lifestyle/RichTextEditor.tsx'
$text = Get-Content -Raw $path
$text = $text.Replace('const fileRef = useRef<HTMLInputElement>(null);', 'const fileRef = useRef<HTMLInputElement>(null);' + "`r`n" + '  const imagePositionRef = useRef<number | null>(null);')
$pattern = '(?s)  const addLink = \(\) => \{.*?\r?\n  \};\r?\n\r?\n  const uploadImage'
$replacement = @'
  const addLink = () => {
    const { from, to } = editor.state.selection;
    const previous = editor.getAttributes("link").href || "https://";
    const url = window.prompt("Enter the complete link", previous);
    if (url === null) return;
    const chain = editor.chain().focus().setTextSelection({ from, to });
    if (!url.trim()) { chain.extendMarkRange("link").unsetLink().run(); return; }
    if (from !== to) { chain.extendMarkRange("link").setLink({ href: url.trim() }).run(); return; }
    const label = window.prompt("Link text", "Open link")?.trim();
    if (!label) return;
    chain.insertContent({ type: "text", text: label, marks: [{ type: "link", attrs: { href: url.trim() } }] }).run();
  };

  const clearFormatting = () => {
    const emptySelection = editor.state.selection.empty;
    editor.chain().focus().unsetAllMarks().clearNodes().run();
    if (emptySelection) editor.view.dispatch(editor.state.tr.setStoredMarks([]));
  };

  const chooseImage = () => {
    imagePositionRef.current = editor.state.selection.from;
    fileRef.current?.click();
  };

  const uploadImage
'@
$updated = [regex]::Replace($text, $pattern, $replacement, 1)
if ($updated -eq $text) { throw 'Link action block was not found.' }
$text = $updated
$oldImage = 'editor.chain().focus().setImage({ src: payload.data.publicUrl, alt: file.name.replace(/\.[^.]+$/, "") }).run();'
$newImage = 'const position = imagePositionRef.current;' + "`r`n" + '      const chain = editor.chain().focus();' + "`r`n" + '      if (position !== null) chain.setTextSelection(position);' + "`r`n" + '      chain.setImage({ src: payload.data.publicUrl, alt: file.name.replace(/\.[^.]+$/, "") }).run();'
$text = $text.Replace($oldImage, $newImage)
$text = [regex]::Replace($text, '<Tool title="Block quote" icon="[^"]*"', '<Tool title="Block quote" icon=">"')
$text = $text.Replace('action={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}', 'action={clearFormatting}')
$text = $text.Replace('action={() => !uploading && fileRef.current?.click()}', 'action={() => !uploading && chooseImage()}')
$text = [regex]::Replace($text, 'Rich text .*? Formatting saves automatically', 'Rich text - formatting saves automatically')
$text = [regex]::Replace($text, 'Loading editor.*?</div>', 'Loading editor...</div>')
Set-Content -Path $path -Value $text -Encoding utf8
