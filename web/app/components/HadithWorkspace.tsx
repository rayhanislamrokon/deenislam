"use client";
import { useEffect, useMemo, useState } from "react";
import { transliterate } from "transliteration";

type Collection = {
  id: string;
  title: string;
  arabic: string;
  author: string;
  hadiths: number;
  mark: string;
  category: "Major" | "Classical";
  coverImageUrl?: string;
  languages?: string[];
};
type Hadith = {
  id: string;
  cid: string;
  no: string;
  title: string;
  text: string;
  arabic?: string;
  by?: string;
  book?: string;
  sectionName?: string;
  grade?: string;
  explanation?: string;
  benefits?: string;
  explanationSource?: string;
  pronunciation?: string;
  reference?: string;
  source?: string;
};
const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");
const collections: Collection[] = [
  {
    id: "b",
    title: "Sahih al-Bukhari",
    arabic: "صحيح البخاري",
    author: "Imam Muhammad al-Bukhari",
    hadiths: 7580,
    mark: "بخ",
    category: "Major",
  },
  {
    id: "m",
    title: "Sahih Muslim",
    arabic: "صحيح مسلم",
    author: "Imam Muslim ibn al-Hajjaj",
    hadiths: 7459,
    mark: "مس",
    category: "Major",
  },
  {
    id: "a",
    title: "Sunan Abu Dawood",
    arabic: "سنن أبي داود",
    author: "Imam Abu Dawood",
    hadiths: 5272,
    mark: "د",
    category: "Major",
  },
  {
    id: "t",
    title: "Jami' at-Tirmidhi",
    arabic: "جامع الترمذي",
    author: "Imam Muhammad at-Tirmidhi",
    hadiths: 3924,
    mark: "تر",
    category: "Major",
  },
  {
    id: "s",
    title: "Sunan an-Nasa'i",
    arabic: "سنن النسائي",
    author: "Imam Ahmad an-Nasa'i",
    hadiths: 5679,
    mark: "نس",
    category: "Major",
  },
  {
    id: "i",
    title: "Sunan Ibn Majah",
    arabic: "سنن ابن ماجه",
    author: "Imam Ibn Majah",
    hadiths: 4338,
    mark: "مج",
    category: "Major",
  },
  {
    id: "malik",
    title: "Muwatta Malik",
    arabic: "موطأ مالك",
    author: "Imam Malik ibn Anas",
    hadiths: 1818,
    mark: "مو",
    category: "Classical",
  },
  {
    id: "q",
    title: "Forty Hadith Qudsi",
    arabic: "الأحاديث القدسية",
    author: "Sacred sayings narrated from Allah",
    hadiths: 40,
    mark: "قد",
    category: "Classical",
  },
  {
    id: "n",
    title: "Forty Hadith Nawawi",
    arabic: "الأربعون النووية",
    author: "Imam Yahya an-Nawawi",
    hadiths: 42,
    mark: "نو",
    category: "Classical",
  },
];
const sourceBooks: Record<string, string> = {
  b: "bukhari",
  m: "muslim",
  a: "abudawud",
  t: "tirmidhi",
  s: "nasai",
  i: "ibnmajah",
  malik: "malik",
  n: "nawawi",
  q: "qudsi",
};
const collectionCovers: Record<string, string> = {
  b: "/images/hadith/sahih-bukhari-cover.png",
  m: "/images/hadith/sahih-muslim-cover.png",
  a: "/images/hadith/sunan-abu-dawood-cover.png",
  t: "/images/hadith/jami-at-tirmidhi-cover.png",
  s: "/images/hadith/sunan-an-nasai-cover.png",
  i: "/images/hadith/sunan-ibn-majah-cover.png",
  malik: "/images/hadith/muwatta-malik-cover.png",
  q: "/images/hadith/forty-hadith-qudsi-cover.png",
  n: "/images/hadith/forty-hadith-nawawi-cover.png",
};
const extractNarrator = (text: string) => {
  const clean = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (/^A man\b/i.test(clean)) return "Narrated by an unnamed man";
  const firstPerson = clean.match(/^I\s*\(([^)]+)\)\s+said\b/i);
  if (firstPerson) return "Narrated by " + firstPerson[1].trim();
  const addedNarrator = clean.match(/^(?:And\s+)?(.+?)\s+added\s*:/i);
  if (addedNarrator) return "Narrated by " + addedNarrator[1].trim();
  const saidNarrator = clean.match(/^(?:And\s+)?(.+?)\s+said\s*,/i);
  if (saidNarrator && saidNarrator[1].length <= 120)
    return "Narrated by " + saidNarrator[1].trim();
  const uncertainNarrator = clean.match(
    /^It is narrated either on (?:the )?authority of\s+(.+?)\s+or that of\s+(.+?)\./i,
  );
  if (uncertainNarrator)
    return (
      "Narrated by " +
      uncertainNarrator[1].trim() +
      " or " +
      uncertainNarrator[2].trim()
    );
  const patterns = [
    /^(?:And )?Narrated\s+(?:by\s+)?(.+?)(?=\s+\(|:|\s+that\b)/i,
    /^(?:And )?Narrates?\s+(.+?)(?=:|\s+that\b)/i,
    /^(.+?),?\s+also reported\b/i,
    /^(.+?)\s+\(narrated\)(?=\s+from|\s+that)/i,
    /^(.+?)\s+narrated from\b/i,
    /^(?:Also )?On the authority of\s+(.+?)(?=\s*\((?:ra|may Allah)|,\s*(?:who|from)|\s+(?:who|from)|:)/i,
    /^This hadith is narrated to us on (?:the )?authority of\s+(.+?)(?=,|\s+on the authority)/i,
    /^It (?:is|was) (?:reported|narrated) on (?:the )?authority of\s+(.+?)(?=\s+that|[:,])/i,
    /^It was narrated (?:from|that)\s+(.+?)(?=\s+that|[:,])/i,
    /^It is narrated on (?:the )?authority (?:of )?\s*(.+?)(?=\s+that|[:,]|\s+(?:observed|reported|said):)/i,
    /(?:^|\s)(?:is )?also reported by\s+(.+?)(?=,|\s+with|:)/i,
    /^(.+?)\s+reported on the authority of\b/i,
    /^(.+?)\s+(?:said|reported|narrated)(?=\s+that\b|\s*:)/i,
    /^(?:This|A similar) (?:Hadith|tradition).*?(?:narrated|reported|transmitted)(?: on the authority of| by| from)\s+(.+?)(?=\s+(?:through|on the authority|from)|[.:])/i,
    /^.+?\s+heard\s+(.+?)\s+(?:reporting|saying)\b/i,
    /^(.+?)\s+was (?:delivering|giving)\b/i,
    /^(.+?)\s+asked\b/i,
    /^(.+?)\s+(?:has\s+)?(?:narrated|reported|related|transmitted)\b/i,
    /^He said,\s*["“'](.+?)\s+related to me\b/i,
    /^(Malik) related to (?:me|us)\b/i,
    /^It was related to me from\s+(.+?)(?=\s+from|\s+that|[:,])/i,
  ];
  for (const pattern of patterns) {
    const match = clean.match(pattern);
    if (match?.[1]) {
      const name = match[1]
        .replace(/,\s*also$/i, "")
        .replace(/\s+/g, " ")
        .trim();
      if (
        name.length >= 2 &&
        name.length <= 180 &&
        !/^(?:it|this|another|the same narrator|this hadith|the same hadith|the above hadith|a similar hadith|a similar tradition)(?:\s|$)/i.test(
          name,
        )
      )
        return "Narrated by " + name;
    }
  }
  if (/^Yahya (?:ibn Yahya al-Laythi )?related to me\b/i.test(clean))
    return "Narrated through Yahya ibn Yahya al-Laythi";
  return "";
};
const ensureNarrators = (rows: any[]) => {
  let previousNarrator = "";
  return rows.map((row) => {
    let by = String(row.by || "").trim();
    if (
      !by &&
      /(?:same|similar|above|like (?:the|one)|different chain|see translation|mentioned above)/i.test(
        row.text,
      )
    )
      by = previousNarrator;
    if (!by) by = "Narrator chain recorded in the source text";
    if (!by.includes("recorded in the source")) previousNarrator = by;
    return { ...row, by };
  });
};
async function loadCollection(collection: Collection, language: string) {
  const useDirectAppSource = Boolean(sourceBooks[collection.id]);
  const central = useDirectAppSource
    ? null
    : await fetch(
        `${API}/api/hadith/collections/${collection.id}?language=${encodeURIComponent(language)}&refresh=${Date.now()}`,
        { cache: "no-store" },
      ).catch(() => null);
  if (central?.ok) {
    const body = await central.json();
    return Array.isArray(body.data) ? body.data : [];
  }
  const managedResponse = await fetch(
    `${API}/api/hadith/admin-content?language=${encodeURIComponent(language)}&refresh=${Date.now()}`,
    { cache: "no-store" },
  ).catch(() => null);
  const managedBody = managedResponse?.ok
    ? await managedResponse.json().catch(() => ({}))
    : {};
  const managed = (
    Array.isArray(managedBody.data) ? managedBody.data : []
  ).filter((item: Hadith) => item.cid === collection.id);
  let source: Hadith[] = [];
  if (collection.id === "m") {
    const response = await fetch(
      "https://cdn.jsdelivr.net/npm/sahih-muslim@1.1.2/data/muslim.json.gz",
    );
    if (
      !response.ok ||
      !response.body ||
      typeof DecompressionStream === "undefined"
    ) {
      if (managed.length) return managed;
      throw Error("Sahih Muslim source is unavailable");
    }
    const data: any = await new Response(
      response.body.pipeThrough(new DecompressionStream("gzip")),
    ).json();
    const chapters = new Map<string, string>(
      (data.chapters || []).map((item: any) => [
        String(item.id),
        String(item.english || item.arabic || "Sahih Muslim"),
      ]),
    );
    source = (data.hadiths || [])
      .map((item: any) => {
        const no = String(item.id),
          narrator = String(item.english?.narrator || "").trim(),
          body = String(item.english?.text || "").trim();
        return {
          id: `source-m-${no}`,
          cid: "m",
          no,
          title: `Hadith ${no}`,
          text: [narrator, body].filter(Boolean).join(" "),
          arabic: String(item.arabic || "").trim(),
          by: narrator,
          book: String(item.chapterId || "1"),
          sectionName: chapters.get(String(item.chapterId)) || "Sahih Muslim",
          grade: "See source grading",
          reference: `Sahih Muslim ${no}`,
          source: "sahih-muslim 1.1.2",
        };
      })
      .filter((item: Hadith) => item.text || item.arabic);
  } else {
    const book = sourceBooks[collection.id];
    if (!book) return managed;
    const base =
      "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/";
    const [englishResponse, arabicResponse] = await Promise.all([
      fetch(`${base}eng-${book}.min.json`),
      fetch(`${base}ara-${book}.min.json`).catch(() => null),
    ]);
    if (!englishResponse.ok) {
      if (managed.length) return managed;
      throw Error("Hadith source is unavailable");
    }
    const english = await englishResponse.json(),
      arabic = arabicResponse?.ok ? await arabicResponse.json() : null;
    const arabicByNumber = new Map(
      (arabic?.hadiths || []).map(
        (item: { hadithnumber: string | number; text: string }) => [
          String(item.hadithnumber),
          item.text,
        ],
      ),
    );
    const sections = english?.metadata?.section || {};
    source = ensureNarrators(
      (english?.hadiths || [])
        .map((item: any) => {
          const text = String(item.text || "").trim(),
            arabic = String(
              arabicByNumber.get(String(item.hadithnumber)) || "",
            ).trim();
          return {
            id: `source-${collection.id}-${item.hadithnumber}`,
            cid: collection.id,
            no: String(item.hadithnumber),
            title: `Hadith ${item.hadithnumber}`,
            text,
            arabic,
            by: extractNarrator(text),
            book: String(item.reference?.book || "1"),
            sectionName:
              sections[String(item.reference?.book || "1")] ||
              `Book ${item.reference?.book || 1}`,
            grade:
              (item.grades || [])
                .map((row: any) => row.grade)
                .filter(Boolean)
                .join(", ") || "See source grading",
            reference: `${book} ${item.hadithnumber}`,
            source: "fawazahmed0 Hadith API",
          };
        })
        .filter((item: Hadith) => item.text && item.arabic),
    );
  }
  const managedByNumber = new Map<string, Hadith>(
    managed.map((item: Hadith) => [String(item.no), item] as [string, Hadith]),
  );
  const filled = source.map((item) => {
    const override = managedByNumber.get(String(item.no));
    if (!override) return item;
    managedByNumber.delete(String(item.no));
    return {
      ...item,
      ...override,
      title: override.title || item.title,
      text: override.text || item.text,
      arabic: override.arabic || item.arabic,
      by: override.by || item.by,
      book: override.book || item.book,
      sectionName: override.sectionName || item.sectionName,
      grade: override.grade || item.grade,
      reference: override.reference || item.reference,
      source: override.source || item.source,
    };
  });
  return [...filled, ...managedByNumber.values()];
}
const collectionSlug = (item: Collection) =>
  item.title
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const collectionFromSlug = (slug: string) =>
  collections.find(
    (item) => item.id === slug || collectionSlug(item) === slug,
  ) || null;
const hadithSlug = (no: string) => `hadith-${encodeURIComponent(no)}`;
const hadithNumberFromSlug = (slug: string) =>
  decodeURIComponent(slug.replace(/^hadith-/i, ""));
function savedProgress(id: string) {
  try {
    return (
      JSON.parse(
        localStorage.getItem("deen-islam-hadith-reading-progress-v1") || "{}",
      )[id] || null
    );
  } catch {
    return null;
  }
}
function saveProgress(id: string, no: string, index: number) {
  try {
    const key = "deen-islam-hadith-reading-progress-v1",
      all = JSON.parse(localStorage.getItem(key) || "{}");
    all[id] = { no, index };
    localStorage.setItem(key, JSON.stringify(all));
  } catch {}
}
type Commentary = {
  id: string;
  text: string;
  explanation: string;
  benefits?: string;
  source: string;
};
const commentaryStop = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "to",
  "in",
  "is",
  "was",
  "were",
  "be",
  "been",
  "by",
  "for",
  "from",
  "that",
  "this",
  "with",
  "his",
  "her",
  "him",
  "he",
  "she",
  "they",
  "it",
  "may",
  "allah",
  "upon",
  "said",
  "reported",
  "messenger",
  "prophet",
  "peace",
  "blessings",
]);
const commentaryWords = (value: string) =>
  new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !commentaryStop.has(word)),
  );
