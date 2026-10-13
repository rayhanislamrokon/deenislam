$target = Join-Path $PSScriptRoot '..\src\screens\QuranAudioPlayerScreen.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = $source.Replace("type IconName='down'", "type IconName='back'|'down'")
$source = $source.Replace("const paths:Record<IconName,string>={down:", "const paths:Record<IconName,string>={back:'M21 5 10 16l11 11',down:")
$source = $source.Replace('<Icon name="down"/>', '<Icon name="back"/>')
$source = [regex]::Replace($source, '<Text style=\{styles\.translationLabel\}>.*?</Text>', '<Text style={styles.translationLabel}>TRANSLATION</Text>')
$source = [regex]::Replace($source, "nextAyah\?\.numberInSurah\?\?\x27[^\x27]+\x27", "nextAyah?.numberInSurah??'\u2014'")
$source = $source.Replace("iconBtn:{width:40,height:40,alignItems:'center',justifyContent:'center'}", "iconBtn:{width:42,height:42,borderRadius:21,borderWidth:1,borderColor:'#DCE8DF',backgroundColor:'#FFF',alignItems:'center',justifyContent:'center',shadowColor:'#173B2D',shadowOffset:{width:0,height:2},shadowOpacity:.08,shadowRadius:5,elevation:2}")
Set-Content -LiteralPath $target -Value $source -Encoding utf8
