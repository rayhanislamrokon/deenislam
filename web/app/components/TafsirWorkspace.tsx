"use client";
import { useEffect, useMemo, useState } from "react";

const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");
type Source = {
  id: number | string;
  sourceId?: string;
  name: string;
  author_name: string;
  language_name: string;
  language?: string;
};
type Ayah = {
  numberInSurah: number;
  text: string;
  translation: string;
  transliteration?: string;
};
type Surah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType?: string;
  ayahs?: Ayah[];
};
const APP_TAFSIR_LANGUAGE: Record<string, string> = {
  en: "english",
  bn: "bengali",
  ar: "arabic",
  ur: "urdu",
  ru: "russian",
  ku: "kurdish",
};
const clean = (value: string) =>
  String(value || "")
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_list, body: string) => {
      let number = 0;
      return body.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_item: string, text: string) => `\n${++number}. ${text}\n`);
    })
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_list, body: string) =>
      body.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_item: string, text: string) => `\n• ${text}\n`),
    )
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/h[1-4]>/gi, "\n\n")
    .replace(/<\/blockquote>/gi, "\n\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, "“")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
const commentaryParts = (value: string) =>
  value
    .split(/\n+/)
    .flatMap(line => line.split(/(?=\d+\.\s)/))
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const numbered = part.match(/^(\d+)\.\s*([\s\S]*)$/);
      return numbered
        ? { number: numbered[1], text: numbered[2] }
        : { number: "", text: part };
    });
const safeRichTafsir = (value: string) =>
  String(value || "")
    .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(?:href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, "");

