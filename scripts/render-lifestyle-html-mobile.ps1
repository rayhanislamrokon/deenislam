$path = 'src/screens/AqidahLifeScreen.tsx'
$text = Get-Content -Raw $path
$text = $text.Replace("import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';", "import { Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';`r`nimport RenderHTML from 'react-native-render-html';")
$text = $text.Replace("export function AqidahLifeScreen({ onBack }: { onBack: () => void }) {", "export function AqidahLifeScreen({ onBack }: { onBack: () => void }) {`r`n  const { width } = useWindowDimensions();")
$text = $text.Replace("text:(item.introduction||[]).join(' '),points:item.lessons||[]", "text:item.subtitle||'',html:(item.introduction||[]).join(''),points:item.lessons||[]")
$text = $text.Replace('<Text style={styles.chapterPageIntro}>{activeChapter.text}</Text>', '<Text style={styles.chapterPageIntro}>{activeChapter.text}</Text>')
$text = $text.Replace('<View style={styles.chapterPageCard}>{chapterDetails ?', '<View style={styles.chapterPageCard}>{activeChapter.html?<RenderHTML contentWidth={width-68} source={{html:activeChapter.html}} baseStyle={styles.richHtml} tagsStyles={{h1:styles.richH1,h2:styles.richH2,h3:styles.richH3,p:styles.richP,blockquote:styles.richQuote,li:styles.richLi,a:styles.richLink,img:styles.richImage}}/>:<>{chapterDetails ?')
$needle = '</View></View>`r`n      <View style={styles.chapterNav}'
$replacement = '</View>}</></View>`r`n      <View style={styles.chapterNav}'
if (-not $text.Contains($needle)) {
  $needle = "</View></View>`n      <View style={styles.chapterNav}"
  $replacement = "</View>}</></View>`n      <View style={styles.chapterNav}"
}
$text = $text.Replace($needle, $replacement)
$text = $text.Replace("note:{marginTop:14", "richHtml:{fontSize:15,lineHeight:24,color:'#30483C'},richH1:{fontSize:28,lineHeight:35,color:'#075B3B',marginTop:8,marginBottom:12},richH2:{fontSize:23,lineHeight:30,color:'#075B3B',marginTop:18,marginBottom:9},richH3:{fontSize:19,lineHeight:26,color:'#176143',marginTop:16,marginBottom:8},richP:{marginTop:5,marginBottom:10},richQuote:{paddingLeft:14,paddingVertical:9,marginVertical:12,backgroundColor:'#FFF9E8',borderLeftWidth:4,borderLeftColor:'#C6A64D',color:'#5E5335'},richLi:{marginBottom:7},richLink:{color:'#087A4D',textDecorationLine:'underline'},richImage:{marginVertical:14,borderRadius:12},note:{marginTop:14")
Set-Content -Path $path -Value $text -Encoding utf8
