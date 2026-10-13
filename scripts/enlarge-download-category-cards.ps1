$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$screenPath=Join-Path $projectRoot 'src\screens\DownloadedLibraryScreen.tsx'
$text=[IO.File]::ReadAllText($screenPath)
$changes=@(
 @("categoryCard:{width:'48.5%',minHeight:126,padding:14","categoryCard:{width:'48.5%',minHeight:158,padding:16"),
 @("categoryIcon:{width:48,height:48,borderRadius:16","categoryIcon:{width:56,height:56,borderRadius:18"),
 @("categoryLetter:{fontSize:16","categoryLetter:{fontSize:19"),
 @("categoryCopy:{width:'100%',marginTop:12}","categoryCopy:{width:'100%',marginTop:15}"),
 @("categoryTitle:{fontSize:15","categoryTitle:{fontSize:16"),
 @("categoryCount:{marginTop:5,fontSize:9.5","categoryCount:{marginTop:6,fontSize:10.5"),
 @("categoryArrow:{position:'absolute',right:14,bottom:12,fontSize:24","categoryArrow:{position:'absolute',right:16,bottom:14,fontSize:27")
)
foreach($change in $changes){if(-not $text.Contains($change[0])){throw "Style not found: $($change[0])"};$text=$text.Replace($change[0],$change[1])}
[IO.File]::WriteAllText($screenPath,$text)
