export type PageSeo = {
  title: string;
  description: string;
  keywords: string[];
};

export const SITE_URL = "https://www.deenislam.app";

const common = ["Deen Islam", "Islamic Knowledge", "Muslim Guide"];

const pageSeo: Record<string, PageSeo> = {
  home: {
    title: "Deen Islam - Quran, Hadith, Dua & Islamic Guide",
    description: "Explore the Holy Quran, authentic Hadith, daily Duas, prayer times, Qibla direction, Tafsir, Islamic books, Zakat and Islamic AI with Deen Islam.",
    keywords: ["Deen Islam", "Al Quran Online", "Quran Bangla", "Authentic Hadith", "Islamic Books", "Daily Dua", "Namaz Time", "Prayer Times", "Qibla Direction", "Islamic AI", "Tafsir", "Zakat Calculator", "Islamic Calendar", "Ramadan 2027", "Islamic Knowledge"],
  },
  quran: {
    title: "Al Quran Online - Read & Listen Quran | Deen Islam",
    description: "Read and listen to the Holy Quran online with Surah, Juz, Sajdah, Arabic text and Quran translations on Deen Islam.",
    keywords: ["Al Quran Online", "Holy Quran", "Quran Bangla", "Quran English", "Read Quran", "Listen Quran", ...common],
  },
  hadith: {
    title: "Authentic Hadith - Bukhari, Muslim & More | Deen Islam",
    description: "Explore authentic Hadith collections including Sahih Bukhari, Sahih Muslim and daily Hadith with references.",
    keywords: ["Authentic Hadith", "Sahih Bukhari", "Sahih Muslim", "Hadith Bangla", "Hadith of the Day", ...common],
  },
  "islamic-books": {
    title: "Islamic Books Online - Read & Learn | Deen Islam",
    description: "Read Islamic books online about Quran, Hadith, Fiqh, Aqidah, Seerah, Islamic history and Muslim life.",
    keywords: ["Islamic Books", "Islamic Books Online", "Fiqh Books", "Aqidah", "Seerah", "Islamic History", ...common],
  },
  masala: {
    title: "Islamic Masala & Fiqh Answers | Deen Islam",
    description: "Find clear Islamic Masala, daily rulings and Fiqh guidance for worship and everyday Muslim life.",
    keywords: ["Islamic Masala", "Fiqh", "Islamic Rulings", "Islamic Questions", "Halal Haram", ...common],
  },
  "prayer-times": {
    title: "Namaz Time & Daily Prayer Times | Deen Islam",
    description: "Check accurate daily Namaz times for Fajr, Dhuhr, Asr, Maghrib and Isha based on your location.",
    keywords: ["Namaz Time", "Prayer Times", "Salah Time", "Fajr Time", "Maghrib Time", "Bangladesh Prayer Times", ...common],
  },
  "qibla-direction": {
    title: "Qibla Direction Finder & Compass | Deen Islam",
    description: "Find the accurate Qibla direction from your current location with the Deen Islam Qibla finder.",
    keywords: ["Qibla Direction", "Qibla Finder", "Qibla Compass", "Kaaba Direction", ...common],
  },
  "nearby-mosques": {
    title: "Nearby Mosques - Find a Mosque Near You | Deen Islam",
    description: "Discover nearby mosques and prayer locations around your current location with Deen Islam.",
    keywords: ["Nearby Mosques", "Mosque Near Me", "Masjid Near Me", "Prayer Location", ...common],
  },
  "islamic-ai": {
    title: "Islamic AI - Ask Islamic Questions | Deen Islam",
    description: "Ask Islamic questions and receive helpful answers based on trusted Quran, Hadith and Islamic sources.",
    keywords: ["Islamic AI", "Ask Islamic Questions", "Quran AI", "Islamic Assistant", ...common],
  },
  "daily-tasks": {
    title: "Daily Islamic Tasks & Habit Tracker | Deen Islam",
    description: "Build better Islamic habits with daily prayer, Quran, Dua, Zikr and good-deed tasks.",
    keywords: ["Daily Islamic Tasks", "Muslim Habit Tracker", "Daily Zikr", "Quran Reading", "Islamic Habits", ...common],
  },
  ramadan: {
    title: "Ramadan 2027 - Sehri, Iftar & Ramadan Guide | Deen Islam",
    description: "Explore Ramadan 2027 Sehri and Iftar times, fasting guidance, duas and daily Ramadan resources.",
    keywords: ["Ramadan 2027", "Sehri Time", "Iftar Time", "Ramadan Calendar", "Fasting Dua", ...common],
  },
  "islamic-calendar": {
    title: "Islamic Calendar & Hijri Dates | Deen Islam",
    description: "View today’s Hijri date, Islamic calendar, important Islamic events and observances.",
    keywords: ["Islamic Calendar", "Hijri Calendar", "Hijri Date", "Islamic Events", ...common],
  },
  knowledge: {
    title: "Islamic Knowledge & Learning | Deen Islam",
    description: "Learn Quran, Hadith, Aqidah, Fiqh, Seerah, Islamic history and essential knowledge for Muslims.",
    keywords: ["Islamic Knowledge", "Learn Islam", "Islamic Education", "Quran and Hadith", ...common],
  },
  community: {
    title: "Deen Islam Muslim Community",
    description: "Connect with the Deen Islam community and grow through beneficial Islamic learning and reminders.",
    keywords: ["Muslim Community", "Islamic Community", "Deen Islam Community", ...common],
  },
  downloads: {
    title: "Islamic Downloads | Deen Islam",
    description: "Access your downloaded Quran, Hadith, Islamic books and resources for convenient offline reading.",
    keywords: ["Islamic Downloads", "Offline Quran", "Download Hadith", "Islamic Resources", ...common],
  },
  bookmarks: {
    title: "Saved Islamic Bookmarks | Deen Islam",
    description: "Access your saved Quran verses, Hadith, Duas and Islamic learning content in one place.",
    keywords: ["Quran Bookmarks", "Saved Hadith", "Saved Dua", "Islamic Bookmarks", ...common],
  },
  settings: {
    title: "Settings | Deen Islam",
    description: "Manage your Deen Islam language, Quran reciter, notifications, privacy and account preferences.",
    keywords: ["Deen Islam Settings", "Quran Reciter", "Islamic App Settings", ...common],
  },
  tafsir: {
    title: "Quran Tafsir Online - Quran Explanation | Deen Islam",
    description: "Read Quran Tafsir and explanations to understand the meanings, lessons and guidance of the Holy Quran.",
    keywords: ["Tafsir", "Quran Tafsir", "Tafsir Online", "Quran Explanation", ...common],
  },
  zakat: {
    title: "Zakat Calculator & Zakat Guide | Deen Islam",
    description: "Calculate your Zakat and learn the essential rules, eligibility and guidance for giving Zakat.",
    keywords: ["Zakat Calculator", "Calculate Zakat", "Zakat Rules", "Zakat Guide", ...common],
  },
  "islamic-lifestyle": {
    title: "Islamic Lifestyle Guidance | Deen Islam",
    description: "Discover practical Islamic lifestyle guidance for worship, character, family and everyday life.",
    keywords: ["Islamic Lifestyle", "Muslim Lifestyle", "Daily Islamic Life", ...common],
  },
  prophets: {
    title: "Stories of the Prophets in Islam | Deen Islam",
    description: "Read inspiring and authentic stories of the Prophets and learn timeless lessons from their lives.",
    keywords: ["Stories of Prophets", "Islamic Prophets", "Prophet Stories", "Quran Stories", ...common],
  },
  sahaba: {
    title: "Stories of the Sahaba | Deen Islam",
    description: "Learn about the noble Companions of Prophet Muhammad ﷺ, their lives, character and sacrifices.",
    keywords: ["Sahaba", "Companions of Prophet", "Sahaba Stories", "Islamic History", ...common],
  },
  "islamic-history": {
    title: "Islamic History - Events & Heritage | Deen Islam",
    description: "Explore important people, events, civilizations and lessons throughout Islamic history.",
    keywords: ["Islamic History", "Muslim History", "Islamic Heritage", "History of Islam", ...common],
  },
  tasbih: {
    title: "Digital Tasbih & Zikr Counter | Deen Islam",
    description: "Use the digital Tasbih counter for daily Zikr, Dhikr goals and remembrance of Allah.",
    keywords: ["Digital Tasbih", "Tasbih Counter", "Zikr Counter", "Daily Dhikr", ...common],
  },
  "duas-and-amol": {
    title: "Daily Dua, Azkar & Islamic Amol | Deen Islam",
    description: "Read daily Duas, Azkar and beneficial Islamic Amol for worship, protection and everyday life.",
    keywords: ["Daily Dua", "Dua and Azkar", "Islamic Amol", "Masnoon Dua", ...common],
  },
  "help-center": {
    title: "Help Center & Support | Deen Islam",
    description: "Find answers to common questions about Quran, prayer times, downloads, bookmarks and Deen Islam features.",
    keywords: ["Deen Islam Help", "Deen Islam Support", "Islamic App Help", ...common],
  },
  "about-us": {
    title: "About Deen Islam - Your Daily Islamic Companion",
    description: "Learn about Deen Islam, its mission and the Islamic learning and worship tools available across the platform.",
    keywords: ["About Deen Islam", "Deen Islam App", "Islamic Companion", ...common],
  },
  contact: {
    title: "Contact Deen Islam",
    description: "Contact the Deen Islam team for support, feedback, questions and technical assistance.",
    keywords: ["Contact Deen Islam", "Deen Islam Support", "Islamic App Contact", ...common],
  },
  "privacy-policy": {
    title: "Privacy Policy | Deen Islam",
    description: "Read the Deen Islam privacy policy and learn how information, permissions and service data are handled.",
    keywords: ["Deen Islam Privacy Policy", "Privacy", "App Privacy", ...common],
  },
  "terms-and-conditions": {
    title: "Terms & Conditions | Deen Islam",
    description: "Read the terms and conditions governing access to and use of Deen Islam services.",
    keywords: ["Deen Islam Terms", "Terms and Conditions", "Terms of Use", ...common],
  },
};

export function getSeoForSlug(slug?: string): PageSeo {
  return pageSeo[slug || "home"] || pageSeo.home;
}

export function slugFromPath(pathname: string): string {
  return pathname.split("/").filter(Boolean)[0] || "home";
}
