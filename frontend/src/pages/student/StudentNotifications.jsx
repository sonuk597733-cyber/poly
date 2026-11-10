import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  CheckCircle2, Clock, Bell, BellOff, BookOpen, Calendar, FileText, CheckCheck, Inbox,
  ShieldCheck, RefreshCw, X, AlertCircle, Search, Star, Archive, ArchiveRestore,
  ChevronDown, Settings2, Undo2, ExternalLink, CheckSquare, Square, Layers, AlignJustify,
  Zap, Sparkles
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./StudentTheme.css";
import "./StudentNotifications.css";

/* ───────────── CONFIG ───────────── */
const FILTERS = [
  { id: "all", label: "All Alerts" },
  { id: "unread", label: "Unread Only" },
  { id: "pinned", label: "Starred" },
  { id: "exam", label: "Examinations" },
  { id: "academic", label: "Academics & Tasks" },
  { id: "leave", label: "Leave Requests" },
  { id: "system", label: "System Announcements" },
  { id: "archived", label: "Archived" }
];
const TYPE_LABEL = { exam: "Examinations", academic: "Academics & Tasks", leave: "Leave Requests", system: "System Announcements" };
const ROUTE = { exam: "exams", academic: "assignments", leave: "leaves", system: "notices" };
const PAGE_SIZE = 10;
const POLL_MS = 60000;
const K_ARCH = "collegeos_notifs_archived_v1";
const K_PIN = "collegeos_notifs_pinned_v1";
const K_MUTE = "collegeos_notifs_muted_v1";
const K_DENSITY = "collegeos_notifs_density_v1";

/* ───────────── HELPERS ───────────── */
const idOf = (n) => String(n?._id || n?.id || "");
const reduced = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const bodyOf = (n) => n.message || n.text || n.content || "";
const titleOf = (n) => n.title || n.heading || "Notification";
const ts = (n) => (n.createdAt ? new Date(n.createdAt).getTime() : 0);

function classify(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("exam")) return "exam";
  if (t.includes("academic") || t.includes("asgn") || t.includes("assignment")) return "academic";
  if (t.includes("leave")) return "leave";
  return "system";
}
const META = {
  exam: { Icon: Calendar, badge: "Exam Alert" },
  academic: { Icon: BookOpen, badge: "Academic" },
  leave: { Icon: FileText, badge: "Leave Clearance" },
  system: { Icon: Bell, badge: "System Broadcast" }
};

