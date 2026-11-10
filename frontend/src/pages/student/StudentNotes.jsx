import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen, FileText, Download, Search, Clock, Sparkles, Layers, GraduationCap,
  Calendar, X, CheckCircle2, Archive, Eye, RefreshCw, ExternalLink, Check,
  FolderOpen, UserCheck, ShieldCheck, Award, Copy, LayoutGrid, List, ArrowUpDown,
  FileSpreadsheet, FileCheck, Globe, Paperclip, Share2, Star, SlidersHorizontal,
  ChevronLeft, ChevronRight, History, Image as ImageIcon, Cloud, FileDown,
  MoreVertical, CheckCheck, Info, Tag, ArrowUpRight, ChevronDown
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./StudentTheme.css";
import "./StudentNotes.css";

/* ==========================================================================
   CONSTANTS & CONFIGURATION
   ========================================================================== */
const PAGE_SIZE = 9;
const RING_CIRC = 2 * Math.PI * 26; // Compact modern progress ring
const LS_SAVED = "std_notes_saved_v1";
const LS_RECENT = "std_notes_recent_v1";
const LS_VIEW = "std_notes_view_v1";

const SUBJECT_ACCENTS = [
  "#4f46e5", // Indigo
  "#0d9488", // Teal
  "#d97706", // Amber
  "#db2777", // Pink
  "#2563eb", // Blue
  "#7c3aed", // Violet
  "#059669", // Emerald
  "#ea580c"  // Orange
];

const QUICK_FORMATS = [
  { id: "all", label: "All Formats", icon: Layers },
  { id: "pdf", label: "PDF Documents", icon: FileText },
  { id: "office", label: "Slides & Docs", icon: FileSpreadsheet },
  { id: "archive", label: "Archives", icon: Archive },
  { id: "external", label: "Cloud Links", icon: Cloud }
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest First" },
  { id: "oldest", label: "Oldest First" },
  { id: "alphabetical", label: "Title (A–Z)" },
  { id: "most_downloaded", label: "Most Downloaded" }
];

/* ==========================================================================
   HELPER UTILITIES
   ========================================================================== */
const nid = (n) => n?._id || n?.id;

const readLS = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeLS = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
};

function accentFor(subject) {
  if (!subject) return SUBJECT_ACCENTS[0];
  let h = 0;
  for (let i = 0; i < subject.length; i += 1) h = (h * 31 + subject.charCodeAt(i)) >>> 0;
  return SUBJECT_ACCENTS[h % SUBJECT_ACCENTS.length];
}

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function isRecentlyUploaded(isoStr, maxDays = 3) {
  if (!isoStr) return false;
  return Date.now() - new Date(isoStr).getTime() < maxDays * 86400000;
}

function getNoteFiles(note) {
  if (!note) return [];
  if (note.files && note.files.length > 0) return note.files;
  return note.file ? [note.file] : [];
}

function getFileFormatMeta(ext) {
  const clean = (ext || "pdf").toLowerCase().replace(/^\./, "");
  switch (clean) {
    case "pdf":
      return { label: "PDF Document", tag: "PDF", color: "#dc2626", bg: "rgba(220,38,38,0.1)", icon: FileText };
    case "pptx":
    case "ppt":
      return { label: "PowerPoint Deck", tag: "PPTX", color: "#ea580c", bg: "rgba(234,88,12,0.1)", icon: Layers };
    case "docx":
    case "doc":
      return { label: "Word Document", tag: "DOCX", color: "#2563eb", bg: "rgba(37,99,235,0.1)", icon: FileText };
    case "xlsx":
    case "xls":
      return { label: "Excel Sheet", tag: "XLSX", color: "#16a34a", bg: "rgba(22,163,74,0.1)", icon: FileSpreadsheet };
    case "zip":
    case "rar":
    case "7z":
      return { label: "Archive Bundle", tag: "ZIP", color: "#d97706", bg: "rgba(217,119,6,0.1)", icon: Archive };
    case "png":
    case "jpg":
    case "jpeg":
    case "webp":
      return { label: "Image Asset", tag: "IMAGE", color: "#9333ea", bg: "rgba(147,51,234,0.1)", icon: ImageIcon };
    default:
      return { label: "Course Document", tag: clean.toUpperCase(), color: "#4f46e5", bg: "rgba(79,70,229,0.1)", icon: FileText };
  }
}

