$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$path=Join-Path $root 'src\screens\DuasCollectionScreen.tsx'
$source=[IO.File]::ReadAllText($path)
$source=$source.Replace(' meaning:item.meaning,',' description:"",'+[Environment]::NewLine+' meaning:item.meaning,')
$source=$source.Replace('${item.name} ${item.pronunciation} ${item.meaning}','${item.name} ${item.description||""} ${item.pronunciation} ${item.meaning}')
$source=$source.Replace('   <Text style={s.arabic}>{dua.arabic}</Text>','   {dua.description?<View style={s.descriptionBox}><Text style={s.fieldLabel}>SHORT DESCRIPTION</Text><Text style={s.description}>{dua.description}</Text></View>:null}'+[Environment]::NewLine+'   <Text style={s.arabic}>{dua.arabic}</Text>')
$source=$source.Replace("bookmark:{marginLeft:8,fontSize:23,lineHeight:29,color:GREEN},arabic:","bookmark:{marginLeft:8,fontSize:23,lineHeight:29,color:GREEN},descriptionBox:{marginTop:14,padding:12,borderRadius:13,backgroundColor:'#F1F8F3'},description:{marginTop:6,fontSize:12.5,lineHeight:19,color:'#52675D'},arabic:")
[IO.File]::WriteAllText($path,$source,[Text.UTF8Encoding]::new($false))
