export type WebTranslationTable = Record<string, string>;

type BundledTranslationPacks = Record<string, WebTranslationTable>;

// Verified copy used by the app but missing from some older API translation
// documents. These overrides keep app and web labels identical immediately;
// English remains the fallback for languages without a translated value.
const VERIFIED_WEB_TRANSLATIONS: BundledTranslationPacks = {
  bn: {
    "Islamic Books": "ইসলামি বই",
    Masala: "মাসআলা",
    "Prayer Times": "নামাজের সময়",
    "Qibla Direction": "কিবলার দিক",
    "Islamic AI": "ইসলামিক এআই",
    "Daily Prayer": "দৈনিক ইবাদত",
    "Islamic Lifestyle": "ইসলামি জীবনধারা",
    Prophets: "নবী-রাসুল",
    Sahaba: "সাহাবায়ে কেরাম",
    "Islamic History": "ইসলামের ইতিহাস",
    Ramadan: "রমজান",
    "Islamic Calendar": "ইসলামি ক্যালেন্ডার",
    Knowledge: "জ্ঞান",
    Community: "কমিউনিটি",
    Settings: "সেটিংস",
    "Read & Listen": "পড়ুন ও শুনুন",
    "Authentic Sayings": "বিশুদ্ধ বাণী",
    "Knowledge & Growth": "জ্ঞান ও বিকাশ",
    "Daily Islamic Rulings": "দৈনিক ইসলামি বিধান",
    "Stay on Track": "সময়মতো নামাজ",
    "Find Qibla": "কিবলা খুঁজুন",
    "Ask & Learn": "জিজ্ঞাসা করুন ও শিখুন",
    "Build Good Habits": "ভালো অভ্যাস গড়ুন",
    "Quran Explanation": "কুরআনের ব্যাখ্যা",
    "Calculate & Learn": "হিসাব করুন ও শিখুন",
    "Live With Deen": "দ্বীনের পথে জীবন",
    "Stories & Lessons": "ঘটনা ও শিক্ষা",
    "Noble Companions": "সম্মানিত সাহাবিগণ",
    "Explore Our Heritage": "ইসলামের ঐতিহ্য জানুন",
    "Digital Dhikr": "ডিজিটাল জিকির",
    "Daily Worship": "দৈনিক ইবাদত",
    "All Deen Islam services": "সব দ্বীনি সেবা",
    "View All Prayer Times": "সব নামাজের সময় দেখুন",
    "Starts in": "শুরু হতে বাকি",
  },
};

const withVerifiedOverrides = (
  language: string,
  strings: WebTranslationTable,
): WebTranslationTable => ({
  ...strings,
  ...(VERIFIED_WEB_TRANSLATIONS[language] ??
    VERIFIED_WEB_TRANSLATIONS[language.split("-")[0]] ??
    {}),
});

async function loadBundledTranslationPack(
  language: string,
): Promise<WebTranslationTable> {
  if (language === "en") return {};
  try {
    // The native app is the canonical source for all 195 language packs.
    // Load it lazily so it does not increase the initial page payload.
    const module = await import("../data/uiTranslations.json");
    const packs = (module.default ?? module) as BundledTranslationPacks;
    return packs[language] ?? packs[language.split("-")[0]] ?? {};
  } catch {
    return {};
  }
}

export async function loadWebTranslationPack(
  api: string,
  language: string,
): Promise<WebTranslationTable> {
  if (language === "en") return {};
  const bundled = await loadBundledTranslationPack(language);
  try {
    const response = await fetch(
      `${api}/api/translations/${encodeURIComponent(language)}?refresh=${Date.now()}`,
      { cache: "no-store" },
    );
    const body = await response.json();
    if (
      response.ok &&
      body.data?.strings &&
      typeof body.data.strings === "object"
    )
      return withVerifiedOverrides(language, {
        ...bundled,
        ...body.data.strings,
      });
  } catch {}
  return withVerifiedOverrides(language, bundled);
}
