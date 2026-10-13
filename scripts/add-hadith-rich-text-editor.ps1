$adminPath = Join-Path $PSScriptRoot '..\admin-panel\app\hadith\page.tsx'
$admin = [IO.File]::ReadAllText($adminPath)
$admin = $admin.Replace('import {transliterate} from"transliteration";', 'import {transliterate} from"transliteration";' + "`r`n" + 'import RichTextEditor from"../islamic-lifestyle/RichTextEditor";')
$oldEditor = '<label className="wide">Explanation<textarea value={form.explanation} onChange={e=>set(''explanation'',e.target.value)}/></label>'
$newEditor = '<div className="wide explanationEditor"><label>Explanation</label><RichTextEditor value={form.explanation||""} onChange={html=>set("explanation",html)} api={API} token={token} onMessage={setMessage} recordId={`hadith:${form.id||form.collectionId+":"+form.hadithNumber}:${language}`}/></div>'
if (-not $admin.Contains($oldEditor)) { throw 'Hadith explanation textarea not found.' }
$admin = $admin.Replace($oldEditor,$newEditor)
$admin = $admin.Replace('.story{min-height:170px}', '.story{min-height:170px}.explanationEditor{display:grid;gap:6px}.explanationEditor :global(.richEditorBody){min-height:280px}')
[IO.File]::WriteAllText($adminPath,$admin,[Text.UTF8Encoding]::new($false))

$readerPath = Join-Path $PSScriptRoot '..\src\screens\HadithReaderScreen.tsx'
$reader = [IO.File]::ReadAllText($readerPath)
$reader = $reader.Replace("import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';", "import {Pressable,ScrollView,StyleSheet,Text,useWindowDimensions,View} from 'react-native';`r`nimport RenderHTML from 'react-native-render-html';")
$reader = $reader.Replace("export function HadithReaderScreen({collection,item,items,saved,onSave,onBack,onChange}:Props){`r`n const index=", "export function HadithReaderScreen({collection,item,items,saved,onSave,onBack,onChange}:Props){`r`n const {width}=useWindowDimensions();`r`n const index=")
$oldRender = '<Text style={[s.explanationText,commentaryLanguage===''Arabic''&&s.arabicCommentary]}>{explanation}</Text>'
$newRender = '<RenderHTML contentWidth={width-80} source={{html:/<[a-z][\s\S]*>/i.test(explanation)?explanation:`<p>${explanation.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br/>")}</p>`}} baseStyle={commentaryLanguage==="Arabic"?s.arabicCommentary:s.explanationText} tagsStyles={{h1:{color:GREEN},h2:{color:GREEN},h3:{color:GREEN},h4:{color:GREEN},blockquote:{backgroundColor:"#FFF8DF",borderLeftColor:"#D0AD45",borderLeftWidth:4,borderRadius:8,padding:12},a:{color:GREEN,fontWeight:"700"},img:{borderRadius:12}}}/>'
if (-not $reader.Contains($oldRender)) { throw 'Mobile explanation text renderer not found.' }
$reader = $reader.Replace($oldRender,$newRender)
[IO.File]::WriteAllText($readerPath,$reader,[Text.UTF8Encoding]::new($false))
