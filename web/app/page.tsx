"use client";
import { useEffect, useMemo, useState } from "react";
import { FeatureWorkspace } from "./components/FeatureWorkspace";
import { DeenIcon } from "./components/DeenIcon";
import { HOME_LANGUAGES } from "./data/homeLanguages";
const QURAN_TRANSLATION_LANGUAGES = new Set([
  "ab",
  "ace",
  "ach",
  "af",
  "alz",
  "am",
  "ar",
  "as",
  "awa",
  "ay",
  "az",
  "ba",
  "ban",
  "bbc",
  "be",
  "bem",
  "ber",
  "bew",
  "bg",
  "bm",
  "bn",
  "bs",
  "bts",
  "btx",
  "ce",
  "cs",
  "de",
  "dv",
  "en",
  "es",
  "eu",
  "fa",
  "fr",
  "gu",
  "ha",
  "he",
  "hi",
  "hu",
  "hy",
  "id",
  "it",
  "ja",
  "jv",
  "ka",
  "kk",
  "km",
  "ko",
  "ku",
  "ml",
  "mr",
  "ms",
  "my",
  "ne",
  "nl",
  "no",
  "om",
  "pa",
  "pl",
  "ps",
  "pt",
  "ro",
  "ru",
  "sd",
  "si",
  "so",
  "sq",
  "sv",
  "sw",
  "ta",
  "te",
  "tg",
  "th",
  "tl",
  "tr",
  "tt",
  "ug",
  "uk",
  "ur",
  "uz",
  "vi",
  "zh",
]);
import {
  loadWebTranslationPack,
  type WebTranslationTable,
} from "./services/webTranslation";
const WEB_API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:6002"
).replace(/\/$/, "");
const nav = [
  ["⌂", "Home"],
  ["▣", "Quran"],
  ["▤", "Hadith"],
  ["▥", "Islamic Books"],
  ["☾", "Masala"],
  ["◷", "Prayer Times"],
  ["◇", "Qibla Direction"],
  ["🕌", "Nearby Mosques"],
  ["✦", "Islamic AI"],
  ["✓", "Daily Tasks"],
  ["☽", "Ramadan"],
  ["▦", "Islamic Calendar"],
  ["♡", "Knowledge"],
  ["♧", "Community"],
  ["⇩", "Downloads"],
  ["🔖", "Bookmarks"],
  ["⚙", "Settings"],
] as const;
const features = [
  ["📖", "Quran", "Read & Listen"],
  ["▤", "Hadith", "Authentic Sayings"],
  ["▣", "Islamic Books", "Knowledge & Growth"],
  ["🤲", "Masala", "Daily Islamic Rulings"],
  ["▦", "Prayer Times", "Stay on Track"],
  ["◆", "Qibla Direction", "Find Qibla"],
  ["✿", "Islamic AI", "Ask & Learn"],
  ["☑", "Daily Tasks", "Build Good Habits"],
  ["📜", "Tafsir", "Quran Explanation"],
  ["◉", "Zakat", "Calculate & Learn"],
  ["☘", "Islamic Lifestyle", "Live With Deen"],
  ["★", "Prophets", "Stories & Lessons"],
  ["♧", "Sahaba", "Noble Companions"],
  ["▧", "Islamic History", "Explore Our Heritage"],
  ["◌", "Tasbih", "Digital Dhikr"],
  ["🤍", "Duas & Amol", "Daily Worship"],
] as const;
const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
type PrayerName = (typeof prayerNames)[number];
const fallbackPrayerTimes: Record<PrayerName, string> = {
  Fajr: "05:12",
  Dhuhr: "12:07",
  Asr: "15:45",
  Maghrib: "18:28",
  Isha: "19:52",
};
const cleanPrayerTime = (value: unknown) =>
  String(value || "").match(/^\d{1,2}:\d{2}/)?.[0] || "";
