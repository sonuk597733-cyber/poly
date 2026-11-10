import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Sparkles,
  Send,
  Calendar,
  Layers,
  Award,
  Download,
  ExternalLink,
  Paperclip,
  Check,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  ArrowUpDown,
  GraduationCap,
  Save,
  HelpCircle,
  FileDown,
  ChevronDown,
  LayoutGrid,
  List,
  CheckCheck,
  Bold,
  Italic,
  ListOrdered,
  List as ListIcon,
  Quote,
  Heading1,
  Heading2,
  Code
} from "lucide-react";
import { authApi } from "../../services/authApi";
import AssignmentPreviewModal from "../../components/assignment/AssignmentPreviewModal";
import "./StudentTheme.css";
import "./StudentAssignments.css";

/* ==========================================================================
   CONSTANTS & HELPERS
   ========================================================================== */
const STATUS_TABS = [
  { id: "all", label: "All Assignments", icon: BookOpen },
  { id: "pending", label: "Pending", icon: Clock },
  { id: "submitted", label: "Submitted", icon: Send },
  { id: "evaluated", label: "Evaluated & Graded", icon: Award },
  { id: "correction_required", label: "Correction Required", icon: AlertTriangle },
  { id: "overdue", label: "Overdue", icon: AlertCircle },
  { id: "draft", label: "Saved Drafts", icon: Save }
];

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

function formatDeadlineCountdown(dueIso) {
  if (!dueIso) return { text: "No deadline", isUrgent: false, isOverdue: false };
  const diffMs = new Date(dueIso).getTime() - Date.now();
  if (diffMs < 0) {
    const pastDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    return {
      text: pastDays === 0 ? "Expired today" : `Overdue by ${pastDays} day${pastDays === 1 ? "" : "s"}`,
      isUrgent: false,
      isOverdue: true
    };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 2) {
    return { text: `${diffDays} days remaining`, isUrgent: false, isOverdue: false };
  }
  if (diffHours >= 1) {
    return { text: `${diffHours} hours remaining`, isUrgent: true, isOverdue: false };
  }
  return { text: "Due in less than 1 hour!", isUrgent: true, isOverdue: false };
}

/* ==========================================================================
   MAIN COMPONENT: StudentAssignments
   ========================================================================== */
