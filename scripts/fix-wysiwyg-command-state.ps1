$path = 'admin-panel/app/islamic-lifestyle/page.tsx'
$text = Get-Content -Raw $path
$text = $text.Replace('const command=(name:string,value?:string)=>{editorRef.current?.focus();document.execCommand(name,false,value);syncEditor()};', 'const command=(name:string,value?:string)=>{const editor=editorRef.current;if(!editor)return;editor.focus();document.execCommand(name,false,value);};')
$text = $text.Replace('command("insertImage",payload.data.publicUrl);setMessage(', 'command("insertImage",payload.data.publicUrl);syncEditor();setMessage(')
Set-Content -Path $path -Value $text -Encoding utf8
