"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLanguagePicker, { ADMIN_LANGUAGES } from "../components/AdminLanguagePicker";
import RichTextEditor from "../islamic-lifestyle/RichTextEditor";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

// Complete 114 Quran Surahs list
const SURAHS = [
  { number: 1, name: "Al-Faatiha", bangla: "আল-ফাতিহা", ayahs: 7 },
  { number: 2, name: "Al-Baqara", bangla: "আল-বাকারা", ayahs: 286 },
  { number: 3, name: "Aal-i-Imraan", bangla: "আলে ইমরান", ayahs: 200 },
  { number: 4, name: "An-Nisaa", bangla: "আন-নিসা", ayahs: 176 },
  { number: 5, name: "Al-Maaida", bangla: "আল-মায়িদাহ", ayahs: 120 },
  { number: 6, name: "Al-An'aam", bangla: "আল-আনআম", ayahs: 165 },
  { number: 7, name: "Al-A'raaf", bangla: "আল-আরাফ", ayahs: 206 },
  { number: 8, name: "Al-Anfaal", bangla: "আল-আনফাল", ayahs: 75 },
  { number: 9, name: "At-Tawba", bangla: "আত-তাওবাহ", ayahs: 129 },
  { number: 10, name: "Yunus", bangla: "ইউনুস", ayahs: 109 },
  { number: 11, name: "Hud", bangla: "হুদ", ayahs: 123 },
  { number: 12, name: "Yusuf", bangla: "ইউসুফ", ayahs: 111 },
  { number: 13, name: "Ar-Ra'd", bangla: "আর-রাদ", ayahs: 43 },
  { number: 14, name: "Ibrahim", bangla: "ইবরাহীম", ayahs: 52 },
  { number: 15, name: "Al-Hijr", bangla: "আল-হিজর", ayahs: 99 },
  { number: 16, name: "An-Nahl", bangla: "আন-নাহল", ayahs: 128 },
  { number: 17, name: "Al-Israa", bangla: "বনী ইসরাঈল", ayahs: 111 },
  { number: 18, name: "Al-Kahf", bangla: "আল-কাহফ", ayahs: 110 },
  { number: 19, name: "Maryam", bangla: "মারইয়াম", ayahs: 98 },
  { number: 20, name: "Taa-Haa", bangla: "ত্বা-হা", ayahs: 135 },
  { number: 21, name: "Al-Anbiyaa", bangla: "আল-আম্বিয়া", ayahs: 112 },
  { number: 22, name: "Al-Hajj", bangla: "আল-হাজ্জ", ayahs: 78 },
  { number: 23, name: "Al-Muminoon", bangla: "আল-মুমিনুন", ayahs: 118 },
  { number: 24, name: "An-Noor", bangla: "আন-নূর", ayahs: 64 },
  { number: 25, name: "Al-Furqaan", bangla: "আল-ফুরকান", ayahs: 77 },
  { number: 26, name: "Ash-Shu'araa", bangla: "আশ-শুআরা", ayahs: 227 },
  { number: 27, name: "An-Naml", bangla: "আন-নামল", ayahs: 93 },
  { number: 28, name: "Al-Qasas", bangla: "আল-কাসাস", ayahs: 88 },
  { number: 29, name: "Al-Ankaboot", bangla: "আল-আনকাবুত", ayahs: 69 },
  { number: 30, name: "Ar-Room", bangla: "আর-রূম", ayahs: 60 },
  { number: 31, name: "Luqman", bangla: "লুকমান", ayahs: 34 },
  { number: 32, name: "As-Sajda", bangla: "আস-সাজদাহ", ayahs: 30 },
  { number: 33, name: "Al-Ahzaab", bangla: "আল-আহযাব", ayahs: 73 },
  { number: 34, name: "Saba", bangla: "সাবা", ayahs: 54 },
  { number: 35, name: "Faatir", bangla: "ফাতির", ayahs: 45 },
  { number: 36, name: "Yaseen", bangla: "ইয়াসীন", ayahs: 83 },
  { number: 37, name: "As-Saaffaat", bangla: "আস-সাফফাত", ayahs: 182 },
  { number: 38, name: "Saad", bangla: "ছোয়াদ", ayahs: 88 },
  { number: 39, name: "Az-Zumar", bangla: "আয-যুমার", ayahs: 75 },
  { number: 40, name: "Ghafir", bangla: "আল-মুমিন / গাফির", ayahs: 85 },
  { number: 41, name: "Fussilat", bangla: "হা-মীম সিজদাহ", ayahs: 54 },
  { number: 42, name: "Ash-Shura", bangla: "আশ-শূরা", ayahs: 53 },
  { number: 43, name: "Az-Zukhruf", bangla: "আয-যুখরুফ", ayahs: 89 },
  { number: 44, name: "Ad-Dukhan", bangla: "আদ-দুখান", ayahs: 59 },
  { number: 45, name: "Al-Jathiya", bangla: "আল-জাসিয়া", ayahs: 37 },
  { number: 46, name: "Al-Ahqaf", bangla: "আল-আহকাফ", ayahs: 35 },
  { number: 47, name: "Muhammad", bangla: "মুহাম্মদ", ayahs: 38 },
  { number: 48, name: "Al-Fath", bangla: "আল-ফাতহ", ayahs: 29 },
  { number: 49, name: "Al-Hujurat", bangla: "আল-হুজুরাত", ayahs: 18 },
  { number: 50, name: "Qaf", bangla: "কাফ", ayahs: 45 },
  { number: 51, name: "Adh-Dhariyat", bangla: "আয-যারিয়াত", ayahs: 60 },
  { number: 52, name: "At-Tur", bangla: "আত-তূর", ayahs: 49 },
  { number: 53, name: "An-Najm", bangla: "আন-নাজম", ayahs: 62 },
  { number: 54, name: "Al-Qamar", bangla: "আল-ক্বামার", ayahs: 55 },
  { number: 55, name: "Ar-Rahman", bangla: "আর-রাহমান", ayahs: 78 },
  { number: 56, name: "Al-Waqi'a", bangla: "আল-ওয়াকিয়া", ayahs: 96 },
  { number: 57, name: "Al-Hadid", bangla: "আল-হাদীদ", ayahs: 29 },
  { number: 58, name: "Al-Mujadila", bangla: "আল-মুজাদালাহ", ayahs: 22 },
  { number: 59, name: "Al-Hashr", bangla: "আল-হাশর", ayahs: 24 },
  { number: 60, name: "Al-Mumtahanah", bangla: "আল-মুমতাহিনা", ayahs: 13 },
  { number: 61, name: "As-Saff", bangla: "আস-সাফ", ayahs: 14 },
  { number: 62, name: "Al-Jumu'ah", bangla: "আল-জুমুআহ", ayahs: 11 },
  { number: 63, name: "Al-Munafiqoon", bangla: "আল-মুনাফিকুন", ayahs: 11 },
  { number: 64, name: "At-Taghabun", bangla: "আত-তাগাবুন", ayahs: 18 },
  { number: 65, name: "At-Talaq", bangla: "আত-তালাক", ayahs: 12 },
  { number: 66, name: "At-Tahrim", bangla: "আত-তাহরীম", ayahs: 12 },
  { number: 67, name: "Al-Mulk", bangla: "আল-মুলক", ayahs: 30 },
  { number: 68, name: "Al-Qalam", bangla: "আল-কলম", ayahs: 52 },
  { number: 69, name: "Al-Haaqqa", bangla: "আল-হাক্কাহ", ayahs: 52 },
  { number: 70, name: "Al-Ma'arij", bangla: "আল-মাআরিজ", ayahs: 44 },
  { number: 71, name: "Nooh", bangla: "নূহ", ayahs: 28 },
  { number: 72, name: "Al-Jinn", bangla: "আল-জ্বিন", ayahs: 28 },
  { number: 73, name: "Al-Muzzammil", bangla: "আল-মুযযাম্মিল", ayahs: 20 },
  { number: 74, name: "Al-Muddaththir", bangla: "আল-মুদ্দাসসির", ayahs: 56 },
  { number: 75, name: "Al-Qiyama", bangla: "আল-ক্বিয়ামাহ", ayahs: 40 },
  { number: 76, name: "Al-Insaan", bangla: "আদ-দাহর / আল-ইনসান", ayahs: 31 },
  { number: 77, name: "Al-Mursalaat", bangla: "আল-মুরসালাত", ayahs: 50 },
  { number: 78, name: "An-Naba", bangla: "আন-নাবা", ayahs: 40 },
  { number: 79, name: "An-Nazi'aat", bangla: "আন-নাযিআত", ayahs: 46 },
  { number: 80, name: "Abasa", bangla: "আবাসা", ayahs: 42 },
  { number: 81, name: "At-Takweer", bangla: "আত-তাকবীর", ayahs: 29 },
  { number: 82, name: "Al-Infitar", bangla: "আল-ইনফিতার", ayahs: 19 },
  { number: 83, name: "Al-Mutaffifeen", bangla: "আল-মুতাফফিফীন", ayahs: 36 },
  { number: 84, name: "Al-Inshiqaq", bangla: "আল-ইনশিক্বাক্ব", ayahs: 25 },
  { number: 85, name: "Al-Burooj", bangla: "আল-বুরূজ", ayahs: 22 },
  { number: 86, name: "At-Tariq", bangla: "আত-ত্বারিক্ব", ayahs: 17 },
  { number: 87, name: "Al-A'la", bangla: "আল-আলা", ayahs: 19 },
  { number: 88, name: "Al-Ghashiya", bangla: "আল-গাশিয়াহ", ayahs: 26 },
  { number: 89, name: "Al-Fajr", bangla: "আল-ফজর", ayahs: 30 },
  { number: 90, name: "Al-Balad", bangla: "আল-বালাদ", ayahs: 20 },
  { number: 91, name: "Ash-Shams", bangla: "আশ-শামস", ayahs: 15 },
  { number: 92, name: "Al-Lail", bangla: "আল-লায়ল", ayahs: 21 },
  { number: 93, name: "Ad-Duha", bangla: "আদ-দুহা", ayahs: 11 },
  { number: 94, name: "Ash-Sharh", bangla: "আল-ইনশিরাহ", ayahs: 8 },
  { number: 95, name: "At-Tin", bangla: "আত-তীন", ayahs: 8 },
  { number: 96, name: "Al-Alaq", bangla: "আল-আলাক", ayahs: 19 },
  { number: 97, name: "Al-Qadr", bangla: "আল-ক্বদর", ayahs: 5 },
  { number: 98, name: "Al-Bayyina", bangla: "আল-বাইয়্যিনাহ", ayahs: 8 },
  { number: 99, name: "Az-Zalzala", bangla: "আয-যালযালাহ", ayahs: 8 },
  { number: 100, name: "Al-Aadiyaat", bangla: "আল-আদিয়াত", ayahs: 11 },
  { number: 101, name: "Al-Qari'a", bangla: "আল-কারিয়াহ", ayahs: 11 },
  { number: 102, name: "At-Takathur", bangla: "আত-তাকাসুর", ayahs: 8 },
  { number: 103, name: "Al-Asr", bangla: "আল-আসর", ayahs: 3 },
  { number: 104, name: "Al-Humaza", bangla: "আল-হুমাযাহ", ayahs: 9 },
  { number: 105, name: "Al-Feel", bangla: "আল-ফীল", ayahs: 5 },
  { number: 106, name: "Quraish", bangla: "কুরাইশ", ayahs: 4 },
  { number: 107, name: "Al-Maa'oon", bangla: "আল-মাউন", ayahs: 7 },
  { number: 108, name: "Al-Kawthar", bangla: "আল-কাওসার", ayahs: 3 },
  { number: 109, name: "Al-Kafiroon", bangla: "আল-কাফিরুন", ayahs: 6 },
  { number: 110, name: "An-Nasr", bangla: "আন-নাসর", ayahs: 3 },
  { number: 111, name: "Al-Masad", bangla: "আল-লাহাব / আল-মাসাদ", ayahs: 5 },
  { number: 112, name: "Al-Ikhlaas", bangla: "আল-ইখলাস", ayahs: 4 },
  { number: 113, name: "Al-Falaq", bangla: "আল-ফালাক", ayahs: 5 },
  { number: 114, name: "An-Naas", bangla: "আন-নাস", ayahs: 6 },
];

