const express = require("express");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const { deleteReplacedImages, deleteStoredImages } = require("./s3-books");

const clean = (v, n = 50000) =>
  String(v ?? "")
    .trim()
    .slice(0, n);
const lang = (v) => {
  const x = clean(v, 20).toLowerCase();
  return /^[a-z]{2,3}(?:-[a-z]{2,8})?$/.test(x) ? x : "en";
};

const cleanTafsir = (value) =>
  String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, "“")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();

const CANONICAL_SOURCES = [
  {
    recordType: "source",
    sourceId: "165",
    name: "Tafsir Ahsanul Bayaan (তাফসীর আহসানুল বায়ান)",
    author_name: "Bayaan Foundation / Salahuddin Yusuf",
    language_name: "bengali",
    language: "bn",
    description:
      "সহিহ আকীদা ভিত্তিক নির্ভরযোগ্য বাংলা তাফসীর। সংক্ষিপ্ত কিন্তু সুস্পষ্ট ব্যাখ্যা।",
    order: 1,
    published: true,
  },
  {
    recordType: "source",
    sourceId: "166",
    name: "Tafsir Abu Bakr Zakaria (তাফসীর ড. আবু বকর মুহাম্মাদ যাকারিয়া)",
    author_name: "King Fahd Quran Printing Complex / Dr. Abu Bakr Zakaria",
    language_name: "bengali",
    language: "bn",
    description:
      "কুরআনুল কারীম বাংলা অনুবাদ ও সংক্ষিপ্ত তাফসীর (মদিনা প্রিন্ট)।",
    order: 2,
    published: true,
  },
  {
    recordType: "source",
    sourceId: "164",
    name: "Tafseer ibn Kathir (তাফসীর ইবনে কাসীর - বাংলা)",
    author_name: "Tawheed Publication / Hafiz Ibn Kathir",
    language_name: "bengali",
    language: "bn",
    description: "বিশ্ববিখ্যাত তাফসীরে ইবনে কাসীর এর নির্ভরযোগ্য বাংলা অনুবাদ।",
    order: 3,
    published: true,
  },
  {
    recordType: "source",
    sourceId: "381",
    name: "Tafsir Fathul Majid (তাফসীর ফাতহুল মাজীদ)",
    author_name: "AbdulRahman Bin Hasan Al-Alshaikh",
    language_name: "bengali",
    language: "bn",
    description: "কিতাবুত তাওহীদের বিশদ ব্যাখ্যা সম্বলিত তাফসীর।",
    order: 4,
    published: true,
  },
  {
    recordType: "source",
    sourceId: "169",
    name: "Tafsir Ibn Kathir (Abridged - English)",
    author_name: "Hafiz Ibn Kathir",
    language_name: "english",
    language: "en",
    description:
      "The renowned classical commentary of the Holy Quran in English.",
    order: 5,
    published: true,
  },
  {
    recordType: "source",
    sourceId: "168",
    name: "Ma'arif al-Qur'an (English)",
    author_name: "Mufti Muhammad Shafi",
    language_name: "english",
    language: "en",
    description: "Comprehensive, detailed English Quranic commentary.",
    order: 6,
    published: true,
  },
  {
    recordType: "source",
    sourceId: "817",
    name: "Tazkirul Quran (English)",
    author_name: "Maulana Wahid Uddin Khan",
    language_name: "english",
    language: "en",
    description: "Contemporary reflection and commentary of the Quran.",
    order: 7,
    published: true,
  },
  {
    recordType: "source",
    sourceId: "16",
    name: "Tafsir Muyassar (التفسير الميسر)",
    author_name: "المیسر (King Fahd Complex)",
    language_name: "arabic",
    language: "ar",
    description: "تفسير ميسر ومختصر للقرآن الكريم من مجمع الملك فهد.",
    order: 8,
    published: true,
  },
  {
    recordType: "source",
    sourceId: "14",
    name: "Tafsir Ibn Kathir (تفسير ابن كثير - عربي)",
    author_name: "Hafiz Ibn Kathir",
    language_name: "arabic",
    language: "ar",
    description: "تفسير القرآن العظيم للحافظ ابن كثير الدمشقي.",
    order: 9,
    published: true,
  },
  {
    recordType: "source",
    sourceId: "15",
    name: "Tafsir al-Tabari (جامع البيان - الطبري)",
    author_name: "Imam Muhammad ibn Jarir al-Tabari",
    language_name: "arabic",
    language: "ar",
    description: "أعظم وأشمل تفاسير القرآن بالمأثور للإمام الطبري.",
    order: 10,
    published: true,
  },
  {
    recordType: "source",
    sourceId: "90",
    name: "Tafsir al-Qurtubi (الجامع لأحكام القرآن)",
    author_name: "Imam al-Qurtubi",
    language_name: "arabic",
    language: "ar",
    description: "الجامع لأحكام القرآن والمبين لما تضمنه من السنة وآي الفرقان.",
    order: 11,
    published: true,
  },
  {
    recordType: "source",
    sourceId: "91",
    name: "Tafsir Al-Sa'di (تيسير الكريم الرحمن - السعدي)",
    author_name: "Abdur-Rahman al-Sa'di",
    language_name: "arabic",
    language: "ar",
    description: "تيسير الكريم الرحمن في تفسير كلام المنان للشيخ السعدي.",
    order: 12,
    published: true,
  },
  {
    recordType: "source",
    sourceId: "93",
    name: "Al-Tafsir al-Wasit (التفسير الوسيط - طنطاوي)",
    author_name: "Dr. Muhammad Sayyid Tantawi",
    language_name: "arabic",
    language: "ar",
    description: "التفسير الوسيط للقرآن الكريم لفضيلة الشيخ محمد سيد طنطاوي.",
    order: 13,
    published: true,
  },
  {
    recordType: "source",
    sourceId: "94",
    name: "Tafsir Al-Baghawi (معالم التنزيل - البغوي)",
    author_name: "Imam al-Baghawi",
    language_name: "arabic",
    language: "ar",
    description: "معالم التنزيل في تفسير القرآن للإمام البغوي.",
    order: 14,
    published: true,
  },
  {
    recordType: "source",
    sourceId: "157",
    name: "Fi Zilal al-Quran (فی ظلال القرآن - اردو)",
    author_name: "Sayyid Ibrahim Qutb",
    language_name: "urdu",
    language: "ur",
    description: "سید قطب شہید کی معروف تفسیر فی ظلال القرآن کا اردو ترجمہ۔",
    order: 15,
    published: true,
  },
  {
    recordType: "source",
    sourceId: "160",
    name: "Tafsir Ibn Kathir (تفسیر ابن کثیر - اردو)",
    author_name: "Hafiz Ibn Kathir",
    language_name: "urdu",
    language: "ur",
    description: "معروف ترین اور مستند تفسیر ابن کثیر کا مستند اردو ترجمہ۔",
    order: 16,
    published: true,
  },
  {
    recordType: "source",
    sourceId: "159",
    name: "Bayan ul Quran (بیان القرآن - ڈاکٹر اسرار احمد)",
    author_name: "Dr. Israr Ahmad",
    language_name: "urdu",
    language: "ur",
    description: "ڈاکٹر اسرار احمد رحمہ اللہ کی عام فہم اور اثر انگیز تفسیر۔",
    order: 17,
    published: true,
  },
  {
    recordType: "source",
    sourceId: "818",
    name: "Tazkir ul Quran (تذکیر القرآن - اردو)",
    author_name: "Maulana Wahid Uddin Khan",
    language_name: "urdu",
    language: "ur",
    description: "مولانا وحید الدین خان کی بصیرت افروز تفسیر تذکیر القرآن۔",
    order: 18,
    published: true,
  },
  {
    recordType: "source",
    sourceId: "170",
    name: "Tafsir Al-Sa'di (Тафсир ас-Саади - Русский)",
    author_name: "Abdur-Rahman al-Sa'di",
    language_name: "russian",
    language: "ru",
    description:
      "Облегчение от Великодушного и Милосердного в толковании слов Благодетеля.",
    order: 19,
    published: true,
  },
  {
    recordType: "source",
    sourceId: "804",
    name: "Rebar Kurdish Tafsir (تەفسیری ڕێبەر - کوردی)",
    author_name: "Rebar Kurdish Tafsir",
    language_name: "kurdish",
    language: "ku",
    description: "تەفسیری قورئانی پیرۆز بە زمانی شیرینی کوردی.",
    order: 20,
    published: true,
  },
];

