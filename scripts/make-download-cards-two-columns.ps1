$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$screenPath=Join-Path $projectRoot 'src\screens\DownloadsScreen.tsx'
$text=[IO.File]::ReadAllText($screenPath)
$start='{OFFLINE_SECTIONS.map(section=>'
if(-not $text.Contains($start)){throw 'Downloads cards list was not found.'}
$text=$text.Replace($start,'<View style={s.grid}>{OFFLINE_SECTIONS.map(section=>')
$end='})}</ScrollView></SafeAreaView>}'
if(-not $text.Contains($end)){throw 'Downloads cards list end was not found.'}
$text=$text.Replace($end,'})}</View></ScrollView></SafeAreaView>}')
$old="content:{padding:16,paddingBottom:45},notice:"
$new="content:{padding:16,paddingBottom:45},grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',rowGap:10},notice:"
if(-not $text.Contains($old)){throw 'Downloads content style was not found.'};$text=$text.Replace($old,$new)
$text=$text.Replace("card:{minHeight:112,marginBottom:10,padding:13,borderWidth:1,borderColor:'#DDE9E1',borderRadius:17,backgroundColor:'#FFF',flexDirection:'row',alignItems:'center'}","card:{width:'48.5%',minHeight:205,padding:13,borderWidth:1,borderColor:'#DDE9E1',borderRadius:17,backgroundColor:'#FFF',alignItems:'flex-start'}")
$text=$text.Replace("copy:{flex:1,marginLeft:12}","copy:{width:'100%',flex:1,marginTop:10}")
$text=$text.Replace("actions:{marginLeft:8,alignItems:'center',gap:6}","actions:{width:'100%',marginTop:10,flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:6}")
[IO.File]::WriteAllText($screenPath,$text)
