"use client";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { HadithWorkspace } from "./HadithWorkspace";
import { TafsirWorkspace } from "./TafsirWorkspace";
import { IslamicHistoryWorkspace } from "./IslamicHistoryWorkspace";
import { DeenIcon } from "./DeenIcon";

const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");
const descriptionText = (value = "") =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
type Props = { feature: string; onBack: () => void; language?: string };
type WebNotification = {
  id: string;
  title: string;
  body: string;
  fullBody?: string;
  createdAt: string;
  unread: boolean;
  imageUrl?: string;
  data?: {
    contentId?: string;
    url?: string;
    surahNumber?: number;
    ayahNumber?: number;
  };
};
type Surah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  ayahs?: Ayah[];
};
type Ayah = {
  numberInSurah: number;
  text: string;
  translation: string;
  transliteration: string;
  juz?: number;
  page?: number;
};
type Dua = {
  id: string;
  key: string;
  name: string;
  description: string;
  arabic: string;
  pronunciation: string;
  meaning: string;
  source: string;
  category: string;
  language: string;
  hasTranslation: boolean;
};
type AmolBook = {
  id: string;
  slug: string;
  title: string;
  author?: string;
  category?: string;
  language?: string;
  description?: string;
  content?: string;
  coverImageUrl?: string;
  sourceUrl?: string;
  pages?: Array<{ number: number; title?: string; reference?: string; text?: string; markdown?: string }>;
};
type LibraryBook = {
  id: string;
  slug: string;
  title: string;
  author?: string;
  category?: string;
  language?: string;
  coverImageUrl?: string;
  sourceUrl?: string;
  publicDomain?: boolean;
  description?: string;
  content?: string;
  pages?: Array<{
    number: number;
    title?: string;
    reference?: string;
    text?: string;
    markdown?: string;
    imageUrl?: string;
    imageWidth?: number;
    imageHeight?: number;
    pages?: Array<{ number: number; originalPage?: number; text?: string; markdown?: string; imageUrl?: string; imageWidth?: number; imageHeight?: number }>;
  }>;
  extraction?: { sourceFile?: string; method?: string };
};
type LifestyleItem = {
  id: string;
  slug: string;
  kind: "category" | "chapter";
  section: string;
  parentCategorySlug: string;
  title: string;
  subtitle: string;
  icon?: string;
  order?: number;
  quran?: {
    surah?: string;
    reference?: string;
    arabic?: string;
    meaning?: string;
    lesson?: string;
    url?: string;
  } | null;
  introduction?: string[];
  lessons?: string[];
  actions?: string[];
  mistakes?: string[];
  checklist?: string[];
  practice?: string;
  reflection?: string;
  summary?: string;
  sources?: Array<{ label: string; note?: string; url?: string }>;
  language?: string;
  hasTranslation?: boolean;
};
const knowledge: Record<string, string[]> = {
  "Islamic Books": [
    "Riyad as-Salihin",
    "The Sealed Nectar",
    "40 Hadith Nawawi",
    "Al-Adab Al-Mufrad",
    "Hisnul Muslim",
    "Stories of the Prophets",
  ],
  Books: [
    "Riyad as-Salihin",
    "The Sealed Nectar",
    "40 Hadith Nawawi",
    "Al-Adab Al-Mufrad",
    "Hisnul Muslim",
    "Tafsir Ibn Kathir",
  ],
  Masala: [
    "Morning Adhkar",
    "Evening Adhkar",
    "Before Sleeping",
    "After Salah",
    "Travel Dua",
    "Dua for Forgiveness",
  ],
  "Duas & Amol": [
    "Morning and Evening Amol",
    "Protection Duas",
    "Daily Sunnah Duas",
    "Ramadan Amol",
    "Friday Amol",
    "Selected Quranic Duas",
  ],
  Prophets: [
    "Adam (AS)",
    "Nuh (AS)",
    "Ibrahim (AS)",
    "Musa (AS)",
    "Isa (AS)",
    "Muhammad ﷺ",
  ],
  Sahaba: [
    "Abu Bakr (RA)",
    "Umar ibn Al-Khattab (RA)",
    "Uthman ibn Affan (RA)",
    "Ali ibn Abi Talib (RA)",
    "Bilal ibn Rabah (RA)",
    "Aisha (RA)",
  ],
  "Islamic History": [
    "The Seerah",
    "The Rightly Guided Caliphs",
    "Preservation of the Quran",
    "Golden Age of Scholarship",
    "Islam in Andalusia",
    "Important Islamic Events",
  ],
  "Islamic Lifestyle": [
    "Aqidah",
    "Fiqh of Worship",
    "Family and Character",
    "Halal Living",
    "Islamic Manners",
    "Community Responsibility",
  ],
  "Daily Tasks": [
    "Five daily prayers",
    "Read Quran",
    "Morning Adhkar",
    "Evening Adhkar",
    "Learn one Hadith",
    "Make daily Dua",
  ],
  "Daily Prayer": [
    "Fajr",
    "Dhuhr",
    "Asr",
    "Maghrib",
    "Isha",
    "Daily Salah Progress",
  ],
};
const hadiths = [
  {
    title: "Actions are by intentions",
    text: "Actions are judged by intentions, and every person will have what they intended.",
    source: "Sahih al-Bukhari 1",
  },
  {
    title: "Love for your brother",
    text: "None of you truly believes until he loves for his brother what he loves for himself.",
    source: "Sahih al-Bukhari 13",
  },
  {
    title: "The best among you",
    text: "The best among you are those who learn the Quran and teach it.",
    source: "Sahih al-Bukhari 5027",
  },
  {
    title: "Speak good",
    text: "Whoever believes in Allah and the Last Day should speak good or remain silent.",
    source: "Sahih al-Bukhari 6018",
  },
];
function deviceId() {
  let id = localStorage.getItem("deenislam_web_device");
  if (!id) {
    id = "web:" + crypto.randomUUID();
    localStorage.setItem("deenislam_web_device", id);
  }
  return id;
}
async function json(path: string, init?: RequestInit) {
  const token = localStorage.getItem("deen_islam_auth_token_v2");
  const res = await fetch(API + path, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message || "Unable to load data");
  return body;
}
export function FeatureWorkspace({ feature, onBack, language = "en" }: Props) {
  const [q, setQ] = useState("");
  const account = feature === "Profile" || feature === "Settings",
    ai = feature === "Islamic AI",
    quran = feature === "Quran",
    tafsir = feature === "Tafsir",
    showHeader = quran || feature === "Tafsir" || feature === "Tasbih";
  return (
    <section
      className={
        account
          ? "feature-page account-page"
          : ai
            ? "feature-page ai-feature-page"
            : quran
              ? "feature-page quran-feature-page"
              : tafsir
                ? "feature-page tafsir-feature-page"
              : "feature-page"
      }
    >
      {showHeader && (
        <header>
          <button onClick={onBack} aria-label='Back to home'>
            <b>‹</b>
            <span>Home</span>
          </button>
          <div>
            {quran ? (
              <>
                <h1>Al Quran</h1>
                <small>QURAN KAREEM</small>
              </>
            ) : (
              <>
                <small>DEEN ISLAM WEB</small>
                <h1>{feature}</h1>
              </>
            )}
          </div>
          <label>
            <span>⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${feature}…`}
            />
          </label>
        </header>
      )}
      <div className='feature-body'>
        <Feature
          feature={feature}
          query={q}
          onQueryChange={setQ}
          language={language}
          onBack={onBack}
        />
      </div>
    </section>
  );
}
function Feature({
  feature,
  query,
  onQueryChange,
  language,
  onBack,
}: {
  feature: string;
  query: string;
  onQueryChange: (value: string) => void;
  language: string;
  onBack: () => void;
}) {
  if (feature === "Tafsir")
    return (
      <TafsirWorkspace query={query} language={language} onBack={onBack} />
    );
  if (feature === "Islamic History")
    return <IslamicHistoryWorkspace query={query} language={language} />;
  if (feature === "Quran")
    return <Quran tafsir={false} query={query} onQueryChange={onQueryChange} language={language} />;
  if (feature === "Hadith")
    return <HadithWorkspace query={query} language={language} />;
  if (feature === "Masala") return <Duas query={query} language={language} />;
  if (feature === "Duas & Amol")
    return <DuasAmol query={query} language={language} />;
  if (feature === "Daily Tasks" || feature === "Daily Prayer")
    return <DailyTasks />;
  if (feature === "Prayer Times") return <Prayer tracker={false} />;
  if (feature === "Qibla Direction") return <Qibla />;
  if (feature === "Tasbih") return <Tasbih />;
  if (feature === "Zakat") return <Zakat />;
  if (feature === "Prophets")
    return <Prophets language={language} onBack={onBack} />;
  if (feature === "Islamic AI") return <AI language={language} />;
  if (feature === "Islamic Lifestyle")
    return <Lifestyle query={query} language={language} />;
  if (feature === "Downloads" || feature === "Bookmarks")
    return <Saved type={feature} />;
  if (feature === "Profile" || feature === "Settings")
    return <Account language={language} />;
  if (feature === "Islamic Books")
    return <IslamicBooks query={query} language={language} />;
  if (feature === "Sahaba")
    return <SahabaLibrary query={query} language={language} onBack={onBack} />;
  if (feature === "Islamic Calendar")
    return <IslamicCalendar onBack={onBack} language={language} />;
  if (feature === "Notifications")
    return <NotificationsInbox onBack={onBack} />;
  if (feature === "About Us")
    return <ManagedInfoPage endpoint='/api/about-content' fallbackTitle='About DeenIslam' fallbackSubtitle='Your daily Islamic companion' />;
  if (feature === "Privacy Policy")
    return <ManagedInfoPage endpoint='/api/privacy-content' fallbackTitle='Your Privacy Matters' fallbackSubtitle='Clear information about your data and choices' />;
  if (feature === "Terms & Conditions")
    return <ManagedInfoPage endpoint='/api/terms-content' fallbackTitle='Terms & Conditions' fallbackSubtitle='Guidelines for using DeenIslam' />;
  if (feature === "Help Center")
    return <ManagedInfoPage endpoint='/api/help-content' fallbackTitle='Help Center' fallbackSubtitle='Answers, guidance and support for DeenIslam' />;
  if (["Help Center", "Contact", "Privacy Policy", "Terms & Conditions"].includes(feature))
    return <SupportContent feature={feature} />;
  return <Knowledge title={feature} query={query} />;
}

type CalendarEvent = {
  id: string;
  title: string;
  label?: string;
  eventDate: string;
  description?: string;
  imageUrl?: string;
  link?: string;
};

const calendarCountries = [
  { code: "BD", name: "Bangladesh", locale: "bn-BD", method: "HJCoSA" },
  { code: "SA", name: "Saudi Arabia", locale: "en-SA", method: "UAQ" },
  { code: "TR", name: "Türkiye", locale: "tr-TR", method: "DIYANET" },
  { code: "AE", name: "United Arab Emirates", locale: "en-AE", method: "UAQ" },
  { code: "QA", name: "Qatar", locale: "en-QA", method: "UAQ" },
  { code: "KW", name: "Kuwait", locale: "en-KW", method: "UAQ" },
  { code: "PK", name: "Pakistan", locale: "en-PK", method: "HJCoSA" },
  { code: "IN", name: "India", locale: "en-IN", method: "HJCoSA" },
  { code: "ID", name: "Indonesia", locale: "id-ID", method: "MATHEMATICAL" },
  { code: "MY", name: "Malaysia", locale: "ms-MY", method: "MATHEMATICAL" },
  { code: "EG", name: "Egypt", locale: "en-EG", method: "HJCoSA" },
  { code: "JO", name: "Jordan", locale: "en-JO", method: "HJCoSA" },
  { code: "GB", name: "United Kingdom", locale: "en-GB", method: "HJCoSA" },
  { code: "US", name: "United States", locale: "en-US", method: "HJCoSA" },
  { code: "CA", name: "Canada", locale: "en-CA", method: "HJCoSA" },
  { code: "AU", name: "Australia", locale: "en-AU", method: "HJCoSA" },
] as const;

type HijriCalendarDay = {
  day: string;
  month: { en: string; ar: string };
  year: string;
  holidays?: string[];
};

function IslamicCalendar({ onBack, language }: { onBack: () => void; language: string }) {
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [countryCode, setCountryCode] = useState("BD");
  const [hijriDays, setHijriDays] = useState<Record<string, HijriCalendarDay>>({});
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    json(`/api/home-events?refresh=${Date.now()}`)
      .then((body) => setEvents(Array.isArray(body.data) ? body.data : []))
      .catch(() => setEvents([]));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("deenislam_calendar_country");
    if (saved && calendarCountries.some((country) => country.code === saved))
      setCountryCode(saved);
  }, []);

  const country = calendarCountries.find((item) => item.code === countryCode) || calendarCountries[0];

  useEffect(() => {
    let active = true;
    setCalendarLoading(true);
    fetch(
      `https://api.aladhan.com/v1/gToHCalendar/${month.getMonth() + 1}/${month.getFullYear()}?calendarMethod=${country.method}`,
      { cache: "no-store" },
    )
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((body) => {
        if (!active || !Array.isArray(body.data)) return;
        const next: Record<string, HijriCalendarDay> = {};
        body.data.forEach((row: { gregorian?: { date?: string }; hijri?: HijriCalendarDay }) => {
          const value = row.gregorian?.date?.split("-");
          if (!value || value.length !== 3 || !row.hijri) return;
          next[`${value[2]}-${value[1]}-${value[0]}`] = row.hijri;
        });
        setHijriDays(next);
      })
      .catch(() => { if (active) setHijriDays({}); })
      .finally(() => { if (active) setCalendarLoading(false); });
    return () => { active = false; };
  }, [month, country.method]);

  const locale = language === "bn" && countryCode === "BD" ? "bn-BD" : country.locale;
  const dateKey = (date: Date) => {
    const year = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${m}-${day}`;
  };
  const hijri = (date: Date, options: Intl.DateTimeFormatOptions) => {
    const apiDate = hijriDays[dateKey(date)];
    if (apiDate) {
      if (options.day && options.month && options.year)
        return `${apiDate.day} ${apiDate.month.en} · ${apiDate.month.ar} · ${apiDate.year} AH`;
      if (options.month && options.year)
        return `${apiDate.month.en} · ${apiDate.month.ar} · ${apiDate.year} AH`;
      if (options.day) return apiDate.day;
    }
    try {
      return new Intl.DateTimeFormat(`${locale}-u-ca-islamic`, options).format(date);
    } catch {
      return "";
    }
  };
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1)),
  ];
  while (cells.length % 7) cells.push(null);
  const selectedEvents = events.filter((event) => event.eventDate === dateKey(selected));
  const upcoming = events
    .filter((event) => event.eventDate >= dateKey(today))
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    .slice(0, 5);
  const sameDay = (a: Date, b: Date) => dateKey(a) === dateKey(b);
  const moveMonth = (offset: number) => {
    const next = new Date(month.getFullYear(), month.getMonth() + offset, 1);
    setMonth(next);
    setSelected(next);
  };

  return (
    <div className='islamic-calendar-page'>
      <button className='calendar-back' onClick={onBack}>← Back to home</button>
      <section className='calendar-hero'>
        <div>
          <small>ISLAMIC CALENDAR</small>
          <h1>{today.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h1>
          <p>{hijri(today, { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <div className='calendar-country-control'>
          <label htmlFor='calendar-country'>Country</label>
          <select
            id='calendar-country'
            value={countryCode}
            onChange={(event) => {
              setCountryCode(event.target.value);
              localStorage.setItem("deenislam_calendar_country", event.target.value);
            }}
          >
            {calendarCountries.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}
          </select>
          <small>{calendarLoading ? "Updating calendar…" : `${country.name} · ${country.method}`}</small>
        </div>
      </section>
      <div className='calendar-layout'>
        <section className='calendar-card'>
          <header>
            <button onClick={() => moveMonth(-1)} aria-label='Previous month'>‹</button>
            <div>
              <h2>{month.toLocaleDateString(locale, { month: "long", year: "numeric" })}</h2>
              <span>{hijri(month, { month: "long", year: "numeric" })}</span>
            </div>
            <button onClick={() => moveMonth(1)} aria-label='Next month'>›</button>
          </header>
          <div className='calendar-weekdays'>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <b key={day}>{day}</b>)}
          </div>
          <div className='calendar-grid'>
            {cells.map((date, index) => date ? (
              <button
                key={dateKey(date)}
                className={`${sameDay(date, today) ? "today " : ""}${sameDay(date, selected) ? "selected " : ""}${events.some((event) => event.eventDate === dateKey(date)) ? "has-event" : ""}`.trim()}
                onClick={() => setSelected(date)}
              >
                <strong>{date.getDate()}</strong>
                <small>{hijri(date, { day: "numeric" })}</small>
                <i />
              </button>
            ) : <span key={`blank-${index}`} />)}
          </div>
        </section>
        <aside className='calendar-side'>
          <section className='selected-date-card'>
            <small>SELECTED DATE</small>
            <h2>{selected.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}</h2>
            <p>{hijri(selected, { day: "numeric", month: "long", year: "numeric" })}</p>
            {selectedEvents.length ? selectedEvents.map((event) => (
              <button key={event.id} onClick={() => { if (event.link) window.location.href = event.link; }}>
                <i>✦</i><span><b>{event.title}</b><small>{event.description || event.label || "Islamic event"}</small></span>
              </button>
            )) : <div className='calendar-no-event'>No event scheduled for this date.</div>}
          </section>
          <section className='upcoming-events-card'>
            <header><span><small>COMING UP</small><h2>Islamic events</h2></span><b>{upcoming.length}</b></header>
            {upcoming.length ? upcoming.map((event) => {
              const date = new Date(`${event.eventDate}T12:00:00`);
              return <button key={event.id} onClick={() => { setMonth(new Date(date.getFullYear(), date.getMonth(), 1)); setSelected(date); }}>
                <time><b>{date.getDate()}</b><small>{date.toLocaleDateString(locale, { month: "short" })}</small></time>
                <span><strong>{event.title}</strong><small>{event.label || hijri(date, { day: "numeric", month: "long" })}</small></span>
                <em>›</em>
              </button>;
            }) : <p>No upcoming events.</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}

function NotificationsInbox({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<WebNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const notificationDeviceId = () => {
    const key = "deenislam_web_notification_device";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const value = `web:${crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
    localStorage.setItem(key, value);
    return value;
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await json(
        `/api/notifications?deviceId=${encodeURIComponent(notificationDeviceId())}&refresh=${Date.now()}`,
      );
      setItems(Array.isArray(result.data) ? result.data : []);
    } catch (value) {
      setError(value instanceof Error ? value.message : "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const destination = (item: WebNotification) => {
    const data = item.data || {};
    if (data.surahNumber)
      return `/quran?surah=${data.surahNumber}${data.ayahNumber ? `&ayah=${data.ayahNumber}` : ""}`;
    return data.contentId?.trim() || data.url?.trim() || `/notification/${item.id}`;
  };

  const open = (item: WebNotification) => {
    setItems((current) =>
      current.map((row) => (row.id === item.id ? { ...row, unread: false } : row)),
    );
    void json(`/api/notifications/${encodeURIComponent(item.id)}/read`, {
      method: "PATCH",
      body: JSON.stringify({ deviceId: notificationDeviceId() }),
    });
    window.location.href = destination(item);
  };

  const remove = async (item: WebNotification) => {
    setItems((current) => current.filter((row) => row.id !== item.id));
    try {
      await json(`/api/notifications/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
        body: JSON.stringify({ deviceId: notificationDeviceId() }),
      });
    } catch {
      void load();
    }
  };

  const visible = filter === "unread" ? items.filter((item) => item.unread) : items;
  const unreadCount = items.filter((item) => item.unread).length;

  return (
    <div className='notifications-page'>
      <button className='notifications-back' onClick={onBack}>
        <span aria-hidden='true'>←</span> Back to home
      </button>
      <section className='notifications-hero'>
        <div>
          <i aria-hidden='true'>
            <DeenIcon name='Notifications' size={27} strokeWidth={1.8} />
          </i>
          <span>
            <small>YOUR UPDATES</small>
            <h1>Notifications</h1>
            <p>Important updates, reminders and messages from Deen Islam.</p>
          </span>
        </div>
        <b>{unreadCount}<small>Unread</small></b>
      </section>
      <section className='notifications-toolbar'>
        <div>
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All <b>{items.length}</b></button>
          <button className={filter === "unread" ? "active" : ""} onClick={() => setFilter("unread")}>Unread <b>{unreadCount}</b></button>
        </div>
        <button className='notifications-refresh' onClick={() => void load()} disabled={loading}>↻ <span>{loading ? "Loading…" : "Refresh"}</span></button>
      </section>
      {error && <div className='notifications-error'>{error}</div>}
      <div className='notifications-feed'>
        {!loading && visible.map((item) => (
          <article className={item.unread ? "unread" : ""} key={item.id}>
            <button className='notification-open-area' onClick={() => open(item)}>
              <i aria-hidden='true'>
                <DeenIcon name='Notifications' size={21} strokeWidth={1.8} />
              </i>
              <span>
                <span className='notification-meta'>
                  {item.unread && <b>NEW</b>}
                  <time>{new Date(item.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</time>
                </span>
                <strong>{item.title}</strong>
                <small>{item.body}</small>
              </span>
              <em aria-hidden='true'>→</em>
            </button>
            <button className='notifications-delete' onClick={() => void remove(item)} aria-label={`Delete ${item.title}`}>×</button>
          </article>
        ))}
        {loading && <div className='notifications-state'><i className='notifications-spinner' /><b>Loading notifications…</b></div>}
        {!loading && !visible.length && (
          <div className='notifications-state'>
            <i><DeenIcon name='Notifications' size={28} strokeWidth={1.6} /></i>
            <h2>{filter === "unread" ? "You’re all caught up" : "No notifications yet"}</h2>
            <p>{filter === "unread" ? "There are no unread notifications." : "New updates and reminders will appear here."}</p>
          </div>
        )}
      </div>
    </div>
  );
}

type ManagedInfoContent = { title: string; subtitle: string; body: string };

function ManagedInfoPage({ endpoint, fallbackTitle, fallbackSubtitle }: { endpoint: string; fallbackTitle: string; fallbackSubtitle: string }) {
  const [content, setContent] = useState<ManagedInfoContent>({ title: fallbackTitle, subtitle: fallbackSubtitle, body: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API}${endpoint}?refresh=${Date.now()}`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) throw new Error("Help content service is not available yet. Please restart the backend server.");
      const result = await response.json();
      if (!response.ok || !result.data) throw new Error(result.message || "Unable to load content");
      setContent({ title: result.data.title || fallbackTitle, subtitle: result.data.subtitle || fallbackSubtitle, body: result.data.body || "" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [endpoint]);

  return <div className='support-page legal-page managed-info-page'>
    <section className='support-hero'><small>ADMIN MANAGED CONTENT</small><h1>{content.title}</h1><p>{content.subtitle}</p></section>
    <article className='support-card'>
      {loading ? <p className='managed-info-status'>Loading latest content…</p> : error ? <div className='managed-info-error'><p>{error}</p><button type='button' onClick={()=>void load()}>Try Again</button></div> : <div className='managed-rich-content' dangerouslySetInnerHTML={{ __html: content.body }} />}
    </article>
  </div>;
}

function SupportContent({ feature }: { feature: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [sent, setSent] = useState(false);

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);setNotice("");setSent(false);
    try {
      const response = await fetch(`${API}/api/contact-support`, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,email,subject,message,source:"Website",website:""})});
      const contentType=response.headers.get("content-type")||"";
      if(!contentType.includes("application/json"))throw new Error("Contact service is unavailable. Please try again later.");
      const result=await response.json();
      if(!response.ok)throw new Error(result.message||"Unable to send your message.");
      setSent(true);setNotice(result.message||"Your message has been sent successfully.");setSubject("");setMessage("");
    } catch(reason) {setNotice(reason instanceof Error?reason.message:"Unable to send your message.");}
    finally {setSending(false);}
  };

  if (feature === "Help Center") {
    return <div className='support-page'>
      <section className='support-hero'><small>DEEN ISLAM SUPPORT</small><h1>How can we help?</h1><p>Find quick answers or contact our support team.</p></section>
      <section className='support-card'><h2>Frequently Asked Questions</h2>
        <details><summary>How do I change the Quran translation or reciter?</summary><p>Open Settings, then select Language or Quran Reciter and choose your preferred option.</p></details>
        <details><summary>How are prayer times calculated?</summary><p>Prayer times use your selected location and calculation settings. Allow location access for the most relevant results.</p></details>
        <details><summary>How do I save Quran verses or Islamic content?</summary><p>Use the bookmark button beside supported content, then open Bookmarks from the main menu.</p></details>
        <details><summary>Can I use downloaded content offline?</summary><p>Content saved through Downloads remains available from the Downloads section when supported by your device.</p></details>
      </section>
      <section className='support-contact-strip'><div><h2>Still need help?</h2><p>Our support team is available by email.</p></div><a href='mailto:info@deenislam.com'>Email Support</a></section>
    </div>;
  }

  if (feature === "Contact") {
    return <div className='support-page contact-page'>
      <section className='support-hero contact-hero'><div><small>CONTACT DEEN ISLAM</small><h1>We would love to hear from you</h1><p>Send feedback, report an issue or ask for assistance.</p></div><span aria-hidden='true'>✉</span></section>
      <div className='support-contact-grid'>
        <section className='support-card contact-info'><div><small>GET IN TOUCH</small><h2>Contact information</h2><p>Our support team is ready to help with your questions, feedback and technical issues.</p></div><div className='contact-methods'><a href='mailto:info@deenislam.com'><i>✉</i><span><small>EMAIL US</small><b>info@deenislam.com</b></span></a><a href='tel:+15551234567'><i>☎</i><span><small>CALL US</small><b>+1 (555) 123-4567</b></span></a><div><i>⌖</i><span><small>LOCATION</small><b>New York, NY, USA</b></span></div></div><aside><b>Typical response time</b><span>We usually respond within 24–48 hours.</span></aside></section>
        <form className='support-card support-form contact-form' onSubmit={sendMessage}><div><small>SUPPORT REQUEST</small><h2>Send a message</h2><p>Complete the form and your message will be delivered securely to our team.</p></div><div className='contact-form-row'><label>Name<input required minLength={2} placeholder='Your full name' value={name} onChange={event=>setName(event.target.value)} /></label><label>Email address<input required type='email' placeholder='you@example.com' value={email} onChange={event=>setEmail(event.target.value)} /></label></div><label>Subject<input required minLength={3} placeholder='How can we help?' value={subject} onChange={event=>setSubject(event.target.value)} /></label><label>Message<textarea required minLength={10} rows={5} placeholder='Describe your question or issue' value={message} onChange={event=>setMessage(event.target.value)} /></label>{notice&&<p className={`contact-notice ${sent?"success":"error"}`}>{notice}</p>}<button type='submit' disabled={sending}>{sending?"Sending…":"Send Message"}<span aria-hidden='true'>→</span></button></form>
      </div>
    </div>;
  }

  return <div className='support-page legal-page'>
    <section className='support-hero'><small>DEEN ISLAM LEGAL</small><h1>{feature}</h1><p>Last updated: October 17, 2026</p></section>
    <article className='support-card'>
      <h2>Acceptance of terms</h2><p>By using Deen Islam, you agree to these terms and applicable laws. If you do not agree, please discontinue use of the service.</p>
      <h2>Service and Islamic content</h2><p>Deen Islam provides educational and worship-support resources. Content is not a substitute for advice from a qualified Islamic scholar, legal professional or medical professional.</p>
      <h2>Acceptable use</h2><p>You may not misuse the service, attempt unauthorized access, disrupt its operation, scrape protected content or use it for unlawful or harmful activities.</p>
      <h2>Accounts and availability</h2><p>You are responsible for your account security. Features may change, be interrupted or be withdrawn as the service is improved.</p>
      <h2>Contact</h2><p>Questions about these terms can be sent to <a href='mailto:info@deenislam.com'>info@deenislam.com</a>.</p>
    </article>
  </div>;
}

function IslamicBooks({
  query,
  language,
}: {
  query: string;
  language: string;
}) {
  const [rows, setRows] = useState<LibraryBook[]>([]),
    [selected, setSelected] = useState<LibraryBook | null>(null),
    [selectedPart, setSelectedPart] = useState<number | null>(null),
    [selectedPage, setSelectedPage] = useState(0),
    [search, setSearch] = useState(""),
    [bookFilter, setBookFilter] = useState<"all" | "new">("all"),
    [grid, setGrid] = useState(true),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    json(
      `/api/books?language=${encodeURIComponent(language)}&refresh=${Date.now()}`,
    )
      .then((body) => {
        if (active)
          setRows(
            (Array.isArray(body.data) ? body.data : []).filter(
              (item: LibraryBook) =>
                !["Sahaba", "Male Sahaba", "Female Sahabiyat", "Amol"].includes(
                  item.category || "",
                ),
            ),
          );
      })
      .catch(
        (reason) =>
          active &&
          setError(
            reason instanceof Error ? reason.message : "Unable to load books.",
          ),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [language]);
  const shown = useMemo(() => {
    const value = (search || query).trim().toLowerCase();
    const matches = rows.filter(
      (item) =>
        !value ||
          `${item.title} ${item.author || ""} ${item.category || ""}`
            .toLowerCase()
            .includes(value),
    );
    return bookFilter === "new" ? matches.slice(0, 8) : matches;
  }, [rows, bookFilter, query, search]);
  const open = async (item: LibraryBook, updateUrl = true) => {
    if (!item.slug) {
      if (item.sourceUrl) window.open(item.sourceUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const body = await json(`/api/books/${encodeURIComponent(item.slug)}?language=${encodeURIComponent(language)}&refresh=${Date.now()}`);
      setSelected(body.data);
      setSelectedPart(null);
      setSelectedPage(0);
      if (updateUrl) window.history.pushState({}, "", `/islamic-books/${item.slug}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to open book.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!rows.length) return;
    const syncPath = () => {
      const parts = window.location.pathname.split("/").filter(Boolean);
      if (parts[0] !== "islamic-books" || !parts[1]) {
        setSelected(null);
        setSelectedPart(null);
        return;
      }
      const item = rows.find(row => row.slug === decodeURIComponent(parts[1]));
      if (item && selected?.slug !== item.slug) void open(item, false);
    };
    syncPath();
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, [rows, selected?.slug]);
  if (selected) {
    const isPdfBook =
      selected.category === "PDF Books" || Boolean(selected.extraction?.sourceFile);
    const parts = selected.pages?.length
      ? selected.pages.map((part) => ({
          title: part.title || selected.title,
          reference: part.reference || "",
          pages: part.pages?.length
            ? part.pages.map(page => ({ content: page.text || page.markdown || "", imageUrl: page.imageUrl || "", imageWidth: page.imageWidth || 0, imageHeight: page.imageHeight || 0 }))
            : [{ content: part.text || part.markdown || "", imageUrl: part.imageUrl || "", imageWidth: part.imageWidth || 0, imageHeight: part.imageHeight || 0 }],
        }))
      : [{ title: selected.title, reference: selected.sourceUrl || "", pages: [{ content: selected.content || "", imageUrl: "", imageWidth: 0, imageHeight: 0 }] }];
    const activePart = selectedPart ?? (parts.length === 1 ? 0 : null);
    if (activePart !== null) {
      const part = parts[activePart], activePage = part.pages[selectedPage], content = activePage?.content || "";
      return <div className={`amol-reader sahaba-detail-reader${isPdfBook ? " pdf-book-reader" : ""}`}>
        <button className='section-back' onClick={() => {
          setSelectedPage(0);
          if (parts.length === 1) {
            setSelected(null);
            window.history.pushState({}, "", "/islamic-books");
          } else setSelectedPart(null);
        }}>← {parts.length === 1 ? "All Books" : "All parts"}</button>
        <article>
          <header className='amol-reader-head sahaba-detail-head'>
            {selected.coverImageUrl ? <img src={selected.coverImageUrl} alt={selected.title} /> : <i className='amol-reader-mark'>◆</i>}
            <div><small>{selected.category || "ISLAMIC BOOK"}{parts.length > 1 ? ` · PART ${activePart + 1}` : ""}</small><h2>{parts.length === 1 ? selected.title : part.title}</h2><b>{selected.author || "DeenIslam Editorial"}</b></div>
          </header>
          {selectedPage === 0 && selected.description && !isPdfBook && (
            <div className='amol-reader-intro book-reader-description'>
              {/<[a-z][\s\S]*>/i.test(selected.description)
                ? <div dangerouslySetInnerHTML={{ __html: selected.description }} />
                : <p>{selected.description}</p>}
            </div>
          )}
          <div className='amol-reader-content'><section><span>PAGE {selectedPage + 1} OF {part.pages.length}</span>{activePage?.imageUrl ? <img className='pdf-source-page' src={activePage.imageUrl} alt={`${selected.title} — page ${selectedPage + 1}`} /> : /<[a-z][\s\S]*>/i.test(content) ? <div dangerouslySetInnerHTML={{ __html: content }} /> : content.split(/\n{2,}/).filter(Boolean).map((paragraph,index)=><p key={index}>{paragraph.replace(/^#{1,6}\s+/,"")}</p>)}{part.reference && <aside><b>Reference</b><p>{part.reference}</p></aside>}</section></div>
          <nav className='sahaba-page-nav'><button disabled={selectedPage===0} onClick={()=>setSelectedPage(value=>Math.max(0,value-1))}>← Previous page</button><span>{selectedPage+1} / {part.pages.length}</span><button disabled={selectedPage===part.pages.length-1} onClick={()=>setSelectedPage(value=>Math.min(part.pages.length-1,value+1))}>Next page →</button></nav>
        </article>
      </div>;
    }
    return <div className='amol-reader amol-overview sahaba-detail-reader'>
      <button className='section-back' onClick={() => { setSelected(null); window.history.pushState({},"","/islamic-books"); }}>← All Books</button>
      <header className='amol-profile sahaba-detail-profile'>
        {selected.coverImageUrl ? <img src={selected.coverImageUrl} alt={selected.title} /> : <div className='book-detail-fallback'>◆</div>}
        <h2>{selected.title}</h2><p>{selected.description || "Read this Islamic book part by part."}</p><small>{parts.length} {parts.length===1?"PART":"PARTS"}</small>
      </header>
      <div className='amol-parts'>{parts.map((part,index)=><button key={index} onClick={()=>{setSelectedPart(index);setSelectedPage(0)}}><span>PART {index+1} · {part.pages.length} {part.pages.length===1?"PAGE":"PAGES"}</span><h3>{part.title}</h3><p>{part.pages.map(page=>page.content).join(" ").replace(/<[^>]+>/g," ").replace(/[\*_>`-]/g,"").replace(/\s+/g," ").trim().slice(0,260) || selected.description}</p><footer>Open book part <b>›</b></footer></button>)}</div>
    </div>;
  }
  return (
    <div className='app-books'>
      <div className='app-books-tools'>
        <label className='app-books-search'>
          <span aria-hidden='true'>⌕</span>
          <input
            type='search'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder='Search by book, author or category...'
            aria-label='Search Islamic books'
          />
        </label>
        <select
          value={bookFilter}
          onChange={(event) =>
            setBookFilter(event.target.value as "all" | "new")
          }
          aria-label='Filter Islamic books'
        >
          <option value='all'>All Books</option>
          <option value='new'>New</option>
        </select>
      </div>
      <header>
        <div>
          <h2>{bookFilter === "new" ? "New Books" : "All Books"}</h2>
          <p>{shown.length} available books</p>
        </div>
        <nav>
          <button
            className={grid ? "active" : ""}
            onClick={() => setGrid(true)}
            aria-label='Grid view'
          >
            ▦
          </button>
          <button
            className={!grid ? "active" : ""}
            onClick={() => setGrid(false)}
            aria-label='List view'
          >
            ▤
          </button>
        </nav>
      </header>
      <Status loading={loading} error={error} />
      <div className={grid ? "app-books-grid" : "app-books-list"}>
        {shown.map((item) => (
          <article key={item.id || item.slug} onClick={() => open(item)}>
            <div className='app-book-cover'>
              {item.coverImageUrl ? (
                <img src={item.coverImageUrl} alt={item.title} />
              ) : (
                <b dir='rtl'>{item.title.slice(0, 3)}</b>
              )}
              <span>{item.category || "Books"}</span>
              <button
                aria-label={`Bookmark ${item.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  bookmark(item.title, "Islamic Books");
                }}
              >
                ▯
              </button>
            </div>
            <section>
              <h3>{item.title}</h3>
              <p>{item.author || "Unknown author"}</p>
              {descriptionText(item.description) && (
                <p className='app-book-description'>
                  {descriptionText(item.description)}
                </p>
              )}
              <small>{item.language || language.toUpperCase()}</small>
              {item.publicDomain && <em>PUBLIC DOMAIN · SOURCE VERIFIED</em>}
            </section>
          </article>
        ))}
      </div>
      {!loading && !error && !shown.length && (
        <div className='empty-state'>
          <b>⌕</b>
          <h2>No books found</h2>
          <p>Try another title, author or category.</p>
        </div>
      )}
    </div>
  );
}

const SAHABA_WEB_COVERS: Record<string, string> = {
  "sahabi-abu-bakr-as-siddiq": "sahabi-abu-bakr.png",
  "sahabi-umar-ibn-al-khattab": "sahabi-umar.png",
  "sahabi-uthman-ibn-affan": "sahabi-uthman.png",
  "sahabi-ali-ibn-abi-talib": "sahabi-ali.png",
  "sahabi-bilal-ibn-rabah": "sahabi-bilal.png",
  "sahabi-salman-al-farisi": "sahabi-salman.png",
  "sahabiyah-khadijah-bint-khuwaylid": "sahabiyah-khadijah.png",
  "sahabiyah-aisha-bint-abi-bakr": "sahabiyah-aisha.png",
  "sahabiyah-fatima-az-zahra": "sahabiyah-fatimah.png",
  "sahabiyah-asma-bint-abi-bakr": "sahabiyah-asma.png",
  "sahabiyah-umm-salama": "sahabiyah-umm-salama.png",
  "sahabiyah-nusaybah-bint-kab": "sahabiyah-nusaybah.png",
};
function SahabaLibrary({
  query,
  language,
  onBack,
}: {
  query: string;
  language: string;
  onBack: () => void;
}) {
  const [rows, setRows] = useState<LibraryBook[]>([]),
    [selected, setSelected] = useState<LibraryBook | null>(null),
    [selectedPart, setSelectedPart] = useState<number | null>(null),
    [selectedPage, setSelectedPage] = useState(0),
    [group, setGroup] = useState<"All" | "Male" | "Female">("All"),
    [search, setSearch] = useState(""),
    [grid, setGrid] = useState(true),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    json(
      `/api/books?language=${encodeURIComponent(language)}&refresh=${Date.now()}`,
    )
      .then((body) => {
        if (active)
          setRows(
            (Array.isArray(body.data) ? body.data : []).filter(
              (item: LibraryBook) =>
                ["Sahaba", "Male Sahaba", "Female Sahabiyat"].includes(
                  item.category || "",
                ),
            ),
          );
      })
      .catch(
        (reason) =>
          active &&
          setError(
            reason instanceof Error ? reason.message : "Unable to load Sahaba.",
          ),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [language]);
  const openBiography = async (item: LibraryBook, updateUrl = true) => {
    setLoading(true);
    setError("");
    try {
      const body = await json(
        `/api/books/${encodeURIComponent(item.slug)}?language=${encodeURIComponent(language)}&refresh=${Date.now()}`,
      );
      setSelected(body.data);
      setSelectedPart(null);
      setSelectedPage(0);
      if (updateUrl)
        window.history.pushState({}, "", `/sahaba/${item.slug}`);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to open biography.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!rows.length) return;
    const syncPath = () => {
      const parts = window.location.pathname.split("/").filter(Boolean);
      if (parts[0] !== "sahaba" || !parts[1]) {
        setSelected(null);
        setSelectedPart(null);
        return;
      }
      const item = rows.find((row) => row.slug === decodeURIComponent(parts[1]));
      if (item && selected?.slug !== item.slug) void openBiography(item, false);
    };
    syncPath();
    window.addEventListener("popstate", syncPath);
    return () => window.removeEventListener("popstate", syncPath);
  }, [rows, selected?.slug]);
  const shown = useMemo(() => {
    const value = (search || query).trim().toLowerCase();
    return rows.filter(
      (item) =>
        (group === "All" ||
          (group === "Male" && item.category === "Male Sahaba") ||
          (group === "Female" && item.category === "Female Sahabiyat")) &&
        (!value ||
          `${item.title} ${item.author || ""} ${item.category || ""}`
            .toLowerCase()
            .includes(value)),
    );
  }, [rows, group, query, search]);
  const cover = (item: LibraryBook) =>
    item.coverImageUrl ||
    `/images/sahaba/${SAHABA_WEB_COVERS[item.slug] || (item.category === "Female Sahabiyat" ? "sahabiyat-female-cover.png" : "sahaba-male-cover.png")}`;
  if (selected) {
    const parts = selected.pages?.length
      ? selected.pages.map((page) => ({
          title: page.title || "",
          reference: page.reference || "",
          pages: page.pages?.length
            ? page.pages.map(item => item.markdown || item.text || "")
            : [page.markdown || page.text || ""],
        }))
      : [{ title: selected.title, reference: selected.sourceUrl || "", pages: [selected.content || ""] }];
    if (selectedPart !== null) {
      const active = parts[selectedPart], activeContent = active.pages[selectedPage] || "";
      return (
        <div className='amol-reader sahaba-detail-reader'>
          <button className='section-back' onClick={() => setSelectedPart(null)}>
            ← All parts
          </button>
          <article>
            <header className='amol-reader-head sahaba-detail-head'>
              <img src={cover(selected)} alt={selected.title} />
              <div>
                <small>{selected.category || "SAHABA"} · BIOGRAPHY</small>
                <h2>{active.title || selected.title}</h2>
                <b>{selected.author || "DeenIslam Editorial"}</b>
              </div>
            </header>
            <div className='amol-reader-content'>
              <section>
                <span>PART {selectedPart + 1} · PAGE {selectedPage + 1} OF {active.pages.length}</span>
                {activeContent.split(/\n{2,}/).filter(Boolean).map((paragraph, index) => (
                  <p key={index}>{paragraph.replace(/^#{1,6}\s+/, "").replace(/\*\*/g, "")}</p>
                ))}
                {active.reference && <aside><b>Source</b><p>{active.reference}</p></aside>}
              </section>
            </div>
            <nav className='sahaba-page-nav'>
              <button disabled={selectedPage === 0} onClick={() => setSelectedPage(value => Math.max(0, value - 1))}>← Previous page</button>
              <span>{selectedPage + 1} / {active.pages.length}</span>
              <button disabled={selectedPage === active.pages.length - 1} onClick={() => setSelectedPage(value => Math.min(active.pages.length - 1, value + 1))}>Next page →</button>
            </nav>
          </article>
        </div>
      );
    }
    return (
      <div className='amol-reader amol-overview sahaba-detail-reader'>
        <button className='section-back' onClick={() => {
          setSelected(null);
          window.history.pushState({}, "", "/sahaba");
        }}>
          ← All Sahaba
        </button>
        <header className='amol-profile sahaba-detail-profile'>
          <img src={cover(selected)} alt={selected.title} />
          <h2>{selected.title}</h2>
          <p>{selected.description || "Read the complete biography and lessons."}</p>
          <small>{parts.length} {parts.length === 1 ? "PART" : "PARTS"}</small>
        </header>
        <div className='amol-parts'>
          {parts.map((part, index) => (
            <button key={index} onClick={() => { setSelectedPart(index); setSelectedPage(0); }}>
              <span>PART {index + 1} · {part.pages.length} {part.pages.length === 1 ? "PAGE" : "PAGES"}</span>
              <h3>{part.title || selected.title}</h3>
              <p>{part.pages.join(" ").replace(/<[^>]+>/g, " ").replace(/^#{1,6}\s+/gm, "").replace(/[\*_>`-]/g, "").replace(/\s+/g, " ").trim().slice(0, 260) || selected.description}</p>
              <footer>Read full biography <b>›</b></footer>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className='app-books sahaba-library'>
      <button type='button' className='sahaba-back' onClick={onBack}>
        <b>‹</b> Back
      </button>
      <div className='prophets-heading sahaba-heading'>
        <i>✦</i>
        <div>
          <h2>Sahaba</h2>
          <p>Companions of Prophet Muhammad ﷺ</p>
        </div>
        <span>{rows.length}</span>
      </div>
      <label className='sahaba-search'>
        <b>⌕</b>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder='Search Sahaba by name...'
        />
        {search && (
          <button
            type='button'
            aria-label='Clear search'
            onClick={() => setSearch("")}
          >
            ×
          </button>
        )}
      </label>
      <div className='sahaba-tabs'>
        <button
          className={group === "All" ? "active" : ""}
          onClick={() => setGroup("All")}
        >
          All
        </button>
        <button
          className={group === "Male" ? "active" : ""}
          onClick={() => setGroup("Male")}
        >
          Male Sahaba
        </button>
        <button
          className={group === "Female" ? "active" : ""}
          onClick={() => setGroup("Female")}
        >
          Female Sahabiyat
        </button>
      </div>
      <header>
        <div>
          <h2>
            {group === "All"
              ? "Sahaba"
              : group === "Male"
                ? "Male Sahaba"
                : "Female Sahabiyat"}
          </h2>
          <p>{shown.length} available biographies</p>
        </div>
        <nav>
          <button
            className={grid ? "active" : ""}
            onClick={() => setGrid(true)}
            aria-label='Grid view'
          >
            ▦
          </button>
          <button
            className={!grid ? "active" : ""}
            onClick={() => setGrid(false)}
            aria-label='List view'
          >
            ▤
          </button>
        </nav>
      </header>
      <Status loading={loading} error={error} />
      <div
        className={
          grid ? "app-books-grid sahaba-grid" : "app-books-list sahaba-list"
        }
      >
        {shown.map((item) => (
          <article
            key={item.id || item.slug}
            onClick={() => void openBiography(item)}
          >
            <div className='app-book-cover'>
              <img src={cover(item)} alt={item.title} />
              <span>{item.category}</span>
              <button
                aria-label={`Bookmark ${item.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  bookmark(item.title, "Sahaba");
                }}
              >
                ▯
              </button>
            </div>
            <section>
              <h3>{item.title}</h3>
              <p>{item.author || "DeenIslam Editorial"}</p>
              <small>{item.language || language.toUpperCase()}</small>
            </section>
          </article>
        ))}
      </div>
      {!loading && !error && !shown.length && (
        <div className='empty-state'>
          <b>⌕</b>
          <h2>No biographies found</h2>
          <p>Try another name or group.</p>
        </div>
      )}
    </div>
  );
}

function Lifestyle({ query, language }: { query: string; language: string }) {
  const [items, setItems] = useState<LifestyleItem[]>([]),
    [category, setCategory] = useState<LifestyleItem | null>(null),
    [chapter, setChapter] = useState<LifestyleItem | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    json(
      `/api/islamic-lifestyle?language=${encodeURIComponent(language)}&refresh=${Date.now()}`,
    )
      .then((body) => {
        if (live) setItems(Array.isArray(body.data) ? body.data : []);
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [language]);
  const categories = useMemo(
    () =>
      items.filter(
        (item) =>
          item.kind === "category" &&
          `${item.title} ${item.subtitle} ${item.section}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [items, query],
  );
  const chapters = useMemo(
    () =>
      items.filter(
        (item) =>
          item.kind === "chapter" && item.parentCategorySlug === category?.slug,
      ),
    [items, category],
  );
  const push = (path: string) => window.history.pushState({}, "", path);
  useEffect(() => {
    if (!items.length) return;
    const sync = () => {
      const parts = window.location.pathname.split("/").filter(Boolean);
      if (parts[0] !== "islamic-lifestyle") return;
      const nextCategory =
        items.find(
          (item) => item.kind === "category" && item.slug === parts[1],
        ) || null;
      setCategory(nextCategory);
      setChapter(
        parts[2]
          ? items.find(
              (item) => item.kind === "chapter" && item.slug === parts[2],
            ) || null
          : null,
      );
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [items]);
  if (chapter)
    return (
      <div className='lifestyle-reader'>
        <button
          className='section-back'
          onClick={() => {
            setChapter(null);
            push(`/islamic-lifestyle/${category?.slug || ""}`);
          }}
        >
          ← {category?.title || "Islamic Lifestyle"}
        </button>
        <article>
          <small>
            ISLAMIC LIFESTYLE · CHAPTER{" "}
            {String(chapter.order || 1).padStart(2, "0")}
          </small>
          <h2>{chapter.title}</h2>
          {chapter.subtitle && (
            <p className='lifestyle-lead'>{chapter.subtitle}</p>
          )}
          {chapter.quran?.arabic && (
            <blockquote>
              <b dir='rtl'>{chapter.quran.arabic}</b>
              {chapter.quran.meaning && <p>{chapter.quran.meaning}</p>}
              <small>{chapter.quran.reference}</small>
            </blockquote>
          )}
          <LifestyleSection
            title='Detailed explanation'
            rows={chapter.introduction}
          />
          <LifestyleSection
            title='Key lessons'
            rows={chapter.lessons}
            numbered
          />
          <LifestyleSection
            title='Practical action plan'
            rows={chapter.actions}
            checked
          />
          <LifestyleSection
            title='Common mistakes to avoid'
            rows={chapter.mistakes}
          />
          <LifestyleSection
            title='Daily self-check'
            rows={chapter.checklist}
            checked
          />
          {chapter.practice && (
            <aside>
              <b>PUT IT INTO PRACTICE</b>
              <p>{chapter.practice}</p>
            </aside>
          )}
          {chapter.reflection && (
            <aside className='reflection'>
              <b>REFLECT</b>
              <p>{chapter.reflection}</p>
            </aside>
          )}
          {chapter.summary && (
            <section>
              <h3>Chapter summary</h3>
              <p>{chapter.summary}</p>
            </section>
          )}
          {chapter.sources?.length ? (
            <section>
              <h3>Sources & study notes</h3>
              {chapter.sources.map((source) => (
                <a
                  key={source.label}
                  href={source.url || "#"}
                  target='_blank'
                  rel='noreferrer'
                >
                  <b>{source.label}</b>
                  <span>{source.note}</span>
                </a>
              ))}
            </section>
          ) : null}
        </article>
      </div>
    );
  if (category)
    return (
      <div className='lifestyle-category'>
        <button
          className='section-back'
          onClick={() => {
            setCategory(null);
            push("/islamic-lifestyle");
          }}
        >
          ← All lifestyle guides
        </button>
        <div className='feature-hero'>
          <span>ISLAMIC LIFESTYLE GUIDANCE</span>
          <h2>{category.title}</h2>
          <p>{category.subtitle}</p>
        </div>
        <div className='lifestyle-chapters'>
          {chapters.map((item, index) => (
            <button
              key={item.id}
              onClick={() => {
                setChapter(item);
                push(`/islamic-lifestyle/${category.slug}/${item.slug}`);
              }}
            >
              <i>{String(item.order || index + 1).padStart(2, "0")}</i>
              <span>
                <strong>{item.title}</strong>
                <small>{item.subtitle}</small>
              </span>
              <b>›</b>
            </button>
          ))}
        </div>
        {!chapters.length ? (
          <div className='empty-state'>
            <h2>No chapters published yet</h2>
            <p>
              New admin-managed chapters will appear here in both App and Web.
            </p>
          </div>
        ) : null}
      </div>
    );
  const sections = Array.from(
    new Set(categories.map((item) => item.section || "General Muslim Life")),
  );
  return (
    <div className='lifestyle-hub'>
      <a className='sahaba-back' href='/'>
        <b>‹</b> Back to Home
      </a>
      <div className='feature-hero'>
        <span>ONE SHARED APP & WEB LIBRARY</span>
        <h2>Islamic Lifestyle</h2>
        <p>
          {items.length} admin-managed guides and chapters ·{" "}
          {language.toUpperCase()} translation when available.
        </p>
      </div>
      <Status loading={loading} error={error} />
      {sections.map((section) => (
        <section key={section}>
          <h2>{section}</h2>
          <div className='lifestyle-grid'>
            {categories
              .filter(
                (item) => (item.section || "General Muslim Life") === section,
              )
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCategory(item);
                    push(`/islamic-lifestyle/${item.slug}`);
                  }}
                >
                  <i>{item.icon || "◆"}</i>
                  <strong>{item.title}</strong>
                  <p>{item.subtitle}</p>
                  <b>Read full guide →</b>
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
function LifestyleSection({
  title,
  rows,
  numbered = false,
  checked = false,
}: {
  title: string;
  rows?: string[];
  numbered?: boolean;
  checked?: boolean;
}) {
  if (!rows?.length) return null;
  return (
    <section>
      <h3>{title}</h3>
      {rows.map((row, index) => (
        <p className='lifestyle-row' key={row}>
          <i>{checked ? "✓" : numbered ? index + 1 : "•"}</i>
          <span>{row}</span>
        </p>
      ))}
    </section>
  );
}
const WEB_SAJDAH_AYAHS = new Set([
  "7:206",
  "13:15",
  "16:50",
  "17:109",
  "19:58",
  "22:18",
  "22:77",
  "25:60",
  "27:26",
  "32:15",
  "38:24",
  "41:38",
  "53:62",
  "84:21",
  "96:19",
]);
function groupAyahsByPage(ayahs: Ayah[]) {
  const pages = new Map<number, Ayah[]>();
  for (const ayah of ayahs) {
    const page = Math.max(1, Math.ceil(ayah.numberInSurah / 10));
    pages.set(page, [...(pages.get(page) || []), ayah]);
  }
  return [...pages.entries()];
}
function WebFullQuran({ language }: { language: string }) {
  const [juzs, setJuzs] = useState<
      Array<{ number: number; sections: Array<Surah & { ayahs: Ayah[] }> }>
    >([]),
    [nextJuz, setNextJuz] = useState(1),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const sentinel = useRef<HTMLDivElement | null>(null);
  const loadNext = async () => {
    if (busy || nextJuz > 30) return;
    const number = nextJuz;
    setBusy(true);
    setError("");
    try {
      const response = await json(
        `/api/quran/juz/${number}?language=${encodeURIComponent(language)}`,
      );
      setJuzs((current) =>
        current.some((item) => item.number === number)
          ? current
          : [...current, response.data],
      );
      setNextJuz(number + 1);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Unable to load Quran pages.",
      );
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    setJuzs([]);
    setNextJuz(1);
    setError("");
  }, [language]);
  useEffect(() => {
    if (nextJuz === 1 && !juzs.length && !busy) void loadNext();
  }, [nextJuz, juzs.length, busy]);
  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadNext();
      },
      { rootMargin: "500px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [nextJuz, busy]);
  return (
    <div className='web-mushaf'>
      <header>
        <small>FULL ARABIC MUSHAF</small>
        <h2>القرآن الكريم</h2>
        <p>Al-Fatihah to An-Nas · Arabic only · scroll to continue reading</p>
      </header>
      {juzs.map((juz) => (
        <section className='web-mushaf-juz' key={juz.number}>
          <div className='web-juz-divider'>
            <i />
            <b>
              JUZ {juz.number} · الجزء {juz.number}
            </b>
            <i />
          </div>
          {juz.sections.map((section) => (
            <article
              className='web-mushaf-surah'
              key={`${juz.number}-${section.number}`}
            >
              {section.number !== 1 &&
              section.number !== 9 &&
              section.ayahs[0]?.numberInSurah === 1 ? (
                <div className='web-bismillah' aria-label='Bismillah' />
              ) : null}
              <div className='web-mushaf-pages'>
                {groupAyahsByPage(section.ayahs).map(([page, pageAyahs]) => (
                  <section
                    className='web-mushaf-page'
                    key={`${section.number}-page-${page}`}
                  >
                    <header className='web-page-banner'>
                      <div className='web-page-orb'>
                        <small>Juz</small>
                        <b>{juz.number}</b>
                      </div>
                      <div className='web-page-surah'>
                        <strong dir='rtl'>{section.name}</strong>
                        <b>Surah {section.englishName}</b>
                        <small>PAGE {page} OF 604</small>
                      </div>
                      <div className='web-page-orb'>
                        <small>Page</small>
                        <b>{page}</b>
                      </div>
                    </header>
                    <div className='web-page-flow'>
                      <div className='web-page-crown'>— ❖ —</div>
                      {pageAyahs.map((ayah) => {
                        const sajdah = WEB_SAJDAH_AYAHS.has(
                          `${section.number}:${ayah.numberInSurah}`,
                        );
                        return (
                          <section
                            className='web-mushaf-ayah'
                            key={`${section.number}-${ayah.numberInSurah}`}
                          >
                            <span className='web-ayah-count'>
                              <i>{ayah.numberInSurah}</i>
                            </span>
                            <p dir='rtl'>
                              {ayah.text}
                              {sajdah ? <mark> ۩ SAJDAH</mark> : null}
                            </p>
                            <button
                              className='web-ayah-audio'
                              aria-label={`Play ayah ${ayah.numberInSurah}`}
                            >
                              ◖
                            </button>
                          </section>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </article>
          ))}
        </section>
      ))}
      <div className='web-mushaf-loader' ref={sentinel}>
        {busy ? (
          <span className='loader' />
        ) : error ? (
          <>
            <p>{error}</p>
            <button onClick={() => void loadNext()}>Try again</button>
          </>
        ) : nextJuz > 30 ? (
          <b>صَدَقَ اللَّهُ الْعَظِيمُ</b>
        ) : null}
      </div>
    </div>
  );
}
function Quran({
  tafsir,
  query,
  onQueryChange,
  language,
}: {
  tafsir: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  language: string;
}) {
  const [list, setList] = useState<Surah[]>([]),
    [selected, setSelected] = useState<Surah | null>(null),
    [selectedJuz, setSelectedJuz] = useState<{
      number: number;
      sections: Array<Surah & { ayahs: Ayah[] }>;
    } | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [browseMode, setBrowseMode] = useState<
      "quran" | "surah" | "juz" | "sajdah"
    >("quran");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    json("/api/quran/surahs?language=" + encodeURIComponent(language))
      .then((x) => {
        if (active) setList(x.data || []);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [language]);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    setLoading(true);
    setError("");
    json(
      "/api/quran/surahs/" +
        selected.number +
        "?language=" +
        encodeURIComponent(language),
    )
      .then((x) => {
        if (active) setSelected(x.data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [language]);
  const shown = useMemo(
    () =>
      list.filter((s) =>
        `${s.number} ${s.englishName} ${s.name} ${s.englishNameTranslation}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [list, query],
  );
  const surahSlug = (s: Surah) =>
    s.englishName
      .toLowerCase()
      .replace(/^surah\s+/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const open = async (s: Surah, push = true) => {
    setLoading(true);
    setError("");
    try {
      const x = await json(
        `/api/quran/surahs/${s.number}?language=${encodeURIComponent(language)}`,
      );
      setSelected(x.data);
      if (push) {
        const base = tafsir ? "tafsir" : "quran";
        window.history.pushState(
          {},
          "",
          `/${base}/${surahSlug(s)}/surah-${s.number}`,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load Surah");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!list.length) return;
    const base = tafsir ? "tafsir" : "quran";
    const sync = () => {
      const parts = window.location.pathname.split("/").filter(Boolean);
      if (parts[0] !== base) return;
      const requestedSurah = Number(new URLSearchParams(window.location.search).get("surah"));
      if (requestedSurah) {
        const match = list.find((item) => item.number === requestedSurah);
        if (match && selected?.number !== match.number) void open(match, false);
        return;
      }
      if (!parts[1]) {
        setSelected(null);
        return;
      }
      const number = Number((parts[2] || "").replace(/^surah-/, "")),
        match = list.find(
          (item) =>
            (number && item.number === number) || surahSlug(item) === parts[1],
        );
      if (match && selected?.number !== match.number) void open(match, false);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [list, tafsir, language]);
  useEffect(() => {
    if (!selected) return;
    const ayah = Number(new URLSearchParams(window.location.search).get("ayah"));
    if (!ayah) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`ayah-${selected.number}-${ayah}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [selected]);
  const closeSurah = () => {
    setSelected(null);
    window.history.pushState({}, "", tafsir ? "/tafsir" : "/quran");
  };
  const openJuz = async (number: number) => {
    setLoading(true);
    setError("");
    try {
      const response = await json(
        `/api/quran/juz/${number}?language=${encodeURIComponent(language)}`,
      );
      setSelectedJuz(response.data);
      window.history.pushState({}, "", `/quran/juz-${number}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load Juz");
    } finally {
      setLoading(false);
    }
  };
  if (selectedJuz)
    return (
      <div className='reader juz-reader'>
        <button
          className='section-back'
          onClick={() => {
            setSelectedJuz(null);
            window.history.pushState({}, "", "/quran");
          }}
        >
          ← All Juz
        </button>
        <div className='reader-title'>
          <span>{selectedJuz.number}</span>
          <div>
            <h2>Juz {selectedJuz.number}</h2>
            <p>{selectedJuz.sections.length} Surahs in this Juz</p>
          </div>
          <b>الجزء {selectedJuz.number}</b>
        </div>
        {selectedJuz.sections.map((section) => (
          <section className='juz-reader-section' key={section.number}>
            <header>
              <div>
                <strong>{section.englishName}</strong>
                <small>{section.englishNameTranslation}</small>
              </div>
              <b>{section.name}</b>
            </header>
            {section.ayahs.map((ayah) => (
              <article key={`${section.number}-${ayah.numberInSurah}`}>
                <span>
                  {section.number}:{ayah.numberInSurah}
                </span>
                <p dir='rtl'>{ayah.text}</p>
                {ayah.transliteration && <em>{ayah.transliteration}</em>}
                <strong>{ayah.translation}</strong>
                <div>
                  <button
                    onClick={() =>
                      bookmark(
                        `${section.englishName} ${ayah.numberInSurah}`,
                        "Quran",
                      )
                    }
                  >
                    ♡ Bookmark
                  </button>
                  <button
                    onClick={() =>
                      download(
                        `${section.englishName} ${ayah.numberInSurah}`,
                        ayah.text + "\n" + ayah.translation,
                      )
                    }
                  >
                    ⇩ Save offline
                  </button>
                </div>
              </article>
            ))}
          </section>
        ))}
      </div>
    );
  if (selected)
    return (
      <div className='reader'>
        <div className='reader-title'>
          <span>{selected.number}</span>
          <div>
            <h2>{selected.englishName}</h2>
            <p>
              {selected.englishNameTranslation} · {selected.numberOfAyahs} Ayahs
            </p>
          </div>
          <b>{selected.name}</b>
        </div>
        {selected.ayahs?.map((a) => (
          <article id={`ayah-${selected.number}-${a.numberInSurah}`} key={a.numberInSurah}>
            <span>
              {selected.number}:{a.numberInSurah}
            </span>
            <p dir='rtl'>{a.text}</p>
            {a.transliteration && <em>{a.transliteration}</em>}
            <strong>{a.translation}</strong>
            {tafsir && (
              <aside>
                <b>Tafsir note</b>
                <p>
                  Detailed verified Tafsir content for this Ayah will load from
                  the managed library when available.
                </p>
              </aside>
            )}
            <div>
              <button
                onClick={() =>
                  bookmark(
                    `${selected.englishName} ${a.numberInSurah}`,
                    "Quran",
                  )
                }
              >
                ♡ Bookmark
              </button>
              <button
                onClick={() =>
                  download(
                    `${selected.englishName} ${a.numberInSurah}`,
                    a.text + "\n" + a.translation,
                  )
                }
              >
                ⇩ Save offline
              </button>
            </div>
          </article>
        ))}
      </div>
    );
  const browseTabs = [
    { key: "quran", icon: "◉", label: "Quran" },
    { key: "surah", icon: "▤", label: "Surah" },
    { key: "juz", icon: "◈", label: "Juz" },
    { key: "sajdah", icon: "⌁", label: "Sajdah" },
  ] as const;
  const juzBoundaries = [
    ["1", "Al-Fatihah 1", "Al-Baqarah 141"],
    ["2", "Al-Baqarah 142", "Al-Baqarah 252"],
    ["3", "Al-Baqarah 253", "Ali Imran 92"],
    ["4", "Ali Imran 93", "An-Nisa 23"],
    ["5", "An-Nisa 24", "An-Nisa 147"],
    ["6", "An-Nisa 148", "Al-Ma’idah 81"],
    ["7", "Al-Ma’idah 82", "Al-An’am 110"],
    ["8", "Al-An’am 111", "Al-A’raf 87"],
    ["9", "Al-A’raf 88", "Al-Anfal 40"],
    ["10", "Al-Anfal 41", "At-Tawbah 92"],
    ["11", "At-Tawbah 93", "Hud 5"],
    ["12", "Hud 6", "Yusuf 52"],
    ["13", "Yusuf 53", "Ibrahim 52"],
    ["14", "Al-Hijr 1", "An-Nahl 128"],
    ["15", "Al-Isra 1", "Al-Kahf 74"],
    ["16", "Al-Kahf 75", "Taha 135"],
    ["17", "Al-Anbiya 1", "Al-Hajj 78"],
    ["18", "Al-Mu’minun 1", "Al-Furqan 20"],
    ["19", "Al-Furqan 21", "An-Naml 55"],
    ["20", "An-Naml 56", "Al-Ankabut 45"],
    ["21", "Al-Ankabut 46", "Al-Ahzab 30"],
    ["22", "Al-Ahzab 31", "Ya-Sin 27"],
    ["23", "Ya-Sin 28", "Az-Zumar 31"],
    ["24", "Az-Zumar 32", "Fussilat 46"],
    ["25", "Fussilat 47", "Al-Jathiyah 37"],
    ["26", "Al-Ahqaf 1", "Adh-Dhariyat 30"],
    ["27", "Adh-Dhariyat 31", "Al-Hadid 29"],
    ["28", "Al-Mujadilah 1", "At-Tahrim 12"],
    ["29", "Al-Mulk 1", "Al-Mursalat 50"],
    ["30", "An-Naba 1", "An-Nas 6"],
  ];
  const juzSurahCounts = [
    2, 1, 2, 2, 1, 2, 2, 2, 2, 2, 3, 2, 3, 2, 2, 3, 2, 3, 3, 3, 5, 4, 4, 3, 5,
    6, 7, 9, 11, 37,
  ];
  const sajdahSurahs = new Set([
    7, 13, 16, 17, 19, 22, 25, 27, 32, 38, 41, 53, 84, 96,
  ]);
  const modeRows =
    browseMode === "sajdah"
      ? shown.filter((s) => sajdahSurahs.has(s.number))
      : shown;
  const submitQuranSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) {
      setBrowseMode("quran");
      return;
    }
    setBrowseMode("surah");
    const exact = shown.find(
      (surah) =>
        String(surah.number) === value ||
        surah.englishName.toLowerCase() === value.toLowerCase() ||
        surah.name === value,
    );
    if (exact) void open(exact);
  };
  return (
    <>
      <Status loading={loading} error={error} />
      <nav className='quran-browse-tabs' aria-label='Browse Quran by'>
        {browseTabs.map((tab) => (
          <button
            type='button'
            key={tab.key}
            className={browseMode === tab.key ? "active" : ""}
            onClick={() => setBrowseMode(tab.key)}
            aria-pressed={browseMode === tab.key}
          >
            <i>{tab.icon}</i>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
      <form className='quran-inline-search' onSubmit={submitQuranSearch}>
        <span aria-hidden='true'>⌕</span>
        <input
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            if (event.target.value.trim()) setBrowseMode("surah");
          }}
          placeholder='Search Surah or Quran…'
          aria-label='Search Surah or Quran'
        />
        {query && (
          <button className='quran-search-clear' type='button' onClick={() => {onQueryChange("");setBrowseMode("quran")}} aria-label='Clear search'>
            ×
          </button>
        )}
        <button className='quran-search-submit' type='submit'>Search</button>
      </form>
      {browseMode === "quran" ? (
        <WebFullQuran language={language} />
      ) : browseMode === "juz" ? (
        <div className='juz-card-grid'>
          {juzBoundaries.map((item, index) => (
            <article
              className='web-juz-card'
              key={item[0]}
              onClick={() => void openJuz(Number(item[0]))}
            >
              <header>
                <i>{item[0]}</i>
                <div>
                  <div>
                    <strong>
                      Juz {item[0]} / Para {item[0]}
                    </strong>
                    <span>{juzSurahCounts[index]} Surahs</span>
                    <button
                      type='button'
                      aria-label={`Bookmark Juz ${item[0]}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        bookmark(`Juz ${item[0]}`, "Quran");
                      }}
                    >
                      ♡
                    </button>
                  </div>
                  <b>{item[1]}</b>
                  <small>to {item[2]}</small>
                </div>
              </header>
              <section>
                <span>Progress</span>
                <b>0%</b>
              </section>
              <em>
                <i />
              </em>
              <footer>
                <button
                  type='button'
                  onClick={(event) => {
                    event.stopPropagation();
                    void openJuz(Number(item[0]));
                  }}
                >
                  ▤ Read
                </button>
                <button
                  type='button'
                  onClick={(event) => {
                    event.stopPropagation();
                    void openJuz(Number(item[0]));
                  }}
                >
                  ◉ Listen
                </button>
                <button
                  type='button'
                  onClick={(event) => {
                    event.stopPropagation();
                    download(`Juz ${item[0]}`, `${item[1]} to ${item[2]}`);
                  }}
                >
                  ⇩ Download
                </button>
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <div className='surah-card-grid'>
          {modeRows.map((s) => (
            <article
              className='web-surah-card'
              key={s.number}
              onClick={() => void open(s)}
            >
              <header>
                <i>{s.number}</i>
                <div>
                  <div>
                    <strong>{s.englishName}</strong>
                    <span>{s.numberOfAyahs} Ayahs</span>
                    <button
                      type='button'
                      aria-label={`Bookmark ${s.englishName}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        bookmark(s.englishName, "Quran");
                      }}
                    >
                      ♡
                    </button>
                  </div>
                  <b dir='rtl'>{s.name}</b>
                  <small>
                    {browseMode === "sajdah"
                      ? "Contains a Sajdah verse"
                      : s.englishNameTranslation}
                  </small>
                </div>
              </header>
              <section>
                <span>Progress</span>
                <b>0%</b>
              </section>
              <em>
                <i />
              </em>
              <footer>
                <button
                  type='button'
                  onClick={(event) => {
                    event.stopPropagation();
                    void open(s);
                  }}
                >
                  ▤ Read
                </button>
                <button
                  type='button'
                  onClick={(event) => {
                    event.stopPropagation();
                    void open(s);
                  }}
                >
                  ◉ Listen
                </button>
                <button
                  type='button'
                  onClick={(event) => {
                    event.stopPropagation();
                    download(
                      s.englishName,
                      `${s.name}\n${s.englishNameTranslation}`,
                    );
                  }}
                >
                  ⇩ Download
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
function DuasAmol({ query, language }: { query: string; language: string }) {
  const initial = () => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    return parts[1] === "duas" ? "duas" : parts[1] === "amol" ? "amol" : "hub";
  };
  const [section, setSection] = useState<"hub" | "duas" | "amol">(initial);
  useEffect(() => {
    const sync = () => setSection(initial());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const open = (next: "hub" | "duas" | "amol") => {
    setSection(next);
    window.history.pushState(
      {},
      "",
      next === "hub" ? "/duas-amol" : "/duas-amol/" + next,
    );
  };
  if (section === "duas")
    return (
      <div className='duas-amol-section'>
        <button className='section-back' onClick={() => open("hub")}>
          ← Duas & Amol
        </button>
        <Duas query={query} language={language} />
      </div>
    );
  if (section === "amol")
    return (
      <div className='duas-amol-section'>
        <button className='section-back' onClick={() => open("hub")}>
          ← Duas & Amol
        </button>
        <AmolLibrary query={query} language={language} />
      </div>
    );
  return (
    <div className='duas-amol-hub'>
      <a className='sahaba-back' href='/'>
        <b>‹</b> Back to Home
      </a>
      <div className='duas-amol-hero'>
        <small>DAILY SPIRITUAL COMPANION</small>
        <h2>
          Remember Allah
          <br />
          every day
        </h2>
        <p>
          Build a peaceful routine through authentic duas and meaningful daily
          deeds from the same backend used by the app.
        </p>
        <div>
          <span>✓ Authentic sources</span>
          <span>✓ Daily guidance</span>
        </div>
      </div>
      <header>
        <div>
          <h2>Choose a path</h2>
          <p>Continue your spiritual journey</p>
        </div>
        <b>2 sections</b>
      </header>
      <div className='duas-amol-choices'>
        <button onClick={() => open("duas")}>
          <i>🤲</i>
          <span>
            <small>SUPPLICATIONS</small>
            <strong>Duas</strong>
            <p>
              Arabic, pronunciation, meaning and trusted sources, using the
              complete App Dua library.
            </p>
            <b>Open Duas →</b>
          </span>
        </button>
        <button onClick={() => open("amol")}>
          <i>✦</i>
          <span>
            <small>DAILY GOOD DEEDS</small>
            <strong>Amol</strong>
            <p>
              Sunnah practices, worship and beneficial deeds with step-by-step
              guidance.
            </p>
            <b>Open Amol →</b>
          </span>
        </button>
      </div>
    </div>
  );
}
function AmolLibrary({ query, language }: { query: string; language: string }) {
  const [rows, setRows] = useState<AmolBook[]>([]),
    [selected, setSelected] = useState<AmolBook | null>(null),
    [selectedPart, setSelectedPart] = useState<number | null>(null),
    [localQuery, setLocalQuery] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    json(
      "/api/books?language=" +
        encodeURIComponent(language) +
        "&refresh=" +
        Date.now(),
    )
      .then((x) => {
        if (active)
          setRows(
            (Array.isArray(x.data) ? x.data : []).filter(
              (item: AmolBook) => item.category === "Amol",
            ),
          );
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [language]);
  const shown = useMemo(
    () =>
      rows.filter((item) =>
        (
          item.title +
          " " +
          (item.author || "") +
          " " +
          (item.description || "")
        )
          .toLowerCase()
          .includes((localQuery || query).trim().toLowerCase()),
      ),
    [rows, query, localQuery],
  );
  const open = async (item: AmolBook) => {
    setLoading(true);
    setError("");
    try {
      const x = await json(
        "/api/books/" +
          encodeURIComponent(item.slug) +
          "?language=" +
          encodeURIComponent(language) +
          "&refresh=" +
          Date.now(),
      );
      setSelected(x.data);
      setSelectedPart(null);
      window.history.pushState({}, "", "/duas-amol/amol/" + item.slug);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to open Amol");
    } finally {
      setLoading(false);
    }
  };
  if (selected) {
    const parts = selected.pages?.length
      ? selected.pages.map((page) => ({
          title: page.title || "",
          reference: page.reference || "",
          content: page.markdown || page.text || "",
        }))
      : [{ title: "", reference: "", content: selected.content || "" }];
    if (selectedPart === null) {
      return (
        <div className='amol-reader amol-overview'>
          <button
            className='section-back'
            onClick={() => {
              setSelected(null);
              window.history.pushState({}, "", "/duas-amol/amol");
            }}
          >
            ← All Amol
          </button>
          <header className='amol-profile'>
            <i>✦</i>
            <h2>{selected.title}</h2>
            <p>{selected.description || "Authentic daily deeds and beneficial guidance."}</p>
            <small>{parts.length} {parts.length === 1 ? "PART" : "PARTS"}</small>
          </header>
          <div className='amol-parts'>
            {parts.map((part, index) => {
              const clean = part.content
                .replace(/<[^>]+>/g, " ")
                .replace(/^#{1,6}\s+/gm, "")
                .replace(/[\*_>`-]/g, "")
                .replace(/\s+/g, " ")
                .trim();
              const sectionHeading = part.content.match(/^#{2,6}\s+(.+)$/m)?.[1]?.trim();
              const partTitle = part.title || sectionHeading || (parts.length === 1 ? selected.title : `${selected.title} · Part ${index + 1}`);
              const preview = clean
                .replace(new RegExp(`^${selected.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i"), "")
                .trim();
              return (
                <button key={index} onClick={() => setSelectedPart(index)}>
                  <span>PART {index + 1}</span>
                  <h3>{partTitle}</h3>
                  <p>{preview || selected.description || "Open this part to read the complete guidance."}</p>
                  <aside>
                    <small>AUTHENTIC AMOL GUIDE</small>
                    <b>{part.reference || selected.sourceUrl || selected.author || "DeenIslam Editorial"}</b>
                  </aside>
                  <footer>Read full guide <b>›</b></footer>
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    const activePage = parts[selectedPart]?.content || "";
    return (
      <div className='amol-reader'>
        <button
          className='section-back'
          onClick={() => setSelectedPart(null)}
        >
          ← All parts
        </button>
        <article>
          <header className='amol-reader-head'>
            <div className='amol-reader-mark'>✦</div>
            <div>
              <small>{selected.category || "AMOL"} · DAILY GUIDANCE</small>
              <h2>{selected.title}</h2>
              <b>{selected.author || "DeenIslam Editorial"}</b>
            </div>
          </header>
          {selected.description && (
            <p className='amol-reader-intro'>{selected.description}</p>
          )}
          <div className='amol-reader-content'>
              <section>
                <span>PART {selectedPart + 1} OF {parts.length}</span>
                {activePage
                  .split(/\n{2,}/)
                  .filter(Boolean)
                  .map((paragraph, n) => (
                    <p key={n}>{paragraph.replace(/^#{1,6}\s+/, "")}</p>
                  ))}
              </section>
          </div>
        </article>
      </div>
    );
  }
  return (
    <div className='amol-app'>
      <div className='amol-heading'>
        <i>✦</i>
        <div>
          <h2>Amol</h2>
          <p>Daily deeds and authentic guidance</p>
        </div>
        <span>{rows.length}</span>
      </div>
      <label className='amol-search'>
        <b>⌕</b>
        <input
          value={localQuery}
          onChange={(event) => setLocalQuery(event.target.value)}
          placeholder='Search Amol...'
        />
        <button
          type='button'
          aria-label='Clear search'
          className={localQuery ? "show" : ""}
          onClick={() => setLocalQuery("")}
        >
          ×
        </button>
      </label>
      <Status loading={loading} error={error} />
      <div className='amol-list'>
        {shown.map((item, index) => (
          <button
            key={item.slug || item.id || index}
            onClick={() => void open(item)}
          >
            <div className='amol-row'>
              <i>{String(index + 1).padStart(2, "0")}</i>
              <div>
                <h3>{item.title}</h3>
                <b>{item.author || "DeenIslam Editorial"}</b>
                <p>{item.description || "Open to read the complete Amol and guidance."}</p>
              </div>
              <span>›</span>
            </div>
          </button>
        ))}
      </div>
      {!loading && !error && !shown.length ? (
        <div className='empty-state'>
          <h2>No Amol found</h2>
          <p>Try searching with another word.</p>
        </div>
      ) : null}
    </div>
  );
}
function Duas({ query, language }: { query: string; language: string }) {
  const [rows, setRows] = useState<Dua[]>([]),
    [localQuery, setLocalQuery] = useState(""),
    [selectedCategory, setSelectedCategory] = useState<string | null>(null),
    [selected, setSelected] = useState<Dua | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    json(
      "/api/duas/admin-content?language=" +
        encodeURIComponent(language) +
        "&refresh=" +
        Date.now(),
    )
      .then((x) => {
        if (active) setRows(Array.isArray(x.data) ? x.data : []);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [language]);
  const shown = useMemo(() => {
    const value = (localQuery || query).trim().toLowerCase();
    return rows.filter((item) => {
      const category = !item.category || item.category === "General" || item.category === "App collection" ? "Dua & Azkar" : item.category;
      return (!selectedCategory || category === selectedCategory) && (!value ||
          (
            item.name +
            " " +
            item.meaning +
            " " +
            item.pronunciation +
            " " +
            item.source
          )
            .toLowerCase()
            .includes(value));
    });
  }, [rows, query, localQuery, selectedCategory]);
  const categories = useMemo(() => {
    const values = new Map<string, number>();
    rows.forEach((item) => {
      const category = !item.category || item.category === "General" || item.category === "App collection" ? "Dua & Azkar" : item.category;
      values.set(category, (values.get(category) || 0) + 1);
    });
    return [...values.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);
  if (selected)
    return (
      <div className='dua-reader'>
        <button className='section-back' onClick={() => setSelected(null)}>← All Duas</button>
        <article className='dua-full-card'>
          <small>DUA</small><h2>{selected.name}</h2>
          <p className='dua-full-arabic' dir='rtl'>{selected.arabic}</p>
          {selected.pronunciation && <em>{selected.pronunciation}</em>}
          <hr /><span>MEANING</span><p className='dua-full-meaning'>{selected.meaning}</p>
          {selected.source && <aside><small>AUTHENTIC SOURCE</small><b>{selected.source}</b></aside>}
          <footer><button onClick={() => bookmark(selected.name, "Dua & Azkar")}>♡ Bookmark</button><button onClick={() => navigator.clipboard?.writeText(`${selected.arabic}\n${selected.pronunciation || ""}\n${selected.meaning}`)}>Copy</button></footer>
        </article>
      </div>
    );
  if (!selectedCategory) {
    const categoryRows = categories.filter(([name]) => name.toLowerCase().includes(localQuery.toLowerCase()));
    return <div className='dua-app'>
      <div className='dua-category-hero'><i>🤲</i><div><small>DUA LIBRARY</small><h2>Find the right Dua</h2><p>Browse authentic supplications by category and stay connected with Allah.</p></div></div>
      <label className='amol-search'><b>⌕</b><input value={localQuery} onChange={(event) => setLocalQuery(event.target.value)} placeholder='Search categories...' /><button type='button' aria-label='Clear search' className={localQuery ? "show" : ""} onClick={() => setLocalQuery("")}>×</button></label>
      <div className='dua-category-title'><div><h3>Categories</h3><p>Choose a collection to continue</p></div><b>{categoryRows.length}</b></div>
      <div className='dua-categories'>{categoryRows.map(([name, count], index) => <button key={name} onClick={() => {setSelectedCategory(name);setLocalQuery("")}}><i>{index % 3 === 0 ? "🤲" : index % 3 === 1 ? "✦" : "☾"}</i><div><h3>{name}</h3><b>{count} {count === 1 ? "Dua" : "Duas"}</b><p>Arabic, pronunciation and meaning</p></div><span>›</span></button>)}</div>
    </div>;
  }
  return (
    <div className='dua-app'>
      <div className='dua-heading'>
        <button type='button' onClick={() => {setSelectedCategory(null);setLocalQuery("")}}>‹</button><div><h2>{selectedCategory}</h2><p>Supplications and authentic remembrance</p></div><span>{shown.length}</span>
      </div>
      <label className='amol-search'>
        <b>⌕</b><input value={localQuery} onChange={(event) => setLocalQuery(event.target.value)} placeholder='Search Duas...' />
        <button type='button' aria-label='Clear search' className={localQuery ? "show" : ""} onClick={() => setLocalQuery("")}>×</button>
      </label>
      <Status loading={loading} error={error} />
      <div className='dua-list'>
        {shown.map((item, index) => (
          <button
            key={item.id || item.key || item.name + "-" + index}
            onClick={() => setSelected(item)}
          >
            <i>{String(index + 1).padStart(2, "0")}</i>
            <div><h3>{item.name}</h3><b dir='rtl'>{item.arabic}</b><p>{item.meaning}</p></div><span>›</span>
          </button>
        ))}
      </div>
      {!loading && !error && !shown.length ? (
        <div className='empty-state'>
          <b>🤲</b>
          <h2>No matching Dua found</h2>
          <p>Try another name, meaning or source.</p>
        </div>
      ) : null}
    </div>
  );
}
function Hadith({ query }: { query: string }) {
  const rows = hadiths.filter((h) =>
    (h.title + h.text + h.source).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className='content-grid'>
      {rows.map((h, i) => (
        <article className='content-card' key={h.source}>
          <span>HADITH {i + 1}</span>
          <h2>{h.title}</h2>
          <p>{h.text}</p>
          <b>{h.source}</b>
          <footer>
            <button onClick={() => bookmark(h.title, "Hadith")}>
              ♡ Bookmark
            </button>
            <button onClick={() => navigator.clipboard?.writeText(h.text)}>
              Copy
            </button>
          </footer>
        </article>
      ))}
    </div>
  );
}
function Prayer({ tracker }: { tracker: boolean }) {
  const fallback = {
    Fajr: "04:37",
    Sunrise: "05:53",
    Dhuhr: "11:46",
    Asr: "15:09",
    Maghrib: "17:40",
    Isha: "18:55",
  };
  const [times, setTimes] = useState<Record<string, string>>(fallback),
    [place, setPlace] = useState("Dhaka, Bangladesh"),
    [zone, setZone] = useState("Asia/Dhaka"),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [method, setMethod] = useState(1),
    [settingsOpen, setSettingsOpen] = useState(false),
    [now, setNow] = useState(new Date()),
    [alarms, setAlarms] = useState<Record<string, boolean>>({
      Fajr: true,
      Dhuhr: true,
      Asr: true,
      Maghrib: true,
      Isha: true,
    }),
    [prayed, setPrayed] = useState<Record<string, boolean>>({});
  const names = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"],
    clean = (value: string) => String(value || "").split(" ")[0],
    format = (value: string) => {
      const [h, m] = clean(value).split(":").map(Number);
      if (!Number.isFinite(h)) return "--:--";
      return new Date(2000, 0, 1, h, m).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    },
    dateStamp = () => {
      const d = new Date();
      return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
    };
  const applyTimes = (body: any, label: string) => {
    const value = body?.data?.timings;
    if (!value) throw new Error();
    setTimes(
      Object.fromEntries(
        Object.entries(value).map(([key, time]) => [key, clean(String(time))]),
      ),
    );
    setZone(
      body?.data?.meta?.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
    setPlace(label);
  };
  const loadDhaka = () => {
    setLoading(true);
    setError("");
    fetch(
      `https://api.aladhan.com/v1/timingsByCity/${dateStamp()}?city=Dhaka&country=Bangladesh&method=${method}`,
    )
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((body) => applyTimes(body, "Dhaka, Bangladesh"))
      .catch(() =>
        setError(
          "Live prayer times are unavailable. Showing saved Dhaka times.",
        ),
      )
      .finally(() => setLoading(false));
  };
  const locate = () => {
    if (
      !window.confirm(
        "Use current location? Your coordinates will be shared with Aladhan only to calculate local prayer times.",
      )
    )
      return;
    setLoading(true);
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetch(
          `https://api.aladhan.com/v1/timings/${dateStamp()}?latitude=${latitude}&longitude=${longitude}&method=${method}`,
        )
          .then((response) =>
            response.ok ? response.json() : Promise.reject(),
          )
          .then((body) => applyTimes(body, "Your current location"))
          .catch(() => setError("Local prayer times could not be updated."))
          .finally(() => setLoading(false));
      },
      () => {
        setError(
          "Location permission was not granted. Showing Dhaka prayer times.",
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 900000 },
    );
  };
  useEffect(() => {
    loadDhaka();
  }, [method]);
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const prayerDate = (value: string, addDay = false) => {
      const [h, m] = clean(value).split(":").map(Number),
        date = new Date(now);
      date.setHours(h, m, 0, 0);
      if (addDay) date.setDate(date.getDate() + 1);
      return date;
    },
    upcoming = names
      .map((name) => ({ name, date: prayerDate(times[name]) }))
      .find((item) => item.date > now) || {
      name: "Fajr",
      date: prayerDate(times.Fajr, true),
    },
    currentIndex = Math.max(0, names.indexOf(upcoming.name));
  const duration = (ms: number) => {
      const seconds = Math.max(0, Math.floor(ms / 1000)),
        h = Math.floor(seconds / 3600),
        m = Math.floor((seconds % 3600) / 60),
        s = seconds % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    },
    endTime = (index: number) => {
      const next =
          index < names.length - 1 ? times[names[index + 1]] : times.Fajr,
        [h, m] = clean(next).split(":").map(Number),
        date = new Date(2000, 0, 1, h, m - 1);
      return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    };
  const gregorian = new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(now),
    hijri = (() => {
      try {
        return new Intl.DateTimeFormat("en-GB-u-ca-islamic", {
          timeZone: zone,
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(now);
      } catch {
        return "";
      }
    })();
  return (
    <div className='prayer-app'>
      <header className='prayer-date'>
        <button onClick={locate} disabled={loading}>
          ⌖
        </button>
        <div>
          <b>{place}</b>
          <h2>{gregorian}</h2>
          <span>{hijri}</span>
        </div>
        <button onClick={() => setSettingsOpen(true)}>⚙</button>
      </header>
      {error && <p className='prayer-notice'>{error}</p>}
      <section className='prayer-hero'>
        <div className='prayer-pattern'>✦　·　✦　·　✦　·　✦</div>
        <header>
          <div>
            <small>NEXT PRAYER</small>
            <h2>{upcoming.name}</h2>
          </div>
          <button
            className={names.every((name) => alarms[name]) ? "" : "off"}
            aria-label='Toggle all prayer alarms'
            onClick={() =>
              setAlarms((value) =>
                Object.fromEntries(
                  names.map((name) => [
                    name,
                    !names.every((key) => value[key]),
                  ]),
                ),
              )
            }
          >
            <DeenIcon name='Notifications' size={19} />
          </button>
        </header>
        <strong>{loading ? "Updating…" : format(times[upcoming.name])}</strong>
        <p>
          Starts in <b>{duration(upcoming.date.getTime() - now.getTime())}</b>
        </p>
        <div className='prayer-timeline'>
          <i />
          <i className='filled' style={{ width: `${currentIndex * 20}%` }} />
          {names.map((name, index) => (
            <span
              className={
                index === currentIndex
                  ? "active"
                  : index < currentIndex
                    ? "done"
                    : ""
              }
              key={name}
            >
              <b>
                {index < currentIndex ? (
                  "✓"
                ) : (
                  <DeenIcon
                    name={name}
                    size={index === currentIndex ? 23 : 19}
                  />
                )}
              </b>
              <small>{name}</small>
            </span>
          ))}
        </div>
      </section>
      <section className='prayer-list'>
        {names.map((name, index) => {
          const active = name === upcoming.name;
          return (
            <article className={active ? "active" : ""} key={name}>
              {active && <i className='active-bar' />}
              <span className='prayer-icon'>
                <DeenIcon name={name} size={21} />
              </span>
              <div>
                <h3>{name}</h3>
                <section>
                  <span>
                    <small>START</small>
                    <b>{format(times[name])}</b>
                  </span>
                  <i>→</i>
                  <span>
                    <small>END</small>
                    <b>{endTime(index)}</b>
                  </span>
                </section>
                {tracker && (
                  <label>
                    <input
                      type='checkbox'
                      checked={!!prayed[name]}
                      onChange={(event) =>
                        setPrayed((value) => ({
                          ...value,
                          [name]: event.target.checked,
                        }))
                      }
                    />{" "}
                    Mark as prayed
                  </label>
                )}
              </div>
              <button
                className={alarms[name] ? "alarm-on" : "alarm-off"}
                aria-label={`${name} alarm ${alarms[name] ? "on" : "off"}`}
                onClick={() =>
                  setAlarms((value) => ({ ...value, [name]: !value[name] }))
                }
              >
                <DeenIcon name='Notifications' size={20} />
              </button>
            </article>
          );
        })}
      </section>
      <aside className='prayer-restricted'>
        <i>◒</i>
        <div>
          <b>Voluntary prayer restricted</b>
          <span>After completing Asr until sunset</span>
        </div>
        <section>
          <small>SUNSET</small>
          <b>{format(times.Maghrib)}</b>
        </section>
      </aside>
      <h3 className='prayer-additional-title'>Additional Times</h3>
      <article className='prayer-sunrise'>
        <i>☀</i>
        <div>
          <b>Sunrise</b>
          <span>Sunrise time for your current location</span>
        </div>
        <strong>{format(times.Sunrise)}</strong>
      </article>
      {settingsOpen && (
        <div className='prayer-modal'>
          <section>
            <header>
              <div>
                <small>PRAYER SETTINGS</small>
                <h3>Calculation Method</h3>
              </div>
              <button onClick={() => setSettingsOpen(false)}>×</button>
            </header>
            {(
              [
                [1, "University of Islamic Sciences, Karachi"],
                [2, "Islamic Society of North America"],
                [3, "Muslim World League"],
              ] as const
            ).map(([value, label]) => (
              <button
                className={method === value ? "active" : ""}
                key={value}
                onClick={() => {
                  setMethod(value);
                  setSettingsOpen(false);
                }}
              >
                <span>{label}</span>
                {method === value && <b>✓</b>}
              </button>
            ))}
            <button
              className='prayer-close'
              onClick={() => setSettingsOpen(false)}
            >
              Close
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
type WebDailyTask = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  instruction?: string;
  rewardPoints: number;
  target?: number;
  progress?: number;
  status: "pending" | "inProgress" | "completed";
};
type WebDailyPrayer = {
  id: string;
  name: string;
  time: string;
  status: "completed" | "current" | "upcoming";
};
const dailyFallbackTasks: WebDailyTask[] = [
  {
    id: "dua",
    type: "dua",
    title: "Today's Dua",
    subtitle: "Rabbi zidni ilma",
    instruction: "Read 3 times",
    rewardPoints: 10,
    status: "pending",
  },
  {
    id: "dhikr",
    type: "dhikr",
    title: "Today's Dhikr",
    subtitle: "SubhanAllahi wa bihamdihi",
    rewardPoints: 20,
    status: "inProgress",
    progress: 35,
    target: 100,
  },
  {
    id: "quran",
    type: "quran",
    title: "Quran Reading",
    subtitle: "Surah Al-Mulk · Ayah 1–15",
    rewardPoints: 30,
    status: "pending",
  },
  {
    id: "lesson",
    type: "lesson",
    title: "Learn Something New",
    subtitle: "Read a short Islamic lesson",
    rewardPoints: 10,
    status: "pending",
  },
  {
    id: "goodDeed",
    type: "goodDeed",
    title: "Do a Good Deed",
    subtitle: "Help someone today",
    rewardPoints: 15,
    status: "pending",
  },
  {
    id: "reflection",
    type: "reflection",
    title: "Daily Reflection",
    subtitle: "Write a short reflection",
    rewardPoints: 10,
    status: "pending",
  },
];
const dailyFallbackPrayers: WebDailyPrayer[] = [
  "Fajr",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
].map((name, index) => ({
  id: name.toLowerCase(),
  name,
  time: ["5:12 AM", "12:28 PM", "3:52 PM", "6:47 PM", "8:14 PM"][index],
  status: index === 0 ? "current" : "upcoming",
}));
function DailyTasks() {
  const today = new Date().toISOString().slice(0, 10),
    storage = `deenislam_daily_tasks_${today}`,
    [tasks, setTasks] = useState<WebDailyTask[]>(dailyFallbackTasks),
    [prayers, setPrayers] = useState<WebDailyPrayer[]>(dailyFallbackPrayers),
    [focus, setFocus] = useState(
      "Small sincere deeds bring us closer to Allah.",
    ),
    [filter, setFilter] = useState<"all" | "pending" | "completed">("all"),
    [activeTask, setActiveTask] = useState<WebDailyTask | null>(null),
    [reflection, setReflection] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let saved: any = {};
    try {
      saved = JSON.parse(localStorage.getItem(storage) || "{}");
      if (saved.tasks) setTasks(saved.tasks);
      if (saved.prayers) setPrayers(saved.prayers);
      if (saved.focus) setFocus(saved.focus);
    } catch {}
    json(`/api/daily-prayer/today?date=${today}`)
      .then((body) => {
        const plan = body.data;
        if (!plan?.tasks?.length) return;
        const oldTasks = new Map(
            (saved.tasks || []).map((item: WebDailyTask) => [item.id, item]),
          ),
          oldPrayers = new Map(
            (saved.prayers || []).map((item: WebDailyPrayer) => [
              item.id,
              item,
            ]),
          );
        setTasks(
          plan.tasks.map((item: any, index: number) => {
            const id = String(item.id || `task-${index}`),
              old = oldTasks.get(id) as WebDailyTask | undefined;
            return {
              id,
              type: String(item.type || "goodDeed"),
              title: String(item.title || "Daily task"),
              subtitle: String(item.subtitle || ""),
              instruction: item.instruction
                ? String(item.instruction)
                : undefined,
              rewardPoints: Number(item.rewardPoints) || 0,
              target: item.target ? Number(item.target) : undefined,
              progress: old?.progress ?? (item.target ? 0 : undefined),
              status: old?.status || "pending",
            };
          }),
        );
        if (plan.prayers?.length)
          setPrayers(
            plan.prayers.map((item: any, index: number) => {
              const id = String(item.id || item.name || index).toLowerCase(),
                old = oldPrayers.get(id) as WebDailyPrayer | undefined;
              return {
                id,
                name: String(item.name || dailyFallbackPrayers[index]?.name),
                time: String(item.time || dailyFallbackPrayers[index]?.time),
                status: old?.status || item.status || "upcoming",
              };
            }),
          );
        setFocus(String(plan.focusText || focus));
      })
      .catch((reason) =>
        setError(reason.message || "Today's plan could not be loaded."),
      )
      .finally(() => setLoading(false));
    return () => {};
  }, []);
  useEffect(() => {
    if (!loading)
      localStorage.setItem(storage, JSON.stringify({ tasks, prayers, focus }));
  }, [tasks, prayers, focus, loading, storage]);
  const completeTask = (task: WebDailyTask) => {
    if (task.type === "dhikr") {
      setActiveTask(task);
      return;
    }
    setTasks((rows) =>
      rows.map((item) =>
        item.id === task.id
          ? {
              ...item,
              status: item.status === "completed" ? "pending" : "completed",
              progress: item.status === "completed" ? 0 : item.target,
            }
          : item,
      ),
    );
  };
  const prayerClick = (index: number) =>
    setPrayers((rows) =>
      rows.map((item, i) => ({
        ...item,
        status:
          i <= index ? "completed" : i === index + 1 ? "current" : "upcoming",
      })),
    );
  const completedTasks = tasks.filter((item) => item.status === "completed"),
    completedPrayers = prayers.filter(
      (item) => item.status === "completed",
    ).length,
    completed = Math.min(8, completedTasks.length + completedPrayers),
    points = completedTasks.reduce((sum, item) => sum + item.rewardPoints, 0),
    visible = tasks.filter(
      (item) =>
        filter === "all" ||
        (filter === "completed"
          ? item.status === "completed"
          : item.status !== "completed"),
    ),
    percent = Math.round((completed / 8) * 100);
  const incrementTargetedDhikr = (task: WebDailyTask) =>
    setTasks((rows) =>
      rows.map((item) => {
        if (item.id !== task.id) return item;
        const progress = Math.min(item.target || 100, (item.progress || 0) + 1);
        return {
          ...item,
          progress,
          status: progress >= (item.target || 100) ? "completed" : "inProgress",
        };
      }),
    );
  if (activeTask?.type === "dhikr") {
    const task = tasks.find((item) => item.id === activeTask.id) || activeTask,
      target = task.target || 100,
      count = task.progress || 0,
      progress = Math.min(100, (count / target) * 100);
    return (
      <section className='daily-target-tasbih'>
        <button onClick={() => setActiveTask(null)}>
          ← Back to Daily Tasks
        </button>
        <header>
          <small>TODAY'S TARGETED TASBIH</small>
          <h2>{task.subtitle || task.title}</h2>
          <p dir='rtl'>سُبْحَانَ اللَّهِ وَبِحَمْدِهِ</p>
          <span>Target: {target}</span>
        </header>
        <button
          className='daily-target-counter'
          onClick={() => incrementTargetedDhikr(task)}
        >
          <i
            style={{
              background: `conic-gradient(#efc963 ${progress * 3.6}deg,#dcebe3 0)`,
            }}
          />
          <strong>{count}</strong>
          <span>of {target}</span>
          <small>TAP TO COUNT</small>
        </button>
        <footer>
          <button
            onClick={() =>
              setTasks((rows) =>
                rows.map((item) =>
                  item.id === task.id
                    ? {
                        ...item,
                        progress: Math.max(0, (item.progress || 0) - 1),
                        status: "inProgress",
                      }
                    : item,
                ),
              )
            }
          >
            − Undo
          </button>
          <b>{Math.round(progress)}% complete</b>
          <button
            onClick={() =>
              window.confirm("Reset this Dhikr count?") &&
              setTasks((rows) =>
                rows.map((item) =>
                  item.id === task.id
                    ? { ...item, progress: 0, status: "pending" }
                    : item,
                ),
              )
            }
          >
            ↻ Reset
          </button>
        </footer>
      </section>
    );
  }
  if (activeTask) {
    const task = tasks.find((item) => item.id === activeTask.id) || activeTask,
      detail =
        task.type === "dua"
          ? {
              eyebrow: "TODAY'S DUA",
              arabic: "رَبِّ زِدْنِي عِلْمًا",
              text: "My Lord, increase me in knowledge.",
              note:
                task.instruction ||
                "Read this dua three times with attention and sincerity.",
            }
          : task.type === "quran"
            ? {
                eyebrow: "QURAN READING",
                arabic: "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ",
                text: task.subtitle,
                note: "Read today's selected verses slowly and reflect on their message.",
              }
            : task.type === "lesson"
              ? {
                  eyebrow: "DAILY LESSON",
                  arabic: "طَلَبُ الْعِلْمِ عِبَادَةٌ",
                  text: "Seeking beneficial knowledge is an act of worship.",
                  note: "Learn one beneficial lesson today and try to apply it in your character.",
                }
              : task.type === "goodDeed"
                ? {
                    eyebrow: "GOOD DEED",
                    arabic: "وَأَحْسِنُوا",
                    text: "Indeed, Allah loves those who do good.",
                    note: "Help someone, give quietly, or make another person's day easier.",
                  }
                : {
                    eyebrow: "DAILY REFLECTION",
                    arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ",
                    text: "Remember Me; I will remember you.",
                    note: "Pause for a moment and write what you are grateful for today.",
                  };
    return (
      <section className='daily-detail'>
        <button
          className='daily-detail-back'
          onClick={() => setActiveTask(null)}
        >
          ← Back to Daily Tasks
        </button>
        <header>
          <small>{detail.eyebrow}</small>
          <h2>{task.title}</h2>
          <p>{task.subtitle}</p>
        </header>
        <article>
          <span dir='rtl'>{detail.arabic}</span>
          <h3>{detail.text}</h3>
          <p>{detail.note}</p>
          {task.type === "reflection" && (
            <textarea
              value={reflection}
              onChange={(event) => setReflection(event.target.value)}
              placeholder='Write your reflection here…'
            />
          )}
          {task.type === "quran" && (
            <div className='daily-reading-actions'>
              <button>▻ Read</button>
              <button>♬ Listen</button>
              <button>⇩ Save</button>
            </div>
          )}
          <footer>
            <b>★ +{task.rewardPoints} points</b>
            <button
              onClick={() => {
                completeTask(task);
                setActiveTask(null);
              }}
            >
              {task.status === "completed"
                ? "Mark as pending"
                : "Complete task"}
            </button>
          </footer>
        </article>
      </section>
    );
  }
  return (
    <div className='daily-reference-web'>
      {error && (
        <p className='daily-notice'>{error} Showing your saved plan.</p>
      )}
      <section className='daily-reference-hero'>
        <a className='daily-reference-back' href='/'>
          <b>‹</b> Back to Home
        </a>
        <div className='daily-greeting'>
          <h2>Assalamu Alaikum</h2>
          <p>May Allah make today easy for you 💚</p>
          <time>
            <DeenIcon name='Islamic Calendar' size={22} />
            <span>
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              <b>
                {new Intl.DateTimeFormat("en-GB-u-ca-islamic", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(new Date())}
              </b>
            </span>
          </time>
        </div>
        <div className='daily-hero-actions'>
          <button aria-label='Notifications'>
            <DeenIcon name='Notifications' size={22} />
          </button>
          <button aria-label='Profile'>●</button>
        </div>
        <blockquote>
          “And whoever remembers Allah,
          <br />
          indeed, the heart finds rest.”<small>— Surah Ar-Ra’d (13:28)</small>
        </blockquote>
      </section>
      <section className='daily-reference-progress'>
        <div className='daily-reference-main'>
          <i>◎</i>
          <div>
            <header>
              <h3>Today’s Progress</h3>
              <b>{completed} of 8 completed</b>
            </header>
            <section>
              <span style={{ width: `${percent}%` }} />
              <b>{percent}%</b>
            </section>
            <p>🌱 Keep going! A better you is closer</p>
          </div>
        </div>
        <aside>
          “Small steps
          <br />
          every day
          <br />
          make a big
          <br />
          difference.”<span>🌿</span>
        </aside>
      </section>
      <section className='daily-reference-stats'>
        <article>
          <i>🔥</i>
          <b>7</b>
          <span>Day Streak</span>
        </article>
        <article>
          <i>⭐</i>
          <b>{points}</b>
          <span>Total Points</span>
        </article>
        <article>
          <i>▥</i>
          <b>Level 2</b>
          <span>Seeker of Deen</span>
        </article>
        <article>
          <i>📖</i>
          <b>3</b>
          <span>Quran Days</span>
        </article>
      </section>
      <header className='daily-reference-heading'>
        <h3>Today’s Tasks</h3>
        <nav>
          {(["all", "pending", "completed"] as const).map((value, index) => (
            <button
              className={filter === value ? "active" : ""}
              onClick={() => setFilter(value)}
              key={value}
            >
              {index === 0 ? "Today" : index === 1 ? "This Week" : "All"}
            </button>
          ))}
        </nav>
        <button aria-label='Task list'>☷</button>
      </header>
      <button
        className='daily-reference-prayer'
        onClick={() => prayerClick(Math.min(4, completedPrayers))}
      >
        <i>
          <DeenIcon name='Five Daily Prayers' size={42} />
        </i>
        <section>
          <header>
            <h4>5 Daily Prayers</h4>
            <b>{completedPrayers}/5　›</b>
          </header>
          <p>Complete all 5 daily salah</p>
          <div>
            {prayers.map((item) => (
              <span
                key={item.id}
                className={item.status === "completed" ? "done" : ""}
              >
                {item.status === "completed" ? "✓" : "○"} {item.name}
              </span>
            ))}
          </div>
        </section>
      </button>
      <section className='daily-reference-tasks'>
        {visible.map((task) => {
          const icon =
            task.type === "quran"
              ? "Quran"
              : task.type === "dua"
                ? "Duas & Amol"
                : task.type === "lesson"
                  ? "Knowledge"
                  : task.type === "dhikr"
                    ? "Tasbih"
                    : "Daily Tasks";
          return (
            <button
              className={`daily-reference-task ${task.type}`}
              onClick={() =>
                task.type === "dhikr" ? completeTask(task) : setActiveTask(task)
              }
              key={task.id}
            >
              <i>
                <DeenIcon name={icon} size={34} />
              </i>
              <section>
                <h4>{task.title}</h4>
                <p>{task.subtitle}</p>
                {task.target ? (
                  <small>Target: {task.target} times</small>
                ) : null}
              </section>
              <b className={task.status === "completed" ? "done" : ""}>
                {task.status === "completed" ? "Done" : "Not done"}
              </b>
              <span>›</span>
            </button>
          );
        })}
        {!visible.length && (
          <p className='daily-empty'>No tasks in this filter.</p>
        )}
      </section>
      <section className='daily-reference-motivation'>
        <strong>
          Every good deed
          <br />
          is a step closer
          <br />
          to Allah
        </strong>
        <button>Keep Going　›</button>
      </section>
    </div>
  );
}
function Qibla() {
  const [bearing, setBearing] = useState<number | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        const lat = (p.coords.latitude * Math.PI) / 180,
          lon = (p.coords.longitude * Math.PI) / 180,
          kLat = (21.4225 * Math.PI) / 180,
          kLon = (39.8262 * Math.PI) / 180,
          y = Math.sin(kLon - lon) * Math.cos(kLat),
          x =
            Math.cos(lat) * Math.sin(kLat) -
            Math.sin(lat) * Math.cos(kLat) * Math.cos(kLon - lon);
        setBearing(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
      },
      () => setError("Allow location access to calculate Qibla."),
    );
  }, []);
  return (
    <div className='qibla'>
      <div className='compass'>
        <span style={{ transform: `rotate(${bearing || 0}deg)` }}>↑</span>
        <b>KAABA</b>
      </div>
      <h2>
        {bearing === null
          ? "Calculating…"
          : `${bearing.toFixed(1)}° from North`}
      </h2>
      <p>Face the arrow direction toward the Kaaba in Makkah.</p>
      {error && <p className='error'>{error}</p>}
    </div>
  );
}
type WebTasbih = {
  id: string;
  label: string;
  arabic: string;
  meaning: string;
  target: number;
  custom?: boolean;
};
type WebTasbihHistory = {
  id: string;
  label: string;
  count: number;
  target: number;
  date: string;
};
const tasbihPresets: WebTasbih[] = [
  {
    id: "subhanallah",
    label: "SubhanAllah",
    arabic: "سُبْحَانَ اللَّهِ",
    meaning: "Glory be to Allah",
    target: 33,
  },
  {
    id: "alhamdulillah",
    label: "Alhamdulillah",
    arabic: "الْحَمْدُ لِلَّهِ",
    meaning: "All praise is for Allah",
    target: 33,
  },
  {
    id: "allahu-akbar",
    label: "Allahu Akbar",
    arabic: "اللَّهُ أَكْبَرُ",
    meaning: "Allah is the Greatest",
    target: 34,
  },
  {
    id: "la-ilaha-illallah",
    label: "La ilaha illAllah",
    arabic: "لَا إِلَهَ إِلَّا اللَّهُ",
    meaning: "There is no god but Allah",
    target: 100,
  },
];
function Tasbih() {
  const [tab, setTab] = useState<"all" | "mine" | "history">("all"),
    [mineFilter, setMineFilter] = useState<"all" | "favorites" | "custom">(
      "all",
    ),
    [selectedId, setSelectedId] = useState("subhanallah"),
    [counts, setCounts] = useState<Record<string, number>>({}),
    [custom, setCustom] = useState<WebTasbih[]>([]),
    [favorites, setFavorites] = useState<string[]>([]),
    [history, setHistory] = useState<WebTasbihHistory[]>([]),
    [settings, setSettings] = useState(false),
    [adding, setAdding] = useState(false),
    [editingId, setEditingId] = useState<string | null>(null),
    [vibrate, setVibrate] = useState(true),
    [sound, setSound] = useState(false),
    [ready, setReady] = useState(false);
  const [name, setName] = useState(""),
    [arabic, setArabic] = useState(""),
    [meaning, setMeaning] = useState(""),
    [newTarget, setNewTarget] = useState(33);
  const items = [
      ...tasbihPresets.map(
        (item) => custom.find((saved) => saved.id === item.id) || item,
      ),
      ...custom.filter(
        (item) => !tasbihPresets.some((preset) => preset.id === item.id),
      ),
    ],
    selected = items.find((item) => item.id === selectedId) || items[0],
    count = counts[selected.id] || 0,
    progress = Math.min(100, Math.round((count / selected.target) * 100)),
    total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("deenislam_web_tasbih_v2") || "{}",
      );
      setCounts(
        saved.counts || {
          subhanallah: Number(localStorage.getItem("deenislam_tasbih") || 0),
        },
      );
      setCustom(saved.custom || []);
      setFavorites(
        saved.favorites ?? ["subhanallah", "alhamdulillah", "allahu-akbar"],
      );
      setHistory(saved.history || []);
      setSelectedId(saved.selectedId || "subhanallah");
      setVibrate(saved.vibrate !== false);
      setSound(saved.sound === true);
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      localStorage.setItem(
        "deenislam_web_tasbih_v2",
        JSON.stringify({
          counts,
          custom,
          favorites,
          history,
          selectedId,
          vibrate,
          sound,
        }),
      );
  }, [counts, custom, favorites, history, selectedId, vibrate, sound, ready]);
  const addCount = () => {
    const next = count + 1;
    setCounts((value) => ({ ...value, [selected.id]: next }));
    const today = new Date().toISOString().slice(0, 10);
    setHistory((rows) => {
      const old = rows.find((row) => row.id === selected.id + today);
      return old
        ? rows.map((row) => (row.id === old.id ? { ...row, count: next } : row))
        : [
            {
              id: selected.id + today,
              label: selected.label,
              count: next,
              target: selected.target,
              date: today,
            },
            ...rows,
          ];
    });
    if (vibrate && navigator.vibrate)
      navigator.vibrate(next % selected.target === 0 ? [35, 40, 80] : 12);
    if (sound && next % selected.target === 0 && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(
        new SpeechSynthesisUtterance("Target completed"),
      );
    }
  };
  const reset = () => {
    if (!count || window.confirm(`Reset ${selected.label} counter?`))
      setCounts((value) => ({ ...value, [selected.id]: 0 }));
  };
  const openAdd = () => {
    setEditingId(null);
    setName("");
    setArabic("");
    setMeaning("");
    setNewTarget(33);
    setAdding(true);
  };
  const openEdit = (item: WebTasbih) => {
    setEditingId(item.id);
    setName(item.label);
    setArabic(item.arabic);
    setMeaning(item.meaning);
    setNewTarget(item.target);
    setAdding(true);
  };
  const createTasbih = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    const updated = {
      id: editingId || `custom-${Date.now()}`,
      label: name.trim(),
      arabic: arabic.trim() || "ذِكْر",
      meaning: meaning.trim() || "My personal Tasbih",
      target: Math.max(1, newTarget),
      custom: true,
    };
    if (editingId) {
      const preset = tasbihPresets.some((item) => item.id === editingId);
      setCustom((value) =>
        preset
          ? [updated, ...value.filter((item) => item.id !== editingId)]
          : value.map((item) => (item.id === editingId ? updated : item)),
      );
    } else {
      setCustom((value) => [updated, ...value]);
      setSelectedId(updated.id);
      setTab("mine");
    }
    setAdding(false);
    setEditingId(null);
  };
  const removeCustom = (id: string) => {
    if (!window.confirm("Delete this custom Tasbih?")) return;
    setCustom((value) => value.filter((item) => item.id !== id));
    setFavorites((value) => value.filter((itemId) => itemId !== id));
    setCounts((value) => {
      const next = { ...value };
      delete next[id];
      return next;
    });
    if (selectedId === id) setSelectedId("subhanallah");
    setAdding(false);
    setEditingId(null);
  };
  const visible =
    tab !== "mine"
      ? items
      : items.filter(
          (item) =>
            mineFilter === "all" ||
            (mineFilter === "favorites" && favorites.includes(item.id)) ||
            (mineFilter === "custom" && item.custom),
        );
  return (
    <div className='tasbih-app'>
      <section className='tasbih-hero'>
        <header>
          <div>
            <small>DIGITAL DHIKR</small>
            <h2>Tasbih</h2>
            <p>Remember Allah, one count at a time</p>
          </div>
          <div className='tasbih-hero-actions'>
            <span>
              <b>{total}</b>
              <small>Total today</small>
            </span>
            <button
              onClick={() => setSettings(true)}
              aria-label='Tasbih settings'
            >
              ⚙
            </button>
          </div>
        </header>
        <div className='tasbih-active'>
          <small>CURRENT TASBIH</small>
          <p dir='rtl'>{selected.arabic}</p>
          <h3>{selected.label}</h3>
          <span>{selected.meaning}</span>
        </div>
        <button
          className='tasbih-counter'
          onClick={addCount}
          aria-label='Tap to count'
        >
          <i
            style={{
              background: `conic-gradient(#efc963 ${progress * 3.6}deg,rgba(255,255,255,.14) 0)`,
            }}
          />
          <strong>{count}</strong>
          <span>of {selected.target}</span>
          <small>TAP TO COUNT</small>
        </button>
        <div className='tasbih-progress'>
          <span style={{ width: `${progress}%` }} />
          <b>{progress}% complete</b>
        </div>
        <nav>
          <button
            onClick={() =>
              setCounts((value) => ({
                ...value,
                [selected.id]: Math.max(0, count - 1),
              }))
            }
            disabled={!count}
          >
            −<small>Undo</small>
          </button>
          <button onClick={reset}>
            ↻<small>Reset</small>
          </button>
          <button
            onClick={() => document.documentElement.requestFullscreen?.()}
          >
            ⛶<small>Focus</small>
          </button>
        </nav>
      </section>
      <nav className='tasbih-tabs'>
        <button
          className={tab === "all" ? "active" : ""}
          onClick={() => setTab("all")}
        >
          All Tasbih
        </button>
        <button
          className={tab === "mine" ? "active" : ""}
          onClick={() => setTab("mine")}
        >
          My Tasbih
        </button>
        <button
          className={tab === "history" ? "active" : ""}
          onClick={() => setTab("history")}
        >
          History
        </button>
      </nav>
      {tab === "history" ? (
        <TasbihHistoryPanel
          rows={history}
          items={items}
          total={total}
          onClear={() => setHistory([])}
          onDelete={(id) =>
            setHistory((value) => value.filter((row) => row.id !== id))
          }
          onOpen={(id) => {
            setSelectedId(id);
            setTab("all");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      ) : (
        <section className='tasbih-library'>
          {tab === "mine" && (
            <>
              <div className='tasbih-mine-stats'>
                <article>
                  <i>▦</i>
                  <b>{items.length}</b>
                  <span>Total Tasbih</span>
                </article>
                <article>
                  <i>✓</i>
                  <b>
                    {
                      items.filter(
                        (item) => (counts[item.id] || 0) >= item.target,
                      ).length
                    }
                  </b>
                  <span>Completed Today</span>
                </article>
                <article>
                  <i>★</i>
                  <b>{favorites.length}</b>
                  <span>Favorites</span>
                </article>
              </div>
              <article className='tasbih-continue'>
                <header>
                  <small>CONTINUE TASBIH</small>
                  <button onClick={() => setTab("all")}>View All →</button>
                </header>
                <div>
                  <span dir='rtl'>{selected.arabic}</span>
                  <section>
                    <h4>{selected.label}</h4>
                    <p>{selected.meaning}</p>
                    <small>Target: {selected.target}</small>
                  </section>
                  <strong>
                    {count}
                    <small> / {selected.target}</small>
                  </strong>
                </div>
                <footer>
                  <i>
                    <span style={{ width: `${progress}%` }} />
                  </i>
                  <button
                    onClick={() => {
                      setTab("all");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Continue →
                  </button>
                </footer>
              </article>
            </>
          )}
          <header>
            <div>
              <small>
                {tab === "mine" ? "MY TASBIH LIST" : "CHOOSE A TASBIH"}
              </small>
              <h3>{tab === "mine" ? "My Collection" : "Dhikr Collection"}</h3>
            </div>
            <button onClick={openAdd}>＋ Add Tasbih</button>
          </header>
          {tab === "mine" && (
            <nav className='tasbih-mine-filters'>
              {(["all", "favorites", "custom"] as const).map((filter) => (
                <button
                  key={filter}
                  className={mineFilter === filter ? "active" : ""}
                  onClick={() => setMineFilter(filter)}
                >
                  {filter === "favorites"
                    ? "★ "
                    : filter === "custom"
                      ? "✎ "
                      : ""}
                  {filter[0].toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </nav>
          )}
          <div className='tasbih-grid'>
            {visible.map((item) => {
              const value = counts[item.id] || 0,
                percent = Math.min(100, (value / item.target) * 100);
              return (
                <article
                  className={selected.id === item.id ? "selected" : ""}
                  key={item.id}
                >
                  <div className='tasbih-card-actions'>
                    <button
                      onClick={() => openEdit(item)}
                      aria-label={`Edit ${item.label}`}
                    >
                      ✎ <span>Edit</span>
                    </button>
                    <button
                      className='tasbih-favorite'
                      onClick={() =>
                        setFavorites((rows) =>
                          rows.includes(item.id)
                            ? rows.filter((id) => id !== item.id)
                            : [...rows, item.id],
                        )
                      }
                      aria-label='Favourite'
                    >
                      {favorites.includes(item.id) ? "★" : "☆"}
                    </button>
                  </div>
                  <p dir='rtl'>{item.arabic}</p>
                  <h4>{item.label}</h4>
                  <span>{item.meaning}</span>
                  <div>
                    <i style={{ width: `${percent}%` }} />
                  </div>
                  <footer>
                    <small>
                      {value} / {item.target}
                    </small>
                    <button
                      onClick={() => {
                        setSelectedId(item.id);
                        setTab("all");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      {selected.id === item.id ? "Selected" : "Start counting"}{" "}
                      →
                    </button>
                  </footer>
                </article>
              );
            })}
          </div>
          {!visible.length && (
            <div className='tasbih-empty'>
              <b>♡</b>
              <h3>No Tasbih found</h3>
              <p>Change the filter, favourite a Tasbih, or create your own.</p>
            </div>
          )}
        </section>
      )}
      {settings && (
        <div className='tasbih-modal' role='dialog'>
          <section>
            <header>
              <div>
                <small>TASBIH PREFERENCES</small>
                <h3>Counter Settings</h3>
              </div>
              <button onClick={() => setSettings(false)}>×</button>
            </header>
            <label>
              <span>
                <b>Vibration</b>
                <small>Gentle feedback on every count</small>
              </span>
              <input
                type='checkbox'
                checked={vibrate}
                onChange={(event) => setVibrate(event.target.checked)}
              />
            </label>
            <label>
              <span>
                <b>Completion sound</b>
                <small>Notify when the target is reached</small>
              </span>
              <input
                type='checkbox'
                checked={sound}
                onChange={(event) => setSound(event.target.checked)}
              />
            </label>
            <button className='tasbih-done' onClick={() => setSettings(false)}>
              Save settings
            </button>
          </section>
        </div>
      )}
      {adding && (
        <div className='tasbih-modal' role='dialog'>
          <form onSubmit={createTasbih}>
            <header>
              <div>
                <small>{editingId ? "UPDATE DHIKR" : "PERSONAL DHIKR"}</small>
                <h3>{editingId ? "Edit Tasbih" : "Create Tasbih"}</h3>
              </div>
              <button
                type='button'
                onClick={() => {
                  setAdding(false);
                  setEditingId(null);
                }}
              >
                ×
              </button>
            </header>
            <label>
              <span>Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder='e.g. Astaghfirullah'
                autoFocus
              />
            </label>
            <label>
              <span>Arabic</span>
              <input
                value={arabic}
                onChange={(event) => setArabic(event.target.value)}
                placeholder='اَسْتَغْفِرُ اللّٰهَ'
                dir='rtl'
              />
            </label>
            <label>
              <span>Meaning</span>
              <input
                value={meaning}
                onChange={(event) => setMeaning(event.target.value)}
                placeholder='I seek forgiveness from Allah'
              />
            </label>
            <label>
              <span>Target</span>
              <input
                type='number'
                min='1'
                value={newTarget}
                onChange={(event) => setNewTarget(Number(event.target.value))}
              />
            </label>
            <div className='tasbih-form-actions'>
              {editingId?.startsWith("custom-") && (
                <button
                  type='button'
                  className='tasbih-delete'
                  onClick={() => removeCustom(editingId)}
                >
                  Delete
                </button>
              )}
              <button className='tasbih-done' type='submit'>
                {editingId ? "Save changes" : "Create Tasbih"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
function TasbihHistoryPanel({
  rows,
  items,
  total,
  onClear,
  onDelete,
  onOpen,
}: {
  rows: WebTasbihHistory[];
  items: WebTasbih[];
  total: number;
  onClear: () => void;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const [days, setDays] = useState<1 | 7 | 30>(1),
    today = new Date().toISOString().slice(0, 10),
    now = Date.now();
  const filtered = rows
    .filter((row) =>
      days === 1
        ? row.date === today
        : new Date(row.date + "T00:00:00").getTime() >= now - days * 86400000,
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const todayTotal = rows
      .filter((row) => row.date === today)
      .reduce((sum, row) => sum + row.count, 0),
    weekTotal = rows
      .filter(
        (row) =>
          new Date(row.date + "T00:00:00").getTime() >= now - 7 * 86400000,
      )
      .reduce((sum, row) => sum + row.count, 0),
    last = [...rows].sort((a, b) => b.date.localeCompare(a.date))[0],
    lastItem = last && items.find((item) => item.id === last.id.slice(0, -10));
  return (
    <section className='tasbih-history tasbih-history-app'>
      <header>
        <div>
          <small>YOUR JOURNEY</small>
          <h3>Tasbih History</h3>
        </div>
        {rows.length > 0 && (
          <button
            onClick={() =>
              window.confirm("Clear all Tasbih history?") && onClear()
            }
          >
            Clear history
          </button>
        )}
      </header>
      <div className='tasbih-history-stats'>
        <article>
          <i>☀</i>
          <b>{todayTotal}</b>
          <span>Today</span>
        </article>
        <article>
          <i>▣</i>
          <b>{weekTotal}</b>
          <span>This Week</span>
        </article>
        <article>
          <i>♛</i>
          <b>{total}</b>
          <span>Total Completed</span>
        </article>
      </div>
      {last && (
        <article className='tasbih-last-activity'>
          <small>LAST ACTIVITY</small>
          <div>
            <span dir='rtl'>{lastItem?.arabic || "ذِكْر"}</span>
            <section>
              <h4>{last.label}</h4>
              <p>{lastItem?.meaning || "Dhikr remembrance"}</p>
              <b>{last.count} counted</b>
              <small>
                {new Date(last.date + "T00:00:00").toLocaleDateString(
                  undefined,
                  { month: "short", day: "numeric", year: "numeric" },
                )}
              </small>
            </section>
            <button onClick={() => onOpen(last.id.slice(0, -10))}>
              Continue →
            </button>
          </div>
        </article>
      )}
      <section className='tasbih-history-list'>
        <nav>
          {([1, 7, 30] as const).map((value) => (
            <button
              className={days === value ? "active" : ""}
              key={value}
              onClick={() => setDays(value)}
            >
              {value === 1 ? "Today" : `${value} Days`}
            </button>
          ))}
        </nav>
        <header>
          <b>
            {days === 1
              ? new Date().toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : `Last ${days} days`}
          </b>
          <span>
            Total: {filtered.reduce((sum, row) => sum + row.count, 0)}
          </span>
        </header>
        {filtered.length ? (
          filtered.map((row) => {
            const item = items.find(
                (entry) => entry.id === row.id.slice(0, -10),
              ),
              done = row.count >= row.target;
            return (
              <article key={row.id}>
                <button
                  className='tasbih-history-arabic'
                  onClick={() => onOpen(row.id.slice(0, -10))}
                  dir='rtl'
                >
                  {item?.arabic || row.label.slice(0, 2)}
                </button>
                <div>
                  <b>{row.label}</b>
                  <small>{item?.meaning || "Dhikr remembrance"}</small>
                </div>
                <section>
                  <b>
                    {row.count} <small>counted</small>
                  </b>
                  <small>
                    {new Date(row.date + "T00:00:00").toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric" },
                    )}
                  </small>
                </section>
                <span className={done ? "done" : "progress"}>
                  {done ? "Completed" : "In Progress"}
                </span>
                <button
                  className='tasbih-history-delete'
                  onClick={() =>
                    window.confirm("Remove this history item?") &&
                    onDelete(row.id)
                  }
                >
                  ⋮
                </button>
              </article>
            );
          })
        ) : (
          <div className='tasbih-empty'>
            <b>◌</b>
            <h3>No counting activity</h3>
            <p>Your Tasbih activity for this period will appear here.</p>
          </div>
        )}
      </section>
    </section>
  );
}
type ZakatField =
  | "cash"
  | "gold"
  | "silver"
  | "business"
  | "investments"
  | "receivables"
  | "debts";
const zakatFields: Array<{
  key: ZakatField;
  icon: string;
  label: string;
  hint: string;
}> = [
  {
    key: "cash",
    icon: "৳",
    label: "Cash & Bank",
    hint: "Cash, savings and bank balance",
  },
  {
    key: "gold",
    icon: "●",
    label: "Gold Value",
    hint: "Current value of zakatable gold",
  },
  {
    key: "silver",
    icon: "○",
    label: "Silver Value",
    hint: "Current value of zakatable silver",
  },
  {
    key: "business",
    icon: "◇",
    label: "Business Assets",
    hint: "Stock, cash and receivables",
  },
  {
    key: "investments",
    icon: "↗",
    label: "Investments",
    hint: "Zakatable shares and investments",
  },
  {
    key: "receivables",
    icon: "+",
    label: "Money Owed to You",
    hint: "Recoverable personal loans",
  },
  {
    key: "debts",
    icon: "−",
    label: "Immediate Debts",
    hint: "Short-term liabilities to deduct",
  },
];
const zakatNumber = (value: string) => Number(value.replace(/,/g, "")) || 0;
const zakatMoney = (value: number) =>
  new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(value);
function Zakat() {
  const empty: Record<ZakatField, string> = {
    cash: "",
    gold: "",
    silver: "",
    business: "",
    investments: "",
    receivables: "",
    debts: "",
  };
  const [values, setValues] = useState<Record<ZakatField, string>>(empty),
    [nisab, setNisab] = useState<"gold" | "silver">("silver");
  const [goldPrice, setGoldPrice] = useState(""),
    [silverPrice, setSilverPrice] = useState(""),
    [showAdd, setShowAdd] = useState(false);
  const [assetName, setAssetName] = useState(""),
    [assetValue, setAssetValue] = useState(""),
    [custom, setCustom] = useState<
      Array<{ id: number; name: string; value: string }>
    >([]);
  const result = useMemo(() => {
    const extra = custom.reduce(
        (sum, item) => sum + zakatNumber(item.value),
        0,
      ),
      assets = zakatFields
        .filter((item) => item.key !== "debts")
        .reduce((sum, item) => sum + zakatNumber(values[item.key]), extra),
      net = Math.max(0, assets - zakatNumber(values.debts)),
      threshold =
        (nisab === "gold" ? 87.48 : 612.36) *
        zakatNumber(nisab === "gold" ? goldPrice : silverPrice),
      due = net > 0 && (threshold === 0 || net >= threshold) ? net * 0.025 : 0;
    return { assets, net, threshold, due };
  }, [custom, goldPrice, nisab, silverPrice, values]);
  const reset = () => {
    setValues({ ...empty });
    setGoldPrice("");
    setSilverPrice("");
    setCustom([]);
  };
  const add = () => {
    if (!assetName.trim()) return;
    setCustom((items) => [
      ...items,
      { id: Date.now(), name: assetName.trim(), value: assetValue },
    ]);
    setAssetName("");
    setAssetValue("");
    setShowAdd(false);
  };
  return (
    <div className='zakat-app'>
      <div className='zakat-title'>
        <div>
          <small>ZAKAT CALCULATOR</small>
          <h2>Calculate your annual Zakat</h2>
        </div>
        <button onClick={reset} aria-label='Reset calculator'>
          ↻ <span>Reset</span>
        </button>
      </div>
      <section className='zakat-hero'>
        <small>ESTIMATED ZAKAT DUE</small>
        <strong>৳ {zakatMoney(result.due)}</strong>
        <p>
          {result.threshold === 0 && result.net > 0
            ? "Live 2.5% estimate · Enter metal price to verify Nisab"
            : result.due > 0
              ? "2.5% of your net zakatable wealth"
              : result.threshold === 0
                ? "Enter your assets to calculate Zakat"
                : "Your wealth is currently below the selected Nisab"}
        </p>
      </section>
      <div className='zakat-layout'>
        <main>
          <h3>Choose Nisab Standard</h3>
          <div className='zakat-toggle'>
            <button
              className={nisab === "silver" ? "active" : ""}
              onClick={() => setNisab("silver")}
            >
              <b>Silver</b>
              <span>612.36 grams</span>
            </button>
            <button
              className={nisab === "gold" ? "active" : ""}
              onClick={() => setNisab("gold")}
            >
              <b>Gold</b>
              <span>87.48 grams</span>
            </button>
          </div>
          <div className='zakat-price'>
            <label>Current {nisab} price per gram</label>
            <div>
              <b>৳</b>
              <input
                type='number'
                min='0'
                value={nisab === "gold" ? goldPrice : silverPrice}
                onChange={(e) =>
                  (nisab === "gold" ? setGoldPrice : setSilverPrice)(
                    e.target.value,
                  )
                }
                placeholder="Enter today's price"
              />
            </div>
            <small>Nisab value: ৳ {zakatMoney(result.threshold)}</small>
          </div>
          <h3>Zakatable Wealth</h3>
          <div className='zakat-fields'>
            {zakatFields.map((item) => (
              <label
                key={item.key}
                className={item.key === "debts" ? "debt" : ""}
              >
                <i>{item.icon}</i>
                <span>
                  <b>{item.label}</b>
                  <small>{item.hint}</small>
                </span>
                <div>
                  <em>৳</em>
                  <input
                    type='number'
                    min='0'
                    value={values[item.key]}
                    onChange={(e) =>
                      setValues((current) => ({
                        ...current,
                        [item.key]: e.target.value,
                      }))
                    }
                    placeholder='0'
                  />
                </div>
              </label>
            ))}
            {custom.map((item) => (
              <article key={item.id}>
                <i>+</i>
                <span>
                  <b>{item.name}</b>
                  <small>Other zakatable asset</small>
                </span>
                <div>
                  <b>৳ {zakatMoney(zakatNumber(item.value))}</b>
                  <button
                    onClick={() =>
                      setCustom((rows) =>
                        rows.filter((row) => row.id !== item.id),
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
          {showAdd ? (
            <div className='zakat-add-form'>
              <label>
                Asset name
                <input
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder='e.g. Property income, crypto'
                />
              </label>
              <label>
                Current value
                <div>
                  <b>৳</b>
                  <input
                    type='number'
                    min='0'
                    value={assetValue}
                    onChange={(e) => setAssetValue(e.target.value)}
                    placeholder='0'
                  />
                </div>
              </label>
              <footer>
                <button onClick={() => setShowAdd(false)}>Cancel</button>
                <button disabled={!assetName.trim()} onClick={add}>
                  Add Asset
                </button>
              </footer>
            </div>
          ) : (
            <button className='zakat-add' onClick={() => setShowAdd(true)}>
              <i>+</i>
              <span>
                <b>Add Other Asset</b>
                <small>Add any other zakatable wealth</small>
              </span>
            </button>
          )}
        </main>
        <aside>
          <h3>Your Zakat Summary</h3>
          <div>
            <span>Total assets</span>
            <b>৳ {zakatMoney(result.assets)}</b>
          </div>
          <div>
            <span>Immediate debts</span>
            <b>− ৳ {zakatMoney(zakatNumber(values.debts))}</b>
          </div>
          <div>
            <span>After immediate debts</span>
            <b>৳ {zakatMoney(result.net)}</b>
          </div>
          <hr />
          <div className='due'>
            <span>
              Zakat payable <small>2.5%</small>
            </span>
            <b>৳ {zakatMoney(result.due)}</b>
          </div>
          <p>
            <i>ⓘ</i> This is an estimate. Zakat rules can vary by asset and
            scholarly opinion. Confirm complex cases with a qualified scholar.
          </p>
        </aside>
      </div>
    </div>
  );
}
type AIMessage = { role: "assistant" | "user"; text: string; source?: string };
function AI({ language }: { language: string }) {
  const welcome: AIMessage = {
    role: "assistant",
    text: "Assalamu Alaikum. I’m your Islamic learning companion. Ask an Islamic question and I’ll show the source whenever one is available.",
    source: "Source-based answers",
  };
  const [msg, setMsg] = useState(""),
    [rows, setRows] = useState<AIMessage[]>([welcome]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [historyOpen, setHistoryOpen] = useState(false),
    [saved, setSaved] = useState<AIMessage[][]>([]),
    [aiCredits, setAiCredits] = useState<number | null>(null),
    [creditPopup, setCreditPopup] = useState(false);
  useEffect(() => {
    try {
      setSaved(
        JSON.parse(localStorage.getItem("deen-ai-web-history-v1") || "[]"),
      );
    } catch {}
  }, []);
  useEffect(() => {
    json("/api/rewards/admob/progress")
      .then((result) => {
        const credits = Number(result.data?.aiSearchCreditsRemaining) || 0;
        setAiCredits(credits);
        if (credits <= 0) setCreditPopup(true);
      })
      .catch(() => {
        setAiCredits(0);
        setCreditPopup(true);
      });
  }, []);
  const submit = async (value: string) => {
    const question = value.trim();
    if (!question || busy) return;
    if ((aiCredits ?? 0) <= 0) {
      setCreditPopup(true);
      return;
    }
    const next: AIMessage[] = [...rows, { role: "user", text: question }];
    setRows(next);
    setMsg("");
    setBusy(true);
    setError("");
    try {
      const x = await json("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: next
            .slice(-12)
            .map((m) => ({ role: m.role, content: m.text })),
          language,
        }),
      });
      const credits = Number(x.data?.usage?.remaining) || 0;
      setAiCredits(credits);
      const answer: AIMessage = {
        role: "assistant",
        text: x.data?.text || "No answer returned.",
        source:
          x.data?.source ||
          x.data?.sources?.join?.(" · ") ||
          "Quran & authentic Hadith references",
      };
      const completed = [...next, answer];
      setRows(completed);
      const history = [completed, ...saved].slice(0, 25);
      setSaved(history);
      localStorage.setItem("deen-ai-web-history-v1", JSON.stringify(history));
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI unavailable");
    } finally {
      setBusy(false);
    }
  };
  const send = (e: FormEvent) => {
    e.preventDefault();
    void submit(msg);
  };
  const reset = () => {
    setRows([welcome]);
    setMsg("");
    setError("");
    setHistoryOpen(false);
  };
  const listen = () => {
    const w = window as typeof window & {
        SpeechRecognition?: new () => any;
        webkitSpeechRecognition?: new () => any;
      },
      Engine = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Engine) {
      setError("Voice input is not supported in this browser.");
      return;
    }
    const recognition = new Engine();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const text = event.results?.[0]?.[0]?.transcript;
      if (text) setMsg(String(text));
    };
    recognition.onerror = () =>
      setError("Voice input could not start. Check microphone permission.");
    recognition.start();
  };
  return (
    <div className='islamic-ai-page'>
      <section className='ai-app-hero'>
        <button
          type='button'
          className='ai-round'
          onClick={() => history.back()}
          aria-label='Back'
        >
          ‹
        </button>
        <div>
          <h2>
            Islamic AI <i>✦</i>
          </h2>
          <p>Ask Quran &amp; Sunnah based questions</p>
          <span className='ai-credit-pill'>
            {aiCredits === null
              ? "Checking credits…"
              : `${aiCredits} AI Credit${aiCredits === 1 ? "" : "s"} left`}
          </span>
          <span className='ai-mosque' />
        </div>
        <button
          type='button'
          className='ai-round'
          onClick={() => setHistoryOpen(!historyOpen)}
          aria-label='Chat history'
        >
          ↶
        </button>
      </section>
      {historyOpen && (
        <aside className='ai-history'>
          <header>
            <h3>Chat history</h3>
            <button onClick={reset}>＋ New chat</button>
          </header>
          {saved.length ? (
            saved.map((chat, i) => (
              <button
                key={i}
                onClick={() => {
                  setRows(chat);
                  setHistoryOpen(false);
                }}
              >
                <b>
                  {chat.find((x) => x.role === "user")?.text ||
                    "Islamic AI chat"}
                </b>
                <small>{chat.length} messages</small>
              </button>
            ))
          ) : (
            <p>No saved chats yet.</p>
          )}
        </aside>
      )}
      <main className='ai-conversation'>
        {rows.map((row, i) =>
          row.role === "user" ? (
            <div className='ai-user-row' key={i}>
              <article>
                {row.text}
                <small>
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  　✓✓
                </small>
              </article>
            </div>
          ) : (
            <article className='ai-answer-card' key={i}>
              <header>
                <span>✦</span>
                <b>Islamic AI</b>
              </header>
              <div className='ai-answer-text'>
                {row.text
                  .split("\n")
                  .filter(Boolean)
                  .map((line, n) => (
                    <p key={n}>{line}</p>
                  ))}
              </div>
              {row.source && (
                <footer>
                  <div>
                    <strong>Sources:</strong>
                    <em>▤ Quran</em>
                    <em>◈ Hadith</em>
                  </div>
                  <nav>
                    <button
                      title='Copy'
                      onClick={() => navigator.clipboard?.writeText(row.text)}
                    >
                      ▣
                    </button>
                    <button
                      title='Bookmark'
                      onClick={() =>
                        bookmark(row.text.slice(0, 55), "Islamic AI")
                      }
                    >
                      ♡
                    </button>
                    <button
                      title='Share'
                      onClick={() => navigator.share?.({ text: row.text })}
                    >
                      ⌯
                    </button>
                  </nav>
                  <small>{row.source}</small>
                </footer>
              )}
            </article>
          ),
        )}
        {busy && (
          <div className='ai-thinking'>
            <i />
            <i />
            <i /> Researching trusted sources…
          </div>
        )}
        {error && <p className='error'>{error}</p>}
      </main>
      <form className='ai-composer' onSubmit={send}>
        <button
          type='button'
          className='ai-attach'
          onClick={reset}
          aria-label='New chat'
        >
          ＋
        </button>
        <input
          disabled={busy || (aiCredits ?? 0) <= 0}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder={
            (aiCredits ?? 0) > 0
              ? "Ask your Islamic question…"
              : "No AI Credit available"
          }
          maxLength={800}
        />
        <button
          type='button'
          className='ai-mic'
          aria-label='Voice input'
          onClick={listen}
        >
          ●
        </button>
        <button
          className='ai-send'
          disabled={busy || !msg.trim() || (aiCredits ?? 0) <= 0}
          aria-label='Send'
        >
          ➤
        </button>
      </form>
      {(aiCredits ?? 0) <= 0 && (
        <button
          type='button'
          className='ai-no-credit-action'
          onClick={() => setCreditPopup(true)}
        >
          Why can’t I chat?
        </button>
      )}
      <p className='ai-notice'>
        Islamic AI can make mistakes. Verify important religious guidance with a
        qualified scholar.
      </p>
      {creditPopup && (
        <div
          className='ai-credit-modal'
          role='dialog'
          aria-modal='true'
          aria-labelledby='ai-credit-title'
        >
          <button
            className='ai-credit-backdrop'
            onClick={() => setCreditPopup(false)}
            aria-label='Close'
          />
          <section>
            <i>✦</i>
            <h2 id='ai-credit-title'>No AI Credit</h2>
            <p>
              You need AI Credit to chat with Deen AI. Watch rewarded ads or
              upgrade your Premium plan to continue.
            </p>
            <button onClick={() => setCreditPopup(false)}>Got it</button>
          </section>
        </div>
      )}
    </div>
  );
}
function Saved({ type }: { type: string }) {
  const key =
      type === "Bookmarks"
        ? "deenislam_web_bookmarks"
        : "deenislam_web_downloads",
    [items, setItems] = useState<string[]>([]);
  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem(key) || "[]"));
  }, [key]);
  return (
    <div className='saved'>
      <div className='feature-hero'>
        <span>YOUR LIBRARY</span>
        <h2>{type}</h2>
        <p>
          {type === "Downloads"
            ? "Content saved for offline reading on this browser."
            : "Your saved Quran, Hadith and learning content."}
        </p>
      </div>
      {items.length ? (
        <div className='content-grid'>
          {items.map((x, i) => (
            <article className='content-card' key={x + i}>
              <span>SAVED ITEM</span>
              <h2>{x}</h2>
              <footer>
                <button
                  onClick={() => {
                    const next = items.filter((_, n) => n !== i);
                    setItems(next);
                    localStorage.setItem(key, JSON.stringify(next));
                  }}
                >
                  Remove
                </button>
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <div className='empty-state'>
          <b>{type === "Downloads" ? "⇩" : "♡"}</b>
          <h2>No {type.toLowerCase()} yet</h2>
          <p>Items you save will appear here.</p>
        </div>
      )}
    </div>
  );
}
function Account({ language }: { language: string }) {
  type Profile = {
    name: string;
    email: string;
    authProvider?: string;
    createdAt?: string;
    lastLoginAt?: string;
    lastOpenedAt?: string;
    appOpenCount?: number;
    devices?: Array<{
      deviceId: string;
      platform: string;
      appVersion: string;
      lastSeenAt: string;
      city?: string;
      country?: string;
    }>;
  };
  type Reward = {
    completed?: number;
    required?: number;
    accessType?: string;
    premiumExpiresAt?: string | null;
    dailyUsageLimit?: number;
    dailyUsageUsed?: number;
    dailyUsageRemaining?: number;
    aiSearchCreditsRemaining?: number;
    aiSearchCreditsLimit?: number;
    contentCreditsRemaining?: number | null;
    contentCreditsLimit?: number | null;
  };
  const [user, setUser] = useState<Profile | null>(null),
    [reward, setReward] = useState<Reward | null>(null),
    [mode, setMode] = useState<"login" | "register">("login"),
    [panel, setPanel] = useState<
      "profile" | "billing" | "password" | "support" | null
    >(null),
    [billing, setBilling] = useState<any[]>([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [checking, setChecking] = useState(true),
    [notifications, setNotifications] = useState(true);
  const bookmarks = (() => {
      try {
        return (
          JSON.parse(
            localStorage.getItem("deenislam_web_bookmarks") || "[]",
          ) as unknown[]
        ).length;
      } catch {
        return 0;
      }
    })(),
    downloads = (() => {
      try {
        return (
          JSON.parse(
            localStorage.getItem("deenislam_web_downloads") || "[]",
          ) as unknown[]
        ).length;
      } catch {
        return 0;
      }
    })();
  const load = () => {
    const token = localStorage.getItem("deen_islam_auth_token_v2");
    if (!token) {
      setChecking(false);
      return;
    }
    setChecking(true);
    Promise.all([
      json("/api/account/profile"),
      json("/api/rewards/admob/progress").catch(() => ({ data: null })),
    ])
      .then(([profile, rewards]) => {
        const next = profile.data as Profile;
        setUser(next);
        setReward((rewards.data || rewards || null) as Reward | null);
        localStorage.setItem(
          "deenislam_web_user",
          JSON.stringify({ name: next.name, email: next.email }),
        );
      })
      .catch(() => {
        localStorage.removeItem("deen_islam_auth_token_v2");
        localStorage.removeItem("deenislam_web_user");
        setUser(null);
      })
      .finally(() => setChecking(false));
  };
  useEffect(() => {
    setNotifications(
      localStorage.getItem("deenislam_web_notifications") !== "off",
    );
    load();
  }, []);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget),
      body = {
        name: String(f.get("name") || ""),
        email: String(f.get("email") || "")
          .trim()
          .toLowerCase(),
        password: String(f.get("password") || ""),
        deviceId: deviceId(),
      };
    try {
      const x = await json(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      localStorage.setItem("deen_islam_auth_token_v2", x.token);
      setChecking(true);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };
  const signOut = () => {
    if (
      !confirm(
        "Sign out of DeenIslam? Your saved device data will remain available.",
      )
    )
      return;
    localStorage.removeItem("deen_islam_auth_token_v2");
    localStorage.removeItem("deenislam_web_user");
    setUser(null);
    setReward(null);
    setPanel(null);
  };
  const deleteAccount = async () => {
    if (!confirm("Delete your account and all linked server data permanently?"))
      return;
    if (
      !confirm(
        "Final confirmation: this account cannot be recovered. Continue?",
      )
    )
      return;
    setBusy(true);
    try {
      await json("/api/account", { method: "DELETE" });
      localStorage.removeItem("deen_islam_auth_token_v2");
      localStorage.removeItem("deenislam_web_user");
      setUser(null);
      setPanel(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Account deletion failed");
    } finally {
      setBusy(false);
    }
  };
  const openBilling = async () => {
    setPanel("billing");
    setError("");
    try {
      const x = await json("/api/account/billing-history");
      setBilling(x.data?.items || []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load billing history",
      );
    }
  };
  const changePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await json("/api/account/password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: String(f.get("currentPassword") || ""),
          newPassword: String(f.get("newPassword") || ""),
        }),
      });
      setNotice("Password changed successfully.");
      setPanel(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to change password");
    } finally {
      setBusy(false);
    }
  };
  const nav = (path: string) => {
    history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  if (checking)
    return (
      <div className='auth-loading'>
        <span />
        <p>Checking your secure session…</p>
      </div>
    );
  if (!user)
    return (
      <div className='account-auth'>
        <div className='auth-intro'>
          <span>☾</span>
          <small>WELCOME TO DEEN ISLAM</small>
          <h2>
            {mode === "login"
              ? "Continue your Deen journey"
              : "Start your Deen journey"}
          </h2>
          <p>
            Use the same account and backend as the App to sync profile, Premium
            access, billing and saved activity.
          </p>
          <ul>
            <li>✓ Secure account access</li>
            <li>✓ App and Web profile sync</li>
            <li>✓ Saved content everywhere</li>
          </ul>
        </div>
        <form className='auth-form' onSubmit={submit}>
          <small>DEEN ISLAM ACCOUNT</small>
          <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          {mode === "register" && (
            <label>
              Full name
              <input name='name' autoComplete='name' minLength={2} required />
            </label>
          )}
          <label>
            Email address
            <input name='email' type='email' autoComplete='email' required />
          </label>
          <label>
            Password
            <input
              name='password'
              type='password'
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={6}
              required
            />
          </label>
          {error && <p className='error'>{error}</p>}
          <button disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign In Securely"
                : "Create Account"}
          </button>
          <button
            type='button'
            className='link'
            onClick={() => {
              setError("");
              setMode(mode === "login" ? "register" : "login");
            }}
          >
            {mode === "login"
              ? "Create a new account"
              : "I already have an account"}
          </button>
        </form>
      </div>
    );
  const allowance = reward?.dailyUsageLimit || 0,
    used = reward?.dailyUsageUsed || 0,
    remaining = reward?.dailyUsageRemaining ?? Math.max(0, allowance - used),
    paid = reward?.accessType === "paid",
    percent = allowance
      ? Math.min(100, Math.round((used / allowance) * 100))
      : 0;
  const level = (value: number) =>
      value >= 20 ? 4 : value >= 10 ? 3 : value >= 5 ? 2 : 1,
    aiCredit = reward?.aiSearchCreditsRemaining || 0,
    aiLimit = reward?.aiSearchCreditsLimit || 0,
    otherCredit = reward?.contentCreditsRemaining || 0,
    otherLimit = reward?.contentCreditsLimit || 0;
  return (
    <div className='profile-web'>
      <section className='profile-web-hero'>
        <div className='profile-web-avatar'>
          {user.name.slice(0, 2).toUpperCase()}
        </div>
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        <b>✓ Signed in securely</b>
        <article className={paid ? "premium-status paid" : "premium-status"}>
          <header>
            <div>
              <small>
                {paid ? "DEEN PREMIUM" : "TODAY'S PREMIUM ALLOWANCE"}
              </small>
              <strong>{paid ? "Premium Member" : user.name}</strong>
            </div>
            <em>
              {paid
                ? "PREMIUM"
                : `${reward?.completed || 0}/${reward?.required || 20} ADS`}
            </em>
          </header>
          <div className='premium-metrics'>
            <span>
              <small>Today's Allowance</small>
              <b>{allowance}</b>
            </span>
            <span>
              <small>Used Today</small>
              <b>{used}</b>
            </span>
            <span>
              <small>Remaining</small>
              <b>{remaining}</b>
            </span>
          </div>
          <div className='premium-track'>
            <i style={{ width: `${percent}%` }} />
          </div>
          {paid && reward?.premiumExpiresAt && (
            <footer>
              Membership valid until{" "}
              {new Date(reward.premiumExpiresAt).toLocaleDateString()}
            </footer>
          )}
        </article>
      </section>
      <section className='profile-credit-grid'>
        <article>
          <i>✦</i>
          <div>
            <header>
              <b>AI Credit</b>
              <em>LEVEL {level(aiCredit)}</em>
            </header>
            <strong>{aiCredit} available</strong>
            <span>
              <u
                style={{
                  width: `${aiLimit ? Math.min(100, (aiCredit / aiLimit) * 100) : 0}%`,
                }}
              />
            </span>
          </div>
        </article>
        <article className='other'>
          <i>◆</i>
          <div>
            <header>
              <b>Other Credit</b>
              <em>LEVEL {level(otherCredit)}</em>
            </header>
            <strong>{otherCredit} available</strong>
            <span>
              <u
                style={{
                  width: `${otherLimit ? Math.min(100, (otherCredit / otherLimit) * 100) : 0}%`,
                }}
              />
            </span>
          </div>
        </article>
      </section>
      <section className='profile-stats'>
        <button onClick={() => nav("/quran")}>
          <b>1</b>
          <span>Surah Read</span>
        </button>
        <button onClick={() => nav("/bookmarks")}>
          <b>{bookmarks}</b>
          <span>Bookmarks</span>
        </button>
        <button onClick={() => nav("/downloads")}>
          <b>{downloads}</b>
          <span>Downloads</span>
        </button>
      </section>
      {notice && <p className='profile-success'>{notice}</p>}
      {error && <p className='error'>{error}</p>}
      {panel === "profile" && (
        <section className='profile-detail'>
          <header>
            <h2>Profile Information</h2>
            <button onClick={() => setPanel(null)}>×</button>
          </header>
          <dl>
            <div>
              <dt>Name</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Sign-in provider</dt>
              <dd>{user.authProvider || "email"}</dd>
            </div>
            <div>
              <dt>Member since</dt>
              <dd>
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Last login</dt>
              <dd>
                {user.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString()
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>App opens</dt>
              <dd>{user.appOpenCount || 0}</dd>
            </div>
          </dl>
          {user.devices?.map((d) => (
            <article key={d.deviceId}>
              <b>
                {d.platform} · Version {d.appVersion || "—"}
              </b>
              <small>
                {d.city || d.country
                  ? [d.city, d.country].filter(Boolean).join(", ")
                  : "Registered device"}
              </small>
            </article>
          ))}
        </section>
      )}
      {panel === "billing" && (
        <section className='profile-detail'>
          <header>
            <h2>Billing History</h2>
            <button onClick={() => setPanel(null)}>×</button>
          </header>
          {billing.length ? (
            billing.map((x, i) => (
              <article key={x.transactionId || i}>
                <b>{x.productName || x.plan || "DeenIslam purchase"}</b>
                <small>
                  {x.status || "paid"} · {x.amount || 0} {x.currency || "USD"}
                </small>
              </article>
            ))
          ) : (
            <p>No billing transactions found.</p>
          )}
        </section>
      )}
      {panel === "password" && (
        <form
          className='profile-detail password-form'
          onSubmit={changePassword}
        >
          <header>
            <h2>Password & Security</h2>
            <button type='button' onClick={() => setPanel(null)}>
              ×
            </button>
          </header>
          <label>
            Current password
            <input name='currentPassword' type='password' required />
          </label>
          <label>
            New password
            <input name='newPassword' type='password' minLength={6} required />
          </label>
          <button disabled={busy}>Change Password</button>
        </form>
      )}
      {panel === "support" && (
        <section className='profile-detail'>
          <header>
            <h2>Help & Support</h2>
            <button onClick={() => setPanel(null)}>×</button>
          </header>
          <p>
            For assistance, contact the Deen Islam support team from your
            registered email: <b>{user.email}</b>.
          </p>
        </section>
      )}
      <ProfileGroup
        title='MY ACCOUNT'
        rows={[
          {
            icon: "Profile",
            title: "Profile Information",
            sub: "Name, email and sign-in details",
            go: () => setPanel("profile"),
          },
        ]}
      />
      <ProfileGroup
        title='PREMIUM'
        rows={[
          {
            icon: "Premium",
            title: "Remove Ads",
            sub: "$9.99/month for an ad-free experience",
            go: () =>
              setNotice(
                "Remove Ads purchase is managed by the same App subscription account.",
              ),
          },
          {
            icon: "Premium",
            title: "Deen Premium Subscription",
            sub: "Monthly or yearly Premium membership",
            go: () =>
              setNotice(
                paid
                  ? "Your Premium membership is active."
                  : "Open the App to complete a Premium purchase securely.",
              ),
          },
          {
            icon: "Billing History",
            title: "Billing History",
            sub: "Purchases, payments and subscription receipts",
            go: openBilling,
          },
          {
            icon: "Premium",
            title: "Watch Ads & Unlock Premium",
            sub: "20 ads = 20 uses until midnight",
            go: () =>
              setNotice(
                "Rewarded ads are available in the mobile App; progress is synced here.",
              ),
          },
        ]}
      />
      <ProfileGroup
        title='PREFERENCES'
        rows={[
          {
            icon: "Language",
            title: "Language",
            sub: language.toUpperCase(),
            go: () => setNotice("Use the language selector in the top bar."),
          },
          {
            icon: "Audio",
            title: "Quran Reciter",
            sub: "Mishary Rashid Alafasy",
            go: () =>
              setNotice("Reciter selection will be used across Quran audio."),
          },
          {
            icon: "Notifications",
            title: "Notifications",
            sub: "Prayer and daily reminders",
            toggle: notifications,
            go: () => {
              const next = !notifications;
              setNotifications(next);
              localStorage.setItem(
                "deenislam_web_notifications",
                next ? "on" : "off",
              );
            },
          },
        ]}
      />
      <ProfileGroup
        title='SUPPORT & PRIVACY'
        rows={[
          {
            icon: "Settings",
            title: "Privacy & Security",
            sub: "Your data and account settings",
            go: () => setPanel("password"),
          },
          {
            icon: "Help",
            title: "Help & Support",
            sub: "FAQs and contact support",
            go: () => setPanel("support"),
          },
        ]}
      />
      <ProfileGroup
        title='ACCOUNT CONTROL'
        rows={[
          {
            icon: "Settings",
            title: "Password & Security",
            sub: "Change or recover your password",
            go: () => setPanel("password"),
          },
          {
            icon: "Profile",
            title: "Sign Out",
            sub: "Sign out of your DeenIslam account",
            go: signOut,
          },
        ]}
      />
      <button
        className='delete-account'
        disabled={busy}
        onClick={() => void deleteAccount()}
      >
        <span>Delete Account</span>
        <small>Permanently delete your account and linked server data</small>
      </button>
      <footer className='profile-version'>
        Deen Islam · Muslim Guide & Path
        <br />
        Version 1.0.0
      </footer>
    </div>
  );
}
function ProfileGroup({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    icon: string;
    title: string;
    sub: string;
    go: () => void;
    toggle?: boolean;
  }>;
}) {
  return (
    <section className='profile-group'>
      <h3>{title}</h3>
      <div>
        {rows.map((row) => (
          <button key={row.title} onClick={row.go}>
            <i>
              <span>{row.icon.slice(0, 1)}</span>
            </i>
            <b>
              {row.title}
              <small>{row.sub}</small>
            </b>
            {row.toggle !== undefined ? (
              <em
                className={row.toggle ? "profile-toggle on" : "profile-toggle"}
              >
                <u />
              </em>
            ) : (
              <em>›</em>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
const prophetList = [
  ["Adam (AS)", "آدَم", "The first human and the first Prophet."],
  [
    "Idris (AS)",
    "إِدْرِيس",
    "A truthful Prophet praised for his high station.",
  ],
  ["Nuh (AS)", "نُوح", "He called his people to Allah with great patience."],
  ["Hud (AS)", "هُود", "The Prophet sent to the people of Ad."],
  ["Salih (AS)", "صَالِح", "The Prophet sent to Thamud."],
  [
    "Ibrahim (AS)",
    "إِبْرَاهِيم",
    "The close friend of Allah and an example of pure faith.",
  ],
  ["Lut (AS)", "لُوط", "He called his people to purity and obedience."],
  ["Ismail (AS)", "إِسْمَاعِيل", "Known for patience and keeping his promise."],
  ["Ishaq (AS)", "إِسْحَاق", "Son of Ibrahim and a blessed Prophet."],
  ["Yaqub (AS)", "يَعْقُوب", "Also known as Israel; father of Yusuf."],
  [
    "Yusuf (AS)",
    "يُوسُف",
    "Known for patience, chastity, forgiveness and wisdom.",
  ],
  ["Shuayb (AS)", "شُعَيْب", "He called Madyan to justice and honest trade."],
  ["Ayyub (AS)", "أَيُّوب", "An enduring example of patience through trials."],
  [
    "Dhul-Kifl (AS)",
    "ذُو الْكِفْل",
    "Mentioned among the patient and righteous.",
  ],
  ["Musa (AS)", "مُوسَى", "Sent to Pharaoh and given the Tawrah."],
  ["Harun (AS)", "هَارُون", "Brother and supporting Prophet of Musa."],
  ["Dawud (AS)", "دَاوُود", "A Prophet and king who was given the Zabur."],
  [
    "Sulayman (AS)",
    "سُلَيْمَان",
    "A Prophet and wise king with a unique kingdom.",
  ],
  ["Ilyas (AS)", "إِلْيَاس", "He called his people away from idol worship."],
  ["Al-Yasa (AS)", "الْيَسَع", "A righteous Prophet mentioned in the Quran."],
  [
    "Yunus (AS)",
    "يُونُس",
    "The companion of the fish who called upon Allah in distress.",
  ],
  [
    "Zakariya (AS)",
    "زَكَرِيَّا",
    "A devoted Prophet who prayed for righteous offspring.",
  ],
  ["Yahya (AS)", "يَحْيَى", "A noble, pure and compassionate Prophet."],
  [
    "Isa (AS)",
    "عِيسَى",
    "The Messiah, son of Maryam, and a Messenger of Allah.",
  ],
  [
    "Muhammad ﷺ",
    "مُحَمَّد",
    "The final Prophet and Messenger, sent as mercy to all worlds.",
  ],
] as const;
const adamStory = [
  {
    title: "Creation",
    story:
      "Allah created Adam from clay, honored him, and taught him the names. The angels were shown the special knowledge Allah had granted to the first human.",
    reference: "Quran 2:30–33; 38:71–72",
  },
  {
    title: "The Test",
    story:
      "Adam and his wife were placed in Paradise. They were permitted to enjoy its blessings, but Allah warned them not to approach a particular tree.",
    reference: "Quran 2:35; 7:19",
  },
  {
    title: "Repentance and Earth",
    story:
      "After their mistake, Adam and his wife sincerely repented. Allah accepted their repentance and sent humanity to earth with divine guidance.",
    reference: "Quran 2:36–38; 7:23",
  },
];
type WebProphet = {
  name: string;
  slug?: string;
  arabic?: string;
  summary?: string;
  parts?: Array<{ title: string; story: string; reference?: string }>;
};
function ProphetArticle({ story }: { story: string }) {
  if (/<(?:p|h[1-6]|ul|ol|li|blockquote|strong|em|a|img|span)\b/i.test(story)) {
    const safeStory = String(story || "")
      .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, "")
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, '$1="#"');
    return (
      <div
        className='prophet-article-copy'
        dangerouslySetInnerHTML={{ __html: safeStory }}
      />
    );
  }
  return (
    <div className='prophet-article-copy'>
      {String(story || "")
        .split(/\r?\n/)
        .map((raw, index) => {
          const line = raw.trim();
          if (!line) return <div className='space' key={index} />;
          if (line.startsWith("# "))
            return <h1 key={index}>{line.slice(2).replace(/\*\*/g, "")}</h1>;
          if (line.startsWith("## "))
            return <h2 key={index}>{line.slice(3).replace(/\*\*/g, "")}</h2>;
          if (line.startsWith("### "))
            return <h3 key={index}>{line.slice(4).replace(/\*\*/g, "")}</h3>;
          if (line.startsWith("> "))
            return (
              <blockquote key={index}>
                {line.slice(2).replace(/\*\*/g, "")}
              </blockquote>
            );
          if (/^[-*] /.test(line))
            return (
              <p className='bullet' key={index}>
                • <span>{line.slice(2).replace(/\*\*/g, "")}</span>
              </p>
            );
          if (/^\*\*(Qur|Source|Reference)/i.test(line))
            return (
              <b className='reference' key={index}>
                {line.replace(/\*\*/g, "")}
              </b>
            );
          return <p key={index}>{line.replace(/\*\*/g, "")}</p>;
        })}
    </div>
  );
}
function Prophets({
  language,
  onBack,
}: {
  language: string;
  onBack: () => void;
}) {
  const [q, setQ] = useState(""),
    [selected, setSelected] = useState<(typeof prophetList)[number] | null>(
      null,
    ),
    [part, setPart] = useState<number | null>(null),
    [remote, setRemote] = useState<WebProphet[]>([]);
  useEffect(() => {
    let active = true;
    json(
      `/api/prophets?language=${encodeURIComponent(language)}&fresh=${Date.now()}`,
    )
      .then((body) => {
        if (active && Array.isArray(body.data)) setRemote(body.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [language]);
  const rows = useMemo(() => {
    const value = q.trim().toLowerCase();
    return prophetList.filter(
      (item) =>
        !value ||
        `${item[0]} ${item[1]} ${item[2]}`.toLowerCase().includes(value),
    );
  }, [q]);
  if (selected) {
    const fromApi = remote.find(
        (item) => item.name === selected[0] || item.slug === selected[0],
      ),
      parts = fromApi?.parts?.length
        ? fromApi.parts
        : selected[0] === "Adam (AS)"
          ? adamStory
          : [
              {
                title: `The story of ${selected[0]}`,
                story: selected[2],
                reference:
                  "Verified Quranic references and detailed lessons will be added here.",
              },
            ],
      arabic = fromApi?.arabic || selected[1],
      summary = fromApi?.summary || selected[2];
    if (part !== null) {
      const article = parts[part];
      return (
        <div className='prophet-reader'>
          <button className='prophet-back' onClick={() => setPart(null)}>
            ← All parts
          </button>
          <header>
            <small>PART {String(part + 1).padStart(2, "0")}</small>
            <h2>{article.title}</h2>
            <p>{selected[0]}</p>
          </header>
          <article>
            <ProphetArticle story={article.story} />
            {article.reference && (
              <aside>
                <small>QURAN / VERIFIED SOURCE</small>
                <b>{article.reference}</b>
              </aside>
            )}
          </article>
          <nav>
            <button
              disabled={part === 0}
              onClick={() => setPart((value) => Math.max(0, (value || 0) - 1))}
            >
              ← Previous
            </button>
            <span>
              {part + 1} / {parts.length}
            </span>
            <button
              disabled={part === parts.length - 1}
              onClick={() =>
                setPart((value) => Math.min(parts.length - 1, (value || 0) + 1))
              }
            >
              Next →
            </button>
          </nav>
        </div>
      );
    }
    return (
      <div className='prophet-reader'>
        <button className='prophet-back' onClick={() => setSelected(null)}>
          ← All Prophets
        </button>
        <header className='prophet-profile'>
          <b dir='rtl'>{arabic}</b>
          <h2>{selected[0]}</h2>
          <p>{summary}</p>
          <small>{parts.length} PARTS</small>
        </header>
        <div className='prophet-parts'>
          {parts.map((item, index) => (
            <button
              key={`${item.title}-${index}`}
              onClick={() => setPart(index)}
            >
              <span>PART {index + 1}</span>
              <h3>{item.title}</h3>
              <p>
                {item.story
                  .replace(/^#+\s*/gm, "")
                  .replace(/\*\*/g, "")
                  .slice(0, 360)}
                {item.story.length > 360 ? "…" : ""}
              </p>
              {item.reference && (
                <aside>
                  <small>QURAN / VERIFIED SOURCE</small>
                  <b>{item.reference}</b>
                </aside>
              )}
              <footer>
                Read full story <b>›</b>
              </footer>
            </button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className='prophets-app'>
      <button
        type='button'
        className='sahaba-back'
        onClick={onBack}
        aria-label='Back to home'
      >
        <b>‹</b> Back
      </button>
      <div className='prophets-heading'>
        <i>✦</i>
        <div>
          <h2>Prophets</h2>
          <p>25 Prophets named in the Quran</p>
        </div>
        <span>25</span>
      </div>
      <label className='prophets-search'>
        <b>⌕</b>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='Search Prophets...'
        />
        <button
          aria-label='Clear search'
          className={q ? "show" : ""}
          onClick={() => setQ("")}
        >
          ×
        </button>
      </label>
      <div className='prophets-list'>
        {rows.map((item) => {
          const number = prophetList.indexOf(item) + 1;
          return (
            <button
              key={item[0]}
              onClick={() => {
                setSelected(item);
                setPart(null);
              }}
            >
              <div className='prophet-row'>
                <i>{String(number).padStart(2, "0")}</i>
                <div>
                  <h3>{item[0]}</h3>
                  <b dir='rtl'>{item[1]}</b>
                  <p>{item[2]}</p>
                </div>
                <span>›</span>
              </div>
            </button>
          );
        })}
      </div>
      {!rows.length && (
        <div className='prophets-empty'>
          <b>⌕</b>
          <h3>No matching Prophet found</h3>
          <p>Try searching with another name.</p>
        </div>
      )}
    </div>
  );
}
function Knowledge({ title, query }: { title: string; query: string }) {
  const base = knowledge[title] || [
      `${title} introduction`,
      `${title} essentials`,
      `${title} learning guide`,
      `${title} resources`,
      `${title} saved lessons`,
      `${title} recommended content`,
    ],
    items = base.filter((x) => x.toLowerCase().includes(query.toLowerCase()));
  if (title === "Islamic Books") {
    const covers = [
      "/images/library/sahih-bukhari.png",
      "/images/library/sahih-muslim.png",
      "/images/library/nawawi.png",
      "/images/library/muwatta.png",
      "/images/hadith/forty-hadith-nawawi-cover.png",
      "/images/hadith/forty-hadith-qudsi-cover.png",
    ];
    return (
      <div className='books-library'>
        <section className='books-library-hero'>
          <div>
            <span>YOUR ISLAMIC LIBRARY</span>
            <h2>Read. Learn. Grow.</h2>
            <p>
              Authentic Islamic books, carefully organized for a peaceful
              reading experience.
            </p>
            <nav>
              <b>{base.length} Books</b>
              <b>Verified Content</b>
              <b>Save Progress</b>
            </nav>
          </div>
          <div className='books-hero-stack'>
            <i />
            <i />
            <i>﷽</i>
          </div>
        </section>
        <header className='books-library-head'>
          <div>
            <small>EXPLORE THE COLLECTION</small>
            <h2>Islamic Books</h2>
            <p>Continue your journey of knowledge</p>
          </div>
          <nav>
            <button className='active'>All Books</button>
            <button>Hadith</button>
            <button>Seerah</button>
            <button>Adab</button>
          </nav>
        </header>
        <div className='books-app-grid'>
          {items.map((x, i) => (
            <article className='book-app-card' key={x}>
              <div className='book-cover'>
                <img src={covers[i % covers.length]} alt='' />
                <button
                  aria-label={`Bookmark ${x}`}
                  onClick={() => bookmark(x, title)}
                >
                  ♡
                </button>
                <span>{i < 2 ? "POPULAR" : "FEATURED"}</span>
              </div>
              <section>
                <small>ISLAMIC BOOK</small>
                <h2>{x}</h2>
                <p>
                  {i === 0
                    ? "Imam An-Nawawi"
                    : i === 1
                      ? "Safiur Rahman Mubarakpuri"
                      : i === 2
                        ? "Imam An-Nawawi"
                        : "Deen Islam Library"}
                </p>
                <div>
                  <span>Reading progress</span>
                  <b>{i === 0 ? "18%" : "0%"}</b>
                </div>
                <i>
                  <em style={{ width: i === 0 ? "18%" : "0%" }} />
                </i>
                <footer>
                  <button onClick={() => bookmark(x, title)}>♡ Save</button>
                  <button>
                    Open Book <b>›</b>
                  </button>
                </footer>
              </section>
            </article>
          ))}
        </div>
        {!items.length && (
          <div className='empty-state'>
            <b>⌕</b>
            <h2>No book found</h2>
            <p>Try another book title.</p>
          </div>
        )}
      </div>
    );
  }
  return (
    <>
      <div className='feature-hero'>
        <span>VERIFIED LEARNING LIBRARY</span>
        <h2>{title}</h2>
        <p>Explore structured content and save useful lessons for later.</p>
      </div>
      <div className='content-grid'>
        {items.map((x, i) => (
          <article className='content-card' key={x}>
            <span>LESSON {String(i + 1).padStart(2, "0")}</span>
            <h2>{x}</h2>
            <p>
              Open this lesson to read verified content, references and
              practical guidance.
            </p>
            <footer>
              <button onClick={() => bookmark(x, title)}>♡ Bookmark</button>
              <button>Open →</button>
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}
function Status({ loading, error }: { loading: boolean; error: string }) {
  return (
    <>
      {loading && <p className='loading'>Loading verified content…</p>}
      {error && (
        <p className='error'>
          {error} Make sure your backend is running and NEXT_PUBLIC_API_URL is
          correct.
        </p>
      )}
    </>
  );
}
function bookmark(title: string, section: string) {
  const key = "deenislam_web_bookmarks",
    list = JSON.parse(localStorage.getItem(key) || "[]") as string[],
    value = `${section} · ${title}`;
  if (!list.includes(value))
    localStorage.setItem(key, JSON.stringify([value, ...list]));
}
function download(title: string, _content: string) {
  const key = "deenislam_web_downloads",
    list = JSON.parse(localStorage.getItem(key) || "[]") as string[];
  if (!list.includes(title))
    localStorage.setItem(key, JSON.stringify([title, ...list]));
}