function detectUrlProvider(urlString) {
  const base = { provider: "website", label: "Web Link", color: "#6366f1", bg: "rgba(99,102,241,0.1)" };
  if (!urlString || typeof urlString !== "string") return base;
  const l = urlString.toLowerCase();
  if (l.includes("drive.google.com") || l.includes("docs.google.com")) {
    return { provider: "google-drive", label: "Google Drive", color: "#0f9d58", bg: "rgba(15,157,88,0.12)" };
  }
  if (l.includes("onedrive.live.com") || l.includes("sharepoint.com") || l.includes("1drv.ms")) {
    return { provider: "onedrive", label: "OneDrive", color: "#0078d4", bg: "rgba(0,120,212,0.12)" };
  }
  if (l.includes("dropbox.com")) {
    return { provider: "dropbox", label: "Dropbox", color: "#0061ff", bg: "rgba(0,97,255,0.12)" };
  }
  if (l.includes("youtube.com") || l.includes("youtu.be")) {
    return { provider: "youtube", label: "YouTube", color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
  }
  if (l.includes("github.com") || l.includes("gitlab.com")) {
    return { provider: "github", label: "GitHub Repo", color: "#24292e", bg: "rgba(100,116,139,0.15)" };
  }
  return base;
}

function getUploaderRoleMeta(role) {
  switch ((role || "teacher").toLowerCase()) {
    case "hod":
      return { label: "Head of Dept", icon: Award, color: "#7c3aed", bg: "rgba(124,58,237,0.1)", border: "rgba(124,58,237,0.25)" };
    case "coordinator":
      return { label: "Academic Coord", icon: ShieldCheck, color: "#0d9488", bg: "rgba(13,148,136,0.1)", border: "rgba(13,148,136,0.25)" };
    default:
      return { label: "Faculty", icon: UserCheck, color: "#4f46e5", bg: "rgba(79,70,229,0.1)", border: "rgba(79,70,229,0.25)" };
  }
}

function buildPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = Array.from(pages).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function useCountUp(target, duration = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const end = Number(target) || 0;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || end === 0) {
      setVal(end);
      return undefined;
    }
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      setVal(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function AnimatedCounter({ value = 0, suffix = "" }) {
  const v = useCountUp(value);
  return <span className="std-counter-num">{Math.round(v).toLocaleString("en-IN")}{suffix}</span>;
}

function CompactProgressRing({ percent }) {
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  const offset = RING_CIRC * (1 - pct / 100);
  return (
    <div className="std-compact-ring" aria-label={`${pct}% library downloaded`}>
      <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="snProgressGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <circle className="ring-bg" cx="32" cy="32" r="26" />
        <circle
          className="ring-fg"
          cx="32"
          cy="32"
          r="26"
          style={{ strokeDasharray: RING_CIRC, strokeDashoffset: offset }}
        />
      </svg>
      <div className="ring-center">
        <span className="ring-val">{pct}%</span>
      </div>
    </div>
  );
}

/* ==========================================================================
   MAIN COMPONENT: StudentNotes
   ========================================================================== */
export default function StudentNotes({ currentUser, showToast }) {
  /* ---------- Data State ---------- */
  const [notes, setNotes] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  /* ---------- Filter & View State ---------- */
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedFileType, setSelectedFileType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState(() => readLS(LS_VIEW, "grid"));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  /* ---------- User Preferences & Local Cache ---------- */
  const [savedIds, setSavedIds] = useState(() => new Set(readLS(LS_SAVED, [])));
  const [recentIds, setRecentIds] = useState(() => readLS(LS_RECENT, []));
  const [openCardMenuId, setOpenCardMenuId] = useState(null);

  /* ---------- Modal State ---------- */
  const [previewNote, setPreviewNote] = useState(null);
  const [activeModalFileIndex, setActiveModalFileIndex] = useState(0);
  const [activeModalTab, setActiveModalTab] = useState("files");
  const [imgZoom, setImgZoom] = useState(false);
  const [copiedChecksum, setCopiedChecksum] = useState(false);

  /* ---------- Download State ---------- */
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadProgressMap, setDownloadProgressMap] = useState({});

  const searchInputRef = useRef(null);
  const cardMenuRef = useRef(null);
  const deepLinkId = useRef(new URLSearchParams(window.location.search).get("note"));

  useEffect(() => { writeLS(LS_VIEW, viewMode); }, [viewMode]);
  useEffect(() => { writeLS(LS_SAVED, Array.from(savedIds)); }, [savedIds]);
  useEffect(() => { writeLS(LS_RECENT, recentIds); }, [recentIds]);

  // Click outside to close card more-options menu
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (cardMenuRef.current && !cardMenuRef.current.contains(e.target)) {
        setOpenCardMenuId(null);
      }
    };
    if (openCardMenuId) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }
  }, [openCardMenuId]);

  /* ---------- Fetch Statistics ---------- */
  useEffect(() => {
    let ignore = false;
    setLoadingStats(true);
    authApi
      .getStudentNotesStatistics()
      .then((res) => {
        if (!ignore && res?.statistics) setStatistics(res.statistics);
      })
      .catch((err) => console.warn("Could not load notes statistics:", err.message))
      .finally(() => {
        if (!ignore) setLoadingStats(false);
      });
    return () => { ignore = true; };
  }, [refreshKey]);

  /* ---------- Fetch Notes ---------- */
  const fetchNotes = useCallback(() => {
    setLoading(true);
    const params = {
      tab: activeTab === "saved" || activeTab === "recent" ? "all" : activeTab,
      sortBy
    };
    if (selectedSubject !== "all") params.subject = selectedSubject;
    if (selectedCategory !== "all") params.category = selectedCategory;

    authApi
      .getNotes(params)
      .then((res) => {
        setNotes(res?.notes || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading notes:", err);
        showToast?.(err.message || "Could not load study notes.", true);
        setLoading(false);
      });
  }, [activeTab, selectedSubject, selectedCategory, sortBy, showToast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, selectedSubject, selectedCategory, selectedFileType, sortBy, searchQuery]);

  /* ---------- Derived Lists & Filtering ---------- */
  const availableSubjects = useMemo(() => {
    if (statistics?.subjects?.length > 0) return statistics.subjects.map((s) => s.name);
    const set = new Set();
    notes.forEach((n) => n.subject && set.add(n.subject));
    return Array.from(set).sort();
  }, [statistics, notes]);

  const availableCategories = useMemo(() => {
    const set = new Set();
    notes.forEach((n) => n.category && set.add(n.category));
    return Array.from(set).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return notes.filter((note) => {
      // Tab-based filtering
      if (activeTab === "saved" && !savedIds.has(nid(note))) return false;
      if (activeTab === "recent" && !isRecentlyUploaded(note.createdAt, 7)) return false;

      // Dropdown filters
      if (selectedSubject !== "all" && note.subject !== selectedSubject) return false;
      if (selectedCategory !== "all" && note.category !== selectedCategory) return false;

      // File format / resource type filter
      if (selectedFileType !== "all") {
        const hasExt = (note.externalResources?.length > 0) || note.uploadMode === "url";
        if (selectedFileType === "external") {
          if (!hasExt) return false;
        } else {
          const exts = getNoteFiles(note).map((f) => (f.fileExtension || "").toLowerCase());
          if (selectedFileType === "pdf" && !exts.includes("pdf")) return false;
          if (selectedFileType === "office" && !exts.some((e) => ["pptx", "ppt", "docx", "doc", "xlsx", "xls"].includes(e))) return false;
          if (selectedFileType === "archive" && !exts.some((e) => ["zip", "rar", "7z"].includes(e))) return false;
        }
      }

      // Keyword Search
      if (q) {
        const searchPool = [
          note.title,
          note.description,
          note.subject,
          note.subjectCode,
          note.unit,
          note.chapter,
          note.category,
          note.uploaderName,
          note.uploaderRole,
          ...(note.externalResources || []).flatMap((r) => [r.title, r.url])
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchPool.includes(q)) return false;
      }
      return true;
    });
  }, [notes, activeTab, savedIds, selectedSubject, selectedCategory, selectedFileType, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / PAGE_SIZE));
  const paginatedNotes = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredNotes.slice(start, start + PAGE_SIZE);
  }, [filteredNotes, page]);

  const activeFilters = useMemo(() => {
    const list = [];
    if (searchQuery.trim()) list.push({ key: "q", label: `Search: "${searchQuery.trim()}"`, clear: () => setSearchQuery("") });
    if (selectedSubject !== "all") list.push({ key: "s", label: `Subject: ${selectedSubject}`, clear: () => setSelectedSubject("all") });
    if (selectedCategory !== "all") list.push({ key: "c", label: `Category: ${selectedCategory}`, clear: () => setSelectedCategory("all") });
    if (selectedFileType !== "all") {
      const f = QUICK_FORMATS.find((x) => x.id === selectedFileType);
      list.push({ key: "f", label: `Format: ${f?.label || selectedFileType}`, clear: () => setSelectedFileType("all") });
    }
    return list;
  }, [searchQuery, selectedSubject, selectedCategory, selectedFileType]);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedSubject("all");
    setSelectedCategory("all");
    setSelectedFileType("all");
    setSortBy("newest");
    setPage(1);
  };

  const recentNotes = useMemo(
    () => recentIds.map((id) => notes.find((n) => nid(n) === id)).filter(Boolean).slice(0, 8),
    [recentIds, notes]
  );

  /* ---------- Statistics Calculation ---------- */
  const totalCount = statistics?.totalNotes ?? notes.length;
  const recentCount = statistics?.recentUploads ?? notes.filter((n) => isRecentlyUploaded(n.createdAt, 7)).length;
  const importantCount = statistics?.importantMaterials ?? notes.filter((n) => n.isImportant).length;
  const downloadedCount = statistics?.downloadedMaterials ?? notes.filter((n) => n.isDownloadedByMe).length;
  const downloadedPct = totalCount > 0 ? Math.round((downloadedCount / totalCount) * 100) : 0;
  const remainingCount = Math.max(0, totalCount - downloadedCount);

  /* ---------- Save / Bookmark Toggle ---------- */
  const toggleSaved = (note) => {
    const id = nid(note);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast?.("Removed from saved list.");
      } else {
        next.add(id);
        showToast?.("Saved to your personal study list.");
      }
      return next;
    });
  };

  /* ---------- Preview Handlers ---------- */
  const handleOpenPreview = useCallback((note) => {
    setPreviewNote(note);
    setActiveModalFileIndex(0);
    setImgZoom(false);
    const hasFiles = getNoteFiles(note).length > 0;
    const hasUrls = (note.externalResources || []).length > 0;
    setActiveModalTab(!hasFiles && hasUrls ? "urls" : "files");
    const id = nid(note);
    setRecentIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 12));
    setOpenCardMenuId(null);
  }, []);

  const closePreview = useCallback(() => {
    setPreviewNote(null);
  }, []);

  const previewIndex = previewNote ? filteredNotes.findIndex((n) => nid(n) === nid(previewNote)) : -1;
  const goRelative = useCallback((delta) => {
    if (previewIndex < 0) return;
    const next = filteredNotes[previewIndex + delta];
    if (next) handleOpenPreview(next);
  }, [previewIndex, filteredNotes, handleOpenPreview]);

  /* Deep Link Hook (?note=ID) */
  useEffect(() => {
    if (!deepLinkId.current || notes.length === 0) return;
    const target = notes.find((n) => nid(n) === deepLinkId.current);
    deepLinkId.current = null;
    if (target) handleOpenPreview(target);
  }, [notes, handleOpenPreview]);

  /* Keyboard Shortcuts */
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const typing = ["input", "textarea", "select"].includes(tag);
      if (e.key === "Escape" && previewNote) {
        closePreview();
        return;
      }
      if (previewNote && !typing) {
        if (e.key === "ArrowRight") goRelative(1);
        if (e.key === "ArrowLeft") goRelative(-1);
        return;
      }
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewNote, closePreview, goRelative]);

  /* Body Scroll Lock on Modal */
  useEffect(() => {
    if (!previewNote) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [previewNote]);

  /* ---------- Download Handlers ---------- */
  const handleDownloadNote = async (note, specificFile = null, { silent = false } = {}) => {
    const id = nid(note);
    const files = getNoteFiles(note);
    const target = specificFile || files[0];
    if (!target) {
      showToast?.("This note does not have an attached file to download.", true);
      return false;
    }
    const key = `${id}_${target._id || "0"}`;
    if (downloadingId === key) return false;

    setDownloadingId(key);
    setDownloadProgressMap((p) => ({ ...p, [key]: 10 }));

    try {
      const name = target.originalFileName ||
        `${(note.title || "study_note").replace(/[^a-zA-Z0-9_-]/g, "_")}.${target.fileExtension || "pdf"}`;

      await authApi.downloadNoteFile(
        id,
        name,
        (pct) => {
          setDownloadProgressMap((p) => ({ ...p, [key]: Math.max(15, pct) }));
        },
        target._id
      );

      const firstTime = !note.isDownloadedByMe;
      setNotes((prev) =>
        prev.map((n) =>
          nid(n) === id
            ? { ...n, isDownloadedByMe: true, downloadCount: (n.downloadCount || 0) + 1 }
            : n
        )
      );
      setPreviewNote((p) =>
        p && nid(p) === id
          ? { ...p, isDownloadedByMe: true, downloadCount: (p.downloadCount || 0) + 1 }
          : p
      );
      if (firstTime) {
        setStatistics((p) => (p ? { ...p, downloadedMaterials: (p.downloadedMaterials || 0) + 1 } : p));
      }
      if (!silent) showToast?.(`Downloaded "${name}" successfully.`);
      return true;
    } catch (err) {
      console.error("Download failed:", err);
      showToast?.(err.message || "Download could not be completed. Please try again.", true);
      return false;
    } finally {
      setDownloadingId(null);
      setDownloadProgressMap((p) => {
        const next = { ...p };
        delete next[key];
        return next;
      });
    }
  };

  const handleDownloadAll = async (note) => {
    const files = getNoteFiles(note);
    let successCount = 0;
    for (const f of files) {
      // Sequential download with progress
      // eslint-disable-next-line no-await-in-loop
      if (await handleDownloadNote(note, f, { silent: true })) {
        successCount += 1;
      }
    }
    if (successCount) {
      showToast?.(`Downloaded ${successCount} of ${files.length} attached files.`);
    }
  };

  const handleShare = async (note) => {
    const url = `${window.location.origin}${window.location.pathname}?note=${nid(note)}`;
    const ok = await copyText(url);
    showToast?.(ok ? "Direct link copied! Classmates in your semester can open it." : "Failed to copy link.", !ok);
    setOpenCardMenuId(null);
  };

  const handleCopyChecksum = async (hash) => {
    if (!hash) return;
    const ok = await copyText(hash);
    if (!ok) {
      showToast?.("Failed to copy checksum.", true);
      return;
    }
    setCopiedChecksum(true);
    showToast?.("SHA-256 Checksum copied to clipboard.");
    setTimeout(() => setCopiedChecksum(false), 2200);
  };

  /* ---------- Tab Definitions ---------- */
  const tabs = [
    { id: "all", label: "All Notes", icon: FolderOpen, count: totalCount, badgeClass: "" },
    { id: "teacher", label: "Faculty", icon: UserCheck, count: "Teacher", badgeClass: "badge-teacher" },
    { id: "coordinator", label: "Academic Cell", icon: ShieldCheck, count: "Coord", badgeClass: "badge-coord" },
    { id: "hod", label: "Department", icon: Award, count: "HOD", badgeClass: "badge-hod" },
    { id: "important", label: "High Priority", icon: Sparkles, count: importantCount, badgeClass: "badge-amber" },
    { id: "recent", label: "Recent", icon: Clock, count: recentCount, badgeClass: "badge-cyan" },
    { id: "downloaded", label: "Downloaded", icon: CheckCircle2, count: downloadedCount, badgeClass: "badge-emerald" },
    { id: "saved", label: "Saved", icon: Star, count: savedIds.size, badgeClass: "badge-rose" }
  ];

  const firstName = (currentUser?.fullName || currentUser?.name || "").split(" ")[0];

  /* ==========================================================================
     RENDER
     ========================================================================== */
  return (
    <div className="std-notes-page">
      {/* ===================== HERO SECTION ===================== */}
      <header className="std-hero-panel">
        <div className="std-hero-glow-bg" />

        {/* Left Column: Greeting, Search & Quick Formats */}
        <div className="std-hero-content">
          <div className="std-hero-meta-bar">
            <span className="std-hero-badge">
              <GraduationCap size={13} />
              <span>{currentUser?.branch || "Polytechnic"} · {currentUser?.semester || "Semester"}</span>
            </span>
            <span className="std-sync-indicator" title="Connected to faculty distribution stream">
              <span className="sync-dot" />
              <span>Live Faculty Sync</span>
            </span>
          </div>

          <h1 className="std-hero-title">
            {firstName ? `${firstName}’s Study Library` : "Study Notes & Materials"}
          </h1>
          <p className="std-hero-desc">
            Official lecture handouts, lab guides, question banks, and cloud drives shared by your course instructors.
          </p>

          {/* Prominent Search Bar */}
          <div className="std-hero-search-box">
            <Search size={18} className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Search by topic, unit, subject, or faculty name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search study notes"
            />
            {searchQuery ? (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search query"
              >
                <X size={14} />
              </button>
            ) : (
              <span className="search-kbd-hint" title="Press / to focus search">/</span>
            )}
          </div>

          {/* Quick Format Pills */}
          <div className="std-quick-formats" role="group" aria-label="Filter by material format">
            {QUICK_FORMATS.map((fmt) => {
              const Icon = fmt.icon;
              const isActive = selectedFileType === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  className={`quick-format-chip ${isActive ? "active" : ""}`}
                  onClick={() => setSelectedFileType(fmt.id)}
                >
                  <Icon size={13} />
                  <span>{fmt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Compact Progress Widget */}
        <aside className="std-hero-sidebar">
          <div className="std-progress-card">
            <div className="progress-card-top">
              <CompactProgressRing percent={downloadedPct} />
              <div className="progress-card-info">
                <span className="progress-card-badge">Offline Library</span>
                <h4 className="progress-card-title">
                  <strong>{downloadedCount}</strong> of <strong>{totalCount}</strong> Ready
                </h4>
                <p className="progress-card-sub">
                  {remainingCount > 0
                    ? `${remainingCount} material${remainingCount === 1 ? "" : "s"} not yet downloaded`
                    : "100% synchronized for offline study"}
                </p>
              </div>
            </div>

            <div className="progress-bar-track" aria-hidden="true">
              <div className="progress-bar-fill" style={{ width: `${downloadedPct}%` }} />
            </div>

            <div className="progress-card-footer">
              <span className="sync-timestamp">
                <Clock size={12} /> Real-time status
              </span>
              <button
                type="button"
                className="btn-hero-refresh"
                onClick={() => setRefreshKey((k) => k + 1)}
                title="Refresh library updates from faculty"
                aria-label="Refresh study library"
              >
                <RefreshCw size={13} className={loading ? "spin" : ""} />
                <span>Sync</span>
              </button>
            </div>
          </div>
        </aside>
      </header>

      {/* ===================== KPI SUMMARY METRICS ===================== */}
      <section className="std-kpi-grid" aria-label="Library performance summary">
        {[
          {
            key: "total",
            label: "Total Materials",
            val: totalCount,
            hint: "Curriculum modules",
            icon: BookOpen,
            color: "indigo"
          },
          {
            key: "recent",
            label: "Added This Week",
            val: recentCount,
            hint: "Fresh uploads",
            icon: Clock,
            color: "cyan"
          },
          {
            key: "important",
            label: "High Priority",
            val: importantCount,
            hint: "Exam & viva focus",
            icon: Sparkles,
            color: "amber"
          },
          {
            key: "downloaded",
            label: "Saved Offline",
            val: downloadedCount,
            hint: "Available on device",
            icon: CheckCircle2,
            color: "emerald"
          }
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className={`std-kpi-card kpi-${card.color}`}>
              <div className="kpi-icon-wrap">
                <Icon size={20} />
              </div>
              <div className="kpi-body">
                <span className="kpi-label">{card.label}</span>
                <div className="kpi-number">
                  {loadingStats ? (
                    <span className="kpi-shimmer" />
                  ) : (
                    <AnimatedCounter value={card.val} />
                  )}
                </div>
                <span className="kpi-hint">{card.hint}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* ===================== RECENTLY VIEWED ROW ===================== */}
      {recentNotes.length > 0 && (
        <section className="std-recent-panel" aria-label="Recently viewed study materials">
          <div className="std-panel-header">
            <div className="panel-title-wrap">
              <History size={16} className="text-indigo" />
              <h3>Pick Up Where You Left Off</h3>
            </div>
            <button
              type="button"
              className="std-clear-link"
              onClick={() => setRecentIds([])}
              aria-label="Clear recently viewed history"
            >
              Clear History
            </button>
          </div>

          <div className="std-recent-scroll-strip">
            {recentNotes.map((n) => {
              const f = getNoteFiles(n)[0];
              const meta = getFileFormatMeta(f?.fileExtension);
              const Icon = f ? meta.icon : Globe;
              return (
                <button
                  key={nid(n)}
                  type="button"
                  className="std-recent-card"
                  onClick={() => handleOpenPreview(n)}
                  title={`Open preview for ${n.title}`}
                >
                  <div
                    className="recent-tile"
                    style={{
                      background: f ? meta.bg : "rgba(99,102,241,0.12)",
                      color: f ? meta.color : "#6366f1"
                    }}
                  >
                    <Icon size={17} />
                  </div>
                  <div className="recent-info">
                    <strong className="recent-title">{n.title}</strong>
                    <span className="recent-meta">
                      {n.subject}{n.unit ? ` · ${n.unit}` : ""}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ===================== SUBJECT BENTO CHIPS ===================== */}
      {statistics?.subjects?.length > 0 && (
        <section className="std-subjects-panel" aria-label="Filter by course subject">
          <div className="std-panel-header">
            <div className="panel-title-wrap">
              <Layers size={16} className="text-indigo" />
              <h3>Enrolled Course Subjects</h3>
            </div>
            {selectedSubject !== "all" && (
              <button
                type="button"
                className="std-clear-link"
                onClick={() => setSelectedSubject("all")}
              >
                Showing {selectedSubject} · Show All
              </button>
            )}
          </div>

          <div className="std-subjects-chip-track">
            <button
              type="button"
              className={`std-subject-pill ${selectedSubject === "all" ? "active" : ""}`}
              onClick={() => setSelectedSubject("all")}
            >
              <span className="pill-dot" />
              <div className="pill-text">
                <span className="pill-name">All Subjects</span>
                <span className="pill-count">{totalCount} files</span>
              </div>
              {selectedSubject === "all" && <Check size={13} className="pill-check" />}
            </button>

            {statistics.subjects.map((sub) => {
              const isSelected = selectedSubject === sub.name;
              const color = accentFor(sub.name);
              return (
                <button
                  key={sub.name}
                  type="button"
                  className={`std-subject-pill ${isSelected ? "active" : ""}`}
                  style={{ "--sub-accent": color }}
                  onClick={() => setSelectedSubject(sub.name)}
                >
                  <span className="pill-dot" style={{ backgroundColor: color }} />
                  <div className="pill-text">
                    <span className="pill-name" title={sub.name}>{sub.name}</span>
                    <span className="pill-count">
                      {sub.code ? `${sub.code} · ` : ""}{sub.notesCount} note{sub.notesCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  {isSelected && <Check size={13} className="pill-check" />}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ===================== SOURCE TABS ===================== */}
      <div className="std-tabs-container">
        <nav className="std-source-tabs" role="tablist" aria-label="Material origin tabs">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isTabActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isTabActive}
                className={`source-tab-btn ${isTabActive ? "active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                <Icon size={15} />
                <span className="tab-label">{t.label}</span>
                <span className={`tab-count ${t.badgeClass}`}>{t.count}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ===================== FILTER & SORT TOOLBAR ===================== */}
      <div className="std-filter-bar-wrap">
        <div className="std-filter-bar-header">
          <button
            type="button"
            className={`std-filter-toggle-btn ${filtersOpen ? "open" : ""}`}
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
          >
            <SlidersHorizontal size={15} />
            <span>Filters & Sorting</span>
            {activeFilters.length > 0 && (
              <span className="active-filter-badge">{activeFilters.length}</span>
            )}
            <ChevronDown size={14} className="toggle-chevron" />
          </button>

          <div className="std-quick-view-tools">
            {/* Sort Dropdown */}
            <div className="std-select-group">
              <ArrowUpDown size={13} className="select-icon" />
              <select
                className="std-toolbar-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort study materials"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="std-view-toggle-group" role="group" aria-label="Layout view mode">
              <button
                type="button"
                className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                aria-label="Grid layout"
                title="Grid layout"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                aria-label="List layout"
                title="List layout"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Filter Inputs */}
        <div className={`std-filter-dropdown-drawer ${filtersOpen ? "open" : ""}`}>
          <div className="drawer-inner-grid">
            <div className="drawer-field">
              <label htmlFor="f-subject-select" className="drawer-label">Subject</label>
              <select
                id="f-subject-select"
                className="drawer-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="all">All Course Subjects</option>
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="drawer-field">
              <label htmlFor="f-cat-select" className="drawer-label">Category</label>
              <select
                id="f-cat-select"
                className="drawer-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="drawer-field">
              <label htmlFor="f-fmt-select" className="drawer-label">Material Format</label>
              <select
                id="f-fmt-select"
                className="drawer-select"
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value)}
              >
                <option value="all">All Formats & Clouds</option>
                <option value="pdf">PDF Documents (.pdf)</option>
                <option value="office">Presentations & Sheets (.pptx, .docx, .xlsx)</option>
                <option value="archive">Archives & Bundles (.zip, .rar)</option>
                <option value="external">External Cloud Links (Drive, YouTube, GitHub)</option>
              </select>
            </div>

            {activeFilters.length > 0 && (
              <div className="drawer-actions">
                <button type="button" className="btn-drawer-clear" onClick={clearAllFilters}>
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================== ACTIVE FILTERS & STATUS LINE ===================== */}
      <div className="std-status-row">
        <span className="results-counter">
          {loading ? (
            "Synchronizing study library..."
          ) : (
            <>
              Found <strong>{filteredNotes.length}</strong> material{filteredNotes.length === 1 ? "" : "s"}
            </>
          )}
        </span>

        {activeFilters.length > 0 && (
          <div className="std-active-filter-chips">
            {activeFilters.map((flt) => (
              <span key={flt.key} className="active-filter-chip">
                <span>{flt.label}</span>
                <button
                  type="button"
                  onClick={flt.clear}
                  aria-label={`Remove filter: ${flt.label}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
            <button type="button" className="clear-all-link" onClick={clearAllFilters}>
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* ===================== NOTES FEED: SKELETON / EMPTY / CARDS ===================== */}
      {loading ? (
        <div className="std-skeleton-grid" aria-busy="true">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="std-skeleton-card">
              <div className="skel-line skel-pill" />
              <div className="skel-line skel-title" />
              <div className="skel-line skel-desc" />
              <div className="skel-line skel-desc-short" />
              <div className="skel-footer" />
            </div>
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="std-empty-state">
          <div className="empty-icon-bubble">
            {activeTab === "saved" ? (
              <Star size={38} className="text-amber" />
            ) : activeTab === "downloaded" ? (
              <Download size={38} className="text-emerald" />
            ) : (
              <BookOpen size={38} className="text-indigo" />
            )}
          </div>
          <h3 className="empty-title">
            {activeTab === "saved"
              ? "No Saved Materials Yet"
              : activeTab === "downloaded"
              ? "No Downloaded Materials Yet"
              : activeFilters.length
              ? "No Matching Materials Found"
              : "No Study Materials Published"}
          </h3>
          <p className="empty-desc">
            {activeTab === "saved"
              ? "Click the star icon on any note card to pin it here for offline revision and quick access."
              : activeTab === "downloaded"
              ? "Downloaded files are stored on your local browser cache for offline study. Browse All Notes to download."
              : activeFilters.length
              ? "Try adjusting your search keywords, clearing specific format filters, or resetting the filters."
              : "Your course instructors have not uploaded notes for this semester yet. Check back soon."}
          </p>
          <div className="empty-actions">
            {activeFilters.length > 0 ? (
              <button type="button" className="btn-std-primary" onClick={clearAllFilters}>
                Clear All Filters
              </button>
            ) : activeTab !== "all" ? (
              <button type="button" className="btn-std-primary" onClick={() => setActiveTab("all")}>
                Browse All Notes
              </button>
            ) : (
              <button type="button" className="btn-std-primary" onClick={() => setRefreshKey((k) => k + 1)}>
                <RefreshCw size={14} /> Refresh Library
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Grid or List View Container */}
          <div className={`std-notes-feed ${viewMode === "list" ? "layout-list" : "layout-grid"}`}>
            {paginatedNotes.map((note, idx) => {
              const id = nid(note);
              const files = getNoteFiles(note);
              const extResources = note.externalResources || [];
              const primaryFile = files[0];
              const formatMeta = getFileFormatMeta(primaryFile?.fileExtension);
              const uploaderMeta = getUploaderRoleMeta(note.uploaderRole);
              const FormatIcon = primaryFile ? formatMeta.icon : Globe;
              const UploaderIcon = uploaderMeta.icon;

              const downloadKey = `${id}_${primaryFile?._id || "0"}`;
              const isDownloading = downloadingId === downloadKey;
              const downloadPct = downloadProgressMap[downloadKey] || 0;
              const isSaved = savedIds.has(id);
              const isMenuOpen = openCardMenuId === id;

              return (
                <article
                  key={id}
                  className={`std-note-card ${note.isImportant ? "priority-card" : ""}`}
                  style={{ "--card-accent": accentFor(note.subject), "--card-idx": Math.min(idx, 8) }}
                >
                  {/* Card Header: Subject, Unit, Priority, Save */}
                  <div className="card-top-row">
                    <div className="card-chips-left">
                      <span className="chip-subject" title={note.subject}>
                        <span className="subject-dot" />
                        {note.subjectCode ? `${note.subjectCode} · ` : ""}{note.subject}
                      </span>
                      {note.unit && <span className="chip-unit">{note.unit}</span>}
                    </div>

                    <div className="card-chips-right">
                      {note.isImportant && (
                        <span className="chip-important" title="Flagged as high exam priority by faculty">
                          <Sparkles size={11} /> Important
                        </span>
                      )}
                      {isRecentlyUploaded(note.createdAt) && (
                        <span className="chip-new">NEW</span>
                      )}
                      <button
                        type="button"
                        className={`btn-card-save ${isSaved ? "saved" : ""}`}
                        onClick={() => toggleSaved(note)}
                        aria-pressed={isSaved}
                        aria-label={isSaved ? "Remove from saved" : "Save note"}
                        title={isSaved ? "Remove from saved" : "Save for quick access"}
                      >
                        <Star size={14} fill={isSaved ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>

                  {/* Card Main: File Icon, Title, Description */}
                  <div className="card-main-content">
                    <div
                      className="card-file-tile"
                      style={{
                        backgroundColor: primaryFile ? formatMeta.bg : "rgba(99,102,241,0.1)",
                        color: primaryFile ? formatMeta.color : "#6366f1"
                      }}
                    >
                      <FormatIcon size={22} />
                    </div>

                    <div className="card-text-body">
                      <h4 className="card-note-title" title={note.title}>
                        {note.title}
                      </h4>
                      <p className="card-note-desc">
                        {note.description || "Official study and revision material prepared by your faculty."}
                      </p>
                    </div>
                  </div>

                  {/* Resource Badges (Attached files & Cloud links) */}
                  <div className="card-resources-strip">
                    {files.length > 0 && (
                      <div className="file-spec-tag">
                        <span
                          className="file-tag-badge"
                          style={{ color: formatMeta.color, backgroundColor: formatMeta.bg }}
                        >
                          <FormatIcon size={12} />
                          <span>{files.length > 1 ? `${files.length} Files` : formatMeta.tag}</span>
                        </span>
                        <span className="file-size-text">
                          {formatFileSize(files.reduce((acc, f) => acc + (f.fileSize || 0), 0))}
                        </span>
                      </div>
                    )}

                    {extResources.length > 0 && (
                      <div className="cloud-resources-list">
                        {extResources.slice(0, 2).map((res, rIdx) => {
                          const prov = detectUrlProvider(res.url);
                          return (
                            <a
                              key={rIdx}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cloud-url-badge"
                              style={{ color: prov.color, backgroundColor: prov.bg }}
                              title={`Open ${res.title || prov.label}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={10} />
                              <span>{res.title || prov.label}</span>
                            </a>
                          );
                        })}
                        {extResources.length > 2 && (
                          <span className="cloud-more-pill">+{extResources.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Uploader & Category Metadata */}
                  <div className="card-uploader-row">
                    <div className="uploader-badge">
                      <div
                        className="uploader-avatar"
                        style={{
                          backgroundColor: uploaderMeta.bg,
                          color: uploaderMeta.color,
                          borderColor: uploaderMeta.border
                        }}
                      >
                        <UploaderIcon size={14} />
                      </div>
                      <div className="uploader-info">
                        <strong className="uploader-name">{note.uploaderName}</strong>
                        <span className="uploader-role">
                          {uploaderMeta.label}{note.branch ? ` · ${note.branch}` : ""}
                        </span>
                      </div>
                    </div>

                    <span className="category-pill">{note.category || "Lecture Notes"}</span>
                  </div>

                  {/* Date & Download Metrics */}
                  <div className="card-metrics-row">
                    <span className="metric-item">
                      <Calendar size={12} /> {formatDate(note.createdAt)}
                    </span>
                    <span className="metric-item">
                      <Download size={12} /> {note.downloadCount || 0} downloads
                    </span>
                  </div>

                  {/* Interactive Actions Footer */}
                  <div className="card-actions-footer">
                    <button
                      type="button"
                      className="btn-card-preview"
                      onClick={() => handleOpenPreview(note)}
                    >
                      <Eye size={14} />
                      <span>Preview</span>
                    </button>

                    {files.length > 0 ? (
                      <button
                        type="button"
                        className={`btn-card-download ${note.isDownloadedByMe ? "downloaded" : ""}`}
                        onClick={() => handleDownloadNote(note, primaryFile)}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <>
                            <RefreshCw size={13} className="spin" />
                            <span>{downloadPct > 0 ? `${downloadPct}%` : "Saving"}</span>
                          </>
                        ) : note.isDownloadedByMe ? (
                          <>
                            <CheckCheck size={14} />
                            <span>Downloaded</span>
                          </>
                        ) : (
                          <>
                            <Download size={14} />
                            <span>Download</span>
                          </>
                        )}
                        {isDownloading && (
                          <span className="dl-mini-progress" style={{ width: `${downloadPct}%` }} />
                        )}
                      </button>
                    ) : extResources.length > 0 ? (
                      <a
                        href={extResources[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-card-download btn-card-external"
                      >
                        <ExternalLink size={14} />
                        <span>Open Resource</span>
                      </a>
                    ) : null}

                    {/* More Options Dropdown */}
                    <div className="card-menu-anchor" ref={isMenuOpen ? cardMenuRef : null}>
                      <button
                        type="button"
                        className="btn-card-icon-menu"
                        onClick={() => setOpenCardMenuId((prev) => (prev === id ? null : id))}
                        aria-label="More material actions"
                        title="More options"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {isMenuOpen && (
                        <div className="card-dropdown-menu" role="menu">
                          <button
                            type="button"
                            className="dropdown-item"
                            onClick={() => handleShare(note)}
                          >
                            <Share2 size={13} /> Copy Direct Link
                          </button>
                          <button
                            type="button"
                            className="dropdown-item"
                            onClick={() => toggleSaved(note)}
                          >
                            <Star size={13} /> {isSaved ? "Remove from Saved" : "Save for Later"}
                          </button>
                          {primaryFile?.checksum && (
                            <button
                              type="button"
                              className="dropdown-item"
                              onClick={() => {
                                handleCopyChecksum(primaryFile.checksum);
                                setOpenCardMenuId(null);
                              }}
                            >
                              <Copy size={13} /> Copy SHA-256 Hash
                            </button>
                          )}
                          <button
                            type="button"
                            className="dropdown-item"
                            onClick={() => handleOpenPreview(note)}
                          >
                            <Info size={13} /> Document Details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* ===================== PAGINATION CONTROLS ===================== */}
          {totalPages > 1 && (
            <div className="std-pagination-bar" aria-label="Study materials pagination">
              <span className="pagination-summary">
                Showing <strong>{(page - 1) * PAGE_SIZE + 1}</strong>–
                <strong>{Math.min(page * PAGE_SIZE, filteredNotes.length)}</strong> of{" "}
                <strong>{filteredNotes.length}</strong> materials
              </span>

              <div className="pagination-buttons">
                <button
                  type="button"
                  className="page-nav-btn"
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 200, behavior: "smooth" });
                  }}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                {buildPageList(page, totalPages).map((p, i) =>
                  p === "gap" ? (
                    <span key={`gap-${i}`} className="page-ellipsis">…</span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      className={`page-num-btn ${p === page ? "active" : ""}`}
                      onClick={() => {
                        setPage(p);
                        window.scrollTo({ top: 200, behavior: "smooth" });
                      }}
                      aria-current={p === page ? "page" : undefined}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  type="button"
                  className="page-nav-btn"
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 200, behavior: "smooth" });
                  }}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===================== PREVIEW MODAL ===================== */}
      {previewNote &&
        createPortal(
          (() => {
            const files = getNoteFiles(previewNote);
            const extResources = previewNote.externalResources || [];
            const curFile = files[activeModalFileIndex] || files[0];
            const pid = nid(previewNote);
            const isSaved = savedIds.has(pid);
            const hasMultipleModes = files.length > 0 && extResources.length > 0;

            return (
              <div className="std-modal-backdrop" onClick={closePreview}>
                <div
                  className="std-modal-sheet"
                  role="dialog"
                  aria-modal="true"
                  aria-label={previewNote.title}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="std-modal-header">
                    <div className="modal-title-area">
                      <div className="modal-tags-bar">
                        <span className="modal-tag-subject">{previewNote.subject}</span>
                        {previewNote.unit && <span className="modal-tag-unit">{previewNote.unit}</span>}
                        {previewNote.category && <span className="modal-tag-cat">{previewNote.category}</span>}
                        {previewNote.isImportant && (
                          <span className="modal-tag-important">
                            <Sparkles size={11} /> High Priority
                          </span>
                        )}
                      </div>
                      <h3 className="modal-document-title" title={previewNote.title}>
                        {previewNote.title}
                      </h3>
                    </div>

                    <div className="modal-actions-area">
                      <button
                        type="button"
                        className="btn-modal-nav"
                        onClick={() => goRelative(-1)}
                        disabled={previewIndex <= 0}
                        aria-label="Previous material"
                        title="Previous material (←)"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        className="btn-modal-nav"
                        onClick={() => goRelative(1)}
                        disabled={previewIndex < 0 || previewIndex >= filteredNotes.length - 1}
                        aria-label="Next material"
                        title="Next material (→)"
                      >
                        <ChevronRight size={18} />
                      </button>

                      {curFile && (curFile.fileExtension || "").toLowerCase() === "pdf" && (
                        <a
                          href={authApi.getNotePreviewUrl(pid, curFile._id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-modal-nav"
                          title="Open PDF in new browser tab"
                          aria-label="Open PDF in new browser tab"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}

                      {files.length > 0 && (
                        <button
                          type="button"
                          className="btn-modal-download-primary"
                          onClick={() => handleDownloadNote(previewNote, curFile)}
                        >
                          <Download size={14} />
                          <span>Download File</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-modal-close"
                        onClick={closePreview}
                        aria-label="Close modal dialog"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Modal Tabs Bar (Files vs Cloud Links) */}
                  {hasMultipleModes && (
                    <div className="std-modal-tabs-strip">
                      <button
                        type="button"
                        className={`modal-tab-pill ${activeModalTab === "files" ? "active" : ""}`}
                        onClick={() => setActiveModalTab("files")}
                      >
                        <Paperclip size={13} />
                        <span>Attached Files ({files.length})</span>
                      </button>
                      <button
                        type="button"
                        className={`modal-tab-pill ${activeModalTab === "urls" ? "active" : ""}`}
                        onClick={() => setActiveModalTab("urls")}
                      >
                        <Globe size={13} />
                        <span>Cloud Resources ({extResources.length})</span>
                      </button>
                    </div>
                  )}

                  {/* Modal Body & Side Panel */}
                  <div className="std-modal-grid-body">
                    <div className="std-modal-main-viewer">
                      {activeModalTab === "files" ? (
                        <>
                          {files.length > 1 && (
                            <div className="modal-files-switcher">
                              {files.map((fileObj, fIdx) => (
                                <button
                                  key={fileObj._id || fIdx}
                                  type="button"
                                  className={`file-switcher-chip ${activeModalFileIndex === fIdx ? "active" : ""}`}
                                  onClick={() => {
                                    setActiveModalFileIndex(fIdx);
                                    setImgZoom(false);
                                  }}
                                >
                                  <FileText size={13} />
                                  <span className="file-chip-name">
                                    {fileObj.originalFileName || `File ${fIdx + 1}`}
                                  </span>
                                  <span className="file-chip-size">
                                    {formatFileSize(fileObj.fileSize)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}

                          {!curFile ? (
                            <div className="modal-empty-notice">
                              <p>This note does not have an attached physical file. Check the cloud links tab.</p>
                            </div>
                          ) : (curFile.fileExtension || "").toLowerCase() === "pdf" ? (
                            <div className="pdf-viewer-wrap">
                              <iframe
                                title={`PDF Preview of ${curFile.originalFileName || previewNote.title}`}
                                src={authApi.getNotePreviewUrl(pid, curFile._id)}
                                className="pdf-iframe-element"
                              />
                            </div>
                          ) : ["png", "jpg", "jpeg", "webp"].includes((curFile.fileExtension || "").toLowerCase()) ? (
                            <div className="image-viewer-wrap">
                              <img
                                src={authApi.getNotePreviewUrl(pid, curFile._id)}
                                alt={previewNote.title}
                                className={`preview-img-tag ${imgZoom ? "zoomed" : ""}`}
                                onClick={() => setImgZoom((z) => !z)}
                              />
                            </div>
                          ) : (
                            <div className="unsupported-viewer-card">
                              <div className="unsupported-icon-box">
                                {(curFile.fileExtension || "").toLowerCase() === "zip" ? (
                                  <Archive size={48} className="text-amber" />
                                ) : (
                                  <Layers size={48} className="text-indigo" />
                                )}
                              </div>
                              <h4 className="unsupported-title">Native Application Document</h4>
                              <p className="unsupported-desc">
                                This file is a <strong>{getFileFormatMeta(curFile.fileExtension).label}</strong> ({(curFile.fileExtension || "").toUpperCase()}).
                                For best formatting fidelity, download the original file to view on your device.
                              </p>

                              <div className="metadata-spec-grid">
                                <div className="spec-row">
                                  <span>Filename</span>
                                  <code title={curFile.originalFileName || curFile.fileName}>
                                    {curFile.originalFileName || curFile.fileName}
                                  </code>
                                </div>
                                <div className="spec-row">
                                  <span>File Size</span>
                                  <strong>{formatFileSize(curFile.fileSize)}</strong>
                                </div>
                                <div className="spec-row">
                                  <span>Format</span>
                                  <code>{curFile.mimeType || "application/octet-stream"}</code>
                                </div>
                                <div className="spec-row">
                                  <span>Faculty</span>
                                  <span>{previewNote.uploaderName}</span>
                                </div>
                                <div className="spec-row">
                                  <span>Published</span>
                                  <span>{formatDate(previewNote.createdAt)}</span>
                                </div>
                                {curFile.checksum && (
                                  <div className="spec-row">
                                    <span>SHA-256</span>
                                    <div className="checksum-box">
                                      <code title={curFile.checksum}>{curFile.checksum}</code>
                                      <button
                                        type="button"
                                        className="btn-checksum-copy"
                                        onClick={() => handleCopyChecksum(curFile.checksum)}
                                        aria-label="Copy SHA-256 hash"
                                      >
                                        {copiedChecksum ? (
                                          <Check size={12} className="text-emerald" />
                                        ) : (
                                          <Copy size={12} />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                className="btn-modal-download-primary btn-wide"
                                onClick={() => handleDownloadNote(previewNote, curFile)}
                              >
                                <Download size={15} />
                                <span>Download {(curFile.fileExtension || "").toUpperCase()} Handout</span>
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="modal-cloud-resources-view">
                          <div className="cloud-view-intro">
                            <h4>External Cloud Resources</h4>
                            <p>Direct drive folders, videos, and references published by faculty for this topic.</p>
                          </div>

                          <div className="cloud-resources-grid">
                            {extResources.map((res, i) => {
                              const prov = detectUrlProvider(res.url);
                              const isEmbeddable = res.embedUrl ||
                                ((res.url || "").includes("drive.google.com") && res.url.includes("/preview"));

                              return (
                                <div key={i} className="cloud-res-card">
                                  <div className="cloud-card-header">
                                    <span
                                      className="cloud-provider-tag"
                                      style={{ color: prov.color, backgroundColor: prov.bg }}
                                    >
                                      {prov.label}
                                    </span>
                                    <span className="cloud-type-tag">
                                      {res.resourceType?.replace("_", " ") || "Resource"}
                                    </span>
                                  </div>

                                  <h5 className="cloud-card-title">{res.title || "External Document"}</h5>
                                  {res.description && (
                                    <p className="cloud-card-desc">{res.description}</p>
                                  )}

                                  {isEmbeddable && (
                                    <div className="cloud-embed-container">
                                      <iframe
                                        src={res.embedUrl || res.url.replace(/\/view(\?.*)?$/, "/preview")}
                                        title={res.title || "Cloud preview"}
                                        className="cloud-embed-iframe"
                                        allow="autoplay"
                                      />
                                    </div>
                                  )}

                                  <div className="cloud-card-footer">
                                    <code className="cloud-url-preview" title={res.url}>{res.url}</code>
                                    <a
                                      href={res.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn-open-cloud"
                                    >
                                      <ArrowUpRight size={14} />
                                      <span>Open</span>
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Modal Sidebar Info */}
                    <aside className="std-modal-aside-pane">
                      <div className="aside-box">
                        <h5 className="aside-heading">About This Material</h5>
                        <p className="aside-text">
                          {previewNote.description || "No supplementary description provided by the instructor."}
                        </p>
                      </div>

                      <div className="aside-stats-grid">
                        <div className="aside-stat">
                          <small>Total Downloads</small>
                          <strong>{previewNote.downloadCount || 0}</strong>
                        </div>
                        <div className="aside-stat">
                          <small>Attached Files</small>
                          <strong>{files.length}</strong>
                        </div>
                        <div className="aside-stat">
                          <small>Published Date</small>
                          <strong>{formatDate(previewNote.createdAt)}</strong>
                        </div>
                        <div className="aside-stat">
                          <small>Semester</small>
                          <strong>{previewNote.semester || "Semester 5"}</strong>
                        </div>
                      </div>

                      <div className="aside-action-buttons">
                        <button
                          type="button"
                          className="btn-aside-action"
                          onClick={() => toggleSaved(previewNote)}
                        >
                          <Star
                            size={14}
                            fill={isSaved ? "currentColor" : "none"}
                            className={isSaved ? "text-amber" : ""}
                          />
                          <span>{isSaved ? "Saved to List" : "Save for Later"}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-aside-action"
                          onClick={() => handleShare(previewNote)}
                        >
                          <Share2 size={14} />
                          <span>Copy Direct Link</span>
                        </button>
                        {files.length > 1 && (
                          <button
                            type="button"
                            className="btn-aside-action"
                            onClick={() => handleDownloadAll(previewNote)}
                          >
                            <FileDown size={14} />
                            <span>Download All {files.length} Files</span>
                          </button>
                        )}
                      </div>
                    </aside>
                  </div>

                  {/* Modal Footer */}
                  <div className="std-modal-footer-bar">
                    <div className="modal-uploader-summary">
                      <span>
                        Uploaded by <strong>{previewNote.uploaderName}</strong> (
                        {previewNote.uploaderDesignation || previewNote.uploaderRole})
                      </span>
                      <span>
                        <strong>{previewNote.branch}</strong>
                        {previewNote.semester ? `, ${previewNote.semester}` : ""}
                      </span>
                      {previewIndex >= 0 && (
                        <span className="modal-counter-chip">
                          {previewIndex + 1} of {filteredNotes.length}
                        </span>
                      )}
                    </div>
                    <button type="button" className="btn-modal-dismiss" onClick={closePreview}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            );
          })(),
          document.body
        )}
    </div>
  );
}
