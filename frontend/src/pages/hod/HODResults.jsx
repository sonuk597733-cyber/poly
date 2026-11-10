import React, { useState, useEffect, useMemo } from "react";
import {
  Award, TrendingUp, Download, BarChart2, Loader2, Search,
  Filter, Printer, BookOpen, ShieldCheck, CheckCircle2, XCircle,
  Clock, Users, User, ArrowRight, Eye, AlertTriangle, Send,
  RotateCcw, CheckCheck, FileText, Check
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./HODTheme.css";
import "./HODResults.css";

const SEMESTERS = ["All", "Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6"];

export default function HODResults({ currentUser }) {
  const [activeTab, setActiveTab] = useState("approvals"); // "approvals" | "ledger"
  const deptBranch = currentUser?.department || currentUser?.branch || "CSE";

  // Approval Queue States
  const [pendingHODBatches, setPendingHODBatches] = useState([]);
  const [allPendingHODMarks, setAllPendingHODMarks] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState("All");
  const [searchPending, setSearchPending] = useState("");
  const [inspectingBatch, setInspectingBatch] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Return to Faculty modal
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [batchToReturn, setBatchToReturn] = useState(null);
  const [returnReason, setReturnReason] = useState("");

  // Historical Ledger States
  const [examRecords, setExamRecords] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [searchLedger, setSearchLedger] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Load Pending HOD marks batches from backend
  const loadPendingHODQueue = async () => {
    setLoadingPending(true);
    try {
      const res = await authApi.getPendingHODMarks({ branch: deptBranch });
      setPendingHODBatches(res?.batches || []);
      setAllPendingHODMarks(res?.marks || []);
    } catch (err) {
      console.warn("Failed to load HOD approval queue:", err);
      setPendingHODBatches([]);
      setAllPendingHODMarks([]);
    } finally {
      setLoadingPending(false);
    }
  };

  // Load overall department marks ledger
  const loadDepartmentLedger = async () => {
    setLoadingLedger(true);
    try {
      const res = await authApi.getExams({ branch: deptBranch });
      setExamRecords(res?.marks || []);
    } catch (err) {
      console.warn("Failed to load department ledger:", err);
      setExamRecords([]);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    loadPendingHODQueue();
    loadDepartmentLedger();
  }, [deptBranch]);

  // Filter pending batches
  const filteredPendingBatches = useMemo(() => {
    return pendingHODBatches.filter((b) => {
      if (selectedSemester !== "All" && b.semester !== selectedSemester) return false;
      if (searchPending.trim()) {
        const q = searchPending.toLowerCase();
        return (b.subject || "").toLowerCase().includes(q) || (b.subjectCode || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [pendingHODBatches, selectedSemester, searchPending]);

  // Approve a marks batch
  const handleApproveBatch = async (batch) => {
    if (!window.confirm(`Officially approve examination marks batch for ${batch.subject} (${batch.totalStudents} candidates)? This confirms the grades for semester compilation.`)) {
      return;
    }

    setActionInProgress(true);
    try {
      const res = await authApi.approveExamMarksHOD({
        branch: batch.branch,
        semester: batch.semester,
        subject: batch.subject,
        academicSession: batch.academicSession,
        examType: batch.examType
      });

      alert(res.message || `Successfully approved ${batch.subject} marks batch.`);
      setInspectingBatch(null);
      loadPendingHODQueue();
      loadDepartmentLedger();
    } catch (err) {
      alert(err.message || "Failed to approve marks batch.");
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

  // Return batch for revision
  const handleConfirmReturn = async () => {
    if (!returnReason.trim()) {
      alert("A specific revision reason is required.");
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

      alert(res.message || "Marks batch returned for revision.");
      setShowReturnModal(false);
      setBatchToReturn(null);
      setInspectingBatch(null);
      loadPendingHODQueue();
      loadDepartmentLedger();
    } catch (err) {
      alert(err.message || "Failed to return marks batch.");
    } finally {
      setActionInProgress(false);
    }
  };

  // Derived metrics
  const totalRecords = examRecords.length;
  const avgScore = totalRecords > 0
    ? Math.round(examRecords.reduce((acc, m) => acc + (m.maxMarks > 0 ? (m.marksObtained / m.maxMarks) * 100 : 0), 0) / totalRecords)
    : 0;

  const hodApprovedCount = examRecords.filter((m) => m.workflowStatus === "hod_approved" || m.workflowStatus === "principal_sanctioned" || m.workflowStatus === "published").length;

  return (
    <div className="hod-role-view hod-res-container">
      {/* Pane Header */}
      <div className="hod-pane-header">
        <div>
          <h2>
            <Award size={24} color="var(--hod-primary)" />
            HOD Examination Approval & Grade Certification Center
          </h2>
          <p>
            Audit coordinator-verified marks, grant departmental grade approvals, and certify examination readiness for {deptBranch} Engineering.
          </p>
        </div>

        <div className="hod-res-actions">
          <button
            type="button"
            className="hod-btn-secondary"
            onClick={() => { loadPendingHODQueue(); loadDepartmentLedger(); }}
          >
            <RotateCcw size={15} />
            <span>Sync Approval Ledger</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="hod-res-stats-grid">
        <div className="hod-card hod-res-kpi-card">
          <h4>Awaiting HOD Approval</h4>
          <div className="hod-res-kpi-val" style={{ color: "#d97706" }}>
            {pendingHODBatches.length}
          </div>
          <p>{allPendingHODMarks.length} Candidates verified by Coordinator</p>
        </div>

        <div className="hod-card hod-res-kpi-card">
          <h4>Approved for Tabulation</h4>
          <div className="hod-res-kpi-val" style={{ color: "#059669" }}>
            {hodApprovedCount}
          </div>
          <p>Grades locked & certified by HOD</p>
        </div>

        <div className="hod-card hod-res-kpi-card">
          <h4>Department Average</h4>
          <div className="hod-res-kpi-val" style={{ color: "#2563eb" }}>
            {avgScore > 0 ? `${avgScore}%` : "—"}
          </div>
          <p>Overall evaluation benchmark across all semesters</p>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="hod-workspace-tabs">
        <button
          type="button"
          className={`hod-workspace-tab ${activeTab === "approvals" ? "active" : ""}`}
          onClick={() => setActiveTab("approvals")}
        >
          <ShieldCheck size={16} />
          <span>Department Approval Queue ({pendingHODBatches.length})</span>
        </button>

        <button
          type="button"
          className={`hod-workspace-tab ${activeTab === "ledger" ? "active" : ""}`}
          onClick={() => setActiveTab("ledger")}
        >
          <BarChart2 size={16} />
          <span>Department Score Ledger & Grade Distribution ({examRecords.length})</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: DEPARTMENT APPROVAL QUEUE
          ========================================================================= */}
      {activeTab === "approvals" && (
        <div className="hod-approvals-workspace">
          {/* Filter Bar */}
          <div className="hod-filter-bar">
            <div className="hod-search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search subject or course code..."
                value={searchPending}
                onChange={(e) => setSearchPending(e.target.value)}
              />
            </div>

            <select
              className="hod-select"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
            >
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>{s === "All" ? "All Semesters" : s}</option>
              ))}
            </select>
          </div>

          {/* Batches List */}
          {loadingPending ? (
            <div className="hod-loading-state">
              <Loader2 size={30} className="spin text-blue" />
              <p>Loading coordinator-verified batches...</p>
            </div>
          ) : filteredPendingBatches.length === 0 ? (
            <div className="hod-empty-state">
              <CheckCircle2 size={42} style={{ color: "#10b981", opacity: 0.8 }} />
              <h3>All Batches Approved</h3>
              <p>No marks batches currently awaiting HOD approval for {deptBranch} Engineering.</p>
            </div>
          ) : (
            <div className="hod-batches-list">
              {filteredPendingBatches.map((batch) => {
                const submitterName = batch.submittedBy?.fullName || "Faculty Lecturer";
                const verifierName = batch.verifiedBy?.fullName || "Academic Coordinator";

                return (
                  <div key={batch.batchKey} className="hod-batch-card">
                    <div className="hod-batch-info">
                      <div className="hod-batch-badges">
                        <span className="hod-pill blue">{batch.branch}</span>
                        <span className="hod-pill indigo">{batch.semester}</span>
                        <span className="hod-pill amber">{batch.examType}</span>
                        <span className="hod-pill emerald">Coordinator Verified</span>
                      </div>

                      <h3 className="hod-batch-title">
                        {batch.subjectCode ? `${batch.subjectCode}: ` : ""}{batch.subject}
                      </h3>

                      <div className="hod-batch-meta">
                        <div>
                          <User size={14} />
                          <span>Submitted: <strong>{submitterName}</strong></span>
                        </div>
                        <div>
                          <ShieldCheck size={14} color="#059669" />
                          <span>Verified by: <strong>{verifierName}</strong></span>
                        </div>
                        <div>
                          <Clock size={14} />
                          <span>{new Date(batch.verifiedAt || batch.submittedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="hod-batch-actions-col">
                      <div className="hod-candidates-stat">
                        <span className="hod-count-big">{batch.totalStudents}</span>
                        <span className="hod-count-sub">Candidates</span>
                      </div>

                      <div className="hod-btn-group">
                        <button
                          type="button"
                          className="hod-btn-secondary"
                          onClick={() => setInspectingBatch(batch)}
                        >
                          <Eye size={15} />
                          <span>Audit Scores</span>
                        </button>

                        <button
                          type="button"
                          className="hod-btn-primary"
                          disabled={actionInProgress}
                          onClick={() => handleApproveBatch(batch)}
                        >
                          <CheckCircle2 size={15} />
                          <span>Approve Batch</span>
                        </button>

                        <button
                          type="button"
                          className="hod-btn-danger"
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
          TAB 2: DEPARTMENT SCORE LEDGER (PRESERVED)
          ========================================================================= */}
      {activeTab === "ledger" && (
        <div className="hod-ledger-workspace">
          <div className="hod-card">
            <div className="hod-pane-header" style={{ marginBottom: 16 }}>
              <div>
                <h3>Official Department Examination Marks Ledger</h3>
                <p>Complete historical evaluation record stored in MongoDB institutional database</p>
              </div>

              <button type="button" className="hod-btn-secondary" onClick={() => window.print()}>
                <Printer size={15} />
                <span>Export Ledger</span>
              </button>
            </div>

            <div className="hod-table-wrap">
              <table className="hod-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Subject</th>
                    <th>Assessment</th>
                    <th>Components (Ext / Sess / Prac)</th>
                    <th>Total Score</th>
                    <th>Grade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingLedger ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "36px 16px" }}>
                        Loading examination marks...
                      </td>
                    </tr>
                  ) : examRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "48px 16px" }}>
                        No examination scores found in database.
                      </td>
                    </tr>
                  ) : (
                    examRecords.map((m) => {
                      const pct = m.maxMarks > 0 ? Math.round((m.marksObtained / m.maxMarks) * 100) : 0;
                      return (
                        <tr key={m._id || m.id}>
                          <td>
                            <strong>{m.studentId?.fullName || "Candidate"}</strong>
                            <div style={{ fontSize: "0.78rem", color: "var(--hod-text-muted)" }}>
                              {m.studentId?.enrollmentNo || "N/A"}
                            </div>
                          </td>
                          <td>
                            <strong>{m.subject}</strong>
                            <div style={{ fontSize: "0.76rem", color: "var(--hod-text-muted)" }}>
                              {m.subjectCode || "N/A"}
                            </div>
                          </td>
                          <td>
                            <span className="hod-pill blue">{m.examType}</span>
                          </td>
                          <td>
                            <span style={{ fontSize: "0.85rem" }}>
                              {m.externalObtained || 0}/{m.externalMax || 0} • {m.sessionalObtained || 0}/{m.sessionalMax || 0} • {m.practicalObtained || 0}/{m.practicalMax || 0}
                            </span>
                          </td>
                          <td>
                            <strong>{m.marksObtained} / {m.maxMarks}</strong>
                            <span style={{ fontSize: "0.76rem", color: "var(--hod-text-muted)", marginLeft: 6 }}>
                              ({pct}%)
                            </span>
                          </td>
                          <td>
                            <span className={`hod-pill ${pct >= 75 ? "emerald" : pct >= 50 ? "indigo" : "amber"}`}>
                              {m.grade || "P"}
                            </span>
                          </td>
                          <td>
                            <span className={`hod-pill ${m.workflowStatus === "hod_approved" ? "emerald" : m.workflowStatus === "published" ? "indigo" : "slate"}`}>
                              {m.workflowStatus || "published"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DRAWER / MODAL: AUDIT BATCH STUDENT SCORES
          ========================================================================= */}
      {inspectingBatch && (
        <div className="hod-modal-overlay" onClick={() => setInspectingBatch(null)}>
          <div className="hod-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="hod-modal-header">
              <div>
                <h3>HOD Marks Audit: {inspectingBatch.subject}</h3>
                <p>
                  {inspectingBatch.branch} • {inspectingBatch.semester} • {inspectingBatch.examType} ({inspectingBatch.totalStudents} Candidates)
                </p>
              </div>

              <button
                type="button"
                className="hod-modal-close"
                onClick={() => setInspectingBatch(null)}
              >
                ✕
              </button>
            </div>

            <div className="hod-modal-body">
              <table className="hod-audit-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Candidate Scholar</th>
                    <th>Enrollment No</th>
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
                          <span className={`hod-pill ${pct >= 75 ? "emerald" : pct >= 50 ? "indigo" : "amber"}`}>
                            {m.grade || "P"}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: "0.82rem", color: "var(--hod-text-muted)" }}>
                            {m.remarks || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="hod-modal-footer">
              <button
                type="button"
                className="hod-btn-danger"
                onClick={() => handleOpenReturnModal(inspectingBatch)}
              >
                <XCircle size={15} />
                <span>Return with Revision Notes</span>
              </button>

              <button
                type="button"
                className="hod-btn-primary"
                disabled={actionInProgress}
                onClick={() => handleApproveBatch(inspectingBatch)}
              >
                <CheckCircle2 size={15} />
                <span>Approve & Certify Marks Batch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DIALOG: RETURN WITH MANDATORY REVISION REASON
          ========================================================================= */}
      {showReturnModal && batchToReturn && (
        <div className="hod-modal-overlay" onClick={() => setShowReturnModal(false)}>
          <div className="hod-modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className="hod-modal-header">
              <div>
                <h3 style={{ color: "#dc2626" }}>Return Marks Batch for Revision</h3>
                <p>Provide specific guidance for {batchToReturn.subject} ({batchToReturn.branch})</p>
              </div>
              <button type="button" className="hod-modal-close" onClick={() => setShowReturnModal(false)}>✕</button>
            </div>

            <div style={{ padding: 20 }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: 6 }}>
                HOD Revision Instructions (Mandatory)
              </label>
              <textarea
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--hod-card-border, #e2e8f0)",
                  fontSize: "0.86rem",
                  fontFamily: "inherit",
                  resize: "vertical"
                }}
                rows={4}
                placeholder="e.g. Please re-check external component marks for DIE-501 against written answer booklets."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                required
              />
            </div>

            <div className="hod-modal-footer">
              <button
                type="button"
                className="hod-btn-secondary"
                onClick={() => setShowReturnModal(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="hod-btn-danger"
                disabled={actionInProgress || !returnReason.trim()}
                onClick={handleConfirmReturn}
              >
                {actionInProgress ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
                <span>Confirm & Return Batch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
