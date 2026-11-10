import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Clock,
  Calendar,
  MapPin,
  User,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Download,
  Search,
  X,
  RefreshCw,
  LayoutGrid,
  CalendarDays,
  Sparkles,
  BookOpen,
  Building2
} from "lucide-react";
import { authApi } from "../../services/authApi";
import OfficialCollegeTimetableGrid from "../../components/timetable/OfficialCollegeTimetableGrid";
import "./StudentTheme.css";
import "./StudentTimetable.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3.0;
const ZOOM_STEP = 0.2;

const clampZoom = (z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(z.toFixed(1))));

/* ---------- Small presentational pieces ---------- */

function PhotoControls({ zoom, setZoom, size = 15, onFullscreenToggle, isFullscreen, imageUrl }) {
  return (
    <div className="std-photo-controls" role="group" aria-label="Timetable image controls">
      <button
        type="button"
        className="std-photo-btn"
        onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
        disabled={zoom <= ZOOM_MIN}
        title="Zoom out"
        aria-label="Zoom out"
      >
        <ZoomOut size={size} />
      </button>
      <span className="std-photo-zoom-text" aria-live="polite">
        {Math.round(zoom * 100)}%
      </span>
      <button
        type="button"
        className="std-photo-btn"
        onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
        disabled={zoom >= ZOOM_MAX}
        title="Zoom in"
        aria-label="Zoom in"
      >
        <ZoomIn size={size} />
      </button>
      <button
        type="button"
        className="std-photo-btn"
        onClick={() => setZoom(1.0)}
        title="Reset zoom (100%)"
        aria-label="Reset zoom"
      >
        <RotateCcw size={size - 1} />
      </button>
      <button
        type="button"
        className="std-photo-btn"
        onClick={onFullscreenToggle}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen view"}
        aria-label={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}
      >
        {isFullscreen ? <Minimize2 size={size} /> : <Maximize2 size={size} />}
      </button>
      {imageUrl && !isFullscreen && (
        <a
          href={imageUrl}
          download="official_timetable.jpg"
          target="_blank"
          rel="noreferrer"
          className="std-photo-btn"
          title="Download high-resolution image"
          aria-label="Download high-resolution image"
        >
          <Download size={size} />
        </a>
      )}
    </div>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="std-skeleton-wrapper" aria-hidden="true">
      <div className="std-skel-hero" />
      <div className="std-skel-grid-table">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="std-skel-row">
            <span className="std-skel std-skel-day" />
            <span className="std-skel std-skel-slot" />
            <span className="std-skel std-skel-slot" />
            <span className="std-skel std-skel-slot" />
            <span className="std-skel std-skel-slot" />
            <span className="std-skel std-skel-slot" />
            <span className="std-skel std-skel-lunch" />
            <span className="std-skel std-skel-lab" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, children, action }) {
  return (
    <div className="std-empty-box" role="status">
      <div className="std-empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action && <div className="std-empty-action">{action}</div>}
    </div>
  );
}

/* ---------- Main Component ---------- */

