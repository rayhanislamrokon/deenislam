$path = Join-Path $PSScriptRoot '..\src\screens\BooksScreen.tsx'
$text = [IO.File]::ReadAllText($path)
$text = $text.Replace("coverImage:{...StyleSheet.absoluteFillObject,width:'100%',height:'100%'},coverShade:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(5,52,35,.10)'},", "coverImage:{position:'absolute',left:0,right:0,top:0,bottom:0,width:'100%',height:'100%'},coverShade:{position:'absolute',left:0,right:0,top:0,bottom:0,backgroundColor:'rgba(5,52,35,.10)'},")
[IO.File]::WriteAllText($path,$text,[Text.UTF8Encoding]::new($false))
