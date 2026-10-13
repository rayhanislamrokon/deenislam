$path = Join-Path $PSScriptRoot '..\admin-panel\app\islamic-lifestyle\RichTextEditor.tsx'
$content = [IO.File]::ReadAllText($path)
$old = @'
  const clearFormatting = () => {
    const emptySelection = editor.state.selection.empty;
    editor.chain().focus().unsetAllMarks().clearNodes().run();
    if (emptySelection) editor.view.dispatch(editor.state.tr.setStoredMarks([]));
  };
'@
$new = @'
  const clearFormatting = () => {
    const emptySelection = editor.state.selection.empty;
    if(emptySelection) editor.chain().focus().unsetAllMarks().clearNodes().run();
    else editor.chain().focus().unsetAllMarks().run();
    if (emptySelection) editor.view.dispatch(editor.state.tr.setStoredMarks([]));
  };
'@
if (-not $content.Contains($old)) { throw 'clearFormatting function not found.' }
$content = $content.Replace($old,$new)
[IO.File]::WriteAllText($path,$content,[Text.UTF8Encoding]::new($false))
