import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  BarChart3,
  FileText,
  Download,
  Printer,
  Search,
  RefreshCw,
  X,
  ChevronUp,
  ShieldCheck,
  AlertTriangle,
  Inbox,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./HODTheme.css";
import "./HODReports.css";

/*
  DATA CONTRACT (adjust `normalize` below if your API differs)

  authApi.getReports({ range })  ->  {
    cards:   [{ id, title, value, description, tone, trend, progress }],
    reports: [{ id, title, category, status, createdAt, generatedBy, summary, downloadUrl }],
    series:  [{ label, value }],                 // bar chart
    split:   [{ label, value, color }],          // donut legend, values are counts
    activity:[number, ...]                       // heatmap, one number per day
  }
  tone: indigo | violet | emerald | cyan | amber | rose
  status: ready | pending | failed
*/

const RANGES = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "term", label: "This term" }
];

const TABS = [
  { id: "overview", label: "Overview", Icon: BarChart3 },
  { id: "history", label: "Report history", Icon: FileText }
];

const PAGE_SIZE = 8;

function normalize(res) {
  return {
    cards: Array.isArray(res?.cards) ? res.cards : [],
    reports: Array.isArray(res?.reports) ? res.reports : [],
    series: Array.isArray(res?.series) ? res.series : [],
    split: Array.isArray(res?.split) ? res.split : [],
    activity: Array.isArray(res?.activity) ? res.activity : []
  };
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function Trend({ value }) {
  if (value === undefined || value === null) return null;
  const n = Number(value);
  const kind = n > 0 ? "up" : n < 0 ? "down" : "flat";
  const Icon = n > 0 ? TrendingUp : n < 0 ? TrendingDown : Minus;
  return (
    <span className={`hod-rep-trend ${kind}`}>
      <Icon size={12} />
      {Math.abs(n)}%
    </span>
  );
}

function StatusPill({ status }) {
  const s = ["ready", "pending", "failed"].includes(status) ? status : "pending";
  return <span className={`hod-rep-status ${s}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
}

export default function HODReports({ currentUser, showToast }) {
  const [range, setRange] = useState("30d");
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(normalize(null));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" });
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const closeRef = useRef(null);
  const menuRef = useRef(null);
  const toastTimer = useRef(null);

  const notify = useCallback(
    (message, isError = false) => {
      if (showToast) {
        showToast(message, isError);
        return;
      }
      setToast({ message, isError });
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 2600);
    },
    [showToast]
  );

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    Promise.resolve()
      .then(() => {
        if (typeof authApi.getReports !== "function") {
          throw new Error("authApi.getReports is not defined. Add the reports API method to authApi.");
        }
        return authApi.getReports({ range });
      })
      .then((res) => {
        if (!alive) return;
        setData(normalize(res));
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        console.error("Failed to load reports:", err);
        setData(normalize(null));
        setError(err?.message || "Could not load reports.");
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [range, reloadKey]);

  useEffect(() => setPage(1), [query, statusFilter, category, sort, range]);

  // Drawer: focus + Escape
  useEffect(() => {
    if (!selected) return undefined;
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && setSelected(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  // Close export menu on outside click
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const categories = useMemo(
    () => [...new Set(data.reports.map((r) => r.category).filter(Boolean))].sort(),
    [data.reports]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = data.reports.filter(
      (r) =>
        (statusFilter === "all" || r.status === statusFilter) &&
        (category === "all" || r.category === category) &&
        (!q || `${r.title} ${r.category} ${r.generatedBy}`.toLowerCase().includes(q))
    );
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = sort.key === "createdAt" ? new Date(a.createdAt).getTime() || 0 : String(a[sort.key] ?? "").toLowerCase();
      const bv = sort.key === "createdAt" ? new Date(b.createdAt).getTime() || 0 : String(b[sort.key] ?? "").toLowerCase();
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  }, [data.reports, query, statusFilter, category, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const filtersActive = query || statusFilter !== "all" || category !== "all";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("all");
    setCategory("all");
  };

  const toggleSort = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const exportCsv = () => {
    setMenuOpen(false);
    if (filtered.length === 0) {
      notify("There are no reports to export.", true);
      return;
    }
    const head = ["Title", "Category", "Status", "Created", "Generated by"];
    const lines = filtered.map((r) =>
      [r.title, r.category, r.status, formatDate(r.createdAt), r.generatedBy].map(csvEscape).join(",")
    );
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `department-reports-${range}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify(`Exported ${filtered.length} report${filtered.length === 1 ? "" : "s"}.`);
  };

  const printPage = () => {
    setMenuOpen(false);
    window.print();
  };

  const maxBar = Math.max(1, ...data.series.map((s) => Number(s.value) || 0));
  const splitTotal = data.split.reduce((sum, s) => sum + (Number(s.value) || 0), 0);
  const topSplit = data.split[0];
  const donutPct = splitTotal && topSplit ? Math.round(((Number(topSplit.value) || 0) / splitTotal) * 100) : 0;
  const maxActivity = Math.max(1, ...data.activity.map((n) => Number(n) || 0));
  const dept = currentUser?.department;

  return (
    <div className="hod-role-view hod-rep-container">
      {/* Header */}
      <div className="hod-pane-header">
        <div>
          <h2>
            <BarChart3 size={24} color="var(--hod-primary)" />
            Reports & Audit{dept ? ` (${dept})` : ""}
          </h2>
          <p>Department performance, compliance and generated reports.</p>
        </div>

        <div className="hod-rep-actions">
          <div className="hod-rep-range" role="group" aria-label="Date range">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                className={range === r.id ? "active" : ""}
                aria-pressed={range === r.id}
                onClick={() => setRange(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="hod-btn-secondary"
            onClick={() => setReloadKey((k) => k + 1)}
            disabled={loading}
          >
            <RefreshCw size={14} />
            <span>{loading ? "Loading…" : "Refresh"}</span>
          </button>

          <div className="hod-rep-menu" ref={menuRef}>
            <button
              type="button"
              className="hod-btn-primary"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <Download size={14} />
              <span>Export</span>
            </button>
            {menuOpen && (
              <div className="hod-rep-menu-list" role="menu">
                <button type="button" role="menuitem" onClick={exportCsv}>
                  <FileText size={14} />
                  Download CSV
                </button>
                <button type="button" role="menuitem" onClick={printPage}>
                  <Printer size={14} />
                  Print or save PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="hod-card hod-rep-banner">
        <div className="hod-rep-banner-content">
          <div className="hod-rep-banner-icon">
            <ShieldCheck size={26} color="var(--hod-primary)" />
          </div>
          <div>
            <h3>Audit-ready department data</h3>
            <p>Every figure below comes from your department records for the selected period.</p>
          </div>
        </div>
        <span className="hod-rep-live">Live data</span>
      </div>

      {error && (
        <div className="hod-rep-error" role="alert">
          <AlertTriangle size={28} color="#f43f5e" />
          <h3>Reports could not be loaded</h3>
          <p>{error}</p>
          <button type="button" className="hod-btn-primary" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw size={14} />
            <span>Try again</span>
          </button>
        </div>
      )}

      {!error && (
        <>
          <div className="hod-rep-tabs" role="tablist" aria-label="Report sections">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`hod-rep-tab-${id}`}
                aria-selected={tab === id}
                aria-controls={`hod-rep-panel-${id}`}
                className={`hod-rep-tab ${tab === id ? "active" : ""}`}
                onClick={() => setTab(id)}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="hod-rep-panel hod-rep-container" role="tabpanel" id="hod-rep-panel-overview" aria-labelledby="hod-rep-tab-overview">
              {loading ? (
                <div className="hod-rep-grid" aria-busy="true">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="hod-rep-skeleton" />
                  ))}
                </div>
              ) : data.cards.length === 0 ? (
                <div className="hod-rep-empty">
                  <Inbox size={34} style={{ opacity: 0.5 }} />
                  <h3>No report data for this period</h3>
                  <p>Pick a longer range, or check back after attendance, marks and leave data have been recorded.</p>
                </div>
              ) : (
                <div className="hod-rep-grid">
                  {data.cards.map((c, i) => {
                    const tone = ["indigo", "violet", "emerald", "cyan", "amber", "rose"].includes(c.tone) ? c.tone : "indigo";
                    return (
                      <div key={c.id ?? c.title} className={`hod-card hod-rep-card accent-${tone}`} style={{ "--i": i }}>
                        <div>
                          <div className="hod-rep-card-top">
                            <span className={`hod-rep-icon-wrap ${tone}`}>
                              <Activity size={18} />
                            </span>
                            <Trend value={c.trend} />
                          </div>
                          <h4>{c.title}</h4>
                          <div className="hod-rep-card-stat">{c.value}</div>
                          {typeof c.progress === "number" && (
                            <div
                              className="hod-rep-progress"
                              role="progressbar"
                              aria-valuenow={c.progress}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={c.title}
                            >
                              <span style={{ "--value": `${Math.min(100, Math.max(0, c.progress))}%` }} />
                            </div>
                          )}
                        </div>
                        <p>{c.description}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && (data.series.length > 0 || data.split.length > 0) && (
                <div className="hod-rep-split">
                  <section className="hod-card hod-rep-panel-card">
                    <div className="hod-rep-panel-head">
                      <h3>Trend</h3>
                    </div>
                    {data.series.length === 0 ? (
                      <p className="hod-profile-muted">No trend data for this period.</p>
                    ) : (
                      <div role="img" aria-label={`Bar chart with ${data.series.length} data points`}>
                        <div className="hod-rep-bars">
                          {data.series.map((s, i) => {
                            const h = Math.round(((Number(s.value) || 0) / maxBar) * 100);
                            return (
                              <div className="hod-rep-bar" key={`${s.label}-${i}`} title={`${s.label}: ${s.value}`}>
                                <span className="hod-rep-bar-value" style={{ "--h": `${h}%` }}>
                                  {s.value}
                                </span>
                                <span className="hod-rep-bar-fill" style={{ "--h": `${h}%`, "--i": i }} />
                              </div>
                            );
                          })}
                        </div>
                        <div className="hod-rep-bar-labels" aria-hidden="true">
                          {data.series.map((s, i) => (
                            <span key={`${s.label}-${i}`}>{s.label}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="hod-card hod-rep-panel-card">
                    <div className="hod-rep-panel-head">
                      <h3>Breakdown</h3>
                    </div>
                    {data.split.length === 0 ? (
                      <p className="hod-profile-muted">No breakdown available.</p>
                    ) : (
                      <div className="hod-rep-donut-wrap">
                        <div
                          className="hod-rep-donut"
                          style={{ "--p": donutPct }}
                          role="img"
                          aria-label={`${topSplit.label}: ${donutPct}%`}
                        >
                          <strong>{donutPct}%</strong>
                        </div>
                        <ul className="hod-rep-legend">
                          {data.split.map((s) => (
                            <li key={s.label}>
                              <i style={{ "--c": s.color || "var(--hod-primary)" }} />
                              {s.label} ({s.value})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {!loading && data.activity.length > 0 && (
                <section className="hod-card hod-rep-panel-card">
                  <div className="hod-rep-panel-head">
                    <h3>Daily activity</h3>
                    <span className="hod-rep-card-meta">Darker means more activity</span>
                  </div>
                  <div className="hod-rep-heat" role="img" aria-label="Daily activity heatmap">
                    {data.activity.map((n, i) => {
                      const level = n <= 0 ? "" : `l${Math.min(4, Math.ceil((n / maxActivity) * 4))}`;
                      return <span key={i} className={level} style={{ "--i": i }} title={`Day ${i + 1}: ${n}`} />;
                    })}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* HISTORY */}
          {tab === "history" && (
            <div className="hod-rep-panel hod-rep-container" role="tabpanel" id="hod-rep-panel-history" aria-labelledby="hod-rep-tab-history">
              <div className="hod-rep-toolbar">
                <div className="hod-rep-search">
                  <label htmlFor="hod-rep-q" className="hod-sr-only">
                    Search reports
                  </label>
                  <Search size={15} />
                  <input
                    id="hod-rep-q"
                    type="search"
                    className="hod-input"
                    placeholder="Search title, category or author"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <div className="hod-rep-field">
                  <label htmlFor="hod-rep-status">Status</label>
                  <select id="hod-rep-status" className="hod-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All statuses</option>
                    <option value="ready">Ready</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div className="hod-rep-field">
                  <label htmlFor="hod-rep-cat">Category</label>
                  <select id="hod-rep-cat" className="hod-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="all">All categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                {filtersActive && (
                  <button type="button" className="hod-btn-secondary" onClick={clearFilters}>
                    <X size={14} />
                    <span>Clear filters</span>
                  </button>
                )}
              </div>

              <div className="hod-rep-scope" aria-live="polite">
                Showing {filtered.length} of {data.reports.length} reports
                {statusFilter !== "all" && <span className="hod-rep-filter-chip">{statusFilter}</span>}
                {category !== "all" && <span className="hod-rep-filter-chip">{category}</span>}
              </div>

              {loading ? (
                <div className="hod-rep-skeleton" aria-busy="true" />
              ) : filtered.length === 0 ? (
                <div className="hod-rep-empty">
                  <Inbox size={34} style={{ opacity: 0.5 }} />
                  <h3>{filtersActive ? "No reports match these filters" : "No reports yet"}</h3>
                  <p>{filtersActive ? "Clear the filters to see every report." : "Generated reports will be listed here."}</p>
                  {filtersActive && (
                    <button type="button" className="hod-btn-secondary" onClick={clearFilters}>
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="hod-rep-table-wrap">
                    <table className="hod-rep-table">
                      <thead>
                        <tr>
                          {[
                            ["title", "Report"],
                            ["category", "Category"],
                            ["status", "Status"],
                            ["createdAt", "Created"]
                          ].map(([key, label]) => (
                            <th
                              key={key}
                              scope="col"
                              aria-sort={sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                            >
                              <button type="button" className="hod-rep-sort" onClick={() => toggleSort(key)}>
                                {label}
                                <ChevronUp size={13} />
                              </button>
                            </th>
                          ))}
                          <th scope="col">Author</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.map((r) => (
                          <tr key={r.id ?? r.title}>
                            <td>
                              <button type="button" className="hod-rep-row-btn" onClick={() => setSelected(r)}>
                                {r.title}
                              </button>
                            </td>
                            <td>{r.category || "—"}</td>
                            <td>
                              <StatusPill status={r.status} />
                            </td>
                            <td>{formatDate(r.createdAt)}</td>
                            <td>{r.generatedBy || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="hod-rep-pager">
                    <span>
                      Page {page} of {pageCount}
                    </span>
                    <div className="hod-rep-pager-btns">
                      <button type="button" className="hod-btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        Previous
                      </button>
                      <button type="button" className="hod-btn-secondary" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Detail drawer */}
      {selected && (
        <>
          <div className="hod-rep-overlay" onClick={() => setSelected(null)} aria-hidden="true" />
          <aside className="hod-rep-drawer" role="dialog" aria-modal="true" aria-labelledby="hod-rep-drawer-title">
            <div className="hod-rep-drawer-head">
              <div>
                <h3 id="hod-rep-drawer-title">{selected.title}</h3>
                <StatusPill status={selected.status} />
              </div>
              <button ref={closeRef} type="button" className="hod-btn-secondary hod-btn-sm" onClick={() => setSelected(null)} aria-label="Close details">
                <X size={14} />
              </button>
            </div>
            <div className="hod-rep-drawer-body">
              <dl style={{ margin: 0, display: "grid", gap: 10 }}>
                <div className="hod-rep-kv">
                  <dt>Category</dt>
                  <dd>{selected.category || "—"}</dd>
                </div>
                <div className="hod-rep-kv">
                  <dt>Created</dt>
                  <dd>{formatDate(selected.createdAt)}</dd>
                </div>
                <div className="hod-rep-kv">
                  <dt>Generated by</dt>
                  <dd>{selected.generatedBy || "—"}</dd>
                </div>
              </dl>
              <p className="hod-profile-muted" style={{ lineHeight: 1.6 }}>
                {selected.summary || "No summary was recorded for this report."}
              </p>
            </div>
            <div className="hod-rep-drawer-foot">
              {selected.downloadUrl && selected.status === "ready" ? (
                <a className="hod-btn-primary" href={selected.downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Download size={14} />
                  <span>Download</span>
                </a>
              ) : (
                <span className="hod-profile-muted">
                  {selected.status === "ready" ? "No file attached to this report." : "Download is available once the report is ready."}
                </span>
              )}
            </div>
          </aside>
        </>
      )}

      {toast && (
        <div className={`hod-rep-toast ${toast.isError ? "error" : ""}`} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </div>
  );
}