export function TafsirWorkspace({
  query,
  language,
  onBack,
}: {
  query: string;
  language: string;
  onBack: () => void;
}) {
  const [sources, setSources] = useState<Source[]>([]);
  const [source, setSource] = useState<Source | null>(null);
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [surah, setSurah] = useState<Surah | null>(null);
  const [ayah, setAyah] = useState<Ayah | null>(null);
  const [commentaryTitle, setCommentaryTitle] = useState("");
  const [adminPronunciation, setAdminPronunciation] = useState("");
  const [text, setText] = useState("");
  const [richText, setRichText] = useState("");
  const [step, setStep] = useState<"sources" | "surahs" | "ayahs" | "reader">(
    "sources",
  );
  const [sourceLanguage, setSourceLanguage] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    const fetchSources = async (): Promise<Source[]> => {
      try {
        const res = await fetch(
          `${API}/api/tafsir/sources?language=${encodeURIComponent(language)}&refresh=${Date.now()}`,
          { cache: "no-store" },
        );
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data) && json.data.length > 0) {
            return json.data.map((x: any) => ({
              id: x.sourceId || x.id,
              sourceId: x.sourceId || String(x.id),
              name: x.name,
              author_name: x.author_name || x.authorName || "Verified Scholar",
              language_name: x.language_name || x.language || "bengali",
              language: x.language || "bn",
            }));
          }
        }
      } catch {
        // fallback
      }
      // Fallback to Quran.com direct
      const quranRes = await fetch(
        "https://api.quran.com/api/v4/resources/tafsirs",
      );
      if (quranRes.ok) {
        const quranJson = await quranRes.json();
        const rows = (
          Array.isArray(quranJson.tafsirs) ? quranJson.tafsirs : []
        ).filter(
          (x: any) =>
            Number.isInteger(x.id) &&
            x.name &&
            x.author_name &&
            x.language_name,
        );
        return rows;
      }
      return [];
    };

    const fetchSurahs = async (): Promise<Surah[]> => {
      try {
        const response = await fetch(
          `${API}/api/quran/surahs?language=${encodeURIComponent(language)}`,
          { cache: "no-store" },
        );
        if (response.ok) {
          const body = await response.json();
          if (Array.isArray(body.data) && body.data.length) return body.data;
        }
      } catch {
        // Use the public Quran API fallback below.
      }

      try {
        const response = await fetch(
          "https://api.quran.com/api/v4/chapters?language=en",
          { cache: "no-store" },
        );
        if (!response.ok) return [];
        const body = await response.json();
        return (Array.isArray(body.chapters) ? body.chapters : []).map(
          (chapter: any) => ({
            number: Number(chapter.id),
            name: String(chapter.name_arabic || ""),
            englishName: String(chapter.name_simple || ""),
            englishNameTranslation: String(chapter.translated_name?.name || ""),
            numberOfAyahs: Number(chapter.verses_count || 0),
            revelationType: String(chapter.revelation_place || ""),
          }),
        );
      } catch {
        return [];
      }
    };

    Promise.all([fetchSources(), fetchSurahs()])
      .then(([sourcesList, surahList]) => {
        if (!live) return;
        setSources(sourcesList);
        setSurahs(surahList);
        const wanted = APP_TAFSIR_LANGUAGE[language] || "english";
        const matched =
          sourcesList.find((x) => x.language_name.toLowerCase() === wanted) ||
          sourcesList.find(
            (x) => x.language_name.toLowerCase() === "bengali",
          ) ||
          sourcesList.find(
            (x) => x.language_name.toLowerCase() === "english",
          ) ||
          sourcesList[0] ||
          null;
        const path = window.location.pathname.split("/").filter(Boolean);
        const routeSourceId = path[0] === "tafsir" ? path[1] : "";
        const routeSource = routeSourceId
          ? sourcesList.find(
              (item) =>
                String(item.id) === decodeURIComponent(routeSourceId) ||
                String(item.sourceId || "") === decodeURIComponent(routeSourceId),
            )
          : null;
        const activeSource = routeSource || matched;
        setSource(activeSource);
        setStep(routeSourceId ? "surahs" : "sources");
        if (!surahList.length) {
          setError("Surah list could not load. Please refresh and try again.");
        }
        const routeSurahNumber = Number(path[2]);
        if (routeSourceId && Number.isInteger(routeSurahNumber) && routeSurahNumber > 0) {
          fetch(
            `${API}/api/quran/surahs/${routeSurahNumber}?language=${encodeURIComponent(language)}`,
            { cache: "no-store" },
          )
            .then(async (response) => {
              const body = await response.json();
              if (!response.ok || !body.data) throw new Error(body.message);
              if (!live) return;
              setSurah(body.data);
              setStep("ayahs");
            })
            .catch(() => {
              if (live) setError("This Surah could not load. Please try again.");
            });
        }
      })
      .catch(() => setError("Tafsir library could not load. Please try again."))
      .finally(() => live && setLoading(false));

    return () => {
      live = false;
    };
  }, [language]);

  const languages = useMemo(
    () => ["all", ...Array.from(new Set(sources.map((x) => x.language_name)))],
    [sources],
  );
  const shownSources = useMemo(() => {
    const term = query.trim().toLowerCase();
    return sources.filter(
      (x) =>
        (sourceLanguage === "all" || x.language_name === sourceLanguage) &&
        (!term ||
          `${x.name} ${x.author_name} ${x.language_name}`
            .toLowerCase()
            .includes(term)),
    );
  }, [sources, sourceLanguage, query]);

  const shownSurahs = useMemo(() => {
    const term = query.trim().toLowerCase();
    return surahs.filter(
      (x) =>
        !term ||
        `${x.number} ${x.englishName} ${x.englishNameTranslation} ${x.name}`
          .toLowerCase()
          .includes(term),
    );
  }, [surahs, query]);

  const chooseSource = (item: Source) => {
    setSource(item);
    setStep("surahs");
    window.history.pushState({}, "", "/tafsir/" + item.id);
  };

  const chooseSurah = async (item: Surah) => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch(
        `${API}/api/quran/surahs/${item.number}?language=${encodeURIComponent(language)}`,
        { cache: "no-store" },
      );
      const body = await r.json();
      if (!r.ok) throw Error(body.message);
      setSurah(body.data);
      setStep("ayahs");
      window.history.pushState(
        {},
        "",
        `/tafsir/${source?.id || "source"}/${item.number}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load Surah.");
    } finally {
      setLoading(false);
    }
  };

  const openAyah = async (item: Ayah) => {
    if (!source || !surah) return;
    setAyah(item);
    setStep("reader");
    setLoading(true);
    setError("");
    setText("");
    setRichText("");
    setCommentaryTitle("");
    setAdminPronunciation("");
    window.history.pushState(
      {},
      "",
      `/tafsir/${source.id}/${surah.number}/ayah-${item.numberInSurah}`,
    );

    // 1. Try our backend API (checks custom admin-managed Tafsir first, then proxies Quran.com)
    try {
      const backendRes = await fetch(
        `${API}/api/tafsir/by_ayah/${surah.number}/${item.numberInSurah}?sourceId=${encodeURIComponent(
          String(source.id),
        )}&language=${encodeURIComponent(language)}`,
      );
      if (backendRes.ok) {
        const body = await backendRes.json();
        if (body.data?.text) {
          setCommentaryTitle(body.data.title || "");
          setAdminPronunciation(String(body.data.pronunciation || "").trim());
          setRichText(String(body.data.text || ""));
          setText(clean(body.data.text));
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fallback to Quran.com direct
    }

    // 2. Direct Quran.com fallback if source.id is numeric
    try {
      const r = await fetch(
        `https://api.quran.com/api/v4/tafsirs/${source.id}/by_ayah/${surah.number}:${item.numberInSurah}`,
      );
      const body = await r.json();
      if (!r.ok) throw Error();
      const record = body.tafsir?.text
        ? body.tafsir
        : (Object.values(body.tafsir?.verses || {})[0] as
            | { text?: string }
            | undefined);
      setRichText(String(record?.text || ""));
      setText(clean(record?.text || ""));
    } catch {
      setError("This Tafsir is not available for the selected Ayah.");
    } finally {
      setLoading(false);
    }
  };

  const move = (direction: number) => {
    if (!surah?.ayahs || !ayah) return;
    const next = surah.ayahs.find(
      (x) => x.numberInSurah === ayah.numberInSurah + direction,
    );
    if (next) void openAyah(next);
  };

  const bookmark = () => {
    if (!source || !surah || !ayah) return;
    const key = "deenislam_web_bookmarks";
    const all = JSON.parse(localStorage.getItem(key) || "[]") as string[];
    const value = `Tafsir · ${source.name} · ${surah.englishName} ${surah.number}:${ayah.numberInSurah}`;
    if (!all.includes(value))
      localStorage.setItem(key, JSON.stringify([value, ...all]));
  };

  if (step === "reader" && source && surah && ayah)
    return (
      <div className='tafsir-reader'>
        <button
          type='button'
          className='tafsir-reader-back'
          onClick={() => setStep("ayahs")}
        >
          ← {surah.englishName}
        </button>
        <header>
          <small>
            TAFSIR · {surah.number}:{ayah.numberInSurah}
          </small>
          <h2>{source.name}</h2>
          <p>
            {source.author_name} · {source.language_name}
          </p>
        </header>
        <article>
          <span>QURAN</span>
          <p className='tafsir-arabic' dir='rtl'>
            {ayah.text}
          </p>
          {(adminPronunciation || ayah.transliteration) && (
            <p className='tafsir-pronunciation'>
              <b>Pronunciation</b>
              <em>{adminPronunciation || ayah.transliteration}</em>
            </p>
          )}
          <blockquote>{ayah.translation}</blockquote>
        </article>
        <section>
          <small>VERIFIED COMMENTARY</small>
          <h2>{commentaryTitle || "Explanation"}</h2>
          {loading ? (
            <div className='loader' />
          ) : error ? (
            <p className='error'>{error}</p>
          ) : (
            /<(?:h[1-4]|p|ul|ol|li|blockquote|strong|em)\b/i.test(richText) ? (
              <div className='tafsir-managed-rich' dangerouslySetInnerHTML={{ __html: safeRichTafsir(richText) }} />
            ) : <div className='tafsir-commentary-body'>
              {commentaryParts(text).map((part, index) =>
                part.number ? (
                  <div className='tafsir-commentary-point' key={`${part.number}-${index}`}>
                    <b>{part.number}.</b>
                    <p>{part.text}</p>
                  </div>
                ) : (
                  <p className='tafsir-commentary-intro' key={`intro-${index}`}>{part.text}</p>
                ),
              )}
            </div>
          )}
          <footer>Source: {source.name}</footer>
        </section>
        <nav>
          <button onClick={bookmark}>♡ Bookmark</button>
          <button
            onClick={() =>
              navigator.clipboard?.writeText(
                `${ayah.text}\n\n${ayah.translation}\n\n${text}`,
              )
            }
          >
            Copy
          </button>
          <i />
          <button disabled={ayah.numberInSurah === 1} onClick={() => move(-1)}>
            ← Previous
          </button>
          <span className='tafsir-page-count'>
            {ayah.numberInSurah} / {surah.numberOfAyahs}
          </span>
          <button
            disabled={ayah.numberInSurah === surah.numberOfAyahs}
            onClick={() => move(1)}
          >
            Next →
          </button>
        </nav>
      </div>
    );

  if (step === "ayahs" && source && surah)
    return (
      <div className='tafsir-library'>
        <button className='section-back' onClick={() => setStep("surahs")}>
          ← All Surahs
        </button>
        <div className='tafsir-selected'>
          <b>SELECTED TAFSIR</b>
          <h2>{source.name}</h2>
          <p>
            {source.author_name} · {source.language_name}
          </p>
        </div>
        <h2>
          {surah.englishName} <span>{surah.name}</span>
        </h2>
        <p>
          {surah.englishNameTranslation} · {surah.numberOfAyahs} Ayahs
        </p>
        {loading && <div className='loader' />}
        <div className='tafsir-ayah-list'>
          {surah.ayahs?.map((item) => (
            <button
              key={item.numberInSurah}
              onClick={() => void openAyah(item)}
            >
              <span>
                {surah.number}:{item.numberInSurah}
              </span>
              <b dir='rtl'>{item.text}</b>
              <p>{item.translation}</p>
              <em>Open Tafsir →</em>
            </button>
          ))}
        </div>
      </div>
    );

  if (step === "surahs" && source)
    return (
      <div className='tafsir-library'>
        <button className='section-back' onClick={() => setStep("sources")}>
          ← Tafsir Library
        </button>
        <div className='tafsir-selected'>
          <b>SELECTED TAFSIR</b>
          <h2>{source.name}</h2>
          <p>
            {source.author_name} · {source.language_name}
          </p>
        </div>
        <div className='surah-grid'>
          {shownSurahs.map((item) => (
            <button key={item.number} onClick={() => void chooseSurah(item)}>
              <i>{item.number}</i>
              <span>
                <b>{item.englishName}</b>
                <small>
                  {item.englishNameTranslation} · {item.numberOfAyahs} Ayahs
                </small>
              </span>
              <em dir='rtl'>{item.name}</em>
            </button>
          ))}
        </div>
      </div>
    );

  return (
    <div className='tafsir-library'>
      <button type='button' className='section-back' onClick={onBack}>
        ← Back to Home
      </button>
      <div className='feature-hero'>
        <span>VERIFIED TAFSIR LIBRARY</span>
        <h2>Understand the Quran through trusted Tafsir</h2>
        <p>
          Explore authentic Quranic commentaries with seamless synchronization
          between Web, App, and Admin Panel.
        </p>
      </div>
      <div className='tafsir-languages'>
        {languages.map((item) => (
          <button
            className={sourceLanguage === item ? "active" : ""}
            key={item}
            onClick={() => setSourceLanguage(item)}
          >
            {item === "all" ? "All languages" : item}
          </button>
        ))}
      </div>
      {loading ? (
        <div className='loader' />
      ) : error ? (
        <p className='error'>{error}</p>
      ) : (
        <div className='tafsir-sources'>
          {shownSources.map((item) => (
            <button key={String(item.id)} onClick={() => chooseSource(item)}>
              <i>ق</i>
              <span>
                <b>{item.name}</b>
                <small>{item.author_name}</small>
                <em>{item.language_name}</em>
              </span>
              <strong>›</strong>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
