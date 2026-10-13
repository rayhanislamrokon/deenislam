$ErrorActionPreference='Stop'
$root=Split-Path -Parent $PSScriptRoot
$path=Join-Path $root 'src\screens\DuasCollectionScreen.tsx'
$source=[IO.File]::ReadAllText($path)
$source=$source.Replace('{dua.description?<View style={s.descriptionBox}><Text style={s.fieldLabel}>SHORT DESCRIPTION</Text><Text style={s.description}>{dua.description}</Text></View>:null}','{dua.description?<View style={s.descriptionBox}><Text style={s.description}>{dua.description}</Text></View>:null}')
$source=$source.Replace("description:{marginTop:6,fontSize:12.5","description:{fontSize:12.5")
[IO.File]::WriteAllText($path,$source,[Text.UTF8Encoding]::new($false))
