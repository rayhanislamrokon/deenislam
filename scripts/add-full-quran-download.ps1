$offlinePath = Join-Path $PSScriptRoot '..\src\services\offlineQuran.ts'
$quranPath = Join-Path $PSScriptRoot '..\src\screens\QuranScreen.tsx'

$offline = Get-Content -LiteralPath $offlinePath -Raw
$offline = $offline.Replace("  onProgress?: (value: number) => void,`r`n)", "  onProgress?: (value: number) => void,`r`n  notify = true,`r`n)")
$offline = $offline.Replace("  const downloadTitle='Surah '+(surah.englishName||surah.number);showDownloadProgress(downloadTitle,1);", "  const downloadTitle='Surah '+(surah.englishName||surah.number);if(notify)showDownloadProgress(downloadTitle,1);")
$offline = $offline.Replace("onProgress?.(value);showDownloadProgress(downloadTitle,value*100);", "onProgress?.(value);if(notify)showDownloadProgress(downloadTitle,value*100);")
$offline = $offline.Replace("await writeManifest(manifest);finishDownload(downloadTitle);", "await writeManifest(manifest);if(notify)finishDownload(downloadTitle);")
Set-Content -LiteralPath $offlinePath -Value $offline -Encoding utf8

$quran = Get-Content -LiteralPath $quranPath -Raw
$quran = $quran.Replace("import { showActionToast } from '../services/actionFeedback';", "import { failDownload, finishDownload, showActionToast, showDownloadProgress } from '../services/actionFeedback';")
$quran = $quran.Replace("const [descending,setDescending]=useState(false);", "const [descending]=useState(false);const [fullDownloading,setFullDownloading]=useState(false);")
$marker = ";return <SafeAreaView style={styles.safe}>"
$logic = ";const downloadFullQuran=async()=>{if(fullDownloading)return;setFullDownloading(true);const title='Full Quran';try{showDownloadProgress(title,1);const existing=await listOfflineSurahs(reciter.id);for(let number=1;number<=114;number+=1){const saved=existing.some(item=>item.surahNumber===number&&item.language===language&&(!edition||item.edition===edition));if(!saved){const surah=await getSurah(number,language,edition);await saveSurahOffline(surah,reciter,language,edition,undefined,false)}showDownloadProgress(title,Math.round(number/114*100))}setDownloads(Array.from({length:114},(_,index)=>index+1));finishDownload(title)}catch(value){failDownload(title);Alert.alert('Download failed',value instanceof Error?value.message:'Please try again.')}finally{setFullDownloading(false)}};return <SafeAreaView style={styles.safe}>"
$quran = $quran.Replace($marker, $logic)
$oldHead = '<View style={styles.sectionHead}><Text style={styles.sectionTitle}>{activeTab===' + "'Surah'?t.allSurahs:activeTab==='Juz'?t.juz:activeTab==='Bookmarks'?t.bookmarks:t.downloads}" + '</Text><Pressable onPress={()=>setDescending(value=>!value)} style={styles.sort}><Icon name="sliders" size={19} color="#111"/><Text style={styles.sortText}>{descending?t.sortReverse:t.sortDefault}</Text></Pressable></View>'
$newHead = '<View style={styles.sectionHead}><Text style={styles.sectionTitle}>{activeTab===' + "'Surah'?t.allSurahs:activeTab==='Juz'?t.juz:activeTab==='Bookmarks'?t.bookmarks:t.downloads}" + '</Text>{activeTab===' + "'Surah'" + '?<View style={styles.fullActions}><Pressable disabled={fullDownloading} onPress={()=>void downloadFullQuran()} style={styles.fullDownload}><Icon name="download" size={15} color="#FFF"/><Text style={styles.fullDownloadText}>{fullDownloading?' + "'Saving...':'Full Quran'" + '}</Text></Pressable><Pressable onPress={()=>onListenSurah(1)} style={styles.fullListen}><Icon name="play" size={14} color={GREEN} fill={GREEN}/></Pressable></View>:null}</View>'
$quran = $quran.Replace($oldHead, $newHead)
$quran = $quran.Replace("viewAll:{fontFamily:serif,fontSize:13,color:'#3C4541'},", "viewAll:{fontFamily:serif,fontSize:13,color:'#3C4541'},fullActions:{flexDirection:'row',gap:7,alignItems:'center'},fullDownload:{height:36,paddingHorizontal:11,borderRadius:12,backgroundColor:GREEN,flexDirection:'row',gap:5,alignItems:'center',justifyContent:'center'},fullDownloadText:{fontSize:9,fontWeight:'800',color:'#FFF'},fullListen:{width:36,height:36,borderRadius:12,borderWidth:1,borderColor:'#CFE2D6',backgroundColor:'#FFF',alignItems:'center',justifyContent:'center'},")
Set-Content -LiteralPath $quranPath -Value $quran -Encoding utf8
