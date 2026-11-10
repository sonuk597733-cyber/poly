import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Award,
  Calendar,
  Clock,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  User,
  Users,
  Download,
  Printer,
  RefreshCw,
  LayoutGrid,
  List,
  BarChart2,
  TrendingUp,
  GraduationCap,
  Sparkles,
  X,
  Check,
  Building,
  ShieldAlert,
  ChevronRight,
  Sliders,
  CheckSquare,
  FileCheck
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./HODTheme.css";
import "./HODExaminations.css";

const EXAM_TYPES = ["ALL", "Mid Term 1", "Mid Term 2", "Practical Exam", "End Semester"];
const SEMESTERS = [
  "ALL",
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6"
];
const STATUS_OPTIONS = ["ALL", "scheduled", "in-progress", "completed", "postponed", "cancelled"];

export default function HODExaminations() {
  // --- States ---
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const [schedules, setSchedules] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalEvaluatedStudents: 0,
    overallPassPercentage: 92,
    totalSchedules: 0,
    scheduledCount: 0,
    completedCount: 0
  });

  // Filters
  const [selectedSemester, setSelectedSemester] = useState("ALL");
  const [selectedExamType, setSelectedExamType] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("table"); // table | grid

  // Schedule Modal (Create / Edit)
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // create | edit
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    subjectName: "",
    subjectCode: "",
    semester: "Semester 5",
    examType: "Mid Term 1",
    examDate: "",
    startTime: "10:00 AM",
    endTime: "01:00 PM",
    roomNo: "Exam Hall A (Room 201)",
    maxMarks: 100,
    passingMarks: 40,
    invigilatorName: "Prof. Arvind Mehta",
    status: "scheduled",
    totalStudents: 60
  });

  // Attendance & Duty Modal
  const [showDutyModal, setShowDutyModal] = useState(false);
  const [dutyExam, setDutyExam] = useState(null);
  const [dutySubmitting, setDutySubmitting] = useState(false);
  const [dutyData, setDutyData] = useState({
    invigilatorName: "",
    roomNo: "",
    totalStudents: 60,
    presentStudents: 58,
    status: "scheduled"
  });

  // Delete Confirmation
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // --- Load Data ---
  const loadExamsData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [schedRes, analRes] = await Promise.all([
        authApi.getExamSchedules({}),
        authApi.getExamAnalytics()
      ]);

      if (schedRes && schedRes.success) {
        setSchedules(schedRes.schedules || []);
      }
      if (analRes && analRes.success) {
        setAnalytics(analRes.analytics || {});
      }
    } catch (err) {
      console.error("HODExaminations load error:", err);
      setError(err.message || "Failed to load examination datesheets.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadExamsData();
  }, [loadExamsData]);

  // Toast Auto-Dismiss
  useEffect(() => {
    if (actionSuccess) {
      const t = setTimeout(() => setActionSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [actionSuccess]);

  // --- Filtered List ---
  const filteredSchedules = useMemo(() => {
    let list = [...schedules];

    if (selectedSemester !== "ALL") {
      list = list.filter((s) => s.semester === selectedSemester);
    }
    if (selectedExamType !== "ALL") {
      list = list.filter((s) => s.examType === selectedExamType);
    }
    if (statusFilter !== "ALL") {
      list = list.filter((s) => s.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          (s.subjectName && s.subjectName.toLowerCase().includes(q)) ||
          (s.subjectCode && s.subjectCode.toLowerCase().includes(q)) ||
          (s.invigilatorName && s.invigilatorName.toLowerCase().includes(q)) ||
          (s.roomNo && s.roomNo.toLowerCase().includes(q))
      );
    }

    // Sort by exam date ascending
    list.sort((a, b) => new Date(a.examDate || 0) - new Date(b.examDate || 0));
    return list;
  }, [schedules, selectedSemester, selectedExamType, statusFilter, searchQuery]);

  // --- Handlers ---
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setFormData({
      subjectName: "",
      subjectCode: "",
      semester: selectedSemester !== "ALL" ? selectedSemester : "Semester 5",
      examType: selectedExamType !== "ALL" ? selectedExamType : "Mid Term 1",
      examDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      startTime: "10:00 AM",
      endTime: "01:00 PM",
      roomNo: "Exam Hall A (Room 201)",
      maxMarks: 100,
      passingMarks: 40,
      invigilatorName: "Prof. Arvind Mehta",
      status: "scheduled",
      totalStudents: 60
    });
    setShowScheduleModal(true);
  };

  const handleOpenEditModal = (item) => {
    setModalMode("edit");
    setEditingId(item.id || item._id);
    setFormData({
      subjectName: item.subjectName || "",
      subjectCode: item.subjectCode || "",
      semester: item.semester || "Semester 5",
      examType: item.examType || "Mid Term 1",
      examDate: item.examDate ? new Date(item.examDate).toISOString().split("T")[0] : "",
      startTime: item.startTime || "10:00 AM",
      endTime: item.endTime || "01:00 PM",
      roomNo: item.roomNo || "",
      maxMarks: item.maxMarks || 100,
      passingMarks: item.passingMarks || 40,
      invigilatorName: item.invigilatorName || "",
      status: item.status || "scheduled",
      totalStudents: item.totalStudents || 60
    });
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!formData.subjectName.trim() || !formData.subjectCode.trim() || !formData.examDate) {
      alert("Please fill in subject name, code, and examination date.");
      return;
    }

    setScheduleSubmitting(true);
    try {
      if (modalMode === "create") {
        const res = await authApi.createExamSchedule(formData);
        if (res && res.success) {
          setActionSuccess("Examination datesheet slot scheduled successfully!");
          setShowScheduleModal(false);
          loadExamsData(true);
        } else {
          throw new Error(res?.message || "Failed to schedule examination.");
        }
      } else {
        const res = await authApi.updateExamSchedule(editingId, formData);
        if (res && res.success) {
          setActionSuccess("Examination schedule record updated.");
          setShowScheduleModal(false);
          loadExamsData(true);
        } else {
          throw new Error(res?.message || "Failed to update examination schedule.");
        }
      }
    } catch (err) {
      alert(err.message || "Error saving schedule.");
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id) => {
    setDeleting(true);
    try {
      const res = await authApi.deleteExamSchedule(id);
      if (res && res.success) {
        setActionSuccess("Examination schedule slot cancelled & removed.");
        setDeleteId(null);
        loadExamsData(true);
      } else {
        throw new Error(res?.message || "Failed to delete exam schedule.");
      }
    } catch (err) {
      alert(err.message || "Error deleting exam schedule.");
    } finally {
      setDeleting(false);
    }
  };

  // Open Duty & Attendance Modal
  const handleOpenDutyModal = (item) => {
    setDutyExam(item);
    setDutyData({
      invigilatorName: item.invigilatorName || "",
      roomNo: item.roomNo || "",
      totalStudents: item.totalStudents || 60,
      presentStudents: item.presentStudents || item.totalStudents || 60,
      status: item.status || "scheduled"
    });
    setShowDutyModal(true);
  };

  const handleSaveDuty = async (e) => {
    e.preventDefault();
    if (!dutyExam) return;
    setDutySubmitting(true);

    try {
      const absent = Math.max(0, dutyData.totalStudents - dutyData.presentStudents);
      const res = await authApi.updateExamSchedule(dutyExam.id || dutyExam._id, {
        invigilatorName: dutyData.invigilatorName,
        roomNo: dutyData.roomNo,
        totalStudents: Number(dutyData.totalStudents),
        presentStudents: Number(dutyData.presentStudents),
        absentStudents: absent,
        status: dutyData.status
      });

      if (res && res.success) {
        setActionSuccess("Invigilation duty and student attendance updated.");
        setShowDutyModal(false);
        loadExamsData(true);
      } else {
        throw new Error(res?.message || "Failed to update invigilation duty.");
      }
    } catch (err) {
      alert(err.message || "Error saving duty update.");
    } finally {
      setDutySubmitting(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredSchedules.length === 0) {
      alert("No examination datesheets to export.");
      return;
    }

    const headers = [
      "Subject Code",
      "Subject Name",
      "Semester",
      "Exam Type",
      "Date",
      "Time Slot",
      "Hall / Room",
      "Invigilator",
      "Max Marks",
      "Passing Marks",
      "Total Candidates",
      "Status"
    ];

    const rows = filteredSchedules.map((s) => [
      `"${s.subjectCode}"`,
      `"${s.subjectName.replace(/"/g, '""')}"`,
      `"${s.semester}"`,
      `"${s.examType}"`,
      `"${new Date(s.examDate).toLocaleDateString()}"`,
      `"${s.startTime} - ${s.endTime}"`,
      `"${s.roomNo}"`,
      `"${s.invigilatorName}"`,
      s.maxMarks,
      s.passingMarks,
      s.totalStudents,
      s.status
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `HOD_Exam_Datesheet_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="hod-exams-page">
      {/* Toast Alert */}
      {actionSuccess && (
        <div className="hod-exam-toast-success animate-fade-in">
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="toast-close-btn">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <header className="hod-exam-header-card">
        <div className="hod-exam-header-left">
          <div className="hod-exam-title-badge">
            <span className="hod-badge-pulse" />
            <Award size={14} className="hod-badge-icon" />
            <span>Institutional Examination Authority</span>
          </div>
          <h1 className="hod-exam-page-title">Department Examinations Command</h1>
          <p className="hod-exam-page-subtitle">
            Configure internal assessment datesheets, assign faculty invigilation duties, monitor
            seating capacity & candidate attendance, and audit academic evaluation integrity.
          </p>
        </div>

        <div className="hod-exam-header-actions">
          <button
            onClick={() => loadExamsData(true)}
            disabled={loading || refreshing}
            className="hod-exam-btn-ghost"
            title="Synchronize exam records"
          >
            <RefreshCw size={16} className={refreshing ? "spin-icon" : ""} />
            <span>{refreshing ? "Syncing..." : "Sync"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="hod-exam-btn-secondary"
            title="Export datesheet to CSV"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="hod-exam-btn-secondary"
            title="Print examination datesheet"
          >
            <Printer size={16} />
            <span>Print Datesheet</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="hod-exam-btn-primary"
            title="Schedule new examination slot"
          >
            <Plus size={16} />
            <span>Schedule Exam</span>
          </button>
        </div>
      </header>

      {/* Institutional Policy Directive Notice */}
      <div className="hod-exam-notice-banner">
        <ShieldAlert size={20} className="notice-icon" />
        <div className="notice-text">
          <strong>Controller of Examinations Protocol:</strong> Department HOD coordinates internal
          datesheets and faculty invigilation rosters. Official university marks tabulation and
          semester result declaration requires final approval from the Office of the Controller of
          Examinations.
        </div>
      </div>

      {/* KPI Metric Strip */}
      <section className="hod-exam-kpi-grid">
        {/* KPI 1 */}
        <div className="hod-exam-kpi-card">
          <div className="kpi-icon-wrapper kpi-indigo">
            <Calendar size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Scheduled Exam Slots</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{analytics.totalSchedules || schedules.length}</span>
              <span className="kpi-tag-sub">Paper Sessions</span>
            </div>
            <div className="kpi-footer-metric">
              <Sparkles size={12} />
              <span>{analytics.scheduledCount || 0} Pending Execution</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="hod-exam-kpi-card">
          <div className="kpi-icon-wrapper kpi-teal">
            <Users size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Candidate Seats</span>
            <div className="kpi-value-row">
              <span className="kpi-value">
                {schedules.reduce((acc, curr) => acc + (curr.totalStudents || 0), 0)}
              </span>
              <span className="kpi-tag-sub">Total Roll</span>
            </div>
            <div className="kpi-footer-metric">
              <Building size={12} />
              <span>Across 4 Examination Halls</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="hod-exam-kpi-card">
          <div className="kpi-icon-wrapper kpi-emerald">
            <Award size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Department Pass Rate</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{analytics.overallPassPercentage}%</span>
              <span className="kpi-rate-badge">Accredited</span>
            </div>
            <div className="kpi-progress-bar-container">
              <div
                className="kpi-progress-fill"
                style={{ width: `${analytics.overallPassPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="hod-exam-kpi-card">
          <div className="kpi-icon-wrapper kpi-amber">
            <CheckSquare size={22} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Evaluation Completed</span>
            <div className="kpi-value-row">
              <span className="kpi-value">{analytics.completedCount || 0}</span>
              <span className="kpi-tag-sub">Of {schedules.length} Papers</span>
            </div>
            <div className="kpi-footer-metric">
              <CheckCircle2 size={12} />
              <span>Marks Transferred to ERP</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <section className="hod-exam-main-container">
        {/* Semester Tabs */}
        <div className="hod-exam-tabs-bar">
          <div className="tabs-scroll-area">
            {SEMESTERS.map((sem) => {
              const count =
                sem === "ALL"
                  ? schedules.length
                  : schedules.filter((s) => s.semester === sem).length;
              const isActive = selectedSemester === sem;
              return (
                <button
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className={`hod-sem-tab ${isActive ? "active" : ""}`}
                >
                  <span>{sem === "ALL" ? "All Semesters" : sem}</span>
                  <span className="tab-counter-badge">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="hod-exam-toolbar">
          <div className="toolbar-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by subject code, name, invigilator or hall..."
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
            {/* Exam Type Selector */}
            <div className="toolbar-select-wrapper">
              <Filter size={14} className="select-icon" />
              <select
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
                className="toolbar-select"
              >
                {EXAM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t === "ALL" ? "All Exam Types" : t}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Selector */}
            <div className="toolbar-select-wrapper">
              <Sliders size={14} className="select-icon" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="toolbar-select"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st === "ALL" ? "All Statuses" : st.charAt(0).toUpperCase() + st.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* View Switcher */}
            <div className="toolbar-view-toggle">
              <button
                onClick={() => setViewMode("table")}
                className={`view-btn ${viewMode === "table" ? "active" : ""}`}
                title="Table View"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                title="Grid View"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="hod-exam-loading-state">
            <div className="exam-spinner" />
            <p>Loading examination datesheet and invigilation rosters...</p>
          </div>
        ) : error ? (
          <div className="hod-exam-error-state">
            <AlertCircle size={36} className="text-red" />
            <h3>Failed to load examinations data</h3>
            <p>{error}</p>
            <button onClick={() => loadExamsData(true)} className="hod-exam-btn-primary">
              <RefreshCw size={15} />
              <span>Retry Load</span>
            </button>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="hod-exam-empty-state">
            <Calendar size={48} className="empty-icon" />
            <h3>No examination sessions found</h3>
            <p>No exams match the current semester, cycle, or search filter.</p>
            <button onClick={handleOpenCreateModal} className="hod-exam-btn-primary">
              <Plus size={16} />
              <span>Schedule New Exam</span>
            </button>
          </div>
        ) : viewMode === "table" ? (
          /* Table View */
          <div className="hod-exam-table-wrapper">
            <table className="hod-exam-table">
              <thead>
                <tr>
                  <th>Paper Code & Subject</th>
                  <th>Semester</th>
                  <th>Exam Type</th>
                  <th>Date & Time Slot</th>
                  <th>Exam Hall</th>
                  <th>Assigned Invigilator</th>
                  <th>Attendance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((s) => {
                  const present = s.presentStudents || 0;
                  const total = s.totalStudents || 60;
                  const attendPct = total > 0 ? Math.round((present / total) * 100) : 100;
                  const dateStr = s.examDate
                    ? new Date(s.examDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })
                    : "TBD";

                  return (
                    <tr key={s.id || s._id}>
                      <td className="table-subject-cell">
                        <span className="paper-code">{s.subjectCode}</span>
                        <span className="paper-name">{s.subjectName}</span>
                      </td>
                      <td>
                        <span className="badge-semester-sm">{s.semester}</span>
                      </td>
                      <td>
                        <span className="badge-exam-type">{s.examType}</span>
                      </td>
                      <td className="table-time-cell">
                        <div className="date-bold">{dateStr}</div>
                        <div className="slot-muted">
                          {s.startTime} - {s.endTime}
                        </div>
                      </td>
                      <td>
                        <span className="hall-tag">
                          <Building size={12} />
                          {s.roomNo}
                        </span>
                      </td>
                      <td>
                        <div className="invigilator-cell">
                          <div className="invigilator-avatar-xs">
                            {(s.invigilatorName || "F")[0].toUpperCase()}
                          </div>
                          <span>{s.invigilatorName || "Unassigned"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="attend-progress-cell">
                          <span className="attend-num">
                            {present} / {total} ({attendPct}%)
                          </span>
                          <div className="mini-track">
                            <div
                              className="mini-fill"
                              style={{
                                width: `${attendPct}%`,
                                backgroundColor: attendPct > 80 ? "#10b981" : "#f59e0b"
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`exam-status-badge status-${s.status}`}>
                          {s.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions-cell">
                          <button
                            onClick={() => handleOpenDutyModal(s)}
                            className="table-action-btn duty-btn"
                            title="Update invigilation duty & attendance"
                          >
                            <FileCheck size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(s)}
                            className="table-action-btn edit-btn"
                            title="Edit datesheet slot"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteId(s.id || s._id)}
                            className="table-action-btn delete-btn"
                            title="Cancel exam session"
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
        ) : (
          /* Grid View */
          <div className="hod-exam-grid">
            {filteredSchedules.map((s) => {
              const present = s.presentStudents || 0;
              const total = s.totalStudents || 60;
              const attendPct = total > 0 ? Math.round((present / total) * 100) : 100;
              const dateStr = s.examDate
                ? new Date(s.examDate).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })
                : "TBD";

              return (
                <div key={s.id || s._id} className="exam-card animate-card">
                  <div className="exam-card-header">
                    <span className="badge-semester">{s.semester}</span>
                    <span className={`exam-status-badge status-${s.status}`}>{s.status}</span>
                  </div>

                  <div className="exam-card-code-row">
                    <span className="paper-code-lg">{s.subjectCode}</span>
                    <span className="badge-exam-type">{s.examType}</span>
                  </div>

                  <h3 className="exam-card-title">{s.subjectName}</h3>

                  <div className="exam-info-grid">
                    <div className="info-item">
                      <Calendar size={13} className="info-icon" />
                      <span>{dateStr}</span>
                    </div>
                    <div className="info-item">
                      <Clock size={13} className="info-icon" />
                      <span>
                        {s.startTime} - {s.endTime}
                      </span>
                    </div>
                    <div className="info-item">
                      <Building size={13} className="info-icon" />
                      <span>{s.roomNo}</span>
                    </div>
                    <div className="info-item">
                      <Award size={13} className="info-icon" />
                      <span>
                        Max: {s.maxMarks} / Pass: {s.passingMarks}
                      </span>
                    </div>
                  </div>

                  {/* Invigilator Box */}
                  <div className="exam-invigilator-box">
                    <div className="invigilator-avatar-sm">
                      {(s.invigilatorName || "F")[0].toUpperCase()}
                    </div>
                    <div className="invigilator-text">
                      <span className="invigilator-label">Invigilator On Duty</span>
                      <span className="invigilator-name">{s.invigilatorName || "Not Assigned"}</span>
                    </div>
                  </div>

                  {/* Attendance Bar */}
                  <div className="exam-attend-box">
                    <div className="attend-labels">
                      <span>Candidate Attendance</span>
                      <span>
                        {present} / {total} ({attendPct}%)
                      </span>
                    </div>
                    <div className="mini-track">
                      <div
                        className="mini-fill"
                        style={{
                          width: `${attendPct}%`,
                          backgroundColor: attendPct > 80 ? "#10b981" : "#f59e0b"
                        }}
                      />
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="exam-card-footer">
                    <button
                      onClick={() => handleOpenDutyModal(s)}
                      className="card-duty-btn"
                    >
                      <FileCheck size={13} />
                      <span>Duty & Attendance</span>
                    </button>
                    <div className="card-right-actions">
                      <button
                        onClick={() => handleOpenEditModal(s)}
                        className="card-icon-btn"
                        title="Edit slot"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteId(s.id || s._id)}
                        className="card-icon-btn delete"
                        title="Cancel exam"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* --- MODAL 1: Schedule Exam Modal (Create / Edit) --- */}
      {showScheduleModal && (
        <div className="hod-exam-modal-backdrop" onClick={() => setShowScheduleModal(false)}>
          <div
            className="hod-exam-modal-content max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="modal-kicker">
                  <Award size={13} />
                  <span>Datesheet Configuration</span>
                </div>
                <h3 className="modal-title">
                  {modalMode === "create" ? "Schedule Examination Session" : "Edit Examination Slot"}
                </h3>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="exam-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Subject Code <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-501"
                    value={formData.subjectCode}
                    onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Subject Name <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operating Systems & Linux Architecture"
                    value={formData.subjectName}
                    onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="form-input"
                  >
                    {SEMESTERS.filter((s) => s !== "ALL").map((sem) => (
                      <option key={sem} value={sem}>
                        {sem}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Examination Cycle</label>
                  <select
                    value={formData.examType}
                    onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                    className="form-input"
                  >
                    {EXAM_TYPES.filter((t) => t !== "ALL").map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">
                    Exam Date <span className="text-red">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.examDate}
                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="text"
                    placeholder="10:00 AM"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="text"
                    placeholder="01:00 PM"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Room / Hall Location</label>
                  <input
                    type="text"
                    placeholder="Exam Hall A (Room 201)"
                    value={formData.roomNo}
                    onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Faculty Invigilator</label>
                  <input
                    type="text"
                    placeholder="Prof. Arvind Mehta"
                    value={formData.invigilatorName}
                    onChange={(e) =>
                      setFormData({ ...formData, invigilatorName: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Max Marks</label>
                  <input
                    type="number"
                    value={formData.maxMarks}
                    onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Passing Marks</label>
                  <input
                    type="number"
                    value={formData.passingMarks}
                    onChange={(e) => setFormData({ ...formData, passingMarks: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Candidate Roll</label>
                  <input
                    type="number"
                    value={formData.totalStudents}
                    onChange={(e) => setFormData({ ...formData, totalStudents: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="hod-exam-btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduleSubmitting}
                  className="hod-exam-btn-primary"
                >
                  {scheduleSubmitting ? (
                    <span>Saving Slot...</span>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>{modalMode === "create" ? "Save Datesheet Slot" : "Update Schedule"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Invigilation Duty & Attendance Modal --- */}
      {showDutyModal && dutyExam && (
        <div className="hod-exam-modal-backdrop" onClick={() => setShowDutyModal(false)}>
          <div
            className="hod-exam-modal-content max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="modal-kicker">
                  <CheckSquare size={13} />
                  <span>Exam Hall Supervision</span>
                </div>
                <h3 className="modal-title">Invigilation & Attendance Audit</h3>
                <p className="modal-subtitle">
                  {dutyExam.subjectCode} — {dutyExam.subjectName} ({dutyExam.semester})
                </p>
              </div>
              <button onClick={() => setShowDutyModal(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDuty} className="exam-form">
              <div className="form-group">
                <label className="form-label">Assigned Faculty Invigilator</label>
                <input
                  type="text"
                  required
                  value={dutyData.invigilatorName}
                  onChange={(e) => setDutyData({ ...dutyData, invigilatorName: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Examination Hall</label>
                <input
                  type="text"
                  required
                  value={dutyData.roomNo}
                  onChange={(e) => setDutyData({ ...dutyData, roomNo: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Total Candidates</label>
                  <input
                    type="number"
                    min="1"
                    value={dutyData.totalStudents}
                    onChange={(e) => setDutyData({ ...dutyData, totalStudents: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Present Candidates</label>
                  <input
                    type="number"
                    min="0"
                    max={dutyData.totalStudents}
                    value={dutyData.presentStudents}
                    onChange={(e) => setDutyData({ ...dutyData, presentStudents: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Execution Status</label>
                <select
                  value={dutyData.status}
                  onChange={(e) => setDutyData({ ...dutyData, status: e.target.value })}
                  className="form-input"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in-progress">In Progress (Exam Underway)</option>
                  <option value="completed">Completed & Papers Collected</option>
                  <option value="postponed">Postponed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  onClick={() => setShowDutyModal(false)}
                  className="hod-exam-btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dutySubmitting}
                  className="hod-exam-btn-primary"
                >
                  {dutySubmitting ? "Updating..." : "Save Supervision Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation Dialog --- */}
      {deleteId && (
        <div className="hod-exam-modal-backdrop" onClick={() => setDeleteId(null)}>
          <div
            className="hod-exam-modal-content max-w-md confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-icon-box">
              <AlertTriangle size={28} className="text-red" />
            </div>
            <h3 className="confirm-title">Cancel Examination Session?</h3>
            <p className="confirm-text">
              Are you sure you want to cancel and remove this examination datesheet slot? This will
              unassign the invigilator and remove candidate records for this paper.
            </p>
            <div className="confirm-actions">
              <button
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="hod-exam-btn-ghost"
              >
                Keep Exam Slot
              </button>
              <button
                onClick={() => handleDeleteSchedule(deleteId)}
                disabled={deleting}
                className="hod-exam-btn-danger"
              >
                {deleting ? "Cancelling..." : "Cancel Exam Session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
