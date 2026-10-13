$playerPath = Join-Path $PSScriptRoot '..\src\screens\QuranAudioPlayerScreen.tsx'
$quranPath = Join-Path $PSScriptRoot '..\src\screens\QuranScreen.tsx'
$appPath = Join-Path $PSScriptRoot '..\App.tsx'

$player = Get-Content -LiteralPath $playerPath -Raw
$player = $player.Replace("onChangeReciter}:{surahNumber:number;reciter:Reciter;language:string;edition:string;onBack:()=>void;onRead:()=>void;onChangeReciter:()=>void}", "onChangeReciter,continuous=false}:{surahNumber:number;reciter:Reciter;language:string;edition:string;onBack:()=>void;onRead:()=>void;onChangeReciter:()=>void;continuous?:boolean}")
$player = $player.Replace(" const meta=(surahResponse.data as Meta[]).find(item=>item.number===surahNumber)??(surahResponse.data as Meta[])[0];", " const [activeSurah,setActiveSurah]=useState(surahNumber);const [continueAfterLoad,setContinueAfterLoad]=useState(false);`r`n const meta=(surahResponse.data as Meta[]).find(item=>item.number===activeSurah)??(surahResponse.data as Meta[])[0];")
$player = $player.Replace("useState(3); const player", "useState(0); const player")
$player = $player.Replace("getSurah(surahNumber,language,edition)", "getSurah(activeSurah,language,edition)")
$player = $player.Replace("[surahNumber,language,edition]", "[activeSurah,language,edition]")
$player = $player.Replace("localAyahAudioUri(surahNumber,reciter.id,ayah.number)", "localAyahAudioUri(activeSurah,reciter.id,ayah.number)")
$player = $player.Replace("[ayah,player,reciter.id,surahNumber,title]", "[ayah,player,reciter.id,activeSurah,title]")
$player = $player.Replace(" useEffect(()=>{if(status.didJustFinish&&surah&&ayahIndex<surah.ayahs.length-1){setCurrentAyah(value=>value+1);setTimeout(()=>player.play(),250);}},[ayahIndex,player,status.didJustFinish,surah]);", " useEffect(()=>{if(!status.didJustFinish||!surah)return;if(ayahIndex<surah.ayahs.length-1){setCurrentAyah(value=>value+1);setContinueAfterLoad(true)}else if(continuous&&activeSurah<114){setActiveSurah(value=>value+1);setCurrentAyah(0);setContinueAfterLoad(true)}},[activeSurah,ayahIndex,continuous,status.didJustFinish,surah]);`r`n useEffect(()=>{if(continueAfterLoad&&ayah&&!loading){setContinueAfterLoad(false);setTimeout(()=>player.play(),300)}},[ayah,continueAfterLoad,loading,player]);")
$player = $player.Replace(" const next=()=>setCurrentAyah(value=>Math.min((surah?.ayahs.length??1)-1,value+1));", " const next=()=>{if(surah&&ayahIndex>=surah.ayahs.length-1&&continuous&&activeSurah<114){setActiveSurah(value=>value+1);setCurrentAyah(0);setContinueAfterLoad(true)}else setCurrentAyah(value=>Math.min((surah?.ayahs.length??1)-1,value+1))};")
$player = $player.Replace("<Text style={styles.surahNumberText}>{surahNumber}</Text>", "<Text style={styles.surahNumberText}>{activeSurah}</Text>")
Set-Content -LiteralPath $playerPath -Value $player -Encoding utf8

$quran = Get-Content -LiteralPath $quranPath -Raw
$quran = $quran.Replace("onListenSurah:(surahNumber:number)=>void", "onListenSurah:(surahNumber:number,continuous?:boolean)=>void")
$quran = $quran.Replace("onPress={()=>onListenSurah(1)} style={styles.fullListen}", "onPress={()=>onListenSurah(1,true)} style={styles.fullListen}")
Set-Content -LiteralPath $quranPath -Value $quran -Encoding utf8

$app = Get-Content -LiteralPath $appPath -Raw
$app = $app.Replace("const [audioReturnScreen, setAudioReturnScreen] = useState<'quran' | 'library' | 'downloads'>('quran');", "const [audioReturnScreen, setAudioReturnScreen] = useState<'quran' | 'library' | 'downloads'>('quran');`r`n  const [continuousQuranAudio, setContinuousQuranAudio] = useState(false);")
$app = $app.Replace("onListenSurah={(number) => { setSelectedSurah(number); setAudioReturnScreen('downloads'); setScreen('quran-audio'); }}", "onListenSurah={(number) => { setContinuousQuranAudio(false); setSelectedSurah(number); setAudioReturnScreen('downloads'); setScreen('quran-audio'); }}")
$app = $app.Replace("onListenSurah={(number) => { setSelectedSurah(number); setAudioReturnScreen('quran'); setScreen('quran-audio'); }}", "onListenSurah={(number, continuous) => { setContinuousQuranAudio(Boolean(continuous)); setSelectedSurah(number); setAudioReturnScreen('quran'); setScreen('quran-audio'); }}")
$app = $app.Replace("<QuranAudioPlayerScreen surahNumber={selectedSurah}", "<QuranAudioPlayerScreen continuous={continuousQuranAudio} surahNumber={selectedSurah}")
Set-Content -LiteralPath $appPath -Value $app -Encoding utf8