const prayerDate = (value: string, base: Date, addDay = 0) => {
  const [hour, minute] = value.split(":").map(Number),
    date = new Date(base);
  date.setDate(date.getDate() + addDay);
  date.setHours(hour || 0, minute || 0, 0, 0);
  return date;
};
const displayPrayerTime = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute || 0).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
};
const formatCountdown = (milliseconds: number) => {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000)),
    h = Math.floor(seconds / 3600),
    m = Math.floor((seconds % 3600) / 60),
    s = seconds % 60;
  return [h, m, s].map((value) => String(value).padStart(2, "0")).join(":");
};
const books = [
  [
    "Surah Al-Baqarah",
    "Page 42 · 15%",
    15,
    "/images/library/sahih-bukhari.png",
  ],
  [
    "Riyad us-Saliheen",
    "Chapter 12 · 40%",
    40,
    "/images/library/sahih-muslim.png",
  ],
  ["40 Hadith Nawawi", "Hadith 8 · 65%", 65, "/images/library/nawawi.png"],
  ["Al-Adab Al-Mufrad", "Chapter 3 · 22%", 22, "/images/library/muwatta.png"],
] as const;
const tasks = [
  ["🕌", "Five Daily Prayers", "Complete all prayers", "3/5", 60],
  ["📘", "Today’s Dua", "Read today’s dua", "0/1", 12],
  ["◌", "Today’s Zikr", "Complete zikr", "0/1", 8],
  ["▣", "Quran Reading", "Read from Juz 1 – 2", "0/2", 20],
  ["▢", "Today’s Question", "Answer the question", "0/1", 0],
] as const;
const extraRoutes = ["Profile", "Notifications", "Billing History"];
const routeFeatures = Array.from(
  new Set([
    "Home",
    ...nav.map((item) => item[1]),
    ...features.map((item) => item[1]),
    ...extraRoutes,
  ]),
);
const featureSlug = (feature: string) =>
  feature === "Home"
    ? ""
    : feature
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
const featureFromPath = (pathname: string) => {
  const slug = pathname.split("/").filter(Boolean)[0] || "";
  return (
    routeFeatures.find((feature) => featureSlug(feature) === slug) || "Home"
  );
};
type AppLanguage = string;
const bnCopy: Record<string, string> = {
  Home: "হোম",
  Quran: "কুরআন",
  Hadith: "হাদিস",
  "Islamic Books": "ইসলামিক বই",
  "Dua & Azkar": "দোয়া ও আজকার",
  "Prayer Times": "নামাজের সময়",
  "Qibla Direction": "কিবলার দিক",
  "Islamic AI": "ইসলামিক এআই",
  "Daily Tasks": "দৈনিক কাজ",
  Ramadan: "রমজান",
  "Islamic Calendar": "ইসলামিক ক্যালেন্ডার",
  Knowledge: "জ্ঞান",
  Community: "কমিউনিটি",
  Downloads: "ডাউনলোড",
  Bookmarks: "বুকমার্ক",
  Settings: "সেটিংস",
  "Nearby Mosques": "কাছের মসজিদ",
  "Read & Listen": "পড়ুন ও শুনুন",
  "Authentic Sayings": "বিশুদ্ধ বাণী",
  "Knowledge & Growth": "জ্ঞান ও উন্নতি",
  "Daily Supplications": "দৈনিক দোয়া",
  "Stay on Track": "সময়মতো আদায়",
  "Find Qibla": "কিবলা খুঁজুন",
  "Find mosques near you": "কাছাকাছি মসজিদ খুঁজুন",
  "Ask & Learn": "জিজ্ঞাসা ও শিখুন",
  "Build Good Habits": "ভালো অভ্যাস গড়ুন",
  "Continue Reading": "পড়া চালিয়ে যান",
  Continue: "চালিয়ে যান",
  "Five Daily Prayers": "পাঁচ ওয়াক্ত নামাজ",
  "Complete all prayers": "সব নামাজ সম্পন্ন করুন",
  "Today’s Dua": "আজকের দোয়া",
  "Read today’s dua": "আজকের দোয়া পড়ুন",
  "Today’s Zikr": "আজকের জিকির",
  "Complete zikr": "জিকির সম্পন্ন করুন",
  "Quran Reading": "কুরআন পাঠ",
  "Read from Juz 1 – 2": "জুজ ১–২ থেকে পড়ুন",
  "Today’s Question": "আজকের প্রশ্ন",
  "Answer the question": "প্রশ্নের উত্তর দিন",
  "Sehri & Iftar times, duas and special content":
    "সেহরি-ইফতারের সময়, দোয়া ও বিশেষ কনটেন্ট",
  "Important Islamic dates and events": "গুরুত্বপূর্ণ ইসলামিক তারিখ ও অনুষ্ঠান",
  "Learn Islamic knowledge and resources": "ইসলামিক জ্ঞান ও রিসোর্স শিখুন",
  "Daily Ayah": "আজকের আয়াত",
  "Hadith of the Day": "আজকের হাদিস",
  "Quick Links": "দ্রুত লিংক",
  Videos: "ভিডিও",
  Lectures: "লেকচার",
  Articles: "প্রবন্ধ",
};
export default function Home() {
  const [active, setActive] = useState("Home"),
    [activePrayer, setActivePrayer] = useState<PrayerName>("Dhuhr"),
    [prayerTimes, setPrayerTimes] =
      useState<Record<PrayerName, string>>(fallbackPrayerTimes),
    [now, setNow] = useState(() => new Date(0)),
    [query, setQuery] = useState(""),
    [dark, setDark] = useState(false),
    [notice, setNotice] = useState(""),
    [profileOpen, setProfileOpen] = useState(false),
    [notificationsOpen, setNotificationsOpen] = useState(false),
    [unread, setUnread] = useState(3),
    [account, setAccount] = useState<{ name: string; email: string } | null>(
      null,
    ),
    [language, setLanguage] = useState<AppLanguage>("en"),
    [translations, setTranslations] = useState<WebTranslationTable>({}),
    [languageOpen, setLanguageOpen] = useState(false),
    [languageQuery, setLanguageQuery] = useState("");
  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    let cancelled = false;
    const recordVisit = async () => {
      try {
      const key = "deenislam_web_visitor_id";
      let visitorId = localStorage.getItem(key);
      if (!visitorId) {
        const randomPart =
          typeof crypto?.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        visitorId = `web:${randomPart}`;
        localStorage.setItem(key, visitorId);
      }
      const countryKey = "deenislam_web_country_code";
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const locale = navigator.language || "";
      let countryCode = sessionStorage.getItem(countryKey) || "";
      if (!/^[A-Z]{2}$/.test(countryCode)) {
        try {
          const response = await fetch("https://api.country.is/", {
            signal: AbortSignal.timeout(3500),
          });
          const payload = await response.json();
          countryCode = String(payload?.country || "").toUpperCase();
          if (/^[A-Z]{2}$/.test(countryCode))
            sessionStorage.setItem(countryKey, countryCode);
        } catch {
          countryCode = timeZone === "Asia/Dhaka" ? "BD" : "";
        }
      }
      if (cancelled) return;
      await fetch(`${WEB_API}/api/analytics/visit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: visitorId,
          page: window.location.pathname,
          referrer: document.referrer,
          countryCode,
          timeZone,
          locale,
        }),
        keepalive: true,
      }).catch(() => undefined);
      } catch {}
    };
    void recordVisit();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    let live = true;
    const apply = (data: any) => {
      const timings = data?.data?.timings;
      if (!live || !timings) return;
      const next = { ...fallbackPrayerTimes };
      prayerNames.forEach((name) => {
        next[name] = cleanPrayerTime(timings[name]) || next[name];
      });
      setPrayerTimes(next);
    };
    const load = (latitude?: number, longitude?: number) => {
      const date = new Date(),
        stamp = `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
      const url =
        latitude != null && longitude != null
          ? `https://api.aladhan.com/v1/timings/${stamp}?latitude=${latitude}&longitude=${longitude}&method=1`
          : `https://api.aladhan.com/v1/timingsByCity/${stamp}?city=Dhaka&country=Bangladesh&method=1`;
      fetch(url)
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then(apply)
        .catch(() => undefined);
    };
    load();
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        (position) => load(position.coords.latitude, position.coords.longitude),
        () => undefined,
        { maximumAge: 3600000, timeout: 6000 },
      );
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("deenislam_web_user");
      if (saved) setAccount(JSON.parse(saved));
      setDark(localStorage.getItem("deenislam_theme") === "dark");
      const savedLanguage = localStorage.getItem(
        "deenislam_language",
      ) as AppLanguage | null;
      if (
        savedLanguage &&
        HOME_LANGUAGES.some((item) => item.code === savedLanguage)
      )
        setLanguage(savedLanguage);
    } catch {}
  }, [active]);
  useEffect(() => {
    let live = true,
      current: number | null = null,
      reloading = false;
    const receive = (revision: number) => {
      if (!live || !Number.isFinite(revision)) return;
      if (current !== null && revision > current && !reloading) {
        reloading = true;
        window.location.reload();
        return;
      }
      current = Math.max(current ?? 0, revision);
    };
    const check = () =>
      fetch(`${WEB_API}/api/content/version?refresh=${Date.now()}`, {
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((body) => receive(Number(body.data?.revision) || 0))
        .catch(() => undefined);
    void check();
    const timer = window.setInterval(check, 15000);
    const events =
      typeof EventSource !== "undefined"
        ? new EventSource(`${WEB_API}/api/content/events`)
        : null;
    events?.addEventListener("content-version", (event) => {
      try {
        receive(Number(JSON.parse((event as MessageEvent).data).revision) || 0);
      } catch {}
    });
    return () => {
      live = false;
      window.clearInterval(timer);
      events?.close();
    };
  }, []);
  const t = (text: string) => translations[text] || text;
  const changeLanguage = (value: AppLanguage) => {
    setLanguage(value);
    setLanguageOpen(false);
    setLanguageQuery("");
    localStorage.setItem("deenislam_language", value);
    document.documentElement.lang = value;
    document.documentElement.dir = [
      "ar",
      "fa",
      "ur",
      "ps",
      "sd",
      "he",
      "yi",
      "ku",
    ].includes(value)
      ? "rtl"
      : "ltr";
  };
  const visibleLanguages = HOME_LANGUAGES.filter((item) =>
    (item.label + " " + item.code)
      .toLowerCase()
      .includes(languageQuery.trim().toLowerCase()),
  );
  useEffect(() => {
    let active = true;
    setTranslations({});
    document.documentElement.lang = language;
    document.documentElement.dir = [
      "ar",
      "fa",
      "ur",
      "ps",
      "sd",
      "he",
      "yi",
      "ku",
    ].includes(language)
      ? "rtl"
      : "ltr";
    loadWebTranslationPack(WEB_API, language).then((pack) => {
      if (active) setTranslations(pack);
    });
    return () => {
      active = false;
    };
  }, [language]);
  const selectedLanguage =
    HOME_LANGUAGES.find((item) => item.code === language) ??
    HOME_LANGUAGES.find((item) => item.code === "en")!;
  const currentGregorianDate = now.getTime()
    ? new Intl.DateTimeFormat(language || "en", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(now)
    : "Loading date...";
  const currentHijriDate = now.getTime()
    ? `${new Intl.DateTimeFormat(`${language || "en"}-u-ca-islamic`, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(now)} AH`
    : "";
  useEffect(() => {
    const sync = () => {
      const feature = featureFromPath(window.location.pathname);
      setActive(feature);
      document.title =
        feature === "Home"
          ? "Deen Islam — Muslim Guide & Path"
          : `${feature} | Deen Islam`;
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const toggleTheme = () =>
    setDark((value) => {
      const next = !value;
      localStorage.setItem("deenislam_theme", next ? "dark" : "light");
      return next;
    });
  const navigate = (feature: string, replace = false) => {
    setActive(feature);
    const path = feature === "Home" ? "/" : `/${featureSlug(feature)}`;
    if (window.location.pathname !== path)
      window.history[replace ? "replaceState" : "pushState"](
        { feature },
        "",
        path,
      );
    document.title =
      feature === "Home"
        ? "Deen Islam — Muslim Guide & Path"
        : `${feature} | Deen Islam`;
  };
  const goBack = () => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts.length <= 1) {
      navigate("Home");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    let target = "/" + parts.slice(0, -1).join("/");
    if (parts[0] === "quran" || parts[0] === "tafsir") target = `/${parts[0]}`;
    window.history.pushState({}, "", target);
    window.dispatchEvent(new PopStateEvent("popstate"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const signOut = () => {
    localStorage.removeItem("deen_islam_auth_token_v2");
    localStorage.removeItem("deenislam_web_user");
    setAccount(null);
    setProfileOpen(false);
    navigate("Profile");
  };
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? [
          ...nav.map((x) => x[1]),
          ...features.map((x) => x[1]),
          ...books.map((x) => x[0]),
        ]
          .filter(
            (x, i, a) => x.toLowerCase().includes(q) && a.indexOf(x) === i,
          )
          .slice(0, 6)
      : [];
  }, [query]);
  const act = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2200);
  };
  useEffect(() => {
    const openProfile = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest(".topbar .profile")) return;
      event.preventDefault();
      event.stopPropagation();
      setProfileOpen(false);
      setNotificationsOpen(false);
      navigate("Profile");
    };
    document.addEventListener("click", openProfile, true);
    return () => document.removeEventListener("click", openProfile, true);
  }, []);
  const nextPrayer = useMemo(() => {
    if (now.getTime() === 0)
      return { name: "Dhuhr" as PrayerName, date: new Date(0) };
    for (const name of prayerNames) {
      const date = prayerDate(prayerTimes[name], now);
      if (date.getTime() > now.getTime()) return { name, date };
    }
    const name: PrayerName = "Fajr";
    return { name, date: prayerDate(prayerTimes[name], now, 1) };
  }, [prayerTimes, now]);
  useEffect(() => setActivePrayer(nextPrayer.name), [nextPrayer.name]);
  return (
    <main className={dark ? "app dark" : "app"}>
      <aside className='sidebar'>
        <div className='logo'>
          <img src='/images/sidebar-logo-reference.png' alt='Deen Islam' />
        </div>
        <div className='brand'>
          <strong>DEEN ISLAM</strong>
          <small>MUSLIM GUIDE & PATH</small>
        </div>
        <nav>
          {nav.map(([icon, label]) => (
            <button
              key={label}
              className={active === label ? "active" : ""}
              onClick={() => {
                navigate(label);
                act(`${label} selected`);
              }}
            >
              <i>
                <DeenIcon name={label} />
              </i>
              <span>{t(label)}</span>
              <b>›</b>
            </button>
          ))}
        </nav>
        <blockquote>
          “And remind, for indeed the reminder benefits the believers.”
          <small>— Surah Adh-Dhariyat 51:55</small>
        </blockquote>
      </aside>
      <section className='workspace'>
        {active === "Home" && (
          <header className='topbar'>
            <div className='search'>
              <b>⌕</b>
              <input
                aria-label='Search'
                role='combobox'
                aria-expanded={query.trim().length > 0}
                aria-controls='global-search-results'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  language === "bn"
                    ? "কুরআন, হাদিস, দোয়া ও আরও কিছু খুঁজুন…"
                    : "Search Quran, Hadith, Dua & more…"
                }
              />
              <kbd>Ctrl K</kbd>
              {query.trim().length > 0 && (
                <div
                  className={`results${results.length === 0 ? " empty" : ""}`}
                  id='global-search-results'
                  role='listbox'
                >
                  <div className='results-head'>
                    <span>
                      <strong>Quick results</strong>
                      <small>
                        {results.length > 0
                          ? `${results.length} matches found`
                          : "Try another keyword"}
                      </small>
                    </span>
                    <button
                      type='button'
                      aria-label='Close search results'
                      onClick={() => setQuery("")}
                    >
                      ×
                    </button>
                  </div>
                  {results.length === 0 && (
                    <div className='results-empty'>
                      <DeenIcon name='Search' size={20} />
                      <span>
                        <strong>No result found</strong>
                        <small>Search Quran, Hadith, Dua or another service.</small>
                      </span>
                    </div>
                  )}
                  {results.map((x) => (
                    <button
                      className='result-item'
                      key={x}
                      role='option'
                      aria-selected='false'
                      onClick={() => {
                        setQuery("");
                        navigate(x);
                        act(`Opening ${x}`);
                      }}
                    >
                      <i>
                        <DeenIcon name={x} size={18} strokeWidth={1.9} />
                      </i>
                      <span>
                        <strong>{x}</strong>
                        <small>Open page</small>
                      </span>
                      <b aria-hidden='true'>→</b>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className='top-control notification-control'>
              <button
                className='round badge'
                onClick={() => {
                  setNotificationsOpen((v) => !v);
                  setProfileOpen(false);
                  if (!notificationsOpen) setUnread(0);
                }}
                aria-label='Notifications'
              >
                <DeenIcon name='Notifications' size={18} strokeWidth={1.9} />
                {unread > 0 && <b>{unread}</b>}
              </button>
              {notificationsOpen && (
                <div className='top-popover notification-popover'>
                  <div>
                    <strong>Notifications</strong>
                    <button onClick={() => setNotificationsOpen(false)}>
                      ×
                    </button>
                  </div>
                  <article>
                    <i>✓</i>
                    <span>
                      <b>Welcome to Deen Islam</b>
                      <small>
                        Your web account and saved progress are ready.
                      </small>
                    </span>
                  </article>
                  <article>
                    <i>◷</i>
                    <span>
                      <b>Prayer reminder</b>
                      <small>
                        Enable browser permission from Prayer Times.
                      </small>
                    </span>
                  </article>
                  <button
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate("Notifications");
                    }}
                  >
                    View all notifications →
                  </button>
                </div>
              )}
            </div>
            <div className='language-menu'>
              <button
                className='language-control'
                aria-label='Select language'
                aria-expanded={languageOpen}
                onClick={() => {
                  setLanguageOpen((value) => !value);
                  setNotificationsOpen(false);
                  setProfileOpen(false);
                }}
              >
                <span>
                  <DeenIcon name='Language' size={15} strokeWidth={2} />
                </span>
                <b>{selectedLanguage.label}</b>
                <em aria-hidden='true' />
              </button>
              {languageOpen && (
                <>
                  <button
                    className='language-backdrop'
                    aria-label='Close language menu'
                    onClick={() => setLanguageOpen(false)}
                  />
                  <section className='language-panel'>
                    <header>
                      <div>
                        <span>
                          <DeenIcon name='Language' size={18} />
                        </span>
                        <strong>Select Language</strong>
                      </div>
                      <button
                        aria-label='Close'
                        onClick={() => setLanguageOpen(false)}
                      >
                        ×
                      </button>
                    </header>
                    <label className='language-search'>
                      <DeenIcon name='Search' size={15} />
                      <input
                        autoFocus
                        value={languageQuery}
                        onChange={(event) =>
                          setLanguageQuery(event.target.value)
                        }
                        placeholder='Search language...'
                      />
                    </label>
                    <div className='language-list'>
                      {visibleLanguages.map((item) => (
                        <button
                          key={item.code}
                          className={language === item.code ? "active" : ""}
                          onClick={() => changeLanguage(item.code)}
                        >
                          <span>
                            <b>{item.label}</b>
                            <small>{item.short}</small>
                          </span>
                          {QURAN_TRANSLATION_LANGUAGES.has(item.code) && (
                            <i aria-label='Quran translation available'>
                              {"✓"}
                            </i>
                          )}
                        </button>
                      ))}
                    </div>
                    <footer>
                      {QURAN_TRANSLATION_LANGUAGES.size} Quran translations ·{" "}
                      {"✓"} marked
                    </footer>
                  </section>
                </>
              )}
            </div>
            <button
              className='round theme-toggle'
              onClick={toggleTheme}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <DeenIcon
                name={dark ? "Dhuhr" : "Isha"}
                size={19}
                strokeWidth={1.9}
              />
            </button>
            <div className='top-control'>
              <button
                className='profile'
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setNotificationsOpen(false);
                }}
                aria-expanded={profileOpen}
              >
                <i>{account ? account.name.slice(0, 2).toUpperCase() : "GU"}</i>
                <span>
                  <small className='profile-salam'>Assalamu Alaikum</small>
                  <strong>{account?.name || "Guest User"}</strong>
                </span>
                <b>{profileOpen ? "⌃" : "⌄"}</b>
              </button>
              {profileOpen && (
                <div className='top-popover profile-popover'>
                  <header>
                    <i>
                      {account ? account.name.slice(0, 2).toUpperCase() : "GU"}
                    </i>
                    <div>
                      <strong>{account?.name || "Guest User"}</strong>
                      <small>
                        {account?.email || "Sign in to sync your progress"}
                      </small>
                    </div>
                  </header>
                  <nav>
                    <button
                      onClick={() => {
                        navigate("Profile");
                        setProfileOpen(false);
                      }}
                    >
                      <i>♙</i>
                      <span>
                        <b>
                          {account
                            ? "Profile Information"
                            : "Sign In / Create Account"}
                        </b>
                        <small>Account, email and secure access</small>
                      </span>
                      <em>›</em>
                    </button>
                    <button
                      onClick={() => {
                        navigate("Settings");
                        setProfileOpen(false);
                      }}
                    >
                      <i>⚙</i>
                      <span>
                        <b>Settings</b>
                        <small>Language, reciter and preferences</small>
                      </span>
                      <em>›</em>
                    </button>
                    <button
                      onClick={() => {
                        navigate("Billing History");
                        setProfileOpen(false);
                      }}
                    >
                      <i>▤</i>
                      <span>
                        <b>Billing History</b>
                        <small>Purchases and subscription details</small>
                      </span>
                      <em>›</em>
                    </button>
                  </nav>
                  {account ? (
                    <button className='popover-signout' onClick={signOut}>
                      Sign out
                    </button>
                  ) : (
                    <button
                      className='popover-login'
                      onClick={() => {
                        navigate("Profile");
                        setProfileOpen(false);
                      }}
                    >
                      Sign in securely
                    </button>
                  )}
                </div>
              )}
            </div>
          </header>
        )}
        {active === "Home" ? (
          <div className='columns'>
            <div className='maincol'>
              <section className='hero'>
                <div>
                  <h1>
                    {language === "bn" ? (
                      <>
                        প্রতিদিন আপনার
                        <br />
                        দ্বীনকে শক্তিশালী করুন
                      </>
                    ) : (
                      <>
                        Strengthen Your Deen
                        <br />
                        Every Day
                      </>
                    )}
                  </h1>
                  <p>
                    {language === "bn"
                      ? "কুরআন · হাদিস · দোয়া · ইসলামিক বই · জ্ঞান"
                      : "Quran · Hadith · Dua · Islamic Books · Knowledge"}
                    <br />
                    <span>
                      {language === "bn"
                        ? "উন্নত জীবনের জন্য দ্বীনি পথনির্দেশ"
                        : "Guidance for a Better Life"}
                    </span>
                  </p>
                  <button onClick={() => navigate("Quran")}>
                    {language === "bn"
                      ? "কুরআন পড়া শুরু করুন"
                      : "Start Reading Quran"}
                    　→
                  </button>
                </div>
                <blockquote>
                  <b>وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ</b>
                  <span>“My success is only by Allah.”</span>
                  <small>— Surah Hud 11:88</small>
                </blockquote>
              </section>
              <section className='quick-access expanded'>
                <div className='access-heading'>
                  <span>
                    {language === "bn"
                      ? "সব দ্বীনি সেবা"
                      : "All Deen Islam services"}
                  </span>
                </div>
                <div className='features'>
                  {features.map(([, title, sub]) => (
                    <button
                      key={title}
                      onClick={() => {
                        navigate(title);
                        act(`${title} opened`);
                      }}
                    >
                      <i>
                        <DeenIcon name={title} size={25} />
                      </i>
                      <strong>{t(title)}</strong>
                      <small>{t(sub)}</small>
                    </button>
                  ))}
                </div>
              </section>
              <section className='prayer'>
                <div className='next'>
                  <i className='next-prayer-mark'>
                    <DeenIcon name='Prayer Status' size={17} />
                  </i>
                  <i className='next-audio-mark'>
                    <DeenIcon name='Audio' size={17} />
                  </i>
                  <small>Next Prayer</small>
                  <h2>
                    <span>{nextPrayer.name}</span>
                    <DeenIcon name='Audio' size={12} />
                  </h2>
                  <b>{displayPrayerTime(prayerTimes[nextPrayer.name])}</b>
                  <p>
                    Starts in　
                    <strong>
                      {formatCountdown(
                        nextPrayer.date.getTime() - now.getTime(),
                      )}
                    </strong>
                  </p>
                  <button onClick={() => navigate("Prayer Times")}>
                    View All Prayer Times　→
                  </button>
                </div>
                <div className='prayers'>
                  {prayerNames.map((name) => (
                    <button
                      key={name}
                      className={activePrayer === name ? "active" : ""}
                      onClick={() => setActivePrayer(name)}
                      aria-pressed={activePrayer === name}
                    >
                      <i>
                        <DeenIcon name={name} size={24} />
                      </i>
                      <span>{name}</span>
                      <b>{displayPrayerTime(prayerTimes[name])}</b>
                    </button>
                  ))}
                </div>
              </section>
              <section className='panel reading-panel'>
                <Heading
                  title={t("Continue Reading")}
                  onClick={() => act("Library opened")}
                />
                <div className='books'>
                  {books.map(([title, meta, pct, cover], i) => (
                    <article key={title}>
                      <div className={`cover c${i}`}>
                        <img src={cover} alt='' />
                      </div>
                      <div>
                        <strong>{title}</strong>
                        <small>{meta}</small>
                        <em>
                          <i style={{ width: `${pct}%` }} />
                        </em>
                        <button onClick={() => act(`Continuing ${title}`)}>
                          {t("Continue")}
                        </button>
                      </div>
                      <b>•••</b>
                    </article>
                  ))}
                </div>
              </section>
              <section className='panel tasks-panel'>
                <Heading
                  title={t("Daily Tasks")}
                  onClick={() => act("Daily tasks opened")}
                />
                <div className='tasks'>
                  {tasks.map(([icon, title, sub, score, pct]) => (
                    <button key={title} onClick={() => act(`${title} opened`)}>
                      <i>
                        <DeenIcon name={title} size={23} />
                      </i>
                      <span>
                        <strong>{t(title)}</strong>
                        <small>{t(sub)}</small>
                        <b>{score}</b>
                        <em>
                          <u style={{ width: `${pct}%` }} />
                        </em>
                      </span>
                      <b>→</b>
                    </button>
                  ))}
                </div>
              </section>
              <section className='promos'>
                {[
                  [
                    "☾",
                    "Ramadan",
                    "Sehri & Iftar times, duas and special content",
                  ],
                  [
                    "▦",
                    "Islamic Calendar",
                    "Important Islamic dates and events",
                  ],
                  ["▥", "Knowledge", "Learn Islamic knowledge and resources"],
                ].map(([icon, title, sub]) => (
                  <button key={title} onClick={() => act(`${title} opened`)}>
                    <i>
                      <DeenIcon name={title} size={23} />
                    </i>
                    <span>
                      <strong>{t(title)}</strong>
                      <small>{t(sub)}</small>
                      <b>
                        {language === "bn"
                          ? title === "Islamic Calendar"
                            ? "ক্যালেন্ডার দেখুন →"
                            : "ঘুরে দেখুন →"
                          : title === "Islamic Calendar"
                            ? "View Calendar →"
                            : "Explore →"}
                      </b>
                    </span>
                  </button>
                ))}
              </section>
            </div>
            <aside className='rail'>
              <button
                type='button'
                className='date'
                onClick={() => navigate("Islamic Calendar")}
                aria-label={`Open Islamic Calendar. Today is ${currentGregorianDate}, ${currentHijriDate}`}
              >
                <i>▦</i>
                <div>
                  <strong>{currentGregorianDate}</strong>
                  <span>{currentHijriDate}</span>
                </div>
              </button>
              <section className='event'>
                <div>
                  <small>Upcoming Islamic Event</small>
                  <strong>Milad un Nabi</strong>
                  <span>8 October 2026</span>
                </div>
                <b>12 Days Left</b>
                <i>♜</i>
              </section>
              <section className='panel railcard'>
                <Heading
                  title={t("Daily Ayah")}
                  onClick={() => act("All ayahs opened")}
                />
                <p dir='rtl'>فَإِنَّ مَعَ الْعُسْرِ يُسْرًا</p>
                <blockquote>
                  “Indeed, with hardship comes ease.”
                  <small>— Surah Ash-Sharh (94:6)</small>
                </blockquote>
              </section>
              <section className='panel railcard'>
                <Heading
                  title={t("Hadith of the Day")}
                  onClick={() => act("All hadith opened")}
                />
                <p dir='rtl'>
                  مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ
                </p>
                <blockquote>
                  “Whoever guides someone to goodness will have a reward like
                  the one who does it.”
                </blockquote>
                <footer>
                  ▤ Sahih Muslim (1893)
                  <button onClick={() => act("Hadith opened")}>
                    Read More →
                  </button>
                </footer>
              </section>
              <section className='aicard'>
                <div>
                  <small>DEEN ISLAM AI</small>
                  <h2>Have an Islamic question?</h2>
                  <p>
                    Get source-based answers from Quran and authentic
                    references.
                  </p>
                  <button onClick={() => navigate("Islamic AI")}>
                    Ask AI →
                  </button>
                </div>
                <img
                  src='/images/deen-ai-robot.png'
                  alt='Deen Islam AI assistant'
                />
                <i>✦</i>
              </section>
              <section className='panel quick'>
                <Heading
                  title={t("Quick Links")}
                  onClick={() => act("All quick links opened")}
                />
                <div>
                  {[["Videos"], ["Lectures"], ["Articles"], ["Community"]].map(
                    ([t]) => (
                      <button key={t} onClick={() => act(`${t} opened`)}>
                        <i>
                          <DeenIcon name={t} size={19} />
                        </i>
                        <span>{language === "bn" ? bnCopy[t] || t : t}</span>
                      </button>
                    ),
                  )}
                </div>
              </section>
            </aside>
          </div>
        ) : (
          <FeatureWorkspace
            feature={active}
            language={language}
            onBack={goBack}
          />
        )}
      </section>
      <nav className='mobile'>
        {nav.slice(0, 5).map(([, t]) => (
          <button
            key={t}
            className={active === t ? "active" : ""}
            onClick={() => navigate(t)}
          >
            <i>
              <DeenIcon name={t} />
            </i>
            <span>{t}</span>
          </button>
        ))}
      </nav>
      {notice && <div className='toast'>{notice}</div>}
    </main>
  );
}
function Heading({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <div className='heading'>
      <h2>{title}</h2>
      <button onClick={onClick}>See All</button>
    </div>
  );
}
