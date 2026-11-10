import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Video, Plus, Send, Trash2, Play, X, Clock, Search, ExternalLink,
  Loader2, BarChart3, Users, Download, FileText, CheckCircle2, AlertCircle,
  Eye, UploadCloud, Film, Image as ImageIcon, TrendingUp, RefreshCw, Edit3,
  Archive, ShieldCheck, ArrowUpDown, LayoutGrid, List, Link2, Check,
  ChevronRight, ChevronLeft, Layers, RotateCcw, Eye as EyeIcon, FileUp,
  Presentation, Table, FileCode, Paperclip
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./TeacherTheme.css";
import "./TeacherLectures.css";

/* ==========================================================================
   CONSTANTS
   ========================================================================== */
const LECTURE_TYPES = ["Theory", "Practical / Lab Demo", "Tutorial", "Revision", "Guest Lecture"];
const BRANCHES = ["CSE", "Mechanical", "Electrical", "Civil", "ECE"];
const SEMESTERS = [1, 2, 3, 4, 5, 6].map((s) => `Semester ${s}`);
const PAGE_SIZE = 9;
const RING_CIRC = 2 * Math.PI * 54;

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Drafts" },
  { id: "archived", label: "Archived" }
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "views", label: "Most viewed" },
  { id: "completions", label: "Most completed" },
  { id: "title", label: "Title (A–Z)" }
];

const WIZARD_STEPS = [
  { id: 1, label: "Lecture details" },
  { id: 2, label: "Media & files" },
  { id: 3, label: "Review & publish" }
];

/* ==========================================================================
   HELPERS
   ========================================================================== */
