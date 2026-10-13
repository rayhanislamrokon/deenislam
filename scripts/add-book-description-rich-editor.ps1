$editorPath=Join-Path $PSScriptRoot '..\admin-panel\app\islamic-lifestyle\RichTextEditor.tsx';$editor=[IO.File]::ReadAllText($editorPath)
$editor=$editor.Replace('  largeText?: boolean;', "  largeText?: boolean;`r`n  compact?: boolean;")
$editor=$editor.Replace('recordId, largeText = false }: Props)', 'recordId, largeText = false, compact = false }: Props)')
$editor=$editor.Replace('<div className={largeText?"tiptapShell largeText":"tiptapShell"}>', '<div className={`tiptapShell${largeText?" largeText":""}${compact?" compact":""}`}>')
$needle='      .tiptapShell.largeText{'
$compact='      .tiptapShell.compact .richEditorBody{min-height:180px!important;font-size:16px!important;line-height:1.7!important;padding:16px}.tiptapShell.compact .richToolbar button{height:35px;padding:0 9px}`r`n'+$needle
$compact=$compact.Replace('`r`n',[Environment]::NewLine)
if(-not $editor.Contains($needle)){throw 'Large text CSS marker not found'};$editor=$editor.Replace($needle,$compact)
[IO.File]::WriteAllText($editorPath,$editor,[Text.UTF8Encoding]::new($false))

$pagePath=Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx';$page=[IO.File]::ReadAllText($pagePath)
$page=$page.Replace('import BookPageBuilder from"./books/BookPageBuilder";','import BookPageBuilder from"./books/BookPageBuilder";' + "`r`n" + 'import RichTextEditor from"./islamic-lifestyle/RichTextEditor";')
$old='<label className="bookWide">Description<textarea value={bookForm.description} onChange={e=>setBookForm({...bookForm,description:e.target.value})}/></label>'
$new='<div className="bookWide bookDescriptionEditor"><label>Description</label><RichTextEditor value={bookForm.description||""} onChange={description=>setBookForm({...bookForm,description})} api={api.replace(/\/$/,"")} token={token} onMessage={setBookMessage} recordId={`book-description:${bookForm.slug||"new"}:${bookForm.languageCode}`} compact/></div>'
if(-not $page.Contains($old)){throw 'Book description textarea not found'};$page=$page.Replace($old,$new)
[IO.File]::WriteAllText($pagePath,$page,[Text.UTF8Encoding]::new($false))

$mobilePath=Join-Path $PSScriptRoot '..\src\screens\BookReaderScreen.tsx';$mobile=[IO.File]::ReadAllText($mobilePath)
$oldMobile='{book.description ? <Text style={styles.description}>{book.description}</Text> : null}'
$newMobile='{book.description ? <RenderHTML contentWidth={width-90} source={{html:/<[a-z][\s\S]*>/i.test(book.description)?book.description:`<p>${book.description.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>`}} baseStyle={styles.description} tagsStyles={{h1:{color:GREEN},h2:{color:GREEN},h3:{color:GREEN},h4:{color:GREEN},blockquote:{backgroundColor:"#FFF8DF",borderLeftColor:"#D0AD45",borderLeftWidth:4,padding:10},a:{color:GREEN,fontWeight:"700"}}}/> : null}'
if(-not $mobile.Contains($oldMobile)){throw 'Mobile book description not found'};$mobile=$mobile.Replace($oldMobile,$newMobile)
[IO.File]::WriteAllText($mobilePath,$mobile,[Text.UTF8Encoding]::new($false))

$serverPaths=@((Join-Path $PSScriptRoot '..\server\src\admin-panel\index.js'),(Join-Path $PSScriptRoot '..\server\src\books-admin.js'))
foreach($serverPath in $serverPaths){$server=[IO.File]::ReadAllText($serverPath);$server=$server.Replace('description:txt(req.body.description,800)','description:txt(req.body.description,10000)').Replace('description:text(req.body.description,800)','description:text(req.body.description,10000)');[IO.File]::WriteAllText($serverPath,$server,[Text.UTF8Encoding]::new($false))}
