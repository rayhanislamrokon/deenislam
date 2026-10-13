$mobile = 'src/screens/AqidahLifeScreen.tsx'
$text = Get-Content -Raw $mobile
$oldFetch = "  useEffect(() => { let live=true; fetch((process.env.EXPO_PUBLIC_API_URL??'http://10.0.2.2:4000').replace(/\/$/,'')+'/api/islamic-lifestyle').then(r=>r.json()).then(body=>{if(live&&Array.isArray(body.data)&&body.data.length)setRemoteChapters(body.data)}).catch(()=>{}); return()=>{live=false}; },[]);"
$newFetch = @'
  const lifestyleApi=(process.env.EXPO_PUBLIC_API_URL??'http://10.0.2.2:4000').replace(/\/$/,'')+'/api/islamic-lifestyle';
  const loadLifestyle=async()=>{try{const response=await fetch(lifestyleApi+'?fresh='+Date.now(),{headers:{'Cache-Control':'no-cache'}}),body=await response.json();if(response.ok&&Array.isArray(body.data))setRemoteChapters(body.data)}catch{}};
  useEffect(()=>{void loadLifestyle()},[]);
'@
if (-not $text.Contains($oldFetch)) { throw 'Lifestyle fetch block was not found.' }
$text = $text.Replace($oldFetch,$newFetch)
$oldMap = "managedChapterItems.map((item,index)=>({...item,number:String(item.order||index+1).padStart(2,'0'),text:item.subtitle||'',html:(item.introduction||[]).join(''),points:item.lessons||[],category:item.section||'Islamic Lifestyle'}))"
$newMap = "managedChapterItems.map((item,index)=>({...item,managed:true,number:String(item.order||index+1).padStart(2,'0'),text:item.subtitle||'',html:(item.introduction||[]).join(''),points:item.lessons||[],category:item.section||'Islamic Lifestyle'}))"
if (-not $text.Contains($oldMap)) { throw 'Managed chapter mapping was not found.' }
$text = $text.Replace($oldMap,$newMap)
$text = $text.Replace("const chapterDetails = activeChapter ? (remoteChapters?.length ?", "const chapterDetails = activeChapter ? (activeChapter.managed ?")
$text = $text.Replace("const deepGuide = selected ? DEEP_GUIDES[selected.id] : null;", "const deepGuide = selected ? DEEP_GUIDES[selected.id] : null;`r`n  const activeChapterIndex=activeChapter?lifestyleChapters.findIndex(chapter=>chapter.number===activeChapter.number):-1;`r`n  const openTopic=(topic:Topic)=>{setSelected(topic);setActiveChapterNumber(null);void loadLifestyle()};")
$navPattern = '<View style=\{styles\.chapterNav\}>.*?</View>\r?\n    </ScrollView>'
$navReplacement = @'
<View style={styles.chapterNav}><Pressable disabled={activeChapterIndex<=0} onPress={()=>setActiveChapterNumber(lifestyleChapters[activeChapterIndex-1]?.number??null)} style={[styles.chapterNavButton,activeChapterIndex<=0&&styles.chapterNavDisabled]}><Text style={styles.chapterNavButtonText}>‹ Previous</Text></Pressable><Text style={styles.chapterNavCount}>{activeChapterIndex+1} / {lifestyleChapters.length}</Text><Pressable disabled={activeChapterIndex<0||activeChapterIndex>=lifestyleChapters.length-1} onPress={()=>setActiveChapterNumber(lifestyleChapters[activeChapterIndex+1]?.number??null)} style={[styles.chapterNavButton,(activeChapterIndex<0||activeChapterIndex>=lifestyleChapters.length-1)&&styles.chapterNavDisabled]}><Text style={styles.chapterNavButtonText}>Next ›</Text></Pressable></View>
    </ScrollView>
'@
$updated=[regex]::Replace($text,$navPattern,$navReplacement,1)
if($updated -eq $text){throw 'Chapter navigation block was not found'}
$text=$updated
$text=$text.Replace("selected.id === 'muslim-life' ? <View style={styles.heroStats}","lifestyleChapters.length ? <View style={styles.heroStats}")
$text=$text.Replace("selected.id === 'muslim-life' ? <View style={styles.chapterIndex}","lifestyleChapters.length ? <View style={styles.chapterIndex}")
$text=$text.Replace('<Text style={styles.heroStatValue}>8</Text><Text style={styles.heroStatLabel}>CHAPTERS</Text>','<Text style={styles.heroStatValue}>{lifestyleChapters.length}</Text><Text style={styles.heroStatLabel}>CHAPTERS</Text>')
$text=$text.Replace('<Text style={styles.chapterIndexBadgeText}>8</Text>','<Text style={styles.chapterIndexBadgeText}>{lifestyleChapters.length}</Text>')
$text=$text.Replace('topics={managedCategories.length ? generalManaged : GENERAL_TOPICS} onOpen={setSelected}','topics={managedCategories.length ? generalManaged : GENERAL_TOPICS} onOpen={openTopic}')
$text=$text.Replace('topics={managedCategories.length ? educatorManaged : EDUCATOR_TOPICS} onOpen={setSelected}','topics={managedCategories.length ? educatorManaged : EDUCATOR_TOPICS} onOpen={openTopic}')
Set-Content -Path $mobile -Value $text -Encoding utf8

$server = 'server/src/lifestyle-admin.js'
$serverText = Get-Content -Raw $server
$serverText = $serverText.Replace("res.set('Cache-Control','public, max-age=60');", "res.set('Cache-Control','no-store, max-age=0');")
Set-Content -Path $server -Value $serverText -Encoding utf8
