$component = 'admin-panel/app/islamic-lifestyle/RichTextEditor.tsx'
$text = Get-Content -Raw $component
$text = $text.Replace('onMessage: (message: string) => void;', 'onMessage: (message: string) => void;' + "`r`n" + '  recordId: string;')
$text = $text.Replace('export default function RichTextEditor({ value, onChange, api, token, onMessage }: Props) {', 'export default function RichTextEditor({ value, onChange, api, token, onMessage, recordId }: Props) {' + "`r`n" + '  const initializedRef = useRef(false);')
$oldEffect = @'
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value || "", { emitUpdate: false });
      if (!value || value === "<p></p>") editor.chain().setParagraph().unsetAllMarks().run();
    }
  }, [editor, value]);
'@
$newEffect = @'
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
$text = $text.Replace($oldEffect, $newEffect)
Set-Content -Path $component -Value $text -Encoding utf8

$page = 'admin-panel/app/islamic-lifestyle/page.tsx'
$pageText = Get-Content -Raw $page
$pageText = $pageText.Replace('api={API} token={token} onMessage={setMessage}/>', 'api={API} token={token} onMessage={setMessage} recordId={form.id}/>')
Set-Content -Path $page -Value $pageText -Encoding utf8
