$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$screenPath=Join-Path $projectRoot 'src\screens\DownloadedLibraryScreen.tsx'
$text=[IO.File]::ReadAllText($screenPath)
$changes=@(
 @("categoryCard:{width:'48.5%',minHeight:165,padding:16","categoryCard:{width:'48.5%',minHeight:192,padding:18"),
 @("categoryIcon:{width:56,height:56,borderRadius:18","categoryIcon:{width:64,height:64,borderRadius:20"),
 @("categoryLetter:{fontSize:19","categoryLetter:{fontSize:22"),
 @("categoryCopy:{width:'100%',marginTop:15}","categoryCopy:{width:'100%',marginTop:18}"),
 @("categoryTitle:{fontSize:16","categoryTitle:{fontSize:18"),
 @("categoryCount:{marginTop:6,fontSize:10.5","categoryCount:{marginTop:7,fontSize:11.5"),
 @("categoryArrow:{position:'absolute',right:16,bottom:14,fontSize:27","categoryArrow:{position:'absolute',right:18,bottom:16,fontSize:30")
)
foreach($change in $changes){if($text.Contains($change[0])){$text=$text.Replace($change[0],$change[1])}}
[IO.File]::WriteAllText($screenPath,$text)