const SOURCE_ALIASES = {
  "bn-ahsanul-bayan": "165",
  "bn-abu-bakr-zakaria": "166",
  "bn-ibn-kathir": "164",
};

const INITIAL_COMMENTARIES = [
  {
    recordType: "commentary",
    sourceId: "165",
    sourceName: "Tafsir Ahsanul Bayaan (তাফসীর আহসানুল বায়ান)",
    authorName: "Salahuddin Yusuf / Dr. Muhammad Asadullah",
    language: "bn",
    surahNumber: 1,
    ayahNumber: 1,
    surahName: "Al-Faatiha",
    title: "বিসমিল্লাহির রাহমানির রাহীম এর তাফসীর ও ফজিলত",
    text: 'বিসমিল্লাহির রাহমানির রাহীম (পরম করুণাময়, অসীম দয়ালু আল্লাহর নামে শুরু করছি)।\n\n১. সুরার শুরুতে বিসমিল্লাহ পাঠ করার নির্দেশ রয়েছে। আল্লাহ তাআলার নামের মাধ্যমে যেকোনো ভালো কাজ শুরু করা বরকত ও কল্যাণের কারণ। রাসুলুল্লাহ (সা.) বলেছেন, "প্রত্যেক গুরুত্বপূর্ণ কাজ যা বিসমিল্লাহ ব্যতীত শুরু করা হয়, তা বরকতহীন।"\n২. ‘আল্লাহ’ মহান সত্তার জাতি বা সত্তাগত নাম। আর ‘রাহমান’ ও ‘রাহীম’ তাঁর দুটি মহান গুণবাচক নাম। রাহমান শব্দের অর্থ এমন করুণাময় যাঁর অনুগ্রহ তামাম সৃষ্টির ওপর ব্যাপক। আর রাহীম শব্দের অর্থ এমন দয়ালু যাঁর বিশেষ করুণা আখেরাতে মুমিনদের জন্য নির্দিষ্ট থাকবে।',
    published: true,
  },
  {
    recordType: "commentary",
    sourceId: "165",
    sourceName: "Tafsir Ahsanul Bayaan (তাফসীর আহসানুল বায়ান)",
    authorName: "Salahuddin Yusuf / Dr. Muhammad Asadullah",
    language: "bn",
    surahNumber: 1,
    ayahNumber: 2,
    surahName: "Al-Faatiha",
    title: "আলহামদু লিল্লাহি রাব্বিল আলামীন এর তাফসীর",
    text: "সমস্ত প্রশংসা ও কৃতজ্ঞতা একমাত্র আল্লাহর জন্য, যিনি সমগ্র সৃষ্টির পালনকর্তা।\n\n১. ‘হামদ’ শব্দের মধ্যে প্রশংসা ও কৃতজ্ঞতা উভয় অর্থই শামিল। আল্লাহ তাআলা যে সমস্ত নিয়ামত দান করেছেন, তার শুকরিয়া এবং তাঁর পরিপূর্ণ গুণাবলীর জন্য একমাত্র তিনিই প্রশংসার হকদার।\n২. ‘রব’ শব্দের অর্থ পালনকর্তা, রক্ষক, নিয়ন্ত্রক ও প্রভু। যিনি সমস্ত সৃষ্টিকে অনস্তিত্ব থেকে অস্তিত্বে এনেছেন এবং তাদের লালন-পালন ও প্রয়োজন পূরণ করে চলেছেন।\n৩. ‘আলামীন’ হলো আলম শব্দের বহুবচন, যার অর্থ সমগ্র সৃষ্টিজগত। আসমান, জমিন এবং উভয়ের মধ্যে যা কিছু আছে সবই এর অন্তর্ভুক্ত।",
    published: true,
  },
  {
    recordType: "commentary",
    sourceId: "165",
    sourceName: "Tafsir Ahsanul Bayaan (তাফসীর আহসানুল বায়ান)",
    authorName: "Salahuddin Yusuf / Dr. Muhammad Asadullah",
    language: "bn",
    surahNumber: 2,
    ayahNumber: 183,
    surahName: "Al-Baqara",
    title: "রমজানের রোজা ফরজ হওয়ার বিধান ও উদ্দেশ্য",
    text: "হে ঈমানদারগণ! তোমাদের ওপর রোজা ফরজ করা হয়েছে, যেমন ফরজ করা হয়েছিল তোমাদের পূর্ববর্তীদের ওপর; যাতে তোমরা তাকওয়া অর্জন করতে পার।\n\n১. এই আয়াতে মুমিনদের জন্য সিয়াম (রোজা) ফরজ করার ঘোষণা এসেছে। এর মূল উদ্দেশ্য হলো অন্তরে আল্লাহভীতি বা ‘তাকওয়া’ সৃষ্টি করা। রোজা মানুষের কুপ্রবৃত্তিকে নিয়ন্ত্রণ করে আত্মশুদ্ধি অর্জন করতে সহায়তা করে।\n২. পূর্ববর্তী উম্মতদের ওপরও রোজা ফরজ ছিল, যা প্রমাণ করে রোজা সকল শরীয়তেই একটি অত্যন্ত গুরুত্বপূর্ণ ইবাদত ছিল। তবে সময় ও বিধানে কিছুটা পার্থক্য ছিল।",
    published: true,
  },
  {
    recordType: "commentary",
    sourceId: "166",
    sourceName:
      "Tafsir Abu Bakr Zakaria (তাফসীর ড. আবু বকর মুহাম্মাদ যাকারিয়া)",
    authorName: "Dr. Abu Bakr Muhammad Zakaria",
    language: "bn",
    surahNumber: 2,
    ayahNumber: 255,
    surahName: "Al-Baqara",
    title: "আয়াতুল কুরসীর বিশদ তাফসীর ও মহান মর্যাদা",
    text: "আল্লাহ, তিনি ছাড়া কোনো সত্য ইলাহ নেই; তিনি চিরঞ্জীব, সর্বসত্তার ধারক। তাঁকে তন্দ্রাও স্পর্শ করে না এবং নিদ্রাও নয়। আসমানসমূহে যা কিছু আছে এবং যমীনে যা কিছু আছে সবই তাঁর।\n\n১. এই আয়াতটি কুরআনের সর্বশ্রেষ্ঠ আয়াত। সহীহ হাদিসে একে ‘সায়্যিদাতু আয়াতিল কুরআন’ (কুরআনের আয়াতসমূহের সরদার) বলা হয়েছে। যে ব্যক্তি প্রতি ফরজ সালাতের পর আয়াতুল কুরসী পাঠ করে, তার জান্নাতে প্রবেশের পথে মৃত্যু ছাড়া আর কোনো বাধা থাকে না (নাসাঈ)।\n২. ‘আল-হাইয়্যু’ অর্থ চিরঞ্জীব, যাঁর কোনো ধ্বংস বা মৃত্যু নেই। ‘আল-কাইয়্যুম’ অর্থ যিনি নিজে প্রতিষ্ঠিত এবং সমস্ত সৃষ্টিকে স্থায়িত্ব ও পরিচালনা দান করেন।\n৩. ‘কুরসী’ হলো আল্লাহর আরশের নিম্নে অবস্থিত এক মহান সৃষ্টি। আবু যার (রা.) বর্ণিত হাদিসে এসেছে, কুরসীর তুলনায় সপ্ত আসমান যেন এক বিশাল মরুভূমিতে নিক্ষেপ করা একটি ক্ষুদ্র আংটি।",
    published: true,
  },
  {
    recordType: "commentary",
    sourceId: "164",
    sourceName: "Tafseer ibn Kathir (তাফসীর ইবনে কাসীর - বাংলা)",
    authorName: "Tawheed Publication / Hafiz Ibn Kathir",
    language: "bn",
    surahNumber: 2,
    ayahNumber: 285,
    surahName: "Al-Baqara",
    title: "সূরা বাকারার শেষ দুই আয়াতের তাফসীর ও ফজিলত",
    text: "রাসূল তাঁর প্রতিপালকের পক্ষ থেকে যা অবতীর্ণ হয়েছে তার ওপর ঈমান এনেছেন এবং মুমিনগণও। তারা সবাই ঈমান এনেছে আল্লাহর প্রতি, তাঁর ফেরেশতাগণের প্রতি, তাঁর কিতাবসমূহের প্রতি এবং তাঁর রাসূলগণের প্রতি...\n\n১. রাসূলুল্লাহ (সা.) বলেছেন, \"যে ব্যক্তি রাতে সূরা বাকারার শেষ দুটি আয়াত তিলাওয়াত করবে, তা তার সুরক্ষার জন্য যথেষ্ট হবে।\" (সহীহ বুখারী ও মুসলিম)।\n২. এই আয়াতে ঈমানের ছয়টি মূল স্তম্ভের বর্ণনা রয়েছে। মুমিনরা নবী-রাসূলদের কারো মাঝে কোনো পার্থক্য বা বৈষম্য করে না, বরং সকল নবীকেই আল্লাহর সত্য দূত হিসেবে স্বীকার করে।\n৩. ‘সামি'না ওয়া আত্বা'না’ (আমরা শুনলাম ও আনুগত্য করলাম) হলো একজন খাঁটি মুমিনের হৃদয়ের চিরন্তন ঘোষণা।",
    published: true,
  },
  {
    recordType: "commentary",
    sourceId: "165",
    sourceName: "Tafsir Ahsanul Bayaan (তাফসীর আহসানুল বায়ান)",
    authorName: "Salahuddin Yusuf / Dr. Muhammad Asadullah",
    language: "bn",
    surahNumber: 18,
    ayahNumber: 1,
    surahName: "Al-Kahf",
    title: "কুরআন অবতীর্ণের জন্য আল্লাহর প্রশংসা ও সূরা কাহফের ফজিলত",
    text: "সমস্ত প্রশংসা আল্লাহর, যিনি তাঁর বান্দার প্রতি এই কিতাব অবতীর্ণ করেছেন এবং এতে কোনো বক্রতা রাখেননি।\n\n১. সূরা কাহফ জুমুআর দিনে পাঠ করার বিশেষ ফজিলত রয়েছে। হাদিসে এসেছে, যে ব্যক্তি জুমুআর দিন সূরা কাহফ পড়বে, তার জন্য এক জুমুআ থেকে অন্য জুমুআ পর্যন্ত বিশেষ নূর চমকাতে থাকবে (বায়হাকী)। দাজ্জালের ফিতনা থেকে মুক্তির অন্যতম মাধ্যম হলো এই সূরার প্রথম ও শেষ দশটি আয়াত।\n২. আল্লাহ তাআলা নিজের প্রশংসা দিয়ে এই সূরা শুরু করেছেন, কারণ মানবজাতিকে অন্ধকার থেকে আলোর পথে আনার জন্য কুরআন অবতীর্ণ করাই হলো সর্বশ্রেষ্ঠ অনুগ্রহ।\n৩. ‘লাম ইয়াজ'আল লাহু ইওয়াজা’ অর্থ এতে কোনো জটিলতা, বৈপরীত্য বা অসঙ্গতি নেই; বরং এটি সম্পূর্ণ সহজ, সরল ও সত্যের ওপর প্রতিষ্ঠিত।",
    published: true,
  },
  {
    recordType: "commentary",
    sourceId: "166",
    sourceName:
      "Tafsir Abu Bakr Zakaria (তাফসীর ড. আবু বকর মুহাম্মাদ যাকারিয়া)",
    authorName: "Dr. Abu Bakr Muhammad Zakaria",
    language: "bn",
    surahNumber: 36,
    ayahNumber: 1,
    surahName: "Yaseen",
    title: "সূরা ইয়াসীনের প্রারম্ভিক আয়াতসমূহের তাফসীর",
    text: "ইয়াসীন। শপথ প্রজ্ঞাময় কুরআনের; নিশ্চয় আপনি রাসূলদের অন্তর্ভুক্ত, সরল-সঠিক পথের ওপর প্রতিষ্ঠিত।\n\n১. ‘ইয়াসীন’ হলো হুরুফে মুকাত্তাআতের অন্তর্ভুক্ত। এর নিশ্চিত অর্থ একমাত্র আল্লাহ তাআলাই ভালো জানেন। তবে এটি কুরআনের মুজিজা বা অলৌকিকত্বের প্রমাণ।\n২. আল্লাহ তাআলা ‘আল-কুরআনিল হাকীম’ বা প্রজ্ঞাপূর্ণ কুরআনের শপথ করে মুহাম্মদ (সা.)-এর রিসালাতের সত্যতা ঘোষণা করেছেন।\n৩. এই সূরাকে হাদিসে ‘কুরআনের হৃদয়’ (কালবুল কুরআন) বলা হয়েছে এবং এটি তাওহীদ, রিসালাত ও আখেরাতের প্রমাণাদি তুলে ধরে।",
    published: true,
  },
  {
    recordType: "commentary",
    sourceId: "381",
    sourceName: "Tafsir Fathul Majid (তাফসীর ফাতহুল মাজীদ)",
    authorName: "AbdulRahman Bin Hasan Al-Alshaikh",
    language: "bn",
    surahNumber: 67,
    ayahNumber: 1,
    surahName: "Al-Mulk",
    title: "তাবারাকাল্লাযী: সর্বময় কর্তৃত্বের মালিক আল্লাহর মহিমা",
    text: 'বরকতময় তিনি যাঁর হাতে সর্বময় কর্তৃত্ব, এবং তিনি সব কিছুর ওপর পূর্ণ ক্ষমতাবান।\n\n১. রাসূলুল্লাহ (সা.) বলেছেন, "কুরআনে ত্রিশ আয়াতবিশিষ্ট একটি সূরা রয়েছে, যা এক ব্যক্তির জন্য সুপারিশ করবে যতক্ষণ না তাকে ক্ষমা করে দেওয়া হয়; তা হলো সূরা তাবারাকাল্লাযী বিয়াদিহিল মুলক।" (তিরমিযী ও আবু দাউদ)। কবর আযাব থেকে সুরক্ষার জন্য এটি প্রতি রাতে পাঠ করার শিক্ষা দেওয়া হয়েছে।\n২. ‘তাবারাকা’ শব্দের অর্থ কল্যাণময়, মহিমান্বিত ও বরকতের আধার। সমগ্র মহাবিশ্ব ও সৃষ্টির রাজত্ব একমাত্র আল্লাহর হাতেই ন্যস্ত।\n৩. তিনি জীবন ও মৃত্যুকে সৃষ্টি করেছেন পরীক্ষা করার জন্য—কে সৎকর্মে সবচেয়ে উৎকৃষ্ট।',
    published: true,
  },
  {
    recordType: "commentary",
    sourceId: "164",
    sourceName: "Tafseer ibn Kathir (তাফসীর ইবনে কাসীর - বাংলা)",
    authorName: "Tawheed Publication / Hafiz Ibn Kathir",
    language: "bn",
    surahNumber: 112,
    ayahNumber: 1,
    surahName: "Al-Ikhlaas",
    title: "সূরা আল-ইখলাস: আল্লাহর একত্ববাদের পরিপূর্ণ ঘোষণা",
    text: "বলুন, তিনিই আল্লাহ, একক ও অদ্বিতীয়। আল্লাহ কারো মুখাপেক্ষী নন, সকলেই তাঁর মুখাপেক্ষী। তিনি কাউকে জন্ম দেননি এবং তাঁকেও কেউ জন্ম দেয়নি। আর তাঁর সমকক্ষ কেউই নেই।\n\n১. এই সূরাটি কুরআনের এক-তৃতীয়াংশের সমতুল্য (সহীহ বুখারী)। এতে তাওহীদে আসমা ও সিফাতের পূর্ণাঙ্গ বর্ণনা রয়েছে।\n২. ‘আল্লাহুস সামাদ’ এর অর্থ হলো—তিনি এমন এক সত্তা যাঁর কোনো অভাব নেই, যিনি চিরস্থায়ী, পরমনির্ভর এবং সকল সৃষ্টি যার দিকে মুখাপেক্ষী হয়ে সাহায্য প্রার্থনা করে।\n৩. মুশরিক ও বিধর্মীরা আল্লাহর বংশপরিচয় জানতে চাইলে এই সূরা অবতীর্ণ হয়। এতে সুস্পষ্টভাবে খ্রিষ্টানদের ত্রিত্ববাদ ও মুশরিকদের শিরকের মূলোৎপাটন করা হয়েছে।",
    published: true,
  },
  {
    recordType: "commentary",
    sourceId: "165",
    sourceName: "Tafsir Ahsanul Bayaan (তাফসীর আহসানুল বায়ান)",
    authorName: "Salahuddin Yusuf / Dr. Muhammad Asadullah",
    language: "bn",
    surahNumber: 113,
    ayahNumber: 1,
    surahName: "Al-Falaq",
    title:
      "সূরা আল-ফালাক: যাবতীয় অনিষ্ট ও হিংসা থেকে আল্লাহর আশ্রয় প্রার্থনা",
    text: "বলুন, আমি আশ্রয় প্রার্থনা করছি প্রভাতের পালনকর্তার নিকট, তিনি যা সৃষ্টি করেছেন তার অনিষ্ট হতে, অন্ধকার রাতের অনিষ্ট হতে যখন তা সমাগত হয়, গ্রন্থিতে ফুঁৎকারকারিণীদের অনিষ্ট হতে এবং হিংসুকের অনিষ্ট হতে যখন সে হিংসা করে।\n\n১. সূরা ফালাক ও সূরা নাসকে একত্রে ‘মুআউবিযাতাইন’ বলা হয়। কোনো অনিষ্ট, জাদু বা বদনজর থেকে সুরক্ষার জন্য এই দুটি সূরা পাঠ করা সবচেয়ে শক্তিশালী ঢাল।\n২. ‘ফালাক’ অর্থ প্রভাত বা অন্ধকার ভেদ করে আলোর উন্মেষ।\n৩. হিংসুক যখন হিংসা প্রকাশ করে বা ষড়যন্ত্রে লিপ্ত হয়, তখন তার ক্ষতি অত্যন্ত মারাত্মক। কেবল সর্বশক্তিমান আল্লাহর নিকটই এর থেকে পরিপূর্ণ আশ্রয় পাওয়া সম্ভব।",
    published: true,
  },
  {
    recordType: "commentary",
    sourceId: "169",
    sourceName: "Tafsir Ibn Kathir (English)",
    authorName: "Hafiz Ibn Kathir",
    language: "en",
    surahNumber: 1,
    ayahNumber: 1,
    surahName: "Al-Faatiha",
    title: "The Virtue and Meaning of the Basmalah",
    text: 'In the Name of Allah, the Most Gracious, the Most Merciful.\n\n1. The Basmalah is recommended at the start of every good and noble deed. It begins with "Allah", the Greatest Name of the Lord, followed by "Ar-Rahman" (The Entirely Merciful) whose mercy encompasses all creation, and "Ar-Rahim" (The Especially Merciful) who shows specialized mercy to the believers on the Day of Judgment.\n2. Scholars agree that reciting Bismillah invokes Divine blessings and drives away the interference of Shaytan.',
    published: true,
  },
  {
    recordType: "commentary",
    sourceId: "169",
    sourceName: "Tafsir Ibn Kathir (English)",
    authorName: "Hafiz Ibn Kathir",
    language: "en",
    surahNumber: 2,
    ayahNumber: 255,
    surahName: "Al-Baqara",
    title: "Ayat al-Kursi - The Greatest Verse in the Quran",
    text: 'Allah! There is no deity except Him, the Ever-Living, the Sustainer of all existence. Neither drowsiness overtakes Him nor sleep...\n\n1. This is Ayat al-Kursi and it has a tremendous station in Islam. In the authentic Hadith reported by Ubayy bin Ka\'b, the Prophet (peace be upon him) asked him which verse in the Book of Allah was the greatest, and he answered: "Allahu la ilaha illa Huwa Al-Hayyu Al-Qayyum." The Prophet struck his chest gently and said: "May knowledge delight you, O Abu al-Mundhir!"\n2. "Al-Hayy" means the One Who is eternally alive and never dies. "Al-Qayyum" signifies the One Who sustains all creation while being self-sufficient Himself.',
    published: true,
  },
  {
    recordType: "commentary",
    sourceId: "168",
    sourceName: "Ma'arif al-Qur'an (English)",
    authorName: "Mufti Muhammad Shafi",
    language: "en",
    surahNumber: 1,
    ayahNumber: 1,
    surahName: "Al-Faatiha",
    title: "Surat al-Fatihah: The Opening of the Holy Book",
    text: "In the Name of Allah, the Most Gracious, the Most Merciful.\n\n1. Surat al-Fatihah serves as an overture to the Holy Quran. It teaches mankind the proper manner of seeking guidance from Allah before reading His divine message.\n2. In Ma'arif al-Qur'an, Mufti Muhammad Shafi explains that this Surah contains a summary of all essential Quranic themes: Tawhid (Monotheism), Risalah (Prophethood), and Akhirah (the Day of Judgment).",
    published: true,
  },
  {
    recordType: "commentary",
    sourceId: "817",
    sourceName: "Tazkirul Quran (English)",
    authorName: "Maulana Wahid Uddin Khan",
    language: "en",
    surahNumber: 112,
    ayahNumber: 1,
    surahName: "Al-Ikhlaas",
    title: "The Essence of Monotheism - Tazkirul Quran",
    text: "Say, 'He is Allah, [who is] One.'\n\n1. Surah Al-Ikhlas encapsulates the core teaching of Islam: pure and unadulterated monotheism. God is distinct from His creation, without beginning or end, and entirely unique.\n2. In Tazkirul Quran, Maulana Wahiduddin Khan explains that true discovery of God leads to humbleness, righteous living, and the realization of human dependence on the Creator.",
    published: true,
  },
  {
    recordType: "commentary",
    sourceId: "16",
    sourceName: "Tafsir Muyassar (التفسير الميسر)",
    authorName: "المیسر (King Fahd Complex)",
    language: "ar",
    surahNumber: 1,
    ayahNumber: 1,
    surahName: "Al-Faatiha",
    title: "تفسير سورة الفاتحة - التفسير الميسر",
    text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\n\n١. أَبْدَأُ قِرَاءَتِي مُسْتَعِينًا بِاسْمِ اللَّهِ، وَ«اللَّهُ» عَلَمٌ عَلَى الرَّبِّ -تَبَارَكَ وَتَعَالَى- الْمَعْبُودِ بِحَقٍّ دُونَ سِوَاهُ، وَهُوَ أَخَصُّ أَسْمَاءِ اللَّهِ تَعَالَى، لَا يُسَمَّى بِهِ غَيْرُهُ سُبْحَانَهُ.\n٢. «الرَّحْمَنِ»: ذِي الرَّحْمَةِ الْعَامَّةِ الَّتِي وَسِعَتْ كُلَّ شَيْءٍ، «الرَّحِيمِ»: بِالْمُؤْمِنِينَ خَاصَّةً فِي الدُّنْيَا وَالْآخِرَةِ.",
    published: true,
  },
  {
    recordType: "commentary",
    sourceId: "91",
    sourceName: "Tafsir Al-Sa'di (تيسير الكريم الرحمن - السعدي)",
    authorName: "Abdur-Rahman al-Sa'di",
    language: "ar",
    surahNumber: 2,
    ayahNumber: 255,
    surahName: "Al-Baqara",
    title: "تفسير آية الكرسي العظيمة - الشيخ السعدي",
    text: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...\n\n١. هذه الآية الكريمة أعظم آيات القرآن وأفضلها وأجلها، وذلك لما اشتملت عليه من الأمور العظيمة والصفات الكريمة للرب جل جلاله.\n٢. فأخبر أنه المنفرد بالألوهية لجميع الخلق، وأنه «الْحَيُّ» الكامل في حياته الذي لا يموت، «الْقَيُّومُ» الذي قام بنفسه واستغنى عن جميع خلقه، وقام بجميع الموجودات فأوجدها وحفظها وأمدها بما تحتاج إليه.",
    published: true,
  },
  {
    recordType: "commentary",
    sourceId: "159",
    sourceName: "Bayan ul Quran (بیان القرآن - ڈاکٹر اسرار احمد)",
    authorName: "Dr. Israr Ahmad",
    language: "ur",
    surahNumber: 103,
    ayahNumber: 1,
    surahName: "Al-Asr",
    title: "تفسیر سورۃ العصر - نجات کی چار شرائط",
    text: "وَالْعَصْرِ ۙ إِنَّ الْإِنسَانَ لَفِي خُسْرٍ\n\n١. قسم ہے زمانے کی! یقیناً انسان خسارے میں ہے۔ سوائے ان کے جو ایمان لائے، اور جنہوں نے نیک عمل کیے، اور جنہوں نے ایک دوسرے کو حق کی وصیت کی، اور صبر کی تلقین کی۔\n٢. ڈاکٹر اسرار احمد رحمہ اللہ بیان فرماتے ہیں کہ یہ سورت قرآن مجید کا جامع ترین خلاصہ ہے۔ امام شافعی رحمہ اللہ نے فرمایا تھا کہ اگر لوگ صرف اسی ایک سورت پر غور و فکر کر لیں تو یہ ان کی نجات اور ہدایت کے لیے کافی ہے۔ انسانی کامیابی ایمان، عمل صالح، دعوت حق اور صبر پر منحصر ہے۔",
    published: true,
  },
];

