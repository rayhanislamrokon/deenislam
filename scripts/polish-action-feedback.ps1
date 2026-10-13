$componentPath = Join-Path $PSScriptRoot '..\src\components\GlobalActionFeedback.tsx'
$quranPath = Join-Path $PSScriptRoot '..\src\screens\QuranScreen.tsx'
$tafsirPath = Join-Path $PSScriptRoot '..\src\screens\TafsirScreen.tsx'
$prayerPath = Join-Path $PSScriptRoot '..\src\screens\PrayerScreen.tsx'

$component = @'
import {useEffect,useState} from 'react';
import {Modal,StyleSheet,Text,View} from 'react-native';
import {subscribeActionFeedback,type FeedbackState} from '../services/actionFeedback';
const G='#087A45';
export function GlobalActionFeedback(){const[state,setState]=useState<FeedbackState>(null);useEffect(()=>subscribeActionFeedback(setState),[]);if(!state)return null;if(state.kind==='toast')return <View pointerEvents="none" style={s.toastWrap}><View style={[s.toast,state.status==='removed'&&s.toastRemoved,state.status==='error'&&s.toastError]}><View style={[s.check,state.status==='removed'&&s.removedCheck]}><Text style={s.checkText}>{state.status==='removed'?'−':state.status==='error'?'!':'✓'}</Text></View><View style={s.toastCopy}><Text style={s.toastTitle}>{state.status==='removed'?'Removed':state.status==='error'?'Something went wrong':'Saved successfully'}</Text><Text numberOfLines={2} style={s.toastText}>{state.message}</Text></View></View></View>;return <Modal transparent visible animationType="fade"><View style={s.overlay}><View style={s.downloadCard}><View style={s.brandLine}/><View style={[s.downloadIcon,state.status==='complete'&&s.completeIcon,state.status==='error'&&s.errorIcon]}><Text style={s.downloadGlyph}>{state.status==='complete'?'✓':state.status==='error'?'!':'↓'}</Text></View><Text style={s.downloadTitle}>{state.status==='complete'?'Download complete':state.status==='error'?'Download failed':'Downloading...'}</Text><Text numberOfLines={3} style={s.contentTitle}>{state.title}</Text><View style={s.track}><View style={[s.fill,{width:`${state.progress}%`}]} /></View><View style={s.progressRow}><Text style={s.progressText}>{state.progress}%</Text><Text style={s.privateText}>{state.status==='complete'?'Available offline':'Saving securely on this device'}</Text></View></View></View></Modal>}
const s=StyleSheet.create({toastWrap:{position:'absolute',left:18,right:18,bottom:92,zIndex:9999,alignItems:'center'},toast:{width:'100%',maxWidth:370,minHeight:68,paddingHorizontal:14,paddingVertical:11,borderRadius:20,borderWidth:1,borderColor:'#2C684F',backgroundColor:'#123F2E',flexDirection:'row',alignItems:'center',shadowColor:'#062B1C',shadowOffset:{width:0,height:7},shadowOpacity:.24,shadowRadius:15,elevation:14},toastRemoved:{backgroundColor:'#3F4C46',borderColor:'#65726C'},toastError:{backgroundColor:'#8F3731',borderColor:'#B76159'},check:{width:38,height:38,borderRadius:13,backgroundColor:'#E5F6EB',alignItems:'center',justifyContent:'center'},removedCheck:{backgroundColor:'#EEF1EF'},checkText:{fontSize:20,fontWeight:'900',color:G},toastCopy:{flex:1,marginLeft:12},toastTitle:{fontSize:12,fontWeight:'900',color:'#FFF'},toastText:{marginTop:2,fontSize:10.5,lineHeight:15,color:'#DDECE4'},overlay:{flex:1,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:'rgba(6,31,21,.58)'},downloadCard:{width:'100%',maxWidth:350,paddingHorizontal:24,paddingTop:30,paddingBottom:22,borderRadius:28,borderWidth:1,borderColor:'#D6E8DC',backgroundColor:'#FFFDF8',alignItems:'center',shadowColor:'#041D13',shadowOffset:{width:0,height:12},shadowOpacity:.28,shadowRadius:24,elevation:20,overflow:'hidden'},brandLine:{position:'absolute',left:0,right:0,top:0,height:7,backgroundColor:G},downloadIcon:{width:72,height:72,borderRadius:24,borderWidth:1,borderColor:'#CFE8D8',backgroundColor:'#E7F5EC',alignItems:'center',justifyContent:'center'},completeIcon:{backgroundColor:'#DDF3E5'},errorIcon:{backgroundColor:'#FDE7E5',borderColor:'#F1C7C3'},downloadGlyph:{fontSize:36,fontWeight:'900',color:G},downloadTitle:{marginTop:16,fontSize:21,fontWeight:'900',color:'#163C2D'},contentTitle:{marginTop:7,fontSize:12,lineHeight:18,textAlign:'center',color:'#63746B'},track:{width:'100%',height:9,marginTop:21,borderRadius:5,backgroundColor:'#E1ECE5',overflow:'hidden'},fill:{height:'100%',borderRadius:5,backgroundColor:G},progressRow:{width:'100%',marginTop:10,flexDirection:'row',justifyContent:'space-between'},progressText:{fontSize:10,fontWeight:'900',color:G},privateText:{fontSize:9.5,color:'#829087'}});
'@
Set-Content -LiteralPath $componentPath -Value $component -Encoding utf8

$quran = Get-Content -LiteralPath $quranPath -Raw
$quran = $quran.Replace("import { toggleBookmarkItem } from '../services/bookmarks';", "import { toggleBookmarkItem } from '../services/bookmarks';`r`nimport { showActionToast } from '../services/actionFeedback';")
$quran = $quran.Replace("Alert.alert('Download removed','The private Juz package was removed.');", "showActionToast('Juz removed from offline downloads.','removed');")
$quran = $quran.Replace("Alert.alert('Download complete','This Juz is available inside the app for offline reading.');", "showActionToast('This Juz is ready for offline reading.');")
$quran = $quran.Replace("Alert.alert('Download removed','The private offline package was removed.');", "showActionToast('Surah removed from offline downloads.','removed');")
$quran = $quran.Replace("Alert.alert('Download complete','Recitation, pronunciation and meaning are saved inside the app.');", "showActionToast('Recitation, pronunciation and meaning are ready offline.');")
Set-Content -LiteralPath $quranPath -Value $quran -Encoding utf8

$tafsir = Get-Content -LiteralPath $tafsirPath -Raw
if ($tafsir -notmatch "actionFeedback") { $tafsir = $tafsir.Replace("import ", "import { showActionToast } from '../services/actionFeedback';`r`nimport ", 1) }
$tafsir = $tafsir.Replace("Alert.alert('Saved','Your study note is stored on this device.')", "showActionToast('Your study note is saved on this device.')")
Set-Content -LiteralPath $tafsirPath -Value $tafsir -Encoding utf8

$prayer = Get-Content -LiteralPath $prayerPath -Raw
if ($prayer -notmatch "actionFeedback") { $prayer = $prayer.Replace("import ", "import { showActionToast } from '../services/actionFeedback';`r`nimport ", 1) }
$prayer = $prayer.Replace("Alert.alert('Azan saved'", "showActionToast(")
Set-Content -LiteralPath $prayerPath -Value $prayer -Encoding utf8
