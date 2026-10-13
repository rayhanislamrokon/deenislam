import { readFile, writeFile } from 'node:fs/promises';

const languageSource = await readFile(new URL('../app/src/data/homeLanguages.ts', import.meta.url), 'utf8');
const languages = [...languageSource.matchAll(/"code"\s*:\s*"([^"]+)"/g)].map(match => match[1]).filter(code => code !== 'en');
const phrases = [
  'Home','Library','Prayer','Profile','Next Prayer','Next prayer in','Fajr','Dhuhr','Asr','Maghrib','Isha','AM','PM','Nearby Mosques','Zakat','Tasbih','languages','available offline','Assalamu Alaikum','May Allah bless your day','Dhaka, Bangladesh','Quick Access','View All','Quran','Hadith','Books','Qibla','Tafsir','Fiqh','Aqidah','Seerah','History','Continue Reading','Surah Al-Kahf','The Cave','Last read: Ayah 45','Continue','Daily Ayah','Hadith of the Day','Read More','Explore','Have an Islamic question?','Ask our AI assistant and get answers from trusted Islamic sources.','Ask AI','Upcoming Event','Eid al-Adha','Only 20 days left','Choose Reciter','Select Language','Search language or code...','No language found',
  'Surah','Juz','Bookmarks','Downloads','Recently Read','All Surahs','Ayahs','Progress','Read','Listen','Download','Saved','Revealed in','Makkah','Madinah','Para','Surahs','to','Sort: Default','Sort: Reverse','Nothing saved yet','Loading Surah...','Could not load Surah','Try Again','Page','Loading Juz...','Could not load Juz','Search','Results for','results found','Filter','Open Context','Now Playing','Change','Loading Ayah...','Translation','Up Next','End of Surah','Read Along in Quran Reader','Play Ayah','Pause Ayah','Explanation','Add Study Note','Compare Tafsir','Previous','Next'
];

const output = { en: Object.fromEntries(phrases.map(value => [value, value])) };
for (const language of languages) {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'en');
  url.searchParams.set('tl', language === 'ber' ? 'ar' : language);
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', phrases.join('\n'));
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${language}: ${response.status}`);
  const body = await response.json();
  const translated = body[0].map(part => part[0]).join('').split('\n');
  output[language] = Object.fromEntries(phrases.map((value,index) => [value, translated[index] || value]));
  process.stdout.write(`${language} `);
}
await writeFile(new URL('../app/src/data/uiTranslations.json', import.meta.url), JSON.stringify(output, null, 2), 'utf8');
