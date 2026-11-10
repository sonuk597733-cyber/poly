import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Bell, Search, Calendar, ShieldCheck, AlertCircle, RefreshCw, Printer, Share2,
  Bookmark, BookmarkCheck, ArrowUpRight, CheckCircle2, ChevronRight, ChevronLeft,
  ChevronDown, X, Clock, LayoutGrid, List, Inbox, CheckCheck, Flame, Copy,
  CalendarDays, ArrowUp, Keyboard, Type
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./StudentTheme.css";
import "./StudentNotices.css";

/* ───────────── CONFIG ───────────── */
const CATEGORIES = [
  { id: "all", label: "All Circulars" },
  { id: "Academic", label: "Academic Directives" },
  { id: "Examination", label: "Examination Orders" },
  { id: "Placement", label: "Training & Placement" },
  { id: "Holiday", label: "Campus Holidays" },
  { id: "Administrative", label: "Administrative" }
];
const RANGES = [
  { id: "all", label: "Any time", days: 0 },
  { id: "7", label: "Last 7 days", days: 7 },
  { id: "30", label: "Last 30 days", days: 30 }
];
const PAGE_SIZE = 6;
const READ_KEY = "collegeos_notices_read_v1";
const SAVED_KEY = "collegeos_notices_saved_v1";

/* ───────────── HELPERS ───────────── */
const idOf = (n) => String(n?._id || n?.id || n?.title || "");
const isHigh = (n) => ["high", "urgent"].includes(String(n?.priority || "").toLowerCase());
const isUrgent = (n) => n?.isPinned || isHigh(n);
const reduced = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const fmtDate = (d, long) => {
  const t = d ? new Date(d) : null;
  if (!t || isNaN(t)) return long ? "Current Session" : "Recent";
  return t.toLocaleDateString("en-IN", { day: "numeric", month: long ? "long" : "short", year: "numeric" });
};
const timeAgo = (d) => {
  const t = d ? new Date(d) : null;
  if (!t || isNaN(t)) return "";
  const m = Math.round((Date.now() - t.getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const days = Math.round(h / 24);
  return days < 30 ? `${days} day${days !== 1 ? "s" : ""} ago` : fmtDate(d);
};
const readMins = (txt) => Math.max(1, Math.round((String(txt || "").trim().split(/\s+/).length || 1) / 200));
const isNew = (n) => n?.createdAt && Date.now() - new Date(n.createdAt).getTime() < 3 * 864e5;

const monthLabel = (d) => {
  const t = d ? new Date(d) : null;
  return !t || isNaN(t) ? "Earlier" : t.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

function highlight(text, q) {
  const s = String(text || "");
  const query = q.trim();
  if (!query) return s;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return s.split(new RegExp(`(${safe})`, "ig")).map((p, i) =>
    p.toLowerCase() === query.toLowerCase() ? <mark key={i} className="std-hl">{p}</mark> : p
  );
}

function useStoredSet(key) {
  const [set, setSet] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(key) || "[]")); } catch { return new Set(); }
  });
  const persist = (next) => {
    try { localStorage.setItem(key, JSON.stringify([...next])); } catch { /* storage unavailable */ }
    return next;
  };
  const toggle = useCallback((id) => setSet((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return persist(n); }), []); // eslint-disable-line
  const add = useCallback((ids) => setSet((p) => { const n = new Set(p); [].concat(ids).forEach((i) => n.add(i)); return persist(n); }), []); // eslint-disable-line
  return [set, toggle, add];
}

function spotlight(e) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

function ripple(e) {
  const b = e.target.closest?.("button");
  if (!b || b.disabled || reduced()) return;
  const r = b.getBoundingClientRect();
  const s = document.createElement("span");
  s.className = "ripple";
  s.style.left = `${e.clientX - r.left}px`;
  s.style.top = `${e.clientY - r.top}px`;
  b.appendChild(s);
  setTimeout(() => s.remove(), 700);
}

function useCountUp(target) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (reduced()) { setV(target); return undefined; }
    let raf; const s = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - s) / 650);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}
const Num = ({ value }) => <>{useCountUp(value)}</>;

