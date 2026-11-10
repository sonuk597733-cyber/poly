import React, { useState, useEffect, useMemo } from "react";
import {
  Award, ShieldCheck, CheckCircle2, XCircle, Clock, Users,
  Building2, RotateCcw, Loader2, Eye, Send, AlertTriangle,
  FileCheck2, ChevronDown, CheckCheck, BarChart2
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./PrincipalExams.css";

const DEPARTMENTS = ["All", "CSE", "Mechanical", "Electrical", "Civil", "ECE"];

export default function PrincipalExams({ currentUser, showToast }) {
  const [hodApprovedBatches, setHodApprovedBatches] = useState([]);
  const [allMarks, setAllMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState("All");
  const [inspectingBatch, setInspectingBatch] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Return to HOD dialog
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [batchToReturn, setBatchToReturn] = useState(null);
  const [returnReason, setReturnReason] = useState("");

  const loadInstitutionalQueue = async () => {
    setLoading(true);
    try {
      // Query all marks in the institution that are hod_approved, verified, or sanctioned
      const res = await authApi.getExams({
        workflowStatus: "hod_approved"
      });

      const marks = res?.marks || [];
      setAllMarks(marks);

      // Group by batch
      const batchesMap = {};
      marks.forEach((m) => {
        const key = `${m.branch}__${m.semester}__${m.subject}__${m.academicSession || "2024-2025"}`;
        if (!batchesMap[key]) {
          batchesMap[key] = {
            batchKey: key,
            branch: m.branch,
            semester: m.semester,
            subject: m.subject,
            subjectCode: m.subjectCode || "N/A",
            academicSession: m.academicSession || "2024-2025",
            examType: m.examType || "Semester Final",
            workflowStatus: m.workflowStatus,
            submittedBy: m.submittedBy,
            verifiedBy: m.verifiedBy,
            approvedBy: m.approvedBy,
            totalStudents: 0,
            marks: []
          };
        }
        batchesMap[key].totalStudents += 1;
        batchesMap[key].marks.push(m);
      });

      setHodApprovedBatches(Object.values(batchesMap));
    } catch (err) {
      console.warn("Failed to load institutional sanction queue:", err);
      setHodApprovedBatches([]);
      setAllMarks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstitutionalQueue();
  }, []);

  const filteredBatches = useMemo(() => {
    return hodApprovedBatches.filter((b) => {
      if (selectedDept !== "All" && b.branch !== selectedDept) return false;
      return true;
    });
  }, [hodApprovedBatches, selectedDept]);

  // Sanction a batch
  const handleSanctionBatch = async (batch) => {
    if (!window.confirm(`Formally sanction examination results for ${batch.subject} (${batch.branch} ${batch.semester})? This authorizes final university result tabulation.`)) {
      return;
    }

    setActionInProgress(true);
    try {
      const res = await authApi.sanctionExamMarksPrincipal({
        branch: batch.branch,
        semester: batch.semester,
        academicSession: batch.academicSession
      });

      showToast?.(res.message || `Institutional sanction granted for ${batch.subject}.`);
      setInspectingBatch(null);
      loadInstitutionalQueue();
    } catch (err) {
      showToast?.(err.message || "Failed to grant institutional sanction.", true);
    } finally {
      setActionInProgress(false);
    }
  };

  // Open return modal
  const handleOpenReturnModal = (batch) => {
    setBatchToReturn(batch);
    setReturnReason("");
    setShowReturnModal(true);
  };

  // Return batch with reason
  const handleConfirmReturn = async () => {
    if (!returnReason.trim()) {
      showToast?.("A documented reason is mandatory.", true);
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

      showToast?.(res.message || "Batch returned for departmental revision.");
      setShowReturnModal(false);
      setBatchToReturn(null);
      setInspectingBatch(null);
      loadInstitutionalQueue();
    } catch (err) {
      showToast?.(err.message || "Failed to return batch.", true);
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="principal-exams-container">
      {/* Pane Header */}
      <div className="prn-pane-header">
        <div>
          <h2>
            <Award size={24} color="#7c3aed" />
            Executive Institutional Examination Sanction Center
          </h2>
          <p>
            Principal executive oversight for department examination progress, HOD-certified grade approval verification, and institutional sanctions.
          </p>
        </div>

        <button
          type="button"
          className="prn-btn-secondary"
          onClick={loadInstitutionalQueue}
        >
          <RotateCcw size={15} />
          <span>Sync Executive Ledger</span>
        </button>
      </div>

      {/* KPI Overview */}
      <div className="prn-kpi-grid">
        <div className="prn-kpi-card">
          <div className="prn-kpi-icon purple"><Building2 size={20} /></div>
          <div>
            <div className="prn-kpi-val">{hodApprovedBatches.length}</div>
            <div className="prn-kpi-lbl">Batches Awaiting Executive Sanction</div>
          </div>
        </div>

        <div className="prn-kpi-card">
          <div className="prn-kpi-icon emerald"><Users size={20} /></div>
          <div>
            <div className="prn-kpi-val">{allMarks.length}</div>
            <div className="prn-kpi-lbl">HOD-Certified Candidate Marks</div>
          </div>
        </div>

        <div className="prn-kpi-card">
          <div className="prn-kpi-icon blue"><ShieldCheck size={20} /></div>
          <div>
            <div className="prn-kpi-val">100%</div>
            <div className="prn-kpi-lbl">Verification Compliance</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="prn-filter-toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>
            Filter by Academic Division:
          </label>
          <select
            className="prn-select"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d === "All" ? "All Institutional Departments" : `${d} Engineering`}</option>
            ))}
          </select>
        </div>

        <span className="prn-pill purple">{filteredBatches.length} Batches Ready</span>
      </div>

      {/* Queue List */}
      {loading ? (
        <div className="prn-loading-state">
          <Loader2 size={30} className="spin text-purple" />
          <p>Compiling institutional examination approval status...</p>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="prn-empty-state">
          <CheckCircle2 size={42} style={{ color: "#10b981", opacity: 0.8 }} />
          <h3>All Academic Batches Sanctioned</h3>
          <p>No departmental examination submissions currently pending executive sanction.</p>
        </div>
      ) : (
        <div className="prn-batches-list">
          {filteredBatches.map((batch) => (
            <div key={batch.batchKey} className="prn-batch-card">
              <div className="prn-batch-info">
                <div className="prn-batch-badges">
                  <span className="prn-pill blue">{batch.branch}</span>
                  <span className="prn-pill purple">{batch.semester}</span>
                  <span className="prn-pill amber">{batch.examType}</span>
                  <span className="prn-pill emerald">HOD Certified</span>
                </div>

                <h3 className="prn-batch-title">{batch.subjectCode}: {batch.subject}</h3>

                <div className="prn-batch-meta">
                  <span>HOD Certified: <strong>{batch.approvedBy?.fullName || "Head of Department"}</strong></span>
                  <span>•</span>
                  <span>Coordinator Verified: <strong>{batch.verifiedBy?.fullName || "Coordinator"}</strong></span>
                  <span>•</span>
                  <span>Session: <strong>{batch.academicSession}</strong></span>
                </div>
              </div>

              <div className="prn-batch-actions-col">
                <div className="prn-candidates-stat">
                  <span className="prn-count-big">{batch.totalStudents}</span>
                  <span className="prn-count-sub">Candidates</span>
                </div>

                <div className="prn-btn-group">
                  <button
                    type="button"
                    className="prn-btn-secondary"
                    onClick={() => setInspectingBatch(batch)}
                  >
                    <Eye size={15} />
                    <span>Audit Breakdown</span>
                  </button>

                  <button
                    type="button"
                    className="prn-btn-primary"
                    disabled={actionInProgress}
                    onClick={() => handleSanctionBatch(batch)}
                  >
                    <CheckCircle2 size={15} />
                    <span>Sanction Batch</span>
                  </button>

                  <button
                    type="button"
                    className="prn-btn-danger"
                    disabled={actionInProgress}
                    onClick={() => handleOpenReturnModal(batch)}
                  >
                    <XCircle size={15} />
                    <span>Return</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Modal */}
      {inspectingBatch && (
        <div className="prn-modal-overlay" onClick={() => setInspectingBatch(null)}>
          <div className="prn-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="prn-modal-header">
              <div>
                <h3>Executive Marks Audit: {inspectingBatch.subject}</h3>
                <p>{inspectingBatch.branch} • {inspectingBatch.semester} ({inspectingBatch.totalStudents} Candidates)</p>
              </div>
              <button type="button" className="prn-modal-close" onClick={() => setInspectingBatch(null)}>✕</button>
            </div>

            <div className="prn-modal-body">
              <table className="prn-audit-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Candidate</th>
                    <th>Enrollment</th>
                    <th>External Marks</th>
                    <th>Sessional Marks</th>
                    <th>Practical Marks</th>
                    <th>Total Score</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {inspectingBatch.marks.map((m, idx) => {
                    const pct = m.maxMarks > 0 ? Math.round((m.marksObtained / m.maxMarks) * 100) : 0;
                    return (
                      <tr key={m._id || idx}>
                        <td>{idx + 1}</td>
                        <td><strong>{m.studentId?.fullName || "Candidate"}</strong></td>
                        <td><code>{m.studentId?.enrollmentNo || "N/A"}</code></td>
                        <td>{m.externalObtained || 0} / {m.externalMax || 0}</td>
                        <td>{m.sessionalObtained || 0} / {m.sessionalMax || 0}</td>
                        <td>{m.practicalObtained || 0} / {m.practicalMax || 0}</td>
                        <td><strong>{m.marksObtained} / {m.maxMarks}</strong> ({pct}%)</td>
                        <td>
                          <span className={`prn-pill ${pct >= 75 ? "emerald" : pct >= 50 ? "blue" : "amber"}`}>
                            {m.grade || "P"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="prn-modal-footer">
              <button
                type="button"
                className="prn-btn-danger"
                onClick={() => handleOpenReturnModal(inspectingBatch)}
              >
                <XCircle size={15} />
                <span>Return to HOD</span>
              </button>

              <button
                type="button"
                className="prn-btn-primary"
                disabled={actionInProgress}
                onClick={() => handleSanctionBatch(inspectingBatch)}
              >
                <CheckCircle2 size={15} />
                <span>Grant Executive Sanction</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Dialog */}
      {showReturnModal && batchToReturn && (
        <div className="prn-modal-overlay" onClick={() => setShowReturnModal(false)}>
          <div className="prn-modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className="prn-modal-header">
              <div>
                <h3 style={{ color: "#dc2626" }}>Return Submission to Department</h3>
                <p>Provide executive reason for {batchToReturn.subject} ({batchToReturn.branch})</p>
              </div>
              <button type="button" className="prn-modal-close" onClick={() => setShowReturnModal(false)}>✕</button>
            </div>

            <div style={{ padding: 20 }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: 6 }}>
                Executive Revision Directive (Mandatory)
              </label>
              <textarea
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: "0.86rem",
                  fontFamily: "inherit",
                  resize: "vertical"
                }}
                rows={4}
                placeholder="State specific executive directives for departmental re-audit..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                required
              />
            </div>

            <div className="prn-modal-footer">
              <button type="button" className="prn-btn-secondary" onClick={() => setShowReturnModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="prn-btn-danger"
                disabled={actionInProgress || !returnReason.trim()}
                onClick={handleConfirmReturn}
              >
                {actionInProgress ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
                <span>Confirm Return Directive</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