export default function StudentAssignments({ currentUser, showToast }) {
  const [assignments, setAssignments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters & Search
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [sortBy, setSortBy] = useState("dueDateAsc");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Workspace & Preview Modal States
  const [previewAsgn, setPreviewAsgn] = useState(null);
  const [previewInitialTab, setPreviewInitialTab] = useState("overview");
  const [activeWorkspaceAsgn, setActiveWorkspaceAsgn] = useState(null);
  const [workspaceMode, setWorkspaceMode] = useState("details"); // "details" | "solve" | "result"
  const [answerText, setAnswerText] = useState("");
  const [stagedFiles, setStagedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [receiptConfirmation, setReceiptConfirmation] = useState(null);

  // Fetch Assignments
  const fetchAssignments = useCallback(() => {
    setLoading(true);
    setError(null);
    authApi
      .getAssignments({ sortBy })
      .then((res) => {
        setAssignments(res?.assignments || []);
        if (res?.statistics) setStatistics(res.statistics);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load coursework assignments.");
        setLoading(false);
      });
  }, [sortBy]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments, refreshKey]);

  // Derived Subjects & Categories
  const availableSubjects = useMemo(() => {
    const set = new Set();
    assignments.forEach((a) => a.subject && set.add(a.subject));
    return Array.from(set).sort();
  }, [assignments]);

  const availableCategories = useMemo(() => {
    const set = new Set();
    assignments.forEach((a) => a.category && set.add(a.category));
    return Array.from(set).sort();
  }, [assignments]);

  // Filtered List
  const filteredAssignments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return assignments.filter((asgn) => {
      // Tab Filtering
      if (activeTab === "pending" && asgn.effectiveStatus !== "pending") return false;
      if (activeTab === "submitted" && !["submitted", "late", "under_review", "resubmitted"].includes(asgn.effectiveStatus)) return false;
      if (activeTab === "evaluated" && asgn.effectiveStatus !== "evaluated") return false;
      if (activeTab === "correction_required" && asgn.effectiveStatus !== "correction_required") return false;
      if (activeTab === "overdue" && asgn.effectiveStatus !== "overdue") return false;
      if (activeTab === "draft" && asgn.effectiveStatus !== "draft") return false;

      // Dropdown Filters
      if (selectedSubject !== "all" && asgn.subject !== selectedSubject) return false;
      if (selectedCategory !== "all" && asgn.category !== selectedCategory) return false;
      if (selectedPriority !== "all" && asgn.priority !== selectedPriority) return false;

      // Search Query
      if (q) {
        const pool = [
          asgn.title,
          asgn.description,
          asgn.shortDescription,
          asgn.subject,
          asgn.subjectCode,
          asgn.unit,
          asgn.creatorName
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!pool.includes(q)) return false;
      }
      return true;
    });
  }, [assignments, activeTab, selectedSubject, selectedCategory, selectedPriority, searchQuery]);

  // KPI Statistics
  const totalCount = statistics?.total ?? assignments.length;
  const pendingCount = statistics?.pending ?? assignments.filter((a) => a.effectiveStatus === "pending").length;
  const submittedCount = statistics?.submitted ?? assignments.filter((a) => ["submitted", "late", "under_review", "resubmitted"].includes(a.effectiveStatus)).length;
  const evaluatedCount = statistics?.evaluated ?? assignments.filter((a) => a.effectiveStatus === "evaluated").length;
  const overdueCount = statistics?.overdue ?? assignments.filter((a) => a.effectiveStatus === "overdue").length;
  const correctionCount = statistics?.correctionRequired ?? assignments.filter((a) => a.effectiveStatus === "correction_required").length;

  const completedSubmissionsCount = assignments.filter((a) =>
    ["submitted", "late", "under_review", "resubmitted", "evaluated"].includes(a.effectiveStatus)
  ).length;
  const completionRate = totalCount > 0 ? Math.round((completedSubmissionsCount / totalCount) * 100) : 0;

  // Open Workspace
  const handleOpenWorkspace = (asgn, initialMode = "details") => {
    setActiveWorkspaceAsgn(asgn);
    setReceiptConfirmation(null);

    const userSub = asgn.userSubmission;
    if (userSub) {
      setAnswerText(userSub.answerText || userSub.submissionText || "");
      if (initialMode === "details" && asgn.effectiveStatus === "evaluated") {
        setWorkspaceMode("result");
      } else if (initialMode === "details" && asgn.effectiveStatus === "correction_required") {
        setWorkspaceMode("solve");
      } else {
        setWorkspaceMode(initialMode);
      }
    } else {
      setAnswerText("");
      setWorkspaceMode(initialMode);
    }
    setStagedFiles([]);
  };

  const handleCloseWorkspace = () => {
    setActiveWorkspaceAsgn(null);
    setAnswerText("");
    setStagedFiles([]);
    setReceiptConfirmation(null);
  };

  // Keyboard shortcut to close workspace (ESC)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && activeWorkspaceAsgn) {
        handleCloseWorkspace();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeWorkspaceAsgn]);

  // Stage Files via Dropzone or Input
  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || e.target?.files || []);
    if (!files.length) return;

    const maxMB = activeWorkspaceAsgn?.maxFileSizeMB || 50;
    const valid = [];
    for (const f of files) {
      if (f.size > maxMB * 1024 * 1024) {
        showToast?.(`File "${f.name}" exceeds the maximum limit of ${maxMB} MB.`, true);
        continue;
      }
      valid.push(f);
    }
    setStagedFiles((prev) => [...prev, ...valid].slice(0, 5));
  };

  const handleRemoveStagedFile = (idx) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Editor Formatting Helper
  const applyFormatting = (tag) => {
    const textarea = document.getElementById("student-answer-textarea");
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = answerText.substring(start, end);

    let replacement = "";
    switch (tag) {
      case "bold": replacement = `**${selected || "bold text"}**`; break;
      case "italic": replacement = `*${selected || "italic text"}*`; break;
      case "h1": replacement = `\n# ${selected || "Main Heading"}\n`; break;
      case "h2": replacement = `\n## ${selected || "Sub Heading"}\n`; break;
      case "ul": replacement = `\n- ${selected || "List item"}\n`; break;
      case "ol": replacement = `\n1. ${selected || "Numbered step"}\n`; break;
      case "quote": replacement = `\n> ${selected || "Key takeaway or citation"}\n`; break;
      case "code": replacement = `\n\`\`\`\n${selected || "// Code or algorithm here"}\n\`\`\`\n`; break;
      default: replacement = selected;
    }

    const updated = answerText.substring(0, start) + replacement + answerText.substring(end);
    setAnswerText(updated);
  };

  // Submit Answer
  const handleProcessSubmit = async (isDraft = false) => {
    if (!isDraft && !answerText.trim() && stagedFiles.length === 0) {
      showToast?.("Please enter written answer text or attach a deliverable file.", true);
      return;
    }

    if (isDraft) setSavingDraft(true);
    else setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("answerText", answerText.trim());
      formData.append("submissionText", answerText.trim());
      formData.append("isDraft", String(isDraft));

      for (const f of stagedFiles) {
        formData.append("submissionFiles", f);
      }

      const res = await authApi.submitAssignment(activeWorkspaceAsgn.id || activeWorkspaceAsgn._id, formData);
      if (isDraft) {
        showToast?.("Draft saved successfully to server.");
        fetchAssignments();
      } else {
        setReceiptConfirmation({
          receipt: res.receipt || "SUB-CONFIRMED",
          submittedAt: new Date(),
          status: res.status || "submitted"
        });
        showToast?.("Assignment submitted successfully!");
        fetchAssignments();
      }
    } catch (err) {
      showToast?.(err.message || "Failed to submit assignment.", true);
    } finally {
      setSavingDraft(false);
      setSubmitting(false);
    }
  };

  // Reference Download
  const handleDownloadReference = async (asgnId, file) => {
    try {
      await authApi.downloadAssignmentReference(asgnId, file._id || file.fileName, file.originalFileName || "reference.pdf");
      showToast?.(`Downloaded "${file.originalFileName || "reference file"}"`);
    } catch (err) {
      showToast?.(err.message || "Could not download file.", true);
    }
  };

  // Submission Download
  const handleDownloadMySubmission = async (asgnId, subId, file) => {
    try {
      await authApi.downloadAssignmentSubmission(asgnId, subId, file._id || file.fileName, file.originalFileName || "deliverable.pdf");
      showToast?.(`Downloaded "${file.originalFileName || "submission file"}"`);
    } catch (err) {
      showToast?.(err.message || "Could not download submission file.", true);
    }
  };

  const firstName = (currentUser?.fullName || currentUser?.name || "").split(" ")[0];

  return (
    <div className="std-asgn-page">
      {/* ===================== HERO SECTION ===================== */}
      <header className="std-asgn-hero">
        <div className="asgn-hero-glow" />

        <div className="asgn-hero-left">
          <div className="asgn-meta-pills">
            <span className="asgn-pill-batch">
              <GraduationCap size={13} />
              <span>{currentUser?.branch || "Polytechnic"} · {currentUser?.semester || "Semester 5"}</span>
            </span>
            <span className="asgn-pill-sync">
              <span className="sync-dot" />
              <span>Academic Curriculum Portal</span>
            </span>
          </div>

          <h1 className="asgn-hero-title">
            {firstName ? `${firstName}’s Coursework & Assignments` : "Coursework & Assignments"}
          </h1>
          <p className="asgn-hero-desc">
            Complete practical assignments, upload laboratory reports, and review faculty evaluations with rubric breakdowns.
          </p>

          {/* Integrated Search Bar */}
          <div className="asgn-hero-search">
            <Search size={17} className="search-icon" />
            <input
              type="text"
              placeholder="Search by assignment title, subject, unit, or faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search assignments"
            />
            {searchQuery && (
              <button type="button" className="search-clear-btn" onClick={() => setSearchQuery("")}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Hero Right: Compact Progress Widget */}
        <aside className="asgn-hero-right">
          <div className="asgn-progress-card">
            <div className="progress-card-header">
              <div className="progress-badge">Coursework Completion</div>
              <button
                type="button"
                className="btn-asgn-refresh"
                onClick={() => setRefreshKey((k) => k + 1)}
                title="Refresh assignment feed"
              >
                <RefreshCw size={13} className={loading ? "spin" : ""} />
                <span>Sync</span>
              </button>
            </div>

            <div className="progress-ratio-row">
              <strong className="ratio-number">{completedSubmissionsCount}</strong>
              <span className="ratio-total">/ {totalCount} completed</span>
              <span className="ratio-pct">{completionRate}%</span>
            </div>

            <div className="progress-linear-track">
              <div className="progress-linear-fill" style={{ width: `${completionRate}%` }} />
            </div>

            <div className="progress-card-meta">
              <span>{pendingCount} assignments awaiting submission</span>
            </div>
          </div>
        </aside>
      </header>

      {/* ===================== KPI SUMMARY METRICS ===================== */}
      <section className="asgn-kpi-grid" aria-label="Coursework statistics">
        {[
          { key: "total", label: "Total Assigned", val: totalCount, hint: "All course units", icon: BookOpen, color: "orange" },
          { key: "pending", label: "Pending Submission", val: pendingCount, hint: "Due soon", icon: Clock, color: "amber" },
          { key: "submitted", label: "Submitted", val: submittedCount, hint: "Awaiting review", icon: Send, color: "blue" },
          { key: "evaluated", label: "Evaluated & Graded", val: evaluatedCount, hint: "Marks published", icon: Award, color: "emerald" },
          { key: "overdue", label: "Overdue", val: overdueCount, hint: "Past due date", icon: AlertCircle, color: "rose" }
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.key} className={`asgn-kpi-card kpi-${kpi.color}`}>
              <div className="kpi-icon-tile">
                <Icon size={20} />
              </div>
              <div className="kpi-data">
                <span className="kpi-label">{kpi.label}</span>
                <strong className="kpi-number">{loading ? "—" : kpi.val}</strong>
                <span className="kpi-hint">{kpi.hint}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* ===================== STATUS TABS ===================== */}
      <div className="asgn-tabs-wrapper">
        <nav className="asgn-status-tabs" role="tablist">
          {STATUS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            let badgeVal = 0;
            if (tab.id === "all") badgeVal = totalCount;
            else if (tab.id === "pending") badgeVal = pendingCount;
            else if (tab.id === "submitted") badgeVal = submittedCount;
            else if (tab.id === "evaluated") badgeVal = evaluatedCount;
            else if (tab.id === "correction_required") badgeVal = correctionCount;
            else if (tab.id === "overdue") badgeVal = overdueCount;
            else if (tab.id === "draft") badgeVal = assignments.filter((a) => a.effectiveStatus === "draft").length;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`asgn-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {badgeVal > 0 && <span className="tab-pill-badge">{badgeVal}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ===================== TOOLBAR: FILTERS & VIEW MODE ===================== */}
      <div className="asgn-toolbar-container">
        <div className="asgn-toolbar-row">
          <button
            type="button"
            className={`btn-filter-drawer-toggle ${filterDrawerOpen ? "open" : ""}`}
            onClick={() => setFilterDrawerOpen((o) => !o)}
          >
            <SlidersHorizontal size={14} />
            <span>Filters & Sorting</span>
            <ChevronDown size={14} className="chevron-icon" />
          </button>

          <div className="asgn-toolbar-tools">
            <div className="asgn-select-wrap">
              <ArrowUpDown size={13} className="select-icon" />
              <select
                className="asgn-toolbar-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="dueDateAsc">Due Date (Earliest)</option>
                <option value="dueDateDesc">Due Date (Latest)</option>
                <option value="newest">Recently Published</option>
                <option value="priority">Priority (High to Low)</option>
              </select>
            </div>

            <div className="asgn-layout-toggle" role="group" aria-label="Layout mode">
              <button
                type="button"
                className={`btn-layout ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid view"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                className={`btn-layout ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                title="List view"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Filter Inputs */}
        {filterDrawerOpen && (
          <div className="asgn-filter-drawer">
            <div className="drawer-fields-grid">
              <div className="drawer-field">
                <label>Course Subject</label>
                <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                  <option value="all">All Course Subjects</option>
                  {availableSubjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="drawer-field">
                <label>Category</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="all">All Categories</option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="drawer-field">
                <label>Priority</label>
                <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="normal">Normal Priority</option>
                </select>
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="btn-drawer-reset"
                  onClick={() => {
                    setSelectedSubject("all");
                    setSelectedCategory("all");
                    setSelectedPriority("all");
                    setSearchQuery("");
                  }}
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================== ASSIGNMENTS ROSTER: CARDS / EMPTY ===================== */}
      {loading ? (
        <div className="asgn-skeleton-grid" aria-busy="true">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="asgn-skeleton-card">
              <div className="skel-top" />
              <div className="skel-title" />
              <div className="skel-desc" />
              <div className="skel-footer" />
            </div>
          ))}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="asgn-empty-state">
          <div className="empty-bubble">
            <BookOpen size={40} className="text-indigo" />
          </div>
          <h3>No Coursework Deliverables Found</h3>
          <p>
            {activeTab !== "all"
              ? `There are no assignments matching the "${STATUS_TABS.find((t) => t.id === activeTab)?.label}" tab.`
              : "No coursework assignments have been published for your branch and semester yet."}
          </p>
          {activeTab !== "all" && (
            <button type="button" className="btn-asgn-primary" onClick={() => setActiveTab("all")}>
              Browse All Assignments
            </button>
          )}
        </div>
      ) : (
        <div className={`asgn-cards-grid ${viewMode === "list" ? "layout-list" : "layout-grid"}`}>
          {filteredAssignments.map((asgn) => {
            const id = asgn.id || asgn._id;
            const deadline = formatDeadlineCountdown(asgn.dueDate);
            const userSub = asgn.userSubmission;
            const refFiles = asgn.referenceAttachments || [];
            const extLinks = asgn.externalResources || [];

            return (
              <article
                key={id}
                className={`asgn-card ${asgn.priority === "high" ? "is-priority" : ""}`}
              >
                {/* Card Top: Subject Pill & Status / Priority */}
                <div className="asgn-card-header">
                  <div className="header-chips-left">
                    <span className="asgn-chip-subject" title={asgn.subject}>
                      {asgn.subjectCode ? `${asgn.subjectCode} · ` : ""}{asgn.subject}
                    </span>
                    {asgn.unit && <span className="asgn-chip-unit">{asgn.unit}</span>}
                  </div>

                  <div className="header-chips-right">
                    {asgn.priority === "high" && (
                      <span className="asgn-priority-badge" title="High Priority Assignment">
                        <Sparkles size={11} /> Urgent
                      </span>
                    )}

                    {/* Status Pill */}
                    <span className={`asgn-status-badge status-${asgn.effectiveStatus}`}>
                      {asgn.effectiveStatus === "evaluated"
                        ? `Graded: ${userSub?.grade ?? 0}/${asgn.totalPoints}`
                        : asgn.effectiveStatus === "submitted"
                        ? "Submitted"
                        : asgn.effectiveStatus === "late"
                        ? "Late Submitted"
                        : asgn.effectiveStatus === "correction_required"
                        ? "Correction Required"
                        : asgn.effectiveStatus === "overdue"
                        ? "Overdue"
                        : asgn.effectiveStatus === "draft"
                        ? "Draft Saved"
                        : "Pending"}
                    </span>
                  </div>
                </div>

                {/* Card Body: Title & Description */}
                <div className="asgn-card-body">
                  <h3 className="asgn-card-title" title={asgn.title}>
                    {asgn.title}
                  </h3>
                  <p className="asgn-card-desc">
                    {asgn.shortDescription || asgn.description}
                  </p>
                </div>

                {/* Deliverable Specifications & Deadlines */}
                <div className="asgn-card-specs">
                  <div className="spec-item">
                    <Calendar size={13} />
                    <span>Due: <strong>{formatDate(asgn.dueDate)}</strong> ({asgn.dueTime || "23:59"})</span>
                  </div>
                  <div className={`spec-item countdown ${deadline.isUrgent ? "urgent" : deadline.isOverdue ? "overdue" : ""}`}>
                    <Clock size={13} />
                    <span>{deadline.text}</span>
                  </div>
                </div>

                {/* References Strip (if any attached) */}
                {(refFiles.length > 0 || extLinks.length > 0) && (
                  <div className="asgn-resources-strip">
                    {refFiles.length > 0 && (
                      <span className="resource-pill">
                        <Paperclip size={11} />
                        <span>{refFiles.length} Reference File{refFiles.length === 1 ? "" : "s"}</span>
                      </span>
                    )}
                    {extLinks.length > 0 && (
                      <span className="resource-pill cloud">
                        <ExternalLink size={11} />
                        <span>{extLinks.length} Cloud Resource{extLinks.length === 1 ? "" : "s"}</span>
                      </span>
                    )}
                    <span className="marks-pill">
                      <Award size={12} />
                      <span>{asgn.totalPoints} Marks</span>
                    </span>
                  </div>
                )}

                {/* Faculty Uploader Bar */}
                <div className="asgn-uploader-bar">
                  <div className="uploader-meta">
                    <span className="uploader-name">{asgn.creatorName || "Faculty"}</span>
                    <span className="uploader-sub">{asgn.creatorRole?.toUpperCase()} · {asgn.category}</span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="asgn-card-actions">
                  <button
                    type="button"
                    className="btn-asgn-preview"
                    onClick={() => {
                      setPreviewAsgn(asgn);
                      setPreviewInitialTab("overview");
                    }}
                    title="Preview assignment problem statement and rubric"
                  >
                    <Eye size={14} />
                    <span>Preview</span>
                  </button>

                  {refFiles.length > 0 && (
                    <button
                      type="button"
                      className="btn-asgn-handout"
                      onClick={() => {
                        setPreviewAsgn(asgn);
                        setPreviewInitialTab("handout");
                      }}
                      title="Open attached PDF handout in document viewer"
                    >
                      <FileText size={14} />
                      <span>View PDF</span>
                    </button>
                  )}

                  {asgn.effectiveStatus === "evaluated" ? (
                    <button
                      type="button"
                      className="btn-asgn-action evaluated"
                      onClick={() => handleOpenWorkspace(asgn, "result")}
                    >
                      <Award size={14} />
                      <span>View Result ({userSub?.percentage ?? 0}%)</span>
                    </button>
                  ) : asgn.effectiveStatus === "correction_required" ? (
                    <button
                      type="button"
                      className="btn-asgn-action correction"
                      onClick={() => handleOpenWorkspace(asgn, "solve")}
                    >
                      <RotateCcw size={14} />
                      <span>Revise & Resubmit</span>
                    </button>
                  ) : asgn.isSubmitted ? (
                    <button
                      type="button"
                      className="btn-asgn-action submitted"
                      onClick={() => handleOpenWorkspace(asgn, "solve")}
                    >
                      <CheckCheck size={14} />
                      <span>View Submission</span>
                    </button>
                  ) : asgn.isDraft ? (
                    <button
                      type="button"
                      className="btn-asgn-action draft"
                      onClick={() => handleOpenWorkspace(asgn, "solve")}
                    >
                      <Save size={14} />
                      <span>Continue Draft</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-asgn-action start"
                      onClick={() => handleOpenWorkspace(asgn, "solve")}
                    >
                      <Send size={14} />
                      <span>Start Assignment</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ===================== WORKSPACE MODAL ===================== */}
      {activeWorkspaceAsgn &&
        createPortal(
          (() => {
            const asgn = activeWorkspaceAsgn;
            const userSub = asgn.userSubmission;
            const refFiles = asgn.referenceAttachments || [];
            const extLinks = asgn.externalResources || [];
            const rubrics = asgn.rubricCriteria || [];
            const deadline = formatDeadlineCountdown(asgn.dueDate);

            return (
              <div className="asgn-modal-backdrop" onClick={handleCloseWorkspace}>
                <div
                  className="asgn-workspace-sheet"
                  role="dialog"
                  aria-modal="true"
                  aria-label={asgn.title}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Top Header */}
                  <div className="workspace-header">
                    <div className="workspace-title-box">
                      <div className="workspace-tags">
                        <span className="ws-tag-subject">{asgn.subject}</span>
                        {asgn.unit && <span className="ws-tag-unit">{asgn.unit}</span>}
                        <span className="ws-tag-marks">{asgn.totalPoints} Total Marks</span>
                        <span className={`asgn-status-badge status-${asgn.effectiveStatus}`}>
                          {asgn.effectiveStatus.toUpperCase()}
                        </span>
                      </div>
                      <h2 className="workspace-heading">{asgn.title}</h2>
                    </div>

                    <div className="workspace-header-actions">
                      <button
                        type="button"
                        className="btn-ws-close"
                        onClick={handleCloseWorkspace}
                        aria-label="Close assignment workspace"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Mode Navigation Tabs */}
                  <div className="workspace-modes-bar">
                    <button
                      type="button"
                      className={`ws-mode-tab ${workspaceMode === "details" ? "active" : ""}`}
                      onClick={() => setWorkspaceMode("details")}
                    >
                      <FileText size={14} />
                      <span>Assignment Details & References</span>
                    </button>

                    <button
                      type="button"
                      className={`ws-mode-tab ${workspaceMode === "solve" ? "active" : ""}`}
                      onClick={() => setWorkspaceMode("solve")}
                    >
                      <Send size={14} />
                      <span>
                        {asgn.effectiveStatus === "correction_required"
                          ? "Revise & Resubmit Answer"
                          : asgn.isSubmitted
                          ? "My Submission & Files"
                          : "Answer Editor & Submission"}
                      </span>
                    </button>

                    {userSub && userSub.status === "evaluated" && (
                      <button
                        type="button"
                        className={`ws-mode-tab ${workspaceMode === "result" ? "active" : ""}`}
                        onClick={() => setWorkspaceMode("result")}
                      >
                        <Award size={14} />
                        <span>Evaluation & Rubric Result</span>
                      </button>
                    )}
                  </div>

                  {/* Modal Body Based on Selected Mode */}
                  <div className="workspace-body-scrollable">
                    {/* MODE 1: DETAILS & REFERENCES */}
                    {workspaceMode === "details" && (
                      <div className="ws-details-view">
                        <div className="ws-instruction-card">
                          <h4>Detailed Instructions & Problem Statement</h4>
                          <div className="ws-markdown-text">
                            {asgn.description.split("\n").map((line, idx) => (
                              <p key={idx}>{line}</p>
                            ))}
                          </div>
                        </div>

                        {/* Submission Rules & Deadlines Grid */}
                        <div className="ws-rules-grid">
                          <div className="rule-box">
                            <span className="rule-label">Submission Deadline</span>
                            <strong>{formatDate(asgn.dueDate)} ({asgn.dueTime || "23:59"})</strong>
                            <small className={deadline.isUrgent ? "text-amber" : deadline.isOverdue ? "text-rose" : ""}>
                              {deadline.text}
                            </small>
                          </div>
                          <div className="rule-box">
                            <span className="rule-label">Late Submission Policy</span>
                            <strong>
                              {asgn.lateSubmissionPolicy === "disallowed"
                                ? "Strictly Disallowed"
                                : asgn.lateSubmissionPolicy === "allowed_no_penalty"
                                ? "Permitted without Penalty"
                                : `Allowed with ${asgn.latePenaltyPercent}% Grade Deduction`}
                            </strong>
                          </div>
                          <div className="rule-box">
                            <span className="rule-label">Maximum Upload Limit</span>
                            <strong>{asgn.maxFileSizeMB || 50} MB per file</strong>
                            <small>Up to 5 file deliverables</small>
                          </div>
                          <div className="rule-box">
                            <span className="rule-label">Passing Benchmark</span>
                            <strong>{asgn.passingMarks || 40} / {asgn.totalPoints} Marks</strong>
                          </div>
                        </div>

                        {/* Reference File Attachments */}
                        {refFiles.length > 0 && (
                          <div className="ws-section-box">
                            <h4>Faculty Reference Attachments ({refFiles.length})</h4>
                            <div className="ws-attachments-list">
                              {refFiles.map((f, i) => (
                                <div key={f._id || i} className="ws-attachment-card">
                                  <div className="file-info-col">
                                    <FileText size={20} className="text-indigo" />
                                    <div>
                                      <strong>{f.originalFileName || f.fileName}</strong>
                                      <span>{formatFileSize(f.fileSize)} · {f.fileExtension?.toUpperCase()}</span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn-file-dl"
                                    onClick={() => handleDownloadReference(asgn.id || asgn._id, f)}
                                  >
                                    <Download size={14} /> Download
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* External Cloud Resources */}
                        {extLinks.length > 0 && (
                          <div className="ws-section-box">
                            <h4>Cloud Links & Supplementary Reading</h4>
                            <div className="ws-cloud-list">
                              {extLinks.map((res, i) => (
                                <a
                                  key={i}
                                  href={res.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ws-cloud-card"
                                >
                                  <div>
                                    <span className="cloud-badge">{res.provider}</span>
                                    <strong>{res.title}</strong>
                                    {res.description && <p>{res.description}</p>}
                                  </div>
                                  <ExternalLink size={16} />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rubric Criteria */}
                        {rubrics.length > 0 && (
                          <div className="ws-section-box">
                            <h4>Evaluation Rubric & Marking Scheme</h4>
                            <div className="ws-rubric-table">
                              <div className="rubric-header-row">
                                <span>Assessment Criterion</span>
                                <span>Description / Expectations</span>
                                <span>Maximum Marks</span>
                              </div>
                              {rubrics.map((r, i) => (
                                <div key={i} className="rubric-row">
                                  <strong>{r.title}</strong>
                                  <span>{r.description || "Demonstrate thorough understanding and accuracy."}</span>
                                  <strong>{r.maxPoints} pts</strong>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* MODE 2: ANSWER EDITOR & SUBMISSION */}
                    {workspaceMode === "solve" && (
                      <div className="ws-solve-view">
                        {receiptConfirmation ? (
                          <div className="ws-confirmation-card">
                            <CheckCircle2 size={54} className="text-emerald" />
                            <h3>Assignment Submitted Successfully!</h3>
                            <p>Your solution has been securely recorded on the CollegeOS examination server.</p>

                            <div className="receipt-box">
                              <span className="receipt-label">Official Submission Receipt</span>
                              <code className="receipt-code">{receiptConfirmation.receipt}</code>
                              <span className="receipt-time">
                                Timestamp: {new Date(receiptConfirmation.submittedAt).toLocaleString("en-IN")}
                              </span>
                            </div>

                            <button
                              type="button"
                              className="btn-asgn-primary"
                              onClick={() => {
                                setReceiptConfirmation(null);
                                setWorkspaceMode("details");
                              }}
                            >
                              Return to Assignment Details
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Correction Required Banner */}
                            {asgn.effectiveStatus === "correction_required" && userSub && (
                              <div className="ws-correction-alert">
                                <AlertTriangle size={22} className="text-amber flex-shrink-0" />
                                <div>
                                  <strong>Instructor Requested Revisions</strong>
                                  <p>{userSub.correctionInstructions || userSub.feedback}</p>
                                </div>
                              </div>
                            )}

                            {/* Formatted Answer Editor */}
                            <div className="ws-editor-container">
                              <div className="editor-top-bar">
                                <span className="editor-title">Written Solution / Answer Sheet</span>
                                <div className="editor-formatting-tools">
                                  <button type="button" onClick={() => applyFormatting("bold")} title="Bold"><Bold size={13} /></button>
                                  <button type="button" onClick={() => applyFormatting("italic")} title="Italic"><Italic size={13} /></button>
                                  <button type="button" onClick={() => applyFormatting("h1")} title="Heading 1"><Heading1 size={13} /></button>
                                  <button type="button" onClick={() => applyFormatting("h2")} title="Heading 2"><Heading2 size={13} /></button>
                                  <button type="button" onClick={() => applyFormatting("ul")} title="Bullet List"><ListIcon size={13} /></button>
                                  <button type="button" onClick={() => applyFormatting("ol")} title="Numbered List"><ListOrdered size={13} /></button>
                                  <button type="button" onClick={() => applyFormatting("quote")} title="Blockquote"><Quote size={13} /></button>
                                  <button type="button" onClick={() => applyFormatting("code")} title="Code Block"><Code size={13} /></button>
                                </div>
                              </div>

                              <textarea
                                id="student-answer-textarea"
                                className="student-answer-textarea"
                                rows={10}
                                placeholder="Type or paste your complete solution, equations, methodology, or analysis here..."
                                value={answerText}
                                onChange={(e) => setAnswerText(e.target.value)}
                                disabled={asgn.isSubmitted && asgn.effectiveStatus !== "correction_required" && !asgn.isDraft}
                              />

                              <div className="editor-footer-bar">
                                <span>
                                  Words: <strong>{answerText.trim().split(/\s+/).filter(Boolean).length}</strong> ·{" "}
                                  Characters: <strong>{answerText.length}</strong>
                                </span>
                                <span>Markdown formatting supported</span>
                              </div>
                            </div>

                            {/* File Attachments Dropzone */}
                            <div className="ws-dropzone-section">
                              <label className="dropzone-label">
                                Attached Deliverables & Files (PDF, Word, Code, Archives)
                              </label>

                              {(!asgn.isSubmitted || asgn.effectiveStatus === "correction_required" || asgn.isDraft) && (
                                <div
                                  className="file-dropzone-box"
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={handleFileDrop}
                                >
                                  <Paperclip size={24} className="text-indigo" />
                                  <p>
                                    <strong>Drag and drop deliverable files</strong> or browse from device
                                  </p>
                                  <span>Supported: PDF, DOCX, PPTX, XLSX, ZIP, PNG (Up to {asgn.maxFileSizeMB || 50} MB)</span>
                                  <input
                                    type="file"
                                    multiple
                                    className="hidden-file-input"
                                    id="ws-file-input"
                                    onChange={handleFileDrop}
                                  />
                                  <label htmlFor="ws-file-input" className="btn-file-browse">
                                    Browse Files
                                  </label>
                                </div>
                              )}

                              {/* Newly Staged Files */}
                              {stagedFiles.length > 0 && (
                                <div className="staged-files-list">
                                  <h5>Files Ready for Submission ({stagedFiles.length})</h5>
                                  {stagedFiles.map((file, idx) => (
                                    <div key={idx} className="staged-file-chip">
                                      <FileText size={16} />
                                      <span className="file-chip-name">{file.name}</span>
                                      <span className="file-chip-size">{formatFileSize(file.size)}</span>
                                      <button
                                        type="button"
                                        className="btn-remove-staged"
                                        onClick={() => handleRemoveStagedFile(idx)}
                                      >
                                        <X size={13} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Previously Submitted Deliverables */}
                              {userSub && userSub.attachments && userSub.attachments.length > 0 && (
                                <div className="submitted-files-list">
                                  <h5>Current Submitted Files</h5>
                                  {userSub.attachments.map((file, idx) => (
                                    <div key={file._id || idx} className="staged-file-chip saved">
                                      <CheckCircle2 size={16} className="text-emerald" />
                                      <span className="file-chip-name">{file.originalFileName || file.fileName}</span>
                                      <span className="file-chip-size">{formatFileSize(file.fileSize)}</span>
                                      <button
                                        type="button"
                                        className="btn-download-submitted"
                                        onClick={() => handleDownloadMySubmission(asgn.id || asgn._id, userSub._id, file)}
                                        title="Download my submitted file"
                                      >
                                        <Download size={13} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Submission Action Bar */}
                            {(!asgn.isSubmitted || asgn.effectiveStatus === "correction_required" || asgn.isDraft) && (
                              <div className="ws-submission-actions-bar">
                                <button
                                  type="button"
                                  className="btn-asgn-secondary"
                                  onClick={() => handleProcessSubmit(true)}
                                  disabled={savingDraft || submitting}
                                >
                                  <Save size={15} />
                                  <span>{savingDraft ? "Saving Draft..." : "Save Draft"}</span>
                                </button>

                                <button
                                  type="button"
                                  className="btn-asgn-primary"
                                  onClick={() => handleProcessSubmit(false)}
                                  disabled={submitting || savingDraft}
                                >
                                  <Send size={15} />
                                  <span>
                                    {submitting
                                      ? "Submitting..."
                                      : asgn.effectiveStatus === "correction_required"
                                      ? "Submit Revised Assignment"
                                      : "Submit Assignment Deliverable"}
                                  </span>
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* MODE 3: EVALUATION RESULT & MARKS */}
                    {workspaceMode === "result" && userSub && (
                      <div className="ws-result-view">
                        <div className={`result-hero-card ${userSub.isPassed ? "passed" : "needs-improvement"}`}>
                          <div className="result-score-badge">
                            <span className="score-val">{userSub.grade}</span>
                            <span className="score-max">/ {asgn.totalPoints}</span>
                          </div>
                          <div className="result-meta">
                            <h3>{userSub.isPassed ? "Coursework Deliverable Passed" : "Needs Revision"}</h3>
                            <span className="percentage-tag">{userSub.percentage}% Overall Score</span>
                            <span className="evaluator-line">
                              Evaluated by <strong>{userSub.evaluatorName || "Faculty"}</strong> on{" "}
                              {formatDate(userSub.evaluatedAt)}
                            </span>
                          </div>
                        </div>

                        {/* Written Feedback */}
                        {userSub.feedback && (
                          <div className="ws-section-box">
                            <h4>Faculty Written Feedback</h4>
                            <div className="feedback-content-card">
                              <p>{userSub.feedback}</p>
                            </div>
                          </div>
                        )}

                        {/* Rubric Breakdown */}
                        {userSub.rubricScores && userSub.rubricScores.length > 0 && (
                          <div className="ws-section-box">
                            <h4>Detailed Rubric Scorecard</h4>
                            <div className="rubric-scorecard-grid">
                              {userSub.rubricScores.map((score, sIdx) => (
                                <div key={sIdx} className="scorecard-row">
                                  <strong>{score.criteriaTitle}</strong>
                                  <span className="scorecard-points">
                                    {score.awardedPoints} / {score.maxPoints} pts
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Submission Receipt */}
                        {userSub.submissionReceipt && (
                          <div className="receipt-pill-row">
                            <span>Verification Receipt:</span>
                            <code>{userSub.submissionReceipt}</code>
                            <span>Submitted: {new Date(userSub.submittedAt).toLocaleString("en-IN")}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })(),
          document.body
        )}
      {/* ===================== INTEGRATED ASSIGNMENT PREVIEW MODAL ===================== */}
      {previewAsgn && (
        <AssignmentPreviewModal
          assignment={previewAsgn}
          initialTab={previewInitialTab}
          onClose={() => setPreviewAsgn(null)}
          onStartAssignment={(a) => {
            setPreviewAsgn(null);
            handleOpenWorkspace(a, "solve");
          }}
        />
      )}
    </div>
  );
}
