"use client";

import { useCallback, useEffect, useState } from "react";
import { tokenPermissions } from "../lib/adminPermissions";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:6002").replace(/\/$/, "");
type Row = { section: string; views: number; readers: number; staySeconds: number; completions?: number };
type ContentRow = Row & { contentId: string; title: string };
type Payload = { days: number; scope: string[]; superAdmin: boolean; selectedSection: string; totals: { views: number; readers: number; webViews: number; webReaders: number; appViews: number; appReaders: number; staySeconds: number; completions: number }; sections: Row[]; topContent: ContentRow[] };
const labels: Record<string, string> = { quran: "Quran", tafsir: "Tafsir", hadith: "Hadith", books: "Books", duas: "Duas", amol: "Amol", sahaba: "Sahaba", prophets: "Prophets", islamic_history: "Islamic History", islamic_lifestyle: "Islamic Lifestyle", daily_prayer: "Daily Prayer" };
const sectionPermissions: Record<string, string> = { quran: "quran.manage", tafsir: "tafsir.manage", hadith: "hadith.manage", books: "books.manage", duas: "duas.manage", amol: "amol.manage", sahaba: "sahaba.manage", prophets: "prophets.manage", islamic_history: "islamic_history.manage", islamic_lifestyle: "lifestyle.manage", daily_prayer: "daily_prayer.manage" };
const duration = (seconds: number) => seconds < 60 ? `${seconds}s` : seconds < 3600 ? `${Math.round(seconds / 60)}m` : `${(seconds / 3600).toFixed(1)}h`;

export default function ContentEngagementSummary() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [selectedSection, setSelectedSection] = useState("all");
  const [permittedSections, setPermittedSections] = useState<string[]>([]);
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const token = sessionStorage.getItem("deenislam_admin_token") || "";
      const query = new URLSearchParams({ days: String(days) });
      if (selectedSection !== "all") query.set("section", selectedSection);
      const response = await fetch(`${API}/api/admin/content-engagement?${query}`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" });
      const raw = await response.text();
      let body: any = {};
      try { body = raw ? JSON.parse(raw) : {}; } catch {
        throw Error(response.status === 404 ? "Content analytics API is not active yet. Restart the DeenIslam server after deploying the latest code." : "The API returned a non-JSON response. Check NEXT_PUBLIC_API_URL and the Nginx /api proxy.");
      }
      if (!response.ok) throw Error(body.message || (response.status === 401 ? "Your admin session expired. Sign out and sign in again." : "Unable to load content engagement."));
      setData(body.data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load content engagement."); }
    finally { setLoading(false); }
  }, [days, selectedSection]);
  useEffect(() => {
    const permissions = tokenPermissions(sessionStorage.getItem("deenislam_admin_token") || "");
    const sections = Object.keys(sectionPermissions).filter(section => permissions.includes("*") || permissions.includes(sectionPermissions[section]));
    setPermittedSections(sections);
    if (!permissions.includes("*") && sections.length > 0) setSelectedSection(sections[0]);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const maximum = Math.max(1, ...(data?.sections.map(row => row.views) || [1]));
  const average = data?.totals.readers ? Math.round(data.totals.staySeconds / data.totals.readers) : 0;
  const categoryOptions = data?.scope?.length ? data.scope : permittedSections;
  const isSuperAdmin = Boolean(data?.superAdmin || tokenPermissions(typeof window === "undefined" ? "" : sessionStorage.getItem("deenislam_admin_token") || "").includes("*"));
  return <section className="engagementAnalytics">
    <header><div><span>CONTENT PERFORMANCE</span><h2>Reader engagement overview</h2><p>{isSuperAdmin ? "Super Admin — access to every content category" : `Your assigned categories: ${categoryOptions.map(item => labels[item] || item).join(", ") || "none"}`}</p></div><div className="engagementControls"><label>Category<select value={selectedSection} onChange={event => setSelectedSection(event.target.value)}>{isSuperAdmin && <option value="all">All Categories</option>}{categoryOptions.map(section => <option key={section} value={section}>{labels[section] || section}</option>)}</select></label><div className="engagementActions">{([7, 30, 90] as const).map(value => <button type="button" key={value} className={days === value ? "active" : ""} onClick={() => setDays(value)}>{value}D</button>)}<button type="button" onClick={() => void load()} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button></div></div></header>
    {error && <p className="visitorAnalyticsError">{error}</p>}
    <div className="engagementMetrics"><article><small>CONTENT VIEWS</small><strong>{data?.totals.views || 0}</strong><span>Web and app combined</span></article><article><small>UNIQUE READERS</small><strong>{data?.totals.readers || 0}</strong><span>Distinct app/web visitors</span></article><article><small>WEB VISITS</small><strong>{data?.totals.webViews || 0}</strong><span>Category content opened on web</span></article><article><small>WEB VISITORS</small><strong>{data?.totals.webReaders || 0}</strong><span>Unique web readers</span></article><article><small>APP VIEWS</small><strong>{data?.totals.appViews || 0}</strong><span>Category content opened in app</span></article><article><small>APP READERS</small><strong>{data?.totals.appReaders || 0}</strong><span>Unique app readers</span></article><article><small>TOTAL READING TIME</small><strong>{duration(data?.totals.staySeconds || 0)}</strong><span>Tracked active stay time</span></article><article><small>AVG. TIME / READER</small><strong>{duration(average)}</strong><span>Average engagement</span></article></div>
    <div className="engagementBody"><section><div className="engagementTitle"><b>Category performance</b><span>Only categories you can manage are shown</span></div><div className="sectionPerformance">{data?.sections.map(row => <article key={row.section}><div><b>{labels[row.section] || row.section}</b><span>{row.readers} readers · {duration(row.staySeconds)}</span></div><strong>{row.views}</strong><i><em style={{ width: `${Math.max(3, row.views / maximum * 100)}%` }} /></i></article>)}{!loading && !data?.sections.length && <p>No content activity recorded yet.</p>}</div></section><section><div className="engagementTitle"><b>Most-read content</b><span>Top items in this period</span></div><div className="topContentRows">{data?.topContent.slice(0, 8).map((row, index) => <article key={`${row.section}:${row.contentId}`}><i>{index + 1}</i><div><b>{row.title}</b><span>{labels[row.section] || row.section} · {row.readers} readers · {duration(row.staySeconds)}</span></div><strong>{row.views}</strong></article>)}{!loading && !data?.topContent.length && <p>No content ranking available yet.</p>}</div></section></div>
  </section>;
}
