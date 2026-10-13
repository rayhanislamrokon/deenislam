$ErrorActionPreference = 'Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$screenPath=Join-Path $projectRoot 'src\screens\BooksScreen.tsx'
$text=[IO.File]::ReadAllText($screenPath)
$oldSearch="{q?<Pressable onPress={()=>setQ('')}><Text style={s.clear}>×</Text></Pressable>:<Text style={s.filterIcon}>☷</Text>}"
$newSearch="{q?<Pressable onPress={()=>setQ('')}><Text style={s.clear}>×</Text></Pressable>:null}"
if(-not $text.Contains($oldSearch)){throw 'Search filter icon was not found.'}
$text=$text.Replace($oldSearch,$newSearch)
$oldSwitch='<View style={s.switch}><Pressable onPress={()=>setGrid(true)} style={[s.switchBtn,grid&&s.switchOn]}><Text style={s.switchText}>▦</Text></Pressable><Pressable onPress={()=>setGrid(false)} style={[s.switchBtn,!grid&&s.switchOn]}><Text style={s.switchText}>▤</Text></Pressable></View>'
$newSwitch='{shown.length>0?<View style={s.switch}><Pressable accessibilityLabel="Grid view" onPress={()=>setGrid(true)} style={[s.switchBtn,grid&&s.switchOn]}><Text style={s.switchText}>▦</Text></Pressable><Pressable accessibilityLabel="List view" onPress={()=>setGrid(false)} style={[s.switchBtn,!grid&&s.switchOn]}><Text style={s.switchText}>▤</Text></Pressable></View>:null}'
if(-not $text.Contains($oldSwitch)){throw 'Grid and list controls were not found.'}
$text=$text.Replace($oldSwitch,$newSwitch)
[IO.File]::WriteAllText($screenPath,$text)
