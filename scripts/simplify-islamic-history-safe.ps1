$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
$path=Join-Path $projectRoot 'src\screens\IslamicHistoryScreen.tsx'
$source=[IO.File]::ReadAllText($path)
$source=[regex]::Replace($source,"\s*\{id:'origins'.*?\},\r?\n",[Environment]::NewLine,1)
$source=[regex]::Replace($source,"range:'610[^']*',title:'The Makkan Period',subtitle:'Revelation and early Muslims'","range:'610-622 CE',title:'The Beginning of Islam',subtitle:'First revelation and the Makkan mission'",1)
$source=[regex]::Replace($source,"range:'18th c\.[^']*'","range:'18th century-Today'",1)
$source=$source.Replace('From the beginning to the present','From the first revelation to today')
$source=$source.Replace('Study each period in order. Open an era to see its chapters and continue learning step by step.','Follow Islamic history from the first revelation in 610 CE through every major period to the Muslim world today.')
$source=$source.Replace('<View style={s.timelineRail}/><View style={[s.timelineNode,{borderColor:color}]}><View style={[s.timelineNodeCore,{backgroundColor:color}]}/></View>','')
$source=[regex]::Replace($source,"cardWrap:\{width:'100%',paddingLeft:34,paddingBottom:14\},timelineRail:\{.*?\},timelineNodeCore:\{.*?\},","cardWrap:{width:'100%',paddingBottom:14},",1)
[IO.File]::WriteAllText($path,$source,[Text.UTF8Encoding]::new($false))
