import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Archive,
  Layers,
  Award,
  Clock,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
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
  FileText
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./HODTheme.css";
import "./HODAcademicManagement.css";

const SEMESTERS = [
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6"
];

const SUBJECT_TYPES = [
  "Theory",
  "Practical",
  "Tutorial",
  "Elective",
  "Workshop",
  "Project"
];

export default function HODAcademicManagement({ currentUser, onNavigate, showToast }) {
  const deptBranch = currentUser?.department || "CSE";

  // Data states
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({
    totalSubjects: 0,
    theoryCount: 0,
    practicalCount: 0,
    activeCount: 0,
    assignedCount: 0,
    unassignedCount: 0,
    avgSyllabusCompletionRate: 0
  });
  const [facultyRoster, setFacultyRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters & Search
  const [search, setSearch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("active");
  const [selectedAssignmentFilter, setSelectedAssignmentFilter] = useState("ALL");
  const [academicSession, setAcademicSession] = useState("2025-2026 (Odd Semester)");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [sortBy, setSortBy] = useState("subjectCode");
  const [sortOrder, setSortOrder] = useState("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Modals & Drawers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    semester: "Semester 5",
    subjectCode: "",
    subjectName: "",
    credits: 4,
    type: "Theory",
    hoursPerWeek: 4,
    assignedTeacherName: "",
    assignedTeacherId: null,
    description: "",
    prerequisites: "",
    syllabusUnits: [
      { unitNumber: 1, title: "Unit 1: Fundamentals & Introduction", plannedHours: 8, completedHours: 0, isCompleted: false, completionPercentage: 0 },
      { unitNumber: 2, title: "Unit 2: Core Architecture & Models", plannedHours: 10, completedHours: 0, isCompleted: false, completionPercentage: 0 },
      { unitNumber: 3, title: "Unit 3: Implementation & Analysis", plannedHours: 10, completedHours: 0, isCompleted: false, completionPercentage: 0 },
      { unitNumber: 4, title: "Unit 4: Advanced Protocols & Scaling", plannedHours: 8, completedHours: 0, isCompleted: false, completionPercentage: 0 },
      { unitNumber: 5, title: "Unit 5: Real-World Case Studies & Lab Review", plannedHours: 8, completedHours: 0, isCompleted: false, completionPercentage: 0 }
    ]
  });

  // Fetch Stats
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await authApi.getSubjectStats();
      if (res?.success && res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error("[HODAcademicManagement] Failed to fetch stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Subjects
  const loadSubjects = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const params = {};
      if (selectedSemester !== "ALL") params.semester = selectedSemester;
      if (selectedType !== "ALL") params.type = selectedType;
      if (selectedStatus !== "ALL") params.status = selectedStatus;
      if (search.trim()) params.search = search.trim();

      const res = await authApi.getSubjects(params);
      if (res?.success && Array.isArray(res.subjects)) {
        setSubjects(res.subjects);
      } else {
        setSubjects([]);
      }
    } catch (err) {
      console.error("[HODAcademicManagement] Failed to load subjects:", err);
      setErrorMsg(err.message || "Failed to load department curriculum.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedSemester, selectedType, selectedStatus, search]);

  // Load Faculty list for teacher allocation
  const loadFacultyRoster = useCallback(async () => {
    try {
      const res = await authApi.getTeachers({ limit: 50, status: "ALL" });
      if (res?.success && Array.isArray(res.teachers)) {
        setFacultyRoster(res.teachers);
      }
    } catch (err) {
      console.error("[HODAcademicManagement] Failed to fetch teachers:", err);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadFacultyRoster();
  }, [loadStats, loadFacultyRoster]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([loadStats(), loadSubjects()]);
    if (showToast) showToast("Curriculum records synchronized.");
  };

  // Filter & Sort Pipeline
  const filteredSubjects = useMemo(() => {
    let result = [...subjects];

    if (selectedAssignmentFilter === "assigned") {
      result = result.filter((s) => Boolean(s.assignedTeacherName));
    } else if (selectedAssignmentFilter === "unassigned") {
      result = result.filter((s) => !s.assignedTeacherName);
    }

    result.sort((a, b) => {
      let valA = a[sortBy] ?? "";
      let valB = b[sortBy] ?? "";

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [subjects, selectedAssignmentFilter, sortBy, sortOrder]);

  // Pagination calculation
  const totalItems = filteredSubjects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedSubjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSubjects.slice(start, start + itemsPerPage);
  }, [filteredSubjects, currentPage, itemsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Open Create Modal
  const openAddModal = () => {
    setFormData({
      semester: selectedSemester !== "ALL" ? selectedSemester : "Semester 5",
      subjectCode: "",
      subjectName: "",
      credits: 4,
      type: "Theory",
      hoursPerWeek: 4,
      assignedTeacherName: "",
      assignedTeacherId: null,
      description: "",
      prerequisites: "",
      syllabusUnits: [
        { unitNumber: 1, title: "Unit 1: Fundamentals & Architecture", plannedHours: 8, completedHours: 0, isCompleted: false, completionPercentage: 0 },
        { unitNumber: 2, title: "Unit 2: Core Protocols & Operations", plannedHours: 10, completedHours: 0, isCompleted: false, completionPercentage: 0 },
        { unitNumber: 3, title: "Unit 3: Design, Algorithms & Modeling", plannedHours: 10, completedHours: 0, isCompleted: false, completionPercentage: 0 },
        { unitNumber: 4, title: "Unit 4: Verification, Security & Scaling", plannedHours: 8, completedHours: 0, isCompleted: false, completionPercentage: 0 },
        { unitNumber: 5, title: "Unit 5: Industrial Applications & Hands-on", plannedHours: 8, completedHours: 0, isCompleted: false, completionPercentage: 0 }
      ]
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (subject) => {
    setSelectedSubject(subject);
    setFormData({
      semester: subject.semester,
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      credits: subject.credits,
      type: subject.type || "Theory",
      hoursPerWeek: subject.hoursPerWeek || 4,
      assignedTeacherName: subject.assignedTeacherName || "",
      assignedTeacherId: subject.assignedTeacherId || null,
      description: subject.description || "",
      prerequisites: subject.prerequisites || "",
      syllabusUnits: subject.syllabusUnits?.length > 0 ? subject.syllabusUnits : [
        { unitNumber: 1, title: "Unit 1: Fundamentals", plannedHours: 8, completedHours: 0, isCompleted: false, completionPercentage: 0 }
      ]
    });
    setIsEditModalOpen(true);
  };

  // Open Detailed Drawer
  const openDetailDrawer = (subject) => {
    setSelectedSubject(subject);
    setIsDetailDrawerOpen(true);
  };

  // Submit Create Subject
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await authApi.createSubject(formData);
      if (res?.success) {
        if (showToast) showToast(res.message || "Subject added to curriculum successfully.");
        setIsAddModalOpen(false);
        loadSubjects();
        loadStats();
      }
    } catch (err) {
      if (showToast) showToast(err.message || "Failed to create subject.", "warn");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Edit Subject
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubject) return;
    setActionLoading(true);
    try {
      const res = await authApi.updateSubject(selectedSubject.id || selectedSubject._id, formData);
      if (res?.success) {
        if (showToast) showToast(res.message || "Subject updated successfully.");
        setIsEditModalOpen(false);
        loadSubjects();
        loadStats();
        if (selectedSubject && isDetailDrawerOpen) {
          setSelectedSubject(res.subject);
        }
      }
    } catch (err) {
      if (showToast) showToast(err.message || "Failed to update subject.", "warn");
    } finally {
      setActionLoading(false);
    }
  };

  // Update Syllabus Unit in Drawer
  const handleUpdateUnitProgress = async (unitIndex, newPercentage) => {
    if (!selectedSubject) return;
    const updatedUnits = [...selectedSubject.syllabusUnits];
    const unit = { ...updatedUnits[unitIndex] };
    const pct = Math.min(100, Math.max(0, Number(newPercentage)));
    unit.completionPercentage = pct;
    unit.isCompleted = pct === 100;
    unit.completedHours = Math.round((pct / 100) * (unit.plannedHours || 10));
    updatedUnits[unitIndex] = unit;

    try {
      const res = await authApi.updateSubject(selectedSubject.id || selectedSubject._id, {
        syllabusUnits: updatedUnits
      });
      if (res?.success) {
        setSelectedSubject(res.subject);
        setSubjects((prev) =>
          prev.map((s) => (s.id === res.subject.id ? res.subject : s))
        );
        loadStats();
        if (showToast) showToast(`Unit ${unit.unitNumber} progress updated to ${pct}%.`);
      }
    } catch (err) {
      if (showToast) showToast(err.message || "Failed to update unit progress.", "warn");
    }
  };

  // Delete Subject
  const handleDeleteConfirm = async () => {
    if (!selectedSubject) return;
    setActionLoading(true);
    try {
      const res = await authApi.deleteSubject(selectedSubject.id || selectedSubject._id);
      if (res?.success) {
        if (showToast) showToast(res.message || "Subject removed from curriculum.");
        setIsDeleteModalOpen(false);
        setIsDetailDrawerOpen(false);
        loadSubjects();
        loadStats();
      }
    } catch (err) {
      if (showToast) showToast(err.message || "Failed to delete subject.", "warn");
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Faculty Assign Handler
  const handleQuickAssignFaculty = async (subject, teacherName) => {
    try {
      const teacherObj = facultyRoster.find((t) => t.name === teacherName);
      const res = await authApi.updateSubject(subject.id || subject._id, {
        assignedTeacherName: teacherName,
        assignedTeacherId: teacherObj?.userId || null
      });
      if (res?.success) {
        if (showToast) showToast(`Allocated ${subject.subjectCode} to ${teacherName || "Unassigned"}.`);
        loadSubjects();
        loadStats();
      }
    } catch (err) {
      if (showToast) showToast(err.message || "Failed to assign faculty.", "warn");
    }
  };

  // Export Curriculum Report (CSV)
  const handleExportCSV = () => {
    if (subjects.length === 0) {
      if (showToast) showToast("No curriculum records to export.", "warn");
      return;
    }
    const headers = [
      "Semester",
      "Subject Code",
      "Subject Title",
      "Credits",
      "Type",
      "Weekly Hours",
      "Assigned Faculty",
      "Syllabus Completion %",
      "Status"
    ];
    const rows = filteredSubjects.map((s) => [
      `"${s.semester}"`,
      `"${s.subjectCode}"`,
      `"${s.subjectName.replace(/"/g, '""')}"`,
      s.credits,
      `"${s.type}"`,
      s.hoursPerWeek,
      `"${s.assignedTeacherName || "Unassigned"}"`,
      `${s.syllabusCompletionRate || 0}%`,
      `"${s.status}"`
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `SVSU_${deptBranch}_Curriculum_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (showToast) showToast("Curriculum ledger downloaded successfully.");
  };

  return (
    <div className="hod-academic-page" role="region" aria-label="HOD Academic Management">
      {/* Top Breadcrumb & Controls Strip */}
      <header className="hod-academic-header">
        <div className="header-meta-group">
          <div className="dept-tag">
            <GraduationCap size={14} className="text-primary" />
            <span>Department of {deptBranch} Engineering</span>
          </div>
          <h1 className="page-title">Curriculum & Academic Management</h1>
          <p className="page-subtitle">
            Course allocation, syllabus tracking, credit structure, and faculty-subject mapping
          </p>
        </div>

        <div className="header-actions-group">
          <div className="session-select-wrap" title="Current Academic Term">
            <Calendar size={13} />
            <select
              value={academicSession}
              onChange={(e) => setAcademicSession(e.target.value)}
              className="session-select"
            >
              <option value="2025-2026 (Odd Semester)">Session 2025–26 (Odd Sem)</option>
              <option value="2024-2025 (Even Semester)">Session 2024–25 (Even Sem)</option>
              <option value="2024-2025 (Odd Semester)">Session 2024–25 (Odd Sem)</option>
            </select>
          </div>

          <button
            type="button"
            className={`btn-action-refresh ${isRefreshing ? "spinning" : ""}`}
            onClick={handleRefresh}
            title="Refresh academic curriculum data"
          >
            <RefreshCw size={14} />
          </button>

          <button
            type="button"
            className="btn-action-export"
            onClick={handleExportCSV}
            title="Export curriculum report as CSV"
          >
            <Download size={14} />
            <span>Export Report</span>
          </button>

          <button
            type="button"
            className="btn-action-add"
            onClick={openAddModal}
          >
            <Plus size={15} />
            <span>Add New Subject</span>
          </button>
        </div>
      </header>

      {/* KPI Overview Metrics Strip */}
      <section className="hod-academic-kpi-grid" aria-label="Academic Overview Metrics">
        <div className="kpi-card kpi-indigo">
          <div className="kpi-top">
            <span className="kpi-label">Total Department Subjects</span>
            <div className="kpi-icon-wrap indigo">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">{stats.totalSubjects}</span>
            <span className="kpi-pill good">{stats.activeCount} Active</span>
          </div>
          <div className="kpi-foot">
            <span>{stats.theoryCount} Theory • {stats.practicalCount} Practical / Labs</span>
          </div>
        </div>

        <div className="kpi-card kpi-cyan">
          <div className="kpi-top">
            <span className="kpi-label">Avg. Syllabus Completion</span>
            <div className="kpi-icon-wrap cyan">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">{stats.avgSyllabusCompletionRate}%</span>
            <span className="kpi-pill good">On Schedule</span>
          </div>
          <div className="kpi-progress-bar">
            <div
              className="kpi-progress-fill cyan"
              style={{ width: `${stats.avgSyllabusCompletionRate}%` }}
            />
          </div>
          <div className="kpi-foot">
            <span>Aggregated across all 5 syllabus modules</span>
          </div>
        </div>

        <div className="kpi-card kpi-violet">
          <div className="kpi-top">
            <span className="kpi-label">Faculty Allocation Ratio</span>
            <div className="kpi-icon-wrap violet">
              <Users size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">
              {stats.assignedCount} / {stats.totalSubjects}
            </span>
            <span className={`kpi-pill ${stats.unassignedCount === 0 ? "good" : "warn"}`}>
              {stats.unassignedCount === 0 ? "100% Assigned" : `${stats.unassignedCount} Open`}
            </span>
          </div>
          <div className="kpi-foot">
            <span>{facultyRoster.length} verified faculty teaching in department</span>
          </div>
        </div>

        <div className="kpi-card kpi-emerald">
          <div className="kpi-top">
            <span className="kpi-label">Curriculum Compliance</span>
            <div className="kpi-icon-wrap emerald">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-number">AICTE 100%</span>
            <span className="kpi-pill good">Approved</span>
          </div>
          <div className="kpi-foot">
            <span>NBA Tier-II curriculum alignment verified</span>
          </div>
        </div>
      </section>

      {/* Semester Filter Tabs */}
      <section className="hod-semester-tabs-bar" aria-label="Semester navigation">
        <button
          type="button"
          className={`sem-tab-btn ${selectedSemester === "ALL" ? "active" : ""}`}
          onClick={() => {
            setSelectedSemester("ALL");
            setCurrentPage(1);
          }}
        >
          <span>All Semesters ({stats.totalSubjects})</span>
        </button>
        {SEMESTERS.map((sem) => {
          const semCount = subjects.filter((s) => s.semester === sem).length;
          return (
            <button
              key={sem}
              type="button"
              className={`sem-tab-btn ${selectedSemester === sem ? "active" : ""}`}
              onClick={() => {
                setSelectedSemester(sem);
                setCurrentPage(1);
              }}
            >
              <span>{sem}</span>
              {semCount > 0 && <span className="sem-count-badge">{semCount}</span>}
            </button>
          );
        })}
      </section>

      {/* Search, Filter Toolbar & View Mode Switcher */}
      <section className="hod-academic-toolbar">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search by code (CS-501), subject name, or assigned faculty..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
          {search && (
            <button type="button" className="clear-search" onClick={() => setSearch("")}>
              <X size={13} />
            </button>
          )}
        </div>

        <div className="filters-group">
          <div className="select-filter-item">
            <label>Type:</label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Types</option>
              {SUBJECT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="select-filter-item">
            <label>Faculty:</label>
            <select
              value={selectedAssignmentFilter}
              onChange={(e) => {
                setSelectedAssignmentFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Faculty Status</option>
              <option value="assigned">Assigned Only</option>
              <option value="unassigned">Unassigned Only</option>
            </select>
          </div>

          <div className="select-filter-item">
            <label>Status:</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="select-filter-item">
            <label>Sort By:</label>
            <select
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [by, ord] = e.target.value.split("_");
                setSortBy(by);
                setSortOrder(ord);
              }}
            >
              <option value="subjectCode_asc">Code (Ascending)</option>
              <option value="subjectName_asc">Title (A-Z)</option>
              <option value="credits_desc">Credits (Highest)</option>
              <option value="syllabusCompletionRate_desc">Completion (Highest)</option>
            </select>
          </div>

          <div className="view-mode-toggle" role="group" aria-label="Display View">
            <button
              type="button"
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Card Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Detailed Table View"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* Main Subjects Display */}
      {loading ? (
        <div className="hod-academic-skeleton-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-subject-card">
              <div className="sk-line sk-title" />
              <div className="sk-line sk-subtitle" />
              <div className="sk-line sk-bar" />
              <div className="sk-line sk-foot" />
            </div>
          ))}
        </div>
      ) : errorMsg ? (
        <div className="hod-academic-error-box">
          <AlertTriangle size={24} className="text-rose" />
          <h4>Failed to load curriculum</h4>
          <p>{errorMsg}</p>
          <button type="button" className="btn-secondary" onClick={loadSubjects}>
            Retry Request
          </button>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="hod-academic-empty-state">
          <BookOpen size={36} className="empty-icon" />
          <h3>No subjects match the selected filters</h3>
          <p>
            Try clearing search queries or click "Add New Subject" to establish curriculum modules.
          </p>
          <button type="button" className="btn-primary" onClick={openAddModal}>
            <Plus size={14} />
            <span>Create Curriculum Subject</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="hod-subject-cards-grid">
          {paginatedSubjects.map((sub) => {
            const completion = sub.syllabusCompletionRate || 0;
            const isAssigned = Boolean(sub.assignedTeacherName);

            return (
              <article key={sub.id || sub._id} className="hod-subject-card">
                <div className="card-top-strip">
                  <div className="code-pill">
                    <strong>{sub.subjectCode}</strong>
                    <span className="type-badge">{sub.type}</span>
                  </div>
                  <span className="sem-pill">{sub.semester}</span>
                </div>

                <div className="card-content-body">
                  <h3
                    className="subject-title clickable"
                    onClick={() => openDetailDrawer(sub)}
                    title="Click to view detailed syllabus & units"
                  >
                    {sub.subjectName}
                  </h3>
                  <p className="subject-desc">
                    {sub.description || "Comprehensive diploma polytechnic curriculum subject module."}
                  </p>

                  <div className="subject-metrics-pills">
                    <span className="metric-chip">
                      <Award size={12} />
                      <span>{sub.credits} Credits</span>
                    </span>
                    <span className="metric-chip">
                      <Clock size={12} />
                      <span>{sub.hoursPerWeek} Hrs / Wk</span>
                    </span>
                    <span className="metric-chip">
                      <Layers size={12} />
                      <span>{sub.syllabusUnits?.length || 5} Units</span>
                    </span>
                  </div>

                  {/* Syllabus Progress Bar */}
                  <div className="syllabus-progress-wrap">
                    <div className="progress-label-row">
                      <span className="progress-lbl">Syllabus Covered</span>
                      <strong className="progress-pct">{completion}%</strong>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`progress-fill ${completion >= 80 ? "good" : completion >= 50 ? "neutral" : "warn"}`}
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>

                  {/* Assigned Faculty Section */}
                  <div className="assigned-faculty-row">
                    <div className="faculty-info-cell">
                      <User size={13} className={isAssigned ? "text-primary" : "text-muted"} />
                      <span className="faculty-name">
                        {sub.assignedTeacherName || "No Faculty Allocated"}
                      </span>
                    </div>

                    <select
                      value={sub.assignedTeacherName || ""}
                      onChange={(e) => handleQuickAssignFaculty(sub, e.target.value)}
                      className="quick-assign-select"
                      title="Quick allocate faculty"
                    >
                      <option value="">-- Allocate Faculty --</option>
                      {facultyRoster.map((f) => (
                        <option key={f.id || f.name} value={f.name}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="card-footer-strip">
                  <button
                    type="button"
                    className="btn-card-detail"
                    onClick={() => openDetailDrawer(sub)}
                  >
                    <span>Syllabus & Units</span>
                    <ChevronRight size={13} />
                  </button>

                  <div className="card-actions-icons">
                    <button
                      type="button"
                      className="icon-action-btn edit"
                      onClick={() => openEditModal(sub)}
                      title="Edit Subject"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      className="icon-action-btn delete"
                      onClick={() => {
                        setSelectedSubject(sub);
                        setIsDeleteModalOpen(true);
                      }}
                      title="Delete Subject"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="hod-academic-table-wrap">
          <table className="hod-academic-data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Subject Name</th>
                <th>Semester</th>
                <th>Type</th>
                <th>Credits</th>
                <th>Hours</th>
                <th>Assigned Faculty</th>
                <th>Syllabus Completion</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSubjects.map((sub) => {
                const completion = sub.syllabusCompletionRate || 0;
                return (
                  <tr key={sub.id || sub._id}>
                    <td>
                      <code className="table-code">{sub.subjectCode}</code>
                    </td>
                    <td>
                      <div className="table-subject-cell">
                        <strong
                          className="clickable"
                          onClick={() => openDetailDrawer(sub)}
                        >
                          {sub.subjectName}
                        </strong>
                        <small>{sub.description ? `${sub.description.slice(0, 48)}…` : ""}</small>
                      </div>
                    </td>
                    <td><span className="table-sem-chip">{sub.semester}</span></td>
                    <td><span className={`table-type-pill ${sub.type?.toLowerCase()}`}>{sub.type}</span></td>
                    <td><strong>{sub.credits}</strong></td>
                    <td>{sub.hoursPerWeek} / wk</td>
                    <td>
                      <span className={`table-faculty-tag ${sub.assignedTeacherName ? "assigned" : "unassigned"}`}>
                        {sub.assignedTeacherName || "Unassigned"}
                      </span>
                    </td>
                    <td>
                      <div className="table-progress-cell">
                        <div className="mini-track">
                          <div
                            className={`mini-fill ${completion >= 80 ? "good" : completion >= 50 ? "neutral" : "warn"}`}
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                        <span className="mini-pct">{completion}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="table-actions-cell">
                        <button
                          type="button"
                          className="table-btn-view"
                          onClick={() => openDetailDrawer(sub)}
                          title="View Syllabus Units"
                        >
                          <BookOpen size={13} />
                        </button>
                        <button
                          type="button"
                          className="table-btn-edit"
                          onClick={() => openEditModal(sub)}
                          title="Edit Subject"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          className="table-btn-del"
                          onClick={() => {
                            setSelectedSubject(sub);
                            setIsDeleteModalOpen(true);
                          }}
                          title="Delete Subject"
                        >
                          <Trash2 size={13} />
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

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="hod-academic-pagination-bar">
          <div className="pagination-info">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} subjects
          </div>
          <div className="pagination-controls">
            <button
              type="button"
              className="page-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx + 1}
                type="button"
                className={`page-num-btn ${currentPage === idx + 1 ? "active" : ""}`}
                onClick={() => handlePageChange(idx + 1)}
              >
                {idx + 1}
              </button>
            ))}
            <button
              type="button"
              className="page-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: ADD NEW CURRICULUM SUBJECT                            */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="hod-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="hod-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title-row">
                <BookOpen size={16} className="text-primary" />
                <h3>Add New Curriculum Subject</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="modal-form-body">
              <div className="form-grid-2col">
                <div className="form-group">
                  <label>Subject Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-501, CS-504P"
                    value={formData.subjectCode}
                    onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="form-group">
                  <label>Semester *</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  >
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Subject Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems & Linux Architecture"
                  value={formData.subjectName}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                />
              </div>

              <div className="form-grid-3col">
                <div className="form-group">
                  <label>Subject Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {SUBJECT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Weekly Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.hoursPerWeek}
                    onChange={(e) => setFormData({ ...formData, hoursPerWeek: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Allocated Faculty (Optional)</label>
                <select
                  value={formData.assignedTeacherName}
                  onChange={(e) => {
                    const teacherName = e.target.value;
                    const teacherObj = facultyRoster.find((t) => t.name === teacherName);
                    setFormData({
                      ...formData,
                      assignedTeacherName: teacherName,
                      assignedTeacherId: teacherObj?.userId || null
                    });
                  }}
                >
                  <option value="">-- Leave Unassigned for Now --</option>
                  {facultyRoster.map((f) => (
                    <option key={f.id || f.name} value={f.name}>{f.name} ({f.designation || "Lecturer"})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Description & Scope</label>
                <textarea
                  rows={2}
                  placeholder="Summary of course objectives and target outcomes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Saving Subject..." : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDIT CURRICULUM SUBJECT                              */}
      {/* ============================================================== */}
      {isEditModalOpen && (
        <div className="hod-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="hod-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title-row">
                <Edit3 size={16} className="text-primary" />
                <h3>Edit Subject: {formData.subjectCode}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-form-body">
              <div className="form-group">
                <label>Subject Title</label>
                <input
                  type="text"
                  required
                  value={formData.subjectName}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                />
              </div>

              <div className="form-grid-3col">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {SUBJECT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Weekly Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.hoursPerWeek}
                    onChange={(e) => setFormData({ ...formData, hoursPerWeek: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Assigned Faculty</label>
                <select
                  value={formData.assignedTeacherName}
                  onChange={(e) => {
                    const teacherName = e.target.value;
                    const teacherObj = facultyRoster.find((t) => t.name === teacherName);
                    setFormData({
                      ...formData,
                      assignedTeacherName: teacherName,
                      assignedTeacherId: teacherObj?.userId || null
                    });
                  }}
                >
                  <option value="">-- No Faculty Assigned --</option>
                  {facultyRoster.map((f) => (
                    <option key={f.id || f.name} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Course Scope & Overview</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DRAWER: DETAILED SYLLABUS & UNIT PROGRESS TRACKER              */}
      {/* ============================================================== */}
      {isDetailDrawerOpen && selectedSubject && (
        <div className="hod-drawer-overlay" onClick={() => setIsDetailDrawerOpen(false)}>
          <aside className="hod-syllabus-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-title-group">
                <span className="drawer-subcode">{selectedSubject.subjectCode} • {selectedSubject.semester}</span>
                <h2>{selectedSubject.subjectName}</h2>
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setIsDetailDrawerOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="drawer-content-scrollable">
              {/* Overall Progress Banner */}
              <div className="drawer-progress-banner">
                <div className="banner-top">
                  <span>Overall Curriculum Progress</span>
                  <strong>{selectedSubject.syllabusCompletionRate || 0}% Complete</strong>
                </div>
                <div className="banner-track">
                  <div
                    className="banner-fill"
                    style={{ width: `${selectedSubject.syllabusCompletionRate || 0}%` }}
                  />
                </div>
                <div className="banner-meta">
                  <span>Faculty: <b>{selectedSubject.assignedTeacherName || "Unassigned"}</b></span>
                  <span>Credits: <b>{selectedSubject.credits}</b> ({selectedSubject.hoursPerWeek} hrs/wk)</span>
                </div>
              </div>

              {/* Unit-Wise Progression List */}
              <div className="drawer-units-section">
                <h3>Unit-Wise Syllabus Tracking</h3>
                <p className="units-subtext">
                  Adjust unit completion percentages to track real teaching progression:
                </p>

                <div className="units-list">
                  {(selectedSubject.syllabusUnits || []).map((u, idx) => {
                    const isDone = u.completionPercentage === 100;
                    return (
                      <div key={u._id || idx} className={`unit-card-item ${isDone ? "completed" : ""}`}>
                        <div className="unit-header-row">
                          <div className="unit-title-cell">
                            <span className="unit-badge">Unit {u.unitNumber}</span>
                            <h4>{u.title}</h4>
                          </div>
                          <span className={`unit-pct-badge ${isDone ? "done" : ""}`}>
                            {u.completionPercentage || 0}%
                          </span>
                        </div>

                        <div className="unit-slider-row">
                          <label>Completion Level:</label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={u.completionPercentage || 0}
                            onChange={(e) => handleUpdateUnitProgress(idx, e.target.value)}
                          />
                        </div>

                        <div className="unit-footer-info">
                          <span>Planned: {u.plannedHours || 10} Hours</span>
                          <span>Completed: {u.completedHours || 0} Hours</span>
                          <span className={isDone ? "text-emerald" : "text-amber"}>
                            {isDone ? "✓ Unit Fully Covered" : "In Progress"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="drawer-footer-actions">
              <button
                type="button"
                className="btn-drawer-edit"
                onClick={() => {
                  openEditModal(selectedSubject);
                }}
              >
                <Edit3 size={14} />
                <span>Edit Subject Details</span>
              </button>
              <button
                type="button"
                className="btn-drawer-close"
                onClick={() => setIsDetailDrawerOpen(false)}
              >
                Done
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: DELETE CONFIRMATION                                   */}
      {/* ============================================================== */}
      {isDeleteModalOpen && selectedSubject && (
        <div className="hod-modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="hod-modal-card confirm-delete-card" onClick={(e) => e.stopPropagation()}>
            <div className="delete-icon-circle">
              <AlertTriangle size={24} className="text-rose" />
            </div>
            <h3>Remove Subject from Curriculum?</h3>
            <p>
              Are you sure you want to delete <strong>{selectedSubject.subjectCode} ({selectedSubject.subjectName})</strong>? This action cannot be undone.
            </p>
            <div className="modal-footer-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger-confirm"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
              >
                {actionLoading ? "Removing..." : "Delete Subject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
