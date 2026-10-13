$adminPath=Join-Path $PSScriptRoot '..\admin-panel\app\page.tsx';$admin=[IO.File]::ReadAllText($adminPath)
$admin=$admin.Replace('onChange={html=>setBookForm({...bookForm,content:html})}', 'onChange={html=>setBookForm({...bookForm,content:html,pages:[]})}')
[IO.File]::WriteAllText($adminPath,$admin,[Text.UTF8Encoding]::new($false))

$mobilePath=Join-Path $PSScriptRoot '..\src\screens\BookReaderScreen.tsx';$mobile=[IO.File]::ReadAllText($mobilePath)
$mobile=$mobile.Replace("import { ActivityIndicator, Alert, ImageBackground, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';","import { ActivityIndicator, Alert, ImageBackground, Pressable, ScrollView, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';`r`nimport RenderHTML from 'react-native-render-html';")
$mobile=$mobile.Replace("export function BookReaderScreen({ slug, onBack }: { slug: string; onBack: () => void }) {`r`n  const [book", "export function BookReaderScreen({ slug, onBack }: { slug: string; onBack: () => void }) {`r`n  const {width}=useWindowDimensions();`r`n  const [book")
$old='    const content = cleanText(book.content || '''');`r`n    const chunks = content.match(/[\s\S]{1,3200}(?:\n\n|$)/g) || [content];'
$new='    const content = cleanText(book.content || '''');`r`n    if(/<[a-z][\s\S]*>/i.test(content))return [content];`r`n    const chunks = content.match(/[\s\S]{1,3200}(?:\n\n|$)/g) || [content];'
if(-not $mobile.Contains($old)){throw 'Book content pagination target not found'};$mobile=$mobile.Replace($old,$new)
$oldBody='<View style={styles.bodyText}>{paragraphs.map((paragraph,index)=><Text key={index} selectable style={[styles.body,{fontSize,lineHeight:Math.round(fontSize*1.75)},isRtl&&styles.bodyRtl,index===0&&styles.openingParagraph]}>{paragraph}</Text>)}</View>'
$newBody='<View style={styles.bodyText}>{/<[a-z][\s\S]*>/i.test(current)?<RenderHTML contentWidth={width-76} source={{html:current}} baseStyle={{...styles.body,fontSize,lineHeight:Math.round(fontSize*1.75),...(isRtl?styles.bodyRtl:{})}} tagsStyles={{h1:{color:GREEN},h2:{color:GREEN},h3:{color:GREEN},h4:{color:GREEN},blockquote:{backgroundColor:"#FFF8DF",borderLeftColor:"#D0AD45",borderLeftWidth:4,borderRadius:8,padding:12},a:{color:GREEN,fontWeight:"700"},img:{borderRadius:12}}}/>:paragraphs.map((paragraph,index)=><Text key={index} selectable style={[styles.body,{fontSize,lineHeight:Math.round(fontSize*1.75)},isRtl&&styles.bodyRtl,index===0&&styles.openingParagraph]}>{paragraph}</Text>)}</View>'
if(-not $mobile.Contains($oldBody)){throw 'Book reader body target not found'};$mobile=$mobile.Replace($oldBody,$newBody)
[IO.File]::WriteAllText($mobilePath,$mobile,[Text.UTF8Encoding]::new($false))
