import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  CheckCircle2,
  Send,
  User,
  Clock,
  Award,
  AlertCircle,
  X,
  FileCheck,
  Loader2
} from "lucide-react";
import StatusBadge from "../../components/dashboard/StatusBadge";
import { authApi } from "../../services/authApi";
import "./TeacherTheme.css";
import "./TeacherSubmissions.css";

export default function TeacherSubmissions({ initialAssignment, showToast }) {
  const [assignments, setAssignments] = useState([]);
  const [selectedAsgnId, setSelectedAsgnId] = useState(
    initialAssignment?.id || initialAssignment?._id || ""
  );
  const [loading, setLoading] = useState(true);

  // Grading states
  const [gradingStudentId, setGradingStudentId] = useState(null);
  const [gradingCandidateName, setGradingCandidateName] = useState("");
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submittingGrade, setSubmittingGrade] = useState(false);

  const fetchAssignments = () => {
    authApi
      .getAssignments()
      .then((res) => {
        const list = res?.assignments || [];
        setAssignments(list);
        if (!selectedAsgnId && list.length > 0) {
          setSelectedAsgnId(list[0].id || list[0]._id);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const currentAssignment = assignments.find(
    (a) => (a.id || a._id) === selectedAsgnId
  );

  const submissions = currentAssignment?.submissions || [];

  const handleOpenGrade = (sub) => {
    const sUser = sub.studentId || {};
    setGradingStudentId(sUser._id || sUser.id || sub.studentId);
    setGradingCandidateName(sUser.fullName || "Candidate Scholar");
    setScore(sub.grade ?? sub.score ?? "");
    setFeedback(sub.feedback || "");
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    if (score === "") {
      showToast?.("Please input evaluation score.", true);
      return;
    }

    const numScore = Number(score);
    const maxPoints = currentAssignment?.totalPoints || 100;
    if (numScore < 0 || numScore > maxPoints) {
      showToast?.(`Score must be between 0 and ${maxPoints}.`, true);
      return;
    }

    setSubmittingGrade(true);
    try {
      await authApi.gradeAssignment(selectedAsgnId, {
        studentId: gradingStudentId,
        grade: numScore,
        feedback: feedback.trim()
      });
      showToast?.("Student submission evaluated and grade recorded!");
      setGradingStudentId(null);
      fetchAssignments();
    } catch (err) {
      showToast?.(err.message || "Failed to submit evaluation grade.", true);
    } finally {
      setSubmittingGrade(false);
    }
  };

  return (
    <div className="teacher-role-view teacher-sub-container">
      {/* Header */}
      <div className="tch-pane-header">
        <div>
          <h2>
            <ClipboardList size={24} color="var(--tch-primary)" />
            Submissions Review & Grading
          </h2>
          <p>Inspect student problem solutions, assess code quality, and provision feedback scores.</p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select
            className="tch-select"
            value={selectedAsgnId}
            onChange={(e) => {
              setSelectedAsgnId(e.target.value);
              setGradingStudentId(null);
            }}
            style={{ minWidth: 260 }}
          >
            {assignments.map((a) => (
              <option key={a.id || a._id} value={a.id || a._id}>
                {a.title} ({a.subject})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Assignment Context Header */}
      {currentAssignment && (
        <div className="tch-card teacher-sub-context-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span className="tch-pill blue">{currentAssignment.subject}</span>
                <span className="tch-pill cyan">{currentAssignment.branch} • {currentAssignment.semester}</span>
              </div>
              <h3 style={{ margin: "4px 0", fontSize: "1.2rem", color: "var(--tch-text-primary)" }}>
                {currentAssignment.title}
              </h3>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--tch-text-secondary)" }}>
                Max Points: <strong>{currentAssignment.totalPoints || 100}</strong> • Submissions Received: <strong>{submissions.length}</strong>
              </p>
            </div>

            <div className="tch-pill emerald" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
              <FileCheck size={16} />
              <span>{submissions.length} Solutions Submitted</span>
            </div>
          </div>
        </div>
      )}

      {/* Grading Evaluation Drawer/Card */}
      {gradingStudentId && (
        <div className="tch-card teacher-grade-eval-card">
          <div className="tch-pane-header" style={{ marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.12rem", display: "flex", alignItems: "center", gap: 8, color: "var(--tch-text-primary)" }}>
                <Award size={18} color="var(--tch-primary)" />
                Evaluate Candidate: {gradingCandidateName}
              </h3>
            </div>
            <button
              type="button"
              className="tch-btn-secondary"
              onClick={() => setGradingStudentId(null)}
              style={{ padding: "6px 12px", fontSize: "0.82rem" }}
            >
              <X size={13} /> Cancel
            </button>
          </div>

          <form onSubmit={handleSubmitGrade}>
            <div className="teacher-grade-form-grid">
              <div>
                <label className="tch-label">Score (Max {currentAssignment?.totalPoints || 100})</label>
                <input
                  type="number"
                  className="tch-input"
                  min={0}
                  max={currentAssignment?.totalPoints || 100}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder={`0 - ${currentAssignment?.totalPoints || 100}`}
                  required
                />
              </div>

              <div>
                <label className="tch-label">Evaluation Feedback & Constructive Remarks</label>
                <input
                  type="text"
                  className="tch-input"
                  placeholder="e.g. Excellent semaphore synchronization. Clean memory deallocation."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <button
                type="submit"
                className="tch-btn-primary"
                disabled={submittingGrade}
              >
                {submittingGrade ? <Loader2 size={15} className="spin" /> : <Award size={15} />}
                <span>{submittingGrade ? "Saving Grade..." : "Record Evaluation Score"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Submissions Table */}
      <div className="tch-card">
        <div className="tch-pane-header" style={{ marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.15rem", color: "var(--tch-text-primary)" }}>
              Candidate Submissions Ledger
            </h3>
            <p>Review solution texts, repository links, and faculty marks</p>
          </div>
          <span className="tch-pill blue">
            {submissions.length} Total Submissions
          </span>
        </div>

        <div className="tch-table-wrap">
          <table className="tch-table">
            <thead>
              <tr>
                <th>Student Candidate</th>
                <th>Submission Date</th>
                <th>Solution Text / Deliverable</th>
                <th>Assessed Score</th>
                <th>Instructor Feedback</th>
                <th>Evaluation Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "36px 16px", color: "var(--tch-text-secondary)" }}>
                    Loading submissions...
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "48px 16px" }}>
                    <div className="tch-empty-box" style={{ border: "none", padding: 0 }}>
                      <ClipboardList size={36} style={{ opacity: 0.6 }} />
                      <h3>No Submissions Logged Yet</h3>
                      <p>Enrolled candidates will appear here as they submit their assignment solutions.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                submissions.map((sub, i) => {
                  const sUser = sub.studentId || {};
                  const isGraded = (sub.grade !== undefined && sub.grade !== null) || (sub.score !== undefined && sub.score !== null);
                  const displayScore = sub.grade ?? sub.score;

                  return (
                    <tr key={i}>
                      <td>
                        <strong style={{ color: "var(--tch-text-primary)" }}>{sUser.fullName || "Candidate"}</strong>
                        <div style={{ fontSize: "0.78rem", color: "var(--tch-text-muted)" }}>
                          {sUser.enrollmentNo || sUser.rollNo || "Enrolled Scholar"}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--tch-text-secondary)" }}>
                          <Clock size={12} />
                          <span>
                            {sub.submittedAt
                              ? new Date(sub.submittedAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short"
                                })
                              : "Submitted"}
                          </span>
                        </div>
                      </td>
                      <td style={{ maxWidth: 300 }}>
                        <div style={{ fontSize: "0.85rem", color: "var(--tch-text-secondary)", whiteSpace: "pre-wrap", maxHeight: 60, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {sub.submissionText}
                        </div>
                      </td>
                      <td>
                        {isGraded ? (
                          <span className="tch-pill emerald">
                            {displayScore} / {currentAssignment?.totalPoints || 100} pts
                          </span>
                        ) : (
                          <span className="tch-pill amber">
                            Pending Evaluation
                          </span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: "0.84rem", color: "var(--tch-text-secondary)" }}>
                          {sub.feedback || "—"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="tch-btn-secondary"
                          style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                          onClick={() => handleOpenGrade(sub)}
                        >
                          <Award size={13} color="var(--tch-primary)" />
                          <span>{isGraded ? "Re-grade" : "Grade"}</span>
                        </button>
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
  );
}
