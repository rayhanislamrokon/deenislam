$adminPath=Join-Path $PSScriptRoot '..\admin-panel\app\duas\page.tsx';$admin=[IO.File]::ReadAllText($adminPath)
$old='<label className="wide">Pronunciation<textarea value={form.pronunciation} onChange={e=>set("pronunciation",e.target.value)}/></label>'
$new='<div className="wide pronunciationEditor"><label>Pronunciation</label><RichTextEditor value={form.pronunciation||""} onChange={html=>set("pronunciation",html)} api={API} token={token} onMessage={setMessage} recordId={`dua-pronunciation:${form.id||form.key||"new"}:${language}`}/></div>'
if(-not $admin.Contains($old)){throw 'Dua pronunciation textarea not found'};$admin=$admin.Replace($old,$new)
$admin=$admin.Replace('.meaningEditor{display:grid;gap:6px}', '.pronunciationEditor,.meaningEditor{display:grid;gap:6px}.pronunciationEditor :global(.richEditorBody){min-height:220px}.meaningEditor{display:grid;gap:6px}')
[IO.File]::WriteAllText($adminPath,$admin,[Text.UTF8Encoding]::new($false))

$mobilePath=Join-Path $PSScriptRoot '..\src\screens\DuasCollectionScreen.tsx';$mobile=[IO.File]::ReadAllText($mobilePath)
$oldPronunciation='<View style={s.section}><Text style={s.fieldLabel}>PRONUNCIATION</Text><Text style={s.pronunciation}>{dua.pronunciation}</Text></View>'
$newPronunciation='<View style={s.section}><Text style={s.fieldLabel}>PRONUNCIATION</Text><RenderHTML contentWidth={Dimensions.get("window").width-66} source={{html:/<[a-z][\s\S]*>/i.test(dua.pronunciation)?dua.pronunciation:`<p>${String(dua.pronunciation||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br/>")}</p>`}} baseStyle={s.pronunciation} tagsStyles={{h1:{color:GREEN},h2:{color:GREEN},h3:{color:GREEN},h4:{color:GREEN},blockquote:{backgroundColor:"#F0F8F3",borderLeftColor:GREEN,borderLeftWidth:4,borderRadius:8,padding:12},a:{color:GREEN,fontWeight:"700"},img:{borderRadius:12}}}/></View>'
if(-not $mobile.Contains($oldPronunciation)){throw 'Mobile pronunciation text not found'};$mobile=$mobile.Replace($oldPronunciation,$newPronunciation)
[IO.File]::WriteAllText($mobilePath,$mobile,[Text.UTF8Encoding]::new($false))
