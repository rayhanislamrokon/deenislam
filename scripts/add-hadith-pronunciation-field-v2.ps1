$apiPath=Join-Path $PSScriptRoot '..\server\src\hadith-admin.js';$api=Get-Content $apiPath -Raw -Encoding utf8
$api=$api.Replace('arabic:clean(b.arabic,20000),text:clean(b.text,30000)','arabic:clean(b.arabic,20000),pronunciation:clean(b.pronunciation,20000),text:clean(b.text,30000)')
$api=$api.Replace('arabic:row.arabic,by:t?.narrator','arabic:row.arabic,pronunciation:t?.pronunciation||row.pronunciation||"",by:t?.narrator')
Set-Content $apiPath $api -NoNewline -Encoding utf8
$pagePath=Join-Path $PSScriptRoot '..\admin-panel\app\hadith\page.tsx';$page=Get-Content $pagePath -Raw -Encoding utf8
$page=$page.Replace("title:'',arabic:'',text:''","title:'',arabic:'',pronunciation:'',text:''")
$needle=@'
<label className="wide">{language==='en'?'English Hadith text':'Translated Hadith text'}
'@
$field=@'
<label className="wide">Hadith pronunciation<textarea className="pronunciation" value={form.pronunciation||""} onChange={e=>set("pronunciation",e.target.value)} placeholder={language==="bn"?"Enter Bengali pronunciation...":"Write pronunciation in the selected language..."}/></label>
'@
$page=$page.Replace($needle.Trim(),$field.Trim()+$needle.Trim())
$page=$page.Replace('.story{min-height:170px}', '.pronunciation{min-height:90px;background:#fffaf0;border-color:#dfcf9e}.story{min-height:170px}')
Set-Content $pagePath $page -NoNewline -Encoding utf8
$readerPath=Join-Path $PSScriptRoot '..\src\screens\HadithReaderScreen.tsx';$reader=Get-Content $readerPath -Raw -Encoding utf8
$reader=$reader.Replace('explanationSource?:string};','explanationSource?:string;pronunciation?:string};')
$old=@'
const pronunciation=item.arabic?transliterate(item.arabic):'';
'@
$new=@'
const pronunciation=item.pronunciation||(item.arabic?transliterate(item.arabic):'');
'@
$reader=$reader.Replace($old.Trim(),$new.Trim())
Set-Content $readerPath $reader -NoNewline -Encoding utf8
