$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$screenPath=Join-Path $projectRoot 'src\screens\DownloadedLibraryScreen.tsx'
$appPath=Join-Path $projectRoot 'App.tsx'
$text=[IO.File]::ReadAllText($screenPath)
$text=$text.Replace("formatDownloadSize,listDownloads,removeDownload,type OfflineSection","formatDownloadSize,listDownloads,OFFLINE_SECTIONS,removeDownload,type OfflineSection")
$text=$text.Replace("type Item={id:string;section:OfflineSection;title:string;subtitle:string;size?:number;date?:string;remove:()=>Promise<void>};","type Item={id:string;section:OfflineSection;title:string;subtitle:string;kind?:'surah'|'juz';number?:number;size?:number;date?:string;remove:()=>Promise<void>};")
$text=$text.Replace("export function DownloadedLibraryScreen({language,onBack,onOpenQuran}:{language:string;onBack:()=>void;onOpenQuran:()=>void})","export function DownloadedLibraryScreen({language,onBack,onOpenQuran,onReadSurah,onListenSurah,onReadJuz}:{language:string;onBack:()=>void;onOpenQuran:()=>void;onReadSurah:(number:number)=>void;onListenSurah:(number:number)=>void;onReadJuz:(number:number)=>void})")
$text=$text.Replace("[active,setActive]=useState<'all'|OfflineSection>('all')","[active,setActive]=useState<OfflineSection>('quran')")
$text=$text.Replace("id:`surah-${row.key}`,section:'quran' as const,title:","id:`surah-${row.key}`,section:'quran' as const,kind:'surah' as const,number:row.surahNumber,title:")
$text=$text.Replace("id:`juz-${number}`,section:'quran' as const,title:","id:`juz-${number}`,section:'quran' as const,kind:'juz' as const,number,title:")
$text=$text.Replace("const shown=active==='all'?items:items.filter(item=>item.section===active);","const shown=items.filter(item=>item.section===active);")
$tabsPattern='\{items\.length>0\?<ScrollView horizontal.*?</ScrollView>:null\}'
$cards=@'
<View style={s.categoryGrid}>{OFFLINE_SECTIONS.map(section=>{const count=items.filter(item=>item.section===section.id).length;return <Pressable key={section.id} onPress={()=>setActive(section.id)} style={[s.categoryCard,active===section.id&&s.categoryCardOn]}><View style={[s.categoryIcon,active===section.id&&s.categoryIconOn]}><Text style={[s.categoryLetter,active===section.id&&s.categoryLetterOn]}>{section.title.slice(0,1)}</Text></View><View style={s.categoryCopy}><Text numberOfLines={1} style={[s.categoryTitle,active===section.id&&s.categoryTitleOn]}>{section.title}</Text><Text style={[s.categoryCount,active===section.id&&s.categoryCountOn]}>{count} downloaded</Text></View><Text style={[s.categoryArrow,active===section.id&&s.categoryArrowOn]}>›</Text></Pressable>})}</View><View style={s.listHead}><Text style={s.listTitle}>{sectionNames[active]}</Text><Text style={s.listCount}>{shown.length} saved item{shown.length===1?'':'s'}</Text></View>
'@
$next=[regex]::Replace($text,$tabsPattern,$cards)
if($next -eq $text){throw 'Old category tabs were not found.'};$text=$next
$oldAction="{item.section==='quran'?<Pressable onPress={onOpenQuran} style={s.open}><Text style={s.openText}>Open</Text></Pressable>:<View style={s.actionSpace}/>}<Pressable onPress={()=>remove(item)} style={s.remove}><Text style={s.removeText}>Remove</Text></Pressable>"
$newAction="{item.kind==='surah'&&item.number?<><Pressable onPress={()=>onReadSurah(item.number!)} style={s.open}><Text style={s.openText}>Read</Text></Pressable><Pressable onPress={()=>onListenSurah(item.number!)} style={s.listen}><Text style={s.listenText}>Listen</Text></Pressable></>:item.kind==='juz'&&item.number?<Pressable onPress={()=>onReadJuz(item.number!)} style={s.open}><Text style={s.openText}>Read</Text></Pressable>:<Pressable onPress={onOpenQuran} style={s.open}><Text style={s.openText}>Open</Text></Pressable>}<Pressable onPress={()=>remove(item)} style={s.remove}><Text style={s.removeText}>Remove</Text></Pressable>"
if(-not $text.Contains($oldAction)){throw 'Downloaded item actions were not found.'};$text=$text.Replace($oldAction,$newAction)
$styleAnchor="tabs:{gap:8,paddingVertical:14}"
$newStyles="categoryGrid:{paddingVertical:14,flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:9},categoryCard:{width:'48.5%',minHeight:64,padding:9,borderRadius:16,borderWidth:1,borderColor:'#DCE9E0',backgroundColor:'#FFF',flexDirection:'row',alignItems:'center'},categoryCardOn:{borderColor:G,backgroundColor:'#0B704B'},categoryIcon:{width:36,height:36,borderRadius:12,backgroundColor:'#E9F6ED',alignItems:'center',justifyContent:'center'},categoryIconOn:{backgroundColor:'#FFF'},categoryLetter:{fontSize:14,fontWeight:'900',color:G},categoryLetterOn:{color:G},categoryCopy:{flex:1,marginLeft:8},categoryTitle:{fontSize:10.5,fontWeight:'800',color:INK},categoryTitleOn:{color:'#FFF'},categoryCount:{marginTop:3,fontSize:8,color:'#7A887F'},categoryCountOn:{color:'#D8F0E1'},categoryArrow:{fontSize:20,color:G},categoryArrowOn:{color:'#FFF'},listHead:{marginBottom:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},listTitle:{fontSize:18,fontWeight:'800',color:INK},listCount:{fontSize:9.5,color:'#718078'},tabs:{gap:8,paddingVertical:14}"
if(-not $text.Contains($styleAnchor)){throw 'Download styles anchor not found.'};$text=$text.Replace($styleAnchor,$newStyles)
$text=$text.Replace("openText:{fontSize:10,fontWeight:'800',color:'#FFF'},remove:","openText:{fontSize:10,fontWeight:'800',color:'#FFF'},listen:{flex:1,height:34,borderRadius:10,backgroundColor:'#E8F5EC',alignItems:'center',justifyContent:'center'},listenText:{fontSize:9,fontWeight:'800',color:G},remove:")
[IO.File]::WriteAllText($screenPath,$text)

$app=[IO.File]::ReadAllText($appPath)
$oldRender="<DownloadedLibraryScreen language={selectedLanguage} onBack={() => setScreen('home')} onOpenQuran={() => { setContentReturnScreen('downloads'); setScreen('quran'); }} />"
$newRender="<DownloadedLibraryScreen language={selectedLanguage} onBack={() => setScreen('home')} onOpenQuran={() => { setContentReturnScreen('downloads'); setScreen('quran'); }} onReadSurah={(number) => { setSelectedSurah(number); setScreen('surah-reader'); }} onListenSurah={(number) => { setSelectedSurah(number); setAudioReturnScreen('downloads'); setScreen('quran-audio'); }} onReadJuz={(number) => { setSelectedJuz(number); setScreen('juz-reader'); }} />"
if(-not $app.Contains($oldRender)){throw 'Downloaded library route not found.'};$app=$app.Replace($oldRender,$newRender)
$app=$app.Replace("useState<'quran' | 'library'>('quran')","useState<'quran' | 'library' | 'downloads'>('quran')")
[IO.File]::WriteAllText($appPath,$app)
