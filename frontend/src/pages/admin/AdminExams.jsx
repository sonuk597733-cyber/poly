import React, { useState, useEffect, useMemo } from "react";
import {
  Award, ShieldCheck, CheckCircle2, XCircle, AlertTriangle,
  Play, Lock, FileText, Printer, Download, RotateCcw,
  Search, Sliders, ChevronDown, Check, Loader2, Sparkles,
  BookOpen, Users, TrendingUp, Layers, HelpCircle, Edit3
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./AdminExams.css";

const SESSIONS = ["2024-2025", "2023-2024", "2025-2026"];
const BRANCHES = ["CSE", "Mechanical", "Electrical", "Civil", "ECE"];
const SEMESTERS = [
  "Semester 1", "Semester 2", "Semester 3",
  "Semester 4", "Semester 5", "Semester 6"
];

export default function AdminExams({ currentUser, showToast }) {
  const [activeTab, setActiveTab] = useState("processing"); // processing, gazette, rules, corrections

  // Scope selectors
  const [session, setSession] = useState("2024-2025");
  const [branch, setBranch] = useState("CSE");
  const [semester, setSemester] = useState("Semester 1");

  // Tab 1: Processing & Publication State
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [readinessData, setReadinessData] = useState(null);
  const [processingLoading, setProcessingLoading] = useState(false);
  const [processResult, setProcessResult] = useState(null);
  const [publishingLoading, setPublishingLoading] = useState(false);

  // Tab 2: Gazette State
  const [gazetteLoading, setGazetteLoading] = useState(false);
  const [gazetteData, setGazetteData] = useState(null);
  const [gazetteSearch, setGazetteSearch] = useState("");
  const [gazetteStatusFilter, setGazetteStatusFilter] = useState("ALL");

  // Tab 3: Ordinance Rules State
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [rulesConfig, setRulesConfig] = useState(null);

  // Tab 4: Post-Publication Corrections State
  const [correctionStudentId, setCorrectionStudentId] = useState("");
  const [correctionSubject, setCorrectionSubject] = useState("");
  const [correctionExtObt, setCorrectionExtObt] = useState("");
  const [correctionSessObt, setCorrectionSessObt] = useState("");
  const [correctionPracObt, setCorrectionPracObt] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionLoading, setCorrectionLoading] = useState(false);

  // ----------------------------------------------------------------
  // 1. READINESS AUDIT
  // ----------------------------------------------------------------
  const checkReadiness = async () => {
    setReadinessLoading(true);
    setProcessResult(null);
    try {
      const res = await authApi.getExams({
        branch,
        semester,
        academicSession: session
      });
      const marks = res?.marks || [];
      const stats = {
        totalMarks: marks.length,
        draft: marks.filter((m) => m.workflowStatus === "draft").length,
        submitted: marks.filter((m) => m.workflowStatus === "submitted").length,
        verified: marks.filter((m) => m.workflowStatus === "verified").length,
        hod_approved: marks.filter((m) => m.workflowStatus === "hod_approved").length,
        sanctioned: marks.filter((m) => m.workflowStatus === "sanctioned").length,
        published: marks.filter((m) => m.workflowStatus === "published" || m.workflowStatus === "locked").length,
        uniqueStudents: new Set(marks.map((m) => m.studentId?._id || m.studentId)).size,
        uniqueSubjects: new Set(marks.map((m) => m.subject)).size
      };
      setReadinessData(stats);
    } catch (err) {
      showToast?.(err.message || "Failed to inspect marks readiness.", true);
    } finally {
      setReadinessLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "processing") {
      checkReadiness();
    }
  }, [branch, semester, session, activeTab]);

  // ----------------------------------------------------------------
  // 2. PROCESS SEMESTER RESULTS
  // ----------------------------------------------------------------
  const handleProcessResults = async () => {
    if (!window.confirm(`Initiate authoritative examination result calculation for ${branch} ${semester} (${session})? This applies the SVSU grading ordinance, grace policy, and carry-over evaluation.`)) {
      return;
    }
    setProcessingLoading(true);
    try {
      const res = await authApi.processSemesterResults({
        branch,
        semester,
        academicSession: session
      });
      setProcessResult(res.summary);
      showToast?.(res.message || "Semester results processed successfully.");
      checkReadiness();
    } catch (err) {
      showToast?.(err.message || "Failed to compute semester results.", true);
    } finally {
      setProcessingLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // 3. PUBLISH & LOCK RESULTS
  // ----------------------------------------------------------------
  const handlePublishResults = async () => {
    if (!window.confirm(`WARNING: You are about to FORMALLY PUBLISH & LOCK examination results for ${branch} ${semester} (${session}).\n\nThis will declare results live for students and generate official Statement of Marks. Proceed?`)) {
      return;
    }
    setPublishingLoading(true);
    try {
      const res = await authApi.publishSemesterResults({
        branch,
        semester,
        academicSession: session
      });
      showToast?.(res.message || "Results published and locked successfully.");
      checkReadiness();
    } catch (err) {
      showToast?.(err.message || "Failed to publish examination results.", true);
    } finally {
      setPublishingLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // 4. LOAD UNIVERSITY GAZETTE
  // ----------------------------------------------------------------
  const loadGazette = async () => {
    setGazetteLoading(true);
    try {
      const res = await authApi.getExamGazette({
        branch,
        semester,
        academicSession: session
      });
      setGazetteData(res?.gazette || null);
    } catch (err) {
      showToast?.(err.message || "Failed to compile university gazette.", true);
      setGazetteData(null);
    } finally {
      setGazetteLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "gazette") {
      loadGazette();
    }
  }, [branch, semester, session, activeTab]);

  // ----------------------------------------------------------------
  // 5. LOAD & UPDATE ORDINANCE RULES
  // ----------------------------------------------------------------
  const loadRulesConfig = async () => {
    setRulesLoading(true);
    try {
      const res = await authApi.getExamRulesConfig();
      setRulesConfig(res?.rules || null);
    } catch (err) {
      showToast?.(err.message || "Failed to load examination ordinance rules.", true);
    } finally {
      setRulesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "rules") {
      loadRulesConfig();
    }
  }, [activeTab]);

  const handleSaveRules = async (e) => {
    e.preventDefault();
    if (!rulesConfig) return;
    setRulesSaving(true);
    try {
      const res = await authApi.updateExamRulesConfig(rulesConfig);
      setRulesConfig(res?.rules || rulesConfig);
      showToast?.(res.message || "Examination ordinance rules saved successfully.");
    } catch (err) {
      showToast?.(err.message || "Failed to save examination ordinance rules.", true);
    } finally {
      setRulesSaving(false);
    }
  };

  // ----------------------------------------------------------------
  // 6. POST-PUBLICATION MARK CORRECTION
  // ----------------------------------------------------------------
  const handleApplyCorrection = async (e) => {
    e.preventDefault();
    if (!correctionStudentId || !correctionSubject || !correctionReason.trim()) {
      showToast?.("Candidate ID, subject, and documented audit reason are mandatory.", true);
      return;
    }

    setCorrectionLoading(true);
    try {
      await authApi.submitExamMark({
        studentId: correctionStudentId.trim(),
        branch,
        semester,
        subject: correctionSubject.trim(),
        examType: "Semester Final",
        academicSession: session,
        externalObtained: Number(correctionExtObt) || 0,
        sessionalObtained: Number(correctionSessObt) || 0,
        practicalObtained: Number(correctionPracObt) || 0,
        remarks: `[Admin Correction]: ${correctionReason.trim()}`
      });

      // Recalculate semester result for student
      await authApi.processSemesterResults({
        branch,
        semester,
        academicSession: session
      });

      showToast?.("Score adjusted and semester result re-evaluated successfully.");
      setCorrectionExtObt("");
      setCorrectionSessObt("");
      setCorrectionPracObt("");
      setCorrectionReason("");
    } catch (err) {
      showToast?.(err.message || "Failed to process score correction.", true);
    } finally {
      setCorrectionLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // 7. EXPORT GAZETTE CSV
  // ----------------------------------------------------------------
  const handleExportCSV = () => {
    if (!gazetteData?.students?.length) {
      showToast?.("No gazette data available to export.", true);
      return;
    }
    const headers = [
      "S.No",
      "Enrollment No",
      "Student Name",
      "Father's Name",
      "Total Obtained",
      "Total Max",
      "SGPA",
      "CGPA",
      "Status",
      "Standing",
      "Grace Marks",
      "COPs"
    ];
    const rows = gazetteData.students.map((st, i) => [
      i + 1,
      st.enrollmentNo,
      `"${st.fullName}"`,
      `"${st.fatherName || ""}"`,
      st.totalObtained,
      st.totalMax,
      st.sgpa,
      st.cgpa || st.sgpa,
      st.resultStatus,
      `"${st.standing}"`,
      st.graceMarksAwarded || 0,
      `"${(st.carryOverPapers || []).join(", ")}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Gazette_${branch}_${semester}_${session}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Gazette Rows
  const filteredGazetteStudents = useMemo(() => {
    if (!gazetteData?.students) return [];
    return gazetteData.students.filter((s) => {
      if (gazetteStatusFilter !== "ALL" && s.resultStatus !== gazetteStatusFilter) return false;
      if (gazetteSearch) {
        const query = gazetteSearch.toLowerCase();
        const name = (s.fullName || "").toLowerCase();
        const enroll = (s.enrollmentNo || "").toLowerCase();
        if (!name.includes(query) && !enroll.includes(query)) return false;
      }
      return true;
    });
  }, [gazetteData, gazetteSearch, gazetteStatusFilter]);

  return (
    <div className="admin-exams-page">
      {/* Page Title & Navigation Bar */}
      <div className="adm-header-pane">
        <div className="adm-header-left">
          <div className="adm-header-badge">
            <Award size={18} color="#2563eb" />
            <span>Swami Vivekanand Subharti University • Examination Regulatory Board</span>
          </div>
          <h2>Autonomous Examination & Tabulation Command Center</h2>
          <p>
            Authoritative institutional engine for continuous assessment audits, Ordinance grading execution, result publication, and Gazette ledger compilation.
          </p>
        </div>

        {/* Global Scope Selectors */}
        <div className="adm-scope-selectors">
          <div className="adm-scope-item">
            <label>Academic Session</label>
            <select value={session} onChange={(e) => setSession(e.target.value)}>
              {SESSIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="adm-scope-item">
            <label>Branch / Department</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)}>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b} Engineering</option>
              ))}
            </select>
          </div>

          <div className="adm-scope-item">
            <label>Semester</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value)}>
              {SEMESTERS.map((sm) => (
                <option key={sm} value={sm}>{sm}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="adm-tab-nav">
        <button
          type="button"
          className={`adm-tab-btn ${activeTab === "processing" ? "active" : ""}`}
          onClick={() => setActiveTab("processing")}
        >
          <Play size={16} />
          <span>Tabulation & Publication</span>
        </button>

        <button
          type="button"
          className={`adm-tab-btn ${activeTab === "gazette" ? "active" : ""}`}
          onClick={() => setActiveTab("gazette")}
        >
          <FileText size={16} />
          <span>University Gazette Ledger</span>
        </button>

        <button
          type="button"
          className={`adm-tab-btn ${activeTab === "rules" ? "active" : ""}`}
          onClick={() => setActiveTab("rules")}
        >
          <BookOpen size={16} />
          <span>Examination Ordinance & Rules</span>
        </button>

        <button
          type="button"
          className={`adm-tab-btn ${activeTab === "corrections" ? "active" : ""}`}
          onClick={() => setActiveTab("corrections")}
        >
          <Edit3 size={16} />
          <span>Audited Result Corrections</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: TABULATION & PUBLICATION CONSOLE */}
      {/* ==================================================================== */}
      {activeTab === "processing" && (
        <div className="adm-tab-content">
          {/* Readiness Pipeline */}
          <div className="adm-card">
            <div className="adm-card-header">
              <div>
                <h3>1. Examination Workflow Readiness Audit</h3>
                <p>Audits marks pipeline status across faculty, coordinator, HOD, and principal stages.</p>
              </div>
              <button
                type="button"
                className="adm-btn-secondary"
                onClick={checkReadiness}
                disabled={readinessLoading}
              >
                <RotateCcw size={14} className={readinessLoading ? "spin" : ""} />
                <span>Re-Audit Pipeline</span>
              </button>
            </div>

            {readinessLoading ? (
              <div className="adm-loading-bar">
                <Loader2 size={24} className="spin text-blue" />
                <span>Querying marks lifecycle state for {branch} {semester}...</span>
              </div>
            ) : readinessData ? (
              <div className="adm-pipeline-grid">
                <div className="adm-pipe-stage">
                  <div className="adm-pipe-val">{readinessData.uniqueStudents}</div>
                  <div className="adm-pipe-lbl">Enrolled Candidates</div>
                </div>

                <div className="adm-pipe-stage">
                  <div className="adm-pipe-val text-amber">{readinessData.draft + readinessData.submitted}</div>
                  <div className="adm-pipe-lbl">Pending Faculty/Coord</div>
                </div>

                <div className="adm-pipe-stage">
                  <div className="adm-pipe-val text-blue">{readinessData.verified + readinessData.hod_approved}</div>
                  <div className="adm-pipe-lbl">HOD / Sanction Queue</div>
                </div>

                <div className="adm-pipe-stage">
                  <div className="adm-pipe-val text-purple">{readinessData.sanctioned}</div>
                  <div className="adm-pipe-lbl">Sanctioned & Ready</div>
                </div>

                <div className="adm-pipe-stage highlight">
                  <div className="adm-pipe-val text-emerald">{readinessData.published}</div>
                  <div className="adm-pipe-lbl">Declared Live / Locked</div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Action Execution Cards */}
          <div className="adm-actions-grid">
            {/* Step 1: Processing */}
            <div className="adm-action-card">
              <div className="adm-action-icon blue">
                <Sparkles size={26} />
              </div>
              <h3>Step 1: Compute & Tabulate Results</h3>
              <p>
                Authoritative evaluation of candidate semester results. Calculates SGPA, CGPA, checks 40% subject thresholds, awards up to 5 grace marks, and determines PCP or FAIL standings.
              </p>

              <button
                type="button"
                className="adm-btn-primary"
                onClick={handleProcessResults}
                disabled={processingLoading}
              >
                {processingLoading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Executing SVSU Ordinance Algorithm...</span>
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    <span>Process {branch} {semester} Results</span>
                  </>
                )}
              </button>
            </div>

            {/* Step 2: Publication */}
            <div className="adm-action-card">
              <div className="adm-action-icon emerald">
                <Lock size={26} />
              </div>
              <h3>Step 2: Declare Live & Formally Lock</h3>
              <p>
                Locks all candidate mark sheets, generates authenticated Statement of Marks certificates in student dashboards, and notifies candidates of result declaration.
              </p>

              <button
                type="button"
                className="adm-btn-emerald"
                onClick={handlePublishResults}
                disabled={publishingLoading}
              >
                {publishingLoading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Formally Locking Ledger...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Publish & Lock Official Results</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tabulation Summary Result */}
          {processResult && (
            <div className="adm-result-summary-card">
              <div className="adm-summary-header">
                <CheckCircle2 size={22} color="#10b981" />
                <h4>Computation Completed Successfully for {branch} {semester}</h4>
              </div>

              <div className="adm-summary-metrics">
                <div className="adm-sum-metric">
                  <span className="adm-sum-val">{processResult.totalStudents}</span>
                  <span className="adm-sum-lbl">Evaluated Candidates</span>
                </div>

                <div className="adm-sum-metric emerald">
                  <span className="adm-sum-val">{processResult.passedCount}</span>
                  <span className="adm-sum-lbl">Passed (Clear)</span>
                </div>

                <div className="adm-sum-metric amber">
                  <span className="adm-sum-val">{processResult.pcpCount}</span>
                  <span className="adm-sum-lbl">Promoted with Backlog (PCP)</span>
                </div>

                <div className="adm-sum-metric blue">
                  <span className="adm-sum-val">{processResult.pwgCount}</span>
                  <span className="adm-sum-lbl">Passed with Grace (PWG)</span>
                </div>

                <div className="adm-sum-metric rose">
                  <span className="adm-sum-val">{processResult.failCount}</span>
                  <span className="adm-sum-lbl">Failed (Year Back)</span>
                </div>

                <div className="adm-sum-metric purple">
                  <span className="adm-sum-val">{processResult.averageSGPA}</span>
                  <span className="adm-sum-lbl">Cohort Avg SGPA</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: UNIVERSITY GAZETTE LEDGER */}
      {/* ==================================================================== */}
      {activeTab === "gazette" && (
        <div className="adm-tab-content">
          {/* Gazette Toolbar */}
          <div className="adm-gazette-toolbar no-print">
            <div className="adm-search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search candidate name or enrollment number..."
                value={gazetteSearch}
                onChange={(e) => setGazetteSearch(e.target.value)}
              />
            </div>

            <div className="adm-filter-group">
              <label>Status Filter:</label>
              <select
                value={gazetteStatusFilter}
                onChange={(e) => setGazetteStatusFilter(e.target.value)}
              >
                <option value="ALL">All Candidates ({gazetteData?.students?.length || 0})</option>
                <option value="PASS">Passed Clear</option>
                <option value="PCP">PCP (Carry-Over)</option>
                <option value="PWG">PWG (With Grace)</option>
                <option value="FAIL">Failed</option>
              </select>
            </div>

            <div className="adm-gazette-actions">
              <button type="button" className="adm-btn-secondary" onClick={handleExportCSV}>
                <Download size={15} />
                <span>Export CSV</span>
              </button>

              <button type="button" className="adm-btn-primary" onClick={() => window.print()}>
                <Printer size={15} />
                <span>Print Official Gazette</span>
              </button>
            </div>
          </div>

          {/* Gazette Print Header (Visible in Print or Screen) */}
          <div className="adm-gazette-official-header">
            <div className="adm-gaz-univ">SWAMI VIVEKANAND SUBHARTI UNIVERSITY, MEERUT</div>
            <div className="adm-gaz-sub">Subharti Institute of Technology and Engineering (SITE) • Polytechnic Division</div>
            <div className="adm-gaz-title">TABULATED REGISTER OF EXAMINATION RESULTS (GAZETTE)</div>
            <div className="adm-gaz-meta">
              <span>Program: <strong>Diploma in Engineering ({branch})</strong></span>
              <span>Semester: <strong>{semester}</strong></span>
              <span>Academic Session: <strong>{session}</strong></span>
              <span>Examination Type: <strong>Regular / Annual Examination</strong></span>
            </div>
          </div>

          {gazetteLoading ? (
            <div className="adm-loading-bar">
              <Loader2 size={28} className="spin text-blue" />
              <span>Generating authoritative university gazette...</span>
            </div>
          ) : !gazetteData?.students?.length ? (
            <div className="adm-empty-gazette">
              <FileText size={40} color="#94a3b8" />
              <h4>No Gazette Data Available</h4>
              <p>Ensure candidate marks are entered and the "Compute & Tabulate" engine has been run for this cohort.</p>
            </div>
          ) : (
            <div className="adm-gazette-table-wrap">
              <table className="adm-gazette-table">
                <thead>
                  <tr>
                    <th>S.No.</th>
                    <th>Enrollment No</th>
                    <th>Candidate & Father's Name</th>
                    <th>Subject-Wise Marks Breakdown (Ext / Sess / Tot / Grd)</th>
                    <th>Total Score</th>
                    <th>SGPA</th>
                    <th>Result Status</th>
                    <th>Carry-Over Papers (COP)</th>
                    <th>Standing</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGazetteStudents.map((st, idx) => (
                    <tr key={st.studentId || idx} className={st.resultStatus === "FAIL" ? "row-fail" : ""}>
                      <td className="text-center">{idx + 1}</td>
                      <td className="font-mono"><strong>{st.enrollmentNo}</strong></td>
                      <td>
                        <div className="adm-cand-name">{st.fullName}</div>
                        <div className="adm-cand-father">S/O, D/O: {st.fatherName || "N/A"}</div>
                      </td>
                      <td>
                        <div className="adm-sub-grid">
                          {(st.subjectMarks || []).map((sub, sIdx) => (
                            <span key={sIdx} className="adm-sub-badge" title={sub.subject}>
                              <strong>{sub.subjectCode || sub.subject.slice(0, 4)}:</strong> {sub.totalObtained}/{sub.totalMax} ({sub.grade || "P"})
                            </span>
                          ))}
                        </div>
                        {st.graceMarksAwarded > 0 && (
                          <div className="adm-grace-tag">
                            + {st.graceMarksAwarded} Grace Marks Applied
                          </div>
                        )}
                      </td>
                      <td className="text-center">
                        <strong>{st.totalObtained}</strong> / {st.totalMax}
                        <div className="text-muted text-xs">
                          {st.totalMax > 0 ? Math.round((st.totalObtained / st.totalMax) * 100) : 0}%
                        </div>
                      </td>
                      <td className="text-center">
                        <strong className="text-lg">{st.sgpa?.toFixed(2) || "0.00"}</strong>
                      </td>
                      <td className="text-center">
                        <span className={`adm-status-badge ${st.resultStatus?.toLowerCase()}`}>
                          {st.resultStatus}
                        </span>
                      </td>
                      <td>
                        {st.carryOverPapers && st.carryOverPapers.length > 0 ? (
                          <span className="adm-cop-pill">
                            {st.carryOverPapers.join(", ")}
                          </span>
                        ) : (
                          <span className="text-muted text-xs">None (Clear)</span>
                        )}
                      </td>
                      <td>
                        <span className="adm-standing-text">{st.standing || "Pass"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Gazette Official Signatures Footer (Visible in Print) */}
              <div className="adm-gazette-sign-footer">
                <div className="adm-sign-block">
                  <div className="adm-sign-line"></div>
                  <span>Tabulator / Assistant</span>
                </div>
                <div className="adm-sign-block">
                  <div className="adm-sign-line"></div>
                  <span>Checked & Verified By</span>
                </div>
                <div className="adm-sign-block">
                  <div className="adm-sign-line"></div>
                  <span>Dean / Principal SITE</span>
                </div>
                <div className="adm-sign-block">
                  <div className="adm-sign-line"></div>
                  <span>Controller of Examinations (COE)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: EXAMINATION ORDINANCE & RULES */}
      {/* ==================================================================== */}
      {activeTab === "rules" && (
        <div className="adm-tab-content">
          {rulesLoading ? (
            <div className="adm-loading-bar">
              <Loader2 size={24} className="spin text-blue" />
              <span>Fetching institutional ordinance configuration...</span>
            </div>
          ) : rulesConfig ? (
            <form onSubmit={handleSaveRules} className="adm-rules-form">
              <div className="adm-card">
                <div className="adm-card-header">
                  <div>
                    <h3>Institutional Ordinance Policy Parameters</h3>
                    <p>SVSU Diploma in Engineering Examination & Evaluation Standard Operating Ordinance.</p>
                  </div>
                  <button type="submit" className="adm-btn-primary" disabled={rulesSaving}>
                    {rulesSaving ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
                    <span>Save Ordinance Parameters</span>
                  </button>
                </div>

                <div className="adm-rules-grid">
                  <div className="adm-input-group">
                    <label>Ordinance Name</label>
                    <input
                      type="text"
                      value={rulesConfig.ordinanceName || ""}
                      onChange={(e) => setRulesConfig({ ...rulesConfig, ordinanceName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="adm-input-group">
                    <label>Minimum Passing Percentage (%)</label>
                    <input
                      type="number"
                      min="20"
                      max="60"
                      value={rulesConfig.minimumPassingPercentage || 40}
                      onChange={(e) => setRulesConfig({ ...rulesConfig, minimumPassingPercentage: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="adm-input-group">
                    <label>Max Grace Marks (Per Subject)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={rulesConfig.graceMarksPolicy?.maxMarksPerSubject ?? 5}
                      onChange={(e) => setRulesConfig({
                        ...rulesConfig,
                        graceMarksPolicy: {
                          ...rulesConfig.graceMarksPolicy,
                          maxMarksPerSubject: Number(e.target.value)
                        }
                      })}
                      required
                    />
                  </div>

                  <div className="adm-input-group">
                    <label>Max Grace Subjects (Per Semester)</label>
                    <input
                      type="number"
                      min="0"
                      max="3"
                      value={rulesConfig.graceMarksPolicy?.maxSubjectsPerSemester ?? 1}
                      onChange={(e) => setRulesConfig({
                        ...rulesConfig,
                        graceMarksPolicy: {
                          ...rulesConfig.graceMarksPolicy,
                          maxSubjectsPerSemester: Number(e.target.value)
                        }
                      })}
                      required
                    />
                  </div>

                  <div className="adm-input-group">
                    <label>Max Carry-Over Papers (COP Ceiling)</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={rulesConfig.carryOverPolicy?.maxBacklogsForPromotion ?? 4}
                      onChange={(e) => setRulesConfig({
                        ...rulesConfig,
                        carryOverPolicy: {
                          ...rulesConfig.carryOverPolicy,
                          maxBacklogsForPromotion: Number(e.target.value)
                        }
                      })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Grading Scale Matrix */}
              <div className="adm-card">
                <div className="adm-card-header">
                  <div>
                    <h3>10-Point UGC/SVSU Letter Grade Scale</h3>
                    <p>Defines grade point conversions, score percentage bands, and standing classifications.</p>
                  </div>
                </div>

                <table className="adm-scale-table">
                  <thead>
                    <tr>
                      <th>Letter Grade</th>
                      <th>Grade Point</th>
                      <th>Min Percentage (%)</th>
                      <th>Max Percentage (%)</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rulesConfig.gradingScale || []).map((scale, i) => (
                      <tr key={scale.grade || i}>
                        <td><strong>{scale.grade}</strong></td>
                        <td>{scale.gradePoint}</td>
                        <td>{scale.minPercentage}%</td>
                        <td>{scale.maxPercentage}%</td>
                        <td>{scale.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </form>
          ) : null}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: AUDITED RESULT CORRECTIONS */}
      {/* ==================================================================== */}
      {activeTab === "corrections" && (
        <div className="adm-tab-content">
          <div className="adm-card">
            <div className="adm-card-header">
              <div>
                <h3 style={{ color: "#dc2626" }}>Controlled Post-Publication Mark Correction</h3>
                <p>
                  Audited mechanism for re-evaluation, scrutiny revisions, or university tribunal corrections. All adjustments require a verified executive directive and are logged into immutable audit ledgers.
                </p>
              </div>
            </div>

            <form onSubmit={handleApplyCorrection} className="adm-correction-form">
              <div className="adm-corr-grid">
                <div className="adm-input-group">
                  <label>Candidate User ID or Enrollment No</label>
                  <input
                    type="text"
                    placeholder="e.g. 660f89b... or SUB-CSE-2024-042"
                    value={correctionStudentId}
                    onChange={(e) => setCorrectionStudentId(e.target.value)}
                    required
                  />
                </div>

                <div className="adm-input-group">
                  <label>Subject Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Applied Mathematics-I"
                    value={correctionSubject}
                    onChange={(e) => setCorrectionSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="adm-input-group">
                  <label>Revised External Marks</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 45"
                    value={correctionExtObt}
                    onChange={(e) => setCorrectionExtObt(e.target.value)}
                  />
                </div>

                <div className="adm-input-group">
                  <label>Revised Sessional Marks</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 35"
                    value={correctionSessObt}
                    onChange={(e) => setCorrectionSessObt(e.target.value)}
                  />
                </div>

                <div className="adm-input-group">
                  <label>Revised Practical Marks</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 0"
                    value={correctionPracObt}
                    onChange={(e) => setCorrectionPracObt(e.target.value)}
                  />
                </div>
              </div>

              <div className="adm-input-group full">
                <label>Mandatory Executive Revision Directive / Audit Order Number</label>
                <textarea
                  rows={3}
                  placeholder="State formal order details, e.g. 'Re-evaluation Order #COE/SVSU/2024/REV-104 authorized by Controller of Examinations'..."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  required
                />
              </div>

              <div className="adm-corr-actions">
                <button
                  type="submit"
                  className="adm-btn-danger"
                  disabled={correctionLoading}
                >
                  {correctionLoading ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      <span>Adjusting Score & Recalculating...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Execute Audited Mark Revision</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
