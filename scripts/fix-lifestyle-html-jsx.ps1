$path = 'src/screens/AqidahLifeScreen.tsx'
$text = Get-Content -Raw $path
$text = $text.Replace('</View>}</></View>', '</View></>}</View>')
Set-Content -Path $path -Value $text -Encoding utf8
