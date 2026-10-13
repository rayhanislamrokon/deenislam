$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
$path=Join-Path $projectRoot 'src\screens\IslamicHistoryScreen.tsx'
$source=[IO.File]::ReadAllText($path)
$marker="const ERAS:Era[]=[`r`n"
if(-not $source.Contains($marker)){$marker="const ERAS:Era[]=[`n"}
$eras=@'
 {id:'creation-adam',range:'The beginning of humanity',title:'Creation & Adam (AS)',subtitle:'The first human and Prophet',summary:'The Quranic account of creation, Adam and Hawwa, life in Jannah, the test, repentance and the beginning of human life on Earth.',topics:['Allah as the Creator','Creation of the heavens and the Earth','Creation of Adam (AS)','The command to the angels','Adam and Hawwa in Jannah','The test and repentance','Life begins on Earth']},
 {id:'early-humanity',range:'Early human history',title:'Adam to Nuh (AS)',subtitle:'The first generations',summary:'The growth of the first human communities, the beginning of deviation and the mission of Nuh (AS).',topics:['Children and descendants of Adam','Growth of early communities','Beginning of shirk','Mission of Nuh (AS)','The Ark and the Flood','A renewed human community']},
 {id:'ancient-prophets',range:'Ancient nations',title:'Prophets of Early Nations',subtitle:'Hud, Salih and their peoples',summary:'The Quranic histories of early nations, their Prophets and the lessons preserved from their rise and fall.',topics:['Hud (AS) and the people of Ad','Salih (AS) and Thamud','The she-camel as a sign','Faith, rejection and accountability','Lessons from vanished nations']},
 {id:'ibrahim',range:'Age of Ibrahim (AS)',title:'Ibrahim & His Family',subtitle:'Faith, sacrifice and the Kaaba',summary:'The life of Ibrahim (AS), his call to pure monotheism and the Prophetic families descending through Ismail and Ishaq.',topics:['Ibrahim searches for truth','Confronting idolatry','Migration for faith','Hajar and Ismail in Makkah','Building the Kaaba','The test of sacrifice','Ishaq, Yaqub and the Prophetic family']},
 {id:'yusuf-musa',range:'Egypt and Bani Israel',title:'Yusuf, Musa & Bani Israel',subtitle:'Patience, liberation and revelation',summary:'From the story of Yusuf (AS) in Egypt to Musa (AS), Pharaoh, the Exodus and the covenant with Bani Israel.',topics:['Yusuf (AS) and his brothers','Yusuf in Egypt','Birth and mission of Musa (AS)','Musa and Pharaoh','The Exodus','Revelation of the Tawrah','The journey of Bani Israel']},
 {id:'kingdom-prophets',range:'Prophets and kingdoms',title:'Dawud & Sulayman (AS)',subtitle:'Justice, wisdom and worship',summary:'The Prophetic kingdoms of Dawud and Sulayman, followed by later Prophets sent to guide Bani Israel.',topics:['Talut and Jalut','Dawud (AS) as Prophet and ruler','The Zabur','Sulayman (AS) and his kingdom','Wisdom and justice','Later Prophets of Bani Israel']},
 {id:'isa-arabia',range:'Before 610 CE',title:'Isa (AS) to Arabia',subtitle:'The final centuries before Islam',summary:'The mission of Isa (AS), the people who followed earlier revelation and the Arabian setting before the final Prophethood.',topics:['Birth of Maryam (AS)','Birth and mission of Isa (AS)','The Injil and disciples','Quranic account of Isa (AS)','Descendants of Ismail in Arabia','Makkah and the Kaaba','The Year of the Elephant']},
'@
if($source -notmatch "id:'creation-adam'"){$source=$source.Replace($marker,$marker+$eras)}
$source=$source.Replace('From the first revelation to today','From Adam (AS) to today')
$source=$source.Replace('Follow Islamic history from the first revelation in 610 CE through every major period to the Muslim world today.','Follow the Quranic story of humanity from the creation of Adam (AS), through the Prophets and every major Islamic period, to the Muslim world today.')
$source=$source.Replace('A CHRONOLOGICAL JOURNEY','FROM CREATION TO TODAY')
[IO.File]::WriteAllText($path,$source,[Text.UTF8Encoding]::new($false))
