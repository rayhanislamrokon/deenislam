$path = 'J:\REACT NATIVE APPS\DeenIslam\admin-panel\app\islamic-lifestyle\page.tsx'
$s = [IO.File]::ReadAllText($path)
$s = $s.Replace(' const editorRef=useRef<HTMLTextAreaElement>(null);', ' const editorRef=useRef<HTMLTextAreaElement>(null),imageInputRef=useRef<HTMLInputElement>(null);')
$s = $s.Replace(' const[preview,setPreview]=useState(false),[markdownHelp,setMarkdownHelp]=useState(false);', ' const[preview,setPreview]=useState(false),[markdownHelp,setMarkdownHelp]=useState(false),[imageUploading,setImageUploading]=useState(false);')
$functionMarker = ' const categories=items.filter(x=>x.kind==="category");'
$uploadFunction = @'
 const uploadEditorImage=async(file:File|null)=>{if(!file)return;if(!["image/jpeg","image/png","image/webp"].includes(file.type)){setMessage("Choose a JPG, PNG or WebP image.");return}if(file.size>8*1024*1024){setMessage("Image must be 8 MB or smaller.");return}setImageUploading(true);setMessage("");try{const response=await fetch(API+"/api/admin/books/cover-upload",{method:"POST",headers:headers(),body:JSON.stringify({fileName:file.name,contentType:file.type})}),payload=await response.json();if(!response.ok)throw Error(payload.message||"Unable to prepare image upload.");const uploaded=await fetch(payload.data.uploadUrl,{method:"PUT",headers:{"Content-Type":payload.data.contentType},body:file});if(!uploaded.ok)throw Error("Image upload failed.");const editor=editorRef.current,start=editor?.selectionStart??form.content.length,markdown=`![${file.name.replace(/\.[^.]+$/,"")}](${payload.data.publicUrl})`,next=form.content.slice(0,start)+markdown+form.content.slice(start);setForm({...form,content:next});setMessage("Image uploaded and inserted into the chapter.");requestAnimationFrame(()=>{editor?.focus();editor?.setSelectionRange(start+markdown.length,start+markdown.length)})}catch(error){setMessage(error instanceof Error?error.message:"Unable to upload image.")}finally{setImageUploading(false);if(imageInputRef.current)imageInputRef.current.value=""}};
 const categories=items.filter(x=>x.kind==="category");
'@
if (-not $s.Contains($functionMarker)) { throw 'Category marker missing.' }
$s = $s.Replace($functionMarker, $uploadFunction.Trim())
$oldImage = '<button type="button" title="Insert an image URL" onClick={()=>format("![","](https://example.com/image.jpg)","Image description")}><b>IMG</b><span>Image</span></button>'
$newImage = '<button type="button" title="Upload JPG, PNG or WebP" disabled={imageUploading} onClick={()=>imageInputRef.current?.click()}><b>IMG</b><span>{imageUploading?"Uploading...":"Image"}</span></button>'
if (-not $s.Contains($oldImage)) { throw 'Image toolbar button missing.' }
$s = $s.Replace($oldImage, $newImage)
$textareaMarker = '</div><textarea ref={editorRef}'
$withInput = '</div><input ref={imageInputRef} className="hiddenImageInput" type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>void uploadEditorImage(event.target.files?.[0]||null)}/><textarea ref={editorRef}'
if (-not $s.Contains($textareaMarker)) { throw 'Toolbar end marker missing.' }
$s = $s.Replace($textareaMarker, $withInput)
$s = $s.Replace('.markdownToolbar button:active{', '.hiddenImageInput{display:none}.markdownToolbar button:disabled{opacity:.55;cursor:wait}.markdownToolbar button:active{')
[IO.File]::WriteAllText($path, $s, (New-Object Text.UTF8Encoding($false)))
