$path = 'admin-panel/app/islamic-lifestyle/RichTextEditor.tsx'
$text = Get-Content -Raw $path
$pattern = '(?s)  useEffect\(\(\) => \{.*?\r?\n  \}, \[editor, value\]\);'
$replacement = @'
  useEffect(() => {
    if (!editor) return;
    if (!initializedRef.current) {
      initializedRef.current = true;
      if (!recordId) {
        editor.commands.clearContent(false);
        editor.view.dispatch(editor.state.tr.setStoredMarks([]));
        if (value) onChange("");
        return;
      }
    }
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || "", { emitUpdate: false });
      if (!value || value === "<p></p>") editor.view.dispatch(editor.state.tr.setStoredMarks([]));
    }
  }, [editor, value, recordId, onChange]);
'@
$updated = [regex]::Replace($text, $pattern, $replacement, 1)
if ($updated -eq $text) { throw 'Reset effect block was not found.' }
Set-Content -Path $path -Value $updated -Encoding utf8
