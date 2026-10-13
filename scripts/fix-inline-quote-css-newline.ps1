$path = Join-Path $PSScriptRoot '..\admin-panel\app\islamic-lifestyle\RichTextEditor.tsx'
$content = [IO.File]::ReadAllText($path)
$content = $content.Replace('}`r`n      .richEditorBody blockquote', "}`r`n      .richEditorBody blockquote")
[IO.File]::WriteAllText($path,$content,[Text.UTF8Encoding]::new($false))
