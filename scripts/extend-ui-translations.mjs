import { readFile, writeFile } from 'node:fs/promises';

const file = new URL('../app/src/data/uiTranslations.json', import.meta.url);
const webFile = new URL('../web/app/data/uiTranslations.json', import.meta.url);
const output = JSON.parse(await readFile(file, 'utf8'));
const phrases = [
  'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','January','February','March','April','May','June','July','August','September','October','November','December',
  'Home','Library','Prayer','Profile',
  'Islamic Books','Masala','Prayer Times','Qibla Direction','Islamic AI','Daily Tasks','Islamic Lifestyle','Prophets','Sahaba','Islamic History','Ramadan','Islamic Calendar','Knowledge','Community','Settings',
  'Read & Listen','Authentic Sayings','Knowledge & Growth','Daily Islamic Rulings','Stay on Track','Find Qibla','Ask & Learn','Build Good Habits','Quran Explanation','Calculate & Learn','Live With Deen','Stories & Lessons','Noble Companions','Explore Our Heritage','Digital Dhikr','Daily Worship','All Deen Islam services','View All Prayer Times','Starts in',
  '20 May 2024, Monday','And do not lose hope and do not be sad, and you will be superior if you are true believers.','The best of you are those who learn the Quran and teach it.','10 Dhul Hijjah 1445 AH','Select Quran recitation voice','Ayah','of','Page','Search Arabic, translation or Surah...','Did you mean?','Search the complete Quran','No Ayah found','Try another Arabic or English word.','Tap Download on a Surah to add it here.','Tap the bookmark on Continue Reading to add it here.','Search by name or style...','Popular','All Reciters','Quran Translation Editions','Languages','Editions','Search translator, language or edition...','School / methodology','Timer','Save','Tafsir Source','Author','Abridged Version',
  'Allah commands His believing servants to fast. Fasting means abstaining from food, drink, and sexual intercourse with the intention of doing so sincerely for Allah, the Exalted.',
  'This is because fasting purifies the soul, cleanses it from bad traits, and refines it. Thus, Allah mentioned that He has enjoined it upon this Ummah just as He enjoined it upon those before them, so they would have a good example in that.',
  'That you may become righteous — fasting strengthens awareness of Allah and helps a believer guard against wrongdoing.',
  'Ibn Kathir explains that fasting is among the means through which believers attain self-restraint and closeness to Allah.'
];
for (const [language, table] of Object.entries(output)) {
  const missing = phrases.filter(phrase => !table[phrase]);
  if (!missing.length) continue;
  if (language === 'en') { for (const phrase of missing) table[phrase] = phrase; continue; }
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client','gtx'); url.searchParams.set('sl','en');
  url.searchParams.set('tl',language === 'ber' ? 'ar' : language); url.searchParams.set('dt','t');
  url.searchParams.set('q',missing.join('\n'));
  const response = await fetch(url); if (!response.ok) throw new Error(`${language}: ${response.status}`);
  const translated = (await response.json())[0].map(part => part[0]).join('').split('\n');
  missing.forEach((phrase,index) => { table[phrase] = translated[index] || phrase; });
  process.stdout.write(`${language} `);
}
await writeFile(file, JSON.stringify(output,null,2),'utf8');
await writeFile(webFile, JSON.stringify(output,null,2),'utf8');
