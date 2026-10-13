$target = Join-Path $PSScriptRoot '..\src\screens\QuranAudioPlayerScreen.tsx'
$source = Get-Content -LiteralPath $target -Raw
$source = $source.Replace("import { useCallback, useEffect, useMemo, useState } from 'react';", "import { useCallback, useEffect, useMemo, useRef, useState } from 'react';")
$source = $source.Replace("const [continueAfterLoad,setContinueAfterLoad]=useState(false);", "const [continueAfterLoad,setContinueAfterLoad]=useState(false);const finishHandledRef=useRef(false);")
$old = " useEffect(()=>{if(!status.didJustFinish||!surah)return;if(ayahIndex<surah.ayahs.length-1){setCurrentAyah(value=>value+1);setContinueAfterLoad(true)}else if(continuous&&activeSurah<114){setActiveSurah(value=>value+1);setCurrentAyah(0);setContinueAfterLoad(true)}},[activeSurah,ayahIndex,continuous,status.didJustFinish,surah]);"
$new = " useEffect(()=>{if(!status.didJustFinish){finishHandledRef.current=false;return}if(finishHandledRef.current||!surah)return;finishHandledRef.current=true;if(ayahIndex<surah.ayahs.length-1){setCurrentAyah(value=>value+1);setContinueAfterLoad(true)}else if(continuous&&activeSurah<114){setActiveSurah(value=>value+1);setCurrentAyah(0);setContinueAfterLoad(true)}},[activeSurah,ayahIndex,continuous,status.didJustFinish,surah]);"
$source = $source.Replace($old, $new)
Set-Content -LiteralPath $target -Value $source -Encoding utf8