type TafsirSource = {
  _id?: string;
  id?: string;
  sourceId: string;
  name: string;
  author_name: string;
  language_name?: string;
  language: string;
  description?: string;
  order?: number;
  published: boolean;
  managed?: boolean;
  external?: boolean;
};

type TafsirCommentary = {
  id?: string;
  _id?: string;
  sourceId: string;
  sourceName?: string;
  authorName?: string;
  language: string;
  surahNumber: number;
  ayahNumber: number;
  surahName?: string;
  title?: string;
  pronunciation?: string;
  text: string;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const blankForm: TafsirCommentary = {
  id: "",
  sourceId: "165",
  sourceName: "Tafsir Ahsanul Bayaan (তাফসীর আহসানুল বায়ান)",
  authorName: "Bayaan Foundation / Salahuddin Yusuf",
  language: "bn",
  surahNumber: 1,
  ayahNumber: 1,
  surahName: "Al-Faatiha",
  title: "",
  pronunciation: "",
  text: "",
  published: true,
};

const cleanSnippet = (value: string) =>
  String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);

const previewHtml = (value: string) => {
  const raw = String(value || "").trim();
  if (!raw) return "<p class=\"emptyPreview\">Start writing to see the live preview.</p>";
  const looksLikeHtml = /<(?:p|h[1-4]|ul|ol|li|blockquote|strong|em|br)\b/i.test(raw);
  const html = looksLikeHtml
    ? raw
    : raw
        .split(/\n{2,}/)
        .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
        .join("");
  return html
    .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(?:href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, "");
};

const arrangeTafsirHtml = (value: string) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/<(?:h[1-4]|ul|ol|li|blockquote)\b/i.test(raw)) return raw;
  const plain = cleanSnippet(raw);
  const parts = plain.split(/(?=\b\d+\.\s+)/).map((part) => part.trim()).filter(Boolean);
  const numbered = parts.filter((part) => /^\d+\.\s+/.test(part));
  if (!numbered.length) {
    return plain
      .split(/\n{2,}/)
      .filter(Boolean)
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join("");
  }
  const introduction = parts.filter((part) => !/^\d+\.\s+/.test(part)).join(" ");
  const list = numbered
    .map((part) => `<li><p>${escapeHtml(part.replace(/^\d+\.\s+/, ""))}</p></li>`)
    .join("");
  return `${introduction ? `<p>${escapeHtml(introduction)}</p>` : ""}<ol>${list}</ol>`;
};

const readableTafsirText = (value: string) =>
  String(value || "")
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_list, body: string) => {
      let number = 0;
      return body.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_item: string, text: string) => `\n${++number}. ${text}\n`);
    })
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_list, body: string) =>
      body.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_item: string, text: string) => `\n• ${text}\n`),
    )
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|h[1-4]|blockquote|div)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const tafsirPreviewParts = (value: string) =>
  readableTafsirText(value)
    .split(/(?=\b\d+\.\s+)/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const numbered = part.match(/^(\d+)\.\s*([\s\S]*)$/);
      return numbered ? { number: numbered[1], text: numbered[2].trim() } : { number: "", text: part };
    });

