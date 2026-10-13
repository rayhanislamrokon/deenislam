$adminPath=Join-Path $PSScriptRoot '..\admin-panel\app\hadith\page.tsx';$admin=[IO.File]::ReadAllText($adminPath)
$oldPron='<label className="wide">Hadith pronunciation<textarea className="pronunciation" value={form.pronunciation||""} onChange={e=>set("pronunciation",e.target.value)} placeholder={language==="bn"?"Enter Bengali pronunciation...":"Write pronunciation in the selected language..."}/></label>'
$newPron='<div className="wide pronunciationEditor"><label>Hadith pronunciation</label><RichTextEditor value={form.pronunciation||""} onChange={html=>set("pronunciation",html)} api={API} token={token} onMessage={setMessage} recordId={`hadith-pronunciation:${form.id||form.collectionId+":"+form.hadithNumber}:${language}`}/></div>'
if(-not $admin.Contains($oldPron)){throw 'Hadith pronunciation textarea not found'};$admin=$admin.Replace($oldPron,$newPron)
$oldText='<label className="wide">{language===''en''?''English Hadith text'':''Translated Hadith text''}<textarea required className="story" value={form.text} onChange={e=>set(''text'',e.target.value)}/></label>'
$newText='<div className="wide hadithTextEditor"><label>{language==="en"?"English Hadith text":"Translated Hadith text"}</label><RichTextEditor value={form.text||""} onChange={html=>set("text",html)} api={API} token={token} onMessage={setMessage} recordId={`hadith-text:${form.id||form.collectionId+":"+form.hadithNumber}:${language}`}/></div>'
if(-not $admin.Contains($oldText)){throw 'Hadith text textarea not found'};$admin=$admin.Replace($oldText,$newText)
$admin=$admin.Replace('.explanationEditor{display:grid;gap:6px}', '.pronunciationEditor,.hadithTextEditor,.explanationEditor{display:grid;gap:6px}.pronunciationEditor :global(.richEditorBody){min-height:220px}.hadithTextEditor :global(.richEditorBody){min-height:320px}.explanationEditor{display:grid;gap:6px}')
[IO.File]::WriteAllText($adminPath,$admin,[Text.UTF8Encoding]::new($false))

$mobilePath=Join-Path $PSScriptRoot '..\src\screens\HadithReaderScreen.tsx';$mobile=[IO.File]::ReadAllText($mobilePath)
$oldPronRender='<Text style={s.pronunciation}>{pronunciation}</Text>'
$newPronRender='<RenderHTML contentWidth={width-80} source={{html:/<[a-z][\s\S]*>/i.test(pronunciation)?pronunciation:`<p>${pronunciation.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br/>")}</p>`}} baseStyle={s.pronunciation} tagsStyles={{h1:{color:GREEN},h2:{color:GREEN},h3:{color:GREEN},h4:{color:GREEN},blockquote:{backgroundColor:"#F0F8F3",borderLeftColor:GREEN,borderLeftWidth:4,borderRadius:8,padding:12},a:{color:GREEN,fontWeight:"700"},img:{borderRadius:12}}}/>'
if(-not $mobile.Contains($oldPronRender)){throw 'Mobile Hadith pronunciation renderer not found'};$mobile=$mobile.Replace($oldPronRender,$newPronRender)
$oldTextRender='<Text style={s.translation}>{item.text}</Text>'
$newTextRender='<RenderHTML contentWidth={width-50} source={{html:/<[a-z][\s\S]*>/i.test(item.text)?item.text:`<p>${item.text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br/>")}</p>`}} baseStyle={s.translation} tagsStyles={{h1:{color:GREEN},h2:{color:GREEN},h3:{color:GREEN},h4:{color:GREEN},blockquote:{backgroundColor:"#FFF8DF",borderLeftColor:"#D0AD45",borderLeftWidth:4,borderRadius:8,padding:12},a:{color:GREEN,fontWeight:"700"},img:{borderRadius:12}}}/>'
if(-not $mobile.Contains($oldTextRender)){throw 'Mobile Hadith text renderer not found'};$mobile=$mobile.Replace($oldTextRender,$newTextRender)
[IO.File]::WriteAllText($mobilePath,$mobile,[Text.UTF8Encoding]::new($false))
