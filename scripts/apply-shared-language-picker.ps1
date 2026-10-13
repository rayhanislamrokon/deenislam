$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot

function Update-Page([string]$relative,[string]$importPath,[scriptblock]$transform) {
  $path = Join-Path $projectRoot $relative
  $text = [IO.File]::ReadAllText($path)
  if ($text -notmatch 'AdminLanguagePicker') {
    $text = $text.Replace('"use client";', '"use client";' + [Environment]::NewLine + 'import AdminLanguagePicker,{ADMIN_LANGUAGES}from"' + $importPath + '";')
  }
  $text = & $transform $text
  [IO.File]::WriteAllText($path,$text,[Text.UTF8Encoding]::new($false))
}

$fallbackDouble='[{code:"en",label:"English"},{code:"bn",label:"Bengali"},{code:"ar",label:"Arabic"}]'
$fallbackSingle="[{code:'en',label:'English'},{code:'bn',label:'Bengali'},{code:'ar',label:'Arabic'}]"

Update-Page 'admin-panel\app\hadith\page.tsx' '../components/AdminLanguagePicker' {
  param($text)
  $text=$text.Replace($fallbackSingle,'ADMIN_LANGUAGES')
  $pattern='<select value=\{language\} onChange=\{e=>\{const lang=e\.target\.value;setLanguage\(lang\);if\(form\.id\)edit\(items\.find\(x=>x\.id===form\.id\),lang\)\}\}>\{languages\.map\(x=><option.*?</select>'
  [regex]::Replace($text,$pattern,'<AdminLanguagePicker section="Hadith" value={language} onChange={lang=>{setLanguage(lang);if(form.id)edit(items.find(x=>x.id===form.id),lang)}} statusFor={code=>code==="en"?"Original English content · Available":form.id&&items.find(i=>i.id===form.id)?.translations?.[code]?"Translation saved":"Not uploaded yet"}/>',1)
}

Update-Page 'admin-panel\app\duas\page.tsx' '../components/AdminLanguagePicker' {
  param($text)
  $text=$text.Replace($fallbackDouble,'ADMIN_LANGUAGES')
  $pattern='<select value=\{language\} onChange=\{e=>\{const l=e\.target\.value;setLanguage\(l\);if\(form\.id\)edit\(items\.find\(x=>x\.id===form\.id\),l\)\}\}>\{languages\.map\(x=><option.*?</select>'
  [regex]::Replace($text,$pattern,'<AdminLanguagePicker section="Duas" value={language} onChange={l=>{setLanguage(l);if(form.id)edit(items.find(x=>x.id===form.id),l)}} statusFor={code=>code==="en"?"Original English content · Available":form.id&&items.find(i=>i.id===form.id)?.translations?.[code]?"Translation saved":"Not uploaded yet"}/>',1)
}

Update-Page 'admin-panel\app\prophets\page.tsx' '../components/AdminLanguagePicker' {
  param($text)
  $text=$text.Replace($fallbackDouble,'ADMIN_LANGUAGES')
  $pattern='<select value=\{language\} onChange=\{e=>selectLanguage\(e\.target\.value\)\}><option value="en">English \(Base\)</option>\{languages\.filter.*?</select>'
  [regex]::Replace($text,$pattern,'<AdminLanguagePicker section="Prophets" value={language} onChange={selectLanguage} statusFor={code=>code==="en"?"Original English content · Available":items.some(x=>x.translations?.[code])?`${items.filter(x=>x.translations?.[code]).length} Prophets translated`:"Not uploaded yet"}/>',1)
}

Update-Page 'admin-panel\app\islamic-lifestyle\page.tsx' '../components/AdminLanguagePicker' {
  param($text)
  $typed='[{code:"en",label:"English",short:"EN"},{code:"bn",label:"Bengali",short:"BN"},{code:"ar",label:"Arabic",short:"AR"}]'
  $text=$text.Replace($typed,'ADMIN_LANGUAGES')
  $pattern='<select aria-label="Select content language" value=\{language\} onChange=\{e=>selectLanguage\(e\.target\.value\)\}><option value="en">English \(Base\)</option>\{languages\.filter.*?</select>'
  [regex]::Replace($text,$pattern,'<AdminLanguagePicker section="Islamic Lifestyle" value={language} onChange={selectLanguage} statusFor={code=>code==="en"?"Original English content · Available":items.some(x=>x.translations?.[code])?`${items.filter(x=>x.translations?.[code]).length} items translated`:"Not uploaded yet"}/>',1)
}

Update-Page 'admin-panel\app\page.tsx' './components/AdminLanguagePicker' {
  param($text)
  $text=$text.Replace('[bookLanguages,setBookLanguages]=useState<any[]>('+$fallbackDouble+')','[bookLanguages,setBookLanguages]=useState<any[]>(ADMIN_LANGUAGES)')
  $pattern='<select value=\{bookForm\.languageCode\} onChange=\{e=>\{const selected=bookLanguages\.find\(item=>item\.code===e\.target\.value\);setBookForm\(\{\.\.\.bookForm,languageCode:e\.target\.value,language:selected\?\.label\|\|e\.target\.value\.toUpperCase\(\)\}\)\}\}>\{bookLanguages\.map.*?</select>'
  [regex]::Replace($text,$pattern,'<AdminLanguagePicker section="Books" value={bookForm.languageCode} onChange={code=>{const selected=ADMIN_LANGUAGES.find(item=>item.code===code);setBookForm({...bookForm,languageCode:code,language:selected?.label||code.toUpperCase()})}} statusFor={code=>{const count=library.filter(book=>(book.languageCode||"en")===code).length;return count?`${count} ${count===1?"book":"books"} uploaded`:"Not uploaded yet"}}/>',1)
}