export default function TafsirManager() {
  const [token, setToken] = useState("");
  const [sources, setSources] = useState<TafsirSource[]>([]);
  const [items, setItems] = useState<TafsirCommentary[]>([]);
  const [form, setForm] = useState<TafsirCommentary>(blankForm);
  const [language, setLanguage] = useState("bn");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [contentView, setContentView] = useState<"editor" | "app" | "web">("editor");
  const [loadingItems, setLoadingItems] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters for saved commentaries
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterSurah, setFilterSurah] = useState("");
  const [libraryView, setLibraryView] = useState<"surahs" | "saved">("surahs");
  const [librarySurah, setLibrarySurah] = useState<number | null>(null);

  // Bulk paste drawer state
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkStartAyah, setBulkStartAyah] = useState(1);
  const [bulkText, setBulkText] = useState("");

  // Manage books state
  const [booksOpen] = useState(false);
  const [newBook, setNewBook] = useState<TafsirSource>({
    sourceId: "",
    name: "",
    author_name: "",
    language: "bn",
    language_name: "bengali",
    description: "",
    order: 21,
    published: true,
  });

  useEffect(() => {
    setToken(sessionStorage.getItem("deenislam_admin_token") || "");
  }, []);

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  });

  // Load sources
  const loadSources = async () => {
    if (!token) return;
    try {
      const [managedResult, libraryResult] = await Promise.allSettled([
        fetch(API + "/api/admin/tafsir/sources", { headers: headers() }).then(async (res) => {
          const body = await res.json();
          if (!res.ok) throw new Error(body.message || "Unable to load managed Tafsir books.");
          return body;
        }),
        fetch(API + "/api/tafsir/sources?language=en").then(async (res) => {
          const body = await res.json();
          if (!res.ok) throw new Error(body.message || "Unable to load the public Tafsir library.");
          return body;
        }),
      ]);
      const managed = managedResult.status === "fulfilled" && Array.isArray(managedResult.value.data)
        ? managedResult.value.data.map((item: TafsirSource) => ({ ...item, managed: true }))
        : [];
      const library = libraryResult.status === "fulfilled" && Array.isArray(libraryResult.value.data)
        ? libraryResult.value.data
        : [];
      const merged = new Map<string, TafsirSource>();
      [...library, ...managed].forEach((item: TafsirSource) => {
        const key = String(item.sourceId || item.id || "");
        if (key) merged.set(key, { ...item, sourceId: key, published: item.published !== false });
      });
      const nextSources = Array.from(merged.values());
      if (!nextSources.length) throw new Error("No Tafsir books were returned by the server.");
      setSources(nextSources);
      setForm((current) => {
        if (nextSources.some((item) => item.sourceId === current.sourceId)) return current;
        const first = nextSources.find((item) => item.language === language) || nextSources[0];
        return {
          ...current,
          sourceId: first.sourceId,
          sourceName: first.name,
          authorName: first.author_name,
          language: first.language || language,
        };
      });
    } catch {
      setMessage("Unable to load the shared mobile Tafsir library.");
    }
  };

  // Load commentaries
  const loadCommentaries = async (requestedPage = page) => {
    if (!token) return;
    setLoadingItems(true);
    try {
      const params = new URLSearchParams({ page: String(requestedPage), limit: "50" });
      if (search.trim()) params.set("search", search.trim());
      if (filterSource) params.set("sourceId", filterSource);
      if (filterSurah) params.set("surahNumber", filterSurah);
      const res = await fetch(API + `/api/admin/tafsir?${params.toString()}`, { headers: headers() });
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setItems(json.data);
        setTotalItems(Number(json.pagination?.total) || json.data.length);
        setTotalPages(Math.max(1, Number(json.pagination?.pages) || 1));
      } else {
        setMessage(json.message || "Unable to load commentaries.");
      }
    } catch {
      setMessage("Unable to load commentaries from server.");
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (token) {
      void loadSources();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => void loadCommentaries(page), 250);
    return () => window.clearTimeout(timer);
  }, [token, page, search, filterSource, filterSurah]);

  // Selected surah details
  const selectedSurah = useMemo(
    () => SURAHS.find((s) => s.number === form.surahNumber) || SURAHS[0],
    [form.surahNumber]
  );

  // When language changes via AdminLanguagePicker
  const handleLanguageChange = (code: string) => {
    setLanguage(code);
    // Find first book matching that language or keep current
    const matchingBook = sources.find(
      (s) => s.language === code || s.language_name?.toLowerCase() === code
    );
    if (matchingBook) {
      setForm((prev) => ({
        ...prev,
        language: code,
        sourceId: matchingBook.sourceId || matchingBook.id || prev.sourceId,
        sourceName: matchingBook.name,
        authorName: matchingBook.author_name,
      }));
    } else {
      setForm((prev) => ({ ...prev, language: code }));
    }
  };

  // When source book changes
  const handleSourceSelect = (sourceId: string) => {
    const s = sources.find((x) => (x.sourceId || x.id) === sourceId);
    if (s) {
      setForm((prev) => ({
        ...prev,
        sourceId: s.sourceId || s.id || sourceId,
        sourceName: s.name,
        authorName: s.author_name,
        language: s.language || prev.language,
      }));
      if (s.language && s.language !== language) {
        setLanguage(s.language);
      }
    } else {
      setForm((prev) => ({ ...prev, sourceId }));
    }
  };

  // When surah changes
  const handleSurahChange = (num: number) => {
    const s = SURAHS.find((x) => x.number === num) || SURAHS[0];
    setLibrarySurah(num);
    setFilterSurah(String(num));
    setForm((prev) => ({
      ...prev,
      surahNumber: num,
      surahName: s.name,
      ayahNumber: Math.min(prev.ayahNumber, s.ayahs),
    }));
    setBulkStartAyah(1);
  };

  const loadMobileCommentary = async (targetSurah = form.surahNumber, targetAyah = form.ayahNumber) => {
    setSaving(true);
    setMessage("");
    try {
      const params = new URLSearchParams({ sourceId: form.sourceId, language });
      const res = await fetch(API + `/api/tafsir/by_ayah/${targetSurah}/${targetAyah}?${params.toString()}`);
      const body = await res.json();
      if (!res.ok || !body.data?.text) throw new Error(body.message || "Tafsir is unavailable for this Ayah.");
      setForm((current) => ({
        ...current,
        surahNumber: targetSurah,
        ayahNumber: targetAyah,
        surahName: SURAHS.find((item) => item.number === targetSurah)?.name || current.surahName,
        id: body.data.managed ? body.data.id : "",
        sourceName: body.data.sourceName || current.sourceName,
        authorName: body.data.authorName || current.authorName,
        title: body.data.title || "",
        pronunciation: body.data.pronunciation || "",
        text: arrangeTafsirHtml(body.data.text),
        published: true,
      }));
      setMessage(body.data.managed
        ? "Saved Admin Tafsir loaded. You can edit and update it."
        : "Mobile library Tafsir loaded from Quran.com. Edit and save to create an Admin-managed version.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to load this Tafsir.");
    } finally {
      setSaving(false);
    }
  };

  // Choose item for editing
  const choose = (item: TafsirCommentary) => {
    setForm({
      id: item.id || item._id,
      sourceId: item.sourceId || "165",
      sourceName: item.sourceName || "",
      authorName: item.authorName || "",
      language: item.language || "bn",
      surahNumber: item.surahNumber || 1,
      ayahNumber: item.ayahNumber || 1,
      surahName: item.surahName || `Surah ${item.surahNumber}`,
      title: item.title || "",
      pronunciation: item.pronunciation || "",
      text: arrangeTafsirHtml(item.text || ""),
      published: item.published !== false,
    });
    if (item.language && item.language !== language) {
      setLanguage(item.language);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Save single commentary
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.text.trim()) {
      setMessage("Please enter commentary text.");
      return;
    }
    setSaving(true);
    try {
      const url = form.id ? API + `/api/admin/tafsir/${form.id}` : API + "/api/admin/tafsir";
      const method = form.id ? "PUT" : "POST";
      const payload = {
        ...form,
        language,
        surahName: selectedSurah.name,
      };

      const res = await fetch(url, {
        method,
        headers: headers(),
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message);

      setMessage(`Tafsir for Surah ${form.surahNumber}:${form.ayahNumber} saved successfully. App & Web will reflect this.`);
      setForm({
        ...blankForm,
        sourceId: form.sourceId,
        sourceName: form.sourceName,
        authorName: form.authorName,
        language,
        surahNumber: form.surahNumber,
        surahName: selectedSurah.name,
        ayahNumber: Math.min(form.ayahNumber + 1, selectedSurah.ayahs),
      });
      await loadCommentaries();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to save commentary.");
    } finally {
      setSaving(false);
    }
  };

  // Delete commentary
  const remove = async (item: TafsirCommentary) => {
    const id = item.id || item._id;
    if (!id) return;
    if (!confirm(`Delete commentary for Surah ${item.surahNumber}:${item.ayahNumber}?`)) return;
    try {
      const res = await fetch(API + `/api/admin/tafsir/${id}`, {
        method: "DELETE",
        headers: headers(),
      });
      const body = await res.json();
      setMessage(res.ok ? "Commentary deleted." : body.message);
      if (res.ok) await loadCommentaries();
    } catch {
      setMessage("Unable to delete commentary.");
    }
  };

  // Quick bulk upload
  const handleBulkUpload = async () => {
    if (!bulkText.trim()) return;
    setSaving(true);
    try {
      // Split by '---' delimiter or double blank lines
      const blocks = bulkText.includes("---")
        ? bulkText.split(/\n\s*---\s*\n/)
        : bulkText.split(/\n\s*\n\s*\n/);

      const itemsToUpload = blocks
        .map((chunk, idx) => ({
          sourceId: form.sourceId,
          sourceName: form.sourceName,
          authorName: form.authorName,
          language,
          surahNumber: form.surahNumber,
          surahName: selectedSurah.name,
          ayahNumber: bulkStartAyah + idx,
          title: `Tafsir Ayah ${bulkStartAyah + idx}`,
          text: chunk.trim(),
          published: true,
        }))
        .filter((item) => item.text.length > 0 && item.ayahNumber <= selectedSurah.ayahs);

      if (!itemsToUpload.length) {
        setMessage("No valid Ayah commentary chunks found.");
        return;
      }

      const res = await fetch(API + "/api/admin/tafsir/bulk", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ items: itemsToUpload }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message);

      setMessage(`${itemsToUpload.length} Ayah commentaries successfully uploaded to Surah ${form.surahNumber}!`);
      setBulkText("");
      setBulkOpen(false);
      await loadCommentaries();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Bulk upload failed.");
    } finally {
      setSaving(false);
    }
  };

  // Add custom book
  const handleCreateBook = async (e: FormEvent) => {
    e.preventDefault();
    if (!newBook.sourceId.trim() || !newBook.name.trim()) {
      setMessage("Book ID and Name are required.");
      return;
    }
    setSaving(true);
    try {
      const editingId = newBook.id || newBook._id;
      const res = await fetch(API + (editingId ? `/api/admin/tafsir/sources/${editingId}` : "/api/admin/tafsir/sources"), {
        method: editingId ? "PUT" : "POST",
        headers: headers(),
        body: JSON.stringify(newBook),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message);
      setMessage(`Tafsir Book '${newBook.name}' ${editingId ? "updated" : "created"} successfully.`);
      setNewBook({
        sourceId: "",
        name: "",
        author_name: "",
        language: "bn",
        language_name: "bengali",
        description: "",
        order: sources.length + 1,
        published: true,
      });
      await loadSources();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to create Tafsir book.");
    } finally {
      setSaving(false);
    }
  };

  const editBook = (book: TafsirSource) => {
    if (!book.id && !book._id) {
      setMessage("This external source can be selected for Tafsir, but only Admin-managed books can be edited.");
      return;
    }
    setNewBook({ ...book, published: book.published !== false });
    window.setTimeout(() => document.getElementById("tafsir-book-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const resetBookForm = () => setNewBook({
    sourceId: "", name: "", author_name: "", language: "bn", language_name: "bengali",
    description: "", order: sources.length + 1, published: true,
  });

  const publishedOnPage = items.filter((item) => item.published !== false).length;
  const languagesOnPage = new Set(items.map((item) => item.language).filter(Boolean)).size;

  return (
    <main>
      <header>
        <div>
          <Link href="/">‹ Dashboard</Link>
          <small>SHARED APP + WEB CONTENT</small>
          <h1>Tafsir Manager</h1>
          <p>View the complete mobile Tafsir library and manage commentary for all 114 Surahs across App & Web.</p>
        </div>
        <b>
          {totalItems}
          <span>commentaries</span>
        </b>
      </header>

      {message && <p className="message">{message}</p>}

      <section className="layout">
        {/* Left Column: Commentary Editor */}
        <form onSubmit={save} className="panel">
          <div className="head">
            <h2>{form.id ? "Edit commentary" : "New commentary"}</h2>
            <button disabled={saving}>{saving ? "Saving..." : "Save & publish"}</button>
          </div>

          <label>
            Content language
            <AdminLanguagePicker
              section="Tafsir"
              value={language}
              onChange={handleLanguageChange}
              statusFor={(code) =>
                sources.some((s) => s.language === code)
                  ? `${sources.filter((s) => s.language === code).length} book(s) available`
                  : "No book configured"
              }
              completeFor={(code) => sources.some((s) => s.language === code)}
            />
          </label>

          <label>
            Choose Tafsir Book ({sources.length} available)
            <select
              value={form.sourceId}
              onChange={(e) => handleSourceSelect(e.target.value)}
            >
              {sources.map((s) => (
                <option key={s.sourceId || s.id} value={s.sourceId || s.id}>
                  [{s.language?.toUpperCase() || (s.language_name || "").slice(0, 2).toUpperCase()}] {s.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid">
            <label>
              Surah (1–114)
              <select
                value={form.surahNumber}
                onChange={(e) => handleSurahChange(Number(e.target.value))}
              >
                {SURAHS.map((s) => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {s.name} ({s.bangla}) - {s.ayahs} Ayahs
                  </option>
                ))}
              </select>
            </label>

            <label>
              Ayah number (1–{selectedSurah.ayahs})
              <input
                type="number"
                min="1"
                max={selectedSurah.ayahs}
                required
                value={form.ayahNumber}
                onChange={(e) => setForm({ ...form, ayahNumber: Number(e.target.value) })}
              />
            </label>

            <label className="wide">
              Commentary title / Heading (optional)
              <input
                value={form.title || ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. বিসমিল্লাহির রাহমানির রাহীম এর তাফসীর"
              />
            </label>

            <label className="wide">
              Arabic pronunciation / transliteration (optional)
              <textarea
                value={form.pronunciation || ""}
                onChange={(e) => setForm({ ...form, pronunciation: e.target.value })}
                placeholder="e.g. Bismillaahir Rahmaanir Raheem"
                rows={2}
              />
              <small>Shown below the Arabic Ayah in both the mobile app and website. Leave empty to use the Quran library pronunciation.</small>
            </label>

            <label>
              Author / Scholar citation
              <input
                value={form.authorName || ""}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                placeholder="e.g. Bayaan Foundation / Dr. Muhammad Asadullah"
              />
            </label>

            <label>
              Book publication name
              <input
                value={form.sourceName || ""}
                onChange={(e) => setForm({ ...form, sourceName: e.target.value })}
                placeholder="e.g. Tafsir Ahsanul Bayaan"
              />
            </label>
          </div>

          <button className="loadMobile" type="button" disabled={saving || !form.sourceId} onClick={() => void loadMobileCommentary()}>
            Load existing Mobile Tafsir for {form.surahNumber}:{form.ayahNumber}
          </button>

          <section className="contentComposer">
            <div className="composerHead">
              <div>
                <b>Detailed commentary text</b>
                <small>Format once, then check how it will look before publishing.</small>
              </div>
              <nav aria-label="Commentary editor and previews">
                <button type="button" className={contentView === "editor" ? "active" : ""} onClick={() => setContentView("editor")}>Edit text</button>
                <button type="button" className={contentView === "app" ? "active" : ""} onClick={() => setContentView("app")}>App preview</button>
                <button type="button" className={contentView === "web" ? "active" : ""} onClick={() => setContentView("web")}>Web preview</button>
              </nav>
            </div>

            {contentView === "editor" ? <>
              <div className="formatGuide">
                <span><b>Title/Heading</b> section name</span>
                <span><b>Numbers</b> ordered explanation</span>
                <span><b>Bullets</b> key points</span>
                <span><b>Quote</b> highlighted evidence</span>
              </div>
              <RichTextEditor
                value={form.text}
                onChange={(value) => setForm({ ...form, text: value })}
                api={API}
                token={token}
                onMessage={setMessage}
                recordId={`tafsir:${form.sourceId}:${form.surahNumber}:${form.ayahNumber}`}
                autoArrange={arrangeTafsirHtml}
                showPreviewTabs={false}
              />
            </> : contentView === "app" ? (
              <div className="previewStage appStage">
                <div className="previewStatus">
                  <b>FULL APP CONTENT PREVIEW</b>
                  <span>{cleanSnippet(form.text).length.toLocaleString()} characters · click the text below to edit</span>
                </div>
                <div className="phonePreview">
                  <small>TAFSIR PREVIEW · {selectedSurah.name} {form.surahNumber}:{form.ayahNumber}</small>
                  <h2
                    className="editableTitle"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(event) => setForm((current) => ({ ...current, title: event.currentTarget.textContent?.trim() === "Explanation" ? "" : event.currentTarget.textContent?.trim() || "" }))}
                  >{form.title || "Explanation"}</h2>
                  <div
                    className="previewContent editablePreview appCommentaryPreview"
                    contentEditable
                    suppressContentEditableWarning
                    role="textbox"
                    aria-label="Edit app preview commentary"
                    onBlur={(event) => setForm((current) => ({ ...current, text: event.currentTarget.innerHTML }))}
                    dangerouslySetInnerHTML={{ __html: previewHtml(form.text) }}
                  />
                  <footer>Source: {form.sourceName || "Selected Tafsir book"}</footer>
                </div>
              </div>
            ) : (
              <div className="previewStage webStage">
                <article className="webPreview">
                  <div className="inlineEditNotice">EDITABLE PREVIEW · click the commentary text to edit</div>
                  <small>VERIFIED COMMENTARY · {selectedSurah.name} {form.surahNumber}:{form.ayahNumber}</small>
                  <h2
                    className="editableTitle"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(event) => setForm((current) => ({ ...current, title: event.currentTarget.textContent?.trim() === "Explanation" ? "" : event.currentTarget.textContent?.trim() || "" }))}
                  >{form.title || "Explanation"}</h2>
                  <div
                    className="previewContent editablePreview webCommentaryPreview"
                    contentEditable
                    suppressContentEditableWarning
                    role="textbox"
                    aria-label="Edit web preview commentary"
                    onBlur={(event) => setForm((current) => ({ ...current, text: event.currentTarget.innerHTML }))}
                    dangerouslySetInnerHTML={{ __html: previewHtml(form.text) }}
                  />
                  <footer>Source: {form.sourceName || "Selected Tafsir book"}</footer>
                </article>
              </div>
            )}
          </section>

          <label className="publish">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />{" "}
            Published in App and Web
          </label>

          {/* Quick Bulk Paste Accordion */}
          <div className="chapterHead">
            <h3>Quick bulk upload (Multiple Ayahs)</h3>
            <button type="button" onClick={() => setBulkOpen(!bulkOpen)}>
              {bulkOpen ? "Close bulk paste" : "+ Bulk paste"}
            </button>
          </div>

          {bulkOpen && (
            <article>
              <div className="chapterTop">
                <b>CONTINUOUS AYAHS PASTE</b>
              </div>
              <p style={{ fontSize: 11, color: "#596960", margin: "6px 0 10px" }}>
                Paste consecutive Ayah commentaries for Surah {form.surahNumber} ({selectedSurah.name}).
                Separate each Ayah commentary with <code>---</code> on a new line or 2 blank lines.
              </p>
              <div className="grid">
                <label>
                  Start from Ayah
                  <input
                    type="number"
                    min="1"
                    max={selectedSurah.ayahs}
                    value={bulkStartAyah}
                    onChange={(e) => setBulkStartAyah(Number(e.target.value))}
                  />
                </label>
              </div>
              <label>
                Commentary text (Ayah by Ayah)
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`Ayah ${bulkStartAyah} commentary...\n---\nAyah ${bulkStartAyah + 1} commentary...\n---\nAyah ${bulkStartAyah + 2} commentary...`}
                  style={{ minHeight: 140 }}
                />
              </label>
              <button
                type="button"
                disabled={saving || !bulkText.trim()}
                onClick={handleBulkUpload}
              >
                {saving ? "Uploading..." : `Upload to Surah ${form.surahNumber}`}
              </button>
            </article>
          )}

          {/* Manage Tafsir Books Section */}
          <div className="chapterHead" style={{ marginTop: 24 }}>
            <h3>Mobile Tafsir Books ({sources.length} sources)</h3>
            <Link className="manageBooksLink" href="/tafsir-books">Manage books on separate page →</Link>
          </div>

          {booksOpen && (
            <article>
              <div className="chapterTop">
                <b>ALL MOBILE APP & WEB TAFSIR SOURCES</b>
              </div>
              <div className="booksGrid">
                {sources.map((s) => (
                  <div key={s.sourceId || s.id} className="bookCard">
                    <div className="bookTitle"><b>{s.name}</b><em>{s.managed === false || s.external ? "Quran.com" : "Managed"}</em></div>
                    <small>
                      ID: <code>{s.sourceId}</code> · {s.language_name} ({s.language?.toUpperCase()})
                    </small>
                    <small style={{ color: "#718078" }}>Author: {s.author_name}</small>
                    <small style={{ color: "#087a4d" }}>Available for all 114 Surahs · select above to add or override data</small>
                    <button type="button" className="editBookButton" onClick={() => editBook(s)} disabled={!s.id && !s._id}>Edit book</button>
                  </div>
                ))}
              </div>

              <div id="tafsir-book-form" className="chapterTop" style={{ marginTop: 18 }}>
                <b>{newBook.id || newBook._id ? "EDIT TAFSIR BOOK" : "ADD NEW CUSTOM TAFSIR BOOK"}</b>
                {(newBook.id || newBook._id) && <button type="button" onClick={resetBookForm}>Cancel edit</button>}
              </div>
              <div className="grid">
                <label>
                  Unique Book ID (Slug or numeric)
                  <input
                    placeholder="e.g. 195 or bn-tafsir-jalalayn"
                    value={newBook.sourceId}
                    onChange={(e) => setNewBook({ ...newBook, sourceId: e.target.value })}
                  />
                </label>
                <label>
                  Book Name
                  <input
                    placeholder="e.g. Tafsir al-Jalalayn"
                    value={newBook.name}
                    onChange={(e) => setNewBook({ ...newBook, name: e.target.value })}
                  />
                </label>
                <label>
                  Author Name
                  <input
                    placeholder="e.g. Jalal al-Din al-Suyuti"
                    value={newBook.author_name}
                    onChange={(e) => setNewBook({ ...newBook, author_name: e.target.value })}
                  />
                </label>
                <label>
                  Language (195 available)
                  <AdminLanguagePicker
                    section="Tafsir Books"
                    value={newBook.language}
                    onChange={(code) => {
                      const selected = ADMIN_LANGUAGES.find((item) => item.code === code);
                      setNewBook({ ...newBook, language: code, language_name: (selected?.label || code).toLowerCase() });
                    }}
                    statusFor={(code) => {
                      const count = sources.filter((source) => source.language === code).length;
                      return count ? `${count} Tafsir book(s)` : "No Tafsir book yet";
                    }}
                    completeFor={(code) => sources.some((source) => source.language === code)}
                  />
                </label>
                <label className="wide">
                  Description
                  <textarea
                    placeholder="Brief description of this tafsir book..."
                    value={newBook.description || ""}
                    onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                    style={{ minHeight: 60 }}
                  />
                </label>
                <label className="publish wide">
                  <input type="checkbox" checked={newBook.published !== false} onChange={(e) => setNewBook({ ...newBook, published: e.target.checked })} />
                  Published in mobile app and web
                </label>
              </div>
              <button
                type="button"
                disabled={saving || !newBook.sourceId || !newBook.name}
                onClick={handleCreateBook}
              >
                {newBook.id || newBook._id ? "Update Tafsir Book" : "+ Add Tafsir Book"}
              </button>
            </article>
          )}
        </form>

        {/* Right Column: Saved Commentaries */}
        <section className="panel">
          <div className="head">
            <h2>{libraryView === "surahs" ? (librarySurah ? SURAHS.find((item) => item.number === librarySurah)?.name + " Ayahs" : "All Quran Surahs") : "Saved commentaries"}</h2>
            <b>{libraryView === "surahs" ? (librarySurah ? SURAHS.find((item) => item.number === librarySurah)?.ayahs : 114) : totalItems}</b>
          </div>

          <div className="viewTabs">
            <button type="button" className={libraryView === "surahs" ? "active" : ""} onClick={() => setLibraryView("surahs")}>All 114 Surahs</button>
            <button type="button" className={libraryView === "saved" ? "active" : ""} onClick={() => setLibraryView("saved")}>Added / Edited Data ({totalItems})</button>
          </div>

          {libraryView === "saved" && <div className="summaryGrid">
            <div><b>{totalItems}</b><small>Total added</small></div>
            <div><b>{publishedOnPage}</b><small>Published on this page</small></div>
            <div><b>{languagesOnPage}</b><small>Languages on this page</small></div>
          </div>}

          <div style={{ marginBottom: 14 }}>
            <input
              type="text"
              placeholder="Search by keywords, title, or surah..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ marginBottom: 8 }}
            />
            <div className="grid" style={{ marginTop: 0 }}>
              <select
                value={filterSource}
                onChange={(e) => { setFilterSource(e.target.value); if (e.target.value) handleSourceSelect(e.target.value); setPage(1); }}
              >
                <option value="">All Tafsir Books</option>
                {sources.map((s) => (
                  <option key={s.sourceId || s.id} value={s.sourceId || s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={filterSurah}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilterSurah(value);
                  setPage(1);
                  if (libraryView === "surahs") {
                    if (!value) {
                      setLibrarySurah(null);
                    } else {
                      const number = Number(value);
                      const selected = SURAHS.find((item) => item.number === number);
                      if (selected) {
                        setLibrarySurah(number);
                        handleSurahChange(number);
                        setForm((current) => ({
                          ...current,
                          id: "",
                          surahNumber: number,
                          surahName: selected.name,
                          ayahNumber: 1,
                          title: "",
                          pronunciation: "",
                          text: "",
                        }));
                      }
                    }
                  }
                }}
              >
                <option value="">All Surahs</option>
                {SURAHS.map((s) => (
                  <option key={s.number} value={s.number}>
                    {s.number}. {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {libraryView === "surahs" ? (
            <div className="surahLibrary">
              <div className="selectedLibrarySource">
                <small>SELECTED TAFSIR</small>
                <b>{sources.find((item) => (item.sourceId || item.id) === form.sourceId)?.name || form.sourceName}</b>
                <span>Mobile app library · {librarySurah ? `Surah ${librarySurah}` : "114 Surahs"}</span>
              </div>
              {librarySurah ? <>
                <button type="button" className="libraryBack" onClick={() => { setLibrarySurah(null); setFilterSurah(""); }}>‹ Back to all 114 Surahs</button>
                {Array.from({ length: SURAHS.find((item) => item.number === librarySurah)?.ayahs || 0 }, (_, index) => index + 1).map((ayahNumber) => (
                  <button
                    type="button"
                    key={ayahNumber}
                    className={form.surahNumber === librarySurah && form.ayahNumber === ayahNumber ? "surahRow selected" : "surahRow"}
                    onClick={() => { setForm((current) => ({ ...current, surahNumber: librarySurah, surahName: SURAHS.find((item) => item.number === librarySurah)?.name || current.surahName, ayahNumber, id: "", text: "", title: "", pronunciation: "" })); void loadMobileCommentary(librarySurah, ayahNumber); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  >
                    <span>{ayahNumber}</span>
                    <div><b>Ayah {ayahNumber}</b><small>Open existing mobile Tafsir commentary</small></div>
                    <em>Load ›</em>
                  </button>
                ))}
              </> : SURAHS.filter((surah) => {
                if (filterSurah && String(surah.number) !== filterSurah) return false;
                const query = search.trim().toLowerCase();
                return !query || `${surah.number} ${surah.name} ${surah.bangla}`.toLowerCase().includes(query);
              }).map((surah) => (
                <button
                  type="button"
                  key={surah.number}
                  className={form.surahNumber === surah.number ? "surahRow selected" : "surahRow"}
                  onClick={() => { handleSurahChange(surah.number); setLibrarySurah(surah.number); setFilterSurah(String(surah.number)); setForm((current) => ({ ...current, surahNumber: surah.number, surahName: surah.name, ayahNumber: 1, id: "", text: "", title: "" })); }}
                >
                  <span>{surah.number}</span>
                  <div><b>{surah.name}</b><small>{surah.bangla} · {surah.ayahs} Ayahs</small></div>
                  <em>Open ›</em>
                </button>
              ))}
            </div>
          ) : <div className="savedContainer">
            {loadingItems ? (
              <p className="emptyState">Loading saved Tafsir data...</p>
            ) : items.length === 0 ? (
              <p style={{ color: "#718078", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
                No commentaries match your search. Select a Tafsir book or Surah, or create one on the left.
              </p>
            ) : (
              items.map((item) => (
                <article className="saved" key={item.id || item._id}>
                  <div style={{ flex: 1, paddingRight: 10 }}>
                    <b>
                      Surah {item.surahName || item.surahNumber}:{item.ayahNumber}
                      {item.title ? ` · ${item.title}` : ""}
                    </b>
                    <small>
                      {item.sourceName || item.sourceId} · {item.language?.toUpperCase()} ·{" "}
                      {item.published !== false ? "Published" : "Draft"}
                    </small>
                    <small>
                      Added {item.createdAt ? new Date(item.createdAt).toLocaleString() : "date unavailable"}
                      {item.updatedAt ? ` · Updated ${new Date(item.updatedAt).toLocaleString()}` : ""}
                    </small>
                    <p
                      style={{
                        margin: "5px 0 0",
                        fontSize: 11,
                        color: "#46584e",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {cleanSnippet(item.text)}
                    </p>
                  </div>
                  <nav>
                    <button type="button" onClick={() => choose(item)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => void remove(item)}
                    >
                      Delete
                    </button>
                  </nav>
                </article>
              ))
            )}
          </div>}
          {libraryView === "saved" && <div className="pagination">
            <button type="button" disabled={page <= 1 || loadingItems} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
            <span>Page <b>{page}</b> of <b>{totalPages}</b> · {totalItems} record(s)</span>
            <button type="button" disabled={page >= totalPages || loadingItems} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button>
          </div>}
        </section>
      </section>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }
        main {
          min-height: 100vh;
          padding: 28px;
          background: #f3f8f4;
          color: #173d2e;
          font-family: Arial, sans-serif;
        }
        header {
          max-width: 1450px;
          margin: auto;
          padding: 25px 28px;
          border-radius: 22px;
          background: #075b3b;
          color: #fff;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        header a {
          color: #d9eee1;
          text-decoration: none;
          font-size: 13px;
        }
        header small {
          display: block;
          margin-top: 8px;
          color: #e4c866;
          font-weight: 900;
          letter-spacing: 0.8px;
        }
        header h1 {
          margin: 5px 0;
          font-size: 26px;
        }
        header p {
          margin: 0;
          font-size: 13px;
          color: #d9eee1;
        }
        header > b {
          font-size: 30px;
          text-align: center;
        }
        header > b span {
          display: block;
          font-size: 10px;
          font-weight: 400;
        }
        .message {
          max-width: 1450px;
          margin: 12px auto;
          padding: 12px 16px;
          border-radius: 10px;
          background: #dff2e5;
          color: #075b3b;
          font-weight: 700;
          font-size: 13px;
        }
        .layout {
          max-width: 1450px;
          margin: 18px auto;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 18px;
        }
        .panel {
          padding: 21px;
          border: 1px solid #d8e7dc;
          border-radius: 20px;
          background: #fff;
        }
        .head,
        .chapterHead,
        .chapterTop,
        .saved {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .head {
          margin-bottom: 16px;
        }
        .head h2 {
          margin: 0;
          font-size: 18px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 11px;
          margin-top: 13px;
        }
        .wide {
          grid-column: 1 / -1;
        }
        label {
          display: block;
          margin-bottom: 11px;
          font-size: 11px;
          font-weight: 800;
        }
        input,
        select,
        textarea {
          width: 100%;
          margin-top: 6px;
          padding: 11px;
          border: 1px solid #cdded2;
          border-radius: 9px;
          background: #fcfefc;
          font-size: 13px;
          color: #173d2e;
        }
        textarea {
          min-height: 90px;
          font-family: inherit;
        }
        button {
          border: 0;
          border-radius: 9px;
          padding: 10px 14px;
          background: #087a4d;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
          font-size: 12px;
          transition: opacity 0.2s;
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .chapterHead {
          margin: 20px 0 10px;
        }
        .chapterHead h3 {
          margin: 0;
          font-size: 14px;
        }
        .manageBooksLink { padding: 10px 14px; border-radius: 9px; background: #087a4d; color: #fff; text-decoration: none; font-size: 12px; font-weight: 800; }
        .panel > article:not(.saved) {
          margin-bottom: 12px;
          padding: 14px;
          border: 1px solid #d9e7dd;
          border-radius: 14px;
          background: #f8fbf9;
        }
        .chapterTop b {
          color: #a27f24;
          font-size: 10px;
          letter-spacing: 0.5px;
        }
        .chapterTop button,
        .danger {
          background: #b54d3d;
        }
        .publish {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 14px;
          cursor: pointer;
        }
        .loadMobile { width: 100%; margin-top: 13px; background: #e4f3e9; color: #075b3b; border: 1px solid #bad8c5; }
        .contentComposer { margin-top: 14px; }
        .composerHead { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
        .composerHead b, .composerHead small { display: block; }
        .composerHead>b { font-size: 12px; }
        .composerHead small { margin-top: 4px; color: #718078; font-size: 10px; }
        .composerHead nav { display: flex; gap: 5px; padding: 4px; border-radius: 11px; background: #edf4ef; }
        .composerHead nav button { padding: 8px 11px; background: transparent; color: #527064; }
        .composerHead nav button.active { background: #087a4d; color: #fff; box-shadow: 0 4px 10px rgba(8,122,77,.18); }
        .formatGuide { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; margin-bottom: 9px; }
        .formatGuide span { padding: 8px 9px; border: 1px solid #d9e7dd; border-radius: 9px; background: #f7fbf8; color: #63746b; font-size: 9px; line-height: 1.4; }
        .formatGuide b { display: block; color: #087a4d; font-size: 10px; }
        .previewStage { width: 100%; min-height: 520px; height: auto; padding: 24px; display: grid; place-items: start center; align-content: start; border: 1px solid #cdded2; border-radius: 14px; background: #edf4ef; overflow: visible; }
        .appStage { gap: 12px; }
        .previewStatus { width: min(560px, 100%); display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 13px; border: 1px solid #c9ddcf; border-radius: 10px; background: #fff; }
        .previewStatus b { color: #087a4d; font-size: 9px; letter-spacing: .7px; }
        .previewStatus span { color: #718078; font-size: 9px; text-align: right; }
        .inlineEditNotice { margin-bottom: 13px; padding: 8px 11px; border-radius: 9px; background: #e8f4ec; color: #087a4d; font-size: 9px; font-weight: 900; letter-spacing: .5px; }
        .phonePreview { width: min(560px, 100%); height: auto; min-height: 470px; max-height: none; padding: 24px 22px 32px; border: 8px solid #17221d; border-radius: 32px; background: #fff; box-shadow: 0 18px 40px rgba(12,45,32,.18); overflow: visible; }
        .phonePreview>small, .webPreview>small { color: #087a4d; font-size: 9px; font-weight: 900; letter-spacing: .8px; }
        .phonePreview h2, .webPreview h2 { margin: 8px 0 13px; padding-bottom: 10px; border-bottom: 1px solid #dce8df; color: #173d2e; font-family: Georgia,serif; }
        .phonePreview h2 { font-size: 23px; }
        .webStage { place-items: start stretch; }
        .webPreview { width: 100%; min-height: 440px; padding: 27px; border: 1px solid #d3e2d7; border-radius: 16px; background: #fff; }
        .webPreview h2 { font-size: 27px; }
        .previewContent { width: 100%; height: auto; max-height: none; color: #263f34; font: 16px/1.75 Arial,sans-serif; overflow: visible; overflow-wrap: anywhere; white-space: normal; }
        .editablePreview { min-height: 180px; padding: 12px; border: 1px dashed transparent; border-radius: 11px; outline: none; cursor: text; transition: border-color .18s, background .18s, box-shadow .18s; }
        .editablePreview:hover { border-color: #a8ceb5; background: #f8fcf9; }
        .editablePreview:focus { border-color: #087a4d; background: #fff; box-shadow: 0 0 0 3px rgba(8,122,77,.12); }
        .editableTitle { border-radius: 7px; outline: none; cursor: text; }
        .editableTitle:hover { background: #f2f8f4; }
        .editableTitle:focus { background: #fff8df; box-shadow: 0 0 0 3px rgba(195,155,45,.15); }
        .appCommentaryPreview { font-size: 16px; line-height: 1.58; }
        .appPreviewIntro { margin: 0 0 20px !important; color: #34473f; }
        .appPreviewPoint { display: grid; grid-template-columns: 25px minmax(0,1fr); gap: 4px; align-items: start; margin-bottom: 14px; }
        .appPreviewPoint>b { color: #34473f !important; font-size: 16px; line-height: 1.58; }
        .appPreviewPoint>p { margin: 0 !important; color: #34473f; font-size: 16px; line-height: 1.58; }
        .webCommentaryPreview { display: grid; gap: 9px; margin-top: 14px; }
        .webPreviewIntro { margin: 0 0 4px !important; color: #33453d; font-size: 18px; line-height: 1.75; }
        .webPreviewPoint { display: grid; grid-template-columns: 24px minmax(0,1fr); gap: 5px; align-items: start; }
        .webPreviewPoint>b { color: #087846 !important; font-size: 17px; line-height: 1.7; }
        .webPreviewPoint>p { margin: 0 !important; color: #33453d; font-size: 17px; line-height: 1.7; }
        .previewContent :global(p) { margin: 8px 0 13px; }
        .previewContent :global(h1), .previewContent :global(h2), .previewContent :global(h3), .previewContent :global(h4) { margin: 22px 0 10px; color: #075b3b; line-height: 1.3; }
        .previewContent :global(h1) { font-size: 32px; }.previewContent :global(h2) { font-size: 27px; }.previewContent :global(h3) { font-size: 21px; }.previewContent :global(h4) { font-size: 17px; }
        .previewContent :global(strong) { color: #173d2e; font-weight: 800; }
        .previewContent :global(em) { display: inline; margin: 0; color: inherit; font-size: inherit; line-height: inherit; font-style: italic; }
        .previewContent :global(ul), .previewContent :global(ol) { display: block; margin: 12px 0; padding-left: 30px; }
        .previewContent :global(ul) { list-style-type: disc; }.previewContent :global(ol) { list-style-type: decimal; }
        .previewContent :global(li) { display: list-item; margin: 6px 0; padding-left: 4px; }.previewContent :global(li::marker) { color: #087a4d; font-weight: 800; }.previewContent :global(li p) { display: inline; margin: 0; }
        .previewContent :global(span[data-selection-style]) { display: inline; color: #075b3b; font-weight: 800; line-height: 1.3; }
        .previewContent :global(span[data-selection-style="heading1"]) { font-size: 2em; }.previewContent :global(span[data-selection-style="heading2"]) { font-size: 1.65em; }.previewContent :global(span[data-selection-style="heading3"]) { font-size: 1.35em; }.previewContent :global(span[data-selection-style="heading4"]) { font-size: 1.12em; }
        .previewContent :global(span[data-inline-quote]) { display: inline; padding: 2px 5px; border-radius: 5px; background: #fff8df; color: #5c5132; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
        .previewContent :global(span[data-inline-quote][data-tone="green"]) { background: #eaf8ef; color: #28533d; }.previewContent :global(span[data-inline-quote][data-tone="blue"]) { background: #edf6ff; color: #294b68; }.previewContent :global(span[data-inline-quote][data-tone="rose"]) { background: #fff0f2; color: #684047; }.previewContent :global(span[data-inline-quote][data-tone="red"]) { background: #fff0f0; color: #a12626; }
        .previewContent :global(blockquote) { display: block; margin: 18px 0; padding: 18px 20px; border: 1px solid #ead99b; border-left: 5px solid #d0ad45; border-radius: 14px; background: #fff8df; color: #5c5132; box-shadow: 0 5px 18px rgba(74,62,26,.08); }.previewContent :global(blockquote p) { margin: 0; }
        .previewContent :global(blockquote[data-tone="green"]) { border-color: #bfe5ce; border-left-color: #27a36a; background: #eaf8ef; color: #28533d; }.previewContent :global(blockquote[data-tone="blue"]) { border-color: #c5dcf1; border-left-color: #4285c5; background: #edf6ff; color: #294b68; }.previewContent :global(blockquote[data-tone="rose"]) { border-color: #f0cbd1; border-left-color: #ce6b78; background: #fff0f2; color: #684047; }.previewContent :global(blockquote[data-tone="red"]) { border-color: #f1c4c4; border-left-color: #d84343; background: #fff0f0; color: #742d2d; }
        .previewContent :global(img) { display: block; max-width: 100%; height: auto; margin: 18px auto; border-radius: 14px; box-shadow: 0 5px 18px rgba(23,61,46,.18); }
        .previewContent :global(a) { color: #087a4d; font-weight: 700; text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 3px; }
        .previewContent :global(.emptyPreview) { color: #87948d; text-align: center; }
        .phonePreview footer, .webPreview footer { margin-top: 22px; padding-top: 13px; border-top: 1px solid #dce8df; color: #668077; font-size: 10px; }
        .publish input {
          width: auto;
          margin: 0;
        }
        .saved {
          padding: 14px 0;
          border-bottom: 1px solid #e5ede7;
        }
        .saved b {
          font-size: 13.5px;
          color: #133d2e;
        }
        .saved small {
          display: block;
          margin-top: 4px;
          color: #718078;
          font-size: 11px;
        }
        .saved nav {
          display: flex;
          gap: 6px;
        }
        .booksGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin: 10px 0;
          max-height: 260px;
          overflow-y: auto;
        }
        .bookCard {
          padding: 8px 10px;
          border: 1px solid #dbe6dd;
          border-radius: 9px;
          background: #fff;
        }
        .bookCard b {
          display: block;
          font-size: 11.5px;
          color: #075b3b;
        }
        .bookTitle { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
        .bookTitle em { flex: none; padding: 3px 6px; border-radius: 8px; background: #e7f4eb; color: #087a4d; font-size: 8px; font-style: normal; font-weight: 800; }
        .bookCard small {
          display: block;
          font-size: 10px;
          margin-top: 2px;
        }
        .editBookButton { width: 100%; margin-top: 7px; padding: 7px; background: #e7f3eb; color: #087a4d; }
        .savedContainer {
          max-height: 750px;
          overflow-y: auto;
          padding-right: 5px;
        }
        .summaryGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: -5px 0 14px; }
        .summaryGrid div { padding: 11px; border: 1px solid #d8e7dc; border-radius: 11px; background: #f4faf6; }
        .summaryGrid b, .summaryGrid small { display: block; }
        .summaryGrid b { color: #087a4d; font-size: 18px; }
        .summaryGrid small { margin-top: 2px; color: #718078; font-size: 9px; }
        .emptyState { padding: 24px 0; text-align: center; color: #718078; }
        .pagination { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-top: 14px; font-size: 11px; color: #596960; }
        .viewTabs { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-bottom: 14px; padding: 5px; border-radius: 12px; background: #edf4ef; }
        .viewTabs button { background: transparent; color: #527064; }
        .viewTabs button.active { background: #087a4d; color: #fff; box-shadow: 0 4px 12px rgba(8,122,77,.18); }
        .surahLibrary { max-height: 750px; overflow-y: auto; display: grid; gap: 7px; padding-right: 5px; }
        .selectedLibrarySource { position: sticky; top: 0; z-index: 2; padding: 12px 14px; border-radius: 12px; background: #087a4d; color: #fff; box-shadow: 0 6px 16px rgba(8,122,77,.18); }
        .selectedLibrarySource small, .selectedLibrarySource b, .selectedLibrarySource span { display: block; }
        .selectedLibrarySource small { color: #f1cf65; font-size: 8px; font-weight: 900; letter-spacing: .8px; }
        .selectedLibrarySource b { margin-top: 4px; font-size: 12px; }
        .selectedLibrarySource span { margin-top: 3px; color: #d7eee1; font-size: 9px; }
        .libraryBack { width: 100%; background: #e5f2e9; color: #087a4d; border: 1px solid #c3ddcb; }
        .surahRow { width: 100%; min-height: 58px; padding: 9px 11px; display: flex; align-items: center; gap: 10px; border: 1px solid #d9e7dd; background: #fff; color: #173d2e; text-align: left; }
        .surahRow > span { width: 35px; height: 35px; flex: none; display: grid; place-items: center; border-radius: 11px; background: #e8f4ec; color: #087a4d; font-weight: 900; }
        .surahRow div { flex: 1; min-width: 0; }
        .surahRow b, .surahRow small { display: block; }
        .surahRow small { margin-top: 3px; color: #718078; font-size: 10px; }
        .surahRow em { color: #087a4d; font-size: 10px; font-style: normal; font-weight: 800; }
        .surahRow.selected { border-color: #087a4d; background: #f0faf3; }
        @media (max-width: 900px) {
          .layout,
          .grid,
          .booksGrid {
            grid-template-columns: 1fr;
          }
          .wide {
            grid-column: auto;
          }
          .composerHead { align-items: stretch; flex-direction: column; }
          .composerHead nav { display: grid; grid-template-columns: repeat(3, 1fr); }
          .formatGuide { grid-template-columns: 1fr 1fr; }
          .previewStage { padding: 13px; }
          .previewStatus { align-items: flex-start; flex-direction: column; }
          .previewStatus span { text-align: left; }
        }
      `}</style>
    </main>
  );
}
