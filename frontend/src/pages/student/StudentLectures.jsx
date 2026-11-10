import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Video, Play, Pause, X, Search, Clock, User, Bookmark, BookmarkCheck,
  CheckCircle2, ChevronLeft, ChevronRight, LayoutGrid, List, RefreshCw, Link2,
  AlertTriangle, Library, Timer, NotebookPen, Download, FileText, Presentation,
  FileCode, Music, HelpCircle, Volume2, VolumeX, Maximize, Minimize, RotateCcw,
  RotateCw, GraduationCap, Share2, Check, Flame, Target, Keyboard,
  PictureInPicture2, ListVideo, Moon, Sun, ArrowUp, Sparkles, Trophy,
  SkipForward, Plus, Info, Film, Eye, Table, Image as ImageIcon, BookOpen
} from "lucide-react";
import { authApi } from "../../services/authApi";
import { useTheme } from "../../context/ThemeContext";
import "./StudentLectures.css";

/* ==========================================================================
   Constants & Utilities
   ========================================================================== */
const PAGE_SIZE = 9;
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const GOAL_OPTIONS = [15, 30, 45, 60, 90];
const LECTURE_TYPES = ["All Types", "Theory", "Practical / Lab Demo", "Tutorial", "Revision", "Guest Lecture"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A-Z" },
  { value: "duration", label: "Longest first" },
  { value: "progress", label: "Most watched" }
];
const SHORTCUTS = [
  { keys: ["Space", "K"], label: "Play / Pause" },
  { keys: ["←", "J"], label: "Back 10 seconds" },
  { keys: ["→", "L"], label: "Forward 10 seconds" },
  { keys: ["↑", "↓"], label: "Volume up / down" },
  { keys: ["0-9"], label: "Jump to 0%–90%" },
  { keys: ["F"], label: "Fullscreen" },
  { keys: ["M"], label: "Mute" },
  { keys: ["P"], label: "Picture in picture" },
  { keys: ["N", "B"], label: "Next / Previous lecture" },
  { keys: ["T"], label: "Insert note timestamp" },
  { keys: ["<", ">"], label: "Slower / Faster" },
  { keys: ["?"], label: "Show this panel" }
];

const getId = (l) => String(l?._id || l?.id || "");
const getAuthor = (l) => l?.uploadedByName || l?.author || l?.faculty || "Faculty Member";
const getDurationSecs = (l) => l?.durationSeconds || (l?.durationMinutes || 45) * 60;

const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function formatSeconds(secs) {
  if (!secs || isNaN(secs) || secs < 0) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function formatMinutes(mins) {
  if (!mins) return "0 min";
  const t = Math.round(mins);
  if (t < 60) return `${t} min`;
  const h = Math.floor(t / 60);
  const r = t % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
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

function isRecent(d, days = 3) {
  if (!d) return false;
  const diff = Date.now() - new Date(d).getTime();
  return Number.isFinite(diff) && diff >= 0 && diff < days * 86400000;
}

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function resolvePlayer(lec) {
  const url = lec?.videoUrl || "";
  if (!url) return { kind: "none", src: "" };
  const yt = getYouTubeId(url);
  if (yt) {
    const resumeSec = Math.floor(lec?.progress?.lastPlaybackPosition || 0);
    return {
      kind: "youtube",
      ytId: yt,
      src: `https://www.youtube.com/embed/${yt}?autoplay=1&enablejsapi=1&rel=0${resumeSec > 0 ? `&start=${resumeSec}` : ""}`
    };
  }
  // Uploaded file or relative upload path: use the streaming endpoint (HTTP 206 range support)
  if (lec?.id && (lec.videoSource === "upload" || url.startsWith("/uploads/"))) {
    return { kind: "file", src: authApi.getLectureStreamUrl(lec.id) };
  }
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) {
    return { kind: "file", src: url };
  }
  return { kind: "iframe", src: url };
}

function getThumbnail(lec) {
  if (lec?.thumbnailUrl) return lec.thumbnailUrl;
  const yt = getYouTubeId(lec?.videoUrl);
  return yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : "";
}

function getResourceIcon(type) {
  switch (type) {
    case "notes_pdf": return FileText;
    case "slides_ppt": return Presentation;
    case "code_archive": return FileCode;
    case "audio_lecture": return Music;
    case "spreadsheet": return Table;
    case "image": return ImageIcon;
    default: return FileText;
  }
}

function canPreviewResource(resItem) {
  if (!resItem) return false;
  const mime = resItem.mimetype || "";
  const name = resItem.originalname || resItem.title || resItem.filename || "";
  const ext = (name.split(".").pop() || "").toLowerCase();
  return mime.includes("pdf") || mime.startsWith("image/") || ["pdf", "png", "jpg", "jpeg", "webp", "svg"].includes(ext);
}

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function calcStreak(log) {
  let streak = 0;
  const d = new Date();
  if (!(log[dayKey(d)] > 0)) d.setDate(d.getDate() - 1);
  while (log[dayKey(d)] > 0) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function lastSevenDays(log) {
  const out = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({
      key: dayKey(d),
      label: d.toLocaleDateString("en-IN", { weekday: "short" }),
      seconds: log[dayKey(d)] || 0,
      isToday: i === 0
    });
  }
  return out;
}

function buildPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(`gap-${p}`);
    out.push(p);
  });
  return out;
}

/* ==========================================================================
   Small Hooks & Helper Components
   ========================================================================== */
function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  }, [key, value]);
  return [value, setValue];
}

