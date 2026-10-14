"use client";

import { useCallback, useEffect, useState } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:6002").replace(/\/$/, "");

type DailyAnalytics = {
  date: string;
  installs: number;
  opens: number;
  webVisitors: number;
  webVisits: number;
  activeWebVisitors: number;
  activeUsers?: number;
};

type AnalyticsPayload = {
  daily: DailyAnalytics[];
  totals: { installs: number; opens: number; webVisitors: number; webVisits: number };
};

const dateValue = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export default function VisitorAnalyticsSummary() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7);
  const [selectedDate, setSelectedDate] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = sessionStorage.getItem("deenislam_admin_token") || "";
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - rangeDays + 1);
      const query = new URLSearchParams({ from: dateValue(from), to: dateValue(to) });
      const response = await fetch(`${API}/api/admin/analytics?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Unable to load visitor analytics.");
      const nextData = body.data as AnalyticsPayload;
      setData(nextData);
      setSelectedDate((current) => nextData.daily.some((day) => day.date === current) ? current : nextData.daily.at(-1)?.date || "");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load visitor analytics.");
    } finally {
      setLoading(false);
    }
  }, [rangeDays]);

  useEffect(() => { void load(); }, [load]);

  const metrics = [
    ["Web visitors", data?.totals.webVisitors || 0, "Unique browsers"],
    ["Web visits", data?.totals.webVisits || 0, "Website page sessions"],
    ["App installs", data?.totals.installs || 0, "First app launches"],
    ["App opens", data?.totals.opens || 0, "Recorded app activity"],
  ] as const;
  const selectedDay = data?.daily.find((day) => day.date === selectedDate);
  const selectedMetrics = selectedDay ? [
    ["Web visits", selectedDay.webVisits || 0],
    ["Web visitors", selectedDay.activeWebVisitors || 0],
    ["App installs", selectedDay.installs || 0],
    ["App opens", selectedDay.opens || 0],
    ["Active users", selectedDay.activeUsers || 0],
  ] as const : [];

  const exportPdf = () => {
    if (!data?.daily.length) return;
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      setError("Please allow pop-ups to export the analytics PDF.");
      return;
    }
    reportWindow.opener = null;
    const period = `${data.daily[0].date} to ${data.daily.at(-1)?.date || data.daily[0].date}`;
    const rows = data.daily.map((day) => `
      <tr>
        <td>${day.date}</td>
        <td>${day.webVisits || 0}</td>
        <td>${day.activeWebVisitors || 0}</td>
        <td>${day.installs || 0}</td>
        <td>${day.opens || 0}</td>
        <td>${day.activeUsers || 0}</td>
      </tr>`).join("");
    reportWindow.document.write(`<!doctype html>
      <html><head><title>DeenIslam Analytics - ${period}</title>
      <style>
        @page{size:A4 landscape;margin:14mm}*{box-sizing:border-box}body{margin:0;color:#183d30;font:12px Arial,sans-serif}header{display:flex;justify-content:space-between;align-items:flex-end;padding:20px 22px;border-radius:14px;background:#08754b;color:#fff}h1{margin:0 0 5px;font-size:24px}header p{margin:0;color:#d6eee3}.brand{font-weight:800;letter-spacing:.7px}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}.summary div{padding:13px;border:1px solid #d9e8df;border-radius:10px}.summary small,.summary strong{display:block}.summary small{color:#61786e}.summary strong{margin-top:5px;color:#08754b;font-size:22px}table{width:100%;border-collapse:collapse}th,td{padding:9px 10px;border-bottom:1px solid #dfe9e3;text-align:left}th{background:#edf7f1;color:#315a49;font-size:10px;text-transform:uppercase}tbody tr:nth-child(even){background:#f8fbf9}footer{margin-top:15px;color:#71857b;font-size:9px;text-align:right}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      </style></head><body>
      <header><div><h1>Visitor and installation analytics</h1><p>${period} (${rangeDays} days)</p></div><div class="brand">DEEN ISLAM</div></header>
      <section class="summary">
        <div><small>Web visitors</small><strong>${data.totals.webVisitors || 0}</strong></div>
        <div><small>Web visits</small><strong>${data.totals.webVisits || 0}</strong></div>
        <div><small>App installs</small><strong>${data.totals.installs || 0}</strong></div>
        <div><small>App opens</small><strong>${data.totals.opens || 0}</strong></div>
      </section>
      <table><thead><tr><th>Date</th><th>Web visits</th><th>Web visitors</th><th>App installs</th><th>App opens</th><th>Active users</th></tr></thead><tbody>${rows}</tbody></table>
      <footer>Generated ${new Date().toLocaleString()} - deenislam.app</footer>
      <script>window.addEventListener('load',()=>{setTimeout(()=>window.print(),150)});<\/script>
      </body></html>`);
    reportWindow.document.close();
  };

  return (
    <section className='visitorAnalytics'>
      <header>
        <div>
          <span>WEB & APP AUDIENCE</span>
          <h2>Visitor and installation analytics</h2>
          <p>Anonymous website visits and mobile app activity from the selected {rangeDays} days.</p>
        </div>
        <div className='visitorAnalyticsActions'>
          <div className='visitorRange' aria-label='Analytics date range'>
            {([7, 14, 30] as const).map((days) => (
              <button key={days} type='button' className={rangeDays === days ? "active" : ""} aria-pressed={rangeDays === days} onClick={() => setRangeDays(days)}>{days}D</button>
            ))}
          </div>
          <button className='visitorPdf' type='button' onClick={exportPdf} disabled={!data?.daily.length}>Save PDF</button>
          <button className='visitorRefresh' type='button' onClick={() => void load()} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</button>
        </div>
      </header>
      {error && <p className='visitorAnalyticsError'>{error}</p>}
      <div className='visitorMetricGrid'>
        {metrics.map(([label, value, note]) => <article key={label}><small>{label}</small><strong>{value.toLocaleString()}</strong><span>{note}</span></article>)}
      </div>
      {!!data?.daily.length && (
        <div className='visitorDaily'>
          <div className='visitorDailyHead'><b>Recent daily activity</b><span>Latest {rangeDays} days - select a day</span></div>
          <div className='visitorDailyRows'>
            {data.daily.map((day) => (
              <button key={day.date} type='button' className={selectedDate === day.date ? "active" : ""} aria-pressed={selectedDate === day.date} onClick={() => setSelectedDate(day.date)}>
                <time dateTime={day.date}>{new Date(`${day.date}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric" })}</time>
                <span><b>{day.webVisits || 0}</b> web visits</span>
                <span><b>{day.activeWebVisitors || 0}</b> web visitors</span>
                <span><b>{day.installs || 0}</b> installs</span>
                <span><b>{day.opens || 0}</b> app opens</span>
              </button>
            ))}
          </div>
          {selectedDay && (
            <aside className='visitorDayDetail' aria-live='polite'>
              <div><small>SELECTED DAY</small><strong>{new Date(`${selectedDay.date}T00:00:00`).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</strong></div>
              <div className='visitorDayMetrics'>{selectedMetrics.map(([label, value]) => <span key={label}><b>{value.toLocaleString()}</b>{label}</span>)}</div>
            </aside>
          )}
        </div>
      )}
    </section>
  );
}
