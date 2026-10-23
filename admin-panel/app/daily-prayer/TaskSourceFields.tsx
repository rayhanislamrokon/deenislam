"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  api: string;
  token: string;
  item: any;
  onPatch: (patch: Record<string, unknown>) => void;
  onAddExtra: (task: Record<string, unknown>) => void;
};

const plain = (value: unknown) =>
  String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export default function TaskSourceFields({ api, token, item, onPatch, onAddExtra }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [appliedHadithId, setAppliedHadithId] = useState("");
  const [tafsirSources, setTafsirSources] = useState<any[]>([]);
  const [tafsirSourceId, setTafsirSourceId] = useState(String(item.tafsirSourceId || ""));
  const [startAyah, setStartAyah] = useState(Number(item.startAyah) || 1);
  const [endAyah, setEndAyah] = useState(
    (Number(item.startAyah) || 1) + (Number(item.ayahCount) || 1) - 1,
  );

  const supported = item.type === "quran" || item.type === "tafsir" || item.type === "hadith";
  useEffect(() => {
    if (!supported || !token) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    Promise.all(
      (item.type === "tafsir"
        ? ["/api/admin/daily-prayer/content-options?type=quran", "/api/admin/daily-prayer/tafsir-sources"]
        : [`/api/admin/daily-prayer/content-options?type=${item.type}`]
      ).map(async (path) => {
        const response = await fetch(`${api}${path}`, {
          headers: { Authorization: `Bearer ${token}` }, signal: controller.signal,
        });
        const body = await response.json();
        if (!response.ok) throw Error(body.message || "Unable to load content.");
        return Array.isArray(body.data) ? body.data : [];
      }),
    )
      .then(([contentRows, sourceRows = []]) => {
        setRows(contentRows);
        setTafsirSources(sourceRows);
        if (item.type === "tafsir" && !tafsirSourceId && sourceRows[0])
          setTafsirSourceId(String(sourceRows[0].sourceId || sourceRows[0].id));
      })
      .catch((reason) => {
        if (reason.name !== "AbortError") setError(reason.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [api, token, item.type, supported]);

  const collections = useMemo(
    () =>
      Array.from(
        new Set(
          rows.map((row) =>
            String(row.collectionName || row.collectionId || "HadeethEnc"),
          ),
        ),
      ),
    [rows],
  );
  const [collection, setCollection] = useState("");
  const hadithRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          !collection ||
          String(row.collectionName || row.collectionId || "HadeethEnc") === collection,
      ),
    [collection, rows],
  );

  if (!supported) return null;

  async function applyQuran() {
    const surah = rows.find((row) => String(row.number) === selectedId);
    if (!surah) return;
    const max = Math.max(1, Number(surah.numberOfAyahs) || 1);
    const start = Math.max(1, Math.min(startAyah, max));
    const end = Math.max(start, Math.min(endAyah, max));
    setLoading(true);
    try {
      const response = await fetch(
        `${api}/api/admin/daily-prayer/quran/${surah.number}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const body = await response.json();
      if (!response.ok) throw Error(body.message || "Unable to load Ayahs.");
      const ayahs = Array.isArray(body.data?.ayahs) ? body.data.ayahs.slice(start - 1, end) : [];
      const name = surah.englishName || surah.name;
      onPatch({
        title: "Quran Reading",
        subtitle: `Surah ${name} - Ayah ${start}-${end}`,
        instruction: `Read and reflect on Ayah ${start} to ${end}.`,
        detailArabic: ayahs.map((ayah: any) => ayah.text || "").filter(Boolean).join(" ﴿ "),
        detailMeaning: ayahs.map((ayah: any) => ayah.translation || ayah.translations?.en || "").filter(Boolean).join(" "),
        ayahs: ayahs.map((ayah: any, index: number) => ({
          number: Number(ayah.numberInSurah) || start + index,
          arabic: String(ayah.text || ""),
          pronunciation: String(
            ayah.pronunciations?.en || ayah.transliteration || "",
          ),
          meaning: String(ayah.translations?.en || ayah.translation || ""),
        })),
        contentId: `surah-${surah.number}:${start}-${end}`,
        surahNumber: Number(surah.number),
        surahName: name,
        startAyah: start,
        ayahCount: end - start + 1,
        maxAyahs: max,
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load Ayahs.");
    } finally {
      setLoading(false);
    }
  }

  async function applyTafsir() {
    const surah = rows.find((row) => String(row.number) === selectedId);
    if (!surah || !tafsirSourceId) return;
    const max = Math.max(1, Number(surah.numberOfAyahs) || 1);
    const start = Math.max(1, Math.min(startAyah, max));
    const end = Math.max(start, Math.min(endAyah, max));
    setLoading(true); setError("");
    try {
      const response = await fetch(`${api}/api/admin/daily-prayer/tafsir/${encodeURIComponent(tafsirSourceId)}/${surah.number}?start=${start}&end=${end}`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json();
      if (!response.ok) throw Error(body.message || "Unable to load Tafsir.");
      const selected = Array.isArray(body.data) ? body.data : [];
      if (!selected.length) throw Error("No Tafsir content is available for this selection.");
      const source = tafsirSources.find((row) => String(row.sourceId || row.id) === tafsirSourceId);
      const name = surah.englishName || surah.name;
      onPatch({
        title: "Tafsir Study", subtitle: `Surah ${name} - Ayah ${start}-${end}`,
        instruction: `Study the Tafsir of Ayah ${start} to ${end}.`,
        detailMeaning: selected.map((row: any) => plain(row.text || row.commentary || row.content)).join("\n\n"),
        tafsirAyahs: selected.map((row: any) => ({ number: Number(row.ayahNumber), text: plain(row.text || row.commentary || row.content) })),
        contentId: `tafsir-${tafsirSourceId}:${surah.number}:${start}-${end}`,
        tafsirSourceId, tafsirSourceName: source?.name || selected[0]?.sourceName || "Tafsir",
        surahNumber: Number(surah.number), surahName: name, startAyah: start,
        ayahCount: end - start + 1, maxAyahs: max,
      });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load Tafsir."); }
    finally { setLoading(false); }
  }

  function hadithTask(row: any) {
    const number = String(row.hadithNumber || row.id || "");
    const source = String(row.collectionName || row.collectionId || "HadeethEnc");
    return {
      type: "hadith",
      title: row.title || `Hadith ${number}`,
      subtitle: `${source} - Hadith ${number}`,
      instruction: row.reference || row.source || "Read and reflect on this Hadith.",
      detailArabic: plain(row.arabic),
      detailMeaning: plain(row.text || row.meaning),
      contentId: String(row.id || number),
      hadithCollection: source,
      hadithNumber: number,
      rewardPoints: Number(item.rewardPoints) || 20,
    };
  }

  const selectedHadith = hadithRows.find(
    (row) => String(row.id || row.hadithNumber) === selectedId,
  );
  return (
    <div className="sourceFields">
      <div className="sourceTitle">
        <b>{item.type === "quran" ? "Quran Ayah selector" : item.type === "tafsir" ? "Tafsir Ayah selector" : "Hadith selector"}</b>
        <small>Data will be loaded from your existing server content.</small>
      </div>
      {loading && !rows.length ? <p>Loading...</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {item.type === "quran" ? (
        <div className="sourceGrid quranGrid">
          <label>Surah<select value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setStartAyah(1); setEndAyah(5); }}><option value="">Select Surah</option>{rows.map((row) => <option key={row.number} value={row.number}>{row.number}. {row.englishName || row.name} ({row.numberOfAyahs} Ayahs)</option>)}</select></label>
          <label>Start Ayah<input type="number" min="1" value={startAyah} onChange={(e) => setStartAyah(Math.max(1, Number(e.target.value) || 1))}/></label>
          <label>End Ayah<input type="number" min={startAyah} value={endAyah} onChange={(e) => setEndAyah(Math.max(startAyah, Number(e.target.value) || startAyah))}/></label>
          <button type="button" disabled={!selectedId || loading} onClick={() => void applyQuran()}>{loading ? "Loading..." : "Apply Ayahs"}</button>
        </div>
      ) : item.type === "tafsir" ? (
        <div className="sourceGrid tafsirGrid">
          <label>Tafsir source<select value={tafsirSourceId} onChange={(e) => setTafsirSourceId(e.target.value)}><option value="">Select source</option>{tafsirSources.map((row) => <option key={String(row.sourceId || row.id)} value={String(row.sourceId || row.id)}>{row.name}</option>)}</select></label>
          <label>Surah<select value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setStartAyah(1); setEndAyah(1); }}><option value="">Select Surah</option>{rows.map((row) => <option key={row.number} value={row.number}>{row.number}. {row.englishName || row.name} ({row.numberOfAyahs} Ayahs)</option>)}</select></label>
          <label>Start Ayah<input type="number" min="1" value={startAyah} onChange={(e) => setStartAyah(Math.max(1, Number(e.target.value) || 1))}/></label>
          <label>End Ayah<input type="number" min={startAyah} value={endAyah} onChange={(e) => setEndAyah(Math.max(startAyah, Number(e.target.value) || startAyah))}/></label>
          <button type="button" disabled={!selectedId || !tafsirSourceId || loading} onClick={() => void applyTafsir()}>{loading ? "Loading..." : "Apply Tafsir"}</button>
        </div>
      ) : (
        <div className="sourceGrid hadithGrid">
          <label>Hadith collection<select value={collection} onChange={(e) => { setCollection(e.target.value); setSelectedId(""); setAppliedHadithId(""); }}><option value="">All collections</option>{collections.map((name) => <option value={name} key={name}>{name}</option>)}</select></label>
          <label>Hadith number<select value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setAppliedHadithId(""); }}><option value="">Select Hadith</option>{hadithRows.map((row) => { const number=String(row.hadithNumber||row.id||""); return <option value={String(row.id||number)} key={String(row.id||number)}>{number} - {plain(row.title||row.text).slice(0,70)}</option>; })}</select></label>
          <button type="button" disabled={!selectedHadith} onClick={() => { if (!selectedHadith) return; onPatch(hadithTask(selectedHadith)); setAppliedHadithId(selectedId); }}>{appliedHadithId === selectedId && selectedId ? "Hadith Applied ✓" : "Apply Hadith"}</button>
          <button type="button" className="extra" disabled={!selectedHadith} onClick={() => { if (!selectedHadith) return; onAddExtra({ id:`hadith-${selectedHadith.id||selectedHadith.hadithNumber}-${Date.now()}`, ...hadithTask(selectedHadith) }); setAppliedHadithId(selectedId); }}>+ Add another Hadith</button>
        </div>
      )}
      <style jsx>{`.sourceFields{grid-column:1/-1;padding:16px;border:1px solid #b8dbc4;border-radius:13px;background:#eef8f1}.sourceTitle b,.sourceTitle small{display:block}.sourceTitle small{margin-top:3px;color:#63766c;font-size:10px}.sourceGrid{display:grid;gap:10px;margin-top:13px;align-items:end}.quranGrid,.tafsirGrid,.hadithGrid{grid-template-columns:repeat(6,minmax(0,1fr))}.quranGrid label:nth-child(1){grid-column:1/-1}.quranGrid label:nth-child(2),.quranGrid label:nth-child(3),.quranGrid button{grid-column:span 2}.tafsirGrid label:nth-child(1),.tafsirGrid label:nth-child(2),.hadithGrid label{grid-column:span 3}.tafsirGrid label:nth-child(3),.tafsirGrid label:nth-child(4),.tafsirGrid button{grid-column:span 2}.hadithGrid button{grid-column:span 3}.sourceGrid label{font-size:10px;font-weight:800}.sourceGrid select,.sourceGrid input{margin-top:5px;width:100%;min-width:0}.sourceGrid button{height:43px;padding:0 14px;border:0;border-radius:9px;background:#087a4d;color:#fff;font-weight:900;white-space:nowrap}.sourceGrid button:disabled{opacity:.5}.sourceGrid .extra{background:#dfeee4;color:#075c43}.error{color:#a33}@media(max-width:900px){.quranGrid,.tafsirGrid,.hadithGrid{grid-template-columns:1fr 1fr}.quranGrid label:nth-child(n),.quranGrid button,.tafsirGrid label:nth-child(n),.tafsirGrid button,.hadithGrid label,.hadithGrid button{grid-column:span 1}.quranGrid label:nth-child(1),.tafsirGrid label:nth-child(1),.tafsirGrid label:nth-child(2),.hadithGrid label{grid-column:1/-1}}`}</style>
    </div>
  );
}
