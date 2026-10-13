$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
$path=Join-Path $projectRoot 'src\screens\IslamicHistoryScreen.tsx'
$source=[IO.File]::ReadAllText($path)
$returnStart=$source.IndexOf(' return <Animated.View')
$returnEnd=$source.IndexOf(";`n}",$returnStart)
if($returnStart -lt 0 -or $returnEnd -lt 0){throw 'EraCard return block not found.'}
$newReturn=@'
 return <Animated.View style={[s.cardWrap,{opacity:entrance,transform:[{translateY:entrance.interpolate({inputRange:[0,1],outputRange:[18,0]})},{scale:press}]}]}><View style={s.timelineRail}/><View style={[s.timelineNode,{borderColor:color}]}><View style={[s.timelineNodeCore,{backgroundColor:color}]}/></View><Pressable onPress={onOpen} onPressIn={()=>animatePress(.975)} onPressOut={()=>animatePress(1)} style={s.card}><View style={s.cardTop}><View><Text style={[s.eraLabel,{color}]}>ERA {String(index+1).padStart(2,'0')}</Text><Text style={s.range}>{era.range}</Text></View><View style={[s.openCircle,{backgroundColor:color+'14'}]}><Text style={[s.openArrow,{color}]}>{'\u203A'}</Text></View></View><Text style={s.cardTitle}>{era.title}</Text><Text style={s.cardSubtitle}>{era.subtitle}</Text><Text numberOfLines={2} style={s.cardSummary}>{era.summary}</Text><View style={s.cardFoot}><View style={[s.chapterPill,{backgroundColor:color+'12'}]}><View style={[s.dot,{backgroundColor:color}]}/><Text style={[s.chapterCount,{color}]}>{era.topics.length} chapters</Text></View><Text style={[s.exploreText,{color}]}>Explore era {'\u203A'}</Text></View></Pressable></Animated.View>
'@
$source=$source.Substring(0,$returnStart)+$newReturn+$source.Substring($returnEnd)
$styleStart=$source.IndexOf("grid:{")
$styleEnd=$source.IndexOf("note:{",$styleStart)
if($styleStart -lt 0 -or $styleEnd -lt 0){throw 'History card styles not found.'}
$newStyles=@'
grid:{gap:0},cardWrap:{width:'100%',paddingLeft:34,paddingBottom:14},timelineRail:{position:'absolute',left:10,top:0,bottom:0,width:2,backgroundColor:'#DDE7E0'},timelineNode:{position:'absolute',left:1,top:22,width:20,height:20,borderRadius:10,borderWidth:2,alignItems:'center',justifyContent:'center',backgroundColor:'#F8F7F1'},timelineNodeCore:{width:8,height:8,borderRadius:4},card:{minHeight:176,padding:17,borderRadius:19,borderWidth:1,borderColor:'#DCE5DE',backgroundColor:'#fff',shadowColor:'#173D30',shadowOpacity:.09,shadowRadius:9,shadowOffset:{width:0,height:4},elevation:3},cardTop:{flexDirection:'row',alignItems:'flex-start'},eraLabel:{fontSize:9,fontWeight:'900',letterSpacing:1.1},range:{marginTop:4,fontSize:10,fontWeight:'700',color:'#7A867F'},openCircle:{marginLeft:'auto',width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center'},openArrow:{marginTop:-2,fontSize:25},cardTitle:{marginTop:11,fontFamily:'serif',fontSize:21,lineHeight:25,fontWeight:'800',color:INK},cardSubtitle:{marginTop:3,fontSize:11,fontWeight:'700',color:'#52675D'},cardSummary:{marginTop:8,fontSize:11,lineHeight:17,color:'#78867E'},cardFoot:{marginTop:14,paddingTop:12,flexDirection:'row',alignItems:'center',borderTopWidth:1,borderTopColor:'#EEF1ED'},chapterPill:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:9,paddingVertical:6,borderRadius:999},chapterCount:{fontSize:9,fontWeight:'900'},dot:{width:6,height:6,borderRadius:3},exploreText:{marginLeft:'auto',fontSize:10,fontWeight:'900'},
'@
$source=$source.Substring(0,$styleStart)+$newStyles+$source.Substring($styleEnd)
[IO.File]::WriteAllText($path,$source,[Text.UTF8Encoding]::new($false))
