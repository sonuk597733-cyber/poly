import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  MessageSquare, Star, Send, ShieldCheck, CheckCircle2, Clock, Loader2,
  RefreshCw, Lock, Eye, AlertCircle, HeartHandshake, Search, ChevronDown,
  RotateCcw, Save, TrendingUp, Users, EyeOff, Check, Flag, ThumbsUp
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./StudentTheme.css";
import "./StudentFeedback.css";

/* ───────────── CONSTANTS ───────────── */
const METRICS = [
  { id: "delivery", label: "Lecture Clarity & Coursework Delivery", desc: "Clarity of concepts explained during class hours" },
  { id: "lab", label: "Laboratory & Practical Immersion", desc: "Guidance provided during hands-on lab experiments" },
  { id: "mentorship", label: "Faculty Mentorship & Doubt Resolution", desc: "Accessibility for doubts outside class schedule" },
  { id: "assessment", label: "Syllabus Coverage & Fair Assessment", desc: "Adherence to syllabus timelines and transparent marking" }
];

const RATING_LABELS = ["Tap to rate", "Poor", "Fair", "Good", "Very good", "Excellent"];

const POSITIVE_TAGS = ["Clear explanations", "Good pacing", "Helpful in labs", "Approachable", "Well prepared"];
const IMPROVE_TAGS = ["Slower pacing", "More examples", "Better notes", "More lab time", "Extra doubt sessions"];

const FALLBACK_OPTIONS = [
  "Coursework & Lecture Delivery (Department Wide)",
  "Laboratory & CNC Practical Immersion",
  "Academic Mentorship & Counseling",
  "Institutional Facilities & Library"
];

const MAX_COMMENT = 500;
const DRAFT_KEY = "std_feedback_draft_v2";
const EMPTY_RATINGS = { delivery: 0, lab: 0, mentorship: 0, assessment: 0 };

const FILTERS = [
  { id: "all", label: "All" },
  { id: "anon", label: "Anonymous" },
  { id: "verified", label: "Verified" },
  { id: "low", label: "Needs attention" }
];

/* ───────────── HELPERS ───────────── */
const loadDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const statusStage = (status = "") => {
  const s = status.toLowerCase();
  if (s.includes("resolv") || s.includes("closed")) return 3;
  if (s.includes("pend") || s.includes("submit")) return 1;
  return 2;
};

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "Recent Session";

/* ───────────── SUB COMPONENTS ───────────── */
function StarRating({ value, onChange, label }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="std-fb-stars-picker" role="radiogroup" aria-label={label} onMouseLeave={() => setHover(0)}>
      <div className="std-fb-stars-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} of 5 stars`}
            className={`std-star-btn ${star <= shown ? "active" : ""} ${value === star ? "pop" : ""}`}
            onMouseEnter={() => setHover(star)}
            onFocus={() => setHover(star)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(star)}
          >
            <Star size={22} fill={star <= shown ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
      <span className={`std-star-num ${shown ? "set" : ""}`}>{RATING_LABELS[shown]}</span>
    </div>
  );
}

function ScoreRing({ score, rated }) {
  const R = 34;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - score / 5);
  return (
    <div className="std-fb-ring" aria-label={`Overall score ${score} out of 5`}>
      <svg viewBox="0 0 80 80" width="84" height="84">
        <circle className="std-fb-ring-track" cx="40" cy="40" r={R} />
        <circle
          className="std-fb-ring-fill"
          cx="40" cy="40" r={R}
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform="rotate(-90 40 40)"
        />
      </svg>
      <div className="std-fb-ring-center">
        <strong>{rated ? score.toFixed(1) : "–"}</strong>
        <small>/ 5</small>
      </div>
    </div>
  );
}

function Stars({ value, size = 14 }) {
  return (
    <div className="std-fb-stars-static">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          fill={s <= Math.round(value) ? "#FBBF24" : "none"}
          color={s <= Math.round(value) ? "#FBBF24" : "#64748B"}
        />
      ))}
    </div>
  );
}

