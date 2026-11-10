import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileText,
  Search,
  Filter,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Users,
  Award,
  Download,
  Printer,
  RefreshCw,
  LayoutGrid,
  List,
  BarChart2,
  TrendingUp,
  GraduationCap,
  Sparkles,
  Calendar,
  X,
  Check,
  Percent,
  Sliders,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Eye,
  AlertTriangle,
  FolderCheck,
  BookOpen
} from "lucide-react";
import { authApi } from "../../services/authApi";
import AssignmentPreviewModal from "../../components/assignment/AssignmentPreviewModal";
import "./HODTheme.css";
import "./HODAssignments.css";

const SEMESTERS = [
  "ALL",
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6"
];

export default function HODAssignments() {
  // --- States ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Raw data from API
  const [departmentBranch, setDepartmentBranch] = useState("CSE");
  const [overviewStats, setOverviewStats] = useState({
    totalAssignments: 0,
    totalSubmissions: 0,
    totalEvaluated: 0,
    pendingEvaluations: 0,
    totalLate: 0,
    evaluationRate: 100
  });
  const [teacherBreakdown, setTeacherBreakdown] = useState([]);
  const [semesterBreakdown, setSemesterBreakdown] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // Filters & Controls
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, PAST_DUE, PENDING_EVAL
  const [viewMode, setViewMode] = useState("grid"); // grid | table
  const [sortBy, setSortBy] = useState("dueDateAsc"); // dueDateAsc, dueDateDesc, title, submissions

  // Modal States
  const [selectedAssignmentForDetails, setSelectedAssignmentForDetails] = useState(null);
  const [previewAssignment, setPreviewAssignment] = useState(null);
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionFilter, setSubmissionFilter] = useState("ALL"); // ALL, evaluated, submitted, late

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    title: "",
    description: "",
    semester: "Semester 5",
    subject: "",
    academicYear: "3rd Year",
    dueDate: "",
    totalPoints: 100
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // --- Fetch Data ---
  const loadAssignmentsData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await authApi.getHODAssignmentsOverview();
      if (response && response.success) {
        setDepartmentBranch(response.branch || "CSE");
        setOverviewStats(
          response.overview || {
            totalAssignments: 0,
            totalSubmissions: 0,
            totalEvaluated: 0,
            pendingEvaluations: 0,
            totalLate: 0,
            evaluationRate: 100
          }
        );
        setTeacherBreakdown(response.teacherBreakdown || []);
        setSemesterBreakdown(response.semesterBreakdown || []);
        setAssignments(response.assignments || []);
      } else {
        throw new Error(response?.message || "Failed to load department assignments.");
      }
    } catch (err) {
      console.error("HODAssignments load error:", err);
      setError(err.message || "Failed to load department assignments.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAssignmentsData();
  }, [loadAssignmentsData]);

  // Toast auto-dismiss
  useEffect(() => {
    if (actionSuccess) {
      const t = setTimeout(() => setActionSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [actionSuccess]);

  // --- Filtering & Sorting ---
  const filteredAssignments = useMemo(() => {
    let list = [...assignments];
    const now = new Date();

    // Semester filter
    if (selectedSemester !== "ALL") {
      list = list.filter((a) => a.semester === selectedSemester);
    }

    // Status filter
    if (statusFilter === "ACTIVE") {
      list = list.filter((a) => !a.dueDate || new Date(a.dueDate) >= now);
    } else if (statusFilter === "PAST_DUE") {
      list = list.filter((a) => a.dueDate && new Date(a.dueDate) < now);
    } else if (statusFilter === "PENDING_EVAL") {
      list = list.filter((a) => {
        const subs = a.submissions || [];
        const evaluated = subs.filter((s) => s.status === "evaluated" || s.grade !== null).length;
        return subs.length > evaluated;
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          (a.title && a.title.toLowerCase().includes(q)) ||
          (a.subject && a.subject.toLowerCase().includes(q)) ||
          (a.teacherName && a.teacherName.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "dueDateAsc") {
        return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
      }
      if (sortBy === "dueDateDesc") {
        return new Date(b.dueDate || 0) - new Date(a.dueDate || 0);
      }
      if (sortBy === "title") {
        return (a.title || "").localeCompare(b.title || "");
      }
      if (sortBy === "submissions") {
        return (b.submissionsCount || 0) - (a.submissionsCount || 0);
      }
      return 0;
    });

    return list;
  }, [assignments, selectedSemester, statusFilter, searchQuery, sortBy]);

  // --- Handlers ---
  const handleOpenCreateModal = () => {
    setCreateFormData({
      title: "",
      description: "",
      semester: selectedSemester !== "ALL" ? selectedSemester : "Semester 5",
      subject: "",
      academicYear: "3rd Year",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      totalPoints: 100
    });
    setShowCreateModal(true);
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!createFormData.title.trim() || !createFormData.subject.trim() || !createFormData.dueDate) {
      alert("Please fill in the title, subject, and valid due date.");
      return;
    }

    setCreateSubmitting(true);
    try {
      const payload = {
        title: createFormData.title.trim(),
        description: createFormData.description.trim() || "Department Directive Assignment",
        branch: departmentBranch,
        semester: createFormData.semester,
        academicYear: createFormData.academicYear,
        subject: createFormData.subject.trim(),
        dueDate: createFormData.dueDate,
        totalPoints: Number(createFormData.totalPoints) || 100
      };

      const res = await authApi.createAssignment(payload);
      if (res && (res.success || res.assignment)) {
        setActionSuccess("Assignment directive issued and distributed successfully!");
        setShowCreateModal(false);
        loadAssignmentsData(true);
      } else {
        throw new Error(res?.message || "Failed to create assignment.");
      }
    } catch (err) {
      alert(err.message || "Error issuing assignment.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id, force = false) => {
    setDeleting(true);
    try {
      const res = await authApi.deleteAssignment(id, force);
      if (res && res.success) {
        setActionSuccess("Assignment record removed successfully.");
        setDeleteConfirmId(null);
        if (selectedAssignmentForDetails && (selectedAssignmentForDetails.id === id || selectedAssignmentForDetails._id === id)) {
          setSelectedAssignmentForDetails(null);
        }
        loadAssignmentsData(true);
      } else {
        throw new Error(res?.message || "Failed to delete assignment.");
      }
    } catch (err) {
      alert(err.message || "Failed to remove assignment.");
    } finally {
      setDeleting(false);
    }
  };

  const handleArchiveAssignment = async (asgn) => {
    const id = asgn.id || asgn._id;
    try {
      const res = await authApi.archiveAssignment(id);
      if (res && res.success) {
        setActionSuccess(asgn.isArchived ? "Assignment restored from archive." : "Assignment moved to archive.");
        setDeleteConfirmId(null);
        loadAssignmentsData(true);
      }
    } catch (err) {
      alert(err.message || "Failed to update archive status.");
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredAssignments.length === 0) {
      alert("No assignments available to export.");
      return;
    }

    const headers = [
      "Assignment ID",
      "Title",
      "Subject",
      "Semester",
      "Faculty Teacher",
      "Due Date",
      "Total Points",
      "Submissions Received",
      "Evaluated Count",
      "Pending Count"
    ];

    const rows = filteredAssignments.map((a) => {
      const subs = a.submissionsCount || 0;
      const evaled = a.evaluatedCount || 0;
      const pending = Math.max(0, subs - evaled);
      const due = a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "No Date";
      return [
        `"${a.id || a._id}"`,
        `"${(a.title || "").replace(/"/g, '""')}"`,
        `"${(a.subject || "").replace(/"/g, '""')}"`,
        `"${a.semester || ""}"`,
        `"${(a.teacherName || "").replace(/"/g, '""')}"`,
        `"${due}"`,
        a.totalPoints || a.maxMarks || 100,
        subs,
        evaled,
        pending
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `HOD_Assignments_${departmentBranch}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Submissions filtered list within Modal
  const modalSubmissions = useMemo(() => {
    if (!selectedAssignmentForDetails) return [];
    let list = selectedAssignmentForDetails.submissions || [];

    if (submissionFilter !== "ALL") {
      list = list.filter((s) => s.status === submissionFilter);
    }

    if (submissionSearch.trim()) {
      const q = submissionSearch.toLowerCase().trim();
      list = list.filter((s) => {
        const student = s.studentId;
        const name = student?.fullName || "Student";
        const roll = student?.rollNumber || student?.enrollmentNumber || "";
        const email = student?.email || "";
        return (
          name.toLowerCase().includes(q) ||
          roll.toLowerCase().includes(q) ||
          email.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [selectedAssignmentForDetails, submissionFilter, submissionSearch]);

  return (
    <div className="hod-assignments-page">
      {/* Toast Notification */}
      {actionSuccess && (
        <div className="hod-asgn-toast-success animate-fade-in">
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="toast-close-btn">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <header className="hod-asgn-header-card">
        <div className="hod-asgn-header-left">
          <div className="hod-asgn-title-badge">
            <span className="hod-badge-pulse" />
            <BookOpen size={14} className="hod-badge-icon" />
            <span>Academic Command • {departmentBranch} Department</span>
          </div>
          <h1 className="hod-asgn-page-title">Assignments & Evaluation Command</h1>
          <p className="hod-asgn-page-subtitle">
            Oversee course deliverables, track faculty grading velocity, audit student submissions,
            and maintain curriculum rigor across all semesters.
          </p>
        </div>

        <div className="hod-asgn-header-actions">
          <button
            onClick={() => loadAssignmentsData(true)}
            disabled={loading || refreshing}
            className="hod-asgn-btn-ghost"
            title="Refresh assignments overview"
          >
            <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
            <span>{refreshing ? "Syncing..." : "Sync"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="hod-asgn-btn-secondary"
            title="Export full assignments dataset to CSV"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="hod-asgn-btn-secondary"
            title="Print assignments audit sheet"
          >
            <Printer size={16} />
            <span>Print Audit</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="hod-asgn-btn-primary"
            title="Issue new department assignment directive"
          >
            <Plus size={16} />
            <span>Issue Directive</span>
          </button>
        </div>
      </header>

      {/* KPI Metric Summary Strip */}
      <section className="hod-asgn-kpi-grid">
        {/* KPI 1 */}
        <div className="hod-asgn-kpi-card">
          <div className="kpi-icon-wrapper kpi-indigo">
            <FileText size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Department Assignments</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{overviewStats.totalAssignments}</span>
              <span className="kpi-tag-sub">In {departmentBranch}</span>
            </div>
            <div className="kpi-footer-metric">
              <Sparkles size={12} className="kpi-sparkle-icon" />
              <span>{assignments.filter((a) => new Date(a.dueDate) >= new Date()).length} Active Deliverables</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="hod-asgn-kpi-card">
          <div className="kpi-icon-wrapper kpi-teal">
            <Users size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Submissions Collected</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{overviewStats.totalSubmissions}</span>
              <span className="kpi-tag-sub">Student Uploads</span>
            </div>
            <div className="kpi-footer-metric">
              <Clock size={12} />
              <span>{overviewStats.totalLate} Late Submissions</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="hod-asgn-kpi-card">
          <div className="kpi-icon-wrapper kpi-emerald">
            <Award size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Evaluated & Graded</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{overviewStats.totalEvaluated}</span>
              <span className="kpi-rate-badge">{overviewStats.evaluationRate}% Rate</span>
            </div>
            <div className="kpi-progress-bar-container">
              <div
                className="kpi-progress-fill"
                style={{ width: `${Math.min(100, overviewStats.evaluationRate || 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="hod-asgn-kpi-card">
          <div className="kpi-icon-wrapper kpi-amber">
            <AlertTriangle size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Pending Faculty Evaluation</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{overviewStats.pendingEvaluations}</span>
              {overviewStats.pendingEvaluations > 0 && (
                <span className="kpi-warning-tag">Action Needed</span>
              )}
            </div>
            <div className="kpi-footer-metric">
              <CheckCircle2 size={12} />
              <span>Across {teacherBreakdown.length} Faculty Members</span>
            </div>
          </div>
        </div>
      </section>

      {/* Faculty Velocity & Teacher Breakdown Card */}
      <section className="hod-asgn-faculty-section">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">Faculty Assignment Turnaround Velocity</h2>
            <p className="section-subtitle">
              Monitor faculty grading backlog, submission throughput, and turnaround performance.
            </p>
          </div>
          <div className="faculty-count-pill">
            <Users size={14} />
            <span>{teacherBreakdown.length} Active Instructors</span>
          </div>
        </div>

        {teacherBreakdown.length === 0 ? (
          <div className="faculty-empty-state">
            <User size={32} className="empty-icon" />
            <p>No faculty assignment activity recorded yet.</p>
          </div>
        ) : (
          <div className="faculty-cards-slider">
            {teacherBreakdown.map((t, idx) => {
              const pending = Math.max(0, t.submissionsCount - t.evaluatedCount);
              const completionPercent =
                t.submissionsCount > 0
                  ? Math.round((t.evaluatedCount / t.submissionsCount) * 100)
                  : 100;
              return (
                <div key={idx} className="faculty-velocity-card">
                  <div className="faculty-card-top">
                    <div className="faculty-avatar-circle">
                      {t.teacherName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="faculty-meta">
                      <h4 className="faculty-name">{t.teacherName}</h4>
                      <span className="faculty-role">Department Faculty</span>
                    </div>
                  </div>

                  <div className="faculty-stats-grid">
                    <div className="faculty-stat-item">
                      <span className="stat-label">Assigned</span>
                      <span className="stat-num">{t.assignmentsCount}</span>
                    </div>
                    <div className="faculty-stat-item">
                      <span className="stat-label">Submissions</span>
                      <span className="stat-num">{t.submissionsCount}</span>
                    </div>
                    <div className="faculty-stat-item">
                      <span className="stat-label">Evaluated</span>
                      <span className="stat-num text-emerald">{t.evaluatedCount}</span>
                    </div>
                    <div className="faculty-stat-item">
                      <span className="stat-label">Pending</span>
                      <span className={`stat-num ${pending > 0 ? "text-amber" : "text-slate"}`}>
                        {pending}
                      </span>
                    </div>
                  </div>

                  <div className="faculty-progress-container">
                    <div className="progress-labels">
                      <span>Evaluation Velocity</span>
                      <span>{completionPercent}%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${completionPercent}%`,
                          backgroundColor:
                            completionPercent > 80
                              ? "var(--hod-emerald-500, #10b981)"
                              : completionPercent > 50
                              ? "var(--hod-indigo-500, #6366f1)"
                              : "var(--hod-amber-500, #f59e0b)"
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Main Assignment Explorer & Filter Toolbar */}
      <section className="hod-asgn-main-container">
        {/* Semester Tabs */}
        <div className="hod-asgn-tabs-bar">
          <div className="tabs-scroll-area">
            {SEMESTERS.map((sem) => {
              const semCount =
                sem === "ALL"
                  ? assignments.length
                  : assignments.filter((a) => a.semester === sem).length;
              const isActive = selectedSemester === sem;
              return (
                <button
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className={`hod-sem-tab ${isActive ? "active" : ""}`}
                >
                  <span>{sem === "ALL" ? "All Semesters" : sem}</span>
                  <span className="tab-counter-badge">{semCount}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="hod-asgn-toolbar">
          <div className="toolbar-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by assignment title, subject or teacher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="toolbar-search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="search-clear-btn">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="toolbar-filters-group">
            {/* Status Dropdown */}
            <div className="toolbar-select-wrapper">
              <Filter size={14} className="select-icon" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="toolbar-select"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active & Open</option>
                <option value="PAST_DUE">Past Due / Closed</option>
                <option value="PENDING_EVAL">Needs Evaluation</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="toolbar-select-wrapper">
              <Sliders size={14} className="select-icon" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="toolbar-select"
              >
                <option value="dueDateAsc">Due Date (Earliest)</option>
                <option value="dueDateDesc">Due Date (Latest)</option>
                <option value="title">Alphabetical (Title)</option>
                <option value="submissions">Highest Submissions</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="toolbar-view-toggle">
              <button
                onClick={() => setViewMode("grid")}
                className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`view-btn ${viewMode === "table" ? "active" : ""}`}
                title="Table View"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="hod-asgn-loading-state">
            <div className="asgn-spinner" />
            <p>Loading department assignment registry & submissions data...</p>
          </div>
        ) : error ? (
          <div className="hod-asgn-error-state">
            <AlertCircle size={36} className="text-red" />
            <h3>Unable to load assignments</h3>
            <p>{error}</p>
            <button onClick={() => loadAssignmentsData(true)} className="hod-asgn-btn-primary">
              <RefreshCw size={15} />
              <span>Retry Load</span>
            </button>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="hod-asgn-empty-state">
            <FolderCheck size={48} className="empty-icon" />
            <h3>No assignments matching your criteria</h3>
            <p>Try modifying your semester filter, search query, or status selection.</p>
            <button onClick={handleOpenCreateModal} className="hod-asgn-btn-primary">
              <Plus size={16} />
              <span>Issue New Directive</span>
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="hod-asgn-grid">
            {filteredAssignments.map((a) => {
              const subsCount = a.submissionsCount || (a.submissions || []).length;
              const evaledCount =
                a.evaluatedCount ||
                (a.submissions || []).filter(
                  (s) => s.status === "evaluated" || s.grade !== null
                ).length;
              const pendingCount = Math.max(0, subsCount - evaledCount);
              const isPastDue = a.dueDate && new Date(a.dueDate) < new Date();
              const evalRate = subsCount > 0 ? Math.round((evaledCount / subsCount) * 100) : 100;

              return (
                <div key={a.id || a._id} className="asgn-card animate-card">
                  <div className="asgn-card-header">
                    <div className="asgn-card-badges">
                      <span className="badge-semester">{a.semester || "Semester 5"}</span>
                      {isPastDue ? (
                        <span className="badge-status-closed">Closed</span>
                      ) : (
                        <span className="badge-status-active">Active</span>
                      )}
                    </div>
                    <div className="asgn-card-actions">
                      <button
                        onClick={() => setDeleteConfirmId(a.id || a._id)}
                        className="asgn-delete-btn"
                        title="Delete assignment"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <h3 className="asgn-card-title">{a.title}</h3>
                  <div className="asgn-subject-tag">
                    <BookOpen size={13} />
                    <span>{a.subject}</span>
                  </div>

                  <p className="asgn-card-desc">
                    {a.description || "No description provided for this deliverable."}
                  </p>

                  <div className="asgn-meta-strip">
                    <div className="meta-item">
                      <User size={13} className="meta-icon" />
                      <span>{a.teacherName || "Faculty Instructor"}</span>
                    </div>
                    <div className="meta-item">
                      <Calendar size={13} className="meta-icon" />
                      <span>
                        Due: {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "Flexible"}
                      </span>
                    </div>
                    <div className="meta-item">
                      <Award size={13} className="meta-icon" />
                      <span>{a.totalPoints || a.maxMarks || 100} Points</span>
                    </div>
                  </div>

                  {/* Submission Progress Meter */}
                  <div className="asgn-progress-box">
                    <div className="progress-labels">
                      <span className="subs-count-text">
                        <strong>{subsCount}</strong> Submissions ({evaledCount} Evaluated)
                      </span>
                      <span className="subs-rate-text">{evalRate}%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${evalRate}%`,
                          backgroundColor:
                            evalRate === 100
                              ? "var(--hod-emerald-500, #10b981)"
                              : "var(--hod-indigo-500, #6366f1)"
                        }}
                      />
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="asgn-card-footer">
                    {pendingCount > 0 && (
                      <span className="pending-pill">
                        <AlertTriangle size={12} />
                        {pendingCount} Pending Review
                      </span>
                    )}
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginLeft: "auto", flexWrap: "wrap" }}>
                      <button
                        onClick={() => setPreviewAssignment(a)}
                        className="view-submissions-btn"
                        style={{ background: "#EEF2FF", color: "#4F46E5", borderColor: "#C7D2FE" }}
                        title="Preview assignment problem statement, handouts & rubric"
                      >
                        <Eye size={14} />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAssignmentForDetails(a);
                          setSubmissionSearch("");
                          setSubmissionFilter("ALL");
                        }}
                        className="view-submissions-btn"
                      >
                        <Users size={14} />
                        <span>Submissions ({subsCount})</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="hod-asgn-table-wrapper">
            <table className="hod-asgn-table">
              <thead>
                <tr>
                  <th>Assignment Title & Subject</th>
                  <th>Semester</th>
                  <th>Faculty Instructor</th>
                  <th>Due Date</th>
                  <th>Max Points</th>
                  <th>Submissions</th>
                  <th>Evaluated</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((a) => {
                  const subsCount = a.submissionsCount || (a.submissions || []).length;
                  const evaledCount =
                    a.evaluatedCount ||
                    (a.submissions || []).filter(
                      (s) => s.status === "evaluated" || s.grade !== null
                    ).length;
                  const isPastDue = a.dueDate && new Date(a.dueDate) < new Date();

                  return (
                    <tr key={a.id || a._id}>
                      <td className="table-title-cell">
                        <div className="title-bold">{a.title}</div>
                        <div className="subject-muted">{a.subject}</div>
                      </td>
                      <td>
                        <span className="badge-semester-sm">{a.semester}</span>
                      </td>
                      <td className="table-instructor-cell">
                        <div className="instructor-row">
                          <div className="instructor-avatar-xs">
                            {(a.teacherName || "F")[0].toUpperCase()}
                          </div>
                          <span>{a.teacherName || "Faculty Instructor"}</span>
                        </div>
                      </td>
                      <td className="table-date-cell">
                        {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "Flexible"}
                      </td>
                      <td>{a.totalPoints || a.maxMarks || 100}</td>
                      <td>
                        <span className="submissions-pill-badge">{subsCount}</span>
                      </td>
                      <td>
                        <span className="evaled-pill-badge">{evaledCount}</span>
                      </td>
                      <td>
                        {isPastDue ? (
                          <span className="table-status-closed">Closed</span>
                        ) : (
                          <span className="table-status-active">Active</span>
                        )}
                      </td>
                      <td>
                        <div className="table-actions-cell">
                          <button
                            onClick={() => setPreviewAssignment(a)}
                            className="table-action-btn view-btn"
                            title="Preview assignment problem statement & rubrics"
                          >
                            <BookOpen size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAssignmentForDetails(a);
                              setSubmissionSearch("");
                              setSubmissionFilter("ALL");
                            }}
                            className="table-action-btn view-btn"
                            title="View student submissions"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(a.id || a._id)}
                            className="table-action-btn delete-btn"
                            title="Delete assignment"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* --- MODAL 1: Submissions Detail Modal / Drawer --- */}
      {selectedAssignmentForDetails && (
        <div className="hod-asgn-modal-backdrop" onClick={() => setSelectedAssignmentForDetails(null)}>
          <div
            className="hod-asgn-modal-content max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="modal-kicker">
                  <span>Student Submissions Audit</span>
                  <span className="modal-sem-tag">{selectedAssignmentForDetails.semester}</span>
                </div>
                <h3 className="modal-title">{selectedAssignmentForDetails.title}</h3>
                <p className="modal-subtitle">
                  Subject: {selectedAssignmentForDetails.subject} • Faculty:{" "}
                  {selectedAssignmentForDetails.teacherName}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setPreviewAssignment(selectedAssignmentForDetails)}
                  className="hod-asgn-btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "0.82rem" }}
                  title="Open Assignment Document & Rubric Preview"
                >
                  <Eye size={14} />
                  <span>Preview Doc</span>
                </button>
                <button
                  onClick={() => setSelectedAssignmentForDetails(null)}
                  className="modal-close-btn"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Submission Filter Controls inside Modal */}
            <div className="modal-sub-toolbar">
              <div className="modal-search-box">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Filter student by name or roll number..."
                  value={submissionSearch}
                  onChange={(e) => setSubmissionSearch(e.target.value)}
                />
              </div>

              <div className="modal-status-filters">
                {["ALL", "evaluated", "submitted", "late"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSubmissionFilter(st)}
                    className={`modal-filter-pill ${submissionFilter === st ? "active" : ""}`}
                  >
                    {st === "ALL" ? "All Submissions" : st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Submissions List */}
            <div className="modal-submissions-scroll">
              {modalSubmissions.length === 0 ? (
                <div className="modal-empty-subs">
                  <AlertCircle size={32} />
                  <p>No student submissions match this criteria.</p>
                </div>
              ) : (
                <div className="modal-subs-list">
                  {modalSubmissions.map((sub, index) => {
                    const student = sub.studentId;
                    const studentName = student?.fullName || `Student #${index + 1}`;
                    const rollNo =
                      student?.rollNumber || student?.enrollmentNumber || "POLY-2026-CSE";
                    const isGraded = sub.grade !== null && sub.grade !== undefined;

                    return (
                      <div key={sub._id || index} className="submission-row-card">
                        <div className="sub-card-left">
                          <div className="sub-student-avatar">
                            {studentName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div className="sub-student-info">
                            <h4 className="student-name">{studentName}</h4>
                            <span className="student-roll">Roll No: {rollNo}</span>
                            <div className="sub-time-meta">
                              <Clock size={12} />
                              <span>
                                Submitted:{" "}
                                {sub.submittedAt
                                  ? new Date(sub.submittedAt).toLocaleString()
                                  : "Recently"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="sub-card-right">
                          <div className="sub-status-column">
                            {sub.status === "evaluated" || isGraded ? (
                              <span className="sub-tag-evaluated">
                                <CheckCircle2 size={13} />
                                Evaluated ({sub.grade}/
                                {selectedAssignmentForDetails.totalPoints ||
                                  selectedAssignmentForDetails.maxMarks ||
                                  100}
                                )
                              </span>
                            ) : sub.status === "late" ? (
                              <span className="sub-tag-late">
                                <AlertTriangle size={13} />
                                Late Submission
                              </span>
                            ) : (
                              <span className="sub-tag-submitted">
                                <Clock size={13} />
                                Submitted (Pending Grade)
                              </span>
                            )}
                          </div>

                          {sub.fileUrl && (
                            <a
                              href={sub.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="sub-attachment-link"
                              title="Download or preview submitted document"
                            >
                              <ExternalLink size={14} />
                              <span>View File</span>
                            </a>
                          )}
                        </div>

                        {/* Submission note or Feedback */}
                        {(sub.submissionText || sub.feedback) && (
                          <div className="sub-notes-tray">
                            {sub.submissionText && (
                              <div className="sub-student-note">
                                <strong>Student Remarks:</strong> "{sub.submissionText}"
                              </div>
                            )}
                            {sub.feedback && (
                              <div className="sub-faculty-feedback">
                                <strong>Faculty Feedback:</strong> "{sub.feedback}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <span className="subs-summary-footer">
                Showing {modalSubmissions.length} of{" "}
                {(selectedAssignmentForDetails.submissions || []).length} total uploads
              </span>
              <button
                onClick={() => setSelectedAssignmentForDetails(null)}
                className="hod-asgn-btn-primary"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Create / Issue Assignment Modal --- */}
      {showCreateModal && (
        <div className="hod-asgn-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div
            className="hod-asgn-modal-content max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="modal-kicker">
                  <Sparkles size={13} />
                  <span>Curriculum Directive</span>
                </div>
                <h3 className="modal-title">Issue Department Assignment</h3>
                <p className="modal-subtitle">
                  Distribute an official department assignment directive to students and faculty.
                </p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="create-asgn-form">
              <div className="form-group">
                <label className="form-label">
                  Assignment Title <span className="text-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implementation of Process Synchronization using Semaphores"
                  value={createFormData.title}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, title: e.target.value })
                  }
                  className="form-input"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Subject Name <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operating Systems"
                    value={createFormData.subject}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, subject: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select
                    value={createFormData.semester}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, semester: e.target.value })
                    }
                    className="form-input"
                  >
                    {SEMESTERS.filter((s) => s !== "ALL").map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Due Date <span className="text-red">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={createFormData.dueDate}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, dueDate: e.target.value })
                    }
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Total Points / Max Marks</label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={createFormData.totalPoints}
                    onChange={(e) =>
                      setCreateFormData({ ...createFormData, totalPoints: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assignment Specifications & Instructions</label>
                <textarea
                  rows={4}
                  placeholder="Provide technical requirements, problem statement, evaluation criteria, and formatting rules..."
                  value={createFormData.description}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, description: e.target.value })
                  }
                  className="form-textarea"
                />
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="hod-asgn-btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="hod-asgn-btn-primary"
                >
                  {createSubmitting ? (
                    <>
                      <div className="btn-spinner" />
                      <span>Distributing Directive...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Issue Directive</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation Dialog --- */}
      {deleteConfirmId && (() => {
        const targetAsgn = assignments.find((a) => (a.id || a._id) === deleteConfirmId) || {};
        const subsCount = targetAsgn.submissionsCount !== undefined && targetAsgn.submissionsCount !== null
          ? targetAsgn.submissionsCount
          : (targetAsgn.submissions || []).filter((s) => s.status !== "draft").length;
        const hasSubmissions = subsCount > 0;

        return (
          <div className="hod-asgn-modal-backdrop" onClick={() => setDeleteConfirmId(null)}>
            <div
              className="hod-asgn-modal-content max-w-md confirm-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="confirm-icon-box">
                <AlertTriangle size={28} className="text-red" />
              </div>
              <h3 className="confirm-title">
                {hasSubmissions ? "Active Student Deliverables Detected" : "Remove Assignment Deliverable?"}
              </h3>
              <p className="confirm-text">
                {hasSubmissions ? (
                  <>
                    <strong>"{targetAsgn.title}"</strong> has <strong>{subsCount}</strong> active student submission(s).
                    Deleting will permanently erase student submissions and evaluations. Moving to <strong>Archive</strong> is recommended.
                  </>
                ) : (
                  <>
                    Are you sure you want to delete <strong>"{targetAsgn.title || "this assignment"}"</strong>? All associated records will be permanently removed.
                  </>
                )}
              </p>
              <div className="confirm-actions">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={deleting}
                  className="hod-asgn-btn-ghost"
                >
                  Cancel
                </button>
                {hasSubmissions ? (
                  <>
                    <button
                      onClick={() => handleArchiveAssignment(targetAsgn)}
                      disabled={deleting}
                      className="hod-asgn-btn-ghost"
                      style={{ background: "#f1f5f9", color: "#334155" }}
                    >
                      Move to Archive
                    </button>
                    <button
                      onClick={() => handleDeleteAssignment(deleteConfirmId, true)}
                      disabled={deleting}
                      className="hod-asgn-btn-danger"
                    >
                      {deleting ? "Removing..." : "Force Delete"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleDeleteAssignment(deleteConfirmId, false)}
                    disabled={deleting}
                    className="hod-asgn-btn-danger"
                  >
                    {deleting ? "Removing..." : "Delete Permanently"}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      {/* Assignment Preview Modal */}
      {previewAssignment && (
        <AssignmentPreviewModal
          assignment={previewAssignment}
          onClose={() => setPreviewAssignment(null)}
        />
      )}
    </div>
  );
}
