$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$screenPath=Join-Path $projectRoot 'src\screens\DownloadedLibraryScreen.tsx'
$text=[IO.File]::ReadAllText($screenPath)
$text=$text.Replace("[active,setActive]=useState<OfflineSection>('quran')","[active,setActive]=useState<OfflineSection|null>(null)")
$text=$text.Replace("const shown=items.filter(item=>item.section===active);","const shown=active?items.filter(item=>item.section===active):[];")
$start='<View style={s.categoryGrid}>{OFFLINE_SECTIONS.map'
if(-not $text.Contains($start)){throw 'Category grid start not found.'};$text=$text.Replace($start,'{active===null?<View style={s.categoryGrid}>{OFFLINE_SECTIONS.map')
$middle='})}</View><View style={s.listHead}><Text style={s.listTitle}>{sectionNames[active]}</Text><Text style={s.listCount}>{shown.length} saved item{shown.length===1?'''':'''s'''}</Text></View>'
$middleNew='})}</View>:<><View style={s.listHead}><Pressable onPress={()=>setActive(null)} style={s.categoriesBack}><Text style={s.categoriesBackText}>{''\u2039''} Categories</Text></Pressable><View><Text style={s.listTitle}>{sectionNames[active]}</Text><Text style={s.listCount}>{shown.length} saved item{shown.length===1?'''':'''s'''}</Text></View></View>'
if(-not $text.Contains($middle)){throw 'Category grid end not found.'};$text=$text.Replace($middle,$middleNew)
$end='</View>}</ScrollView></SafeAreaView>;'
if(-not $text.Contains($end)){throw 'Selected category view end not found.'};$text=$text.Replace($end,'</View>}</>}</ScrollView></SafeAreaView>;')
$text=[regex]::Replace($text,'<Text style=\{\[s\.categoryArrow,active===section\.id&&s\.categoryArrowOn\]\}>.*?</Text>',"<Text style={[s.categoryArrow,active===section.id&&s.categoryArrowOn]}>{'\u203A'}</Text>")
$text=[regex]::Replace($text,'<Text style=\{s\.emptyArrow\}>.*?</Text>',"<Text style={s.emptyArrow}>{'\u2193'}</Text>")
$text=$text.Replace("categoryCard:{width:'48.5%',minHeight:148","categoryCard:{width:'48.5%',minHeight:126")
$text=$text.Replace("listHead:{marginBottom:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}","listHead:{marginTop:14,marginBottom:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},categoriesBack:{height:38,paddingHorizontal:12,borderRadius:12,backgroundColor:'#E8F5EC',alignItems:'center',justifyContent:'center'},categoriesBackText:{fontSize:10,fontWeight:'800',color:G}")
$text=$text.Replace("empty:{marginTop:65","empty:{marginTop:28")
[IO.File]::WriteAllText($screenPath,$text)
