$path=Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx';$content=[IO.File]::ReadAllText($path)
$content=$content.Replace('import RichTextEditor from"./islamic-lifestyle/RichTextEditor";','import BookPageBuilder from"./books/BookPageBuilder";')
$old='<div className="bookWide bookRichEditor"><label>Complete book text</label><RichTextEditor value={bookForm.content||""} onChange={html=>setBookForm({...bookForm,content:html,pages:[]})} api={api.replace(/\/$/,"")} token={token} onMessage={setBookMessage} recordId={`book:${bookForm.slug||"new"}:${bookForm.languageCode}`}/></div>'
$new='<BookPageBuilder pages={bookForm.pages||[]} content={bookForm.content||""} api={api.replace(/\/$/,"")} token={token} language={bookForm.language} recordId={`book:${bookForm.slug||"new"}:${bookForm.languageCode}`} onMessage={setBookMessage} onChange={(pages,content)=>setBookForm({...bookForm,pages,content})}/>'
if(-not $content.Contains($old)){throw 'Existing book rich editor not found'};$content=$content.Replace($old,$new)
[IO.File]::WriteAllText($path,$content,[Text.UTF8Encoding]::new($false))
