const amolItems = [
  {
    slug: "amol-five-daily-prayers",
    title: "Guard the Five Daily Prayers",
    description:
      "Build the day around the five obligatory prayers and perform each prayer within its appointed time.",
    sourceUrl: "Quran 4:103; Sahih al-Bukhari and Sahih Muslim",
    content: `# Guard the Five Daily Prayers

The five daily prayers are the foundation of a Muslim's daily worship. Arrange work, study and rest around the prayer times rather than delaying prayer without a valid reason.

## Daily practice

- Learn the prayer times for your location.
- Prepare for prayer with wudu.
- Pray calmly and with attention.
- Join the congregation when reasonably possible.
- Make up missed obligations according to reliable scholarly guidance.

## Source

Quran 4:103 states that prayer is prescribed for believers at appointed times. The obligation and virtues of the five prayers are established in authentic Hadith.`,
  },
  {
    slug: "amol-morning-evening-adhkar",
    title: "Morning and Evening Adhkar",
    description:
      "Begin and end the day with authentic remembrance, protection and gratitude.",
    sourceUrl: "Quran 33:41-42; authentic morning and evening supplications",
    content: `# Morning and Evening Adhkar

Set aside a few calm minutes after Fajr and near the evening to remember Allah with authentic supplications.

## Daily practice

- Recite the authentic morning adhkar after Fajr or in the morning.
- Recite the evening adhkar after Asr or toward evening.
- Read with attention and understand the meaning.
- Keep the practice consistent, even when time is limited.

## Source

Quran 33:41-42 commands believers to remember Allah frequently and glorify Him morning and evening.`,
  },
  {
    slug: "amol-ayat-al-kursi",
    title: "Recite Ayat al-Kursi",
    description:
      "Recite Ayat al-Kursi after obligatory prayers and before sleeping.",
    sourceUrl: "Quran 2:255; Sahih al-Bukhari",
    content: `# Recite Ayat al-Kursi

Ayat al-Kursi is verse 255 of Surah Al-Baqarah and declares Allah's perfect life, knowledge, authority and protection.

## Daily practice

- Recite it after each obligatory prayer.
- Recite it before sleeping.
- Learn its meaning and reflect on Allah's greatness.

## Source

Quran 2:255. The report about protection when recited before sleep is recorded in Sahih al-Bukhari.`,
  },
  {
    slug: "amol-daily-istighfar",
    title: "Daily Istighfar and Tawbah",
    description:
      "Ask Allah for forgiveness every day and return sincerely after mistakes.",
    sourceUrl: "Quran 66:8; Sahih Muslim",
    content: `# Daily Istighfar and Tawbah

Repentance is not only for major mistakes. A believer regularly notices shortcomings, asks Allah for forgiveness and tries to improve.

## Steps of sincere repentance

- Stop the sinful action.
- Feel genuine regret.
- Ask Allah for forgiveness.
- Intend not to return to it.
- Restore another person's rights when they were harmed.

## Source

Quran 66:8 calls believers to sincere repentance. Authentic Hadith describe the Prophet seeking forgiveness repeatedly each day.`,
  },
  {
    slug: "amol-daily-quran",
    title: "Daily Quran Reading",
    description:
      "Keep a consistent daily connection with the Quran through recitation and understanding.",
    sourceUrl: "Quran 38:29; Sahih Muslim",
    content: `# Daily Quran Reading

Choose an amount that can be maintained every day. A short consistent reading with reflection is better than an ambitious plan that is quickly abandoned.

## Daily practice

- Set a fixed time for recitation.
- Read carefully and respectfully.
- Study a reliable meaning or Tafsir.
- Record one lesson to apply.
- Review memorized passages.

## Source

Quran 38:29 describes the Quran as a blessed Book revealed for reflection. Authentic Hadith describe the virtue of reciting the Quran.`,
  },
  {
    slug: "amol-sleep-sunnah",
    title: "Sunnah Before Sleeping",
    description:
      "End the day with wudu, remembrance and the established manners of sleep.",
    sourceUrl: "Sahih al-Bukhari and Sahih Muslim",
    content: `# Sunnah Before Sleeping

Turn bedtime into worship by following the established guidance of the Prophet.

## Night practice

- Make wudu as for prayer.
- Dust the bed safely.
- Lie on the right side.
- Recite Ayat al-Kursi.
- Recite Al-Ikhlas, Al-Falaq and An-Nas and wipe over the body.
- Read the authentic sleeping supplications.

## Source

These practices are reported in Sahih al-Bukhari and Sahih Muslim.`,
  },
  {
    slug: "amol-friday",
    title: "Friday Sunnah and Worship",
    description:
      "Prepare for Jumuah, attend attentively and increase beneficial worship on Friday.",
    sourceUrl: "Quran 62:9; Sahih al-Bukhari and Sahih Muslim",
    content: `# Friday Sunnah and Worship

Friday is the weekly gathering of Muslims. Prepare early and protect the prayer from distraction.

## Friday practice

- Perform ghusl and wear clean clothes.
- Go to Jumuah early when possible.
- Listen quietly to the khutbah.
- Avoid distracting others.
- Increase salawat upon the Prophet.
- Make dua and use the day for beneficial worship.

## Source

Quran 62:9 commands believers to proceed to the remembrance of Allah when called for Friday prayer. Further manners are established in authentic Hadith.`,
  },
  {
    slug: "amol-charity-kindness",
    title: "Daily Charity and Kindness",
    description:
      "Make generosity, helpful speech and service to people part of every day.",
    sourceUrl: "Quran 2:261; Sahih Muslim",
    content: `# Daily Charity and Kindness

Charity includes wealth, time, help and good conduct. Look for a beneficial deed that can be completed every day.

## Daily practice

- Give a small amount regularly if able.
- Help family, neighbours and people in need.
- Speak kindly and avoid harm.
- Share useful knowledge responsibly.
- Keep intentions sincere and avoid showing off.

## Source

Quran 2:261 describes the multiplied reward of spending for Allah's sake. Authentic Hadith teach that many forms of goodness are charity.`,
  },
];

async function seedAmolContent(books) {
  const now = new Date();
  for (const item of amolItems)
    await books.updateOne(
      { slug: item.slug },
      {
        $setOnInsert: {
          ...item,
          author: "DeenIslam Editorial",
          category: "Amol",
          language: "English",
          languageCode: "en",
          license: "Original educational summary based on cited sources",
          coverImageUrl: "",
          coverImageKey: "",
          publicDomain: false,
          published: true,
          pages: [
            {
              number: 1,
              text: item.content,
              markdown: item.content,
              confidence: 100,
              needsReview: false,
            },
          ],
          extraction: {
            method: "editorial",
            pageCount: 1,
            averageConfidence: 100,
            needsReview: [],
          },
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true },
    );
}
module.exports = { seedAmolContent };
