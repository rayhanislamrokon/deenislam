$path = 'admin-panel/app/islamic-lifestyle/page.tsx'
$text = Get-Content -Raw $path
$text = $text.Replace('import {FormEvent,useEffect,useRef,useState} from "react";', 'import {FormEvent,useEffect,useState} from "react";')
$text = $text.Replace('import Link from "next/link";', 'import Link from "next/link";' + "`r`n" + 'import RichTextEditor from "./RichTextEditor";')
$text = [regex]::Replace($text, '\s*const editorRef=useRef<HTMLDivElement>\(null\),imageInputRef=useRef<HTMLInputElement>\(null\);\r?\n', "`r`n")
$text = [regex]::Replace($text, '\s*const\[imageUploading,setImageUploading\]=useState\(false\);\r?\n', "`r`n")
$text = [regex]::Replace($text, '(?s)\r?\nconst syncEditor=.*?\r?\n const categories=', "`r`n const categories=")
$replacement = '<RichTextEditor value={form.content} onChange={content=>setForm(current=>({...current,content}))} api={API} token={token} onMessage={setMessage}/>'
$text = [regex]::Replace($text, '(?s)<div className="markdownToolbar".*?<em>\{form\.content\.replace\(/<\[\^>\]\*>/g,""\)\.length\.toLocaleString\(\)\} characters ready</em>', $replacement, 1)
Set-Content -Path $path -Value $text -Encoding utf8
