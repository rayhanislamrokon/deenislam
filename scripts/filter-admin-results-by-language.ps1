$path = Join-Path $PSScriptRoot '..\admin-panel\app\islamic-lifestyle\page.tsx'
$content = [IO.File]::ReadAllText((Resolve-Path $path), [Text.Encoding]::UTF8)
$oldDerived = @'
 const categories=items.filter(x=>x.kind==="category");
 const chapters=items.filter(x=>x.kind==="chapter");
 const visibleChapters=chapterFilter==="all"?chapters:chapters.filter(x=>x.parentCategorySlug===chapterFilter);
 const categoryName=(slug:string)=>categories.find(x=>x.slug===slug)?.title||"Unassigned category";
'@
$newDerived = @'
 const activeLanguageName=languages.find(x=>x.code===language)?.label||language.toUpperCase();
 const languageItems=language==="en"?items:items.filter(x=>x.translations?.[language]).map(x=>{const translated=x.translations[language];return{...x,...translated,quran:translated.quran||x.quran,language}});
 const categories=languageItems.filter(x=>x.kind==="category");
 const chapters=languageItems.filter(x=>x.kind==="chapter");
 const visibleChapters=chapterFilter==="all"?chapters:chapters.filter(x=>x.parentCategorySlug===chapterFilter);
 const categoryName=(slug:string)=>categories.find(x=>x.slug===slug)?.title||items.find(x=>x.slug===slug)?.title||"Unassigned category";
'@
if (-not $content.Contains($oldDerived.Trim())) { throw 'Derived items anchor not found' }
$content = $content.Replace($oldDerived.Trim(),$newDerived.Trim())
$content = $content.Replace('<h3>Saved chapter content</h3><p>Preview or edit every chapter published from this admin panel.</p>', '<h3>Saved {activeLanguageName} chapter content</h3><p>{language==="en"?"English base content.":`Only chapters with a saved ${activeLanguageName} translation are shown.`}</p>')
$content = $content.Replace('<b>No chapter content yet</b><span>Select “Chapter inside category” in the form and create the first chapter.</span>', '<b>No {activeLanguageName} chapter content yet</b><span>{language==="en"?"Create the first chapter from the form.":`Choose an existing chapter and add its ${activeLanguageName} translation.`}</span>')
$oldEdit = ' const edit=(x:any)=>{setLanguage("en");setForm(localizedForm(x,"en"));setMessage("Editing English: "+x.title);requestAnimationFrame(()=>formRef.current?.scrollIntoView({behavior:"smooth",block:"start"}))};'
$newEdit = ' const edit=(x:any)=>{setForm(localizedForm(x,language));setMessage(language==="en"?"Editing English: "+x.title:itemLanguageMessage(language));requestAnimationFrame(()=>formRef.current?.scrollIntoView({behavior:"smooth",block:"start"}))};'
if (-not $content.Contains($oldEdit)) { throw 'Edit anchor not found' }
$content = $content.Replace($oldEdit,$newEdit)
$content = $content.Replace('form.id?(items.find(x=>x.id===form.id)?.translations?.[language]?"Saved translation - edit and save changes.":"Translation not added yet - enter localized content below."):"Save English first to unlock translations."', 'form.id?(items.find(x=>x.id===form.id)?.translations?.[language]?"Saved translation - edit and save changes.":"Translation not added yet - enter localized content below."):`Showing saved ${activeLanguageName} results. Choose existing content below to add a translation.`')
[IO.File]::WriteAllText((Resolve-Path $path), $content, [Text.UTF8Encoding]::new($false))
