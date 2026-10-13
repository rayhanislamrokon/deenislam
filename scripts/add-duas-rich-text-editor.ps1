$adminPath=Join-Path $PSScriptRoot '..\admin-panel\app\duas\page.tsx';$admin=[IO.File]::ReadAllText($adminPath)
$admin=$admin.Replace('import{DUA_PRESETS}from"../../../app/src/data/zikrPresets";','import{DUA_PRESETS}from"../../../app/src/data/zikrPresets";' + "`r`n" + 'import RichTextEditor from"../islamic-lifestyle/RichTextEditor";')
$old='<label className="wide">Meaning<textarea required className="meaning" value={form.meaning} onChange={e=>set("meaning",e.target.value)}/></label>'
$new='<div className="wide meaningEditor"><label>Meaning</label><RichTextEditor value={form.meaning||""} onChange={html=>set("meaning",html)} api={API} token={token} onMessage={setMessage} recordId={`dua:${form.id||form.key||"new"}:${language}`}/></div>'
if(-not $admin.Contains($old)){throw 'Dua meaning textarea not found'};$admin=$admin.Replace($old,$new)
$admin=$admin.Replace('.meaning{min-height:150px}', '.meaning{min-height:150px}.meaningEditor{display:grid;gap:6px}.meaningEditor :global(.richEditorBody){min-height:300px}')
[IO.File]::WriteAllText($adminPath,$admin,[Text.UTF8Encoding]::new($false))

$mobilePath=Join-Path $PSScriptRoot '..\src\screens\DuasCollectionScreen.tsx';$mobile=[IO.File]::ReadAllText($mobilePath)
$mobile=$mobile.Replace("import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';","import { Dimensions, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';`r`nimport RenderHTML from 'react-native-render-html';")
$oldMeaning='<View style={s.section}><Text style={s.fieldLabel}>MEANING</Text><Text style={s.meaning}>{dua.meaning}</Text></View>'
$newMeaning='<View style={s.section}><Text style={s.fieldLabel}>MEANING</Text><RenderHTML contentWidth={Dimensions.get("window").width-66} source={{html:/<[a-z][\s\S]*>/i.test(dua.meaning)?dua.meaning:`<p>${String(dua.meaning||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br/>")}</p>`}} baseStyle={s.meaning} tagsStyles={{h1:{color:GREEN},h2:{color:GREEN},h3:{color:GREEN},h4:{color:GREEN},blockquote:{backgroundColor:"#FFF8DF",borderLeftColor:"#D0AD45",borderLeftWidth:4,borderRadius:8,padding:12},a:{color:GREEN,fontWeight:"700"},img:{borderRadius:12}}}/></View>'
if(-not $mobile.Contains($oldMeaning)){throw 'Mobile Dua meaning renderer not found'};$mobile=$mobile.Replace($oldMeaning,$newMeaning)
[IO.File]::WriteAllText($mobilePath,$mobile,[Text.UTF8Encoding]::new($false))
