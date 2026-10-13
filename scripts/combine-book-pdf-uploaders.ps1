$path=Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx';$content=[IO.File]::ReadAllText($path)
$content=$content.Replace('import BookPageBuilder from"./books/BookPageBuilder";','import BookPageBuilder from"./books/BookPageBuilder";' + "`r`n" + 'import BookPdfUploader from"./books/BookPdfUploader";')
$single='<label className="bookWide pdfUploader">Convert PDF to MongoDB text<input type="file" accept="application/pdf,.pdf" disabled={pdfLoading} onChange={e=>{void extractPdf(e.target.files?.[0]||null);e.currentTarget.value=""}}/><small>{pdfLoading?"OCR is reading every page. Large scanned PDFs may take several minutes.":"Upload a PDF to extract its text. The PDF itself is not saved; scanned pages use OCR. Maximum 25 MB."}</small></label>'
$batch='<label className="bookWide pdfUploader batchUploader">Batch upload books for {bookForm.language}<input type="file" accept="application/pdf,.pdf" multiple disabled={batchLoading} onChange={e=>{void batchImportPdfs(e.target.files);e.currentTarget.value=""}}/><small>{batchLoading?"Converting and saving books one by one...":"Select multiple PDFs. Every PDF will be converted to text and saved under the selected language."}</small></label>'
$combined='<BookPdfUploader language={bookForm.language} singleLoading={pdfLoading} batchLoading={batchLoading} onSingle={file=>void extractPdf(file)} onBatch={files=>void batchImportPdfs(files)}/>'
if(-not $content.Contains($single)){throw 'Single PDF uploader not found'}
if(-not $content.Contains($batch)){throw 'Batch PDF uploader not found'}
$content=$content.Replace($single+$batch,$combined)
[IO.File]::WriteAllText($path,$content,[Text.UTF8Encoding]::new($false))
