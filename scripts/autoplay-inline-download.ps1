$target = Join-Path $PSScriptRoot '..\src\screens\DownloadedLibraryScreen.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = $source.Replace("import {useEffect,useMemo,useState} from 'react';", "import {useEffect,useMemo,useRef,useState} from 'react';")
$source = $source.Replace("function OfflineSurahReader({item,onClose}:{item:Item;onClose:()=>void}){", "function OfflineSurahReader({item,onClose,startPlaying}:{item:Item;onClose:()=>void;startPlaying:boolean}){")
$source = $source.Replace(" const player=useAudioPlayer(null,{updateInterval:500});const status=useAudioPlayerStatus(player);", " const player=useAudioPlayer(null,{updateInterval:500});const status=useAudioPlayerStatus(player);const didAutoPlay=useRef(false);")
$source = $source.Replace(" useEffect(()=>{if(status.didJustFinish&&surah&&audioAyah!==null&&audioAyah<surah.ayahs.length-1)void listen(audioAyah+1)},[status.didJustFinish]);", " useEffect(()=>{if(startPlaying&&surah&&!didAutoPlay.current){didAutoPlay.current=true;void listen(0)}},[startPlaying,surah]);`r`n useEffect(()=>{if(status.didJustFinish&&surah&&audioAyah!==null&&audioAyah<surah.ayahs.length-1)void listen(audioAyah+1)},[status.didJustFinish]);")
$source = $source.Replace("[readerItem,setReaderItem]=useState<Item|null>(null);", "[readerItem,setReaderItem]=useState<Item|null>(null),[readerAutoPlay,setReaderAutoPlay]=useState(false);")
$source = $source.Replace("<OfflineSurahReader item={readerItem} onClose={()=>setReaderItem(null)}/>", "<OfflineSurahReader item={readerItem} startPlaying={readerAutoPlay} onClose={()=>setReaderItem(null)}/>")
$source = $source.Replace("onPress={()=>setReaderItem(item)} style={s.open}", "onPress={()=>{setReaderAutoPlay(false);setReaderItem(item)}} style={s.open}")
$source = $source.Replace("onPress={()=>setReaderItem(item)} style={s.listen}", "onPress={()=>{setReaderAutoPlay(true);setReaderItem(item)}} style={s.listen}")
Set-Content -LiteralPath $target -Value $source -Encoding utf8