function timeStr(n) {
  if (n.time) return n.time;
  if (!n.createdAt) return "Recently";
  const mins = Math.floor((Date.now() - ts(n)) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function dayLabel(n) {
  if (!n.createdAt) return "Recent";
  const d = new Date(n.createdAt), now = new Date();
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diff = Math.round((b - a) / 864e5);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return "This week";
  return "Earlier";
}
function highlight(text, q) {
  const s = String(text || ""), query = q.trim();
  if (!query) return s;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return s.split(new RegExp(`(${safe})`, "ig")).map((p, i) =>
    p.toLowerCase() === query.toLowerCase() ? <mark key={i} className="nf-hl">{p}</mark> : p
  );
}
function useStoredSet(key) {
  const [set, setSet] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(key) || "[]")); } catch { return new Set(); }
  });
  const save = (n) => { try { localStorage.setItem(key, JSON.stringify([...n])); } catch { /* unavailable */ } return n; };
  const toggle = useCallback((id) => setSet((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return save(n); }), []); // eslint-disable-line
  const add = useCallback((ids) => setSet((p) => { const n = new Set(p); [].concat(ids).forEach((i) => n.add(i)); return save(n); }), []); // eslint-disable-line
  const remove = useCallback((ids) => setSet((p) => { const n = new Set(p); [].concat(ids).forEach((i) => n.delete(i)); return save(n); }), []); // eslint-disable-line
  return [set, toggle, add, remove];
}
function spotlight(e) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}
function ripple(e) {
  const b = e.target.closest?.("button");
  if (!b || b.disabled || reduced()) return;
  const r = b.getBoundingClientRect(), s = document.createElement("span");
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
      const p = Math.min(1, (now - s) / 600);
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
export default function StudentNotifications({ showToast, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState(null);
  const [live, setLive] = useState(true);
  const [fresh, setFresh] = useState(() => new Set());

  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("newest");
  const [groupByDay, setGroupByDay] = useState(true);
  const [density, setDensity] = useState(() => { try { return localStorage.getItem(K_DENSITY) || "comfortable"; } catch { return "comfortable"; } });
  const [visible, setVisible] = useState(PAGE_SIZE);

  const [expandedId, setExpandedId] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [markingId, setMarkingId] = useState(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const [undo, setUndo] = useState(null);
  const [leaving, setLeaving] = useState(() => new Set());

  const [archived, , addArchived, removeArchived] = useStoredSet(K_ARCH);
  const [pinned, togglePinned] = useStoredSet(K_PIN);
  const [muted, toggleMuted] = useStoredSet(K_MUTE);

  const searchRef = useRef(null);
  const listRef = useRef(null);
  const seenRef = useRef(new Set());
  const undoTimer = useRef(null);
  const prefsRef = useRef(null);

  const say = useCallback((m, isErr) => showToast?.(m, isErr), [showToast]);

  /* ── Data ── */
  const fetchNotifs = useCallback(async (mode = "full") => {
    if (mode === "full") setLoading(true);
    if (mode === "manual") setRefreshing(true);
    if (mode !== "silent") setError("");
    try {
      const res = await authApi.getNotifications();
      const list = res?.notifications || (Array.isArray(res) ? res : []);
      if (mode === "silent" && seenRef.current.size) {
        const newer = list.filter((n) => !seenRef.current.has(idOf(n)));
        if (newer.length) {
          setFresh(new Set(newer.map(idOf)));
          setTimeout(() => setFresh(new Set()), 7000);
          say(`${newer.length} new alert${newer.length > 1 ? "s" : ""} received.`);
        }
      }
      list.forEach((n) => seenRef.current.add(idOf(n)));
      setNotifications(list);
      setLastSync(new Date());
    } catch (err) {
      if (mode !== "silent") { setNotifications([]); setError(err?.message || "Could not reach the alert stream."); }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [say]);

  useEffect(() => { fetchNotifs("full"); }, [fetchNotifs]);
  useEffect(() => {
    if (!live) return undefined;
    const t = setInterval(() => { if (!document.hidden) fetchNotifs("silent"); }, POLL_MS);
    return () => clearInterval(t);
  }, [live, fetchNotifs]);
  useEffect(() => () => clearTimeout(undoTimer.current), []);
  useEffect(() => { setVisible(PAGE_SIZE); }, [activeFilter, search, sortKey, groupByDay]);
  useEffect(() => { try { localStorage.setItem(K_DENSITY, density); } catch { /* noop */ } }, [density]);
  useEffect(() => { if (!selectMode) setSelected(new Set()); }, [selectMode]);

  useEffect(() => {
    if (!showPrefs) return undefined;
    const close = (e) => { if (prefsRef.current && !prefsRef.current.contains(e.target)) setShowPrefs(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [showPrefs]);

  /* ── Mutations ── */
  const markRead = useCallback(async (ids, quiet) => {
    const list = [].concat(ids);
    setNotifications((p) => p.map((n) => (list.includes(idOf(n)) ? { ...n, isRead: true } : n)));
    if (list.length === 1) setMarkingId(list[0]);
    await Promise.allSettled(list.map((id) => authApi.markNotificationRead(id)));
    setMarkingId(null);
    if (!quiet) say(list.length > 1 ? `${list.length} notifications marked as read.` : "Notification marked as read.");
  }, [say]);

  const markAllRead = async () => {
    setNotifications((p) => p.map((n) => ({ ...n, isRead: true })));
    try { await authApi.markAllNotificationsRead(); } catch { /* optimistic */ }
    say("All notifications marked as read.");
  };

  const archive = useCallback((ids) => {
    const list = [].concat(ids);
    setLeaving((p) => new Set([...p, ...list]));
    setTimeout(() => {
      addArchived(list);
      setLeaving((p) => { const n = new Set(p); list.forEach((i) => n.delete(i)); return n; });
      setSelected(new Set());
      clearTimeout(undoTimer.current);
      setUndo({ ids: list });
      undoTimer.current = setTimeout(() => setUndo(null), 6000);
    }, reduced() ? 0 : 260);
  }, [addArchived]);

  const undoArchive = () => { if (undo) removeArchived(undo.ids); setUndo(null); clearTimeout(undoTimer.current); };

  /* ── Derived ── */
  const enriched = useMemo(
    () => notifications.map((n) => ({ n, id: idOf(n), cls: classify(n.type) })),
    [notifications]
  );
  const active = useMemo(() => enriched.filter((x) => !archived.has(x.id)), [enriched, archived]);
  const visibleBase = useMemo(() => active.filter((x) => !muted.has(x.cls)), [active, muted]);
  const unreadCount = useMemo(() => visibleBase.filter((x) => !x.n.isRead).length, [visibleBase]);
  const todayCount = useMemo(() => visibleBase.filter((x) => dayLabel(x.n) === "Today").length, [visibleBase]);
  const examUnread = useMemo(() => visibleBase.filter((x) => x.cls === "exam" && !x.n.isRead).length, [visibleBase]);

  const counts = useMemo(() => ({
    all: visibleBase.length,
    unread: unreadCount,
    pinned: active.filter((x) => pinned.has(x.id)).length,
    exam: active.filter((x) => x.cls === "exam").length,
    academic: active.filter((x) => x.cls === "academic").length,
    leave: active.filter((x) => x.cls === "leave").length,
    system: active.filter((x) => x.cls === "system").length,
    archived: enriched.filter((x) => archived.has(x.id)).length
  }), [visibleBase, unreadCount, active, pinned, enriched, archived]);

  const filteredList = useMemo(() => {
    const q = search.toLowerCase().trim();
    let pool;
    if (activeFilter === "archived") pool = enriched.filter((x) => archived.has(x.id));
    else if (activeFilter === "all") pool = visibleBase;
    else if (activeFilter === "unread") pool = visibleBase.filter((x) => !x.n.isRead);
    else if (activeFilter === "pinned") pool = active.filter((x) => pinned.has(x.id));
    else pool = active.filter((x) => x.cls === activeFilter);
    if (q) pool = pool.filter((x) => titleOf(x.n).toLowerCase().includes(q) || bodyOf(x.n).toLowerCase().includes(q));
    const out = [...pool];
    out.sort((a, b) => {
      if (sortKey === "oldest") return ts(a.n) - ts(b.n);
      if (sortKey === "unread") return Number(!!a.n.isRead) - Number(!!b.n.isRead) || ts(b.n) - ts(a.n);
      const pa = pinned.has(a.id) ? 0 : 1, pb = pinned.has(b.id) ? 0 : 1;
      return pa - pb || ts(b.n) - ts(a.n);
    });
    return out;
  }, [activeFilter, enriched, archived, visibleBase, active, pinned, search, sortKey]);

  const shown = useMemo(() => filteredList.slice(0, visible), [filteredList, visible]);
  const mutedCount = muted.size;

  /* ── Selection ── */
  const toggleSelect = (id) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAllShown = () => setSelected(new Set(shown.map((x) => x.id)));

  /* ── Keyboard ── */
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName || "";
      if (/INPUT|TEXTAREA|SELECT/.test(tag)) { if (e.key === "Escape") document.activeElement.blur(); return; }
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); return; }
      if (e.key === "Escape") { setShowPrefs(false); setSelectMode(false); return; }
      const items = listRef.current ? [...listRef.current.querySelectorAll(".std-notif-item")] : [];
      const cur = items.indexOf(document.activeElement);
      if (e.key === "j" || e.key === "k") {
        e.preventDefault();
        const next = items[Math.max(0, Math.min(items.length - 1, cur + (e.key === "j" ? 1 : -1)))];
        next?.focus();
      }
      const id = document.activeElement?.dataset?.id;
      if (!id) return;
      if (e.key === "r") markRead(id);
      if (e.key === "e") archive(id);
      if (e.key === "s") togglePinned(id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [markRead, archive, togglePinned]);

  const openAction = (x) => {
    if (!x.n.isRead) markRead(x.id, true);
    onNavigate?.(x.n.link || x.n.route || ROUTE[x.cls]);
  };

  const stats = [
    { key: "all", label: "Active Alerts", value: visibleBase.length, Icon: Inbox, cls: "nf-s-total", note: "In your feed" },
    { key: "unread", label: "Unread", value: unreadCount, Icon: Bell, cls: "nf-s-unread", note: "Need attention" },
    { key: "exam", label: "Exam Alerts", value: examUnread, Icon: Calendar, cls: "nf-s-exam", note: "Unread exam updates" },
    { key: "pinned", label: "Starred", value: counts.pinned, Icon: Star, cls: "nf-s-star", note: "Kept for later" }
  ];

  /* ───────────── RENDER ───────────── */
  return (
    <div className={`student-role-view std-notifs-container density-${density}`} onPointerDown={ripple}>
      {/* HEADER */}
      <div className="std-pane-header nf-hero">
        <span className="nf-orb nf-orb-a" aria-hidden="true" />
        <span className="nf-orb nf-orb-b" aria-hidden="true" />
        <div className="std-pane-title-group">
          <div className="std-title-icon-badge nf-inbox">
            <Inbox size={22} />
            {unreadCount > 0 && <span className="nf-badge-count">{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </div>
          <div>
            <h2>Real-Time Academic Notification Feed</h2>
            <p>Direct institutional alerts, assignment submission acknowledgments, exam schedules, and leave updates.</p>
          </div>
        </div>

        <div className="std-pane-actions">
          <button type="button" className={`nf-live-btn ${live ? "on" : ""}`} onClick={() => setLive((v) => !v)} aria-pressed={live} title="Auto-refresh every minute">
            <span className="nf-live-dot" />
            <span>{live ? "Live" : "Paused"}</span>
          </button>

          <div className="nf-prefs-wrap" ref={prefsRef}>
            <button type="button" className="nf-ghost-btn" onClick={() => setShowPrefs((v) => !v)} aria-expanded={showPrefs} aria-label="Notification preferences">
              <Settings2 size={14} /><span>Preferences</span>
              {mutedCount > 0 && <span className="nf-mini-count">{mutedCount}</span>}
            </button>
            {showPrefs && (
              <div className="nf-prefs" role="dialog" aria-label="Notification preferences">
                <h5>Mute categories</h5>
                <p>Muted alerts are hidden from your main feed and unread count.</p>
                {Object.keys(TYPE_LABEL).map((k) => (
                  <label key={k} className="nf-switch-row">
                    <span className={`nf-dot ${k}`} />
                    <span className="nf-switch-label">{TYPE_LABEL[k]}</span>
                    <input type="checkbox" checked={!muted.has(k)} onChange={() => toggleMuted(k)} />
                    <span className="nf-switch" aria-hidden="true" />
                  </label>
                ))}
                <div className="nf-prefs-foot">
                  <span>Row density</span>
                  <div className="nf-seg">
                    <button type="button" className={density === "comfortable" ? "on" : ""} onClick={() => setDensity("comfortable")}>Comfortable</button>
                    <button type="button" className={density === "compact" ? "on" : ""} onClick={() => setDensity("compact")}>Compact</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {unreadCount > 0 && (
            <button type="button" className="std-btn-primary" onClick={markAllRead} title="Mark all notifications as read">
              <CheckCheck size={14} /><span>Mark All Read ({unreadCount})</span>
            </button>
          )}
          <button type="button" className="std-res-download-btn" onClick={() => fetchNotifs("manual")} disabled={refreshing} title="Refresh feed">
            <RefreshCw size={14} className={refreshing || loading ? "spin" : ""} />
            <span>{refreshing ? "Syncing…" : "Sync Alerts"}</span>
          </button>
        </div>
      </div>

      {/* STATS */}
      <section className="nf-stats" aria-label="Notification overview">
        {stats.map((s, i) => (
          <button key={s.key} type="button" className={`nf-stat ${s.cls} ${activeFilter === s.key ? "is-active" : ""}`}
            style={{ "--i": i }} onMouseMove={spotlight} onClick={() => setActiveFilter(s.key)} aria-pressed={activeFilter === s.key}>
            <span className="nf-stat-icon"><s.Icon size={20} /></span>
            <span className="nf-stat-body"><strong><Num value={s.value} /></strong><span>{s.label}</span><small>{s.note}</small></span>
          </button>
        ))}
      </section>

      {/* CONTROLS */}
      <div className="std-notifs-ctrl-card">
        <div className="std-notifs-ctrl-top">
          <div className="std-notifs-unread-status">
            <div className={`std-notifs-pulse-dot ${unreadCount > 0 ? "active" : ""}`} />
            <span>
              {unreadCount > 0 ? `${unreadCount} Unread Academic Alert${unreadCount > 1 ? "s" : ""}` : "All alerts read & acknowledged"}
            </span>
            {todayCount > 0 && <span className="nf-today"><Zap size={11} />{todayCount} today</span>}
          </div>
          <span className="std-res-verified-pill"><ShieldCheck size={13} /> Official SVSU Cloud Feed</span>
        </div>

        <div className="nf-toolbar">
          <div className="nf-search">
            <Search size={15} />
            <input ref={searchRef} type="text" placeholder="Search alerts…  ( / )" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search notifications" />
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={14} /></button>}
          </div>
          <select className="nf-select" value={sortKey} onChange={(e) => setSortKey(e.target.value)} aria-label="Sort notifications">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="unread">Unread first</option>
          </select>
          <button type="button" className={`nf-tool ${groupByDay ? "on" : ""}`} onClick={() => setGroupByDay((v) => !v)} aria-pressed={groupByDay} title="Group by day"><Layers size={15} /></button>
          <button type="button" className={`nf-tool ${density === "compact" ? "on" : ""}`} onClick={() => setDensity((d) => (d === "compact" ? "comfortable" : "compact"))} aria-pressed={density === "compact"} title="Compact rows"><AlignJustify size={15} /></button>
          <button type="button" className={`nf-tool nf-select-btn ${selectMode ? "on" : ""}`} onClick={() => setSelectMode((v) => !v)} aria-pressed={selectMode}>
            <CheckSquare size={15} /><span>Select</span>
          </button>
        </div>

        <div className="std-lib-cat-pills nf-pills">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className={`std-filter-pill ${activeFilter === f.id ? "active" : ""}`} onClick={() => setActiveFilter(f.id)}>
              {f.label}
              <span className="nf-pill-count">{counts[f.id] || 0}</span>
            </button>
          ))}
        </div>

        {lastSync && <div className="nf-sync-line"><Clock size={11} /> Last synced {lastSync.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}{live ? " • auto-refresh on" : ""}</div>}
      </div>

      {/* LIST */}
      {loading ? (
        <div className="std-notifs-list" aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <div className="nf-skel" key={i} style={{ "--i": i }}>
              <span className="sk sk-icon" />
              <div className="sk-col"><span className="sk w-30" /><span className="sk w-60 h-lg" /><span className="sk w-90" /></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="std-empty-box nf-error">
          <AlertCircle size={42} color="#F87171" style={{ margin: "0 auto 8px" }} />
          <h3>Couldn't connect to the alert stream</h3>
          <p>{error}</p>
          <button type="button" className="std-btn-primary" onClick={() => fetchNotifs("full")}><RefreshCw size={14} /><span>Try again</span></button>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="std-empty-box nf-empty">
          <div className="nf-empty-icon">{activeFilter === "unread" ? <Sparkles size={34} /> : <Bell size={34} />}</div>
          <h3>{activeFilter === "unread" ? "You're all caught up" : "No Notifications Found"}</h3>
          <p>
            {activeFilter === "unread" ? "You have caught up with all academic notifications!"
              : search ? "Nothing matches your search. Try a different keyword."
              : activeFilter === "archived" ? "Archived alerts will show up here."
              : "No notification records match the selected filter."}
          </p>
          {(search || activeFilter !== "all") && (
            <button type="button" className="std-btn-primary" onClick={() => { setSearch(""); setActiveFilter("all"); }}><X size={14} /><span>Reset filters</span></button>
          )}
        </div>
      ) : (
        <>
          <div className="std-notifs-list" ref={listRef}>
            {shown.map((x, idx) => {
              const { n, id, cls } = x;
              const { Icon, badge } = META[cls];
              const isUnread = !n.isRead;
              const isArchived = archived.has(id);
              const isPinned = pinned.has(id);
              const isOpen = expandedId === id;
              const body = bodyOf(n);
              const long = body.length > 140;
              const prev = shown[idx - 1];
              const head = groupByDay && sortKey !== "unread" && (!prev || dayLabel(prev.n) !== dayLabel(n));
              return (
                <React.Fragment key={id || idx}>
                  {head && <h4 className="nf-day"><span>{dayLabel(n)}</span></h4>}
                  <div
                    data-id={id}
                    className={`std-notif-item ${isUnread ? "unread" : "read"} ${cls} ${isOpen ? "is-open" : ""} ${leaving.has(id) ? "is-leaving" : ""} ${fresh.has(id) ? "is-fresh" : ""} ${selected.has(id) ? "is-selected" : ""}`}
                    style={{ "--i": idx % PAGE_SIZE }}
                    onMouseMove={spotlight}
                    onClick={() => {
                      if (selectMode) { toggleSelect(id); return; }
                      if (isUnread) markRead(id, true);
                      if (long) setExpandedId(isOpen ? null : id);
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (selectMode) toggleSelect(id); else { if (isUnread) markRead(id, true); if (long) setExpandedId(isOpen ? null : id); } } }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${isUnread ? "Unread. " : ""}${titleOf(n)}`}
                  >
                    {selectMode && (
                      <span className="nf-check" aria-hidden="true">{selected.has(id) ? <CheckSquare size={18} /> : <Square size={18} />}</span>
                    )}
                    <div className={`std-notif-icon-box ${cls}`}><Icon size={18} /></div>

                    <div className="std-notif-content-area">
                      <div className="std-notif-meta-line">
                        <span className={`std-notif-type-badge ${cls}`}>{badge}</span>
                        <span className="std-notif-time"><Clock size={11} /> {timeStr(n)}</span>
                        {fresh.has(id) && <span className="nf-new">NEW</span>}
                        {isUnread && <span className="std-unread-glow-dot" title="Unread Alert" />}
                        {isPinned && <Star size={12} className="nf-star-ico" />}
                      </div>
                      <h4 className="std-notif-title">{highlight(titleOf(n), search)}</h4>
                      <p className={`std-notif-desc ${isOpen ? "open" : ""}`}>{highlight(body, search)}</p>
                      {long && (
                        <span className="nf-more">{isOpen ? "Show less" : "Read more"}<ChevronDown size={12} /></span>
                      )}
                    </div>

                    {!selectMode && (
                      <div className="std-notif-item-actions" onClick={(e) => e.stopPropagation()}>
                        <button type="button" className={`nf-icon ${isPinned ? "on" : ""}`} onClick={() => togglePinned(id)} aria-label={isPinned ? "Remove star" : "Star alert"} aria-pressed={isPinned} title="Star (s)">
                          <Star size={15} />
                        </button>
                        {isArchived ? (
                          <button type="button" className="nf-icon" onClick={() => removeArchived(id)} aria-label="Restore" title="Restore"><ArchiveRestore size={15} /></button>
                        ) : (
                          <button type="button" className="nf-icon" onClick={() => archive(id)} aria-label="Archive" title="Archive (e)"><Archive size={15} /></button>
                        )}
                        <button type="button" className="nf-icon nf-open" onClick={() => openAction(x)} aria-label="Open related page" title="Open"><ExternalLink size={15} /></button>
                        {isUnread ? (
                          <button type="button" className="std-res-download-btn nf-mark" disabled={markingId === id} onClick={() => markRead(id)} title="Mark as read (r)">
                            <CheckCircle2 size={12} /><span>Mark Read</span>
                          </button>
                        ) : (
                          <span className="std-read-indicator"><CheckCircle2 size={13} /> Read</span>
                        )}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <div className="nf-list-foot">
            <span>Showing {shown.length} of {filteredList.length}</span>
            {filteredList.length > visible && (
              <button type="button" className="nf-more-btn" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                <ChevronDown size={15} /><span>Show {Math.min(PAGE_SIZE, filteredList.length - visible)} more</span>
              </button>
            )}
          </div>
          <p className="nf-hint">Tip: use <kbd>j</kbd>/<kbd>k</kbd> to move, <kbd>r</kbd> read, <kbd>s</kbd> star, <kbd>e</kbd> archive.</p>
        </>
      )}

      {/* BULK BAR */}
      {selectMode && (
        <div className="nf-bulk" role="toolbar" aria-label="Bulk actions">
          <span className="nf-bulk-count">{selected.size} selected</span>
          <button type="button" onClick={selectAllShown}>Select all</button>
          <button type="button" disabled={!selected.size} onClick={() => { markRead([...selected]); setSelectMode(false); }}><CheckCheck size={14} /><span>Mark read</span></button>
          <button type="button" disabled={!selected.size} onClick={() => { archive([...selected]); setSelectMode(false); }}><Archive size={14} /><span>Archive</span></button>
          <button type="button" className="nf-bulk-x" onClick={() => setSelectMode(false)} aria-label="Exit selection"><X size={15} /></button>
        </div>
      )}

      {/* UNDO */}
      {undo && (
        <div className="nf-undo" role="status">
          <BellOff size={15} />
          <span>{undo.ids.length > 1 ? `${undo.ids.length} alerts archived` : "Alert archived"}</span>
          <button type="button" onClick={undoArchive}><Undo2 size={14} /><span>Undo</span></button>
          <i className="nf-undo-bar" />
        </div>
      )}
    </div>
  );
}