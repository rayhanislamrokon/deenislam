"use client";
import { useEffect, useMemo, useState } from "react";
type Era = {
  id: string;
  range: string;
  title: string;
  subtitle: string;
  summary: string;
  topics: string[];
  chapterContent?: string[];
  chapterAbout?: string[];
  chapterReferences?: string[];
};
const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/$/, "");
const E = (
  id: string,
  range: string,
  title: string,
  subtitle: string,
  summary: string,
  topics: string[],
): Era => ({ id, range, title, subtitle, summary, topics });
const ERAS: Era[] = [
  E(
    "creation-adam",
    "The beginning of humanity",
    "Creation & Adam (AS)",
    "The first human and Prophet",
    "The Quranic account of creation, Adam and Hawwa, life in Jannah, the test, repentance and the beginning of human life on Earth.",
    [
      "Allah as the Creator",
      "Creation of the heavens and the Earth",
      "Creation of Adam (AS)",
      "The command to the angels",
      "Adam and Hawwa in Jannah",
      "The test and repentance",
      "Life begins on Earth",
    ],
  ),
  E(
    "early-humanity",
    "Early human history",
    "Adam to Nuh (AS)",
    "The first generations",
    "The growth of the first human communities, the beginning of deviation and the mission of Nuh (AS).",
    [
      "Children and descendants of Adam",
      "Growth of early communities",
      "Beginning of shirk",
      "Mission of Nuh (AS)",
      "The Ark and the Flood",
      "A renewed human community",
    ],
  ),
  E(
    "ancient-prophets",
    "Ancient nations",
    "Prophets of Early Nations",
    "Hud, Salih and their peoples",
    "The Quranic histories of early nations, their Prophets and the lessons preserved from their rise and fall.",
    [
      "Hud (AS) and the people of Ad",
      "Salih (AS) and Thamud",
      "The she-camel as a sign",
      "Faith, rejection and accountability",
      "Lessons from vanished nations",
    ],
  ),
  E(
    "ibrahim",
    "Age of Ibrahim (AS)",
    "Ibrahim & His Family",
    "Faith, sacrifice and the Kaaba",
    "The life of Ibrahim (AS), his call to pure monotheism and the Prophetic families descending through Ismail and Ishaq.",
    [
      "Ibrahim searches for truth",
      "Confronting idolatry",
      "Migration for faith",
      "Hajar and Ismail in Makkah",
      "Building the Kaaba",
      "The test of sacrifice",
      "Ishaq, Yaqub and the Prophetic family",
    ],
  ),
  E(
    "yusuf-musa",
    "Egypt and Bani Israel",
    "Yusuf, Musa & Bani Israel",
    "Patience, liberation and revelation",
    "From the story of Yusuf (AS) in Egypt to Musa (AS), Pharaoh, the Exodus and the covenant with Bani Israel.",
    [
      "Yusuf (AS) and his brothers",
      "Yusuf in Egypt",
      "Birth and mission of Musa (AS)",
      "Musa and Pharaoh",
      "The Exodus",
      "Revelation of the Tawrah",
      "The journey of Bani Israel",
    ],
  ),
  E(
    "kingdom-prophets",
    "Prophets and kingdoms",
    "Dawud & Sulayman (AS)",
    "Justice, wisdom and worship",
    "The Prophetic kingdoms of Dawud and Sulayman, followed by later Prophets sent to guide Bani Israel.",
    [
      "Talut and Jalut",
      "Dawud (AS) as Prophet and ruler",
      "The Zabur",
      "Sulayman (AS) and his kingdom",
      "Wisdom and justice",
      "Later Prophets of Bani Israel",
    ],
  ),
  E(
    "isa-arabia",
    "Before 610 CE",
    "Isa (AS) to Arabia",
    "The final centuries before Islam",
    "The mission of Isa (AS), the people who followed earlier revelation and the Arabian setting before the final Prophethood.",
    [
      "Birth of Maryam (AS)",
      "Birth and mission of Isa (AS)",
      "The Injil and disciples",
      "Quranic account of Isa (AS)",
      "Descendants of Ismail in Arabia",
      "Makkah and the Kaaba",
      "The Year of the Elephant",
    ],
  ),
  E(
    "makkah",
    "610–622 CE",
    "The Beginning of Islam",
    "First revelation and the Makkan mission",
    "The beginning of revelation, the first believers, persecution and preparation for Hijrah.",
    [
      "First revelation",
      "Early believers",
      "Public call to Islam",
      "Migration to Abyssinia",
      "Boycott and the Year of Sorrow",
      "Pledges of Aqabah",
    ],
  ),
  E(
    "madinah",
    "622–632 CE",
    "The Madinan Period",
    "Community and completion",
    "The Hijrah, establishment of the Muslim community and the completion of the Prophetic mission.",
    [
      "Hijrah to Madinah",
      "Constitution of Madinah",
      "Badr, Uhud and the Trench",
      "Treaty of Hudaybiyyah",
      "Conquest of Makkah",
      "Farewell Pilgrimage",
    ],
  ),
  E(
    "rashidun",
    "632–661 CE",
    "Khulafa-e-Rashidun",
    "The Rightly Guided Caliphs",
    "The era of Abu Bakr, Umar, Uthman and Ali (RA) and the expansion of the early Muslim state.",
    [
      "Caliphate of Abu Bakr (RA)",
      "Caliphate of Umar (RA)",
      "Caliphate of Uthman (RA)",
      "Caliphate of Ali (RA)",
      "Compilation and preservation of the Quran",
    ],
  ),
  E(
    "umayyad",
    "661–750 CE",
    "Umayyad Caliphate",
    "Expansion across continents",
    "A major period of territorial expansion, administration, scholarship and architecture.",
    [
      "Foundation of the dynasty",
      "Damascus as capital",
      "North Africa and Al-Andalus",
      "Central Asian expansion",
      "Administration and architecture",
    ],
  ),
  E(
    "abbasid",
    "750–1258 CE",
    "Abbasid Caliphate",
    "Scholarship and civilization",
    "Baghdad, intellectual growth and the flourishing of sciences, literature and institutions.",
    [
      "Rise of the Abbasids",
      "Baghdad and the House of Wisdom",
      "Hadith and Islamic scholarship",
      "Science, medicine and mathematics",
      "Regional Muslim dynasties",
    ],
  ),
  E(
    "andalus",
    "711–1492 CE",
    "Al-Andalus",
    "Muslim Iberia",
    "The history, culture, learning and changing states of Muslim rule in the Iberian Peninsula.",
    [
      "Conquest of Iberia",
      "Emirate and Caliphate of Cordoba",
      "Knowledge and urban life",
      "Taifa kingdoms",
      "Granada and the final period",
    ],
  ),
  E(
    "crusades",
    "1095–1291 CE",
    "Crusades & Ayyubids",
    "Jerusalem and Salahuddin",
    "The Crusader period, Muslim responses and the Ayyubid restoration of Jerusalem.",
    [
      "Beginning of the Crusades",
      "Muslim states of the region",
      "Nur ad-Din Zengi",
      "Salahuddin al-Ayyubi",
      "Restoration of Jerusalem",
    ],
  ),
  E(
    "mamluk",
    "1250–1517 CE",
    "Mamluk Era",
    "Cairo, scholarship and defence",
    "The Mamluk sultanate, its institutions and its defence against Crusader and Mongol powers.",
    [
      "Rise of the Mamluks",
      "Battle of Ayn Jalut",
      "Cairo as a centre of learning",
      "Trade and architecture",
      "End of the sultanate",
    ],
  ),
  E(
    "ottoman",
    "1299–1922 CE",
    "Ottoman Empire",
    "Six centuries of history",
    "The rise, institutions, cultural life, reform and final years of the Ottoman state.",
    [
      "Origins and early expansion",
      "Conquest of Constantinople",
      "Classical Ottoman era",
      "Society, law and institutions",
      "Reform and transformation",
      "Final years and dissolution",
    ],
  ),
  E(
    "asia-africa",
    "7th–20th c.",
    "Islam Across the World",
    "Asia, Africa and beyond",
    "How Muslim communities, scholarship and states developed across diverse regions.",
    [
      "Islam in South Asia",
      "Islam in Southeast Asia",
      "Islam in East and West Africa",
      "Islam in Central Asia",
      "Muslim communities in China",
      "Trade, scholars and Sufi networks",
    ],
  ),
  E(
    "modern",
    "18th century–Today",
    "Modern Muslim World",
    "Reform, colonialism and today",
    "Colonial encounters, reform movements, independence and the modern Muslim world.",
    [
      "Colonial period",
      "Scholarly reform movements",
      "Independence movements",
      "Formation of modern states",
      "Muslim minorities worldwide",
      "Contemporary institutions and challenges",
    ],
  ),
];
export function IslamicHistoryWorkspace({
  query,
  language = "en",
}: {
  query: string;
  language?: string;
}) {
  const [selected, setSelected] = useState<Era | null>(null),
    [chapter, setChapter] = useState<number | null>(null),
    [eras, setEras] = useState<Era[]>(ERAS);
  useEffect(() => {
    let live = true;
    fetch(
      `${API}/api/islamic-history?language=${encodeURIComponent(language)}`,
      { cache: "no-store" },
    )
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw Error(body.message);
        const rows = (body.data || [])
          .map((item: any) => ({
            id: item.slug,
            range: item.range,
            title: item.title,
            subtitle: item.subtitle,
            summary: item.summary,
            topics: (item.chapters || []).map((chapter: any) => chapter.title),
            chapterContent: (item.chapters || []).map(
              (chapter: any) => chapter.content || "",
            ),
            chapterAbout: (item.chapters || []).map(
              (chapter: any) => chapter.about || "",
            ),
            chapterReferences: (item.chapters || []).map(
              (chapter: any) => chapter.reference || "",
            ),
          }))
          .filter((item: Era) => item.topics.length);
        if (live && rows.length)
          setEras([
            ...rows,
            ...ERAS.filter(
              (fallback) => !rows.some((row: Era) => row.id === fallback.id),
            ),
          ]);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [language]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? eras.filter((x) =>
          `${x.title} ${x.subtitle} ${x.summary} ${x.topics.join(" ")}`
            .toLowerCase()
            .includes(q),
        )
      : eras;
  }, [query, eras]);
  const open = (era: Era) => {
    setSelected(era);
    setChapter(null);
    window.history.pushState({}, "", `/islamic-history/${era.id}`);
  };
  useEffect(() => {
    const sync = () => {
      const parts = window.location.pathname.split("/").filter(Boolean);
      if (parts[0] !== "islamic-history") return;
      const era = eras.find((x) => x.id === parts[1]) || null;
      setSelected(era);
      const number = Number((parts[2] || "").replace(/^chapter-/, ""));
      setChapter(
        era && number >= 1 && number <= era.topics.length ? number - 1 : null,
      );
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [eras]);
  const openChapter = (index: number) => {
    if (!selected) return;
    setChapter(index);
    window.history.pushState(
      {},
      "",
      `/islamic-history/${selected.id}/chapter-${index + 1}`,
    );
  };
  if (selected && chapter !== null) {
    const title = selected.topics[chapter],
      copy = `${title}\n\n${selected.title} · ${selected.range}\n\n${selected.summary}`;
    return (
      <div className='history-chapter'>
        <button
          className='section-back'
          onClick={() => {
            setChapter(null);
            window.history.pushState({}, "", `/islamic-history/${selected.id}`);
          }}
        >
          ← {selected.title}
        </button>
        <header>
          <small>
            CHAPTER {String(chapter + 1).padStart(2, "0")} · {selected.range}
          </small>
          <h1>{title}</h1>
          <p>{selected.subtitle}</p>
        </header>
        <article>
          <h2>Historical context</h2>
          <div
            className='history-content'
            dangerouslySetInnerHTML={{
              __html: selected.chapterContent?.[chapter] || selected.summary,
            }}
          />
          {selected.chapterReferences?.[chapter] ? (
            <aside>
              <b>Verified sources</b>
              <p>{selected.chapterReferences[chapter]}</p>
            </aside>
          ) : null}
          <aside>
            <b>About this chapter</b>
            <p>
              {selected.chapterAbout?.[chapter] ||
                `This topic belongs to the ${selected.title} period and is part of the same Islamic History curriculum available in the mobile app.`}
            </p>
          </aside>
        </article>
        <footer>
          <button
            onClick={() => {
              const key = "deenislam_web_bookmarks",
                rows = JSON.parse(
                  localStorage.getItem(key) || "[]",
                ) as string[];
              if (!rows.includes(copy))
                localStorage.setItem(key, JSON.stringify([copy, ...rows]));
            }}
          >
            ♡ Bookmark
          </button>
          <button onClick={() => navigator.clipboard?.writeText(copy)}>
            Copy
          </button>
          <i />
          <button
            disabled={chapter === 0}
            onClick={() => openChapter(chapter - 1)}
          >
            ← Previous
          </button>
          <button
            disabled={chapter === selected.topics.length - 1}
            onClick={() => openChapter(chapter + 1)}
          >
            Next →
          </button>
        </footer>
      </div>
    );
  }
  if (selected)
    return (
      <div className='history-reader'>
        <button
          className='section-back'
          onClick={() => {
            setSelected(null);
            setChapter(null);
            window.history.pushState({}, "", "/islamic-history");
          }}
        >
          ← Historical periods
        </button>
        <header>
          <small>{selected.range}</small>
          <h1>{selected.title}</h1>
          <p>{selected.subtitle}</p>
        </header>
        <article>
          <h2>Overview</h2>
          <p>{selected.summary}</p>
          <h2>Chapters in this era</h2>
          {selected.topics.map((topic, index) => (
            <a
              key={topic}
              href={`/islamic-history/${selected.id}/chapter-${index + 1}`}
              onClick={(event) => {
                event.preventDefault();
                openChapter(index);
              }}
            >
              <i>{index + 1}</i>
              <span>{topic}</span>
              <b>›</b>
            </a>
          ))}
        </article>
      </div>
    );
  return (
    <div className='history-library'>
      <a className='sahaba-back' href='/'>
        <b>‹</b> Back to Home
      </a>
      <div className='feature-hero history-hero'>
        <span>FROM CREATION TO TODAY</span>
        <h2>Explore Islamic History</h2>
        <p>
          Follow the Quranic story of humanity through every major Islamic
          period to the Muslim world today.
        </p>
        <div className='history-hero-stats'>
          <div>
            <b>{shown.length}</b>
            <small>HISTORICAL ERAS</small>
          </div>
          <div>
            <b>{shown.reduce((total, era) => total + era.topics.length, 0)}</b>
            <small>GUIDED CHAPTERS</small>
          </div>
        </div>
      </div>
      <div className='history-heading'>
        <h2>Historical periods</h2>
        <b>{shown.length} eras</b>
      </div>
      <div className='history-grid'>
        {shown.map((era, index) => (
          <button key={era.id} onClick={() => open(era)}>
            <header>
              <span>ERA {String(index + 1).padStart(2, "0")}</span>
              <em>{era.range}</em>
              <b>›</b>
            </header>
            <h2>{era.title}</h2>
            <strong>{era.subtitle}</strong>
            <p>{era.summary}</p>
            <footer>
              <span>● {era.topics.length} chapters</span>
              <b>Explore era →</b>
            </footer>
          </button>
        ))}
      </div>
      {!shown.length ? (
        <div className='history-empty'>
          <span>⌕</span>
          <h2>No historical period found</h2>
          <p>Try searching by an era, event, chapter or timeline.</p>
        </div>
      ) : null}
      <small className='history-note'>
        Historical articles should be reviewed against reliable primary and
        scholarly sources before publication.
      </small>
    </div>
  );
}