async function seedTafsirData(collection) {
  try {
    const now = new Date();
    // Drop legacy index if present so it doesn't conflict
    try {
      await collection.dropIndex("surah_1_ayah_1_sourceId_1_language_1");
    } catch {}

    // 1. Ensure all 20 canonical sources exist in MongoDB
    for (const s of CANONICAL_SOURCES) {
      await collection.updateOne(
        { recordType: "source", sourceId: s.sourceId },
        {
          $set: {
            name: s.name,
            author_name: s.author_name,
            language_name: s.language_name,
            language: s.language,
            description: s.description,
            order: s.order,
            updatedAt: now,
          },
          $setOnInsert: {
            recordType: "source",
            sourceId: s.sourceId,
            published: true,
            createdAt: now,
          },
        },
        { upsert: true },
      );
    }

    // 2. Seed initial sample commentaries
    for (const c of INITIAL_COMMENTARIES) {
      await collection.updateOne(
        {
          recordType: "commentary",
          sourceId: c.sourceId,
          surahNumber: c.surahNumber,
          ayahNumber: c.ayahNumber,
        },
        {
          $set: {
            sourceName: c.sourceName,
            authorName: c.authorName,
            language: c.language,
            surah: c.surahNumber,
            ayah: c.ayahNumber,
            surahNumber: c.surahNumber,
            ayahNumber: c.ayahNumber,
            surahName: c.surahName,
            title: c.title,
            text: c.text,
            published: c.published,
            updatedAt: now,
          },
          $setOnInsert: {
            recordType: "commentary",
            sourceId: c.sourceId,
            createdAt: now,
          },
        },
        { upsert: true },
      );
    }
  } catch (err) {
    console.error("Tafsir seed error:", err.message);
  }
}

