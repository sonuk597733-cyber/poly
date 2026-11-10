import React, { useState, useEffect, useMemo } from "react";
import {
  Award, Calendar, Clock, MapPin, User, Plus, Filter,
  CheckCircle2, XCircle, AlertCircle, Search, Eye, ArrowRight,
  ShieldCheck, RotateCcw, Loader2, Send, Users, ChevronDown, Check,
  AlertTriangle, FileText, CheckCheck, RefreshCw
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./CoordinatorExams.css";

const BRANCHES = ["All", "CSE", "Mechanical", "Electrical", "Civil", "ECE"];
const SEMESTERS = ["All", "Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6"];

export default function CoordinatorExams({ showToast }) {
  const [activeTab, setActiveTab] = useState("verification"); // "verification" | "schedule"

  // Verification State
  const [pendingBatches, setPendingBatches] = useState([]);
  const [allPendingMarks, setAllPendingMarks] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Inspection Drawer State
  const [inspectingBatch, setInspectingBatch] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Return Dialog State
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [batchToReturn, setBatchToReturn] = useState(null);
  const [returnReason, setReturnReason] = useState("");

  // Existing Schedules State (Preserved)
  const [examSchedules, setExamSchedules] = useState([
    { id: "EX-101", title: "Operating Systems Midterm 1", code: "CS-301", branch: "CSE", sem: "Semester 3", date: "15 Nov 2026", time: "10:00 AM - 12:00 PM", hall: "LT-101 & LT-102", invigilator: "Dr. Rajesh Verma", type: "Midterm" },
    { id: "EX-102", title: "Data Structures & Algorithms Midterm 1", code: "CS-302", branch: "CSE", sem: "Semester 3", date: "17 Nov 2026", time: "10:00 AM - 12:00 PM", hall: "LT-101 & LT-102", invigilator: "Er. Amit Sharma", type: "Midterm" },
    { id: "EX-103", title: "Thermodynamics & Fluid Dynamics", code: "ME-301", branch: "Mechanical", sem: "Semester 3", date: "15 Nov 2026", time: "02:00 PM - 04:00 PM", hall: "LT-103 & LT-104", invigilator: "Prof. Sunil Kumar", type: "Midterm" },
    { id: "EX-104", title: "Circuit Analysis & AC Machines", code: "EE-301", branch: "Electrical", sem: "Semester 3", date: "16 Nov 2026", time: "10:00 AM - 12:00 PM", hall: "LT-101 & LT-102", invigilator: "Dr. Meenakshi Sundaram", type: "Midterm" }
  ]);

  // Load Pending Coordinator Marks from Backend
  const loadPendingMarks = async () => {
    setLoadingPending(true);
    try {
      const res = await authApi.getPendingCoordinatorMarks();
      setPendingBatches(res?.batches || []);
      setAllPendingMarks(res?.marks || []);
    } catch (err) {
      console.warn("Coordinator pending marks load error:", err);
      setPendingBatches([]);
      setAllPendingMarks([]);
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    loadPendingMarks();
  }, []);

  // Filter pending batches
  const filteredBatches = useMemo(() => {
    return pendingBatches.filter((b) => {
      if (selectedBranch !== "All" && b.branch !== selectedBranch) return false;
      if (selectedSemester !== "All" && b.semester !== selectedSemester) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSub = (b.subject || "").toLowerCase().includes(q);
        const matchCode = (b.subjectCode || "").toLowerCase().includes(q);
        return matchSub || matchCode;
      }
      return true;
    });
  }, [pendingBatches, selectedBranch, selectedSemester, searchQuery]);

  // Action: Verify a batch
  const handleVerifyBatch = async (batch) => {
    if (!window.confirm(`Verify and approve marks batch for ${batch.subject} (${batch.totalStudents} candidates)? This will forward the batch to the HOD.`)) {
      return;
    }

    setActionInProgress(true);
    try {
      const res = await authApi.verifyExamMarksBatch({
        branch: batch.branch,
        semester: batch.semester,
        subject: batch.subject,
        academicSession: batch.academicSession,
        examType: batch.examType
      });

      showToast?.(res.message || `Successfully verified ${batch.subject} marks batch and notified HOD.`);
      setInspectingBatch(null);
      loadPendingMarks();
    } catch (err) {
      showToast?.(err.message || "Failed to verify marks batch.", true);
    } finally {
      setActionInProgress(false);
    }
  };

  // Open Return Dialog
  const handleOpenReturnModal = (batch) => {
    setBatchToReturn(batch);
    setReturnReason("");
    setShowReturnModal(true);
  };

  // Action: Return batch to faculty with mandatory revision reason
  const handleConfirmReturn = async () => {
    if (!returnReason.trim()) {
      showToast?.("A specific revision reason is required to return marks to faculty.", true);
      return;
    }

    setActionInProgress(true);
    try {
      const res = await authApi.rejectExamMarksBatch({
        branch: batchToReturn.branch,
        semester: batchToReturn.semester,
        subject: batchToReturn.subject,
        returnReason: returnReason.trim()
      });

      showToast?.(res.message || "Marks batch returned to faculty with revision instructions.");
      setShowReturnModal(false);
      setBatchToReturn(null);
      setInspectingBatch(null);
      loadPendingMarks();
    } catch (err) {
      showToast?.(err.message || "Failed to return marks batch.", true);
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="coord-exam-container">
      {/* Pane Header */}
      <div className="coord-pane-header">
        <div>
          <h2>
            <Award size={24} color="#0284c7" />
            Academic Examination & Verification Command Center
          </h2>
          <p>
            Audit continuous assessment marks submitted by faculty, verify component scores, and coordinate examination schedules.
          </p>
        </div>

        <div className="coord-header-actions">
          <button
            type="button"
            className="coord-filter-select"
            style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
            onClick={loadPendingMarks}
          >
            <RotateCcw size={14} />
            <span>Refresh Submissions</span>
          </button>
        </div>
      </div>

      {/* Primary Workspace Tabs */}
      <div className="coord-workspace-tabs">
        <button
          type="button"
          className={`coord-workspace-tab ${activeTab === "verification" ? "active" : ""}`}
          onClick={() => setActiveTab("verification")}
        >
          <ShieldCheck size={16} />
          <span>Faculty Verification Queue ({pendingBatches.length})</span>
        </button>

        <button
          type="button"
          className={`coord-workspace-tab ${activeTab === "schedule" ? "active" : ""}`}
          onClick={() => setActiveTab("schedule")}
        >
          <Calendar size={16} />
          <span>Examination Timetable & Invigilation</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: FACULTY VERIFICATION QUEUE
          ========================================================================= */}
      {activeTab === "verification" && (
        <div className="coord-verification-workspace">
          {/* KPI Summary Bar */}
          <div className="coord-kpi-summary-grid">
            <div className="coord-kpi-card">
              <div className="coord-kpi-icon blue"><Clock size={20} /></div>
              <div>
                <div className="coord-kpi-val">{pendingBatches.length}</div>
                <div className="coord-kpi-lbl">Batches Awaiting Review</div>
              </div>
            </div>

            <div className="coord-kpi-card">
              <div className="coord-kpi-icon emerald"><Users size={20} /></div>
              <div>
                <div className="coord-kpi-val">{allPendingMarks.length}</div>
                <div className="coord-kpi-lbl">Candidates in Queue</div>
              </div>
            </div>

            <div className="coord-kpi-card">
              <div className="coord-kpi-icon sky"><ShieldCheck size={20} /></div>
              <div>
                <div className="coord-kpi-val">Multi-Stage</div>
                <div className="coord-kpi-lbl">Authoritative Review</div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="coord-filter-bar">
            <div className="coord-search-wrap">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search subject title or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="coord-filter-group">
              <select
                className="coord-filter-select"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>{b === "All" ? "All Departments" : `${b} Dept`}</option>
                ))}
              </select>

              <select
                className="coord-filter-select"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>{s === "All" ? "All Semesters" : s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Batches List Container */}
          {loadingPending ? (
            <div className="coord-loading-state">
              <Loader2 size={30} className="spin text-blue" />
              <p>Loading pending faculty marks submissions...</p>
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="coord-empty-state">
              <CheckCircle2 size={42} style={{ color: "#10b981", opacity: 0.8 }} />
              <h3>Verification Queue Clear</h3>
              <p>No examination marks batches currently pending coordinator review.</p>
            </div>
          ) : (
            <div className="coord-batches-list">
              {filteredBatches.map((batch) => {
                const submitterName = batch.submittedBy?.fullName || "Faculty Lecturer";

                return (
                  <div key={batch.batchKey} className="coord-batch-review-card">
                    <div className="coord-batch-info-col">
                      <div className="coord-batch-badges">
                        <span className="coord-pill blue">{batch.branch}</span>
                        <span className="coord-pill slate">{batch.semester}</span>
                        <span className="coord-pill amber">{batch.examType}</span>
                        <span className="coord-pill cyan">{batch.academicSession}</span>
                      </div>

                      <h3 className="coord-batch-subject">
                        {batch.subjectCode ? `${batch.subjectCode}: ` : ""}{batch.subject}
                      </h3>

                      <div className="coord-batch-submitter">
                        <User size={14} />
                        <span>Submitted by: <strong>{submitterName}</strong></span>
                        <span style={{ margin: "0 6px" }}>•</span>
                        <Clock size={14} />
                        <span>{new Date(batch.submittedAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="coord-batch-action-col">
                      <div className="coord-candidates-count">
                        <span className="coord-count-num">{batch.totalStudents}</span>
                        <span className="coord-count-lbl">Candidates</span>
                      </div>

                      <div className="coord-action-buttons">
                        <button
                          type="button"
                          className="coord-btn-inspect"
                          onClick={() => setInspectingBatch(batch)}
                        >
                          <Eye size={15} />
                          <span>Audit Scores</span>
                        </button>

                        <button
                          type="button"
                          className="coord-btn-verify"
                          disabled={actionInProgress}
                          onClick={() => handleVerifyBatch(batch)}
                        >
                          <CheckCircle2 size={15} />
                          <span>Verify Batch</span>
                        </button>

                        <button
                          type="button"
                          className="coord-btn-reject"
                          disabled={actionInProgress}
                          onClick={() => handleOpenReturnModal(batch)}
                        >
                          <XCircle size={15} />
                          <span>Return</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: EXAMINATION TIMETABLE & INVIGILATION (PRESERVED)
          ========================================================================= */}
      {activeTab === "schedule" && (
        <div className="coord-schedule-workspace">
          <div className="coord-exam-stats" style={{ marginBottom: 16 }}>
            <div className="coord-exam-stat-chip">
              <Award size={14} color="#0284C7" />
              <span>Total Scheduled: <strong>{examSchedules.length}</strong></span>
            </div>
            <div className="coord-exam-stat-chip success">
              <CheckCircle2 size={14} color="#166534" />
              <span>Invigilators Allocated: <strong>100%</strong></span>
            </div>
          </div>

          <div className="coord-exam-grid">
            {examSchedules.map((ex) => (
              <div key={ex.id} className="coord-exam-card">
                <div className="coord-exam-card-header">
                  <span className={`coord-exam-type-pill ${ex.type.toLowerCase().replace(/\s+/g, "-")}`}>
                    {ex.type}
                  </span>
                  <span className="coord-exam-code">{ex.code}</span>
                </div>

                <h3 className="coord-exam-title">{ex.title}</h3>

                <div className="coord-exam-branch-sem">
                  <span className="coord-pill blue">{ex.branch}</span>
                  <span className="coord-pill gray">{ex.sem}</span>
                </div>

                <div className="coord-exam-meta">
                  <div className="coord-meta-row">
                    <Calendar size={14} color="#64748B" />
                    <span>{ex.date}</span>
                  </div>
                  <div className="coord-meta-row">
                    <Clock size={14} color="#64748B" />
                    <span>{ex.time}</span>
                  </div>
                  <div className="coord-meta-row">
                    <MapPin size={14} color="#64748B" />
                    <span>{ex.hall}</span>
                  </div>
                  <div className="coord-meta-row">
                    <User size={14} color="#0284C7" />
                    <span>Invigilator: <strong>{ex.invigilator}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          DRAWER / MODAL: AUDIT BATCH STUDENT SCORES
          ========================================================================= */}
      {inspectingBatch && (
        <div className="coord-modal-overlay" onClick={() => setInspectingBatch(null)}>
          <div className="coord-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="coord-modal-header">
              <div>
                <h3>Audit Batch Marks: {inspectingBatch.subject}</h3>
                <p>
                  {inspectingBatch.branch} • {inspectingBatch.semester} • {inspectingBatch.examType} ({inspectingBatch.totalStudents} Candidates)
                </p>
              </div>

              <button
                type="button"
                className="coord-modal-close"
                onClick={() => setInspectingBatch(null)}
              >
                ✕
              </button>
            </div>

            <div className="coord-modal-table-wrap">
              <table className="coord-audit-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Candidate</th>
                    <th>Enrollment</th>
                    <th>External Score</th>
                    <th>Sessional Score</th>
                    <th>Practical Score</th>
                    <th>Total Obtained</th>
                    <th>Grade</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {inspectingBatch.marks.map((m, idx) => {
                    const pct = m.maxMarks > 0 ? Math.round((m.marksObtained / m.maxMarks) * 100) : 0;
                    return (
                      <tr key={m._id || idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{m.studentId?.fullName || "Candidate"}</strong>
                        </td>
                        <td>
                          <code>{m.studentId?.enrollmentNo || "N/A"}</code>
                        </td>
                        <td>
                          {m.externalObtained || 0} / {m.externalMax || 0}
                        </td>
                        <td>
                          {m.sessionalObtained || 0} / {m.sessionalMax || 0}
                        </td>
                        <td>
                          {m.practicalObtained || 0} / {m.practicalMax || 0}
                        </td>
                        <td>
                          <strong>{m.marksObtained} / {m.maxMarks}</strong> ({pct}%)
                        </td>
                        <td>
                          <span className={`coord-grade-pill ${pct >= 75 ? "green" : pct >= 50 ? "blue" : "amber"}`}>
                            {m.grade || "P"}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: "0.82rem", color: "#64748B" }}>
                            {m.remarks || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="coord-modal-footer">
              <button
                type="button"
                className="coord-btn-reject"
                onClick={() => handleOpenReturnModal(inspectingBatch)}
              >
                <XCircle size={15} />
                <span>Return with Revision Notes</span>
              </button>

              <button
                type="button"
                className="coord-btn-verify"
                disabled={actionInProgress}
                onClick={() => handleVerifyBatch(inspectingBatch)}
              >
                <CheckCircle2 size={15} />
                <span>Verify & Forward to HOD</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DIALOG: RETURN TO FACULTY WITH REASON
          ========================================================================= */}
      {showReturnModal && batchToReturn && (
        <div className="coord-modal-overlay" onClick={() => setShowReturnModal(false)}>
          <div className="coord-modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className="coord-modal-header">
              <div>
                <h3 style={{ color: "#dc2626" }}>Return Marks to Faculty for Revision</h3>
                <p>Provide specific guidance for {batchToReturn.subject} ({batchToReturn.branch})</p>
              </div>
              <button type="button" className="coord-modal-close" onClick={() => setShowReturnModal(false)}>✕</button>
            </div>

            <div style={{ padding: 20 }}>
              <label className="coord-field-label">Documented Return Reason (Mandatory)</label>
              <textarea
                className="coord-textarea"
                rows={4}
                placeholder="e.g. Sessional practical marks for 3 candidates exceed the component ceiling. Please verify with lab register and resubmit."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                required
              />
            </div>

            <div className="coord-modal-footer">
              <button
                type="button"
                className="coord-btn-secondary"
                onClick={() => setShowReturnModal(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="coord-btn-reject"
                disabled={actionInProgress || !returnReason.trim()}
                onClick={handleConfirmReturn}
              >
                {actionInProgress ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
                <span>Confirm & Return to Faculty</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