const lid = (l) => l?.id || l?._id;

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function formatMinutes(mins) {
  if (!mins) return "0 min";
  const t = Math.round(mins);
  if (t < 60) return `${t} min`;
  const h = Math.floor(t / 60);
  const r = t % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

function formatSeconds(secs) {
  if (!secs || secs <= 0) return "0s";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function formatPlaybackPos(secs) {
  if (!secs || secs <= 0) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDateTime(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(d) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  if (!Number.isFinite(diff)) return "";
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} mo ago`;
  return `${Math.floor(days / 365)} yr ago`;
}

function getFileCategoryInfo(filename = "") {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  if (["pdf"].includes(ext)) {
    return {
      type: "pdf",
      label: "PDF Document",
      badgeClass: "lx-badge-red",
      icon: FileText,
      color: "#ef4444",
      canPreview: true
    };
  }
  if (["doc", "docx", "rtf", "odt"].includes(ext)) {
    return {
      type: "word",
      label: "Word Document",
      badgeClass: "lx-badge-blue",
      icon: FileText,
      color: "#2563eb",
      canPreview: false
    };
  }
  if (["ppt", "pptx", "key"].includes(ext)) {
    return {
      type: "presentation",
      label: "Presentation",
      badgeClass: "lx-badge-orange",
      icon: Presentation,
      color: "#ea580c",
      canPreview: false
    };
  }
  if (["xls", "xlsx", "csv", "tsv"].includes(ext)) {
    return {
      type: "spreadsheet",
      label: "Spreadsheet",
      badgeClass: "lx-badge-green",
      icon: Table,
      color: "#059669",
      canPreview: false
    };
  }
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) {
    return {
      type: "image",
      label: "Image",
      badgeClass: "lx-badge-purple",
      icon: ImageIcon,
      color: "#7c3aed",
      canPreview: true
    };
  }
  if (["py", "java", "c", "cpp", "h", "hpp", "js", "ts", "jsx", "tsx", "html", "css", "sql", "sh", "txt"].includes(ext)) {
    return {
      type: "code",
      label: "Source Code",
      badgeClass: "lx-badge-cyan",
      icon: FileCode,
      color: "#0891b2",
      canPreview: true
    };
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return {
      type: "archive",
      label: "Archive / ZIP",
      badgeClass: "lx-badge-amber",
      icon: Archive,
      color: "#d97706",
      canPreview: false
    };
  }
  return {
    type: "other",
    label: ext ? ext.toUpperCase() : "File",
    badgeClass: "lx-badge-gray",
    icon: FileText,
    color: "#475569",
    canPreview: false
  };
}

function exportAnalyticsToCSV(lecture, overview, students) {
  const headers = [
    "Student Name", "Email", "Enrollment No", "Branch", "Semester", "Watch Status",
    "Watch Progress (%)", "Total Watch Time (Seconds)", "Watch Duration Formatted",
    "Last Playback Position (Seconds)", "Last Position Formatted", "Sessions Count",
    "First Watched", "Last Watched", "Video Downloads", "Resource Downloads"
  ];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = (students || []).map((s) => [
    esc(s.name), esc(s.email), esc(s.enrollmentNo), esc(s.branch), esc(s.semester), esc(s.status),
    s.completionPercentage || 0,
    s.totalWatchDurationSeconds || 0,
    esc(formatSeconds(s.totalWatchDurationSeconds || 0)),
    s.lastPlaybackPositionSeconds || 0,
    esc(formatPlaybackPos(s.lastPlaybackPositionSeconds || 0)),
    s.sessionsCount || 0,
    esc(s.firstWatchedAt ? new Date(s.firstWatchedAt).toLocaleString("en-IN") : "Never"),
    esc(s.lastWatchedAt ? new Date(s.lastWatchedAt).toLocaleString("en-IN") : "Never"),
    s.videoDownloadsCount || 0,
    s.resourceDownloadsCount || 0
  ]);
  const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(lecture?.title || "lecture").replace(/[^a-zA-Z0-9_-]/g, "_")}_student_watch_analytics.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Lock page scroll + close on Escape while a modal is open. */
function useModalBehavior(onClose) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
}

/** Count-up animation for KPI numbers (respects reduced motion). */
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const end = Number(target) || 0;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || end === 0) { setVal(end); return undefined; }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(end * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function AnimatedNumber({ value, suffix = "", decimals = 0 }) {
  const v = useCountUp(value);
  return <>{decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-IN")}{suffix}</>;
}

function getThumb(lec) {
  if (lec.thumbnailUrl) return lec.thumbnailUrl;
  const yt = getYouTubeId(lec.videoUrl);
  return yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : "";
}

/* ==========================================================================
   SKELETON LOADER
   ========================================================================== */
function LectureSkeletons({ count = 6 }) {
  return (
    <div className="teacher-lec-grid" aria-busy="true" aria-label="Loading lectures">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="lx-skel">
          <div className="lx-skel-block lx-skel-thumb" />
          <div className="lx-skel-body">
            <div className="lx-skel-block" style={{ height: 14, width: "45%" }} />
            <div className="lx-skel-block" style={{ height: 20, width: "88%" }} />
            <div className="lx-skel-block" style={{ height: 12, width: "70%" }} />
            <div className="lx-skel-block" style={{ height: 6, width: "100%", marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   COMPLETION RING
   ========================================================================== */
function CompletionRing({ percent }) {
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div className="lx-ring">
      <svg width="130" height="130" viewBox="0 0 130 130" aria-hidden="true">
        <defs>
          <linearGradient id="lxRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <circle className="bg" cx="65" cy="65" r="54" />
        <circle
          className="fg"
          cx="65"
          cy="65"
          r="54"
          style={{ "--lx-circ": RING_CIRC, strokeDashoffset: RING_CIRC * (1 - pct / 100) }}
        />
      </svg>
      <div className="lx-ring-label"><AnimatedNumber value={pct} suffix="%" /></div>
    </div>
  );
}

/* ==========================================================================
   LECTURE WATCH ANALYTICS MODAL
   ========================================================================== */
export function LectureWatchAnalyticsModal({ lecture, onClose, showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("progress_desc");
  const [reloadKey, setReloadKey] = useState(0);

  const lectureId = lid(lecture);
  useModalBehavior(onClose);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    authApi
      .getSingleLectureAnalytics(lectureId)
      .then((res) => {
        if (!alive) return;
        if (res?.success) setData(res);
        else setError(res?.message || "Could not load watch analytics.");
        setLoading(false);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || "Could not load student watch analytics.");
        setLoading(false);
      });
    return () => { alive = false; };
  }, [lectureId, reloadKey]);

  const overview = data?.overview || {};
  const allStudents = data?.students || [];

  const filteredStudents = useMemo(() => {
    let list = [...allStudents];
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter((s) =>
        [s.name, s.email, s.enrollmentNo].some((f) => f && f.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== "all") list = list.filter((s) => s.status === statusFilter);

    const t = (x) => (x ? new Date(x).getTime() : 0);
    const sorters = {
      progress_desc: (a, b) => (b.completionPercentage || 0) - (a.completionPercentage || 0),
      progress_asc: (a, b) => (a.completionPercentage || 0) - (b.completionPercentage || 0),
      time_desc: (a, b) => (b.totalWatchDurationSeconds || 0) - (a.totalWatchDurationSeconds || 0),
      recent: (a, b) => t(b.lastWatchedAt) - t(a.lastWatchedAt),
      name_asc: (a, b) => (a.name || "").localeCompare(b.name || "")
    };
    if (sorters[sortBy]) list.sort(sorters[sortBy]);
    return list;
  }, [allStudents, searchQuery, statusFilter, sortBy]);

  const handleExport = () => {
    if (!data || allStudents.length === 0) {
      showToast?.("No student records to export yet.", true);
      return;
    }
    exportAnalyticsToCSV(data.lecture, overview, filteredStudents);
    showToast?.(`Exported ${filteredStudents.length} student records.`);
  };

  const total = Math.max(1, (overview.completedCount || 0) + (overview.inProgressCount || 0) + (overview.notStartedCount || 0));
  const pctOf = (n) => `${((n || 0) / total) * 100}%`;

  const kpis = [
    { c: "blue", label: "Eligible students", v: overview.eligibleStudentsCount || 0, sub: "Enrolled in batch" },
    {
      c: "indigo", label: "Unique viewers", v: overview.uniqueViewers || 0,
      sub: overview.eligibleStudentsCount > 0
        ? `${Math.round(((overview.uniqueViewers || 0) / overview.eligibleStudentsCount) * 100)}% reach`
        : "No batch data"
    },
    { c: "green", label: "Completed (≥90%)", v: overview.completedCount || 0, sub: "Finished the lecture" },
    { c: "amber", label: "In progress", v: overview.inProgressCount || 0, sub: "Partly watched" },
    { c: "slate", label: "Not started", v: overview.notStartedCount || 0, sub: "Yet to watch" },
    { c: "teal", label: "Total watch time", v: formatSeconds(overview.totalWatchDurationSeconds || 0), sub: "All students" },
    { c: "violet", label: "Sessions", v: overview.totalSessions || 0, sub: "Playback sessions" },
    { c: "rose", label: "Video downloads", v: overview.totalVideoDownloads || 0, sub: "Original MP4" },
    { c: "orange", label: "Resource downloads", v: overview.totalResourceDownloads || 0, sub: "Notes & files" },
    { c: "purple", label: "Avg. completion", v: `${overview.averageCompletionPercentage || 0}%`, sub: "Across the class" }
  ];

  return createPortal(
    <div className="teacher-modal-backdrop tch-analytics-backdrop" onClick={onClose}>
      <div
        className="teacher-modal-shell tch-analytics-shell"
        role="dialog"
        aria-modal="true"
        aria-label="Student watch analytics"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="teacher-modal-header tch-analytics-header">
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span className="tch-badge tch-badge-primary">
                <BarChart3 size={13} style={{ marginRight: 4 }} /> Watch analytics
              </span>
              <span className="tch-badge tch-badge-secondary">{lecture?.branch} • {lecture?.semester}</span>
              <span className="tch-badge" style={{ background: "rgba(100,116,139,0.12)", color: "var(--tch-text-secondary)" }}>
                {lecture?.subject}
              </span>
            </div>
            <h3>{lecture?.title}</h3>
            {lecture?.topic && (
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "var(--tch-text-muted)" }}>
                {lecture.topic}{lecture.unitNumber ? ` · Unit ${lecture.unitNumber}` : ""}
              </p>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <button type="button" className="tch-btn-secondary" onClick={handleExport} disabled={loading || !data}>
              <Download size={14} /> <span>Export CSV</span>
            </button>
            <button type="button" className="teacher-video-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="teacher-modal-body tch-analytics-body">
          {loading ? (
            <div className="tch-empty-state" style={{ border: 0 }}>
              <Loader2 size={34} className="spin" color="var(--tch-primary)" />
              <p style={{ fontWeight: 600 }}>Collecting watch data for this lecture…</p>
            </div>
          ) : error ? (
            <div className="tch-empty-state">
              <AlertCircle size={38} color="#dc2626" />
              <h4>Analytics didn’t load</h4>
              <p>{error}</p>
              <button type="button" className="tch-btn-primary" style={{ marginTop: 10 }} onClick={() => setReloadKey((k) => k + 1)}>
                <RotateCcw size={14} /> Try again
              </button>
            </div>
          ) : (
            <>
              <div className="lx-analytics-top">
                <div className="lx-ring-card">
                  <CompletionRing percent={overview.averageCompletionPercentage} />
                  <small>Average completion</small>
                </div>
                <div className="lx-dist-card">
                  <h5>How the class is progressing</h5>
                  <div className="lx-stack-bar" role="img" aria-label="Completed, in progress and not started split">
                    <span className="c" style={{ width: pctOf(overview.completedCount) }} />
                    <span className="p" style={{ width: pctOf(overview.inProgressCount) }} />
                    <span className="n" style={{ width: pctOf(overview.notStartedCount) }} />
                  </div>
                  <div className="lx-legend">
                    <span><i style={{ background: "var(--lx-ok)" }} />Completed {overview.completedCount || 0}</span>
                    <span><i style={{ background: "var(--lx-warn)" }} />In progress {overview.inProgressCount || 0}</span>
                    <span><i style={{ background: "#94a3b8" }} />Not started {overview.notStartedCount || 0}</span>
                  </div>
                  {(overview.notStartedCount || 0) > 0 && (
                    <p style={{ margin: "14px 0 0", fontSize: "0.82rem", color: "var(--lx-ink-2)" }}>
                      {overview.notStartedCount} student{overview.notStartedCount > 1 ? "s haven’t" : " hasn’t"} opened this lecture. Use the “Not started” filter below to see who.
                    </p>
                  )}
                </div>
              </div>

              <div className="tch-analytics-kpi-row">
                {kpis.map((k) => (
                  <div key={k.label} className={`tch-stat-box mini ${k.c}`}>
                    <span className="tch-stat-label">{k.label}</span>
                    <strong className="tch-stat-value">{k.v}</strong>
                    <small>{k.sub}</small>
                  </div>
                ))}
              </div>

              <div className="tch-analytics-filter-toolbar">
                <div className="tch-analytics-search">
                  <Search size={15} color="var(--tch-text-muted)" />
                  <input
                    type="text"
                    placeholder="Search by name, enrollment no. or email"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search"><X size={14} /></button>
                  )}
                </div>

                <div className="tch-analytics-status-tabs" role="tablist">
                  {[
                    { id: "all", label: "All", count: allStudents.length },
                    { id: "completed", label: "Completed", count: overview.completedCount || 0 },
                    { id: "in_progress", label: "In progress", count: overview.inProgressCount || 0 },
                    { id: "not_started", label: "Not started", count: overview.notStartedCount || 0 }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={statusFilter === t.id}
                      className={`tch-status-pill ${statusFilter === t.id ? "active" : ""}`}
                      onClick={() => setStatusFilter(t.id)}
                    >
                      {t.label} <span>{t.count}</span>
                    </button>
                  ))}
                </div>

                <div className="tch-analytics-sort-box">
                  <ArrowUpDown size={14} color="var(--tch-text-muted)" />
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="tch-select">
                    <option value="progress_desc">Highest progress</option>
                    <option value="progress_asc">Lowest progress</option>
                    <option value="time_desc">Most watch time</option>
                    <option value="recent">Recent activity</option>
                    <option value="name_asc">Name (A–Z)</option>
                  </select>
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="tch-empty-state">
                  <Users size={34} color="var(--tch-text-muted)" />
                  <p>No students match these filters.</p>
                  {(searchQuery || statusFilter !== "all") && (
                    <button type="button" className="tch-btn-secondary" style={{ marginTop: 8 }}
                      onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="teacher-table-responsive tch-analytics-table-wrap">
                  <table className="tch-table tch-analytics-table">
                    <thead>
                      <tr>
                        <th>Student</th><th>Enrollment no.</th><th>Status</th><th>Progress</th>
                        <th>Watch time</th><th>Last position</th><th>Sessions</th>
                        <th>First watched</th><th>Last watched</th><th>Downloads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((st) => {
                        const isComp = st.status === "completed";
                        const isProg = st.status === "in_progress";
                        const pct = Math.min(100, st.completionPercentage || 0);
                        return (
                          <tr key={st.studentId || st.enrollmentNo}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span className="tch-table-avatar">
                                  {st.avatarUrl
                                    ? <img src={st.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : (st.name?.charAt(0) || "S")}
                                </span>
                                <div>
                                  <strong style={{ display: "block", fontSize: "0.88rem" }}>{st.name}</strong>
                                  <small style={{ color: "var(--tch-text-muted)", fontSize: "0.75rem" }}>{st.email}</small>
                                </div>
                              </div>
                            </td>
                            <td><code style={{ background: "var(--tch-bg-secondary)", padding: "2px 7px", borderRadius: 6 }}>{st.enrollmentNo}</code></td>
                            <td>
                              {isComp ? (
                                <span className="tch-badge tch-badge-success" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                  <CheckCircle2 size={12} /> Completed
                                </span>
                              ) : isProg ? (
                                <span className="tch-badge" style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(245,158,11,0.15)", color: "#b45309" }}>
                                  <Clock size={12} /> In progress
                                </span>
                              ) : (
                                <span className="tch-badge" style={{ background: "rgba(148,163,184,0.18)", color: "#64748b" }}>Not started</span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 130 }}>
                                <div className="tch-progress-track" style={{ flex: 1 }}>
                                  <div className="tch-progress-fill"
                                    style={{ width: `${pct}%`, background: isComp ? "#10b981" : isProg ? undefined : "#cbd5e1" }} />
                                </div>
                                <span className="lx-mono" style={{ fontWeight: 700, minWidth: 36 }}>{pct}%</span>
                              </div>
                            </td>
                            <td><strong>{formatSeconds(st.totalWatchDurationSeconds || 0)}</strong></td>
                            <td><span className="lx-mono" style={{ color: "var(--tch-text-secondary)" }}>{formatPlaybackPos(st.lastPlaybackPositionSeconds || 0)}</span></td>
                            <td><strong>{st.sessionsCount || 0}</strong></td>
                            <td><small style={{ color: "var(--tch-text-muted)" }}>{formatDateTime(st.firstWatchedAt)}</small></td>
                            <td><small style={{ color: "var(--tch-text-muted)" }}>{formatDateTime(st.lastWatchedAt)}</small></td>
                            <td>
                              <div style={{ display: "flex", gap: 6, fontSize: "0.75rem" }}>
                                <span title="Video downloads" style={{ background: "rgba(79,70,229,0.09)", padding: "2px 7px", borderRadius: 6, color: "var(--tch-primary)", fontWeight: 700 }}>
                                  Video {st.videoDownloadsCount || 0}
                                </span>
                                {st.resourceDownloadsCount > 0 && (
                                  <span title="Resource downloads" style={{ background: "rgba(16,185,129,0.1)", padding: "2px 7px", borderRadius: 6, color: "#059669", fontWeight: 700 }}>
                                    Files {st.resourceDownloadsCount}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="teacher-modal-footer" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--tch-text-muted)" }}>
            Showing {filteredStudents.length} of {allStudents.length} students in {lecture?.branch} ({lecture?.semester})
          </span>
          <button type="button" className="tch-btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ==========================================================================
   VIDEO PLAYER MODAL
   ========================================================================== */
function LecturePlayerModal({ lecture, onClose, onCopyLink }) {
  useModalBehavior(onClose);
  const ytId = getYouTubeId(lecture.videoUrl);
  const id = lid(lecture);
  const resources = lecture.resources || [];
  const useNative =
    lecture.videoUrl?.startsWith("/uploads/") || /\.(mp4|webm)$/i.test(lecture.videoUrl || "") || !!id;

  return createPortal(
    <div className="teacher-video-modal-backdrop" onClick={onClose}>
      <div
        className="teacher-video-modal-content"
        role="dialog"
        aria-modal="true"
        aria-label={lecture.title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="teacher-video-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span className="tch-badge tch-badge-primary" style={{ flexShrink: 0 }}>{lecture.subject}</span>
            <h3>{lecture.title}</h3>
          </div>
          <button type="button" className="teacher-video-close" onClick={onClose} aria-label="Close player">
            <X size={18} />
          </button>
        </div>

        <div className="lx-player-layout">
          <div className="teacher-video-player-wrap">
            {ytId ? (
              <iframe
                title={lecture.title}
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : useNative ? (
              <video
                src={id ? authApi.getLectureStreamUrl(id) : lecture.videoUrl}
                controls
                autoPlay
                playsInline
                className="teacher-native-video"
              />
            ) : (
              <div style={{ padding: 40, textAlign: "center", color: "#fff" }}>
                <p>External video: {lecture.videoUrl}</p>
                <a href={lecture.videoUrl} target="_blank" rel="noopener noreferrer" className="tch-btn-primary">
                  Open in new tab
                </a>
              </div>
            )}
          </div>

          <aside className="lx-player-side">
            <div>
              <h5>About this lecture</h5>
              <p>{lecture.description || "No summary was added for this lecture."}</p>
            </div>

            <div className="lx-stat-pairs">
              <div><small>Views</small><b>{lecture.viewsCount || 0}</b></div>
              <div><small>Completed</small><b>{lecture.completionsCount || 0}</b></div>
              <div><small>Duration</small><b>{formatMinutes(lecture.durationMinutes || 45)}</b></div>
              <div><small>Unit</small><b>{lecture.unitNumber || "—"}</b></div>
            </div>

            <div>
              <h5>Attached files ({resources.length})</h5>
              {resources.length === 0 ? (
                <p>No notes or attachments for this lecture.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {resources.map((r, i) => (
                    <a
                      key={r._id || i}
                      className="lx-resource-link"
                      href={authApi.getLectureDownloadUrl(id, r._id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText size={15} /> <span>{r.title}</span> <Download size={14} />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <button type="button" className="lx-pill-btn" style={{ justifyContent: "center" }} onClick={() => onCopyLink(lecture)}>
              <Link2 size={14} /> Copy lecture link
            </button>
          </aside>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */
export default function TeacherLectures({ showToast, currentUser }) {
  /* ---------- data ---------- */
  const [activeTab, setActiveTab] = useState("lectures");
  const [lectures, setLectures] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  /* ---------- ui ---------- */
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);
  const [activeVideo, setActiveVideo] = useState(null);
  const [analyticsLecture, setAnalyticsLecture] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  /* ---------- filters ---------- */
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterSemester, setFilterSemester] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [studentQuery, setStudentQuery] = useState("");

  /* ---------- wizard form ---------- */
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [branch, setBranch] = useState(currentUser?.department || "CSE");
  const [semester, setSemester] = useState("Semester 5");
  const [academicYear, setAcademicYear] = useState("3rd Year");
  const [subject, setSubject] = useState("Operating Systems");
  const [subjectCode, setSubjectCode] = useState("CS-501");
  const [topic, setTopic] = useState("");
  const [unitNumber, setUnitNumber] = useState(1);
  const [lectureType, setLectureType] = useState("Theory");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [status, setStatus] = useState("published");
  const [videoSource, setVideoSource] = useState("youtube");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbPreview, setThumbPreview] = useState("");
  const [resourceFiles, setResourceFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgressPct, setUploadProgressPct] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [stepError, setStepError] = useState("");

  /* Edit mode & chunked upload states */
  const [existingVideo, setExistingVideo] = useState(null);
  const [replaceVideoMode, setReplaceVideoMode] = useState(false);
  const [removeVideoFlag, setRemoveVideoFlag] = useState(false);
  const [existingResources, setExistingResources] = useState([]);
  const [removedResourceIds, setRemovedResourceIds] = useState([]);
  const [removeThumbFlag, setRemoveThumbFlag] = useState(false);
  const [uploadStage, setUploadStage] = useState("idle");
  const [uploadStageText, setUploadStageText] = useState("");
  const [uploadStats, setUploadStats] = useState(null);
  const [cachedCompletedVideo, setCachedCompletedVideo] = useState(null);
  const [cachedVideoFileObj, setCachedVideoFileObj] = useState(null);
  const [partialFailureMessage, setPartialFailureMessage] = useState("");
  const [isDraggingDocs, setIsDraggingDocs] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const videoInputRef = useRef(null);
  const thumbInputRef = useRef(null);
  const resourceInputRef = useRef(null);
  const searchRef = useRef(null);

  const facultyName = currentUser?.fullName || "Faculty Instructor";
  const facultyDesignation = currentUser?.designation || "Assistant Professor";
  const facultyDepartment = currentUser?.department || branch;

  /* ---------- fetching ---------- */
  const fetchLectures = useCallback(() => {
    setLoading(true);
    authApi
      .getLectures({ myLectures: "false" })
      .then((res) => { setLectures(res?.lectures || []); setLoading(false); })
      .catch((err) => { setLoading(false); showToast?.(err.message || "Could not load lectures.", true); });
  }, [showToast]);

  const fetchAnalytics = useCallback(() => {
    setLoadingAnalytics(true);
    const params = {};
    if (filterBranch !== "all") params.branch = filterBranch;
    if (filterSemester !== "all") params.semester = filterSemester;
    authApi
      .getLectureAnalytics(params)
      .then((res) => { setAnalytics(res?.analytics || null); setLoadingAnalytics(false); })
      .catch((err) => { setLoadingAnalytics(false); console.warn("Could not load staff analytics:", err?.message); });
  }, [filterBranch, filterSemester]);

  useEffect(() => { fetchLectures(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [searchQuery, filterBranch, filterSemester, filterSubject, filterStatus, sortBy]);

  /* ---------- keyboard shortcuts: "/" search, "n" new ---------- */
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (["input", "textarea", "select"].includes(tag) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (showUploadModal || activeVideo || analyticsLecture) return;
      if (e.key === "/") { e.preventDefault(); setActiveTab("lectures"); setTimeout(() => searchRef.current?.focus(), 30); }
      if (e.key.toLowerCase() === "n") { e.preventDefault(); openCreateModal(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- thumbnail preview URL ---------- */
  useEffect(() => {
    if (!thumbnailFile) { setThumbPreview(""); return undefined; }
    const url = URL.createObjectURL(thumbnailFile);
    setThumbPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnailFile]);

  /* ---------- derived ---------- */
  const availableSubjects = useMemo(() => {
    const set = new Set();
    lectures.forEach((l) => l.subject && set.add(l.subject));
    return Array.from(set).sort();
  }, [lectures]);

  const statusCounts = useMemo(() => {
    const c = { all: lectures.length, published: 0, draft: 0, archived: 0 };
    lectures.forEach((l) => { const s = l.status || "published"; if (c[s] !== undefined) c[s] += 1; });
    return c;
  }, [lectures]);

  const filteredLectures = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = lectures.filter((l) => {
      if (filterBranch !== "all" && l.branch !== filterBranch) return false;
      if (filterSemester !== "all" && l.semester !== filterSemester) return false;
      if (filterSubject !== "all" && l.subject !== filterSubject) return false;
      if (filterStatus !== "all" && (l.status || "published") !== filterStatus) return false;
      if (q) {
        const hay = `${l.title || ""} ${l.topic || ""} ${l.subject || ""} ${l.uploadedByName || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const ts = (l) => new Date(l.createdAt || 0).getTime();
    const sorters = {
      newest: (a, b) => ts(b) - ts(a),
      oldest: (a, b) => ts(a) - ts(b),
      views: (a, b) => (b.viewsCount || 0) - (a.viewsCount || 0),
      completions: (a, b) => (b.completionsCount || 0) - (a.completionsCount || 0),
      title: (a, b) => (a.title || "").localeCompare(b.title || "")
    };
    return list.sort(sorters[sortBy] || sorters.newest);
  }, [lectures, filterBranch, filterSemester, filterSubject, filterStatus, searchQuery, sortBy]);

  const visibleLectures = filteredLectures.slice(0, visibleCount);

  const activeFilterCount =
    (searchQuery ? 1 : 0) + (filterBranch !== "all" ? 1 : 0) + (filterSemester !== "all" ? 1 : 0) +
    (filterSubject !== "all" ? 1 : 0) + (filterStatus !== "all" ? 1 : 0);

  const resetFilters = () => {
    setSearchQuery(""); setFilterBranch("all"); setFilterSemester("all");
    setFilterSubject("all"); setFilterStatus("all"); setSortBy("newest");
  };

  const filteredStudentProgress = useMemo(() => {
    const list = analytics?.studentProgressList || [];
    const q = studentQuery.toLowerCase().trim();
    if (!q) return list;
    return list.filter((s) => [s.name, s.email, s.enrollmentNo].some((f) => f && f.toLowerCase().includes(q)));
  }, [analytics, studentQuery]);

  /* ---------- selection ---------- */
  const toggleSelect = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const clearSelection = () => setSelectedIds(new Set());
  const selectAllVisible = () => setSelectedIds(new Set(filteredLectures.map(lid)));

  const runBulk = async (label, fn) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setBulkBusy(true);
    const results = await Promise.allSettled(ids.map(fn));
    const failed = results.filter((r) => r.status === "rejected").length;
    setBulkBusy(false);
    clearSelection();
    fetchLectures();
    fetchAnalytics();
    if (failed) showToast?.(`${label}: ${ids.length - failed} done, ${failed} failed.`, true);
    else showToast?.(`${label}: ${ids.length} lecture${ids.length > 1 ? "s" : ""} updated.`);
  };

  const bulkSetStatus = (s) => runBulk(s === "published" ? "Published" : s === "draft" ? "Moved to drafts" : "Archived",
    (id) => authApi.updateLecture(id, { status: s }));

  const bulkDelete = () => {
    if (!window.confirm(`Delete ${selectedIds.size} selected lecture(s) and all their study files? This cannot be undone.`)) return;
    runBulk("Deleted", (id) => authApi.deleteLecture(id));
  };

  /* ---------- Attachment Management Helpers ---------- */
  const handleAddResourceFiles = (fileList) => {
    if (!fileList || !fileList.length) return;
    const incoming = Array.from(fileList);
    const currentTotal = resourceFiles.length + existingResources.length;
    const remainingSlots = Math.max(0, 30 - currentTotal);

    if (remainingSlots <= 0) {
      showToast?.("Maximum limit of 30 attachments reached for this lecture.", true);
      return;
    }

    const accepted = [];
    let oversizedCount = 0;
    let duplicateCount = 0;

    for (const f of incoming) {
      // 50 MB limit
      if (f.size > 50 * 1024 * 1024) {
        oversizedCount++;
        continue;
      }
      // Check duplicate
      const isDuplicate = resourceFiles.some(
        (existing) => existing.name === f.name && existing.size === f.size
      );
      if (isDuplicate) {
        duplicateCount++;
        continue;
      }
      accepted.push(f);
    }

    if (oversizedCount > 0) {
      showToast?.(`${oversizedCount} file(s) exceeded the 50 MB limit and were skipped.`, true);
    }

    if (accepted.length > remainingSlots) {
      showToast?.(`Only ${remainingSlots} attachment slot(s) remaining. Added first ${remainingSlots}.`, true);
      accepted.splice(remainingSlots);
    }

    if (accepted.length > 0) {
      setResourceFiles((prev) => [...prev, ...accepted]);
      showToast?.(`Attached ${accepted.length} file${accepted.length > 1 ? "s" : ""}.`);
    } else if (duplicateCount > 0 && oversizedCount === 0) {
      showToast?.("Selected file(s) are already in your attachment list.", true);
    }
  };

  const handleRemoveResourceFile = (index) => {
    setResourceFiles((prev) => prev.filter((_, i) => i !== index));
    if (resourceInputRef.current) {
      resourceInputRef.current.value = "";
    }
  };

  const handleClearAllNewResources = () => {
    setResourceFiles([]);
    if (resourceInputRef.current) {
      resourceInputRef.current.value = "";
    }
    showToast?.("Cleared newly selected attachments.");
  };

  const handleRemoveExistingResource = (resItem) => {
    const resId = resItem._id || resItem.id;
    setRemovedResourceIds((prev) => (prev.includes(resId) ? prev : [...prev, resId]));
    setExistingResources((prev) => prev.filter((r) => (r._id || r.id) !== resId));
    showToast?.(`Attachment "${resItem.title || resItem.originalname || "File"}" marked for removal.`);
  };

  const handleOpenDocPreview = (doc) => {
    if (doc instanceof File) {
      const url = URL.createObjectURL(doc);
      setPreviewDoc({
        title: doc.name,
        originalname: doc.name,
        url,
        isBlob: true,
        mimetype: doc.type,
        size: doc.size
      });
      return;
    }
    const fileUrl = doc.fileUrl ? authApi.resolveUrl(doc.fileUrl) : "";
    setPreviewDoc({
      title: doc.title || doc.originalname || "Attachment Preview",
      originalname: doc.originalname || doc.title,
      url: fileUrl,
      isBlob: false,
      mimetype: doc.mimetype,
      size: doc.filesize
    });
  };

  const handleCloseDocPreview = () => {
    if (previewDoc?.isBlob && previewDoc?.url) {
      try { URL.revokeObjectURL(previewDoc.url); } catch {}
    }
    setPreviewDoc(null);
  };

  /* ---------- modal helpers ---------- */
  const resetForm = () => {
    setStep(1); setStepError("");
    setTitle(""); setDescription(""); setTopic(""); setVideoUrl("");
    setVideoFile(null); setThumbnailFile(null); setResourceFiles([]);
    setUploadProgressPct(0); setStatus("published"); setVideoSource("upload");
    setExistingVideo(null);
    setReplaceVideoMode(false);
    setRemoveVideoFlag(false);
    setExistingResources([]);
    setRemovedResourceIds([]);
    setRemoveThumbFlag(false);
    setUploadStage("idle");
    setUploadStageText("");
    setUploadStats(null);
    setCachedCompletedVideo(null);
    setCachedVideoFileObj(null);
    setPartialFailureMessage("");
    setIsDraggingDocs(false);
    setPreviewDoc(null);
    if (resourceInputRef.current) {
      resourceInputRef.current.value = "";
    }
  };

  const openCreateModal = () => { setEditingLecture(null); resetForm(); setShowUploadModal(true); };

  const openEditModal = (lec) => {
    setEditingLecture(lec);
    setStep(1); setStepError("");
    setTitle(lec.title || ""); setDescription(lec.description || "");
    setBranch(lec.branch || "CSE"); setSemester(lec.semester || "Semester 5");
    setAcademicYear(lec.academicYear || "3rd Year");
    setSubject(lec.subject || ""); setSubjectCode(lec.subjectCode || "");
    setTopic(lec.topic || ""); setUnitNumber(lec.unitNumber || 1);
    setLectureType(lec.lectureType || "Theory");
    setDurationMinutes(lec.durationMinutes || 45);
    setStatus(lec.status || "published");
    setVideoUrl(lec.videoUrl || "");
    setVideoFile(null); setThumbnailFile(null); setResourceFiles([]);
    setReplaceVideoMode(false);
    setRemoveVideoFlag(false);
    setRemoveThumbFlag(false);
    setRemovedResourceIds([]);
    setUploadStage("idle");
    setUploadStageText("");
    setUploadStats(null);
    setCachedCompletedVideo(null);
    setCachedVideoFileObj(null);
    setPartialFailureMessage("");

    // Populate existing video info
    if (lec.videoSource === "documents" || (!lec.videoUrl && (lec.resources?.length || 0) > 0)) {
      setVideoSource("documents");
      setExistingVideo(null);
      setReplaceVideoMode(false);
    } else if (lec.videoSource === "upload" || lec.videoFile?.filename || (lec.videoUrl && !getYouTubeId(lec.videoUrl))) {
      setVideoSource("upload");
      setExistingVideo({
        originalName: lec.videoFile?.originalname || lec.videoFile?.originalName || (lec.videoUrl ? lec.videoUrl.split("/").pop() : "Uploaded Video"),
        fileSize: lec.videoFile?.size || lec.videoFile?.fileSize || null,
        mimeType: lec.videoFile?.mimetype || lec.videoFile?.mimeType || "video/mp4",
        videoUrl: lec.videoUrl,
        videoSource: "upload"
      });
      setReplaceVideoMode(false);
    } else if (lec.videoSource === "youtube" || getYouTubeId(lec.videoUrl)) {
      setVideoSource("youtube");
      setExistingVideo({
        originalName: "YouTube Stream",
        fileSize: null,
        mimeType: "video/youtube",
        videoUrl: lec.videoUrl,
        videoSource: "youtube"
      });
      setReplaceVideoMode(false);
    } else if (lec.videoUrl) {
      setVideoSource("external");
      setExistingVideo({
        originalName: "External Stream",
        fileSize: null,
        mimeType: "video/stream",
        videoUrl: lec.videoUrl,
        videoSource: "external"
      });
      setReplaceVideoMode(false);
    } else {
      setVideoSource(lec.resources?.length > 0 ? "documents" : "upload");
      setExistingVideo(null);
      setReplaceVideoMode(true);
    }

    // Populate existing resources
    setExistingResources(Array.isArray(lec.resources) ? [...lec.resources] : []);

    setShowUploadModal(true);
  };

  const closeUploadModal = useCallback(() => {
    if (submitting) return;
    setShowUploadModal(false);
    setEditingLecture(null);
    resetForm();
  }, [submitting]);

  /* modal behavior for the wizard (portal-less, so handled manually) */
  useEffect(() => {
    if (!showUploadModal) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") closeUploadModal(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [showUploadModal, closeUploadModal]);

  /* ---------- wizard validation ---------- */
  const validateStep = (s) => {
    if (s === 1) {
      if (!subject.trim()) return "Add the course subject.";
      if (!title.trim()) return "Give the lecture a title.";
      if (!topic.trim()) return "Add the topic or chapter.";
    }
    if (s === 2) {
      if (editingLecture) {
        if (replaceVideoMode) {
          if (videoSource === "youtube") {
            if (!videoUrl.trim()) return "Paste a YouTube link.";
            if (!getYouTubeId(videoUrl)) return "That doesn’t look like a valid YouTube link.";
          } else if (videoSource === "external") {
            if (!videoUrl.trim()) return "Paste the stream URL.";
          } else if (videoSource === "documents") {
            if (existingResources.length === 0 && resourceFiles.length === 0) {
              return "Attach at least one study document or note.";
            }
          } else if (videoSource === "upload") {
            if (!videoFile && !existingVideo && existingResources.length === 0 && resourceFiles.length === 0) {
              return "Choose a video file to replace with, or attach study documents.";
            }
          }
        }
      } else {
        if (videoSource === "youtube") {
          if (!videoUrl.trim()) return "Paste a YouTube link.";
          if (!getYouTubeId(videoUrl)) return "That doesn’t look like a valid YouTube link.";
        } else if (videoSource === "external") {
          if (!videoUrl.trim()) return "Paste the stream URL.";
        } else if (videoSource === "documents") {
          if (resourceFiles.length === 0) {
            return "Attach at least one document (PDF, notes, slides, etc.) for this document-only lecture.";
          }
        } else if (videoSource === "upload") {
          if (!videoFile && resourceFiles.length === 0) {
            return "Please select a video file or attach study documents.";
          }
        }
      }
    }
    return "";
  };

  const goNext = () => {
    const err = validateStep(step);
    setStepError(err);
    if (!err) setStep((s) => Math.min(3, s + 1));
  };
  const goStep = (target) => {
    if (target <= step) { setStepError(""); setStep(target); return; }
    for (let s = step; s < target; s += 1) {
      const err = validateStep(s);
      if (err) { setStepError(err); setStep(s); return; }
    }
    setStepError(""); setStep(target);
  };

  /* ---------- drag & drop ---------- */
  const onDropVideo = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && (f.type.startsWith("video/") || /\.(mp4|webm|mkv|mov|avi|m4v)$/i.test(f.name))) {
      setVideoFile(f);
    } else {
      showToast?.("Drop a valid video file (.mp4, .webm, .mkv, .mov).", true);
    }
  };

  /* ---------- submit ---------- */
  const handleSubmitLecture = async (e) => {
    e.preventDefault();
    if (step < 3) { goNext(); return; }
    const err = validateStep(1) || validateStep(2);
    if (err) { setStepError(err); return; }

    setSubmitting(true);
    setUploadProgressPct(5);
    setStepError("");
    setPartialFailureMessage("");

    try {
      // ----------------------------------------------------
      // PHASE 1: VIDEO UPLOAD (Chunked or Direct)
      // ----------------------------------------------------
      let completedVideo = null;

      // Check if we already have a cached completed video for this exact file
      if (videoFile && cachedCompletedVideo && cachedVideoFileObj === videoFile) {
        completedVideo = cachedCompletedVideo;
        setUploadStage("uploading_video");
        setUploadStageText(`Reusing uploaded video (${completedVideo.originalname || completedVideo.filename}).`);
        setUploadProgressPct(100);
      } else if (videoFile) {
        setUploadStage("uploading_video");
        if (videoFile.size > 20 * 1024 * 1024) {
          setUploadStageText(`Uploading ${videoFile.name} (${formatBytes(videoFile.size)}) via chunked stream...`);
          try {
            completedVideo = await authApi.uploadVideoFileChunked(videoFile, (p) => {
              setUploadProgressPct(p.percent);
              setUploadStats(p);
              if (p.stage === "assembling") {
                setUploadStage("uploading_video");
                setUploadStageText("Assembling and verifying video chunks on server...");
              } else {
                setUploadStage("uploading_video");
                setUploadStageText(`Uploading video: Chunk ${p.chunk || 1} of ${p.totalChunks || 1} (${formatBytes(p.loaded || 0)} / ${formatBytes(p.total || 0)})`);
              }
            });
            // Cache the completed video file object so subsequent retries don't re-upload it
            setCachedCompletedVideo(completedVideo);
            setCachedVideoFileObj(videoFile);
          } catch (vidErr) {
            setUploadStage("idle");
            setStepError(`Video upload failed: ${vidErr.message || "Network error"}`);
            throw vidErr;
          }
        }
      }

      // ----------------------------------------------------
      // PHASE 2: DOCUMENT & ATTACHMENT UPLOAD
      // ----------------------------------------------------
      let uploadedDocumentsList = [];
      if (resourceFiles && resourceFiles.length > 0) {
        setUploadStage("uploading_documents");
        setUploadStageText(`Uploading ${resourceFiles.length} study document(s) & attachment(s)...`);
        setUploadProgressPct(10);

        try {
          const docRes = await authApi.uploadLectureDocuments(resourceFiles, (p) => {
            setUploadProgressPct(p.percent);
            setUploadStats({
              loaded: p.loaded,
              total: p.total,
              stage: "uploading_documents"
            });
            setUploadStageText(`Uploading documents: ${p.percent}% (${formatBytes(p.loaded || 0)} of ${formatBytes(p.total || 0)})`);
          });

          if (docRes?.documents && Array.isArray(docRes.documents)) {
            uploadedDocumentsList = docRes.documents;
          }
        } catch (docErr) {
          setUploadStage("idle");
          const failMsg = docErr.message || "Document transfer failed.";
          if (completedVideo || (videoFile && cachedCompletedVideo)) {
            const pMsg = `Video upload succeeded (${(completedVideo || cachedCompletedVideo)?.originalname || "cached"}), but document upload failed: ${failMsg}. Your video is preserved. Please adjust attachments and click Publish again without re-uploading the video.`;
            setPartialFailureMessage(pMsg);
            setStepError(pMsg);
          } else {
            setStepError(`Document upload failed: ${failMsg}`);
          }
          throw docErr;
        }
      }

      // ----------------------------------------------------
      // PHASE 3: METADATA PERSISTENCE & FINAL PUBLISHING
      // ----------------------------------------------------
      setUploadStage("publishing");
      setUploadStageText(editingLecture ? "Applying updates to lecture record..." : "Registering and publishing lecture...");
      setUploadProgressPct(90);

      const effectiveVideoSource = videoSource === "documents"
        ? "documents"
        : (!videoFile && !existingVideo && !videoUrl && (resourceFiles.length > 0 || existingResources.length > 0))
        ? "documents"
        : videoSource;

      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("description", description.trim());
      fd.append("branch", branch);
      fd.append("semester", semester);
      fd.append("academicYear", academicYear);
      fd.append("subject", subject.trim());
      fd.append("subjectCode", subjectCode.trim());
      fd.append("topic", topic.trim());
      fd.append("unitNumber", unitNumber);
      fd.append("lectureType", lectureType);
      fd.append("durationMinutes", Number(durationMinutes) || 45);
      fd.append("status", status);
      fd.append("videoSource", effectiveVideoSource);

      if (uploadedDocumentsList.length > 0) {
        fd.append("uploadedDocuments", JSON.stringify(uploadedDocumentsList));
      }

      if (editingLecture) {
        // Edit mode specifics
        if (replaceVideoMode) {
          if (videoUrl.trim()) fd.append("videoUrl", videoUrl.trim());
          if (completedVideo) {
            fd.append("completedVideoFile", JSON.stringify(completedVideo));
          } else if (videoFile) {
            fd.append("videoFile", videoFile);
          }
        } else if (removeVideoFlag) {
          fd.append("removeVideo", "true");
        } else {
          if (videoUrl.trim()) fd.append("videoUrl", videoUrl.trim());
        }

        if (removeThumbFlag) {
          fd.append("removeThumbnail", "true");
        } else if (thumbnailFile) {
          fd.append("thumbnailFile", thumbnailFile);
        }

        if (removedResourceIds.length > 0) {
          fd.append("removeResourceIds", JSON.stringify(removedResourceIds));
        }

        const res = await authApi.updateLecture(lid(editingLecture), fd, (p) => {
          setUploadProgressPct(p.percent);
          setUploadStats(p);
        });

        setUploadStage("complete");
        setUploadProgressPct(100);
        showToast?.(res?.message || "Lecture updated successfully.");
      } else {
        // Create mode specifics
        if (videoUrl.trim()) fd.append("videoUrl", videoUrl.trim());
        if (completedVideo) {
          fd.append("completedVideoFile", JSON.stringify(completedVideo));
        } else if (videoFile) {
          fd.append("videoFile", videoFile);
        }
        if (thumbnailFile) fd.append("thumbnailFile", thumbnailFile);

        const res = await authApi.createLecture(fd, (p) => {
          setUploadProgressPct(p.percent);
          setUploadStats(p);
        });

        setUploadStage("complete");
        setUploadProgressPct(100);
        showToast?.(res?.message || "Lecture published successfully.");
      }

      setCachedCompletedVideo(null);
      setCachedVideoFileObj(null);
      setPartialFailureMessage("");
      setShowUploadModal(false);
      setEditingLecture(null);
      resetForm();
      fetchLectures();
      fetchAnalytics();
    } catch (error) {
      showToast?.(error.message || "Could not save the lecture.", true);
    } finally {
      setSubmitting(false);
      setUploadProgressPct(0);
      setUploadStage("idle");
      setUploadStats(null);
    }
  };

  /* ---------- single actions ---------- */
  const handleToggleStatus = async (lec, newStatus) => {
    const id = lid(lec);
    try {
      await authApi.updateLecture(id, { status: newStatus });
      showToast?.(newStatus === "published" ? "Lecture published." : "Lecture moved to drafts.");
      setLectures((prev) => prev.map((l) => (lid(l) === id ? { ...l, status: newStatus } : l)));
    } catch (err) {
      showToast?.(err.message || "Could not update the status.", true);
    }
  };

  const handleDeleteLecture = async (id) => {
    if (!window.confirm("Delete this lecture and all its study files? This cannot be undone.")) return;
    try {
      await authApi.deleteLecture(id);
      showToast?.("Lecture deleted.");
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      fetchLectures();
      fetchAnalytics();
    } catch (err) {
      showToast?.(err.message || "Could not delete the lecture.", true);
    }
  };

  const copyLectureLink = async (lec) => {
    const id = lid(lec);
    const link = getYouTubeId(lec.videoUrl) ? lec.videoUrl : `${window.location.origin}/lectures/${id}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast?.("Link copied.");
    } catch {
      showToast?.("Copy failed. Your browser blocked clipboard access.", true);
    }
  };

  /* ---------- KPI definitions ---------- */
  const kpis = analytics
    ? [
        { c: "blue", icon: Film, label: "Published lectures", v: analytics.totalLectures },
        { c: "indigo", icon: Eye, label: "Student views", v: analytics.totalViews },
        { c: "green", icon: CheckCircle2, label: "Completions (90%+)", v: analytics.totalCompletions },
        { c: "orange", icon: Download, label: "Resource downloads", v: analytics.totalDownloads },
        { c: "purple", icon: TrendingUp, label: "Avg. completion rate", v: analytics.averageCompletionRate, suffix: "%" }
      ]
    : [];

  const selecting = selectedIds.size > 0;

  /* ==========================================================================
     RENDER
     ========================================================================== */
  return (
    <div className="teacher-role-view teacher-lec-container">
      {/* ---------------- HERO ---------------- */}
      <header className="lx-hero">
        <div className="lx-hero-grid-lines" />
        <div>
          <div className="lx-hero-meta">
            <span className="lx-live-chip"><span className="lx-live-dot" /> {facultyDepartment} Academic Hub</span>
            <span>{facultyName} · {facultyDesignation}</span>
          </div>
          <h2>
            <span className="lx-hero-icon"><Video size={26} color="#fff" /></span>
            Lecture &amp; video studio
          </h2>
          <p>
            Publish recorded lectures, lab demos and notes, then see exactly which students
            have watched, finished or skipped each one.
          </p>
        </div>

        <div className="lx-hero-actions">
          <span className="lx-kbd-hint" style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: "0.76rem", color: "rgba(226,232,240,0.7)" }}>
            <span className="lx-kbd">/</span> search <span className="lx-kbd">N</span> new
          </span>
          <button type="button" className="tch-btn-secondary" onClick={() => { fetchLectures(); fetchAnalytics(); }} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin" : ""} /> <span>Refresh</span>
          </button>
          <button type="button" className="lx-cta" onClick={openCreateModal}>
            <Plus size={17} /> Publish lecture
          </button>
        </div>
      </header>

      {/* ---------------- KPIs ---------------- */}
      {analytics && (
        <section className="lx-kpi-grid" aria-label="Lecture summary">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className={`tch-stat-box lx-kpi-${k.c}`}>
                <div className={`tch-stat-icon-wrap ${k.c}`}><Icon size={21} /></div>
                <div style={{ minWidth: 0 }}>
                  <span className="tch-stat-label">{k.label}</span>
                  <strong className="tch-stat-value">
                    <AnimatedNumber value={k.v} suffix={k.suffix || ""} />
                  </strong>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ---------------- TABS ---------------- */}
      <div className="teacher-lec-tab-bar" role="tablist">
        <button type="button" role="tab" aria-selected={activeTab === "lectures"}
          className={`tch-lec-tab ${activeTab === "lectures" ? "active" : ""}`} onClick={() => setActiveTab("lectures")}>
          <Film size={16} /> Lectures ({lectures.length})
        </button>
        <button type="button" role="tab" aria-selected={activeTab === "analytics"}
          className={`tch-lec-tab ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>
          <BarChart3 size={16} /> Student engagement
        </button>
      </div>

      {/* ======================= TAB: LECTURES ======================= */}
      {activeTab === "lectures" && (
        <>
          <div className="lx-commandbar">
            <div className="lx-commandbar-row">
              <label className="teacher-lec-search-box">
                <Search size={17} color="var(--tch-text-muted)" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search by title, topic, subject or faculty"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery
                  ? <button type="button" className="lx-clear-btn" onClick={() => setSearchQuery("")} aria-label="Clear search"><X size={12} /></button>
                  : <span className="lx-kbd">/</span>}
              </label>

              <div className="teacher-lec-filter-group">
                <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="tch-select" aria-label="Branch">
                  <option value="all">All branches</option>
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                <select value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)} className="tch-select" aria-label="Semester">
                  <option value="all">All semesters</option>
                  {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="tch-select" aria-label="Subject">
                  <option value="all">All subjects</option>
                  {availableSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="tch-select" aria-label="Sort">
                  {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>

              <div className="lx-segmented" role="group" aria-label="Layout">
                <button type="button" className={viewMode === "grid" ? "on" : ""} onClick={() => setViewMode("grid")} aria-label="Grid view" title="Grid view">
                  <LayoutGrid size={15} />
                </button>
                <button type="button" className={viewMode === "list" ? "on" : ""} onClick={() => setViewMode("list")} aria-label="List view" title="List view">
                  <List size={15} />
                </button>
              </div>
            </div>

            <div className="lx-chip-row">
              {STATUS_FILTERS.map((f) => (
                <button key={f.id} type="button" className={`lx-chip ${filterStatus === f.id ? "on" : ""}`} onClick={() => setFilterStatus(f.id)}>
                  {f.label} <small>{statusCounts[f.id]}</small>
                </button>
              ))}
            </div>

            <div className="lx-result-line">
              <span>
                {filteredLectures.length} lecture{filteredLectures.length === 1 ? "" : "s"}
                {activeFilterCount > 0 && ` · ${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} on`}
              </span>
              <span style={{ display: "flex", gap: 10 }}>
                {filteredLectures.length > 0 && (
                  <button type="button" className="lx-link-btn" onClick={selecting ? clearSelection : selectAllVisible}>
                    {selecting ? "Clear selection" : "Select all"}
                  </button>
                )}
                {activeFilterCount > 0 && (
                  <button type="button" className="lx-link-btn" onClick={resetFilters}>Reset filters</button>
                )}
              </span>
            </div>
          </div>

          {loading ? (
            <LectureSkeletons />
          ) : filteredLectures.length === 0 ? (
            <div className="tch-empty-state">
              <Video size={46} color="var(--tch-text-muted)" />
              <h3>{lectures.length === 0 ? "No lectures yet" : "Nothing matches these filters"}</h3>
              <p>
                {lectures.length === 0
                  ? "Publish your first lecture and your students will see it in their portal right away."
                  : "Try a different search or clear the filters to see every lecture."}
              </p>
              {lectures.length === 0 ? (
                <button type="button" className="tch-btn-primary" style={{ marginTop: 12 }} onClick={openCreateModal}>
                  <Plus size={16} /> Publish a lecture
                </button>
              ) : (
                <button type="button" className="tch-btn-secondary" style={{ marginTop: 12 }} onClick={resetFilters}>
                  <RotateCcw size={14} /> Reset filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className={`teacher-lec-grid ${viewMode === "list" ? "is-list" : ""} ${selecting ? "lx-selecting" : ""}`}>
                {visibleLectures.map((lec, idx) => {
                  const id = lid(lec);
                  const thumb = getThumb(lec);
                  const resCount = (lec.resources || []).length;
                  const st = lec.status || "published";
                  const selected = selectedIds.has(id);
                  const rate = lec.viewsCount > 0 ? Math.round(((lec.completionsCount || 0) / lec.viewsCount) * 100) : 0;

                  return (
                    <article
                      key={id}
                      className={`teacher-lec-card ${selected ? "is-selected" : ""}`}
                      style={{ "--i": Math.min(idx, 12) }}
                    >
                      <div
                        className="teacher-lec-thumb"
                        role="button"
                        tabIndex={0}
                        aria-label={`Play ${lec.title}`}
                        onClick={() => setActiveVideo(lec)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveVideo(lec); } }}
                      >
                        {thumb ? <div className="lx-thumb-img" style={{ backgroundImage: `url(${thumb})` }} />
                               : <div className="lx-thumb-fallback"><Film size={44} /></div>}

                        <div className="teacher-lec-play-overlay">
                          <div className="teacher-lec-play-bubble"><Play size={22} fill="#0b1220" color="#0b1220" /></div>
                        </div>

                        <span className="tch-lec-badge-type">{lec.lectureType || "Theory"}</span>
                        {st !== "published" && <span className={`lx-status-flag ${st}`}>{st === "draft" ? "Draft" : "Archived"}</span>}
                        <span className="tch-lec-badge-duration"><Clock size={11} /> {formatMinutes(lec.durationMinutes || 45)}</span>

                        <button
                          type="button"
                          className="lx-select-box"
                          aria-label={selected ? "Deselect lecture" : "Select lecture"}
                          aria-pressed={selected}
                          onClick={(e) => { e.stopPropagation(); toggleSelect(id); }}
                        >
                          <Check size={15} strokeWidth={3} />
                        </button>
                      </div>

                      <div className="lx-card-main">
                        <div className="teacher-lec-card-body">
                          <div className="teacher-lec-card-meta">
                            <span className="tch-badge tch-badge-primary">{lec.subject}</span>
                            <span className="tch-badge tch-badge-secondary">{lec.branch} • {lec.semester}</span>
                          </div>
                          <h4 title={lec.title}>{lec.title}</h4>
                          {lec.topic && <p className="tch-lec-topic">{lec.topic}{lec.unitNumber ? ` · Unit ${lec.unitNumber}` : ""}</p>}
                          <p>{lec.description || "No summary added yet."}</p>

                          <div className="tch-lec-metrics-row">
                            <span><Eye size={13} /> {lec.viewsCount || 0}</span>
                            <span><CheckCircle2 size={13} /> {lec.completionsCount || 0} completed</span>
                            {resCount > 0 && <span><FileText size={13} /> {resCount} file{resCount > 1 ? "s" : ""}</span>}
                          </div>

                          {lec.viewsCount > 0 && (
                            <div className="lx-engage">
                              <div className="lx-engage-head"><span>Completion rate</span><strong>{rate}%</strong></div>
                              <div className="lx-engage-track"><div className="lx-engage-fill" style={{ width: `${rate}%` }} /></div>
                            </div>
                          )}
                        </div>

                        <div className="teacher-lec-card-footer">
                          <span className="tch-text-muted" style={{ fontSize: "0.78rem" }}>{timeAgo(lec.createdAt)}</span>
                          <div className="lx-card-actions">
                            <button type="button" className="lx-pill-btn" onClick={() => setAnalyticsLecture(lec)} title="Student watch analytics">
                              <BarChart3 size={14} /> Analytics
                            </button>
                            <button type="button" className="lx-icon-btn" onClick={() => copyLectureLink(lec)} title="Copy link" aria-label="Copy link">
                              <Link2 size={15} />
                            </button>
                            <button type="button" className="lx-icon-btn" onClick={() => openEditModal(lec)} title="Edit" aria-label="Edit lecture">
                              <Edit3 size={15} />
                            </button>
                            {st === "published" ? (
                              <button type="button" className="lx-icon-btn" onClick={() => handleToggleStatus(lec, "draft")} title="Move to drafts" aria-label="Move to drafts">
                                <EyeIcon size={15} style={{ opacity: 0.55 }} />
                              </button>
                            ) : (
                              <button type="button" className="lx-icon-btn ok" onClick={() => handleToggleStatus(lec, "published")} title="Publish" aria-label="Publish">
                                <FileUp size={15} />
                              </button>
                            )}
                            <button type="button" className="lx-icon-btn danger" onClick={() => handleDeleteLecture(id)} title="Delete" aria-label="Delete lecture">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {visibleCount < filteredLectures.length && (
                <div className="lx-loadmore">
                  <button type="button" className="tch-btn-secondary" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                    <Layers size={15} /> Show {Math.min(PAGE_SIZE, filteredLectures.length - visibleCount)} more
                    <span className="tch-text-muted"> ({filteredLectures.length - visibleCount} left)</span>
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ======================= TAB: ANALYTICS ======================= */}
      {activeTab === "analytics" && (
        <div className="tch-card teacher-analytics-container">
          <div>
            <div className="tch-pane-header" style={{ marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontFamily: "var(--lx-font-display)" }}>Student progress</h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--tch-text-muted)" }}>
                  Views, watch time and completion for every enrolled student.
                </p>
              </div>
              <label className="tch-analytics-search" style={{ maxWidth: 320 }}>
                <Search size={15} color="var(--tch-text-muted)" />
                <input type="text" placeholder="Find a student" value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} />
                {studentQuery && <button type="button" onClick={() => setStudentQuery("")} aria-label="Clear"><X size={14} /></button>}
              </label>
            </div>

            {loadingAnalytics ? (
              <div className="tch-empty-state" style={{ border: 0 }}>
                <Loader2 size={28} className="spin" color="var(--tch-primary)" />
                <p>Collecting student progress…</p>
              </div>
            ) : filteredStudentProgress.length === 0 ? (
              <div className="tch-empty-state">
                <Users size={40} color="var(--tch-text-muted)" />
                <p>{studentQuery ? "No student matches that search." : "No student watch records for this branch yet."}</p>
              </div>
            ) : (
              <div className="teacher-table-responsive" style={{ border: "1px solid var(--tch-border)", borderRadius: 14, maxHeight: "52vh" }}>
                <table className="tch-table">
                  <thead>
                    <tr>
                      <th>Student</th><th>Enrollment no.</th><th>Branch / Semester</th>
                      <th>Started</th><th>Completed (90%+)</th><th>Watch time</th><th>Overall completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudentProgress.map((st) => (
                      <tr key={st.studentId || st.enrollmentNo}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span className="tch-table-avatar">{st.name?.charAt(0) || "S"}</span>
                            <div>
                              <strong>{st.name}</strong>
                              <small style={{ display: "block", color: "var(--tch-text-muted)" }}>{st.email}</small>
                            </div>
                          </div>
                        </td>
                        <td><code>{st.enrollmentNo}</code></td>
                        <td>{st.branch} • {st.semester}</td>
                        <td><strong>{st.startedLectures}</strong></td>
                        <td><span className="tch-badge tch-badge-success">{st.completedLectures}</span></td>
                        <td>{formatMinutes(st.totalWatchMinutes)}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="tch-progress-track"><div className="tch-progress-fill" style={{ width: `${st.overallCompletionRate}%` }} /></div>
                            <span className="lx-mono" style={{ fontWeight: 700 }}>{st.overallCompletionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {analytics?.topLectures?.length > 0 && (
            <div>
              <h4 style={{ margin: "0 0 12px", fontFamily: "var(--lx-font-display)", fontSize: "1.05rem" }}>Most-watched lectures</h4>
              <div className="teacher-table-responsive" style={{ border: "1px solid var(--tch-border)", borderRadius: 14 }}>
                <table className="tch-table">
                  <thead>
                    <tr><th>#</th><th>Lecture</th><th>Subject &amp; topic</th><th>Views</th><th>Completions</th><th>Downloads</th><th>Completion</th></tr>
                  </thead>
                  <tbody>
                    {analytics.topLectures.map((top, i) => (
                      <tr key={top.id}>
                        <td><span className={`lx-rank ${i < 3 ? `r${i + 1}` : ""}`}>{i + 1}</span></td>
                        <td><strong>{top.title}</strong></td>
                        <td>{top.subject} • {top.topic}</td>
                        <td>{top.viewsCount}</td>
                        <td>{top.completionsCount}</td>
                        <td>{top.downloadsCount}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="tch-progress-track"><div className="tch-progress-fill" style={{ width: `${top.completionRate}%` }} /></div>
                            <span className="lx-mono" style={{ fontWeight: 700 }}>{top.completionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= BULK BAR ======================= */}
      {selecting && (
        <div className="lx-bulkbar" role="toolbar" aria-label="Bulk actions">
          <strong>{selectedIds.size} selected</strong>
          <div className="lx-bulkbar-actions">
            <button type="button" disabled={bulkBusy} onClick={() => bulkSetStatus("published")}><FileUp size={14} /> Publish</button>
            <button type="button" disabled={bulkBusy} onClick={() => bulkSetStatus("draft")}><EyeIcon size={14} /> Draft</button>
            <button type="button" disabled={bulkBusy} onClick={() => bulkSetStatus("archived")}><Archive size={14} /> Archive</button>
            <button type="button" disabled={bulkBusy} className="danger" onClick={bulkDelete}><Trash2 size={14} /> Delete</button>
          </div>
          <button type="button" onClick={clearSelection} aria-label="Clear selection" style={{ padding: 8 }}>
            {bulkBusy ? <Loader2 size={15} className="spin" /> : <X size={15} />}
          </button>
        </div>
      )}

      {/* ======================= PUBLISH / EDIT WIZARD ======================= */}
      {showUploadModal && createPortal(
        <div className="teacher-modal-backdrop" onClick={closeUploadModal}>
          <div className="teacher-modal-shell" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="teacher-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Film size={20} color="var(--tch-primary)" />
                <h3>{editingLecture ? "Edit lecture" : "Publish a new lecture"}</h3>
              </div>
              <button type="button" className="teacher-video-close" onClick={closeUploadModal} aria-label="Close"><X size={18} /></button>
            </div>

            <div className="tch-uploader-identity-banner">
              <ShieldCheck size={18} color="#10b981" />
              <div>
                <strong>Publishing as {facultyName}</strong>
                <p>{facultyDesignation} · {facultyDepartment} department. Verified by the server.</p>
              </div>
            </div>

            <nav className="lx-stepper" aria-label="Progress">
              {WIZARD_STEPS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`lx-step ${step === s.id ? "active" : step > s.id ? "done" : ""}`}
                  onClick={() => goStep(s.id)}
                  aria-current={step === s.id ? "step" : undefined}
                >
                  <span className="lx-step-dot">{step > s.id ? <Check size={14} strokeWidth={3} /> : s.id}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </nav>

            <form onSubmit={handleSubmitLecture} style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }} noValidate>
              <div className="teacher-modal-body">
                {/* ---------- STEP 1 ---------- */}
                {step === 1 && (
                  <div className="lx-step-panel">
                    <div className="teacher-form-row">
                      <div>
                        <label className="tch-label">Branch</label>
                        <select className="tch-select" value={branch} onChange={(e) => setBranch(e.target.value)} disabled={!!editingLecture}>
                          {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="tch-label">Semester</label>
                        <select className="tch-select" value={semester} onChange={(e) => setSemester(e.target.value)} disabled={!!editingLecture}>
                          {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="tch-label">Subject</label>
                        <input className="tch-input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Operating Systems" />
                      </div>
                      <div>
                        <label className="tch-label">Subject code</label>
                        <input className="tch-input" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} placeholder="CS-501" />
                      </div>
                    </div>

                    <div className="teacher-form-row">
                      <div className="lx-span-2">
                        <label className="tch-label">Lecture title</label>
                        <input className="tch-input" value={title} onChange={(e) => setTitle(e.target.value)}
                          placeholder="Virtual memory: paging and page replacement" maxLength={120} />
                        <p className="lx-field-hint">{title.length}/120 characters</p>
                      </div>
                      <div>
                        <label className="tch-label">Topic / chapter</label>
                        <input className="tch-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Paging and memory hierarchy" />
                      </div>
                      <div>
                        <label className="tch-label">Unit number</label>
                        <input type="number" min="1" max="12" className="tch-input" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} />
                      </div>
                    </div>

                    <div className="teacher-form-row">
                      <div>
                        <label className="tch-label">Lecture type</label>
                        <select className="tch-select" value={lectureType} onChange={(e) => setLectureType(e.target.value)}>
                          {LECTURE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="tch-label">Duration (minutes)</label>
                        <input type="number" min="1" max="300" className="tch-input" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
                      </div>
                      <div>
                        <label className="tch-label">Visibility</label>
                        <select className="tch-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                          <option value="published">Published: students can see it</option>
                          <option value="draft">Draft: only you can see it</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>

                    <label className="tch-label">Summary and prerequisites</label>
                    <textarea rows={4} className="tch-textarea" value={description} onChange={(e) => setDescription(e.target.value)}
                      placeholder="What does this lecture cover? Mention key formulas, demos and any assignment." />
                  </div>
                )}

                {/* ---------- STEP 2 ---------- */}
                {step === 2 && (
                  <div className="lx-step-panel">
                    {/* Existing Video Card in Edit Mode */}
                    {editingLecture && existingVideo && !replaceVideoMode && !removeVideoFlag ? (
                      <div className="lx-existing-video-card" style={{ marginBottom: 18 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                          <div>
                            <span className="lx-badge success" style={{ marginBottom: 6, display: "inline-block" }}>
                              Active Lecture Video
                            </span>
                            <h4 style={{ margin: "4px 0", fontSize: "1.05rem", fontWeight: 600, color: "var(--tch-text-primary, var(--lx-ink))" }}>
                              {existingVideo.originalName || "Uploaded Video"}
                            </h4>
                            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--tch-text-secondary, var(--lx-ink-3))" }}>
                              {existingVideo.fileSize ? `${formatBytes(existingVideo.fileSize)} · ` : ""}
                              {existingVideo.videoSource === "upload" ? "Uploaded Video File" : existingVideo.videoSource === "youtube" ? "YouTube Stream" : "External Stream"}
                            </p>
                          </div>
                          <div className="lx-existing-video-actions">
                            {existingVideo.videoUrl && (
                              <button
                                type="button"
                                className="tch-btn-secondary"
                                onClick={() => setActiveVideo(editingLecture)}
                                title="Preview this video in player"
                              >
                                <Play size={14} /> Preview
                              </button>
                            )}
                            {existingVideo.videoSource === "upload" && existingVideo.videoUrl && (
                              <button
                                type="button"
                                className="tch-btn-secondary"
                                onClick={() => authApi.downloadLectureFile(authApi.getLectureDownloadUrl(lid(editingLecture), null, "video"), existingVideo.originalName)}
                                title="Download the original video file"
                              >
                                <Download size={14} /> Download
                              </button>
                            )}
                            <button
                              type="button"
                              className="tch-btn-secondary"
                              onClick={() => {
                                setReplaceVideoMode(true);
                                setVideoSource("upload");
                              }}
                              title="Replace with a new video"
                            >
                              <RefreshCw size={14} /> Replace Video
                            </button>
                            <button
                              type="button"
                              className="tch-btn-danger"
                              onClick={() => {
                                if (window.confirm("Remove this video from the lecture?")) {
                                  setRemoveVideoFlag(true);
                                  setExistingVideo(null);
                                }
                              }}
                              title="Remove video from lecture"
                            >
                              <Trash2 size={14} /> Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Replacement Notice Banner */}
                        {editingLecture && replaceVideoMode && existingVideo && (
                          <div className="lx-replace-banner" style={{ marginBottom: 16 }}>
                            <div>
                              <strong>Replacing video:</strong> {existingVideo.originalName}
                            </div>
                            <button
                              type="button"
                              className="tch-btn-secondary"
                              style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                              onClick={() => {
                                setReplaceVideoMode(false);
                                setVideoFile(null);
                              }}
                            >
                              Keep Current Video
                            </button>
                          </div>
                        )}

                        {editingLecture && removeVideoFlag && (
                          <div className="lx-replace-banner" style={{ marginBottom: 16, borderColor: "var(--tch-danger, #ef4444)" }}>
                            <div style={{ color: "var(--tch-danger, #ef4444)" }}>
                              <strong>Video marked for removal.</strong> Select a new video below or publish without video.
                            </div>
                            <button
                              type="button"
                              className="tch-btn-secondary"
                              style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                              onClick={() => {
                                setRemoveVideoFlag(false);
                                setExistingVideo({
                                  originalName: editingLecture.videoFile?.originalname || (editingLecture.videoUrl ? editingLecture.videoUrl.split("/").pop() : "Uploaded Video"),
                                  fileSize: editingLecture.videoFile?.size || null,
                                  mimeType: editingLecture.videoFile?.mimetype || "video/mp4",
                                  videoUrl: editingLecture.videoUrl,
                                  videoSource: editingLecture.videoSource || "upload"
                                });
                              }}
                            >
                              Restore Original Video
                            </button>
                          </div>
                        )}

                        {/* Partial Upload Status Banner */}
                        {partialFailureMessage && (
                          <div className="lx-replace-banner" style={{ marginBottom: 16, borderColor: "#f59e0b", background: "rgba(245, 158, 11, 0.1)" }}>
                            <div style={{ color: "#92400e", display: "flex", alignItems: "flex-start", gap: 10 }}>
                              <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                              <div>
                                <strong style={{ display: "block", marginBottom: 2 }}>Partial Upload Notice</strong>
                                <span style={{ fontSize: "0.85rem" }}>{partialFailureMessage}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Cached Video Status Banner */}
                        {cachedCompletedVideo && (
                          <div className="lx-replace-banner" style={{ marginBottom: 16, borderColor: "#10b981", background: "rgba(16, 185, 129, 0.08)" }}>
                            <div style={{ color: "#065f46", display: "flex", alignItems: "center", gap: 10 }}>
                              <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0 }} />
                              <div>
                                <strong style={{ display: "block", marginBottom: 2 }}>Video Uploaded &amp; Cached Ready</strong>
                                <span style={{ fontSize: "0.85rem" }}>
                                  {cachedCompletedVideo.originalname || cachedCompletedVideo.filename} ({formatBytes(cachedCompletedVideo.size)}).
                                  Will not be re-uploaded on submit.
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="tch-btn-secondary"
                              style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                              onClick={() => {
                                setCachedCompletedVideo(null);
                                setCachedVideoFileObj(null);
                              }}
                            >
                              Clear Cache
                            </button>
                          </div>
                        )}

                        {/* Video Source Selector */}
                        <div className="tch-source-selector">
                          <label className="tch-label">
                            {editingLecture ? "Select New Video Source" : "Where is the video?"}
                          </label>
                          <div className="tch-source-options">
                            <button
                              type="button"
                              className={`tch-source-btn ${videoSource === "upload" ? "selected" : ""}`}
                              onClick={() => setVideoSource("upload")}
                            >
                              <UploadCloud size={18} /> Upload a file <small>MP4, WebM, MKV up to 600 MB</small>
                            </button>
                            <button
                              type="button"
                              className={`tch-source-btn ${videoSource === "documents" ? "selected" : ""}`}
                              onClick={() => {
                                setVideoSource("documents");
                                setVideoFile(null);
                                setVideoUrl("");
                              }}
                            >
                              <FileText size={18} /> Documents only <small>Notes, slides &amp; PDFs</small>
                            </button>
                            <button
                              type="button"
                              className={`tch-source-btn ${videoSource === "youtube" ? "selected" : ""}`}
                              onClick={() => setVideoSource("youtube")}
                            >
                              <Film size={18} /> YouTube link <small>Unlisted videos work too</small>
                            </button>
                            <button
                              type="button"
                              className={`tch-source-btn ${videoSource === "external" ? "selected" : ""}`}
                              onClick={() => setVideoSource("external")}
                            >
                              <ExternalLink size={18} /> Stream URL <small>Cloud storage or CDN</small>
                            </button>
                          </div>
                        </div>

                        {videoSource === "documents" && (
                          <div style={{ marginTop: 14, padding: "16px 20px", background: "var(--tch-bg-secondary, #f8fafc)", borderRadius: 10, border: "1px dashed var(--tch-border, #cbd5e1)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <FileText size={24} color="var(--tch-primary, #2563eb)" />
                              <div>
                                <strong style={{ display: "block", color: "var(--tch-text-primary, #1e293b)", fontSize: "0.95rem" }}>Document-Only Academic Resource</strong>
                                <p style={{ margin: "2px 0 0", fontSize: "0.83rem", color: "var(--tch-text-secondary, #64748b)" }}>
                                  No video stream is required. Upload your lecture notes, presentations, problem sets, or reference PDFs in the section below.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {videoSource === "upload" && (
                          <div style={{ marginTop: 14 }}>
                            <label className="tch-label">Video file (Supports chunked resumable upload up to 600 MB)</label>
                            <div
                              className={`tch-dropzone ${dragging ? "dragging" : ""}`}
                              role="button"
                              tabIndex={0}
                              onClick={() => videoInputRef.current?.click()}
                              onKeyDown={(e) => { if (e.key === "Enter") videoInputRef.current?.click(); }}
                              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                              onDragLeave={() => setDragging(false)}
                              onDrop={onDropVideo}
                            >
                              <input
                                ref={videoInputRef}
                                type="file"
                                accept="video/mp4,video/webm,video/x-matroska,video/quicktime,video/avi,video/x-msvideo"
                                style={{ display: "none" }}
                                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                              />
                              <span className="lx-drop-icon"><UploadCloud size={26} /></span>
                              {videoFile ? (
                                <div>
                                  <strong style={{ color: "var(--tch-primary, #2563eb)" }}>{videoFile.name}</strong>
                                  <p>{formatBytes(videoFile.size)} · Click or drop to replace.</p>
                                </div>
                              ) : (
                                <div>
                                  <strong>{dragging ? "Drop it here" : "Drag a video here, or click to browse"}</strong>
                                  <p>MP4, WebM, MKV, MOV, or AVI up to 600 MB (Large files auto-chunked)</p>
                                </div>
                              )}
                            </div>
                            {videoFile && (
                              <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span className="lx-badge success" style={{ fontSize: "0.78rem" }}>
                                  {videoFile.size > 20 * 1024 * 1024 ? "Chunked Upload Ready (10 MB chunks)" : "Standard Direct Upload"}
                                </span>
                                <button
                                  type="button"
                                  className="tch-btn-danger"
                                  style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setVideoFile(null);
                                  }}
                                >
                                  Remove selected file
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {videoSource === "youtube" && (
                          <div style={{ marginTop: 14 }}>
                            <label className="tch-label">YouTube URL</label>
                            <input
                              type="url"
                              className="tch-input"
                              value={videoUrl}
                              onChange={(e) => setVideoUrl(e.target.value)}
                              placeholder="https://www.youtube.com/watch?v=…"
                            />
                            {videoUrl && (
                              <p className={`lx-field-hint ${getYouTubeId(videoUrl) ? "" : "err"}`}>
                                {getYouTubeId(videoUrl) ? "Link looks good." : "That doesn’t look like a YouTube link yet."}
                              </p>
                            )}
                            {getYouTubeId(videoUrl) && (
                              <div
                                className="lx-thumb-preview"
                                style={{ marginTop: 12, backgroundImage: `url(https://img.youtube.com/vi/${getYouTubeId(videoUrl)}/hqdefault.jpg)` }}
                              />
                            )}
                          </div>
                        )}

                        {videoSource === "external" && (
                          <div style={{ marginTop: 14 }}>
                            <label className="tch-label">Stream URL</label>
                            <input
                              type="url"
                              className="tch-input"
                              value={videoUrl}
                              onChange={(e) => setVideoUrl(e.target.value)}
                              placeholder="https://example.com/lecture.mp4"
                            />
                          </div>
                        )}
                      </>
                    )}

                    {/* Custom Thumbnail Section */}
                    <div className="teacher-form-row" style={{ marginTop: 18 }}>
                      <div className="lx-span-2">
                        <label className="tch-label">Custom thumbnail (optional)</label>
                        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                          <input
                            ref={thumbInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            style={{ display: "none" }}
                            onChange={(e) => {
                              setThumbnailFile(e.target.files?.[0] || null);
                              setRemoveThumbFlag(false);
                            }}
                          />
                          {(thumbPreview || (editingLecture && editingLecture.thumbnailUrl && !removeThumbFlag)) && (
                            <div
                              className="lx-thumb-preview"
                              style={{
                                backgroundImage: thumbPreview
                                  ? `url(${thumbPreview})`
                                  : `url(${editingLecture.thumbnailUrl})`
                              }}
                            />
                          )}
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button type="button" className="tch-btn-secondary" onClick={() => thumbInputRef.current?.click()}>
                              <ImageIcon size={15} /> <span>{thumbnailFile ? "Change image" : "Choose image"}</span>
                            </button>
                            {thumbnailFile && (
                              <button type="button" className="tch-btn-danger" onClick={() => setThumbnailFile(null)}>
                                Cancel
                              </button>
                            )}
                            {editingLecture && editingLecture.thumbnailUrl && !thumbnailFile && !removeThumbFlag && (
                              <button
                                type="button"
                                className="tch-btn-danger"
                                onClick={() => setRemoveThumbFlag(true)}
                              >
                                Remove Thumbnail
                              </button>
                            )}
                            {removeThumbFlag && (
                              <span style={{ fontSize: "0.8rem", color: "var(--tch-danger, #ef4444)" }}>
                                Thumbnail marked for removal
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Existing Resources in Edit Mode */}
                    {editingLecture && existingResources.length > 0 && (
                      <div style={{ marginTop: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <label className="tch-label" style={{ margin: 0 }}>
                            Existing Lecture Attachments ({existingResources.length})
                          </label>
                          <span style={{ fontSize: "0.74rem", color: "var(--tch-text-muted, #64748b)" }}>
                            Preserved on server until explicitly deleted
                          </span>
                        </div>
                        <ul className="tch-file-list" style={{ marginTop: 6, gap: 10 }}>
                          {existingResources.map((resItem) => {
                            const cat = getFileCategoryInfo(resItem.originalname || resItem.title);
                            const CatIcon = cat.icon;
                            return (
                              <li key={resItem._id || resItem.id} className="tch-attachment-item-card">
                                <div className="tch-attachment-card-left">
                                  <div className="tch-attachment-type-icon" style={{ background: `${cat.color}18`, color: cat.color }}>
                                    <CatIcon size={20} />
                                  </div>
                                  <div className="tch-attachment-details">
                                    <div className="tch-attachment-name-row">
                                      <span className="tch-attachment-name-text" title={resItem.title || resItem.originalname}>
                                        {resItem.title || resItem.originalname || "Attachment"}
                                      </span>
                                      <span className={`tch-attachment-badge ${cat.badgeClass}`}>
                                        {cat.label}
                                      </span>
                                    </div>
                                    <div className="tch-attachment-meta-row">
                                      <span>{resItem.originalname || resItem.title}</span>
                                      {resItem.filesize ? <span>· {formatBytes(resItem.filesize)}</span> : null}
                                      <span style={{ color: "var(--lx-ok, #059669)", fontWeight: 600 }}>· Saved</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="tch-attachment-card-actions">
                                  {cat.canPreview && (
                                    <button
                                      type="button"
                                      className="tch-action-icon-btn"
                                      title="Preview this document"
                                      aria-label={`Preview ${resItem.title || resItem.originalname}`}
                                      onClick={() => handleOpenDocPreview(resItem)}
                                    >
                                      <Eye size={14} />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="tch-action-icon-btn"
                                    title="Download this attachment"
                                    aria-label={`Download ${resItem.title || resItem.originalname}`}
                                    onClick={() => authApi.downloadLectureFile(authApi.getLectureDownloadUrl(lid(editingLecture), resItem._id), resItem.originalname || resItem.title)}
                                  >
                                    <Download size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="tch-action-icon-btn danger"
                                    title="Delete this attachment permanently"
                                    aria-label={`Delete ${resItem.title || resItem.originalname}`}
                                    onClick={() => handleRemoveExistingResource(resItem)}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {/* Notes, Slides & Attachments Upload Section */}
                    <div style={{ marginTop: 22 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                        <label className="tch-label" style={{ margin: 0 }}>
                          {editingLecture ? "Add More Documents & Files" : "Notes, Slides & Attachments"}
                        </label>
                        <span style={{ fontSize: "0.75rem", color: "var(--tch-text-muted, #64748b)" }}>
                          PDF, Word, PPT, Excel, Images, Code, ZIP (up to 30 files total)
                        </span>
                      </div>

                      {/* Accessible Visually Hidden File Input */}
                      <input
                        id="tch-lecture-doc-file-input"
                        ref={resourceInputRef}
                        type="file"
                        multiple
                        className="tch-visually-hidden-input"
                        accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.svg,.zip,.rar,.7z,.tar,.gz,.txt,.py,.java,.c,.cpp,.js,.ts,.html,.css"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleAddResourceFiles(e.target.files);
                          }
                          e.target.value = "";
                        }}
                      />

                      {/* Dedicated Drag-and-Drop Area */}
                      <div
                        className={`tch-doc-dropzone ${isDraggingDocs ? "is-dragging" : ""}`}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingDocs(true); }}
                        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingDocs(true); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingDocs(false); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDraggingDocs(false);
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            handleAddResourceFiles(e.dataTransfer.files);
                          }
                        }}
                        onClick={() => resourceInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            resourceInputRef.current?.click();
                          }
                        }}
                      >
                        <div className="tch-doc-drop-icon">
                          <Paperclip size={26} />
                        </div>
                        <div className="tch-doc-drop-text">
                          <strong>
                            Drag &amp; drop study files here, or <span className="tch-link-text">browse from device</span>
                          </strong>
                          <p>
                            Supports PDF, PowerPoint, Word, Excel, Images, Source Code, and ZIP archives up to 50 MB each
                          </p>
                        </div>
                        <label
                          htmlFor="tch-lecture-doc-file-input"
                          className="tch-btn-secondary tch-doc-browse-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <Plus size={15} /> Select files to attach ({resourceFiles.length})
                        </label>
                      </div>

                      {/* Attachment Summary and Action Bar */}
                      <div className="tch-attachment-bar">
                        <div className="tch-attachment-summary">
                          <strong>
                            {resourceFiles.length + existingResources.length} of 30 files attached
                          </strong>
                          {resourceFiles.length > 0 && (
                            <span style={{ color: "var(--tch-text-muted, #64748b)" }}>
                              · {resourceFiles.length} newly staged ({formatBytes(resourceFiles.reduce((acc, f) => acc + (f.size || 0), 0))})
                            </span>
                          )}
                          {30 - (resourceFiles.length + existingResources.length) > 0 ? (
                            <span style={{ fontSize: "0.72rem", color: "var(--lx-ink-3, #94a3b8)" }}>
                              ({30 - (resourceFiles.length + existingResources.length)} slots left)
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.72rem", color: "var(--lx-danger, #dc2626)", fontWeight: 700 }}>
                              (Limit reached)
                            </span>
                          )}
                        </div>
                        <div className="tch-attachment-btns">
                          <label
                            htmlFor="tch-lecture-doc-file-input"
                            className="tch-btn-secondary"
                            style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", fontSize: "0.8rem" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Plus size={14} /> Add more files
                          </label>
                          {resourceFiles.length > 0 && (
                            <button
                              type="button"
                              className="tch-btn-ghost-danger"
                              onClick={handleClearAllNewResources}
                              title="Clear all newly selected attachments"
                            >
                              Clear newly added ({resourceFiles.length})
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Newly Staged File List */}
                      {resourceFiles.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--lx-ink-2, #475569)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Files to be uploaded ({resourceFiles.length})
                          </span>
                          <ul className="tch-file-list" style={{ marginTop: 6, gap: 10 }}>
                            {resourceFiles.map((f, i) => {
                              const cat = getFileCategoryInfo(f.name);
                              const CatIcon = cat.icon;
                              return (
                                <li key={`${f.name}-${f.size}-${i}`} className="tch-attachment-item-card">
                                  <div className="tch-attachment-card-left">
                                    <div className="tch-attachment-type-icon" style={{ background: `${cat.color}18`, color: cat.color }}>
                                      <CatIcon size={20} />
                                    </div>
                                    <div className="tch-attachment-details">
                                      <div className="tch-attachment-name-row">
                                        <span className="tch-attachment-name-text" title={f.name}>
                                          {f.name}
                                        </span>
                                        <span className={`tch-attachment-badge ${cat.badgeClass}`}>
                                          {cat.label}
                                        </span>
                                      </div>
                                      <div className="tch-attachment-meta-row">
                                        <span>{formatBytes(f.size)}</span>
                                        <span style={{ color: "var(--tch-primary, #2563eb)", fontWeight: 600 }}>· Ready to upload</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="tch-attachment-card-actions">
                                    {cat.canPreview && (
                                      <button
                                        type="button"
                                        className="tch-action-icon-btn"
                                        title="Preview file"
                                        aria-label={`Preview ${f.name}`}
                                        onClick={() => handleOpenDocPreview(f)}
                                      >
                                        <Eye size={14} />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      className="tch-action-icon-btn danger"
                                      title="Remove from upload list"
                                      aria-label={`Remove ${f.name}`}
                                      onClick={() => handleRemoveResourceFile(i)}
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ---------- STEP 3 ---------- */}
                {step === 3 && (
                  <div className="lx-step-panel">
                    <div className="lx-review">
                      <div
                        className="lx-review-thumb"
                        style={{
                          backgroundImage: thumbPreview
                            ? `url(${thumbPreview})`
                            : getYouTubeId(videoUrl)
                            ? `url(https://img.youtube.com/vi/${getYouTubeId(videoUrl)}/hqdefault.jpg)`
                            : editingLecture && getThumb(editingLecture) ? `url(${getThumb(editingLecture)})` : undefined
                        }}
                      />
                      <dl>
                        <dt>Title</dt><dd>{title}</dd>
                        <dt>Subject</dt><dd>{subject}{subjectCode ? ` (${subjectCode})` : ""}</dd>
                        <dt>Topic</dt><dd>{topic}{unitNumber ? ` · Unit ${unitNumber}` : ""}</dd>
                        <dt>Audience</dt><dd>{branch}, {semester}</dd>
                        <dt>Type</dt><dd>{lectureType} · {formatMinutes(Number(durationMinutes) || 45)}</dd>
                        <dt>Video</dt>
                        <dd>
                          {videoSource === "documents" ? (
                            <span style={{ color: "var(--tch-primary, #2563eb)", fontWeight: 600 }}>Documents only (No video stream)</span>
                          ) : videoFile ? (
                            <span style={{ color: "var(--tch-primary, #2563eb)", fontWeight: 600 }}>
                              {videoFile.name} ({formatBytes(videoFile.size)})
                              {videoFile.size > 20 * 1024 * 1024 ? " · Chunked Upload" : ""}
                              {cachedCompletedVideo ? " · Cached Ready" : ""}
                            </span>
                          ) : editingLecture && existingVideo && !removeVideoFlag ? (
                            <span>{existingVideo.originalName} {existingVideo.fileSize ? `(${formatBytes(existingVideo.fileSize)})` : ""}</span>
                          ) : removeVideoFlag ? (
                            <span style={{ color: "var(--tch-danger, #ef4444)" }}>Video Removed</span>
                          ) : videoUrl ? (
                            <span>{videoUrl}</span>
                          ) : (
                            <span style={{ color: "var(--tch-text-muted)" }}>None (Document-only)</span>
                          )}
                        </dd>
                        <dt>Files</dt>
                        <dd>
                          {editingLecture ? (
                            <span>
                              {existingResources.length} kept
                              {removedResourceIds.length > 0 ? `, ${removedResourceIds.length} removed` : ""}
                              {resourceFiles.length > 0 ? `, ${resourceFiles.length} new added` : ""}
                            </span>
                          ) : (
                            resourceFiles.length ? `${resourceFiles.length} attached` : "None"
                          )}
                        </dd>
                        <dt>Visibility</dt><dd style={{ textTransform: "capitalize" }}>{status}</dd>
                      </dl>
                    </div>

                    {/* Step 3 Attachment Review Chips */}
                    {(resourceFiles.length > 0 || (editingLecture && existingResources.length > 0)) && (
                      <div style={{ marginTop: 14, padding: "12px 14px", background: "var(--lx-surface, #ffffff)", border: "1px solid var(--lx-line, #e2e8f0)", borderRadius: 12 }}>
                        <strong style={{ fontSize: "0.82rem", color: "var(--lx-ink, #0f172a)", display: "block", marginBottom: 8 }}>
                          Attached Study Files ({resourceFiles.length + (editingLecture ? existingResources.length : 0)})
                        </strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {editingLecture && existingResources.map((r) => {
                            const cat = getFileCategoryInfo(r.originalname || r.title);
                            const CatIcon = cat.icon;
                            return (
                              <span key={r._id || r.id} className="lx-badge neutral" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.74rem" }}>
                                <CatIcon size={12} color={cat.color} /> {r.title || r.originalname}
                              </span>
                            );
                          })}
                          {resourceFiles.map((f, idx) => {
                            const cat = getFileCategoryInfo(f.name);
                            const CatIcon = cat.icon;
                            return (
                              <span key={`${f.name}-${idx}`} className="lx-badge primary" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.74rem" }}>
                                <CatIcon size={12} color={cat.color} /> {f.name} ({formatBytes(f.size)})
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {status === "published" && !editingLecture && (
                      <p className="lx-field-hint" style={{ marginTop: 12 }}>
                        Students in {branch} · {semester} will see this lecture as soon as you publish.
                      </p>
                    )}
                  </div>
                )}

                {stepError && (
                  <p className="lx-field-hint err" role="alert" style={{ marginTop: 14, display: "flex", gap: 6, alignItems: "center" }}>
                    <AlertCircle size={14} /> {stepError}
                  </p>
                )}

                {/* Real-time Progress & Stage Tracker */}
                {submitting && (
                  <div className="lx-stage-tracker" style={{ marginTop: 16 }}>
                    <div className="lx-stage-header">
                      <div className="lx-stage-title">
                        <Loader2 size={16} className="spin" />
                        <span>{uploadStageText || (editingLecture ? "Updating lecture..." : "Publishing lecture...")}</span>
                      </div>
                      <span className="lx-stage-pct">{uploadProgressPct}%</span>
                    </div>

                    <div className="lx-progress-bar-wrap">
                      <div
                        className="lx-progress-bar-fill"
                        style={{ width: `${Math.max(5, uploadProgressPct)}%` }}
                      />
                    </div>

                    {uploadStats && (
                      <div className="lx-stage-stats">
                        {uploadStats.loaded && uploadStats.total ? (
                          <span>Transferred: {formatBytes(uploadStats.loaded)} / {formatBytes(uploadStats.total)}</span>
                        ) : null}
                        {uploadStats.chunk && uploadStats.totalChunks ? (
                          <span>Chunk {uploadStats.chunk} of {uploadStats.totalChunks}</span>
                        ) : null}
                        <span
                          className="lx-stage-badge"
                          style={{
                            background: uploadStage === "uploading_video" ? "rgba(37,99,235,0.12)" :
                              uploadStage === "uploading_documents" ? "rgba(16,185,129,0.12)" : "rgba(147,51,234,0.12)",
                            color: uploadStage === "uploading_video" ? "#1d4ed8" :
                              uploadStage === "uploading_documents" ? "#047857" : "#7e22ce"
                          }}
                        >
                          {uploadStage === "uploading_video" ? "Phase 1: Video Upload" :
                           uploadStage === "uploading_documents" ? "Phase 2: Documents Upload" :
                           uploadStage === "publishing" ? "Phase 3: Database Registration" :
                           uploadStats.stage || uploadStage}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="teacher-modal-footer">
                {step > 1 ? (
                  <button type="button" className="tch-btn-secondary" onClick={() => { setStepError(""); setStep((s) => s - 1); }} disabled={submitting}>
                    <ChevronLeft size={16} /> Back
                  </button>
                ) : (
                  <button type="button" className="tch-btn-secondary" onClick={closeUploadModal} disabled={submitting}>Cancel</button>
                )}

                {step < 3 ? (
                  <button type="submit" className="tch-btn-primary">
                    Next <ChevronRight size={16} />
                  </button>
                ) : (
                  <button type="submit" className="tch-btn-primary" disabled={submitting}>
                    {submitting ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                    <span>{submitting ? "Publishing…" : editingLecture ? "Save changes" : status === "draft" ? "Save as draft" : "Publish lecture"}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ======================= PLAYER ======================= */}
      {activeVideo && (
        <LecturePlayerModal lecture={activeVideo} onClose={() => setActiveVideo(null)} onCopyLink={copyLectureLink} />
      )}

      {/* ======================= PER-LECTURE ANALYTICS ======================= */}
      {analyticsLecture && (
        <LectureWatchAnalyticsModal lecture={analyticsLecture} onClose={() => setAnalyticsLecture(null)} showToast={showToast} />
      )}

      {/* ======================= ATTACHMENT PREVIEW LIGHTBOX ======================= */}
      {previewDoc && createPortal(
        <div className="tch-doc-preview-backdrop" onClick={handleCloseDocPreview} role="dialog" aria-modal="true" aria-label="Attachment Preview">
          <div className="tch-doc-preview-shell" onClick={(e) => e.stopPropagation()}>
            <div className="tch-doc-preview-header">
              <div className="tch-doc-preview-title">
                <FileText size={18} color="var(--lx-primary, #2563eb)" />
                <strong>{previewDoc.title || previewDoc.originalname}</strong>
                {previewDoc.size ? (
                  <span style={{ fontSize: "0.74rem", color: "var(--lx-ink-3, #94a3b8)" }}>
                    ({formatBytes(previewDoc.size)})
                  </span>
                ) : null}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {!previewDoc.isBlob && previewDoc.url && (
                  <button
                    type="button"
                    className="tch-btn-secondary"
                    style={{ padding: "5px 12px", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: 5 }}
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = previewDoc.url;
                      a.download = previewDoc.originalname || "attachment";
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                    }}
                  >
                    <Download size={13} /> Download
                  </button>
                )}
                <button
                  type="button"
                  className="tch-action-icon-btn"
                  onClick={handleCloseDocPreview}
                  aria-label="Close preview"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="tch-doc-preview-body">
              {previewDoc.mimetype?.startsWith("image/") || /\.(png|jpe?g|webp|svg)$/i.test(previewDoc.url || previewDoc.title || "") ? (
                <img src={previewDoc.url} alt={previewDoc.title} />
              ) : (
                <iframe
                  src={previewDoc.url}
                  title={previewDoc.title}
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}