function findEnglishCommentary(rows: Commentary[], text: string) {
  const target = commentaryWords(text);
  if (target.size < 3) return undefined;
  let best: Commentary | undefined,
    bestScore = 0;
  for (const row of rows) {
    const candidate = commentaryWords(row.text);
    let shared = 0;
    target.forEach((word) => {
      if (candidate.has(word)) shared++;
    });
    const score = shared / Math.min(target.size, candidate.size);
    if (shared >= 4 && score > bestScore) {
      best = row;
      bestScore = score;
    }
  }
  return bestScore >= 0.5 ? best : undefined;
}
const arabicCommentaryWords = (value: string) =>
  new Set(
    value
      .normalize("NFD")
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
      .replace(/[^\u0600-\u06FF ]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2),
  );
function findArabicCommentary(rows: Commentary[], text: string) {
  const target = arabicCommentaryWords(text);
  if (target.size < 3) return undefined;
  let best: Commentary | undefined,
    bestScore = 0;
  for (const row of rows) {
    const candidate = arabicCommentaryWords(row.text);
    let shared = 0;
    target.forEach((word) => {
      if (candidate.has(word)) shared++;
    });
    const score = shared / Math.min(target.size, candidate.size);
    if (shared >= 4 && score > bestScore) {
      best = row;
      bestScore = score;
    }
  }
  return bestScore >= 0.55 ? best : undefined;
}
function saveBookmark(item: Hadith) {
  const key = "deenislam_web_bookmarks",
    all = JSON.parse(localStorage.getItem(key) || "[]") as string[],
    value = `Hadith · ${item.title} · ${item.reference || item.cid}`;
  if (!all.includes(value))
    localStorage.setItem(key, JSON.stringify([value, ...all]));
}
export function HadithWorkspace({
  query,
  language = "en",
}: {
  query: string;
  language?: string;
}) {
  const [availableCollections, setAvailableCollections] =
      useState<Collection[]>(collections),
    [selected, setSelected] = useState<Collection | null>(null),
    [items, setItems] = useState<Hadith[]>([]),
    [reading, setReading] = useState<Hadith | null>(null),
    [matchedCommentary, setMatchedCommentary] = useState<
      (Commentary & { language: "English" | "Arabic" }) | null
    >(null),
    [pendingHadith, setPendingHadith] = useState(""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    fetch(`${API}/api/hadith/collection-cards`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((body) => {
        if (!Array.isArray(body.data)) return;
        setAvailableCollections((current) => {
          const merged = new Map(current.map((item) => [item.id, item]));
          body.data.forEach((item: Collection) =>
            merged.set(item.id, { ...merged.get(item.id), ...item }),
          );
          return Array.from(merged.values());
        });
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!selected) {
      setItems([]);
      setReading(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    loadCollection(selected, language)
      .then((data) => {
        if (active) setItems(data);
      })
      .catch(
        (reason) =>
          active &&
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to load collection",
          ),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [selected, language]);
  useEffect(() => {
    const sync = () => {
      const parts = window.location.pathname.split("/").filter(Boolean);
      if (parts[0] !== "hadith") return;
      const collection = collectionFromSlug(parts[1] || "");
      setSelected(collection);
      setPendingHadith(parts[2] ? hadithNumberFromSlug(parts[2]) : "");
      if (!collection) setReading(null);
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  useEffect(() => {
    if (!pendingHadith || !items.length) return;
    const item = items.find((row) => String(row.no) === pendingHadith);
    if (item) setReading(item);
  }, [pendingHadith, items]);
  useEffect(() => {
    if (!reading || reading.explanation || !reading.text) return;
    let active = true;
    fetch(`${API}/api/hadith/explanation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: reading.text }),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((body) => {
        const explanation = String(body.data?.explanation || "").trim();
        if (active && explanation)
          setReading((current) =>
            current && current.id === reading.id
              ? {
                  ...current,
                  explanation,
                  benefits: String(body.data?.benefits || "").trim(),
                  explanationSource:
                    body.data?.source || current.explanationSource,
                }
              : current,
          );
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [reading?.id, reading?.explanation, reading?.text]);
  useEffect(() => {
    if (!reading) {
      setMatchedCommentary(null);
      return;
    }
    let active = true;
    setMatchedCommentary(null);
    Promise.all([
      import("../data/hadeethenc-en.json"),
      import("../data/hadeethenc-ar.json"),
    ])
      .then(([englishModule, arabicModule]) => {
        if (!active) return;
        const english = findEnglishCommentary(
          (englishModule.default || []) as Commentary[],
          reading.text || "",
        );
        const arabic = english
          ? undefined
          : findArabicCommentary(
              (arabicModule.default || []) as Commentary[],
              reading.arabic || "",
            );
        const match = english || arabic;
        if (match)
          setMatchedCommentary({
            ...match,
            language: english ? "English" : "Arabic",
          });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [reading?.id, reading?.text, reading?.arabic]);
  const openCollection = (item: Collection) => {
    setSelected(item);
    setReading(null);
    setPendingHadith("");
    window.history.pushState({}, "", `/hadith/${collectionSlug(item)}`);
  };
  const closeReader = () => {
    setReading(null);
    setPendingHadith("");
    if (selected)
      window.history.pushState({}, "", `/hadith/${collectionSlug(selected)}`);
  };
  const visibleCollections = useMemo(
    () =>
      availableCollections.filter((item) =>
        `${item.title} ${item.arabic} ${item.author}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [availableCollections, query],
  );
  const visibleItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        !term ||
        `${item.no} ${item.title} ${item.text} ${item.arabic || ""} ${item.by || ""} ${item.sectionName || ""}`
          .toLowerCase()
          .includes(term),
    );
  }, [items, query]);
  const openHadith = (item: Hadith) => {
    const index = items.findIndex((row) => row.id === item.id);
    if (selected) {
      saveProgress(selected.id, item.no, index < 0 ? 0 : index);
      window.history.pushState(
        {},
        "",
        `/hadith/${collectionSlug(selected)}/${hadithSlug(item.no)}`,
      );
    }
    setPendingHadith(item.no);
    setReading(item);
  };
  if (reading && selected) {
    const index = items.findIndex((item) => item.id === reading.id),
      previous = index > 0 ? items[index - 1] : null,
      next = index >= 0 && index < items.length - 1 ? items[index + 1] : null;
    const pronunciation =
      reading.pronunciation ||
      (reading.arabic ? transliterate(reading.arabic) : "");
    const narrator = reading.by || "Narrator chain recorded in the source text";
    const detailedExplanation =
      reading.explanation ||
      matchedCommentary?.explanation ||
      "No verified detailed explanation is available for this Hadith yet.";
    const keyLessons =
      reading.benefits ||
      matchedCommentary?.benefits ||
      "No separate verified key lessons are available for this Hadith yet.";
    const explanationSource =
      reading.explanationSource ||
      matchedCommentary?.source ||
      "No verified matching source available";
    const commentaryLanguage = matchedCommentary?.language || "English";
    return (
      <div className='hadith-reader'>
        <button className='soft' onClick={closeReader}>
          ← {selected.title}
        </button>
        <header>
          <span>HADITH {reading.no}</span>
          <h2>{reading.title}</h2>
          <p>{selected.author}</p>
        </header>
        <section className='hadith-main-card'>
          <div className='hadith-section-label'>NARRATOR</div>
          <p className='hadith-narrator'>{narrator}</p>
          <div className='hadith-section-label'>ARABIC TEXT</div>
          {reading.arabic ? (
            <p className='hadith-arabic' dir='rtl'>
              {reading.arabic}
            </p>
          ) : (
            <p className='hadith-unavailable'>
              Arabic source text is not available in the current edition.
            </p>
          )}
          <div className='hadith-pronunciation'>
            <b>ARABIC PRONUNCIATION</b>
            <p>
              {pronunciation ||
                "Pronunciation is not available for this Hadith."}
            </p>
          </div>
          <div className='hadith-section-label'>ENGLISH MEANING</div>
          <article>
            <p>
              {reading.text ||
                "English meaning is not available for this Hadith."}
            </p>
          </article>
        </section>
        <aside className='hadith-commentary'>
          <small>
            TAFSIR / COMMENTARY · {commentaryLanguage.toUpperCase()}
          </small>
          <h3>Detailed Explanation</h3>
          <p>{detailedExplanation}</p>
          <b>KEY LESSONS</b>
          <p>{keyLessons}</p>
          <footer>Explanation source: {explanationSource}</footer>
        </aside>
        <div className='hadith-details'>
          <h3>SOURCE DETAILS</h3>
          <span>
            <b>Collection</b>
            <em>{selected.title}</em>
          </span>
          <span>
            <b>Hadith number</b>
            <em>{reading.no}</em>
          </span>
          <span>
            <b>Grade</b>
            <em>{reading.grade || "See source grading"}</em>
          </span>
          <span>
            <b>Reference</b>
            <em>{reading.reference || `${selected.title} ${reading.no}`}</em>
          </span>
        </div>
        <footer>
          <button onClick={() => saveBookmark(reading)}>♡ Bookmark</button>
          <button
            onClick={() =>
              navigator.clipboard?.writeText(
                [
                  narrator,
                  reading.arabic,
                  pronunciation,
                  reading.text,
                  detailedExplanation,
                  keyLessons,
                  explanationSource,
                ]
                  .filter(Boolean)
                  .join("\n\n"),
              )
            }
          >
            Copy
          </button>
          <div>
            <button
              disabled={!previous}
              onClick={() => previous && openHadith(previous)}
            >
              ← Previous
            </button>
            <button disabled={!next} onClick={() => next && openHadith(next)}>
              Next →
            </button>
          </div>
        </footer>
      </div>
    );
  }
  if (selected) {
    return (
      <div className='hadith-collection'>
        <button
          type='button'
          className='hadith-collection-back'
          onClick={() => {
            setSelected(null);
            setReading(null);
            setPendingHadith("");
            window.history.pushState({}, "", "/hadith");
          }}
        >
          <span>←</span> Hadith Collections
        </button>
        <div className='hadith-collection-head'>
          <div>
            <span>{selected.mark}</span>
            <section>
              <h2>{selected.title}</h2>
              <p>
                {selected.author} ·{" "}
                {items.length || selected.hadiths.toLocaleString()} Hadiths
              </p>
            </section>
          </div>
        </div>
        {loading && (
          <div className='hadith-state'>
            <i />
            <h2>Loading complete collection…</h2>
            <p>
              Arabic, translation and references are coming from the central
              backend.
            </p>
          </div>
        )}
        {error && (
          <div className='hadith-state error'>
            <h2>Collection could not load</h2>
            <p>{error}</p>
            <button
              onClick={() => {
                const current = selected;
                setSelected(null);
                setTimeout(() => setSelected(current), 0);
              }}
            >
              Try again
            </button>
          </div>
        )}
        {!loading && !error && (
          <div className='hadith-list'>
            {visibleItems.map((item) => (
              <button key={item.id} onClick={() => openHadith(item)}>
                <b>{item.no}</b>
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.text.slice(0, 210)}
                    {item.text.length > 210 ? "…" : ""}
                  </small>
                </span>
                <em>›</em>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className='hadith-home'>
      <button
        type='button'
        className='hadith-home-back'
        onClick={() => {
          window.location.href = "/";
        }}
      >
        <span>←</span> Back to Home
      </button>
      <div className='feature-hero'>
        <span>AUTHENTIC HADITH LIBRARY</span>
        <h2>Hadith Collections</h2>
        <p>
          Read complete Arabic and translated collections from the same backend
          used by the app.
        </p>
      </div>
      <h2>Major Hadith Collections</h2>
      <div className='hadith-collections'>
        {visibleCollections
          .filter((item) => item.category === "Major")
          .map((item) => (
            <CollectionCard
              key={item.id}
              item={item}
              open={() => openCollection(item)}
            />
          ))}
      </div>
      <h2>Classical Collections</h2>
      <div className='hadith-collections classical'>
        {visibleCollections
          .filter((item) => item.category === "Classical")
          .map((item) => (
            <CollectionCard
              key={item.id}
              item={item}
              open={() => openCollection(item)}
            />
          ))}
      </div>
      {!visibleCollections.length && (
        <div className='hadith-state'>
          <h2>No collection found</h2>
          <p>Try another collection or compiler name.</p>
        </div>
      )}
    </div>
  );
}
function CollectionCard({
  item,
  open,
}: {
  item: Collection;
  open: () => void;
}) {
  return (
    <article className='hadith-collection-card'>
      <button onClick={open}>
        <span className='hadith-cover'>
          <img src={collectionCovers[item.id]} alt={`${item.title} cover`} />
        </span>
        <div>
          <h3>{item.title}</h3>
          <b dir='rtl'>{item.arabic}</b>
          <p>{item.author}</p>
          <small>
            ▣ {item.hadiths.toLocaleString()} Hadiths · Multi Language
          </small>
        </div>
      </button>
      <footer>
        <button onClick={open}>Read Collection →</button>
      </footer>
    </article>
  );
}
