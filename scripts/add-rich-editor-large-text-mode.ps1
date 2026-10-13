$editorPath=Join-Path $PSScriptRoot '..\admin-panel\app\islamic-lifestyle\RichTextEditor.tsx';$editor=[IO.File]::ReadAllText($editorPath)
$editor=$editor.Replace('  recordId: string;`r`n};', '  recordId: string;`r`n  largeText?: boolean;`r`n};')
if(-not $editor.Contains('largeText?: boolean;')){
 $editor=$editor.Replace("  recordId: string;`n};", "  recordId: string;`n  largeText?: boolean;`n};")
}
$editor=$editor.Replace('export default function RichTextEditor({ value, onChange, api, token, onMessage, recordId }: Props)', 'export default function RichTextEditor({ value, onChange, api, token, onMessage, recordId, largeText = false }: Props)')
$editor=$editor.Replace('<div className="tiptapShell">', '<div className={largeText?"tiptapShell largeText":"tiptapShell"}>')
$cssNeedle='      .richEditorBody{min-height:430px;padding:22px;outline:none;color:#263f34;font:16px/1.75 Arial,sans-serif}'
$cssNew=$cssNeedle+'`r`n      .tiptapShell.largeText .richEditorBody{font-size:24px!important;line-height:1.9!important}.tiptapShell.largeText .richEditorBody p{font-size:24px!important;line-height:1.9!important;margin-bottom:18px}'
if(-not $editor.Contains($cssNeedle)){throw 'Rich editor body CSS not found'};$editor=$editor.Replace($cssNeedle,$cssNew.Replace('`r`n',[Environment]::NewLine))
[IO.File]::WriteAllText($editorPath,$editor,[Text.UTF8Encoding]::new($false))

$builderPath=Join-Path $PSScriptRoot '..\admin-panel\app\books\BookPageBuilder.tsx';$builder=[IO.File]::ReadAllText($builderPath)
$old='recordId={`${recordId}:page:${index+1}`}/>'
$new='recordId={`${recordId}:page:${index+1}`} largeText/>'
if(-not $builder.Contains($old)){throw 'Book page editor instance not found'};$builder=$builder.Replace($old,$new)
[IO.File]::WriteAllText($builderPath,$builder,[Text.UTF8Encoding]::new($false))