export default function StudentTimetable({ stats, currentUser }) {
  const todayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const initialDay = DAYS.includes(todayName) ? todayName : "Monday";

  const [scheduleData, setScheduleData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [selectedDayFilter, setSelectedDayFilter] = useState("All");
  // Default to the full authentic matrix table view
  const [viewMode, setViewMode] = useState("table"); // "table" | "cards"
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [fullscreen, setFullscreen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [query, setQuery] = useState("");
  const tabRefs = useRef({});

  /* 3-Tier Multi-Gateway Timetable Fetcher */
  const fetchStudentSchedule = useCallback(async () => {
    setLoading(true);
    setLoadError(false);

    try {
      // 1. Primary: Student personalized schedule endpoint
      const res = await authApi.getStudentClassSchedule().catch(() => null);
      if (res?.success && res?.timetable && (res.timetable.scheduleDays?.length > 0 || res.timetable.imageUrl)) {
        setScheduleData(res);
        setLoading(false);
        return;
      }

      // 2. Secondary: Published master timetable query
      const pubRes = await authApi.getPublishedTimetable({
        branch: currentUser?.branch || "CSE",
        semester: currentUser?.semester || "Semester 5"
      }).catch(() => null);

      if (pubRes?.success && pubRes?.timetable && (pubRes.timetable.scheduleDays?.length > 0 || pubRes.timetable.imageUrl)) {
        setScheduleData({
          success: true,
          branch: pubRes.branch || currentUser?.branch || "CSE",
          semester: pubRes.semester || currentUser?.semester || "Semester 5",
          section: pubRes.section || "A",
          today: todayName,
          timetable: pubRes.timetable
        });
        setLoading(false);
        return;
      }

      // 3. Fallback: General timetable service
      const fallbackRes = await authApi.getTimetable().catch(() => null);
      if (fallbackRes?.success || fallbackRes?.timetable) {
        const days = Array.isArray(fallbackRes.timetable)
          ? fallbackRes.timetable
          : fallbackRes.masterTimetable?.scheduleDays || [];

        setScheduleData({
          success: true,
          branch: fallbackRes.branch || currentUser?.branch || "CSE",
          semester: fallbackRes.semester || currentUser?.semester || "Semester 5",
          section: "A",
          today: todayName,
          timetable: fallbackRes.masterTimetable || { scheduleDays: days }
        });
        setLoading(false);
        return;
      }

      // If all tiers returned empty but didn't crash
      if (res?.success) {
        setScheduleData(res);
      } else {
        setScheduleData(null);
      }
    } catch (err) {
      console.error("Student schedule fetch error:", err);
      setLoadError(true);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser, todayName]);

  useEffect(() => {
    let ignore = false;
    fetchStudentSchedule();
    return () => {
      ignore = true;
    };
  }, [fetchStudentSchedule, reloadKey]);

  /* Manual refresh button handler */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStudentSchedule();
  };

  /* Fullscreen: Escape to close, lock page scroll while open. */
  useEffect(() => {
    if (!fullscreen) return undefined;
    const onKey = (e) => e.key === "Escape" && setFullscreen(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [fullscreen]);

  useEffect(() => setImageFailed(false), [scheduleData?.timetable?.imageUrl]);

  /* Derived data */
  const scheduleDays = useMemo(() => {
    const raw = scheduleData?.timetable?.scheduleDays || scheduleData?.timetable || [];
    return Array.isArray(raw) ? raw : [];
  }, [scheduleData]);

  const isImageBased =
    scheduleData?.timetable?.timetableType === "image_based" ||
    Boolean(scheduleData?.timetable?.imageUrl && (!scheduleDays || scheduleDays.length === 0));
  const imageUrl = scheduleData?.timetable?.imageUrl;
  const photoTitle = scheduleData?.timetable?.title || "Department Academic Timetable";
  const collegeName = scheduleData?.timetable?.collegeName || "SUBHARTI POLYTECHNIC COLLEGE, MEERUT";
  const effectiveDate = scheduleData?.timetable?.effectiveDate;
  const timetableVersion = scheduleData?.timetable?.version || 1;

  const branch = scheduleData?.branch || currentUser?.branch || "CSE";
  const semester = scheduleData?.semester || currentUser?.semester || "3RD / 5TH SEM";
  const section = scheduleData?.section || "A";

  const currentPeriod = scheduleData?.currentPeriod;
  const nextPeriod = scheduleData?.nextPeriod;

  const slotsByDay = useMemo(() => {
    const map = {};
    DAYS.forEach((d) => {
      const doc = scheduleDays.find((t) => t.dayOfWeek === d);
      map[d] = doc?.slots?.filter((s) => !s.isBreak) || [];
    });
    return map;
  }, [scheduleDays]);

  const slots = slotsByDay[selectedDay] || [];

  const visibleSlots = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return slots;
    return slots.filter((s) =>
      [s.subject, s.subjectCode, s.teacherName, s.roomNo].some((v) => v && String(v).toLowerCase().includes(q))
    );
  }, [slots, query]);

  const isLiveSlot = useCallback(
    (s) =>
      selectedDay === todayName &&
      currentPeriod &&
      currentPeriod.subject === s.subject &&
      currentPeriod.startTime === s.startTime,
    [selectedDay, todayName, currentPeriod]
  );

  /* Roving-tabindex keyboard support for the day tabs */
  const onTabKeyDown = (e, idx) => {
    let next = null;
    if (e.key === "ArrowRight") next = (idx + 1) % DAYS.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + DAYS.length) % DAYS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = DAYS.length - 1;
    if (next === null) return;
    e.preventDefault();
    setSelectedDay(DAYS[next]);
    tabRefs.current[DAYS[next]]?.focus();
  };

  /* Total weekly classes count */
  const totalWeeklyClasses = useMemo(() => {
    let count = 0;
    scheduleDays.forEach((d) => {
      count += (d.slots || []).filter((s) => !s.isBreak).length;
    });
    return count;
  }, [scheduleDays]);

  /* ---------- Render ---------- */
  return (
    <div className="std-tt-container">
      {/* 1. TOP HEADER STRIP */}
      <header className="std-pane-header std-no-print-actions">
        <div className="std-header-meta">
          <div className="std-header-badge-row">
            <span className="std-status-pill published">
              <CheckCircle2 size={12} /> Published Master Schedule
            </span>
            <span className="std-version-chip">v{timetableVersion}.0</span>
            <span className="std-cohort-chip">
              {branch} • {semester} (Section {section})
            </span>
          </div>
          <h1 className="std-title">Academic Timetable Matrix</h1>
          <p className="std-subtitle">
            Official curriculum lecture & practical laboratory timetable for Subharti Polytechnic College.
          </p>
        </div>

        <div className="std-header-actions">
          {/* VIEW SWITCHER */}
          {!isImageBased && (
            <div className="std-mode-toggle" role="group" aria-label="Timetable layout view">
              <button
                type="button"
                className={`std-mode-btn ${viewMode === "table" ? "active" : ""}`}
                aria-pressed={viewMode === "table"}
                onClick={() => setViewMode("table")}
                title="View full weekly matrix table (Subharti College format)"
              >
                <LayoutGrid size={14} />
                <span>Full Week Grid</span>
              </button>
              <button
                type="button"
                className={`std-mode-btn ${viewMode === "cards" ? "active" : ""}`}
                aria-pressed={viewMode === "cards"}
                onClick={() => setViewMode("cards")}
                title="View daily class periods for selected day"
              >
                <CalendarDays size={14} />
                <span>Daily Cards</span>
              </button>
            </div>
          )}

          {/* REFRESH BUTTON */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="std-btn-refresh"
            title="Refresh timetable from server"
            aria-label="Refresh timetable"
          >
            <RefreshCw size={14} className={isRefreshing || loading ? "std-spin" : ""} />
            <span className="std-hide-mobile">Refresh</span>
          </button>

          {/* PRINT BUTTON */}
          <button
            type="button"
            onClick={() => window.print()}
            className="std-btn-print"
            title="Print Official Timetable (A4 Landscape)"
            aria-label="Print timetable"
          >
            <Printer size={15} />
            <span>Print Sheet</span>
          </button>
        </div>
      </header>

      {/* 2. TODAY'S LIVE STATUS HERO BANNER */}
      {!loading && !loadError && (
        <section className="std-live-hero-card" aria-label="Today's class status">
          <div className="std-live-hero-left">
            <span className="std-live-tag">
              <span className="std-pulse-dot" /> Today is <strong>{scheduleData?.today || todayName}</strong>
            </span>

            {currentPeriod ? (
              <div className="std-live-current-box">
                <span className="std-live-status-label">Ongoing Lecture Session</span>
                <h3 className="std-live-sub-name">{currentPeriod.subject}</h3>
                <div className="std-live-details">
                  <span>
                    <Clock size={13} /> {currentPeriod.startTime} – {currentPeriod.endTime}
                  </span>
                  <span>
                    <MapPin size={13} /> Room: <strong>{currentPeriod.roomNo || "Room No. 302"}</strong>
                  </span>
                  <span>
                    <User size={13} /> {currentPeriod.teacherName || "Faculty Lead"}
                  </span>
                  <span className={`std-type-pill ${currentPeriod.type === "Practical" ? "practical" : "theory"}`}>
                    {currentPeriod.type || "Theory"}
                  </span>
                </div>
              </div>
            ) : nextPeriod ? (
              <div className="std-live-current-box">
                <span className="std-live-status-label">Next Scheduled Lecture</span>
                <h3 className="std-live-sub-name">{nextPeriod.subject}</h3>
                <div className="std-live-details">
                  <span>
                    <Clock size={13} /> Starts at {nextPeriod.startTime}
                  </span>
                  <span>
                    <MapPin size={13} /> Room: <strong>{nextPeriod.roomNo || "Room No. 302"}</strong>
                  </span>
                  <span>
                    <User size={13} /> {nextPeriod.teacherName || "Faculty Lead"}
                  </span>
                  <span className={`std-type-pill ${nextPeriod.type === "Practical" ? "practical" : "theory"}`}>
                    {nextPeriod.type || "Theory"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="std-live-current-box">
                <span className="std-live-status-label">Class Schedule Overview</span>
                <p className="std-live-done-text">
                  Academic schedule active for <strong>{branch}</strong> • <strong>{semester}</strong>.{" "}
                  {slotsByDay[todayName]?.length || 0} teaching sessions scheduled for today.
                </p>
              </div>
            )}
          </div>

          <div className="std-live-hero-right">
            <div className="std-stat-badge">
              <span className="std-stat-num">{slotsByDay[todayName]?.length || 0}</span>
              <span className="std-stat-lbl">Today's Classes</span>
            </div>
            <div className="std-stat-badge secondary">
              <span className="std-stat-num">{totalWeeklyClasses}</span>
              <span className="std-stat-lbl">Weekly Classes</span>
            </div>
          </div>
        </section>
      )}

      {/* 3. MAIN CONTENT: PHOTOGRAPH TIMETABLE OR MATRIX / CARDS */}
      {isImageBased && imageUrl ? (
        /* INTERACTIVE PHOTOGRAPH TIMETABLE VIEWER */
        <div className="std-image-tt-card">
          <div className="std-image-tt-header">
            <div className="std-image-tt-title-box">
              <span className="std-image-tt-college">{collegeName}</span>
              <h3 className="std-image-tt-title">{photoTitle}</h3>
              <div className="std-image-tt-meta-row">
                <span className="std-image-meta-pill">
                  {branch} Engineering • {semester} (Section {section})
                </span>
                {effectiveDate && (
                  <span className="std-image-meta-pill">
                    <Calendar size={12} /> Effective: {new Date(effectiveDate).toLocaleDateString()}
                  </span>
                )}
                <span className="std-image-verified-badge">
                  <CheckCircle2 size={13} /> Official Published Timetable
                </span>
              </div>
            </div>

            <PhotoControls
              zoom={zoom}
              setZoom={setZoom}
              imageUrl={imageUrl}
              onFullscreenToggle={() => setFullscreen(true)}
              isFullscreen={false}
            />
          </div>

          <div className="std-image-tt-viewport" tabIndex={0} aria-label="Scrollable timetable image">
            {imageFailed ? (
              <EmptyState icon={<AlertCircle size={36} color="#DC2626" />} title="Image could not be loaded">
                The timetable image is unavailable right now. Try the download button or reload the page.
              </EmptyState>
            ) : (
              <div className="std-image-tt-scroller" style={{ width: `${zoom * 100}%` }}>
                <img
                  src={imageUrl}
                  alt="Official academic timetable photograph"
                  className="std-image-tt-img"
                  onError={() => setImageFailed(true)}
                  draggable={false}
                />
              </div>
            )}
          </div>

          {/* FULLSCREEN OVERLAY MODAL */}
          {fullscreen && (
            <div className="std-photo-fs-backdrop" onClick={() => setFullscreen(false)}>
              <div
                className="std-photo-fs-content"
                role="dialog"
                aria-modal="true"
                aria-label={photoTitle}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="std-photo-fs-header">
                  <div>
                    <span className="std-photo-fs-college">{collegeName}</span>
                    <h4 className="std-photo-fs-title">{photoTitle}</h4>
                  </div>
                  <PhotoControls
                    zoom={zoom}
                    setZoom={setZoom}
                    size={16}
                    isFullscreen
                    onFullscreenToggle={() => setFullscreen(false)}
                  />
                </div>
                <div className="std-photo-fs-viewport">
                  <img
                    src={imageUrl}
                    alt="Official academic timetable fullscreen"
                    style={{ width: `${zoom * 100}%` }}
                    className="std-photo-fs-img"
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="std-content-panel" aria-busy={loading}>
          {loading ? (
            <>
              <span className="std-sr-only" role="status">
                Loading weekly schedule…
              </span>
              <ScheduleSkeleton />
            </>
          ) : loadError ? (
            <EmptyState
              icon={<AlertCircle size={42} color="#DC2626" />}
              title="Couldn't Load Timetable"
              action={
                <button
                  type="button"
                  className="std-btn-primary"
                  onClick={() => setReloadKey((k) => k + 1)}
                >
                  <RefreshCw size={14} /> Try Again
                </button>
              }
            >
              We encountered an issue communicating with the institutional server. Please check your network and try
              again.
            </EmptyState>
          ) : scheduleDays.length === 0 ? (
            <EmptyState
              icon={<Calendar size={42} color="#64748B" />}
              title="No Timetable Published Yet"
              action={
                <button type="button" className="std-btn-secondary" onClick={handleRefresh}>
                  <RefreshCw size={14} /> Check for Updates
                </button>
              }
            >
              The academic timetable for <strong>{branch}</strong> • <strong>{semester}</strong> is currently being
              finalized by the Academic Coordinator and will appear here as soon as it is published.
            </EmptyState>
          ) : viewMode === "table" ? (
            /* ==========================================================
               FULL WEEK MASTER MATRIX GRID VIEW (PRIMARY)
               ========================================================== */
            <div className="std-matrix-card">
              {/* DAY FILTER TOOLBAR */}
              <div className="std-grid-filter-bar no-print">
                <span className="std-filter-label">Filter Day:</span>
                <div className="std-filter-pills" role="group" aria-label="Filter matrix by day">
                  <button
                    type="button"
                    className={`std-filter-pill ${selectedDayFilter === "All" ? "active" : ""}`}
                    onClick={() => setSelectedDayFilter("All")}
                  >
                    All Days (Mon–Sat)
                  </button>
                  {DAYS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`std-filter-pill ${selectedDayFilter === d ? "active" : ""}`}
                      onClick={() => setSelectedDayFilter(d)}
                    >
                      {d.slice(0, 3)}
                      {d === todayName && <span className="std-filter-dot" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* AUTHENTIC SUBHARTI TIMETABLE MATRIX TABLE */}
              <OfficialCollegeTimetableGrid
                scheduleDays={scheduleDays}
                branch={branch}
                semester={semester}
                academicSession="2026-27"
                roomNo="ROOM NO.-302"
                selectedDayFilter={selectedDayFilter}
                editable={false}
              />
            </div>
          ) : (
            /* ==========================================================
               DAILY CARDS VIEW
               ========================================================== */
            <div className="std-daily-view-card">
              {/* DAY TABS */}
              <div className="std-day-tabs-bar" role="tablist" aria-label="Select day for period breakdown">
                {DAYS.map((day, idx) => {
                  const isToday = day === todayName;
                  const active = selectedDay === day;
                  const dayClassCount = (slotsByDay[day] || []).length;
                  return (
                    <button
                      key={day}
                      ref={(el) => (tabRefs.current[day] = el)}
                      type="button"
                      role="tab"
                      id={`std-tab-${day}`}
                      aria-selected={active}
                      aria-controls="std-day-panel"
                      tabIndex={active ? 0 : -1}
                      className={`std-day-btn ${active ? "active" : ""}`}
                      onClick={() => setSelectedDay(day)}
                      onKeyDown={(e) => onTabKeyDown(e, idx)}
                    >
                      <Calendar size={13} />
                      <span>{day}</span>
                      {isToday && <span className="std-today-pill">Today</span>}
                      <span className="std-day-slot-count">({dayClassCount})</span>
                    </button>
                  );
                })}
              </div>

              {/* CARDS CONTENT */}
              <div id="std-day-panel" role="tabpanel" aria-labelledby={`std-tab-${selectedDay}`}>
                {slots.length === 0 ? (
                  <EmptyState
                    icon={<Calendar size={42} color="#64748B" />}
                    title={`No Classes Scheduled on ${selectedDay}`}
                  >
                    No teaching sessions or laboratory batches scheduled for this day. Enjoy your free time or check
                    other days.
                  </EmptyState>
                ) : (
                  <>
                    <div className="std-search-row">
                      <label className="std-search" htmlFor="std-tt-search">
                        <Search size={15} aria-hidden="true" />
                        <input
                          id="std-tt-search"
                          type="search"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder={`Search ${selectedDay}'s classes by subject, teacher, or room`}
                        />
                        {query && (
                          <button
                            type="button"
                            className="std-search-clear"
                            onClick={() => setQuery("")}
                            aria-label="Clear search"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </label>
                      <span className="std-result-count" aria-live="polite">
                        {visibleSlots.length} of {slots.length} classes
                      </span>
                    </div>

                    {visibleSlots.length === 0 ? (
                      <EmptyState icon={<Search size={36} color="#64748B" />} title="No matching classes">
                        Nothing on {selectedDay} matches “{query}”. Try a subject name, code, or room number.
                      </EmptyState>
                    ) : (
                      <div className="std-tt-grid" key={selectedDay}>
                        {visibleSlots.map((s, idx) => {
                          const live = isLiveSlot(s);
                          const isPractical =
                            s.type === "Practical" ||
                            s.type === "lab" ||
                            s.periodNumber === 7 ||
                            s.subject?.toLowerCase().includes("lab");

                          return (
                            <article
                              key={`${s.startTime}-${s.subjectCode || s.subject}-${idx}`}
                              className={`std-tt-card ${isPractical ? "card-practical" : "card-theory"} ${
                                live ? "is-live" : ""
                              }`}
                              style={{ "--std-i": Math.min(idx, 8) }}
                            >
                              <div className="std-tt-card-top">
                                <div className="std-tt-time-chip">
                                  <Clock size={13} />
                                  <span>
                                    {s.startTime} – {s.endTime}
                                  </span>
                                </div>
                                <span className="std-tt-card-tags">
                                  {live && <span className="std-live-chip">Live Now</span>}
                                  <span className={`std-tt-type-pill ${isPractical ? "practical" : "theory"}`}>
                                    {isPractical ? "Practical / Lab" : "Theory"}
                                  </span>
                                </span>
                              </div>

                              <h3 className="std-tt-subject">{s.subject}</h3>
                              {s.subjectCode && <span className="std-tt-code">Code: {s.subjectCode}</span>}

                              <div className="std-tt-card-footer">
                                <span className="std-tt-meta-pill room">
                                  <MapPin size={13} />
                                  <span>{s.roomNo || "Room No. 302"}</span>
                                </span>
                                <span className="std-tt-meta-pill teacher">
                                  <User size={13} />
                                  <span>{s.teacherName || "Faculty Lead"}</span>
                                </span>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
