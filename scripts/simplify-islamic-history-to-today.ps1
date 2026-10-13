$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
$path=Join-Path $projectRoot 'src\screens\IslamicHistoryScreen.tsx'
$source=[IO.File]::ReadAllText($path)

$preIslam=" {id:'origins',range:'Before 610 CE',title:'Arabia Before Islam',subtitle:'Society, faith and Makkah',summary:'The religious, social and political setting of Arabia before the first revelation.',topics:['Ancient Arabia and its tribes','The Kaaba and Makkah','Arab beliefs and society','The Year of the Elephant']},"+[Environment]::NewLine
$source=$source.Replace($preIslam,'')
$source=$source.Replace("range:'610–622 CE',title:'The Makkan Period',subtitle:'Revelation and early Muslims'","range:'610-622 CE',title:'The Beginning of Islam',subtitle:'First revelation and the Makkan mission'")
$source=$source.Replace("range:'18th c.–Today'","range:'18th century-Today'")
$source=$source.Replace("From the beginning to the present","From the first revelation to today")
$source=$source.Replace("Study each period in order. Open an era to see its chapters and continue learning step by step.","Follow Islamic history from the first revelation in 610 CE through every major period to the Muslim world today.")
$source=$source.Replace('<View style={s.timelineRail}/><View style={[s.timelineNode,{borderColor:color}]}><View style={[s.timelineNodeCore,{backgroundColor:color}]}/></View>','')
$source=$source.Replace("cardWrap:{width:'100%',paddingLeft:34,paddingBottom:14},timelineRail:{position:'absolute',left:10,top:0,bottom:0,width:2,backgroundColor:'#DDE7E0'},timelineNode:{position:'absolute',left:1,top:22,width:20,height:20,borderRadius:10,borderWidth:2,alignItems:'center',justifyContent:'center',backgroundColor:'#F8F7F1'},timelineNodeCore:{width:8,height:8,borderRadius:4},","cardWrap:{width:'100%',paddingBottom:14},")

[IO.File]::WriteAllText($path,$source,[Text.UTF8Encoding]::new($false))