/* ───────────── MAIN COMPONENT ───────────── */
export default function StudentFeedback({ showToast }) {
  const draft = useMemo(loadDraft, []);

  const [faculty, setFaculty] = useState("");
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [customSubject, setCustomSubject] = useState("");
  const [category, setCategory] = useState(draft?.category || "feedback");
  const [ratings, setRatings] = useState(draft?.ratings || EMPTY_RATINGS);
  const [tags, setTags] = useState(draft?.tags || []);
  const [comments, setComments] = useState(draft?.comments || "");
  const [isAnonymous, setIsAnonymous] = useState(draft?.isAnonymous ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const [feedbackList, setFeedbackList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  /* ── data fetching ── */
  const fetchFeedbacks = useCallback(() => {
    setLoadingList(true);
    authApi
      .getFeedback()
      .then((res) => {
        if (res?.feedbacks) setFeedbackList(res.feedbacks);
      })
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    fetchFeedbacks();
    let ignore = false;

    const useFallback = () => {
      if (ignore) return;
      setFacultyOptions(FALLBACK_OPTIONS);
      setFaculty(draft?.faculty && FALLBACK_OPTIONS.includes(draft.faculty) ? draft.faculty : FALLBACK_OPTIONS[0]);
    };

    authApi
      .getTimetable()
      .then((res) => {
        if (ignore) return;
        const map = new Map();
        (res?.timetable || []).forEach((d) =>
          (d.slots || []).forEach((s) => {
            if (s.teacherName && s.subject) {
              const label = `${s.teacherName} — ${s.subject}`;
              map.set(label, label);
            }
          })
        );
        const opts = Array.from(map.values());
        if (opts.length) {
          setFacultyOptions(opts);
          setFaculty(draft?.faculty && opts.includes(draft.faculty) ? draft.faculty : opts[0]);
        } else useFallback();
      })
      .catch(useFallback);

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFeedbacks]);

  /* ── draft autosave ── */
  useEffect(() => {
    if (submitted) return;
    const hasContent = comments || tags.length || Object.values(ratings).some(Boolean);
    if (!hasContent) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ faculty, category, ratings, tags, comments, isAnonymous })
        );
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 1600);
      } catch {
        /* storage unavailable — ignore */
      }
    }, 800);
    return () => clearTimeout(t);
  }, [faculty, category, ratings, tags, comments, isAnonymous, submitted]);

  /* ── derived values ── */
  const ratedCount = Object.values(ratings).filter((v) => v > 0).length;
  const allRated = ratedCount === METRICS.length;
  const avgScore = ratedCount
    ? Number((Object.values(ratings).reduce((a, b) => a + b, 0) / ratedCount).toFixed(1))
    : 0;

  const stats = useMemo(() => {
    const total = feedbackList.length;
    const avg = total
      ? feedbackList.reduce((a, f) => a + (Number(f.overallRating) || 0), 0) / total
      : 0;
    const anon = feedbackList.filter((f) => f.isAnonymous).length;
    return { total, avg, anon };
  }, [feedbackList]);

  const filteredList = useMemo(() => {
    const q = query.trim().toLowerCase();
    return feedbackList.filter((f) => {
      if (filter === "anon" && !f.isAnonymous) return false;
      if (filter === "verified" && f.isAnonymous) return false;
      if (filter === "low" && (Number(f.overallRating) || 5) > 3) return false;
      if (q && !`${f.faculty || ""} ${f.comments || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [feedbackList, filter, query]);

  /* ── handlers ── */
  const setRating = (id, val) => setRatings((p) => ({ ...p, [id]: val }));
  const toggleTag = (t) =>
    setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const resetForm = () => {
    setRatings(EMPTY_RATINGS);
    setTags([]);
    setComments("");
    setCustomSubject("");
    setCategory("feedback");
    setIsAnonymous(true);
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const subjectTarget = faculty === "Other (Specify)" ? customSubject.trim() : faculty;
    if (!subjectTarget) {
      showToast?.("Please specify the faculty or coursework module.", true);
      return;
    }
    if (!allRated) {
      showToast?.("Please rate all four areas before submitting.", true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.submitFeedback({
        faculty: subjectTarget,
        ratings,
        overallRating: avgScore,
        comments: comments.trim() || "Constructive academic feedback submitted.",
        isAnonymous,
        category,
        tags
      });
      showToast?.(res?.message || "Academic feedback submitted directly to HOD & Dean.");
      resetForm();
      setSubmitted(true);
      fetchFeedbacks();
    } catch (err) {
      showToast?.(err.message || "Failed to submit feedback.", true);
    } finally {
      setSubmitting(false);
    }
  };

  const isGrievance = category === "grievance";

  /* ───────────── RENDER ───────────── */
  return (
    <div className="student-role-view std-feedback-page">
      {/* HEADER */}
      <div className="std-pane-header std-fb-reveal" style={{ "--d": "0ms" }}>
        <div className="std-pane-title-group">
          <div className="std-title-icon-badge">
            <MessageSquare size={22} />
          </div>
          <div>
            <h2>Institutional Faculty Feedback & Grievances</h2>
            <p>Direct, encrypted academic appraisal reviewed by HOD and Dean of Academic Affairs.</p>
          </div>
        </div>
        <div className="std-pane-actions">
          <button type="button" className="std-fb-ghost-btn" onClick={fetchFeedbacks} title="Refresh feedback submissions">
            <RefreshCw size={14} className={loadingList ? "std-fb-spin" : ""} />
            <span>Sync History</span>
          </button>
        </div>
      </div>

      {/* STAT STRIP */}
      <div className="std-fb-stats std-fb-reveal" style={{ "--d": "80ms" }}>
        <div className="std-fb-stat">
          <span className="std-fb-stat-ico"><Users size={16} /></span>
          <div><strong>{stats.total}</strong><small>Appraisals submitted</small></div>
        </div>
        <div className="std-fb-stat">
          <span className="std-fb-stat-ico gold"><TrendingUp size={16} /></span>
          <div><strong>{stats.total ? stats.avg.toFixed(1) : "–"}</strong><small>Your average score</small></div>
        </div>
        <div className="std-fb-stat">
          <span className="std-fb-stat-ico green"><EyeOff size={16} /></span>
          <div><strong>{stats.anon}</strong><small>Sent anonymously</small></div>
        </div>
      </div>

      <div className="std-feedback-bento-grid">
        {/* ───────── FORM CARD ───────── */}
        <div className="std-feedback-form-card std-fb-reveal" style={{ "--d": "160ms" }}>
          {submitted && (
            <div className="std-fb-success" role="status">
              <svg className="std-fb-check" viewBox="0 0 52 52" aria-hidden="true">
                <circle cx="26" cy="26" r="24" />
                <path d="M15 27l8 8 14-16" />
              </svg>
              <h3>Appraisal submitted</h3>
              <p>Your feedback has reached the HOD and Dean. You can track it in Appraisal History.</p>
              <button type="button" className="std-fb-submit" onClick={() => setSubmitted(false)}>
                <span>Write another appraisal</span>
              </button>
            </div>
          )}

          <div className="std-fb-form-header">
            <div>
              <h3>Submit Coursework Appraisal</h3>
              <p>Evaluate your instructor's teaching methodology and practical guidance.</p>
            </div>
            <div className={`std-confidential-pill ${isAnonymous ? "" : "verified"}`}>
              {isAnonymous ? <Lock size={12} /> : <Eye size={12} />}
              <span>{isAnonymous ? "100% Anonymous" : "Verified Scholar"}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="std-fb-form">
            {/* Category switch */}
            <div className="std-fb-segment" role="tablist" aria-label="Submission type">
              <button
                type="button" role="tab" aria-selected={!isGrievance}
                className={!isGrievance ? "on" : ""}
                onClick={() => setCategory("feedback")}
              >
                <ThumbsUp size={14} /> Feedback
              </button>
              <button
                type="button" role="tab" aria-selected={isGrievance}
                className={isGrievance ? "on danger" : ""}
                onClick={() => setCategory("grievance")}
              >
                <Flag size={14} /> Grievance
              </button>
            </div>

            {isGrievance && (
              <div className="std-fb-alert">
                <AlertCircle size={16} />
                <span>Grievances are marked high priority and go to the HOD first, then the Dean if unresolved.</span>
              </div>
            )}

            {/* Faculty */}
            <div className="std-fb-form-group">
              <label htmlFor="fb-faculty">Select Faculty Member & Subject</label>
              <select
                id="fb-faculty"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                className="std-fb-select"
                required
              >
                {facultyOptions.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
                <option value="Other (Specify)">Other Coursework Module (Specify Below)</option>
              </select>
            </div>

            {faculty === "Other (Specify)" && (
              <div className="std-fb-form-group std-fb-slide-in">
                <label htmlFor="fb-custom">Specify Subject / Department</label>
                <input
                  id="fb-custom"
                  type="text"
                  placeholder="e.g. Applied Mechanics Workshop"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="std-fb-input"
                  required
                />
              </div>
            )}

            {/* Ratings + live ring */}
            <div className="std-fb-metrics-wrap">
              <div className="std-fb-metrics-head">
                <ScoreRing score={avgScore} rated={ratedCount > 0} />
                <div className="std-fb-metrics-head-text">
                  <strong>Overall score</strong>
                  <small>{ratedCount} of {METRICS.length} areas rated</small>
                  <div className="std-fb-progress"><span style={{ width: `${(ratedCount / METRICS.length) * 100}%` }} /></div>
                </div>
              </div>

              <div className="std-fb-metrics-list">
                {METRICS.map((m) => (
                  <div key={m.id} className="std-fb-metric-row">
                    <div className="std-fb-metric-info">
                      <span className="std-fb-metric-label">
                        {ratings[m.id] > 0 && <Check size={13} className="std-fb-tick" />}
                        {m.label}
                      </span>
                      <small className="std-fb-metric-desc">{m.desc}</small>
                    </div>
                    <StarRating value={ratings[m.id]} onChange={(v) => setRating(m.id, v)} label={m.label} />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick tags */}
            <div className="std-fb-form-group">
              <label>What stood out? (Optional)</label>
              <div className="std-fb-chip-group">
                {POSITIVE_TAGS.map((t) => (
                  <button
                    key={t} type="button" aria-pressed={tags.includes(t)}
                    className={`std-fb-chip good ${tags.includes(t) ? "on" : ""}`}
                    onClick={() => toggleTag(t)}
                  >
                    {tags.includes(t) && <Check size={12} />}{t}
                  </button>
                ))}
                {IMPROVE_TAGS.map((t) => (
                  <button
                    key={t} type="button" aria-pressed={tags.includes(t)}
                    className={`std-fb-chip improve ${tags.includes(t) ? "on" : ""}`}
                    onClick={() => toggleTag(t)}
                  >
                    {tags.includes(t) && <Check size={12} />}{t}
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="std-fb-form-group">
              <label htmlFor="fb-comments">
                {isGrievance ? "Describe your grievance" : "Constructive observations (Optional)"}
              </label>
              <textarea
                id="fb-comments"
                rows={4}
                maxLength={MAX_COMMENT}
                placeholder="Mention specific areas where lecture pacing, practical demonstrations, or course notes can be improved..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="std-fb-textarea"
              />
              <div className="std-fb-counter-row">
                <span className={`std-fb-draft ${draftSaved ? "show" : ""}`}><Save size={11} /> Draft saved</span>
                <span className={comments.length > MAX_COMMENT * 0.9 ? "warn" : ""}>
                  {comments.length} / {MAX_COMMENT}
                </span>
              </div>
            </div>

            {/* Anonymous switch */}
            <label className="std-fb-toggle-row">
              <span className="std-fb-checkbox-text">
                <strong>Submit anonymously</strong>
                Your name and roll number will not be shown to the faculty member.
              </span>
              <input
                type="checkbox" className="std-fb-switch" role="switch"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
            </label>

            {/* Actions */}
            <div className="std-fb-actions">
              <button type="button" className="std-fb-ghost-btn" onClick={resetForm} disabled={submitting}>
                <RotateCcw size={14} /> <span>Clear</span>
              </button>
              <button type="submit" className="std-fb-submit" disabled={submitting || !allRated}>
                {submitting ? <Loader2 size={16} className="std-fb-spin" /> : <Send size={16} />}
                <span>{submitting ? "Submitting…" : "Submit to Dean"}</span>
              </button>
            </div>
            {!allRated && <p className="std-fb-hint">Rate all four areas to enable submit.</p>}
          </form>
        </div>

        {/* ───────── HISTORY CARD ───────── */}
        <div className="std-feedback-history-card std-fb-reveal" style={{ "--d": "240ms" }}>
          <div className="std-fb-card-header">
            <div>
              <h3>Appraisal History &amp; Actions</h3>
              <p>Status of your submitted feedback tickets.</p>
            </div>
            <span className="std-res-verified-pill std-fb-count">
              <CheckCircle2 size={13} /> {feedbackList.length} Logged
            </span>
          </div>

          <div className="std-fb-search">
            <Search size={15} />
            <input
              type="search" placeholder="Search faculty or comments"
              value={query} onChange={(e) => setQuery(e.target.value)}
              aria-label="Search appraisal history"
            />
          </div>

          <div className="std-fb-filters" role="tablist" aria-label="Filter history">
            {FILTERS.map((f) => (
              <button
                key={f.id} type="button" role="tab" aria-selected={filter === f.id}
                className={filter === f.id ? "on" : ""}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loadingList ? (
            <div className="std-fb-history-list" aria-busy="true">
              {[0, 1, 2].map((i) => <div key={i} className="std-fb-skeleton" />)}
            </div>
          ) : feedbackList.length === 0 ? (
            <div className="std-fb-empty">
              <HeartHandshake size={38} />
              <p>No appraisals yet</p>
              <small>Rate your first course on the left. Your feedback shapes classroom and lab quality.</small>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="std-fb-empty">
              <Search size={32} />
              <p>No matches</p>
              <small>Try a different filter or search term.</small>
            </div>
          ) : (
            <div className="std-fb-history-list">
              {filteredList.map((item, idx) => {
                const id = item._id || item.id || idx;
                const open = expandedId === id;
                const stage = statusStage(item.status);
                const score = Number(item.overallRating) || 5;
                return (
                  <div key={id} className={`std-fb-history-item ${open ? "open" : ""}`}>
                    <button
                      type="button" className="std-fb-history-head"
                      aria-expanded={open} onClick={() => setExpandedId(open ? null : id)}
                    >
                      <div className="std-fb-history-main">
                        <h4 className="std-fb-history-title">{item.faculty || "Academic Coursework"}</h4>
                        <span className="std-fb-history-date">
                          <Clock size={11} /> {formatDate(item.createdAt)}
                          {item.isAnonymous && <em className="std-fb-anon-tag"><EyeOff size={10} /> Anonymous</em>}
                        </span>
                      </div>
                      <div className="std-fb-history-side">
                        <span className={`std-fb-status s${stage}`}>{item.status || "Acknowledged by HOD"}</span>
                        <ChevronDown size={16} className="std-fb-chevron" />
                      </div>
                    </button>

                    <div className="std-fb-score-line">
                      <Stars value={score} />
                      <span className="std-fb-score-val">{score.toFixed(1)} / 5.0</span>
                    </div>

                    <div className="std-fb-expand">
                      <div className="std-fb-expand-inner">
                        {item.comments && <p className="std-fb-history-comm">“{item.comments}”</p>}

                        {item.ratings && (
                          <div className="std-fb-breakdown">
                            {METRICS.map((m) => (
                              <div key={m.id} className="std-fb-bar-row">
                                <span>{m.label.split(" & ")[0]}</span>
                                <div className="std-fb-bar"><i style={{ width: `${((item.ratings[m.id] || 0) / 5) * 100}%` }} /></div>
                                <b>{item.ratings[m.id] || 0}</b>
                              </div>
                            ))}
                          </div>
                        )}

                        {Array.isArray(item.tags) && item.tags.length > 0 && (
                          <div className="std-fb-chip-group small">
                            {item.tags.map((t) => <span key={t} className="std-fb-chip static">{t}</span>)}
                          </div>
                        )}

                        <ol className="std-fb-timeline">
                          {["Submitted", "Reviewed by HOD", "Closed by Dean"].map((s, i) => (
                            <li key={s} className={i < stage ? "done" : ""}><span />{s}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="std-fb-policy">
            <ShieldCheck size={26} />
            <div>
              <strong>Internal Quality Assurance Cell (IQAC):</strong> All student appraisals are reviewed by the University IQAC and Academic Council to elevate technical curricula.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}