function useDebounce(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function AnimatedNumber({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const to = Number(value) || 0;
    const start = performance.now();
    const dur = 700;
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{display}{suffix}</>;
}

function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="lec-toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`lec-toast ${t.type}`} role="status">
          <span className="lec-toast-icon">
            {t.type === "success" ? <Check size={16} /> : t.type === "error" ? <AlertTriangle size={16} /> : <Info size={16} />}
          </span>
          <span className="lec-toast-text">{t.message}</span>
          <button type="button" onClick={() => onDismiss(t.id)} aria-label="Dismiss notification">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function ProgressRing({ pct, size = 96, stroke = 9 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="lec-ring-svg" aria-hidden="true">
      <defs>
        <linearGradient id="lecRingGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#FF6B0A" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} className="lec-ring-bg" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className="lec-ring-fg"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (clamped / 100) * c}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

/* ==========================================================================
   Lecture Card (memoised)
   ========================================================================== */
const LectureCard = React.memo(function LectureCard({
  lec, index, bookmarked, onOpen, onToggleBookmark, onShare, onDownloadVideo, downloadingId, downloadProgress
}) {
  const thumb = getThumbnail(lec);
  const progressPct = lec.progress?.completionPercentage || 0;
  const isCompleted = lec.progress?.isCompleted || false;
  const resourceCount = (lec.resources || []).length;
  const resumeSec = Math.floor(lec.progress?.lastPlaybackPosition || 0);
  const isDownloadableVideo = Boolean(
    lec.videoSource === "upload" ||
    (lec.videoUrl && lec.videoUrl.startsWith("/uploads/")) ||
    lec.videoFile?.filename
  );
  const isDownloading = downloadingId === getId(lec);

  return (
    <article
      className={`student-lec-card ${isCompleted ? "is-completed" : ""}`}
      style={{ "--i": index }}
    >
      <div className="student-lec-thumb" onClick={() => onOpen(lec)}>
        {thumb ? (
          <img src={thumb} alt={lec.title} loading="lazy" />
        ) : (
          <div className="lec-thumb-fallback">
            <Video size={36} />
          </div>
        )}
        <span className="lec-thumb-shade" />
        <span className="lec-thumb-type">{lec.lectureType || "Theory"}</span>
        {isRecent(lec.createdAt) && <span className="lec-new-badge"><Sparkles size={11} /> New</span>}
        <span className="lec-thumb-duration">
          <Clock size={12} /> {lec.durationMinutes || 45} min
        </span>
        <button type="button" className="lec-thumb-play-btn" aria-label={`Play ${lec.title}`}>
          <Play size={24} fill="currentColor" />
        </button>
        <button
          type="button"
          className={`lec-bookmark-btn ${bookmarked ? "active" : ""}`}
          onClick={(e) => { e.stopPropagation(); onToggleBookmark(lec); }}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? "Remove from saved" : "Save for later"}
          title={bookmarked ? "Remove from saved" : "Save for later"}
        >
          {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        </button>
        {isCompleted && (
          <span className="lec-done-ribbon"><CheckCircle2 size={13} /> Done</span>
        )}
      </div>

      {progressPct > 0 && (
        <div className="lec-card-progress-bar" title={`${progressPct}% watched`}>
          <div
            className={`lec-card-progress-fill ${isCompleted ? "completed" : ""}`}
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>
      )}

      <div className="student-lec-body">
        <div className="lec-card-subline">
          <span className="lec-subj-badge">{lec.subject}</span>
          {lec.topic && <span className="lec-topic-badge" title={lec.topic}>{lec.topic}</span>}
        </div>

        <h3 className="lec-card-title" onClick={() => onOpen(lec)} title={lec.title}>
          {lec.title}
        </h3>

        <p className="lec-card-desc">
          {lec.description || "Classroom lecture recording with syllabus coverage."}
        </p>

        <div className="lec-faculty-bar">
          <div className="lec-faculty-left">
            <span className="lec-faculty-avatar">
              {lec.uploadedByAvatar ? <img src={lec.uploadedByAvatar} alt={getAuthor(lec)} /> : <User size={14} />}
            </span>
            <div>
              <strong>{getAuthor(lec)}</strong>
              <small>{lec.uploadedByDesignation || "Faculty"}</small>
            </div>
          </div>
          <span className="lec-time-ago">{timeAgo(lec.createdAt)}</span>
        </div>

        <div className="lec-card-footer">
          <button type="button" className="lec-watch-cta-btn" onClick={() => onOpen(lec)}>
            <Play size={14} fill="currentColor" />
            {isCompleted ? "Watch again" : resumeSec > 0 ? `Resume (${formatSeconds(resumeSec)})` : "Watch now"}
          </button>

          {isDownloadableVideo && (
            <button
              type="button"
              className={`lec-video-download-btn ${isDownloading ? "downloading" : ""}`}
              onClick={(e) => { e.stopPropagation(); onDownloadVideo?.(lec); }}
              title={`Download original MP4 video: ${lec.title}`}
              disabled={isDownloading}
            >
              <Download size={13} className={isDownloading ? "spin" : ""} />
              <span>{isDownloading ? `${downloadProgress}%` : "Video MP4"}</span>
              {lec.videoFile?.filesize > 0 && (
                <span className="lec-dl-size-tag">{formatFileSize(lec.videoFile.filesize)}</span>
              )}
            </button>
          )}

          {resourceCount > 0 && (
            <button
              type="button"
              className="lec-res-pill-btn"
              onClick={() => onOpen(lec)}
              title={`${resourceCount} attached resources`}
            >
              <FileText size={13} /> {resourceCount} {resourceCount === 1 ? "file" : "files"}
            </button>
          )}

          <button
            type="button"
            className="lec-icon-btn"
            onClick={() => onShare(lec)}
            aria-label="Copy lecture details"
            title="Copy lecture details"
          >
            <Share2 size={15} />
          </button>
        </div>
      </div>
    </article>
  );
});

/* ==========================================================================
   Advanced Cinema Video Player (resources, notepad, playlist, shortcuts)
   ========================================================================== */
function AdvancedVideoPlayer({
  lecture,
  playlist,
  nextLecture,
  onClose,
  onNavigate,
  onSelect,
  hasPrev,
  hasNext,
  onProgressSaved,
  onWatchTick,
  studentUser,
  bookmarked,
  onToggleBookmark,
  notify,
  onDownloadVideo,
  onDownloadResource
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const notesRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const flashTimeoutRef = useRef(null);
  const clickTimerRef = useRef(null);
  const lastSyncTimeRef = useRef(0);
  const lastPosRef = useRef(lecture?.progress?.lastPlaybackPosition || 0);
  const lastDurRef = useRef(getDurationSecs(lecture));
  const ytPosRef = useRef(lecture?.progress?.lastPlaybackPosition || 0);
  const celebratedRef = useRef(false);
  const cbRef = useRef({});
  cbRef.current = { onProgressSaved, onWatchTick };

  const noteStorageKey = `collegeos_lec_note_${studentUser?._id || studentUser?.id || "user"}_${lecture?.id}`;
  const playerConfig = useMemo(() => resolvePlayer(lecture), [lecture]);
  const initialPosition = lecture?.progress?.lastPlaybackPosition || 0;
  const isVideoFile = playerConfig.kind === "file";
  const isYouTube = playerConfig.kind === "youtube";

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [duration, setDuration] = useState(getDurationSecs(lecture));
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(() => {
    try { return parseFloat(localStorage.getItem("collegeos_lec_rate")) || 1; } catch { return 1; }
  });
  const [autoplayNext, setAutoplayNext] = useState(() => {
    try { return localStorage.getItem("collegeos_lec_autoplay") !== "off"; } catch { return true; }
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [activeSideDrawer, setActiveSideDrawer] = useState("resources"); // resources | notes | playlist | null
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [completedCelebration, setCompletedCelebration] = useState(false);
  const [seekFlash, setSeekFlash] = useState(null); // 'back' | 'forward' | null
  const [upNextCountdown, setUpNextCountdown] = useState(null);
  const [noteSavedFeedback, setNoteSavedFeedback] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [personalNotes, setPersonalNotes] = useState(() => {
    try { return localStorage.getItem(noteStorageKey) || ""; } catch { return ""; }
  });

  /* ---------- Progress sync ---------- */
  const syncProgressToBackend = useCallback(async (currPos, durSecs, force = false) => {
    if (!lecture?.id) return;
    const now = Date.now();
    if (!force && now - lastSyncTimeRef.current < 4000) return;
    lastSyncTimeRef.current = now;
    try {
      const res = await authApi.saveLectureProgress(lecture.id, {
        lastPlaybackPosition: Math.floor(currPos || 0),
        duration: Math.floor(durSecs || getDurationSecs(lecture)),
        watchSessionSeconds: 8
      });
      if (res?.progress) {
        cbRef.current.onProgressSaved?.(lecture.id, res.progress);
        if (res.progress.isCompleted && !lecture.progress?.isCompleted && !celebratedRef.current) {
          celebratedRef.current = true;
          setCompletedCelebration(true);
        }
      }
    } catch (err) {
      console.warn("Watch progress sync failed:", err?.message);
    }
  }, [lecture]);

  /* ---------- Initial position + autoplay ---------- */
  useEffect(() => {
    const vid = videoRef.current;
    if (isVideoFile && vid) {
      vid.playbackRate = playbackRate;
      if (initialPosition > 0) {
        vid.currentTime = initialPosition;
        setCurrentTime(initialPosition);
      }
      vid.play().catch(() => setIsPlaying(false));
    }
    if (isYouTube) setIsPlaying(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVideoFile, isYouTube, initialPosition, lecture?.id]);

  /* ---------- One-second heartbeat: study time, YouTube estimate, periodic sync ---------- */
  useEffect(() => {
    if (!isPlaying) return undefined;
    let ticks = 0;
    const id = setInterval(() => {
      ticks += 1;
      cbRef.current.onWatchTick?.(1);
      const vid = videoRef.current;
      if (!vid && isYouTube) {
        ytPosRef.current += playbackRate;
        lastPosRef.current = ytPosRef.current;
        setCurrentTime(ytPosRef.current);
      }
      if (ticks % 8 === 0) {
        if (vid) syncProgressToBackend(vid.currentTime, vid.duration);
        else if (isYouTube) syncProgressToBackend(ytPosRef.current, getDurationSecs(lecture));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying, isYouTube, playbackRate, syncProgressToBackend, lecture]);

  /* ---------- Final sync on unmount (uses refs, since DOM refs are cleared by then) ---------- */
  useEffect(() => {
    return () => {
      if (lastPosRef.current > 0 && lecture?.id) {
        authApi.saveLectureProgress(lecture.id, {
          lastPlaybackPosition: Math.floor(lastPosRef.current),
          duration: Math.floor(lastDurRef.current || getDurationSecs(lecture)),
          watchSessionSeconds: 5
        }).then((res) => {
          if (res?.progress) cbRef.current.onProgressSaved?.(lecture.id, res.progress);
        }).catch(() => {});
      }
      clearTimeout(controlsTimeoutRef.current);
      clearTimeout(flashTimeoutRef.current);
      clearTimeout(clickTimerRef.current);
    };
  }, [lecture]);

  /* ---------- Fullscreen state follows the browser ---------- */
  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  /* ---------- Lock page scroll while theatre is open ---------- */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* ---------- Up-next countdown ---------- */
  useEffect(() => {
    if (upNextCountdown === null) return undefined;
    if (upNextCountdown <= 0) {
      setUpNextCountdown(null);
      onNavigate(1);
      return undefined;
    }
    const id = setTimeout(() => setUpNextCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(id);
  }, [upNextCountdown, onNavigate]);

  /* ---------- Video element handlers ---------- */
  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid) return;
    setCurrentTime(vid.currentTime);
    lastPosRef.current = vid.currentTime;
    if (vid.duration && Number.isFinite(vid.duration)) {
      lastDurRef.current = vid.duration;
      setDuration(vid.duration);
    }
  };

  const handleLoadedMetadata = () => {
    const vid = videoRef.current;
    if (!vid) return;
    setDuration(vid.duration);
    lastDurRef.current = vid.duration;
    vid.playbackRate = playbackRate;
    if (initialPosition > 0 && initialPosition < vid.duration) vid.currentTime = initialPosition;
  };

  const handleProgress = () => {
    const vid = videoRef.current;
    if (vid && vid.buffered.length) setBuffered(vid.buffered.end(vid.buffered.length - 1));
  };

  const handleEnded = () => {
    const vid = videoRef.current;
    setIsPlaying(false);
    lastPosRef.current = vid?.duration || lastPosRef.current;
    syncProgressToBackend(vid?.duration || 0, vid?.duration || 0, true);
    if (autoplayNext && hasNext) setUpNextCountdown(5);
  };

  /* ---------- Controls ---------- */
  const flash = (dir) => {
    setSeekFlash(dir);
    clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setSeekFlash(null), 650);
  };

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) vid.play().catch(() => {});
    else vid.pause();
  };

  const seekRelative = (seconds) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = Math.max(0, Math.min(vid.duration || 999999, vid.currentTime + seconds));
    flash(seconds < 0 ? "back" : "forward");
  };

  const seekTo = (sec) => {
    const vid = videoRef.current;
    if (!vid) {
      notify?.("Timestamp jumps work with uploaded lecture videos.", "info");
      return;
    }
    vid.currentTime = Math.max(0, Math.min(vid.duration || sec, sec));
    if (vid.paused) vid.play().catch(() => {});
  };

  const handleSeekChange = (e) => {
    const pos = parseFloat(e.target.value);
    setCurrentTime(pos);
    if (videoRef.current) videoRef.current.currentTime = pos;
  };

  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const applyVolume = (val) => {
    const v = Math.max(0, Math.min(1, val));
    setVolume(v);
    if (videoRef.current) {
      videoRef.current.volume = v;
      videoRef.current.muted = v === 0;
    }
    setIsMuted(v === 0);
  };

  const setSpeed = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
    try { localStorage.setItem("collegeos_lec_rate", String(rate)); } catch { /* ignore */ }
    setShowSpeedMenu(false);
  };

  const stepSpeed = (dir) => {
    const idx = SPEED_OPTIONS.indexOf(playbackRate);
    const next = SPEED_OPTIONS[Math.max(0, Math.min(SPEED_OPTIONS.length - 1, (idx === -1 ? 2 : idx) + dir))];
    setSpeed(next);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  };

  const togglePip = async () => {
    const vid = videoRef.current;
    if (!vid) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (document.pictureInPictureEnabled) await vid.requestPictureInPicture();
    } catch {
      notify?.("Picture in picture isn't available in this browser.", "error");
    }
  };

  const toggleAutoplay = () => {
    const next = !autoplayNext;
    setAutoplayNext(next);
    try { localStorage.setItem("collegeos_lec_autoplay", next ? "on" : "off"); } catch { /* ignore */ }
    if (!next) setUpNextCountdown(null);
  };

  const handleVideoClick = () => {
    clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(togglePlay, 220);
  };

  const handleVideoDouble = (e) => {
    clearTimeout(clickTimerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    if (x < 0.33) seekRelative(-10);
    else if (x > 0.66) seekRelative(10);
    else toggleFullscreen();
  };

  const revealControls = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  /* ---------- Notes ---------- */
  const persistNotes = (val) => {
    try {
      localStorage.setItem(noteStorageKey, val);
      setNoteSavedFeedback(true);
      setTimeout(() => setNoteSavedFeedback(false), 1800);
    } catch { /* storage unavailable */ }
  };

  const handleNotesChange = (e) => {
    setPersonalNotes(e.target.value);
    persistNotes(e.target.value);
  };

  const insertTimestamp = () => {
    const t = videoRef.current ? videoRef.current.currentTime : currentTime;
    const prefix = personalNotes && !personalNotes.endsWith("\n") ? "\n" : "";
    const next = `${personalNotes}${prefix}[${formatSeconds(t)}] `;
    setPersonalNotes(next);
    persistNotes(next);
    setActiveSideDrawer("notes");
    setTimeout(() => {
      const el = notesRef.current;
      if (el) { el.focus(); el.setSelectionRange(next.length, next.length); }
    }, 60);
  };

  const downloadNotes = () => {
    if (!personalNotes.trim()) {
      notify?.("Write something first, then download your notes.", "info");
      return;
    }
    const blob = new Blob([`${lecture.title}\n${lecture.subject}\n\n${personalNotes}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(lecture.title || "lecture").replace(/[^\w]+/g, "_")}_notes.txt`;
    a.click();
    URL.revokeObjectURL(url);
    notify?.("Notes downloaded.", "success");
  };

  const clearNotes = () => {
    if (!personalNotes) return;
    if (window.confirm("Clear all notes for this lecture?")) {
      setPersonalNotes("");
      persistNotes("");
    }
  };

  const noteStamps = useMemo(() => {
    const out = [];
    personalNotes.split("\n").forEach((line) => {
      const m = line.match(/^\[(\d{1,2}):(\d{2})(?::(\d{2}))?\]\s*(.*)$/);
      if (!m) return;
      const secs = m[3] !== undefined
        ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])
        : Number(m[1]) * 60 + Number(m[2]);
      out.push({ secs, label: m[3] !== undefined ? `${m[1]}:${m[2]}:${m[3]}` : `${m[1]}:${m[2]}`, text: m[4] || "Untitled note" });
    });
    return out;
  }, [personalNotes]);

  /* ---------- Keyboard shortcuts ---------- */
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag === "INPUT" && e.target.type !== "range") return;
      if (tag === "TEXTAREA") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (k === "Escape") {
        if (showShortcuts) setShowShortcuts(false);
        else if (upNextCountdown !== null) setUpNextCountdown(null);
        else if (!document.fullscreenElement) onClose();
        return;
      }
      if (k === "?") { e.preventDefault(); setShowShortcuts((s) => !s); return; }
      if (k === " " || k === "k" || k === "K") { e.preventDefault(); togglePlay(); return; }
      if (k === "ArrowLeft" || k === "j" || k === "J") { e.preventDefault(); seekRelative(-10); return; }
      if (k === "ArrowRight" || k === "l" || k === "L") { e.preventDefault(); seekRelative(10); return; }
      if (k === "ArrowUp") { e.preventDefault(); applyVolume(volume + 0.1); return; }
      if (k === "ArrowDown") { e.preventDefault(); applyVolume(volume - 0.1); return; }
      if (k === "f" || k === "F") { e.preventDefault(); toggleFullscreen(); return; }
      if (k === "m" || k === "M") { e.preventDefault(); toggleMute(); return; }
      if (k === "p" || k === "P") { e.preventDefault(); togglePip(); return; }
      if (k === "n" || k === "N") { if (hasNext) onNavigate(1); return; }
      if (k === "b" || k === "B") { if (hasPrev) onNavigate(-1); return; }
      if (k === "t" || k === "T") { e.preventDefault(); insertTimestamp(); return; }
      if (k === ">") { stepSpeed(1); return; }
      if (k === "<") { stepSpeed(-1); return; }
      if (/^[0-9]$/.test(k) && videoRef.current?.duration) {
        videoRef.current.currentTime = (Number(k) / 10) * videoRef.current.duration;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const completionPct = duration > 0
    ? Math.min(100, Math.round((currentTime / duration) * 100))
    : (lecture?.progress?.completionPercentage || 0);
  const playedPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const bufferedPct = duration > 0 ? Math.min(100, (buffered / duration) * 100) : 0;
  const resources = lecture.resources || [];

  return (
    <div className="lec-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={lecture.title}>
      <div
        ref={containerRef}
        className={`lec-theatre-shell ${isFullscreen ? "is-fullscreen" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="lec-theatre-header">
          <div className="lec-theatre-title-block">
            <span className="lec-type-tag">{lecture.lectureType || "Theory"}</span>
            <span className="lec-subj-tag">{lecture.subject}</span>
            <h3 title={lecture.title}>{lecture.title}</h3>
          </div>

          <div className="lec-theatre-actions">
            {isVideoFile && (
              <button
                type="button"
                className="lec-btn-resource-toggle lec-video-dl-topbtn"
                onClick={() => onDownloadVideo?.(lecture)}
                title="Download original MP4 video"
              >
                <Download size={15} />
                <span className="lec-btn-label">Download MP4</span>
              </button>
            )}
            <button
              type="button"
              className={`lec-btn-resource-toggle ${bookmarked ? "active-warm" : ""}`}
              onClick={() => onToggleBookmark(lecture)}
              title={bookmarked ? "Remove from saved" : "Save for later"}
              aria-pressed={bookmarked}
            >
              {bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
              <span className="lec-btn-label">{bookmarked ? "Saved" : "Save"}</span>
            </button>
            <button
              type="button"
              className={`lec-btn-resource-toggle ${activeSideDrawer === "resources" ? "active" : ""}`}
              onClick={() => setActiveSideDrawer(activeSideDrawer === "resources" ? null : "resources")}
              title="Attached resources"
            >
              <FileText size={15} />
              <span className="lec-btn-label">Resources ({resources.length})</span>
            </button>
            <button
              type="button"
              className={`lec-btn-resource-toggle ${activeSideDrawer === "notes" ? "active" : ""}`}
              onClick={() => setActiveSideDrawer(activeSideDrawer === "notes" ? null : "notes")}
              title="My notepad"
            >
              <NotebookPen size={15} />
              <span className="lec-btn-label">Notepad</span>
            </button>
            <button
              type="button"
              className={`lec-btn-resource-toggle ${activeSideDrawer === "playlist" ? "active" : ""}`}
              onClick={() => setActiveSideDrawer(activeSideDrawer === "playlist" ? null : "playlist")}
              title="Up next"
            >
              <ListVideo size={15} />
              <span className="lec-btn-label">Up next</span>
            </button>
            <button
              type="button"
              className="lec-icon-btn dark"
              onClick={() => setShowShortcuts(true)}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard size={16} />
            </button>
            <button type="button" className="lec-close-btn" onClick={onClose} aria-label="Close lecture">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body: viewport + docked drawer */}
        <div className="lec-theatre-body">
          <div
            className="lec-viewport-wrap"
            onMouseMove={revealControls}
            onMouseLeave={() => isPlaying && setShowControls(false)}
          >
            {completedCelebration && (
              <div className="lec-completed-banner">
                <CheckCircle2 size={24} className="lec-bounce" />
                <div>
                  <strong>Lecture completed! (90%+ watched)</strong>
                  <p>This session now counts toward your syllabus progress.</p>
                </div>
                <button type="button" onClick={() => setCompletedCelebration(false)}>Dismiss</button>
              </div>
            )}

            {isVideoFile ? (
              <div className="lec-video-native-box" onClick={handleVideoClick} onDoubleClick={handleVideoDouble}>
                <video
                  ref={videoRef}
                  src={playerConfig.src}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onProgress={handleProgress}
                  onPlay={() => { setIsPlaying(true); setUpNextCountdown(null); }}
                  onPause={() => {
                    setIsPlaying(false);
                    const v = videoRef.current;
                    if (v && !v.ended) syncProgressToBackend(v.currentTime, v.duration);
                  }}
                  onWaiting={() => setIsBuffering(true)}
                  onPlaying={() => setIsBuffering(false)}
                  onCanPlay={() => setIsBuffering(false)}
                  onEnded={handleEnded}
                  playsInline
                  className="lec-native-video"
                />
                {isBuffering && isPlaying && <div className="lec-buffering"><span /></div>}
                {!isPlaying && !isBuffering && upNextCountdown === null && (
                  <div className="lec-play-overlay">
                    <div className="lec-play-pulse"><Play size={44} fill="currentColor" /></div>
                  </div>
                )}
                {seekFlash && (
                  <div className={`lec-seek-flash ${seekFlash}`}>
                    {seekFlash === "back" ? <RotateCcw size={30} /> : <RotateCw size={30} />}
                    <span>10 sec</span>
                  </div>
                )}
              </div>
            ) : isYouTube ? (
              <div className="lec-iframe-box">
                <iframe
                  title={lecture.title}
                  src={playerConfig.src}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="lec-yt-iframe"
                />
              </div>
            ) : resources.length > 0 ? (
              <div className="lec-doc-only-hero">
                <div className="lec-doc-only-icon"><FileText size={36} /></div>
                <h4>{lecture.title}</h4>
                <p>
                  This lecture is a document &amp; study notes session with {resources.length} attached resource{resources.length > 1 ? "s" : ""}.
                  Browse slides, notes, and problem sheets from the side drawer.
                </p>
                <div className="lec-doc-hero-actions">
                  <button
                    type="button"
                    className="lec-res-download-btn primary"
                    onClick={() => setActiveSideDrawer("resources")}
                  >
                    <FileText size={15} /> View Attached Resources ({resources.length})
                  </button>
                </div>
              </div>
            ) : (
              <div className="lec-unsupported-box">
                <AlertTriangle size={32} />
                <p>This video can't be played inside the portal.</p>
                {lecture.videoUrl && (
                  <a href={lecture.videoUrl} target="_blank" rel="noopener noreferrer" className="lec-open-ext-btn">
                    Open video in a new tab <Link2 size={16} />
                  </a>
                )}
              </div>
            )}

            {/* Up next countdown overlay */}
            {upNextCountdown !== null && nextLecture && (
              <div className="lec-upnext">
                <div className="lec-upnext-card">
                  <div className="lec-upnext-count">
                    <svg viewBox="0 0 44 44" aria-hidden="true">
                      <circle cx="22" cy="22" r="19" className="bg" />
                      <circle cx="22" cy="22" r="19" className="fg" key={upNextCountdown === 5 ? "start" : "run"} />
                    </svg>
                    <b>{upNextCountdown}</b>
                  </div>
                  <div className="lec-upnext-text">
                    <small>Playing next</small>
                    <strong>{nextLecture.title}</strong>
                    <span>{nextLecture.subject} • {nextLecture.durationMinutes || 45} min</span>
                  </div>
                  <div className="lec-upnext-actions">
                    <button type="button" className="lec-nav-btn primary" onClick={() => { setUpNextCountdown(null); onNavigate(1); }}>
                      <SkipForward size={15} /> Play now
                    </button>
                    <button type="button" className="lec-nav-btn" onClick={() => setUpNextCountdown(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {/* Custom controls (uploaded files only) */}
            {isVideoFile && (
              <div className={`lec-custom-controls ${showControls || !isPlaying ? "visible" : "hidden"}`}>
                <div className="lec-seek-wrapper">
                  <div className="lec-seek-track" />
                  <div className="lec-seek-buffered" style={{ width: `${bufferedPct}%` }} />
                  <div className="lec-seek-played" style={{ width: `${playedPct}%` }} />
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeekChange}
                    className="lec-seek-bar"
                    aria-label="Seek"
                  />
                </div>

                <div className="lec-controls-row">
                  <div className="lec-ctrl-left">
                    <button type="button" onClick={togglePlay} className="lec-ctrl-btn" title={isPlaying ? "Pause (Space)" : "Play (Space)"}>
                      {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
                    </button>
                    <button type="button" onClick={() => seekRelative(-10)} className="lec-ctrl-btn" title="Back 10s (←)">
                      <RotateCcw size={18} /><span className="lec-skip-lbl">10</span>
                    </button>
                    <button type="button" onClick={() => seekRelative(10)} className="lec-ctrl-btn" title="Forward 10s (→)">
                      <RotateCw size={18} /><span className="lec-skip-lbl">10</span>
                    </button>
                    <div className="lec-vol-group">
                      <button type="button" onClick={toggleMute} className="lec-ctrl-btn" title={isMuted ? "Unmute (M)" : "Mute (M)"}>
                        {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => applyVolume(parseFloat(e.target.value))}
                        className="lec-vol-slider"
                        aria-label="Volume"
                      />
                    </div>
                    <span className="lec-time-display">{formatSeconds(currentTime)} / {formatSeconds(duration)}</span>
                  </div>

                  <div className="lec-ctrl-right">
                    <button type="button" onClick={insertTimestamp} className="lec-ctrl-btn" title="Add note at this moment (T)">
                      <Plus size={18} />
                    </button>
                    <div className="lec-speed-popover-wrap">
                      <button
                        type="button"
                        className="lec-ctrl-btn lec-speed-btn"
                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                        title="Playback speed"
                        aria-expanded={showSpeedMenu}
                      >
                        <span>{playbackRate}x</span>
                      </button>
                      {showSpeedMenu && (
                        <div className="lec-speed-menu">
                          {SPEED_OPTIONS.map((rate) => (
                            <button
                              type="button"
                              key={rate}
                              className={`lec-speed-opt ${playbackRate === rate ? "selected" : ""}`}
                              onClick={() => setSpeed(rate)}
                            >
                              {rate}x {playbackRate === rate && <Check size={14} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={togglePip} className="lec-ctrl-btn" title="Picture in picture (P)">
                      <PictureInPicture2 size={18} />
                    </button>
                    <button type="button" onClick={toggleFullscreen} className="lec-ctrl-btn" title={isFullscreen ? "Exit fullscreen (F)" : "Fullscreen (F)"}>
                      {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Shortcuts panel */}
            {showShortcuts && (
              <div className="lec-shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
                <div className="lec-shortcuts-card" onClick={(e) => e.stopPropagation()}>
                  <div className="lec-shortcuts-head">
                    <h4><Keyboard size={18} /> Keyboard shortcuts</h4>
                    <button type="button" className="lec-icon-btn dark" onClick={() => setShowShortcuts(false)} aria-label="Close shortcuts">
                      <X size={16} />
                    </button>
                  </div>
                  <ul>
                    {SHORTCUTS.map((s) => (
                      <li key={s.label}>
                        <span>{s.label}</span>
                        <span className="lec-kbd-row">
                          {s.keys.map((k) => <kbd key={k}>{k}</kbd>)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Drawer */}
          {activeSideDrawer && (
            <aside className="lec-resources-drawer">
              <div className="lec-drawer-inner">
                <div className="lec-drawer-top">
                  <div className="lec-drawer-tabs" role="tablist">
                    {[
                      { id: "resources", label: "Files", icon: FileText },
                      { id: "notes", label: "Notes", icon: NotebookPen },
                      { id: "playlist", label: "Up next", icon: ListVideo }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={activeSideDrawer === t.id}
                        className={activeSideDrawer === t.id ? "active" : ""}
                        onClick={() => setActiveSideDrawer(t.id)}
                      >
                        <t.icon size={14} /> {t.label}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="lec-drawer-close" onClick={() => setActiveSideDrawer(null)} aria-label="Close panel">
                    <X size={18} />
                  </button>
                </div>

                <div className="lec-drawer-content">
                  {activeSideDrawer === "resources" && (
                    <div className="lec-drawer-res-list-wrap">
                      {isVideoFile && (
                        <div className="lec-drawer-master-video-card">
                          <div className="lec-res-info">
                            <span className="lec-res-icon video"><Film size={18} /></span>
                            <div>
                              <strong>Lecture Video (MP4)</strong>
                              <small>
                                Complete Recorded Session
                                {lecture.videoFile?.filesize ? ` • ${formatFileSize(lecture.videoFile.filesize)}` : ""}
                              </small>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="lec-res-download-btn primary"
                            onClick={() => onDownloadVideo?.(lecture)}
                            title="Download original MP4 video"
                          >
                            <Download size={14} /> Download MP4
                          </button>
                        </div>
                      )}

                      {resources.length === 0 && !isVideoFile ? (
                        <p className="lec-drawer-empty">No files are attached to this lecture yet.</p>
                      ) : (
                        <ul className="lec-drawer-list">
                          {resources.map((resItem) => {
                            const ResIcon = getResourceIcon(resItem.resourceType);
                            return (
                              <li key={resItem._id || resItem.title} className="lec-drawer-item">
                                <div className="lec-res-info">
                                  <span className="lec-res-icon"><ResIcon size={18} /></span>
                                  <div>
                                    <strong>{resItem.title}</strong>
                                    <small>
                                      {resItem.originalname || "Document"}
                                      {resItem.filesize ? ` • ${formatFileSize(resItem.filesize)}` : ""}
                                    </small>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                  {canPreviewResource(resItem) && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewDoc(resItem)}
                                      className="lec-res-preview-btn"
                                      title="Preview document in viewer"
                                    >
                                      <Eye size={13} /> Preview
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => onDownloadResource?.(lecture, resItem)}
                                    className="lec-res-download-btn"
                                    title="Download original file"
                                  >
                                    <Download size={14} /> Download
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}

                  {activeSideDrawer === "notes" && (
                    <div className="lec-notes-panel">
                      <p className="lec-notes-hint">
                        Press <kbd>T</kbd> to stamp the current time. Lines starting with a time, like [14:20], become tap-to-jump links.
                      </p>
                      <textarea
                        ref={notesRef}
                        value={personalNotes}
                        onChange={handleNotesChange}
                        className="lec-drawer-notes-area"
                        placeholder="[14:20] LRU page fault count example..."
                      />
                      <div className="lec-notes-toolbar">
                        <button type="button" className="lec-mini-btn primary" onClick={insertTimestamp}>
                          <Plus size={13} /> Add timestamp
                        </button>
                        <button type="button" className="lec-mini-btn" onClick={downloadNotes}>
                          <Download size={13} /> Export
                        </button>
                        <button type="button" className="lec-mini-btn danger" onClick={clearNotes}>Clear</button>
                      </div>
                      <span className={`lec-save-state ${noteSavedFeedback ? "saved" : ""}`}>
                        {noteSavedFeedback ? "✓ Saved on this device" : "Saves automatically on this device"}
                      </span>
                      {noteStamps.length > 0 && (
                        <div className="lec-stamp-list">
                          <h5>Jump to your notes</h5>
                          {noteStamps.map((s, i) => (
                            <button type="button" key={`${s.secs}-${i}`} className="lec-stamp-item" onClick={() => seekTo(s.secs)}>
                              <span className="lec-stamp-time">{s.label}</span>
                              <span className="lec-stamp-text">{s.text}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeSideDrawer === "playlist" && (
                    <div className="lec-playlist-panel">
                      <label className="lec-autoplay-row">
                        <span>
                          <strong>Autoplay next</strong>
                          <small>Continue to the next lecture when this one ends</small>
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={autoplayNext}
                          className={`lec-switch ${autoplayNext ? "on" : ""}`}
                          onClick={toggleAutoplay}
                        >
                          <span />
                        </button>
                      </label>
                      <ul className="lec-playlist-list">
                        {playlist.map((p, i) => {
                          const isCurrent = p.id === lecture.id;
                          const pPct = p.progress?.completionPercentage || 0;
                          const pThumb = getThumbnail(p);
                          return (
                            <li key={p.id}>
                              <button type="button" className={`lec-playlist-item ${isCurrent ? "current" : ""}`} onClick={() => !isCurrent && onSelect(p)}>
                                <span className="lec-playlist-index">{isCurrent ? <Play size={12} fill="currentColor" /> : i + 1}</span>
                                <span className="lec-playlist-thumb">
                                  {pThumb ? <img src={pThumb} alt="" loading="lazy" /> : <Video size={16} />}
                                  {p.progress?.isCompleted && <i><Check size={10} /></i>}
                                </span>
                                <span className="lec-playlist-meta">
                                  <strong>{p.title}</strong>
                                  <small>{p.subject} • {p.durationMinutes || 45} min</small>
                                  {pPct > 0 && (
                                    <span className="lec-playlist-bar"><span style={{ width: `${Math.min(100, pPct)}%` }} /></span>
                                  )}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Footer */}
        <div className="lec-theatre-footer">
          <div className="lec-footer-meta">
            <div className="lec-author-line">
              <span className="lec-author-avatar">
                {lecture.uploadedByAvatar ? <img src={lecture.uploadedByAvatar} alt={getAuthor(lecture)} /> : <User size={16} />}
              </span>
              <div>
                <strong>{getAuthor(lecture)}</strong>
                <small>{lecture.uploadedByDesignation || "Faculty"} • {lecture.uploadedByDepartment || lecture.branch}</small>
              </div>
            </div>
            <div className="lec-progress-pill">
              <span>Progress <strong>{completionPct}%</strong></span>
              <div className="lec-progress-mini-track">
                <div className="lec-progress-mini-fill" style={{ width: `${completionPct}%` }} />
              </div>
            </div>
          </div>

          <div className="lec-playlist-nav">
            <button type="button" className="lec-nav-btn" onClick={() => onNavigate(-1)} disabled={!hasPrev} title="Previous lecture (B)">
              <ChevronLeft size={18} /> Previous
            </button>
            <button type="button" className="lec-nav-btn" onClick={() => onNavigate(1)} disabled={!hasNext} title="Next lecture (N)">
              Next <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* In-Browser Document Preview Lightbox */}
        {previewDoc && (
          <div className="tch-doc-preview-backdrop" onClick={() => setPreviewDoc(null)}>
            <div className="tch-doc-preview-shell" onClick={(e) => e.stopPropagation()}>
              <div className="tch-doc-preview-header">
                <div className="tch-doc-preview-title">
                  <FileText size={18} color="var(--lec-primary, #4F46E5)" />
                  <strong>{previewDoc.title || previewDoc.originalname}</strong>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    type="button"
                    className="lec-res-download-btn primary"
                    style={{ padding: "5px 12px", fontSize: "0.8rem" }}
                    onClick={() => onDownloadResource?.(lecture, previewDoc)}
                  >
                    <Download size={13} /> Download
                  </button>
                  <button
                    type="button"
                    className="tch-action-icon-btn"
                    onClick={() => setPreviewDoc(null)}
                    aria-label="Close preview"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="tch-doc-preview-body">
                {previewDoc.mimetype?.startsWith("image/") || /\.(png|jpe?g|webp|svg)$/i.test(previewDoc.fileUrl || previewDoc.filename || "") ? (
                  <img src={previewDoc.fileUrl || authApi.resolveUrl(previewDoc.fileUrl)} alt={previewDoc.title} />
                ) : (
                  <iframe
                    src={previewDoc.fileUrl || authApi.resolveUrl(previewDoc.fileUrl)}
                    title={previewDoc.title}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   Main Student Digital Lectures Hub
   ========================================================================== */
export default function StudentLectures({ currentUser }) {
  const studentId = currentUser?._id || currentUser?.id || "guest";

  const [activeTab, setActiveTab] = useState("all"); // all | continue | completed | saved | downloaded
  const [lectures, setLectures] = useState([]);
  const [historyData, setHistoryData] = useState({ continueWatching: [], completed: [], downloaded: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [sortMode, setSortMode] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [page, setPage] = useState(1);
  const [activeLecture, setActiveLecture] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [showTop, setShowTop] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(true);
  const [downloadingFileId, setDownloadingFileId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [bookmarks, setBookmarks] = useLocalStorage(`collegeos_lec_saved_${studentId}`, []);
  const [studyLog, setStudyLog] = useLocalStorage(`collegeos_lec_log_${studentId}`, {});
  const [dailyGoal, setDailyGoal] = useLocalStorage(`collegeos_lec_goal_${studentId}`, 30);
  const { theme, toggleTheme } = useTheme();

  const searchRef = useRef(null);
  const listTopRef = useRef(null);
  const tickBufferRef = useRef(0);
  const goalToastDayRef = useRef("");
  const searchQuery = useDebounce(searchInput, 250);

  const studentBranch = currentUser?.branch || currentUser?.department || "CSE";
  const studentSemester = currentUser?.semester || "Semester 5";
  const studentYear = currentUser?.academicYear || "3rd Year";

  /* ---------- Toasts ---------- */
  const pushToast = useCallback((message, type = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3600);
  }, []);
  const dismissToast = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  /* ---------- Data fetch ---------- */
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");
    const params = { semester: selectedSemester && selectedSemester !== "all" ? selectedSemester : "all" };

    Promise.allSettled([authApi.getLectures(params), authApi.getStudentLectureHistory()]).then(([lecRes, histRes]) => {
      if (!isMounted) return;
      if (lecRes.status === "fulfilled" && lecRes.value?.success) {
        setLectures(lecRes.value.lectures || []);
      } else {
        setError(lecRes.reason?.message || "Could not load video lectures from the server.");
      }
      if (histRes.status === "fulfilled" && histRes.value?.success) setHistoryData(histRes.value);
      setLoading(false);
    });

    return () => { isMounted = false; };
  }, [refreshKey, selectedSemester]);

  /* ---------- Derived data ---------- */
  const subjects = useMemo(() => {
    const map = new Map();
    lectures.forEach((l) => { if (l.subject) map.set(l.subject, (map.get(l.subject) || 0) + 1); });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [lectures]);

  const bookmarkSet = useMemo(() => new Set(bookmarks), [bookmarks]);

  const handleProgressSaved = useCallback((lectureId, progress) => {
    setLectures((prev) => prev.map((l) => (l.id === lectureId ? { ...l, progress } : l)));
  }, []);

  const toggleBookmark = useCallback((lec) => {
    const id = getId(lec);
    setBookmarks((prev) => {
      const has = prev.includes(id);
      return has ? prev.filter((b) => b !== id) : [...prev, id];
    });
    pushToast(bookmarkSet.has(id) ? "Removed from saved lectures." : "Saved for later.", "success");
  }, [bookmarkSet, pushToast, setBookmarks]);

  const shareLecture = useCallback(async (lec) => {
    const text = `${lec.title} — ${lec.subject}${lec.topic ? ` (${lec.topic})` : ""}\nBy ${getAuthor(lec)}${lec.videoUrl ? `\n${lec.videoUrl}` : ""}`;
    try {
      await navigator.clipboard.writeText(text);
      pushToast("Lecture details copied to clipboard.", "success");
    } catch {
      pushToast("Couldn't copy. Please copy manually from the lecture page.", "error");
    }
  }, [pushToast]);

  const handleDownloadVideo = useCallback(async (lec) => {
    const id = getId(lec);
    if (!id) return;
    setDownloadingFileId(id);
    setDownloadProgress(0);
    pushToast(`Starting video download: "${lec.title}.mp4"…`, "info");
    try {
      const url = authApi.getLectureDownloadUrl(id, null, "video");
      const filename = `${lec.title}.mp4`;
      const savedName = await authApi.downloadLectureFile(url, filename, (pct) => {
        setDownloadProgress(pct);
      });
      pushToast(`Downloaded "${savedName}" successfully.`, "success");
      authApi.getStudentLectureHistory().then((res) => {
        if (res?.success) setHistoryData(res);
      }).catch(() => {});
    } catch (err) {
      pushToast(err.message || "Failed to download video file.", "error");
    } finally {
      setDownloadingFileId(null);
      setDownloadProgress(0);
    }
  }, [pushToast]);

  const handleDownloadResource = useCallback(async (lec, resItem) => {
    const lecId = getId(lec);
    const fileKey = `${lecId}-${resItem._id || resItem.title}`;
    setDownloadingFileId(fileKey);
    pushToast(`Downloading study material: "${resItem.title}"…`, "info");
    try {
      const url = authApi.getLectureDownloadUrl(lecId, resItem._id, "resource");
      const fallback = resItem.originalname || `${resItem.title}.pdf`;
      const savedName = await authApi.downloadLectureFile(url, fallback, (pct) => {
        setDownloadProgress(pct);
      });
      pushToast(`Saved "${savedName}" directly to your device.`, "success");
      authApi.getStudentLectureHistory().then((res) => {
        if (res?.success) setHistoryData(res);
      }).catch(() => {});
    } catch (err) {
      pushToast(err.message || "Failed to download study resource.", "error");
    } finally {
      setDownloadingFileId(null);
      setDownloadProgress(0);
    }
  }, [pushToast]);

  const handleWatchTick = useCallback((secs) => {
    tickBufferRef.current += secs;
    if (tickBufferRef.current >= 10) {
      const add = tickBufferRef.current;
      tickBufferRef.current = 0;
      const key = dayKey();
      setStudyLog((prev) => ({ ...prev, [key]: (prev[key] || 0) + add }));
    }
  }, [setStudyLog]);

  const todaySeconds = studyLog[dayKey()] || 0;
  const goalPct = Math.min(100, Math.round((todaySeconds / (dailyGoal * 60)) * 100));
  const streak = useMemo(() => calcStreak(studyLog), [studyLog]);
  const weekData = useMemo(() => lastSevenDays(studyLog), [studyLog]);
  const weekTotal = weekData.reduce((a, d) => a + d.seconds, 0);
  const weekMax = Math.max(dailyGoal * 60, ...weekData.map((d) => d.seconds));

  useEffect(() => {
    const key = dayKey();
    if (todaySeconds >= dailyGoal * 60 && goalToastDayRef.current !== key) {
      goalToastDayRef.current = key;
      if (todaySeconds > 0) pushToast(`Daily goal reached: ${dailyGoal} minutes of study. Nice work!`, "success");
    }
  }, [todaySeconds, dailyGoal, pushToast]);

  const downloadedLectures = useMemo(
    () => (historyData.downloaded || []).map((d) => lectures.find((l) => getId(l) === getId(d)) || d),
    [historyData, lectures]
  );

  const displayLectures = useMemo(() => {
    let sourceList = lectures;
    if (activeTab === "continue") {
      sourceList = lectures.filter((l) => (l.progress?.completionPercentage || 0) > 0 && !l.progress?.isCompleted);
    } else if (activeTab === "completed") {
      sourceList = lectures.filter((l) => l.progress?.isCompleted);
    } else if (activeTab === "saved") {
      sourceList = lectures.filter((l) => bookmarkSet.has(getId(l)));
    } else if (activeTab === "downloaded") {
      sourceList = downloadedLectures;
    }

    const q = searchQuery.trim().toLowerCase();
    const topicFilter = selectedTopic.trim().toLowerCase();

    const filtered = sourceList.filter((lec) => {
      if (selectedSubject !== "all" && lec.subject !== selectedSubject) return false;
      if (selectedType !== "All Types" && lec.lectureType !== selectedType) return false;
      if (topicFilter && !(lec.topic || "").toLowerCase().includes(topicFilter)) return false;
      if (q) {
        const full = `${lec.title || ""} ${lec.topic || ""} ${lec.subject || ""} ${getAuthor(lec)}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortMode === "title") return (a.title || "").localeCompare(b.title || "");
      if (sortMode === "duration") return (b.durationMinutes || 0) - (a.durationMinutes || 0);
      if (sortMode === "progress") return (b.progress?.completionPercentage || 0) - (a.progress?.completionPercentage || 0);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [lectures, downloadedLectures, bookmarkSet, activeTab, searchQuery, selectedTopic, selectedSubject, selectedType, sortMode]);

  /* ---------- Pagination ---------- */
  const totalPages = Math.max(1, Math.ceil(displayLectures.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = displayLectures.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [activeTab, searchQuery, selectedTopic, selectedSubject, selectedType, sortMode, selectedSemester]);

  const goToPage = (p) => {
    setPage(p);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ---------- Stats & Dynamic Syllabus Completion ---------- */
  const totalStudyMinutes = useMemo(() => lectures.reduce((acc, l) => acc + (l.durationMinutes || 0), 0), [lectures]);

  const syllabusStats = useMemo(() => {
    if (lectures.length === 0) {
      return {
        overallProgressPct: historyData?.syllabusSummary?.overallCompletionPercentage || 0,
        completedCount: historyData?.stats?.completedLecturesCount || 0,
        inProgressCount: historyData?.stats?.inProgressCount || 0,
        subjectsBreakdown: historyData?.syllabusSummary?.subjectsBreakdown || []
      };
    }

    const totalLecturesCount = lectures.length;
    let sumProgress = 0;
    let doneCount = 0;
    let inProgCount = 0;

    const subMap = new Map();

    lectures.forEach((l) => {
      const sName = l.subject || "General";
      if (!subMap.has(sName)) {
        subMap.set(sName, {
          subject: sName,
          totalLectures: 0,
          completedLectures: 0,
          inProgressLectures: 0,
          progressSum: 0,
          topics: new Set()
        });
      }
      const s = subMap.get(sName);
      s.totalLectures += 1;
      if (l.topic) s.topics.add(l.topic);

      const pct = Math.min(100, Math.max(0, l.progress?.completionPercentage || 0));
      const isCompleted = Boolean(l.progress?.isCompleted || pct >= 90);
      s.progressSum += pct;
      sumProgress += pct;

      if (isCompleted) {
        s.completedLectures += 1;
        doneCount += 1;
      } else if (pct > 0) {
        s.inProgressLectures += 1;
        inProgCount += 1;
      }
    });

    let overallPct = 0;
    if (totalLecturesCount > 0) {
      if (doneCount === totalLecturesCount) {
        overallPct = 100;
      } else if (doneCount > 0) {
        overallPct = Math.round((doneCount / totalLecturesCount) * 100);
      } else if (sumProgress > 0) {
        // If no lectures are completed yet, calculate based on actual watched percentage across available syllabus material
        overallPct = Math.min(89, Math.round(sumProgress / totalLecturesCount));
      }
    }

    const breakdown = Array.from(subMap.values()).map((s) => {
      let cPct = 0;
      if (s.totalLectures > 0) {
        if (s.completedLectures === s.totalLectures) cPct = 100;
        else if (s.completedLectures > 0) cPct = Math.round((s.completedLectures / s.totalLectures) * 100);
        else if (s.progressSum > 0) cPct = Math.min(89, Math.round(s.progressSum / s.totalLectures));
      }
      return {
        subject: s.subject,
        totalLectures: s.totalLectures,
        completedLectures: s.completedLectures,
        inProgressLectures: s.inProgressLectures,
        uniqueTopicsCount: s.topics.size,
        completionPercentage: cPct
      };
    });

    return {
      overallProgressPct: overallPct,
      completedCount: doneCount,
      inProgressCount: inProgCount,
      subjectsBreakdown: breakdown
    };
  }, [lectures, historyData]);

  const completedCount = syllabusStats.completedCount;
  const inProgressCount = syllabusStats.inProgressCount;
  const overallProgressPct = syllabusStats.overallProgressPct;

  const inProgressList = useMemo(
    () => lectures.filter((l) => (l.progress?.completionPercentage || 0) > 0 && !l.progress?.isCompleted && (l.progress?.completionPercentage || 0) < 90),
    [lectures]
  );

  const heroLecture = useMemo(() => {
    if (inProgressList.length === 0) return null;
    return [...inProgressList].sort((a, b) => {
      const ta = new Date(a.progress?.lastWatchedAt || a.progress?.updatedAt || 0).getTime();
      const tb = new Date(b.progress?.lastWatchedAt || b.progress?.updatedAt || 0).getTime();
      return tb - ta || (b.progress?.completionPercentage || 0) - (a.progress?.completionPercentage || 0);
    })[0];
  }, [inProgressList]);

  /* ---------- Playlist navigation ---------- */
  const currentIndex = activeLecture ? displayLectures.findIndex((l) => l.id === activeLecture.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < displayLectures.length - 1;
  const nextLecture = hasNext ? displayLectures[currentIndex + 1] : null;

  const handleNavigate = useCallback((dir) => {
    const nextIdx = currentIndex + dir;
    if (nextIdx >= 0 && nextIdx < displayLectures.length) setActiveLecture(displayLectures[nextIdx]);
  }, [currentIndex, displayLectures]);

  /* ---------- Global shortcuts & scroll button ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if (activeLecture) return;
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "/") { e.preventDefault(); searchRef.current?.focus(); }
    };
    const onScroll = () => setShowTop(window.scrollY > 640);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [activeLecture]);

  /* ---------- Filters ---------- */
  const activeFilters = [];
  if (searchInput.trim()) activeFilters.push({ key: "q", label: `Search: ${searchInput.trim()}`, clear: () => setSearchInput("") });
  if (selectedSemester !== "all") activeFilters.push({ key: "sem", label: selectedSemester, clear: () => setSelectedSemester("all") });
  if (selectedSubject !== "all") activeFilters.push({ key: "sub", label: selectedSubject, clear: () => setSelectedSubject("all") });
  if (selectedType !== "All Types") activeFilters.push({ key: "type", label: selectedType, clear: () => setSelectedType("All Types") });
  if (selectedTopic.trim()) activeFilters.push({ key: "topic", label: `Chapter: ${selectedTopic.trim()}`, clear: () => setSelectedTopic("") });

  const resetFilters = () => {
    setSearchInput("");
    setSelectedTopic("");
    setSelectedSubject("all");
    setSelectedType("All Types");
    setSelectedSemester("all");
  };

  const tabs = [
    { id: "all", label: "All lectures", icon: Video, count: lectures.length },
    { id: "continue", label: "Continue watching", icon: Play, count: inProgressCount },
    { id: "completed", label: "Completed", icon: CheckCircle2, count: completedCount },
    { id: "saved", label: "Saved", icon: Bookmark, count: bookmarks.filter((b) => lectures.some((l) => getId(l) === b)).length },
    { id: "downloaded", label: "Downloaded", icon: Download, count: downloadedLectures.length }
  ];

  const emptyCopy = {
    continue: "Nothing in progress. Start any lecture and it will wait for you here.",
    completed: "Watch 90% of a lecture to mark it completed.",
    saved: "Tap the bookmark on any lecture to keep it here for later.",
    downloaded: "Files you download from lectures will be listed here.",
    all: "No lectures match your current search and filters."
  };

  return (
    <div className="student-lec-container" data-lec-theme={theme}>
      <div className="lec-aurora" aria-hidden="true"><i /><i /><i /></div>

      {/* Header */}
      <header className="student-lec-header lec-fade-in">
        <div>
          <div className="lec-scope-tag-row">
            <span className="lec-scope-badge"><GraduationCap size={14} /> Subharti Polytechnic</span>
            <span className="lec-scope-badge highlight">{studentBranch} • {studentSemester} ({studentYear})</span>
          </div>
          <h2>Digital Video Lectures & Academic Hub</h2>
          <p>Stream verified course lectures, lab walkthroughs, and download official study material, all in one place.</p>
        </div>

        <div className="lec-header-actions">
          <button
            type="button"
            className="lec-refresh icon-only"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle colour theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            className="lec-refresh"
            onClick={() => { setRefreshKey((k) => k + 1); pushToast("Refreshing your lectures…", "info"); }}
            disabled={loading}
            title="Refresh lectures"
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* KPI row */}
      <section className="lec-stats lec-fade-in" aria-label="Your lecture statistics">
        <div className="lec-stat blue">
          <span className="lec-stat-icon"><Library size={22} /></span>
          <div><strong><AnimatedNumber value={lectures.length} /></strong><small>Course lectures</small></div>
        </div>
        <div className="lec-stat violet">
          <span className="lec-stat-icon"><Play size={22} /></span>
          <div><strong><AnimatedNumber value={inProgressCount} /></strong><small>In progress</small></div>
        </div>
        <div className="lec-stat green">
          <span className="lec-stat-icon"><CheckCircle2 size={22} /></span>
          <div><strong><AnimatedNumber value={completedCount} /> / {lectures.length}</strong><small>Completed (90%+)</small></div>
        </div>
        <div className="lec-stat orange">
          <span className="lec-stat-icon"><Timer size={22} /></span>
          <div><strong>{formatMinutes(totalStudyMinutes)}</strong><small>Total lecture time</small></div>
        </div>
      </section>

      {/* Overall completion & Academic Syllabus Breakdown */}
      <section className="lec-progress lec-fade-in" aria-label="Syllabus Completion">
        <div className="lec-progress-top">
          <div className="lec-progress-meta-text">
            <span>Overall syllabus completion</span>
            <small className="lec-progress-sub">
              {syllabusStats.completedCount} of {lectures.length} topic lectures fully completed ({overallProgressPct}%)
            </small>
          </div>
          <b className="lec-progress-pct-text">{overallProgressPct}% completed</b>
        </div>
        <div className="lec-progress-track" role="progressbar" aria-valuenow={overallProgressPct} aria-valuemin={0} aria-valuemax={100}>
          <div className="lec-progress-fill" style={{ width: `${overallProgressPct}%` }} />
        </div>

        {/* Dynamic Subject Syllabus Breakdown */}
        {syllabusStats.subjectsBreakdown.length > 0 && (
          <div className="lec-subjects-syllabus-wrap">
            <div className="lec-subjects-syllabus-head">
              <span className="lec-breakdown-title">
                <BookOpen size={14} /> Course Syllabus Progress by Subject
              </span>
              <span className="lec-breakdown-hint">Click a subject to filter lectures</span>
            </div>
            <div className="lec-subjects-syllabus-grid">
              {syllabusStats.subjectsBreakdown.map((sb) => {
                const isSelected = selectedSubject === sb.subject;
                return (
                  <button
                    key={sb.subject}
                    type="button"
                    className={`lec-subject-pill-card ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedSubject(isSelected ? "all" : sb.subject)}
                    title={`Filter by ${sb.subject} (${sb.completionPercentage}% completed)`}
                  >
                    <div className="sb-pill-top">
                      <strong className="sb-pill-title">{sb.subject}</strong>
                      <span className="sb-pill-badge">{sb.completionPercentage}%</span>
                    </div>
                    <div className="sb-pill-sub">
                      <span>{sb.completedLectures} / {sb.totalLectures} completed</span>
                      {sb.uniqueTopicsCount > 0 && <span>· {sb.uniqueTopicsCount} topics</span>}
                    </div>
                    <div className="sb-pill-track">
                      <div className="sb-pill-fill" style={{ width: `${sb.completionPercentage}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Study insights */}
      <section className="lec-insights-wrap lec-fade-in">
        <button
          type="button"
          className="lec-insights-toggle"
          onClick={() => setInsightsOpen((o) => !o)}
          aria-expanded={insightsOpen}
        >
          <Target size={16} /> Study insights
          <ChevronRight size={16} className={`lec-chevron ${insightsOpen ? "open" : ""}`} />
        </button>

        {insightsOpen && (
          <div className="lec-insights">
            <div className="lec-insight-card lec-goal-card">
              <div className="lec-ring-wrap">
                <ProgressRing pct={goalPct} />
                <span className="lec-ring-label">{goalPct}%</span>
              </div>
              <div className="lec-goal-text">
                <small>Today's study goal</small>
                <strong>{formatMinutes(todaySeconds / 60)} of {dailyGoal} min</strong>
                <select
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="lec-goal-select"
                  aria-label="Daily study goal"
                >
                  {GOAL_OPTIONS.map((g) => <option key={g} value={g}>{g} min per day</option>)}
                </select>
              </div>
            </div>

            <div className="lec-insight-card lec-streak-card">
              <span className={`lec-streak-flame ${streak > 0 ? "lit" : ""}`}><Flame size={28} /></span>
              <div>
                <strong><AnimatedNumber value={streak} /> day{streak === 1 ? "" : "s"}</strong>
                <small>{streak > 0 ? "Study streak. Keep it going today." : "Watch a lecture today to start a streak."}</small>
              </div>
            </div>

            <div className="lec-insight-card lec-week-card">
              <div className="lec-week-head">
                <small>Last 7 days</small>
                <strong>{formatMinutes(weekTotal / 60)}</strong>
              </div>
              <div className="lec-week-bars">
                {weekData.map((d) => (
                  <div key={d.key} className={`lec-week-col ${d.isToday ? "today" : ""}`} title={`${d.label}: ${formatMinutes(d.seconds / 60)}`}>
                    <span className="lec-week-bar">
                      <i style={{ height: `${Math.max(d.seconds > 0 ? 8 : 3, (d.seconds / weekMax) * 100)}%` }} />
                    </span>
                    <em>{d.label.slice(0, 2)}</em>
                  </div>
                ))}
              </div>
              <p className="lec-insight-note">Tracked on this device while you watch.</p>
            </div>
          </div>
        )}
      </section>

      {/* Resume hero */}
      {heroLecture && activeTab === "all" && !searchInput && !loading && (
        <section className="lec-hero lec-fade-in" aria-label="Continue watching">
          <div
            className="lec-hero-bg"
            style={getThumbnail(heroLecture) ? { backgroundImage: `url(${getThumbnail(heroLecture)})` } : undefined}
          />
          <div className="lec-hero-content">
            <small className="lec-hero-kicker">Pick up where you left off</small>
            <h3>{heroLecture.title}</h3>
            <p>{heroLecture.subject}{heroLecture.topic ? ` • ${heroLecture.topic}` : ""} • {getAuthor(heroLecture)}</p>
            <div className="lec-hero-progress">
              <div><span style={{ width: `${heroLecture.progress?.completionPercentage || 0}%` }} /></div>
              <b>{heroLecture.progress?.completionPercentage || 0}% watched</b>
            </div>
            <button type="button" className="lec-hero-cta" onClick={() => setActiveLecture(heroLecture)}>
              <Play size={16} fill="currentColor" />
              Resume from {formatSeconds(heroLecture.progress?.lastPlaybackPosition || 0)}
            </button>
          </div>
        </section>
      )}

      {/* Tabs */}
      <nav className="lec-tabs-row lec-fade-in" role="tablist" aria-label="Lecture views">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={activeTab === t.id}
            className={`lec-tab-pill ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            <t.icon size={16} /> {t.label}
            <span className="lec-tab-count">{t.count}</span>
          </button>
        ))}
      </nav>

      {/* Toolbar */}
      <section className="student-lec-toolbar lec-fade-in" ref={listTopRef}>
        <div className="student-lec-search">
          <Search size={18} className="search-icon" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search by title, chapter, subject or faculty name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search lectures"
          />
          {searchInput ? (
            <button type="button" className="lec-clear-search" onClick={() => setSearchInput("")} aria-label="Clear search">
              <X size={14} />
            </button>
          ) : (
            <kbd className="lec-search-hint">/</kbd>
          )}
        </div>

        <div className="student-lec-controls">
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="lec-select-filter lec-sem-select"
            aria-label="Filter by semester"
          >
            <option value="all">All semesters</option>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <option key={s} value={`Semester ${s}`}>
                Semester {s}{studentSemester === `Semester ${s}` ? " ★ (Enrolled)" : ""}
              </option>
            ))}
          </select>

          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="lec-select-filter" aria-label="Filter by subject">
            <option value="all">All subjects ({subjects.length})</option>
            {subjects.map(([sub]) => <option key={sub} value={sub}>{sub}</option>)}
          </select>

          <input
            type="text"
            placeholder="Filter by chapter…"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="lec-topic-filter-input"
            aria-label="Filter by chapter"
          />

          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="lec-select-filter" aria-label="Filter by lecture type">
            {LECTURE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <select value={sortMode} onChange={(e) => setSortMode(e.target.value)} className="lec-select-filter" aria-label="Sort lectures">
            {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          <div className="lec-view-toggle" role="group" aria-label="Layout">
            <button type="button" className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} title="Grid view" aria-pressed={viewMode === "grid"}>
              <LayoutGrid size={16} />
            </button>
            <button type="button" className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")} title="List view" aria-pressed={viewMode === "list"}>
              <List size={16} />
            </button>
          </div>
        </div>

        {subjects.length > 1 && (
          <div className="lec-chip-scroller" aria-label="Quick subject filter">
            <button type="button" className={`lec-chip ${selectedSubject === "all" ? "active" : ""}`} onClick={() => setSelectedSubject("all")}>
              All <em>{lectures.length}</em>
            </button>
            {subjects.map(([sub, count]) => (
              <button
                key={sub}
                type="button"
                className={`lec-chip ${selectedSubject === sub ? "active" : ""}`}
                onClick={() => setSelectedSubject(selectedSubject === sub ? "all" : sub)}
              >
                {sub} <em>{count}</em>
              </button>
            ))}
          </div>
        )}

        {activeFilters.length > 0 && (
          <div className="lec-active-filters">
            {activeFilters.map((f) => (
              <span key={f.key} className="lec-filter-tag">
                {f.label}
                <button type="button" onClick={f.clear} aria-label={`Remove filter ${f.label}`}><X size={12} /></button>
              </span>
            ))}
            <button type="button" className="lec-clear-all" onClick={resetFilters}>Clear all</button>
          </div>
        )}
      </section>

      {/* Result summary */}
      {!loading && !error && displayLectures.length > 0 && (
        <div className="lec-result-bar">
          <span>
            Showing <b>{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, displayLectures.length)}</b> of <b>{displayLectures.length}</b> lectures
          </span>
          <span className="lec-result-hint"><Keyboard size={14} /> Press <kbd>/</kbd> to search</span>
        </div>
      )}

      {/* Lecture list */}
      {loading ? (
        <div className="student-lec-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="student-lec-card lec-skeleton-card">
              <div className="lec-skel lec-skel-thumb" />
              <div className="student-lec-body">
                <div className="lec-skel lec-skel-line short" />
                <div className="lec-skel lec-skel-line" />
                <div className="lec-skel lec-skel-line" />
                <div className="lec-skel lec-skel-line pill" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="lec-error-box">
          <AlertTriangle size={36} />
          <h3>Couldn't load your lectures</h3>
          <p>{error}</p>
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)}>Try again</button>
        </div>
      ) : displayLectures.length === 0 ? (
        <div className="lec-empty-state">
          <span className="lec-empty-icon"><Video size={40} /></span>
          <h3>No lectures in this view</h3>
          <p>{emptyCopy[activeTab] || emptyCopy.all}</p>
          {activeFilters.length > 0 && (
            <button type="button" className="lec-reset-filters-btn" onClick={resetFilters}>Reset all filters</button>
          )}
        </div>
      ) : (
        <>
          <div className={`student-lec-${viewMode}`} key={`${activeTab}-${safePage}-${viewMode}`}>
            {pageItems.map((lec, idx) => (
              <LectureCard
                key={getId(lec) || lec.title}
                lec={lec}
                index={idx}
                bookmarked={bookmarkSet.has(getId(lec))}
                onOpen={setActiveLecture}
                onToggleBookmark={toggleBookmark}
                onShare={shareLecture}
                onDownloadVideo={handleDownloadVideo}
                downloadingId={downloadingFileId}
                downloadProgress={downloadProgress}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="lec-pagination" aria-label="Pagination">
              <button type="button" className="lec-page-btn" onClick={() => goToPage(safePage - 1)} disabled={safePage === 1} aria-label="Previous page">
                <ChevronLeft size={16} />
              </button>
              {buildPageList(safePage, totalPages).map((p) =>
                typeof p === "string" ? (
                  <span key={p} className="lec-page-gap">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    className={`lec-page-btn ${p === safePage ? "active" : ""}`}
                    onClick={() => goToPage(p)}
                    aria-current={p === safePage ? "page" : undefined}
                  >
                    {p}
                  </button>
                )
              )}
              <button type="button" className="lec-page-btn" onClick={() => goToPage(safePage + 1)} disabled={safePage === totalPages} aria-label="Next page">
                <ChevronRight size={16} />
              </button>
            </nav>
          )}
        </>
      )}

      {/* Back to top */}
      <button
        type="button"
        className={`lec-top-fab ${showTop ? "show" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >
        <ArrowUp size={18} />
      </button>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* Player (portaled so nothing can clip it) */}
      {activeLecture &&
        createPortal(
          <AdvancedVideoPlayer
            key={activeLecture.id}
            lecture={activeLecture}
            playlist={displayLectures}
            nextLecture={nextLecture}
            onClose={() => setActiveLecture(null)}
            onNavigate={handleNavigate}
            onSelect={setActiveLecture}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onProgressSaved={handleProgressSaved}
            onWatchTick={handleWatchTick}
            studentUser={currentUser}
            bookmarked={bookmarkSet.has(getId(activeLecture))}
            onToggleBookmark={toggleBookmark}
            notify={pushToast}
            onDownloadVideo={handleDownloadVideo}
            onDownloadResource={handleDownloadResource}
          />,
          document.body
        )}
    </div>
  );
}