/* ───────────── COMPONENT ───────────── */
export default function StudentNotices({ showToast }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [tab, setTab] = useState("all"); // all | unread | saved | urgent
  const [range, setRange] = useState("all");
  const [sortKey, setSortKey] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const [selectedId, setSelectedId] = useState(null);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [bannerHidden, setBannerHidden] = useState(false);
  const [bannerPaused, setBannerPaused] = useState(false);
  const [toast, setToast] = useState("");

  const [readSet, , addRead] = useStoredSet(READ_KEY);
  const [savedSet, toggleSaved] = useStoredSet(SAVED_KEY);
  const searchRef = useRef(null);
  const closeRef = useRef(null);
  const docRef = useRef(null);
  const [fontScale, setFontScale] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [progress, setProgress] = useState(0);
  const toastTimer = useRef(null);

  const say = useCallback((msg, isErr) => {
    if (showToast) showToast(msg, isErr);
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }, [showToast]);

  const fetchNotices = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const res = await authApi.getNotices();
      setNotices(res?.notices || (Array.isArray(res) ? res : []));
    } catch (err) {
      setError(err?.message || "Could not load circulars. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  useEffect(() => { setVisible(PAGE_SIZE); }, [categoryFilter, tab, range, sortKey, searchQuery, viewMode]);

  /* Derived data */
  const urgentNotices = useMemo(() => notices.filter(isUrgent), [notices]);
  const unreadCount = useMemo(() => notices.filter((n) => !readSet.has(idOf(n))).length, [notices, readSet]);
  const savedCount = useMemo(() => notices.filter((n) => savedSet.has(idOf(n))).length, [notices, savedSet]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const days = RANGES.find((r) => r.id === range)?.days || 0;
    const rank = (n) => (isHigh(n) ? 0 : n.isPinned ? 1 : 2);
    const out = notices.filter((n) => {
      if (categoryFilter !== "all" && n.category !== categoryFilter) return false;
      if (tab === "unread" && readSet.has(idOf(n))) return false;
      if (tab === "saved" && !savedSet.has(idOf(n))) return false;
      if (tab === "urgent" && !isUrgent(n)) return false;
      if (days && (!n.createdAt || Date.now() - new Date(n.createdAt).getTime() > days * 864e5)) return false;
      if (q) return (n.title || "").toLowerCase().includes(q) || (n.content || "").toLowerCase().includes(q) || (n.category || "").toLowerCase().includes(q);
      return true;
    });
    out.sort((a, b) => {
      const da = new Date(a.createdAt || 0), db = new Date(b.createdAt || 0);
      if (sortKey === "oldest") return da - db;
      if (sortKey === "priority") return rank(a) - rank(b) || db - da;
      return db - da;
    });
    return out;
  }, [notices, categoryFilter, tab, range, sortKey, searchQuery, readSet, savedSet]);

  const shown = useMemo(() => filtered.slice(0, visible), [filtered, visible]);
  const catCounts = useMemo(() => {
    const m = { all: notices.length };
    notices.forEach((n) => { m[n.category] = (m[n.category] || 0) + 1; });
    return m;
  }, [notices]);
  const hasFilters = categoryFilter !== "all" || tab !== "all" || range !== "all" || !!searchQuery;
  const clearFilters = () => { setCategoryFilter("all"); setTab("all"); setRange("all"); setSearchQuery(""); };

  const selIndex = filtered.findIndex((n) => idOf(n) === selectedId);
  const selected = selIndex >= 0 ? filtered[selIndex] : notices.find((n) => idOf(n) === selectedId) || null;

  const related = useMemo(
    () => (selected ? notices.filter((x) => x.category === selected.category && idOf(x) !== selectedId).slice(0, 3) : []),
    [notices, selected, selectedId]
  );

  const openNotice = (n) => { setSelectedId(idOf(n)); addRead(idOf(n)); };
  const step = useCallback((dir) => {
    if (selIndex < 0) return;
    const nxt = filtered[selIndex + dir];
    if (nxt) { setSelectedId(idOf(nxt)); addRead(idOf(nxt)); }
  }, [filtered, selIndex, addRead]);

  /* Banner rotation */
  const banner = urgentNotices.length ? urgentNotices[bannerIdx % urgentNotices.length] : null;
  useEffect(() => {
    if (urgentNotices.length < 2 || bannerPaused || bannerHidden || reduced()) return undefined;
    const t = setInterval(() => setBannerIdx((i) => i + 1), 6000);
    return () => clearInterval(t);
  }, [urgentNotices.length, bannerPaused, bannerHidden]);

  /* Keyboard */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && showHelp) { setShowHelp(false); return; }
      if (e.key === "?" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) { setShowHelp((v) => !v); return; }
      if (selected) {
        if (e.key === "Escape") setSelectedId(null);
        else if (e.key === "ArrowRight") step(1);
        else if (e.key === "ArrowLeft") step(-1);
        return;
      }
      if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, step, showHelp]);

  useEffect(() => {
    if (!selected) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, [selected]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    setProgress(0);
    if (docRef.current) docRef.current.scrollTop = 0;
  }, [selectedId]);
  const onDocScroll = (e) => {
    const t = e.currentTarget;
    const max = t.scrollHeight - t.clientHeight;
    setProgress(max > 0 ? t.scrollTop / max : 1);
  };

  /* Actions */
  const markAllRead = () => { addRead(notices.map(idOf)); say("All circulars marked as read."); };
  const handleShare = async (n) => {
    const text = `${n.title}\n\n${n.content || ""}`;
    try {
      if (navigator.share) await navigator.share({ title: n.title, text });
      else { await navigator.clipboard.writeText(text); say("Circular copied to clipboard."); }
    } catch { /* user cancelled */ }
  };
  const handleCopy = async (n) => {
    try { await navigator.clipboard.writeText(`${n.title}\n\n${n.content || ""}`); say("Circular text copied."); }
    catch { say("Copy is not available in this browser.", true); }
  };

  const stats = [
    { key: "all", label: "Total Circulars", value: notices.length, Icon: Bell, cls: "st-total", note: "In archive" },
    { key: "unread", label: "Unread", value: unreadCount, Icon: Inbox, cls: "st-unread", note: "Needs your attention" },
    { key: "urgent", label: "Urgent", value: urgentNotices.length, Icon: Flame, cls: "st-urgent", note: "Pinned or high priority" },
    { key: "saved", label: "Saved", value: savedCount, Icon: BookmarkCheck, cls: "st-saved", note: "Your bookmarks" }
  ];

  /* ───────────── RENDER ───────────── */
  return (
    <div className="student-role-view std-notices-container" onPointerDown={ripple}>
      {/* HEADER */}
      <div className="std-pane-header std-notices-hero">
        <span className="nt-orb nt-orb-a" aria-hidden="true" />
        <span className="nt-orb nt-orb-b" aria-hidden="true" />
        <div className="std-pane-title-group">
          <div className="std-title-icon-badge nt-bell">
            <Bell size={22} />
            {unreadCount > 0 && <span className="nt-bell-count">{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </div>
          <div>
            <h2>Campus Circulars &amp; Official Announcements</h2>
            <p>Institutional directives, examination orders, placement alerts, and departmental notifications.</p>
          </div>
        </div>
        <div className="std-pane-actions">
          <button type="button" className="nt-ghost-btn nt-kbd-btn" onClick={() => setShowHelp(true)} aria-label="Keyboard shortcuts" title="Shortcuts (?)">
            <Keyboard size={14} />
          </button>
          <button type="button" className="nt-ghost-btn" onClick={markAllRead} disabled={!unreadCount}>
            <CheckCheck size={14} /><span>Mark all read</span>
          </button>
          <button type="button" className="std-res-download-btn" onClick={() => fetchNotices(true)} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing || loading ? "spin" : ""} />
            <span>{refreshing ? "Syncing…" : "Sync Circulars"}</span>
          </button>
        </div>
      </div>

      {/* STATS */}
      <section className="nt-stats" aria-label="Circular overview">
        {stats.map((s, i) => (
          <button
            key={s.key}
            type="button"
            className={`nt-stat ${s.cls} ${tab === s.key ? "is-active" : ""}`}
            style={{ "--i": i }}
            onMouseMove={spotlight}
            onClick={() => setTab(s.key)}
            aria-pressed={tab === s.key}
          >
            <span className="nt-stat-icon"><s.Icon size={20} /></span>
            <span className="nt-stat-body">
              <strong><Num value={s.value} /></strong>
              <span>{s.label}</span>
              <small>{s.note}</small>
            </span>
          </button>
        ))}
      </section>

      {/* URGENT BANNER */}
      {banner && !bannerHidden && (
        <div
          className="std-notices-urgent-banner"
          onMouseEnter={() => setBannerPaused(true)}
          onMouseLeave={() => setBannerPaused(false)}
          role="region"
          aria-label="Urgent directive"
        >
          <div className="std-urgent-badge-pill">
            <span className="std-live-dot" />
            <span>URGENT DIRECTIVE</span>
          </div>
          <div className="std-urgent-content" key={idOf(banner)}>
            <h4>{banner.title}</h4>
            <p>{(banner.content || "").slice(0, 160)}{(banner.content || "").length > 160 ? "…" : ""}</p>
          </div>
          {urgentNotices.length > 1 && (
            <div className="nt-banner-dots" aria-hidden="true">
              {urgentNotices.map((_, i) => (
                <span key={i} className={i === bannerIdx % urgentNotices.length ? "on" : ""} />
              ))}
            </div>
          )}
          <button type="button" className="std-btn-primary nt-banner-btn" onClick={() => openNotice(banner)}>
            <span>Read Order</span><ChevronRight size={13} />
          </button>
          <button type="button" className="nt-banner-close" onClick={() => setBannerHidden(true)} aria-label="Dismiss banner">
            <X size={14} />
          </button>
        </div>
      )}

      {/* CONTROLS */}
      <div className="std-notices-ctrl-card">
        <div className="std-notices-ctrl-top">
          <div className="std-lib-search-input-wrap">
            <Search size={15} color="var(--std-text-muted)" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search circulars by keyword…  ( / )"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="std-lib-search-input"
              aria-label="Search circulars"
            />
            {searchQuery && (
              <button type="button" className="std-lib-clear-btn" onClick={() => setSearchQuery("")} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="nt-ctrl-right">
            <select className="nt-select" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Date range">
              {RANGES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
            <select className="nt-select" value={sortKey} onChange={(e) => setSortKey(e.target.value)} aria-label="Sort circulars">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="priority">Priority first</option>
            </select>
            <div className="nt-view-toggle">
              <button type="button" className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} aria-label="Grid view" aria-pressed={viewMode === "grid"}><LayoutGrid size={15} /></button>
              <button type="button" className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")} aria-label="List view" aria-pressed={viewMode === "list"}><List size={15} /></button>
              <button type="button" className={viewMode === "timeline" ? "active" : ""} onClick={() => setViewMode("timeline")} aria-label="Timeline view" aria-pressed={viewMode === "timeline"}><CalendarDays size={15} /></button>
            </div>
          </div>
        </div>

        <div className="std-lib-cat-pills nt-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`std-filter-pill ${categoryFilter === cat.id ? "active" : ""}`}
              onClick={() => setCategoryFilter(cat.id)}
            >
              {cat.label}
              <span className="nt-pill-count">{catCounts[cat.id] || 0}</span>
            </button>
          ))}
        </div>

        <div className="nt-result-row">
          <span className="std-res-verified-pill">
            <CheckCircle2 size={13} /> {filtered.length} Notice{filtered.length !== 1 ? "s" : ""} Displayed
          </span>
          {tab !== "all" && <span className="nt-chip">Tab: {tab}<button type="button" onClick={() => setTab("all")} aria-label="Clear tab"><X size={11} /></button></span>}
          {hasFilters && <button type="button" className="nt-clear" onClick={clearFilters}>Clear all filters</button>}
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="std-notices-bento-grid" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="nt-skel" style={{ "--i": i }}>
              <span className="sk w-40" /><span className="sk w-80 h-lg" /><span className="sk w-100" /><span className="sk w-60" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="std-empty-box nt-error">
          <AlertCircle size={42} color="#F87171" style={{ margin: "0 auto 8px" }} />
          <h3>Couldn't load circulars</h3>
          <p>{error}</p>
          <button type="button" className="std-btn-primary" onClick={() => fetchNotices()}><RefreshCw size={14} /><span>Try again</span></button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="std-empty-box">
          <div className="nt-empty-icon"><Bell size={34} /></div>
          <h3>No Circular Notices Found</h3>
          <p>
            {notices.length === 0
              ? "No circulars or official directives have been published yet."
              : "Nothing matches your current filters. Try a different keyword or clear the filters."}
          </p>
          {hasFilters && <button type="button" className="std-btn-primary" onClick={clearFilters}><X size={14} /><span>Clear filters</span></button>}
        </div>
      ) : (
        <>
          <div className={`std-notices-bento-grid ${viewMode !== "grid" ? "is-list" : ""} ${viewMode === "timeline" ? "is-timeline" : ""}`}>
            {shown.map((n, idx) => {
              const nid = idOf(n);
              const unread = !readSet.has(nid);
              const high = isHigh(n);
              const saved = savedSet.has(nid);
              const prevN = shown[idx - 1];
              const newMonth = viewMode === "timeline" && (!prevN || monthLabel(prevN.createdAt) !== monthLabel(n.createdAt));
              return (
                <React.Fragment key={nid || idx}>
                {newMonth && <h4 className="nt-month"><CalendarDays size={14} />{monthLabel(n.createdAt)}</h4>}
                <article
                  key={nid || idx}
                  className={`std-notice-bento-card ${high ? "urgent" : ""} ${unread ? "is-unread" : ""}`}
                  style={{ "--i": idx % PAGE_SIZE }}
                  onClick={() => openNotice(n)}
                  onMouseMove={spotlight}
                  onKeyDown={(e) => { if (e.key === "Enter") openNotice(n); }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${unread ? "Unread. " : ""}${n.title}`}
                >
                  <div className="std-notice-top">
                    <div className="std-notice-tags">
                      {unread && <span className="nt-unread-dot" title="Unread" />}
                      <span className={`std-notice-pri ${(n.priority || "normal").toLowerCase()}`}>
                        {high && <span className="pri-pulse" />}
                        {n.priority || "Normal"} Priority
                      </span>
                      <span className="std-notice-cat">{n.category || "Academic"}</span>
                      {isNew(n) && <span className="nt-new">NEW</span>}
                    </div>
                    <div className="nt-card-tools">
                      <span className="std-notice-date" title={fmtDate(n.createdAt, true)}>
                        <Calendar size={13} /> {fmtDate(n.createdAt)}
                      </span>
                      <button
                        type="button"
                        className={`nt-save ${saved ? "on" : ""}`}
                        onClick={(e) => { e.stopPropagation(); toggleSaved(nid); say(saved ? "Removed from saved." : "Saved for later."); }}
                        aria-label={saved ? "Remove bookmark" : "Bookmark circular"}
                        aria-pressed={saved}
                      >
                        {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      </button>
                    </div>
                  </div>

                  <h3 className="std-notice-card-title">{highlight(n.title, searchQuery)}</h3>
                  <p className="std-notice-card-excerpt">
                    {highlight((n.content || "").length > 180 ? `${n.content.slice(0, 175)}…` : n.content, searchQuery)}
                  </p>

                  <div className="std-notice-footer">
                    <span className="std-notice-source">
                      By: <strong>{n.postedBy?.fullName || "Dean of Academic Affairs"}</strong>
                      <span className="nt-dot-sep">•</span>
                      <Clock size={11} /> {readMins(n.content)} min read
                    </span>
                    <span className="std-notice-action-link">
                      <span>Read Full Notice</span><ArrowUpRight size={13} />
                    </span>
                  </div>
                </article>
                </React.Fragment>
              );
            })}
          </div>

          {filtered.length > visible && (
            <div className="nt-more-wrap">
              <button type="button" className="nt-more" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                <ChevronDown size={15} />
                <span>Show {Math.min(PAGE_SIZE, filtered.length - visible)} more</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* MODAL */}
      {selected && (
        <div className="std-modal-scrim nt-scrim" onClick={() => setSelectedId(null)}>
          <div className="std-notice-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={selected.title}>
            <div className="std-transcript-ctrl-bar no-print">
              <div className="std-transcript-ctrl-title">
                <ShieldCheck size={18} className="text-emerald" />
                <span>Official SVSU Institutional Circular</span>
              </div>
              <div className="std-transcript-ctrl-actions">
                <button type="button" className="nt-icon-btn" onClick={() => step(-1)} disabled={selIndex <= 0} aria-label="Previous circular" title="Previous (←)"><ChevronLeft size={16} /></button>
                <button type="button" className="nt-icon-btn" onClick={() => step(1)} disabled={selIndex < 0 || selIndex >= filtered.length - 1} aria-label="Next circular" title="Next (→)"><ChevronRight size={16} /></button>
                <button type="button" className={`nt-icon-btn ${savedSet.has(idOf(selected)) ? "on" : ""}`} onClick={() => toggleSaved(idOf(selected))} aria-label="Bookmark"><Bookmark size={16} /></button>
                <span className="nt-font-ctrl" role="group" aria-label="Text size">
                  <button type="button" onClick={() => setFontScale((f) => Math.max(0.85, +(f - 0.1).toFixed(2)))} aria-label="Smaller text"><Type size={12} /></button>
                  <button type="button" onClick={() => setFontScale((f) => Math.min(1.5, +(f + 0.1).toFixed(2)))} aria-label="Larger text"><Type size={17} /></button>
                </span>
                <button type="button" className="nt-icon-btn" onClick={() => handleCopy(selected)} aria-label="Copy text"><Copy size={16} /></button>
                <button type="button" className="nt-icon-btn" onClick={() => handleShare(selected)} aria-label="Share"><Share2 size={16} /></button>
                <button type="button" className="std-btn-primary" onClick={() => window.print()}>
                  <Printer size={15} /><span>Print Directive</span>
                </button>
                <button ref={closeRef} type="button" className="std-modal-close-btn" onClick={() => setSelectedId(null)} aria-label="Close"><X size={18} /></button>
              </div>
            </div>

            <div className="nt-read-progress no-print" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>
            <div className="std-notice-document" ref={docRef} onScroll={onDocScroll} style={{ "--ns": fontScale }}>
              <div className="std-trans-header">
                <img src="/svsu-logo-whiten.webp" alt="SVSU Crest" className="std-trans-crest" />
                <div className="std-trans-header-text">
                  <h3>SWAMI VIVEKANAND SUBHARTI UNIVERSITY</h3>
                  <h4>OFFICE OF ACADEMIC AFFAIRS &amp; ADMINISTRATION</h4>
                  <p className="std-trans-sub">Subhartipuram, NH-58, Delhi-Haridwar Bypass Road, Meerut-250005</p>
                  <div className="std-trans-title-band">OFFICIAL NOTIFICATION &amp; CIRCULAR ORDER</div>
                </div>
              </div>

              <div className="std-notice-modal-meta">
                <div className="meta-item"><span>Reference Category:</span><strong>{selected.category || "Academic Directive"}</strong></div>
                <div className="meta-item"><span>Priority Status:</span><strong className="text-royal">{selected.priority || "Normal"} Priority</strong></div>
                <div className="meta-item"><span>Date of Issuance:</span><strong>{fmtDate(selected.createdAt, true)}</strong></div>
              </div>

              <h2 className="std-notice-doc-title">{selected.title}</h2>
              <p className="nt-doc-sub">{timeAgo(selected.createdAt)} • {readMins(selected.content)} min read</p>

              <div className="std-notice-doc-content">
                {(selected.content || "").split("\n").map((para, i) => <p key={i}>{para}</p>)}
              </div>

              {related.length > 0 && (
                <div className="nt-related no-print">
                  <h5>Related circulars</h5>
                  {related.map((r) => (
                    <button key={idOf(r)} type="button" onClick={() => { setSelectedId(idOf(r)); addRead(idOf(r)); }}>
                      <span>{r.title}</span><small>{fmtDate(r.createdAt)}</small><ChevronRight size={14} />
                    </button>
                  ))}
                </div>
              )}

              <div className="std-trans-signatures" style={{ marginTop: 32 }}>
                <div className="std-notice-authority-stamp">
                  <ShieldCheck size={28} className="text-emerald" />
                  <strong>VERIFIED BY SVSU ADMINISTRATION</strong>
                  <small>Office of the Registrar / Dean</small>
                </div>
                <div className="std-trans-sign-col">
                  <div className="std-trans-sign-line" />
                  <span>{selected.postedBy?.fullName || "Administrative Officer"}</span>
                  <small>Authorized Signatory</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTop && !selected && (
        <button type="button" className="nt-top" onClick={() => window.scrollTo({ top: 0, behavior: reduced() ? "auto" : "smooth" })} aria-label="Back to top">
          <ArrowUp size={18} />
        </button>
      )}

      {showHelp && (
        <div className="std-modal-scrim nt-scrim" onClick={() => setShowHelp(false)}>
          <div className="nt-help" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
            <div className="nt-help-head"><h3>Keyboard shortcuts</h3><button type="button" onClick={() => setShowHelp(false)} aria-label="Close"><X size={16} /></button></div>
            <ul>
              <li><kbd>/</kbd><span>Search circulars</span></li>
              <li><kbd>?</kbd><span>Show or hide this panel</span></li>
              <li><kbd>Enter</kbd><span>Open the focused circular</span></li>
              <li><kbd>←</kbd><kbd>→</kbd><span>Previous / next circular</span></li>
              <li><kbd>Esc</kbd><span>Close the open panel</span></li>
            </ul>
          </div>
        </div>
      )}

      {toast && <div className="nt-toast" role="status">{toast}</div>}
    </div>
  );
}