let quranComSourcesCache = null;
let quranComSourcesCacheTime = 0;

async function fetchQuranComSources() {
  const now = Date.now();
  if (quranComSourcesCache && now - quranComSourcesCacheTime < 3600000) {
    return quranComSourcesCache;
  }
  try {
    const res = await fetch("https://api.quran.com/api/v4/resources/tafsirs");
    if (!res.ok) return quranComSourcesCache || [];
    const json = await res.json();
    if (Array.isArray(json.tafsirs)) {
      quranComSourcesCache = json.tafsirs.map((t) => ({
        sourceId: String(t.id),
        id: t.id,
        name: t.name,
        author_name: t.author_name,
        language_name: t.language_name,
        language:
          t.language_name === "bengali"
            ? "bn"
            : t.language_name === "arabic"
              ? "ar"
              : "en",
        description: `Quran.com verified resource (#${t.id})`,
        external: true,
      }));
      quranComSourcesCacheTime = now;
      return quranComSourcesCache;
    }
  } catch {
    // Return stale cache or empty array
  }
  return quranComSourcesCache || [];
}

function createTafsirRouter(getCollection, adminKey, jwtSecret) {
  const router = express.Router();

  const admin = (req, res, next) => {
    if (adminKey && req.get("x-admin-key") === adminKey) return next();
    try {
      const token = clean(req.get("authorization"), 500).replace(
        /^Bearer\s+/i,
        "",
      );
      const p = jwt.verify(token, jwtSecret);
      if (p.role !== "admin" && p.role !== "super_admin" && !p.adminRole)
        throw Error();
      next();
    } catch {
      return res
        .status(401)
        .json({ message: "Admin session is invalid or expired." });
    }
  };

  // Seed on initial access
  let seeded = false;
  const ensureSeeded = async () => {
    if (!seeded) {
      await seedTafsirData(getCollection());
      seeded = true;
    }
  };

  // 1. PUBLIC: Get all Tafsir sources (Managed MongoDB + Quran.com merged)
  router.get("/api/tafsir/sources", async (req, res) => {
    try {
      await ensureSeeded();
      const requestedLang = lang(req.query.language || "en");
      const managed = await getCollection()
        .find({ recordType: "source", published: { $ne: false } })
        .sort({ order: 1, name: 1 })
        .toArray();

      const external = await fetchQuranComSources();

      const managedList = managed.map((m) => ({
        id: m.sourceId || String(m._id),
        sourceId: m.sourceId,
        name: m.name,
        author_name: m.author_name,
        language_name: m.language_name,
        language: m.language || "en",
        description: m.description || "",
        order: m.order || 99,
        managed: true,
      }));

      const seenIds = new Set(managedList.map((item) => String(item.id)));
      const filteredExternal = external.filter(
        (item) =>
          !seenIds.has(String(item.id)) && !seenIds.has(String(item.sourceId)),
      );

      const combined = [...managedList, ...filteredExternal];

      // Prioritize requested language
      combined.sort((a, b) => {
        const aMatch =
          a.language === requestedLang ||
          a.language_name?.toLowerCase() === requestedLang;
        const bMatch =
          b.language === requestedLang ||
          b.language_name?.toLowerCase() === requestedLang;
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return (a.order || 99) - (b.order || 99);
      });

      res.set(
        "Cache-Control",
        "public, max-age=60, stale-while-revalidate=300",
      );
      res.json({ success: true, data: combined });
    } catch (e) {
      console.error("Tafsir sources error:", e);
      res.status(500).json({ message: "Unable to load Tafsir sources." });
    }
  });

  // 2. PUBLIC: Get Tafsir for an Ayah
  router.get(
    "/api/tafsir/by_ayah/:surahNumber/:ayahNumber",
    async (req, res) => {
      try {
        await ensureSeeded();
        const surahNumber = Number(req.params.surahNumber);
        const ayahNumber = Number(req.params.ayahNumber);
        const sourceId = clean(req.query.sourceId || "", 100);
        const language = lang(req.query.language || "en");

        if (
          !Number.isInteger(surahNumber) ||
          surahNumber < 1 ||
          surahNumber > 114
        ) {
          return res.status(400).json({ message: "Invalid Surah number." });
        }
        if (!Number.isInteger(ayahNumber) || ayahNumber < 1) {
          return res.status(400).json({ message: "Invalid Ayah number." });
        }

        // Check MongoDB first with sourceId and its aliases
        const resolvedNumeric = SOURCE_ALIASES[sourceId] || sourceId;
        const reverseAlias = Object.keys(SOURCE_ALIASES).find(
          (k) => SOURCE_ALIASES[k] === sourceId,
        );
        const possibleIds = [sourceId, resolvedNumeric, reverseAlias].filter(
          Boolean,
        );

        const query = {
          recordType: "commentary",
          surahNumber,
          ayahNumber,
          published: { $ne: false },
        };
        if (sourceId) {
          query.sourceId = { $in: possibleIds };
        }

        let commentary = await getCollection().findOne(query);

        // If not found with specific sourceId, but language was requested, check any managed commentary for that language
        if (!commentary && language) {
          commentary = await getCollection().findOne({
            recordType: "commentary",
            surahNumber,
            ayahNumber,
            language,
            published: { $ne: false },
          });
        }

        if (commentary) {
          return res.json({
            success: true,
            data: {
              id: String(commentary._id),
              surahNumber,
              ayahNumber,
              surahName: commentary.surahName,
              title: commentary.title || "",
              pronunciation: commentary.pronunciation || "",
              text: commentary.text,
              sourceName: commentary.sourceName,
              authorName: commentary.authorName,
              language: commentary.language,
              sourceId: commentary.sourceId,
              managed: true,
            },
          });
        }

        // If not in MongoDB and target source is numeric (e.g. 165, 169, 166, etc.), proxy to Quran.com
        const proxyId = /^\d+$/.test(sourceId)
          ? sourceId
          : SOURCE_ALIASES[sourceId];
        if (proxyId && /^\d+$/.test(proxyId)) {
          try {
            const quranComUrl = `https://api.quran.com/api/v4/tafsirs/${proxyId}/by_ayah/${surahNumber}:${ayahNumber}`;
            const qcRes = await fetch(quranComUrl);
            if (qcRes.ok) {
              const qcJson = await qcRes.json();
              const record = qcJson.tafsir?.text
                ? qcJson.tafsir
                : Object.values(qcJson.tafsir?.verses || {})[0];
              if (record?.text) {
                return res.json({
                  success: true,
                  data: {
                    surahNumber,
                    ayahNumber,
                    text: cleanTafsir(record.text),
                    sourceName: qcJson.tafsir?.resource_name || "Quran.com",
                    authorName:
                      qcJson.tafsir?.author_name || "Verified scholar",
                    sourceId,
                    managed: false,
                  },
                });
              }
            }
          } catch (qcErr) {
            console.warn("Quran.com proxy error:", qcErr.message);
          }
        }

        return res.json({
          success: true,
          data: {
            surahNumber,
            ayahNumber,
            text: "Tafsir commentary for this Ayah is being updated. You can select another Tafsir source or check back shortly.",
            sourceName: "Tafsir library",
            sourceId,
            managed: false,
          },
        });
      } catch (e) {
        console.error("Tafsir by ayah error:", e);
        res.status(500).json({ message: "Unable to load Tafsir commentary." });
      }
    },
  );

  // 3. ADMIN: List all commentaries with search, filters & pagination
  router.get("/api/admin/tafsir", admin, async (req, res) => {
    try {
      await ensureSeeded();
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
      const search = clean(req.query.search || "", 200);
      const surahNumber = Number(req.query.surahNumber);
      const ayahNumber = Number(req.query.ayahNumber);
      const sourceId = clean(req.query.sourceId || "", 100);
      const language = clean(req.query.language || "", 20);

      const filter = { recordType: "commentary" };
      if (Number.isInteger(surahNumber) && surahNumber > 0)
        filter.surahNumber = surahNumber;
      if (Number.isInteger(ayahNumber) && ayahNumber > 0)
        filter.ayahNumber = ayahNumber;
      if (sourceId) filter.sourceId = sourceId;
      if (language && language !== "all") filter.language = language;
      if (search) {
        filter.$or = [
          { text: { $regex: search, $options: "i" } },
          { title: { $regex: search, $options: "i" } },
          { sourceName: { $regex: search, $options: "i" } },
          { authorName: { $regex: search, $options: "i" } },
        ];
      }

      const total = await getCollection().countDocuments(filter);
      const rows = await getCollection()
        .find(filter)
        .sort({ surahNumber: 1, ayahNumber: 1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

      res.json({
        success: true,
        data: rows.map((r) => ({ ...r, id: String(r._id), _id: undefined })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (e) {
      console.error("Admin tafsir list error:", e);
      res.status(500).json({ message: "Unable to load Tafsir records." });
    }
  });

  // 4. ADMIN: Create single Tafsir commentary
  router.post("/api/admin/tafsir", admin, async (req, res) => {
    try {
      await ensureSeeded();
      const b = req.body || {};
      const surahNumber = Number(b.surahNumber);
      const ayahNumber = Number(b.ayahNumber);
      const text = clean(b.text, 50000);

      if (
        !Number.isInteger(surahNumber) ||
        surahNumber < 1 ||
        surahNumber > 114
      ) {
        return res
          .status(400)
          .json({ message: "Surah number must be between 1 and 114." });
      }
      if (!Number.isInteger(ayahNumber) || ayahNumber < 1) {
        return res
          .status(400)
          .json({ message: "Ayah number must be at least 1." });
      }
      if (!text) {
        return res
          .status(400)
          .json({ message: "Tafsir commentary text is required." });
      }

      const doc = {
        recordType: "commentary",
        sourceId: clean(b.sourceId, 100) || "165",
        sourceName: clean(b.sourceName, 200) || "Tafsir Ahsanul Bayaan",
        authorName: clean(b.authorName, 200) || "",
        language: lang(b.language || "bn"),
        surah: surahNumber,
        ayah: ayahNumber,
        surahNumber,
        ayahNumber,
        surahName: clean(b.surahName, 100) || `Surah ${surahNumber}`,
        title: clean(b.title, 300),
        pronunciation: clean(b.pronunciation, 2000),
        text,
        source: clean(b.source, 500),
        published: b.published !== false,
        updatedAt: new Date(),
      };

      const existing = await getCollection().findOne({
        recordType: "commentary",
        sourceId: doc.sourceId,
        surahNumber: doc.surahNumber,
        ayahNumber: doc.ayahNumber,
      });

      if (existing) {
        await getCollection().updateOne({ _id: existing._id }, { $set: doc });
        return res.json({
          message: `Tafsir commentary for Surah ${surahNumber}:${ayahNumber} updated.`,
          data: { ...doc, id: String(existing._id) },
        });
      }

      doc.createdAt = new Date();
      const result = await getCollection().insertOne(doc);
      res.status(201).json({
        message: `Tafsir commentary for Surah ${surahNumber}:${ayahNumber} saved.`,
        data: { ...doc, id: String(result.insertedId) },
      });
    } catch (e) {
      console.error("Admin create tafsir error:", e);
      res.status(500).json({ message: "Unable to save Tafsir commentary." });
    }
  });

  // 5. ADMIN: Bulk upload Tafsir commentaries
  router.post("/api/admin/tafsir/bulk", admin, async (req, res) => {
    try {
      await ensureSeeded();
      const items = Array.isArray(req.body?.items)
        ? req.body.items
        : Array.isArray(req.body)
          ? req.body
          : [];
      if (!items.length) {
        return res
          .status(400)
          .json({ message: "Provide an array of Tafsir items to import." });
      }

      let count = 0;
      const now = new Date();

      for (const b of items) {
        const surahNumber = Number(b.surahNumber);
        const ayahNumber = Number(b.ayahNumber);
        const text = clean(b.text, 50000);
        if (
          !Number.isInteger(surahNumber) ||
          !Number.isInteger(ayahNumber) ||
          !text
        )
          continue;

        const sourceId = clean(b.sourceId, 100) || "bn-ahsanul-bayan";
        const doc = {
          recordType: "commentary",
          sourceId,
          sourceName: clean(b.sourceName, 200) || "Tafsir Ahsanul Bayaan",
          authorName: clean(b.authorName, 200) || "",
          language: lang(b.language || "bn"),
          surah: surahNumber,
          ayah: ayahNumber,
          surahNumber,
          ayahNumber,
          surahName: clean(b.surahName, 100) || `Surah ${surahNumber}`,
          title: clean(b.title, 300),
          pronunciation: clean(b.pronunciation, 2000),
          text,
          source: clean(b.source, 500),
          published: b.published !== false,
          updatedAt: now,
        };

        await getCollection().updateOne(
          { recordType: "commentary", sourceId, surahNumber, ayahNumber },
          { $set: doc, $setOnInsert: { createdAt: now } },
          { upsert: true },
        );
        count++;
      }

      res.status(201).json({
        message: `${count} Tafsir commentaries uploaded and saved successfully.`,
        count,
      });
    } catch (e) {
      console.error("Admin bulk tafsir upload error:", e);
      res
        .status(500)
        .json({ message: "Unable to bulk upload Tafsir records." });
    }
  });

  // 6. ADMIN: Update commentary by ID
  router.put("/api/admin/tafsir/:id", admin, async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: "Invalid Tafsir ID." });
      const id = new ObjectId(req.params.id);
      const b = req.body || {};
      const updateData = {
        title: clean(b.title, 300),
        pronunciation: clean(b.pronunciation, 2000),
        text: clean(b.text, 50000),
        sourceName: clean(b.sourceName, 200),
        authorName: clean(b.authorName, 200),
        language: lang(b.language || "bn"),
        source: clean(b.source, 500),
        published: b.published !== false,
        updatedAt: new Date(),
      };
      if (
        Number.isInteger(Number(b.surahNumber)) &&
        Number(b.surahNumber) >= 1
      ) {
        updateData.surahNumber = Number(b.surahNumber);
      }
      if (Number.isInteger(Number(b.ayahNumber)) && Number(b.ayahNumber) >= 1) {
        updateData.ayahNumber = Number(b.ayahNumber);
      }
      if (b.surahName) updateData.surahName = clean(b.surahName, 100);
      if (b.sourceId) updateData.sourceId = clean(b.sourceId, 100);

      const result = await getCollection().updateOne(
        { _id: id },
        { $set: updateData },
      );
      if (!result.matchedCount)
        return res.status(404).json({ message: "Tafsir record not found." });

      res.json({ message: "Tafsir commentary updated successfully." });
    } catch (e) {
      console.error("Admin update tafsir error:", e);
      res.status(500).json({ message: "Unable to update Tafsir commentary." });
    }
  });

  // 7. ADMIN: Delete commentary by ID
  router.delete("/api/admin/tafsir/:id", admin, async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: "Invalid Tafsir ID." });
      const id = new ObjectId(req.params.id);
      const result = await getCollection().deleteOne({ _id: id });
      if (!result.deletedCount)
        return res.status(404).json({ message: "Tafsir record not found." });

      res.json({ message: "Tafsir commentary deleted." });
    } catch (e) {
      console.error("Admin delete tafsir error:", e);
      res.status(500).json({ message: "Unable to delete Tafsir commentary." });
    }
  });

  // 8. ADMIN: Manage Tafsir Sources
  router.get("/api/admin/tafsir/sources", admin, async (req, res) => {
    try {
      await ensureSeeded();
      const rows = await getCollection()
        .find({ recordType: "source" })
        .sort({ order: 1, name: 1 })
        .toArray();
      res.json({
        data: rows.map((r) => ({ ...r, id: String(r._id), _id: undefined })),
      });
    } catch (e) {
      res.status(500).json({ message: "Unable to load Tafsir sources." });
    }
  });

  router.post("/api/admin/tafsir/sources", admin, async (req, res) => {
    try {
      const b = req.body || {};
      const sourceId = clean(b.sourceId, 100)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-");
      const name = clean(b.name, 200);
      if (!sourceId || !name)
        return res
          .status(400)
          .json({ message: "Source ID and Book Name are required." });

      const exists = await getCollection().findOne({
        recordType: "source",
        sourceId,
      });
      if (exists)
        return res
          .status(409)
          .json({ message: "This Source ID already exists." });

      const doc = {
        recordType: "source",
        sourceId,
        name,
        author_name: clean(b.author_name, 200),
        language_name: clean(b.language_name, 100) || "bengali",
        language: lang(b.language || "bn"),
        description: clean(b.description, 1000),
        coverImageUrl: clean(b.coverImageUrl, 2000),
        coverImageKey: clean(b.coverImageKey, 1000),
        order: Math.max(1, Number(b.order) || 1),
        published: b.published !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await getCollection().insertOne(doc);
      res.status(201).json({
        message: "Tafsir source created.",
        data: { ...doc, id: String(result.insertedId) },
      });
    } catch (e) {
      res.status(500).json({ message: "Unable to create Tafsir source." });
    }
  });

  router.put("/api/admin/tafsir/sources/:id", admin, async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: "Invalid Source ID." });
      const id = new ObjectId(req.params.id);
      const b = req.body || {};
      const current = await getCollection().findOne({ _id: id, recordType: "source" });
      if (!current) return res.status(404).json({ message: "Tafsir source not found." });
      const updateData = {
        name: clean(b.name, 200),
        author_name: clean(b.author_name, 200),
        language_name: clean(b.language_name, 100),
        language: lang(b.language || "bn"),
        description: clean(b.description, 1000),
        coverImageUrl: clean(b.coverImageUrl, 2000),
        coverImageKey: clean(b.coverImageKey, 1000),
        order: Math.max(1, Number(b.order) || 1),
        published: b.published !== false,
        updatedAt: new Date(),
      };
      if (b.sourceId) updateData.sourceId = clean(b.sourceId, 100);

      await getCollection().updateOne(
        { _id: id, recordType: "source" },
        { $set: updateData },
      );
      await deleteReplacedImages(current, updateData);
      res.json({ message: "Tafsir source updated." });
    } catch (e) {
      res.status(500).json({ message: "Unable to update Tafsir source." });
    }
  });

  router.delete("/api/admin/tafsir/sources/:id", admin, async (req, res) => {
    try {
      if (!ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: "Invalid Source ID." });
      const id = new ObjectId(req.params.id);
      const current = await getCollection().findOne({
        _id: id,
        recordType: "source",
      });
      if (!current)
        return res.status(404).json({ message: "Tafsir source not found." });

      // Count attached commentaries
      const count = await getCollection().countDocuments({
        recordType: "commentary",
        sourceId: current.sourceId,
      });
      if (count > 0 && req.query.force !== "true") {
        return res.status(409).json({
          message: `This source has ${count} commentaries attached. Delete or reassign them first.`,
        });
      }

      await deleteStoredImages(current);
      await getCollection().deleteOne({ _id: id });
      res.json({ message: "Tafsir source deleted." });
    } catch (e) {
      res.status(500).json({ message: "Unable to delete Tafsir source." });
    }
  });

  return router;
}

module.exports = { createTafsirRouter, seedTafsirData };
