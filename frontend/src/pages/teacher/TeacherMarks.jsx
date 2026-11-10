import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Award, Send, Save, FileSpreadsheet, CheckCircle2, AlertCircle,
  Clock, ArrowRight, Search, Filter, RotateCcw, Edit3,
  AlertTriangle, Layers, TrendingUp, TrendingDown, BarChart2, BarChart3,
  Users, Loader2, Printer, Download, ShieldCheck, ChevronDown, Check,
  Info, ArrowUpRight, Sparkles, Sliders, CheckCheck, Eye, X,
  Percent, Trophy, ChevronUp, SlidersHorizontal, RefreshCw
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, CartesianGrid, AreaChart, Area
} from "recharts";
import { authApi } from "../../services/authApi";
import "./TeacherTheme.css";
import "./TeacherMarks.css";

const BRANCH_OPTIONS = ["CSE", "Mechanical", "Electrical", "Civil", "ECE"];
const SEMESTER_OPTIONS = [
  "Semester 5", "Semester 1", "Semester 2", "Semester 3",
  "Semester 4", "Semester 6"
];
const SESSION_OPTIONS = ["2024-2025", "2023-2024", "2025-2026"];

// Smooth Count-Up Animation Hook for Numeric Values
function useCountUp(target, duration = 650) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    const end = Number(target) || 0;
    if (end === 0) {
      setVal(0);
      return;
    }
    const startTime = performance.now();
    let frameId;
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = eased * end;
      setVal(end % 1 !== 0 ? Number(current.toFixed(1)) : Math.round(current));
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);

  return val;
}

export default function TeacherMarks({ showToast }) {
  // Navigation Tabs:
  // "entry" (spreadsheet + one-time ceiling config + quick KPIs)
  // "analytics" (deep academic charts, distribution, sessional comparison, top performers)
  // "bestOfThree" (cohort comparison matrix ledger with improvement indicators)
  const [activeTab, setActiveTab] = useState("entry");

  // Active Sessional Examination: 1, 2, or 3
  const [activeSessionalNum, setActiveSessionalNum] = useState(1);

  // Cohort Selection State (Defaulting to CSE Semester 5 where curriculum subjects exist)
  const [selectedSession, setSelectedSession] = useState("2024-2025");
  const [selectedBranch, setSelectedBranch] = useState("CSE");
  const [selectedSemester, setSelectedSemester] = useState("Semester 5");

  // Subject List
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjectDoc, setSelectedSubjectDoc] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSubjectCode, setSelectedSubjectCode] = useState("");
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // One-Time Maximum Marks Setting State
  const [subjectMaxMarks, setSubjectMaxMarks] = useState(20);
  const [inputConfigMax, setInputConfigMax] = useState(25);
  const [savingConfigMax, setSavingConfigMax] = useState(false);
  const [configSuccessPulse, setConfigSuccessPulse] = useState(false);

  // Exceeding Marks Confirmation Modal State
  const [confirmModalData, setConfirmModalData] = useState(null);

  // Candidate Spreadsheet Rows:
  // [ { studentId, enrollmentNo, fullName, avatarUrl, marksObtained, maxMarks, isModified, isSaved, updatedAt, remarks } ]
  const [rows, setRows] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);
  const [savingRowId, setSavingRowId] = useState(null);

  // Search, Filter & Sort State for Spreadsheet
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "entered" | "pending" | "distinction" | "remedial"
  const [sortOption, setSortOption] = useState("default"); // "default" | "enrollment" | "name" | "score_desc" | "score_asc" | "pct_desc"

  // Cohort Best-of-3 Matrix State
  const [cohortMatrix, setCohortMatrix] = useState([]);
  const [loadingMatrix, setLoadingMatrix] = useState(false);

  // Server-Side Academic Analytics State
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // -------------------------------------------------------------
  // 1. FETCH SUBJECTS WITH DYNAMIC MAX MARKS
  // -------------------------------------------------------------
  const loadSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const res = await authApi.getSessionalSubjects({
        branch: selectedBranch,
        semester: selectedSemester
      });
      const list = res?.subjects || [];
      setAvailableSubjects(list);

      if (list.length > 0) {
        // Auto-select previous or first subject
        const existing = list.find(
          (s) => s.subjectCode === selectedSubjectCode || s.subjectName === selectedSubject
        ) || list[0];

        setSelectedSubjectDoc(existing);
        setSelectedSubject(existing.subjectName);
        setSelectedSubjectCode(existing.subjectCode);

        // Determine configured maximum marks for current sessional number
        const configuredMax = activeSessionalNum === 1
          ? (existing.sessional1Max || existing.sessionalMax || 20)
          : activeSessionalNum === 2
          ? (existing.sessional2Max || existing.sessionalMax || 20)
          : (existing.sessional3Max || existing.sessionalMax || 20);

        setSubjectMaxMarks(configuredMax);
        setInputConfigMax(configuredMax);
      } else {
        setSelectedSubjectDoc(null);
        setSelectedSubject("");
        setSelectedSubjectCode("");
        setSubjectMaxMarks(20);
        setInputConfigMax(20);
      }
    } catch (err) {
      console.warn("Failed to fetch subjects:", err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, [selectedBranch, selectedSemester]);

  // Update subjectMaxMarks when sessional tab changes or subject changes
  useEffect(() => {
    if (selectedSubjectDoc) {
      const configuredMax = activeSessionalNum === 1
        ? (selectedSubjectDoc.sessional1Max || selectedSubjectDoc.sessionalMax || 20)
        : activeSessionalNum === 2
        ? (selectedSubjectDoc.sessional2Max || selectedSubjectDoc.sessionalMax || 20)
        : (selectedSubjectDoc.sessional3Max || selectedSubjectDoc.sessionalMax || 20);

      setSubjectMaxMarks(configuredMax);
      setInputConfigMax(configuredMax);
    }
  }, [activeSessionalNum, selectedSubjectDoc]);

  // -------------------------------------------------------------
  // 2. LOAD ENROLLED CANDIDATES & EXISTING SESSIONAL MARKS
  // -------------------------------------------------------------
  const loadCandidateSpreadsheet = async () => {
    if (!selectedSubject) {
      setRows([]);
      return;
    }

    setLoadingStudents(true);
    try {
      // 1. Fetch enrolled students from student directory for branch
      const stdRes = await authApi.getStudentsDirectory({
        branch: selectedBranch,
        limit: 150
      }).catch(() => null);

      const enrolled = stdRes?.students || [];

      // 2. Fetch existing marks for this subject & sessional from backend
      const existingMarksRes = await authApi.getSessionalMarks({
        branch: selectedBranch,
        semester: selectedSemester,
        subject: selectedSubject,
        subjectCode: selectedSubjectCode,
        sessionalNumber: activeSessionalNum,
        academicSession: selectedSession
      }).catch((err) => {
        console.error("Failed to load existing marks:", err);
        return null;
      });

      const existingMarks = existingMarksRes?.marks || [];
      const marksMap = {};
      existingMarks.forEach((m) => {
        const sId = m.studentId?._id || m.studentId?.id || m.studentId;
        if (sId) {
          marksMap[String(sId)] = m;
        }
        const roll = m.studentId?.enrollmentNo || m.studentId?.rollNo;
        if (roll) {
          marksMap[String(roll)] = m;
        }
      });

      // Construct spreadsheet rows
      const spreadsheetRows = enrolled.map((s) => {
        const sId = String(s.id || s._id);
        const roll = s.enrollmentNo || s.rollNo;
        const saved = marksMap[sId] || (roll ? marksMap[String(roll)] : undefined);

        // Single Source of Truth: Maximum marks is uniformly governed by the active subject ceiling
        const maxM = subjectMaxMarks || 20;
        const obtM = (saved?.marksObtained !== undefined && saved?.marksObtained !== null) ? saved.marksObtained : "";

        return {
          studentId: sId,
          enrollmentNo: roll || "N/A",
          fullName: s.fullName || "Candidate",
          avatarUrl: s.avatarUrl || "",
          maxMarks: maxM,
          marksObtained: obtM,
          isModified: false,
          isSaved: saved !== undefined,
          updatedAt: saved?.updatedAt || null,
          remarks: saved?.remarks || ""
        };
      });

      setRows(spreadsheetRows);
    } catch (err) {
      showToast?.(err.message || "Failed to load candidate spreadsheet.", true);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadCandidateSpreadsheet();
  }, [selectedBranch, selectedSemester, selectedSubject, activeSessionalNum, selectedSession, subjectMaxMarks]);

  // -------------------------------------------------------------
  // 3. LOAD SERVER-SIDE ACADEMIC ANALYTICS
  // -------------------------------------------------------------
  const loadAnalytics = async () => {
    if (!selectedSubjectCode && !selectedSubject) return;
    setLoadingAnalytics(true);
    try {
      const res = await authApi.getSessionalAnalytics({
        branch: selectedBranch,
        semester: selectedSemester,
        subjectCode: selectedSubjectCode,
        subject: selectedSubject,
        sessionalNumber: activeSessionalNum,
        academicSession: selectedSession
      });
      setAnalyticsData(res);
    } catch (err) {
      console.warn("Analytics load warning:", err.message);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedBranch, selectedSemester, selectedSubjectCode, selectedSubject, activeSessionalNum, selectedSession, subjectMaxMarks]);

  // -------------------------------------------------------------
  // 4. ONE-TIME EXAM MAXIMUM MARKS CONFIGURATION
  // -------------------------------------------------------------
  const handleSaveExamMaxMarks = async (force = false) => {
    const newMax = Number(inputConfigMax);
    if (isNaN(newMax) || newMax < 5 || newMax > 100) {
      showToast?.("Maximum marks must be a valid number between 5 and 100.", true);
      return;
    }

    setSavingConfigMax(true);
    try {
      const res = await authApi.updateSessionalMaxMarks({
        branch: selectedBranch,
        semester: selectedSemester,
        subjectCode: selectedSubjectCode,
        subjectName: selectedSubject,
        sessionalNumber: activeSessionalNum,
        maxMarks: newMax,
        academicSession: selectedSession,
        force
      });

      // 1. Immediately update subject max marks and input
      setSubjectMaxMarks(newMax);
      setInputConfigMax(newMax);
      setConfirmModalData(null);
      setConfigSuccessPulse(true);
      setTimeout(() => setConfigSuccessPulse(false), 2500);

      showToast?.(`Applied ${newMax} maximum marks for Sessional ${activeSessionalNum} (${selectedSubject || selectedSubjectCode}). All students updated automatically.`);

      // 2. Synchronize selectedSubjectDoc state so downstream hooks & tabs use the new ceiling
      const sKey = activeSessionalNum === 1 ? "sessional1Max" : activeSessionalNum === 2 ? "sessional2Max" : "sessional3Max";
      const updatedSub = res?.subject || {};
      setSelectedSubjectDoc((prev) => ({
        ...(prev || {}),
        sessionalMax: newMax,
        [sKey]: newMax,
        ...updatedSub
      }));

      // 3. Update in-memory spreadsheet rows max marks immediately
      setRows((prev) =>
        prev.map((r) => ({
          ...r,
          maxMarks: newMax
        }))
      );

      // 4. Update availableSubjects array in state
      setAvailableSubjects((prev) =>
        prev.map((s) => {
          if (s.subjectCode === selectedSubjectCode || s.subjectName === selectedSubject) {
            return {
              ...s,
              sessionalMax: newMax,
              [sKey]: newMax,
              ...updatedSub
            };
          }
          return s;
        })
      );

      // 5. Refresh analytics
      loadAnalytics();
    } catch (err) {
      if (err.requiresConfirmation) {
        setConfirmModalData({
          exceedingCount: err.exceedingCount,
          highestScore: err.highestScore,
          proposedMax: newMax
        });
      } else {
        showToast?.(err.message || "Failed to update maximum marks.", true);
      }
    } finally {
      setSavingConfigMax(false);
    }
  };

  // -------------------------------------------------------------
  // 5. ROW EDIT & VALIDATION
  // -------------------------------------------------------------
  const handleScoreChange = (index, value) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        marksObtained: value,
        isModified: true
      };
      return updated;
    });
  };

  const getRowValidation = (row) => {
    const val = row.marksObtained;
    if (val === "" || val === null || val === undefined) {
      return { isValid: true, isFilled: false, error: null, pct: null };
    }
    const num = Number(val);
    if (isNaN(num)) {
      return { isValid: false, isFilled: true, error: "Must be a valid number", pct: null };
    }
    if (num < 0) {
      return { isValid: false, isFilled: true, error: "Cannot be negative", pct: null };
    }
    if (num > row.maxMarks) {
      return { isValid: false, isFilled: true, error: `Exceeds max (${row.maxMarks})`, pct: null };
    }
    const pct = row.maxMarks > 0 ? Number(((num / row.maxMarks) * 100).toFixed(1)) : 0;
    return { isValid: true, isFilled: true, error: null, pct };
  };

  // -------------------------------------------------------------
  // 6. SAVE INDIVIDUAL CANDIDATE MARK
  // -------------------------------------------------------------
  const handleSaveIndividualRow = async (row, index) => {
    const validation = getRowValidation(row);
    if (!validation.isFilled) {
      showToast?.(`Please enter a score for ${row.fullName}.`, true);
      return;
    }
    if (!validation.isValid) {
      showToast?.(`${row.fullName}: ${validation.error}`, true);
      return;
    }

    setSavingRowId(row.studentId);
    try {
      const res = await authApi.submitSessionalMarksBatch({
        branch: selectedBranch,
        semester: selectedSemester,
        subject: selectedSubject,
        subjectCode: selectedSubjectCode,
        academicSession: selectedSession,
        sessionalNumber: activeSessionalNum,
        maxMarks: subjectMaxMarks,
        marks: [
          {
            studentId: row.studentId,
            marksObtained: Number(row.marksObtained),
            maxMarks: subjectMaxMarks,
            remarks: row.remarks || ""
          }
        ]
      });

      if (!res?.success) {
        throw new Error(res?.message || "Failed to save score.");
      }

      showToast?.(`Saved score ${row.marksObtained} / ${subjectMaxMarks} for ${row.fullName}. Student access live.`);
      setRows((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          marksObtained: Number(row.marksObtained),
          maxMarks: subjectMaxMarks,
          isModified: false,
          isSaved: true,
          updatedAt: new Date().toISOString()
        };
        return updated;
      });
      loadAnalytics();
    } catch (err) {
      showToast?.(err.message || "Failed to save score.", true);
    } finally {
      setSavingRowId(null);
    }
  };

  // -------------------------------------------------------------
  // 7. BULK SAVE ALL SESSIONAL MARKS
  // -------------------------------------------------------------
  const handleBulkSave = async () => {
    const validMarks = [];
    const invalidErrors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const v = getRowValidation(r);
      if (v.isFilled) {
        if (!v.isValid) {
          invalidErrors.push(`Candidate #${i + 1} (${r.fullName}): ${v.error}`);
        } else {
          validMarks.push({
            studentId: r.studentId,
            marksObtained: Number(r.marksObtained),
            maxMarks: r.maxMarks,
            remarks: r.remarks || ""
          });
        }
      }
    }

    if (invalidErrors.length > 0) {
      showToast?.(invalidErrors[0], true);
      return;
    }

    if (validMarks.length === 0) {
      showToast?.("No candidate marks have been entered to save.", true);
      return;
    }

    setSavingBatch(true);
    try {
      const res = await authApi.submitSessionalMarksBatch({
        branch: selectedBranch,
        semester: selectedSemester,
        subject: selectedSubject,
        subjectCode: selectedSubjectCode,
        academicSession: selectedSession,
        sessionalNumber: activeSessionalNum,
        maxMarks: subjectMaxMarks,
        marks: validMarks
      });

      if (!res?.success) {
        throw new Error(res?.message || "Failed to save sessional marks.");
      }

      showToast?.(`Successfully saved Sessional ${activeSessionalNum} marks for ${res.savedCount} candidates.`);
      await loadCandidateSpreadsheet();
      loadAnalytics();
    } catch (err) {
      showToast?.(err.message || "Failed to save sessional marks.", true);
    } finally {
      setSavingBatch(false);
    }
  };

  // -------------------------------------------------------------
  // 8. LOAD COHORT BEST-OF-3 COMPARISON MATRIX
  // -------------------------------------------------------------
  const loadCohortMatrix = async () => {
    setLoadingMatrix(true);
    try {
      const res = await authApi.getSessionalMarks({
        branch: selectedBranch,
        semester: selectedSemester,
        subject: selectedSubject,
        subjectCode: selectedSubjectCode,
        academicSession: selectedSession
      });

      const marks = res?.marks || [];

      const stdRes = await authApi.getStudentsDirectory({
        branch: selectedBranch,
        limit: 150
      }).catch(() => null);
      const enrolled = stdRes?.students || [];

      const matrixRows = enrolled.map((st) => {
        const sId = String(st.id || st._id);
        const roll = st.enrollmentNo || st.rollNo;
        const matchesStudent = (m) => {
          const mId = String(m.studentId?._id || m.studentId?.id || m.studentId || "");
          const mRoll = m.studentId?.enrollmentNo || m.studentId?.rollNo || m.enrollmentNo;
          return mId === sId || (roll && mRoll === roll);
        };
        const s1Mark = marks.find(
          (m) => matchesStudent(m) && (m.sessionalNumber === 1 || m.examType === "Sessional 1")
        );
        const s2Mark = marks.find(
          (m) => matchesStudent(m) && (m.sessionalNumber === 2 || m.examType === "Sessional 2")
        );
        const s3Mark = marks.find(
          (m) => matchesStudent(m) && (m.sessionalNumber === 3 || m.examType === "Sessional 3")
        );

        const s1Val = s1Mark ? s1Mark.marksObtained : null;
        const s2Val = s2Mark ? s2Mark.marksObtained : null;
        const s3Val = s3Mark ? s3Mark.marksObtained : null;

        const s1Max = selectedSubjectDoc?.sessional1Max || selectedSubjectDoc?.sessionalMax || 20;
        const s2Max = selectedSubjectDoc?.sessional2Max || selectedSubjectDoc?.sessionalMax || 20;
        const s3Max = selectedSubjectDoc?.sessional3Max || selectedSubjectDoc?.sessionalMax || 20;

        const validScores = [];
        if (s1Val !== null) validScores.push({ label: "Sessional 1", val: s1Val, max: s1Max, pct: (s1Val / s1Max) * 100 });
        if (s2Val !== null) validScores.push({ label: "Sessional 2", val: s2Val, max: s2Max, pct: (s2Val / s2Max) * 100 });
        if (s3Val !== null) validScores.push({ label: "Sessional 3", val: s3Val, max: s3Max, pct: (s3Val / s3Max) * 100 });

        let bestVal = null;
        let bestMax = subjectMaxMarks;
        let selectedFrom = "—";
        let improvementDiff = null;

        if (validScores.length > 0) {
          // Normalize comparison using percentage when maximum marks differ
          const highestPct = Math.max(...validScores.map((v) => v.pct));
          const winner = validScores.find((v) => v.pct === highestPct);
          bestVal = winner.val;
          bestMax = winner.max;

          const winners = validScores.filter((v) => v.pct === highestPct).map((v) => v.label);
          selectedFrom = winners.length > 1 ? `${winners.join(" & ")} (Tied)` : winner.label;

          // Improvement trend: compare latest attempt with earliest
          if (validScores.length >= 2) {
            const firstPct = validScores[0].pct;
            const latestPct = validScores[validScores.length - 1].pct;
            improvementDiff = Number((latestPct - firstPct).toFixed(1));
          }
        }

        return {
          studentId: sId,
          enrollmentNo: st.enrollmentNo || "N/A",
          fullName: st.fullName || "Candidate",
          s1: s1Val,
          s1Max,
          s2: s2Val,
          s2Max,
          s3: s3Val,
          s3Max,
          best: bestVal,
          bestMax,
          selectedFrom,
          improvementDiff
        };
      });

      setCohortMatrix(matrixRows);
    } catch (err) {
      showToast?.(err.message || "Failed to compile Best-of-3 matrix.", true);
    } finally {
      setLoadingMatrix(false);
    }
  };

  useEffect(() => {
    if (activeTab === "bestOfThree") {
      loadCohortMatrix();
    }
  }, [activeTab, selectedBranch, selectedSemester, selectedSubject, selectedSession, subjectMaxMarks]);

  // -------------------------------------------------------------
  // 9. FILTER & SORT SPREADSHEET ROWS
  // -------------------------------------------------------------
  const processedRows = useMemo(() => {
    let result = [...rows];

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.fullName.toLowerCase().includes(q) ||
          r.enrollmentNo.toLowerCase().includes(q)
      );
    }

    // Status Filter
    if (statusFilter === "entered") {
      result = result.filter((r) => r.marksObtained !== "" && r.marksObtained !== null);
    } else if (statusFilter === "pending") {
      result = result.filter((r) => r.marksObtained === "" || r.marksObtained === null);
    } else if (statusFilter === "distinction") {
      result = result.filter((r) => {
        const v = getRowValidation(r);
        return v.pct !== null && v.pct >= 75;
      });
    } else if (statusFilter === "remedial") {
      result = result.filter((r) => {
        const v = getRowValidation(r);
        return v.pct !== null && v.pct < 40;
      });
    }

    // Sort Options
    if (sortOption === "enrollment") {
      result.sort((a, b) => a.enrollmentNo.localeCompare(b.enrollmentNo));
    } else if (sortOption === "name") {
      result.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else if (sortOption === "score_desc") {
      result.sort((a, b) => {
        const valA = Number(a.marksObtained) || -1;
        const valB = Number(b.marksObtained) || -1;
        return valB - valA;
      });
    } else if (sortOption === "score_asc") {
      result.sort((a, b) => {
        const valA = Number(a.marksObtained) || 999;
        const valB = Number(b.marksObtained) || 999;
        return valA - valB;
      });
    } else if (sortOption === "pct_desc") {
      result.sort((a, b) => {
        const pctA = a.maxMarks > 0 ? (Number(a.marksObtained) || 0) / a.maxMarks : 0;
        const pctB = b.maxMarks > 0 ? (Number(b.marksObtained) || 0) / b.maxMarks : 0;
        return pctB - pctA;
      });
    }

    return result;
  }, [rows, searchQuery, statusFilter, sortOption]);

  // -------------------------------------------------------------
  // 10. REAL-DATA KPI METRICS
  // -------------------------------------------------------------
  const liveKpis = useMemo(() => {
    const totalEnrolled = rows.length;
    let enteredCount = 0;
    let sumObtained = 0;
    let maxObtained = -Infinity;
    let minObtained = Infinity;

    rows.forEach((r) => {
      const v = getRowValidation(r);
      if (v.isFilled && v.isValid) {
        enteredCount++;
        const num = Number(r.marksObtained);
        sumObtained += num;
        if (num > maxObtained) maxObtained = num;
        if (num < minObtained) minObtained = num;
      }
    });

    const pendingCount = Math.max(0, totalEnrolled - enteredCount);
    const classAvgScore = enteredCount > 0 ? Number((sumObtained / enteredCount).toFixed(1)) : 0;
    const classAvgPct = subjectMaxMarks > 0 ? Number(((classAvgScore / subjectMaxMarks) * 100).toFixed(1)) : 0;
    const highestMarks = maxObtained === -Infinity ? 0 : maxObtained;
    const lowestMarks = minObtained === Infinity ? 0 : minObtained;
    const completionRate = totalEnrolled > 0 ? Number(((enteredCount / totalEnrolled) * 100).toFixed(1)) : 0;

    return {
      totalEnrolled,
      enteredCount,
      pendingCount,
      classAvgScore,
      classAvgPct,
      highestMarks,
      lowestMarks,
      completionRate
    };
  }, [rows, subjectMaxMarks]);

  // Animated Count-Up Values
  const animEnrolled = useCountUp(liveKpis.totalEnrolled);
  const animEntered = useCountUp(liveKpis.enteredCount);
  const animAvgScore = useCountUp(liveKpis.classAvgScore);
  const animHighest = useCountUp(liveKpis.highestMarks);
  const animLowest = useCountUp(liveKpis.lowestMarks);
  const animAvgPct = useCountUp(liveKpis.classAvgPct);
  const animPending = useCountUp(liveKpis.pendingCount);
  const animCompletion = useCountUp(liveKpis.completionRate);

  // -------------------------------------------------------------
  // 11. CHARTS DATA (Fallback to live rows if server data pending)
  // -------------------------------------------------------------
  const distributionChartData = useMemo(() => {
    if (analyticsData?.distribution) return analyticsData.distribution;

    const bands = [
      { range: "0 - 39%", label: "Remedial / Fail", count: 0, color: "#EF4444" },
      { range: "40 - 59%", label: "Pass (Grade C)", count: 0, color: "#F59E0B" },
      { range: "60 - 74%", label: "Good (Grade B)", count: 0, color: "#0284C7" },
      { range: "75 - 89%", label: "Distinction (A)", count: 0, color: "#2563EB" },
      { range: "90 - 100%", label: "Outstanding (A+)", count: 0, color: "#10B981" }
    ];

    rows.forEach((r) => {
      const v = getRowValidation(r);
      if (v.isFilled && v.isValid && v.pct !== null) {
        if (v.pct < 40) bands[0].count++;
        else if (v.pct < 60) bands[1].count++;
        else if (v.pct < 75) bands[2].count++;
        else if (v.pct < 90) bands[3].count++;
        else bands[4].count++;
      }
    });

    return bands;
  }, [analyticsData, rows]);

  const sessionalComparisonData = useMemo(() => {
    return analyticsData?.sessionalComparison || [
      { name: "Sessional 1", term: "First Term", avgPct: 0, entered: 0, max: subjectMaxMarks },
      { name: "Sessional 2", term: "Mid Term", avgPct: 0, entered: 0, max: subjectMaxMarks },
      { name: "Sessional 3", term: "Pre-End Term", avgPct: 0, entered: 0, max: subjectMaxMarks }
    ];
  }, [analyticsData, subjectMaxMarks]);

  const subjectPerformanceData = useMemo(() => {
    return analyticsData?.subjectPerformance || [];
  }, [analyticsData]);

  const topPerformersList = useMemo(() => {
    if (analyticsData?.topPerformers && analyticsData.topPerformers.length > 0) {
      return analyticsData.topPerformers;
    }
    // Fallback from live rows
    return [...rows]
      .filter((r) => r.marksObtained !== "" && !isNaN(Number(r.marksObtained)))
      .sort((a, b) => Number(b.marksObtained) - Number(a.marksObtained))
      .slice(0, 5)
      .map((r, i) => {
        const obt = Number(r.marksObtained);
        const pct = r.maxMarks > 0 ? Number(((obt / r.maxMarks) * 100).toFixed(1)) : 0;
        return {
          rank: i + 1,
          fullName: r.fullName,
          enrollmentNo: r.enrollmentNo,
          marksObtained: obt,
          maxMarks: r.maxMarks,
          percentage: pct,
          grade: pct >= 80 ? "A+" : pct >= 70 ? "A" : pct >= 60 ? "B+" : pct >= 50 ? "B" : pct >= 40 ? "C" : "F"
        };
      });
  }, [analyticsData, rows]);

  return (
    <div className="teacher-role-view teacher-marks-container">
      {/* ───────────── 1. HEADER & TOP CONTROLS ───────────── */}
      <div className="tch-pane-header no-print">
        <div className="tch-header-left">
          <div className="tch-badge-pill">
            <Award size={15} color="#2563eb" />
            <span>Subharti Polytechnic College • Internal Assessment Cell</span>
          </div>
          <h2>Academic Performance & Three-Sessional Dashboard</h2>
          <p>
            Autonomous marks management with one-time exam maximum ceilings, live cohort analytics, Best-of-Three evaluation, and instant student access.
          </p>
        </div>

        <div className="tch-header-actions">
          <button
            type="button"
            className="tch-btn-secondary"
            onClick={() => {
              loadSubjects();
              loadCandidateSpreadsheet();
              loadAnalytics();
            }}
            title="Synchronize Records with MongoDB"
          >
            <RefreshCw size={15} />
            <span>Sync Live Data</span>
          </button>
        </div>
      </div>

      {/* ───────────── 2. TOP LEVEL WORKSPACE TABS ───────────── */}
      <div className="tch-workspace-tabs no-print">
        <button
          type="button"
          className={`tch-workspace-tab ${activeTab === "entry" ? "active" : ""}`}
          onClick={() => setActiveTab("entry")}
        >
          <FileSpreadsheet size={16} />
          <span>Marks Entry & Overview</span>
        </button>

        <button
          type="button"
          className={`tch-workspace-tab ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <BarChart3 size={16} />
          <span>Academic Analytics & Charts</span>
        </button>

        <button
          type="button"
          className={`tch-workspace-tab ${activeTab === "bestOfThree" ? "active" : ""}`}
          onClick={() => setActiveTab("bestOfThree")}
        >
          <Sparkles size={16} />
          <span>Three-Sessional Cohort Ledger</span>
        </button>
      </div>

      {/* ───────────── 3. COHORT SELECTION PANEL ───────────── */}
      <div className="tch-card tch-cohort-panel no-print">
        <div className="tch-cohort-panel-header">
          <div className="tch-cohort-title">
            <Filter size={16} color="#2563eb" />
            <span>Academic Cohort & Curriculum Selection</span>
          </div>
          <div className="tch-configured-max-badge">
            <SlidersHorizontal size={14} />
            <span>Active Ceiling: <strong>{subjectMaxMarks} Marks</strong></span>
          </div>
        </div>

        <div className="tch-cohort-grid">
          <div className="tch-field-group">
            <label>Academic Session</label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              {SESSION_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="tch-field-group">
            <label>Branch / Department</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              {BRANCH_OPTIONS.map((b) => (
                <option key={b} value={b}>{b} Engineering</option>
              ))}
            </select>
          </div>

          <div className="tch-field-group">
            <label>Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
            >
              {SEMESTER_OPTIONS.map((sem) => (
                <option key={sem} value={sem}>{sem}</option>
              ))}
            </select>
          </div>

          <div className="tch-field-group subject-select">
            <label>Curriculum Subject</label>
            {loadingSubjects ? (
              <div className="tch-select-loading">
                <Loader2 size={14} className="spin" />
                <span>Loading curriculum...</span>
              </div>
            ) : availableSubjects.length === 0 ? (
              <select disabled>
                <option>No curriculum subjects configured for {selectedBranch} {selectedSemester}</option>
              </select>
            ) : (
              <select
                value={selectedSubjectCode}
                onChange={(e) => {
                  const found = availableSubjects.find((s) => s.subjectCode === e.target.value);
                  if (found) {
                    setSelectedSubjectDoc(found);
                    setSelectedSubject(found.subjectName);
                    setSelectedSubjectCode(found.subjectCode);
                  }
                }}
              >
                {availableSubjects.map((sub, idx) => (
                  <option key={`${sub.subjectCode || "sub"}-${idx}`} value={sub.subjectCode}>
                    {sub.subjectCode}: {sub.subjectName} ({sub.sessionalMax || 20}M)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* ───────────── 4. PART 1: ONE-TIME EXAM MAXIMUM MARKS SETTING PANEL ───────────── */}
      <div className={`tch-card tch-max-marks-config-panel no-print ${configSuccessPulse ? "pulse-success" : ""}`}>
        <div className="tch-config-panel-top">
          <div className="tch-config-icon-badge">
            <Sliders size={20} color="#2563eb" />
          </div>
          <div className="tch-config-text">
            <h4>One-Time Exam Maximum Marks Setting</h4>
            <p>
              Configure the maximum ceiling once for <strong>{selectedSubject || "Subject"}</strong> ({selectedSubjectCode || "Code"}) in <strong>Sessional {activeSessionalNum}</strong>. All candidate entries will automatically calculate out of this maximum without separate entry.
            </p>
          </div>
        </div>

        <div className="tch-config-controls-row">
          <div className="tch-config-item">
            <span className="cfg-lbl">Subject Code</span>
            <span className="cfg-val font-mono">{selectedSubjectCode || "—"}</span>
          </div>

          <div className="tch-config-item">
            <span className="cfg-lbl">Selected Exam</span>
            <span className="cfg-val font-semibold text-primary">Sessional {activeSessionalNum}</span>
          </div>

          <div className="tch-config-item">
            <span className="cfg-lbl">Current Saved Ceiling</span>
            <span className="cfg-val bold text-blue">{subjectMaxMarks} Marks</span>
          </div>

          <div className="tch-config-input-group">
            <label htmlFor="exam-max-input">New Maximum Marks:</label>
            <div className="tch-config-input-wrap">
              <input
                id="exam-max-input"
                type="number"
                min="5"
                max="100"
                step="1"
                value={inputConfigMax}
                onChange={(e) => setInputConfigMax(e.target.value)}
                className="tch-max-num-input"
                placeholder="e.g. 25"
              />
              <span className="tch-unit-tag">Marks</span>
            </div>
          </div>

          <button
            type="button"
            className="tch-btn-apply-max"
            disabled={savingConfigMax || !selectedSubjectCode || Number(inputConfigMax) === subjectMaxMarks}
            onClick={() => handleSaveExamMaxMarks(false)}
          >
            {savingConfigMax ? (
              <>
                <Loader2 size={15} className="spin" />
                <span>Applying...</span>
              </>
            ) : configSuccessPulse || Number(inputConfigMax) === subjectMaxMarks ? (
              <>
                <CheckCircle2 size={15} color="#10b981" />
                <span>Saved ({subjectMaxMarks}M Ceiling Active)</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Apply & Save Maximum ({inputConfigMax}M)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ───────────── 5. PART 3: TOP REAL-DATA KPI BENTO CARDS ───────────── */}
      <div className="tch-kpi-bento-grid no-print">
        {/* KPI 1: Enrolled Candidates */}
        <div className="tch-kpi-card">
          <div className="tch-kpi-icon blue">
            <Users size={20} />
          </div>
          <div className="tch-kpi-body">
            <span className="tch-kpi-label">Total Enrolled</span>
            <span className="tch-kpi-value">{animEnrolled}</span>
            <span className="tch-kpi-sub">{selectedBranch} {selectedSemester}</span>
          </div>
        </div>

        {/* KPI 2: Marks Entered */}
        <div className="tch-kpi-card">
          <div className="tch-kpi-icon emerald">
            <CheckCircle2 size={20} />
          </div>
          <div className="tch-kpi-body">
            <span className="tch-kpi-label">Marks Entered</span>
            <span className="tch-kpi-value">{animEntered} / {animEnrolled}</span>
            <span className="tch-kpi-sub text-emerald">{animCompletion}% Synced</span>
          </div>
        </div>

        {/* KPI 3: Average Class Score */}
        <div className="tch-kpi-card highlight-accent">
          <div className="tch-kpi-icon violet">
            <Award size={20} />
          </div>
          <div className="tch-kpi-body">
            <span className="tch-kpi-label">Average Class Score</span>
            <span className="tch-kpi-value text-violet">
              {animAvgScore} <small>/ {subjectMaxMarks}</small>
            </span>
            <span className="tch-kpi-sub">Mean: {animAvgPct}%</span>
          </div>
        </div>

        {/* KPI 4: Highest Marks */}
        <div className="tch-kpi-card">
          <div className="tch-kpi-icon amber">
            <Trophy size={20} />
          </div>
          <div className="tch-kpi-body">
            <span className="tch-kpi-label">Highest Score</span>
            <span className="tch-kpi-value text-amber">
              {animHighest} <small>/ {subjectMaxMarks}</small>
            </span>
            <span className="tch-kpi-sub">Top Mark in Class</span>
          </div>
        </div>

        {/* KPI 5: Lowest Marks */}
        <div className="tch-kpi-card">
          <div className="tch-kpi-icon rose">
            <AlertCircle size={20} />
          </div>
          <div className="tch-kpi-body">
            <span className="tch-kpi-label">Lowest Score</span>
            <span className="tch-kpi-value text-rose">
              {animLowest} <small>/ {subjectMaxMarks}</small>
            </span>
            <span className="tch-kpi-sub">Minimum Attained</span>
          </div>
        </div>

        {/* KPI 6: Class Average Percentage */}
        <div className="tch-kpi-card">
          <div className="tch-kpi-icon cyan">
            <Percent size={20} />
          </div>
          <div className="tch-kpi-body">
            <span className="tch-kpi-label">Class Average %</span>
            <span className="tch-kpi-value text-cyan">{animAvgPct}%</span>
            <span className="tch-kpi-sub">Normalized aggregate</span>
          </div>
        </div>

        {/* KPI 7: Students Awaiting Marks */}
        <div className="tch-kpi-card">
          <div className="tch-kpi-icon amber">
            <Clock size={20} />
          </div>
          <div className="tch-kpi-body">
            <span className="tch-kpi-label">Awaiting Entry</span>
            <span className="tch-kpi-value">{animPending}</span>
            <span className="tch-kpi-sub">
              {animPending === 0 ? "All candidates graded" : "Entries remaining"}
            </span>
          </div>
        </div>

        {/* KPI 8: Completion Rate with Progress Bar */}
        <div className="tch-kpi-card">
          <div className="tch-kpi-icon emerald">
            <Layers size={20} />
          </div>
          <div className="tch-kpi-body">
            <span className="tch-kpi-label">Completion Rate</span>
            <span className="tch-kpi-value text-emerald">{animCompletion}%</span>
            <div className="tch-mini-progress">
              <div
                className="tch-mini-bar"
                style={{ width: `${Math.min(animCompletion, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: MARKS ENTRY & OVERVIEW SPREADSHEET
          ========================================================================= */}
      {activeTab === "entry" && (
        <div className="tch-sessional-workspace">
          {/* Sessional 1, 2, 3 Selector Bar */}
          <div className="tch-sessional-selector-bar no-print">
            <div className="tch-sessional-pills">
              <button
                type="button"
                className={`tch-sess-pill ${activeSessionalNum === 1 ? "active s1" : ""}`}
                onClick={() => setActiveSessionalNum(1)}
              >
                <span className="pill-dot s1" />
                <span>Sessional 1 (First Term)</span>
              </button>

              <button
                type="button"
                className={`tch-sess-pill ${activeSessionalNum === 2 ? "active s2" : ""}`}
                onClick={() => setActiveSessionalNum(2)}
              >
                <span className="pill-dot s2" />
                <span>Sessional 2 (Mid Term)</span>
              </button>

              <button
                type="button"
                className={`tch-sess-pill ${activeSessionalNum === 3 ? "active s3" : ""}`}
                onClick={() => setActiveSessionalNum(3)}
              >
                <span className="pill-dot s3" />
                <span>Sessional 3 (Pre-End Term)</span>
              </button>
            </div>

            <div className="tch-sess-actions">
              <button
                type="button"
                className="tch-btn-primary"
                onClick={handleBulkSave}
                disabled={savingBatch || loadingStudents || rows.length === 0}
              >
                {savingBatch ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Saving to MongoDB...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Sessional {activeSessionalNum} Marks (Bulk)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Filter, Search & Sort Toolbar */}
          <div className="tch-spreadsheet-toolbar-modern no-print">
            <div className="tch-search-input-wrap">
              <Search size={16} className="tch-search-icon" />
              <input
                type="text"
                placeholder="Search candidate name or enrollment number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tch-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="tch-search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="tch-filter-group">
              <label>Filter:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="tch-select-filter"
              >
                <option value="all">All Candidates ({rows.length})</option>
                <option value="entered">Marks Entered ({liveKpis.enteredCount})</option>
                <option value="pending">Pending Entry ({liveKpis.pendingCount})</option>
                <option value="distinction">Distinction (≥75%)</option>
                <option value="remedial">Remedial (&lt;40%)</option>
              </select>
            </div>

            <div className="tch-filter-group">
              <label>Sort:</label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="tch-select-filter"
              >
                <option value="default">Default Order</option>
                <option value="enrollment">Enrollment No (Asc)</option>
                <option value="name">Candidate Name (A-Z)</option>
                <option value="score_desc">Score (High to Low)</option>
                <option value="score_asc">Score (Low to High)</option>
                <option value="pct_desc">Percentage (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Spreadsheet Table */}
          <div className="tch-spreadsheet-card">
            {loadingStudents ? (
              <div className="tch-loading-state">
                <Loader2 size={32} className="spin text-blue" />
                <p>Loading candidate roster and Sessional {activeSessionalNum} scores...</p>
              </div>
            ) : processedRows.length === 0 ? (
              <div className="tch-empty-state">
                <Users size={38} color="#94a3b8" />
                <h4>No Matching Candidates Found</h4>
                <p>
                  {searchQuery || statusFilter !== "all"
                    ? "No candidate matches your search or filter criteria."
                    : `No student profiles registered for ${selectedBranch} ${selectedSemester}.`}
                </p>
              </div>
            ) : (
              <div className="tch-table-scroll-wrapper">
                <table className="tch-marks-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }} className="text-center">S.No.</th>
                      <th style={{ width: 150 }}>Enrollment No</th>
                      <th>Candidate Name</th>
                      <th style={{ width: 120 }} className="text-center">Max Marks</th>
                      <th style={{ width: 170 }}>Marks Obtained</th>
                      <th style={{ width: 110 }} className="text-center">Percentage</th>
                      <th style={{ width: 120 }} className="text-center">Status</th>
                      <th style={{ width: 110 }} className="text-center">Save Row</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedRows.map((row, idx) => {
                      const v = getRowValidation(row);
                      const isSavingThis = savingRowId === row.studentId;

                      return (
                        <tr
                          key={row.studentId || idx}
                          className={v.error ? "row-error" : row.isModified ? "row-modified" : ""}
                        >
                          <td className="text-center font-mono text-muted">{idx + 1}</td>
                          <td className="font-mono font-semibold text-primary">{row.enrollmentNo}</td>
                          <td>
                            <div className="tch-candidate-name-col">
                              <span className="font-semibold text-primary-dark">{row.fullName}</span>
                            </div>
                          </td>
                          <td className="text-center font-bold text-muted font-mono">
                            {row.maxMarks}
                          </td>
                          <td>
                            <div className="tch-input-wrap">
                              <input
                                type="number"
                                min="0"
                                max={row.maxMarks}
                                step="0.5"
                                placeholder={`0 - ${row.maxMarks}`}
                                value={row.marksObtained}
                                onChange={(e) => {
                                  // Locate actual index in original rows
                                  const origIdx = rows.findIndex((r) => r.studentId === row.studentId);
                                  if (origIdx !== -1) {
                                    handleScoreChange(origIdx, e.target.value);
                                  }
                                }}
                                className={`tch-score-input ${v.error ? "has-error" : v.isFilled ? "has-value" : ""}`}
                              />
                              <span className="tch-max-slash">/ {row.maxMarks}</span>
                            </div>
                            {v.error && <span className="tch-error-hint">{v.error}</span>}
                          </td>
                          <td className="text-center">
                            {v.pct !== null ? (
                              <span
                                className={`tch-pct-badge ${
                                  v.pct >= 75 ? "dist" : v.pct < 40 ? "fail" : "pass"
                                }`}
                              >
                                {v.pct}%
                              </span>
                            ) : (
                              <span className="text-muted text-xs">—</span>
                            )}
                          </td>
                          <td className="text-center">
                            {row.isModified ? (
                              <span className="tch-status-tag modified">Unsaved</span>
                            ) : row.isSaved ? (
                              <span className="tch-status-tag saved">
                                <Check size={12} />
                                <span>Saved</span>
                              </span>
                            ) : (
                              <span className="tch-status-tag pending">New</span>
                            )}
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="tch-btn-row-save"
                              disabled={isSavingThis || !row.isModified || !v.isFilled || !v.isValid}
                              onClick={() => {
                                const origIdx = rows.findIndex((r) => r.studentId === row.studentId);
                                if (origIdx !== -1) {
                                  handleSaveIndividualRow(row, origIdx);
                                }
                              }}
                              title="Save individual candidate score"
                            >
                              {isSavingThis ? (
                                <Loader2 size={13} className="spin" />
                              ) : (
                                <Save size={13} />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ACADEMIC ANALYTICS & CHARTS
          ========================================================================= */}
      {activeTab === "analytics" && (
        <div className="tch-analytics-workspace">
          {loadingAnalytics ? (
            <div className="tch-loading-state">
              <Loader2 size={32} className="spin text-blue" />
              <p>Analyzing class performance metrics from MongoDB...</p>
            </div>
          ) : (
            <div className="tch-charts-grid">
              {/* Chart A: Class Performance Distribution */}
              <div className="tch-chart-card span-two">
                <div className="tch-chart-card-header">
                  <div>
                    <h4>Class Performance Distribution</h4>
                    <p>Candidate score breakdown across academic grade bands for {selectedSubject} (Sessional {activeSessionalNum})</p>
                  </div>
                  <span className="tch-chart-tag blue">Real Class Cohort</span>
                </div>

                <div className="tch-chart-content">
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distributionChartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                        <XAxis dataKey="range" tick={{ fontSize: 12, fill: "var(--tch-text-secondary)" }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--tch-text-secondary)" }} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="tch-custom-tooltip">
                                  <strong>{data.label}</strong>
                                  <div>Range: {data.range}</div>
                                  <div>Candidates: <strong>{data.count}</strong></div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {distributionChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="tch-band-legends">
                    {distributionChartData.map((b) => (
                      <div key={b.range} className="band-legend-item">
                        <span className="band-dot" style={{ background: b.color }} />
                        <span className="band-label">{b.label} ({b.range}): <strong>{b.count}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart B: Sessional Performance Comparison */}
              <div className="tch-chart-card">
                <div className="tch-chart-card-header">
                  <div>
                    <h4>Sessional Performance Comparison</h4>
                    <p>Class average percentage progression across S1, S2, and S3 for {selectedSubjectCode}</p>
                  </div>
                  <span className="tch-chart-tag emerald">Multi-Term</span>
                </div>

                <div className="tch-chart-content">
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sessionalComparisonData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
                        <defs>
                          <linearGradient id="sessionalGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--tch-text-secondary)" }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--tch-text-secondary)" }} unit="%" />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="tch-custom-tooltip">
                                  <strong>{d.name} ({d.term})</strong>
                                  <div>Class Avg: <strong>{d.avgPct}%</strong></div>
                                  <div>Candidates Graded: {d.entered}</div>
                                  <div>Max Ceiling: {d.max}M</div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area type="monotone" dataKey="avgPct" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#sessionalGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="tch-sess-comp-summary">
                    {sessionalComparisonData.map((s, idx) => (
                      <div key={s.name} className="sess-comp-box">
                        <span className="sess-box-term">{s.name}</span>
                        <span className="sess-box-avg">{s.avgPct}%</span>
                        <span className="sess-box-meta">{s.entered} graded ({s.max}M)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart C: Subject Performance Across Curriculum */}
              {subjectPerformanceData.length > 0 && (
                <div className="tch-chart-card span-two">
                  <div className="tch-chart-card-header">
                    <div>
                      <h4>Curriculum Subject Performance</h4>
                      <p>Class average percentages across all semester curriculum subjects</p>
                    </div>
                    <span className="tch-chart-tag violet">{selectedSemester}</span>
                  </div>

                  <div className="tch-chart-content">
                    <div style={{ width: "100%", height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectPerformanceData} margin={{ top: 10, right: 20, left: -10, bottom: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                          <XAxis dataKey="shortName" tick={{ fontSize: 11, fill: "var(--tch-text-secondary)" }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--tch-text-secondary)" }} unit="%" />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                  <div className="tch-custom-tooltip">
                                    <strong>{d.subjectCode}: {d.subjectName}</strong>
                                    <div>Class Average: <strong>{d.avgPct}%</strong></div>
                                    <div>Candidates Graded: {d.enteredCount}</div>
                                    <div>Max Marks: {d.maxMarks}M</div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="avgPct" fill="#8B5CF6" radius={[6, 6, 0, 0]}>
                            {subjectPerformanceData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.subjectCode === selectedSubjectCode ? "#2563EB" : "#8B5CF6"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart D: Top Performance Leaderboard */}
              <div className="tch-chart-card">
                <div className="tch-chart-card-header">
                  <div>
                    <h4>Top Performing Candidates</h4>
                    <p>Highest-achieving students in {selectedSubjectCode} (Sessional {activeSessionalNum})</p>
                  </div>
                  <Trophy size={18} color="#F59E0B" />
                </div>

                <div className="tch-chart-content">
                  {topPerformersList.length === 0 ? (
                    <div className="tch-empty-mini">No scores entered yet</div>
                  ) : (
                    <div className="tch-top-performers-list">
                      {topPerformersList.map((top) => (
                        <div key={top.rank} className="top-performer-item">
                          <div className={`top-rank-badge rank-${top.rank}`}>
                            {top.rank === 1 ? "🥇" : top.rank === 2 ? "🥈" : top.rank === 3 ? "🥉" : `#${top.rank}`}
                          </div>
                          <div className="top-student-meta">
                            <span className="top-student-name">{top.fullName}</span>
                            <span className="top-student-enrollment font-mono">{top.enrollmentNo}</span>
                          </div>
                          <div className="top-score-box">
                            <span className="top-score-val font-mono">{top.marksObtained} / {top.maxMarks}</span>
                            <span className="top-score-pct">{top.percentage}% ({top.grade})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Chart E: Best of Three Analytics */}
              <div className="tch-chart-card">
                <div className="tch-chart-card-header">
                  <div>
                    <h4>Best-of-Three Analytics & Improvement</h4>
                    <p>Highest-scoring term distribution and candidate academic improvement rate</p>
                  </div>
                  <Sparkles size={18} color="#10B981" />
                </div>

                <div className="tch-chart-content">
                  {analyticsData?.bestOfThreeAnalytics ? (
                    <div className="tch-best-analytics-block">
                      <div className="tch-improvement-kpi-box">
                        <div className="improvement-val-col">
                          <span className="imp-val text-emerald">
                            +{analyticsData.bestOfThreeAnalytics.improvementRate}%
                          </span>
                          <span className="imp-lbl">Cohort Improvement Rate</span>
                        </div>
                        <p className="imp-note">
                          {analyticsData.bestOfThreeAnalytics.improvedCount} of {analyticsData.bestOfThreeAnalytics.multiAttemptCount} candidates with multiple sessional attempts showed a positive score increase.
                        </p>
                      </div>

                      <div className="tch-contribution-bars">
                        <span className="contrib-title">Sessional Contribution to Best Score:</span>
                        {analyticsData.bestOfThreeAnalytics.contribution.map((c) => (
                          <div key={c.name} className="contrib-item">
                            <div className="contrib-header">
                              <span>{c.name}</span>
                              <strong>{c.pct}% ({c.count} students)</strong>
                            </div>
                            <div className="contrib-bar-wrap">
                              <div
                                className="contrib-bar"
                                style={{ width: `${c.pct}%`, background: c.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="tch-empty-mini">Awaiting candidate scores</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: THREE-SESSIONAL COHORT LEDGER (BEST-OF-THREE MATRIX)
          ========================================================================= */}
      {activeTab === "bestOfThree" && (
        <div className="tch-matrix-workspace">
          <div className="tch-matrix-header no-print">
            <div>
              <h3>Cohort Best-of-Three Internal Examination Ledger</h3>
              <p>
                Automatic comparison across Sessional 1, Sessional 2, and Sessional 3 for <strong>{selectedSubject}</strong> ({selectedSubjectCode}).
              </p>
            </div>
            <button
              type="button"
              className="tch-btn-primary"
              onClick={() => window.print()}
            >
              <Printer size={15} />
              <span>Print Cohort Ledger</span>
            </button>
          </div>

          <div className="tch-matrix-card">
            {loadingMatrix ? (
              <div className="tch-loading-state">
                <Loader2 size={32} className="spin text-blue" />
                <p>Computing Best-of-Three scores across candidate attempts...</p>
              </div>
            ) : cohortMatrix.length === 0 ? (
              <div className="tch-empty-state">
                <Users size={38} color="#94a3b8" />
                <h4>No Data Available</h4>
                <p>Enter and save marks in Sessional 1, 2, or 3 to view the cohort comparison matrix.</p>
              </div>
            ) : (
              <div className="tch-table-scroll-wrapper">
                <table className="tch-matrix-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }} className="text-center">S.No.</th>
                      <th>Candidate Name</th>
                      <th>Enrollment No</th>
                      <th className="text-center">Sessional 1</th>
                      <th className="text-center">Sessional 2</th>
                      <th className="text-center">Sessional 3</th>
                      <th className="text-center highlight-best">Best Score</th>
                      <th>Selected Sessional</th>
                      <th className="text-center">Improvement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohortMatrix.map((item, i) => (
                      <tr key={item.studentId || i}>
                        <td className="text-center text-muted font-mono">{i + 1}</td>
                        <td className="font-semibold">{item.fullName}</td>
                        <td className="font-mono text-muted">{item.enrollmentNo}</td>
                        <td className="text-center font-mono">
                          {item.s1 !== null ? (
                            <strong>{item.s1} / {item.s1Max}</strong>
                          ) : (
                            <span className="text-muted text-xs">Not Entered</span>
                          )}
                        </td>
                        <td className="text-center font-mono">
                          {item.s2 !== null ? (
                            <strong>{item.s2} / {item.s2Max}</strong>
                          ) : (
                            <span className="text-muted text-xs">Not Entered</span>
                          )}
                        </td>
                        <td className="text-center font-mono">
                          {item.s3 !== null ? (
                            <strong>{item.s3} / {item.s3Max}</strong>
                          ) : (
                            <span className="text-muted text-xs">Not Entered</span>
                          )}
                        </td>
                        <td className="text-center highlight-best font-mono font-bold">
                          {item.best !== null ? (
                            <span className="tch-best-pill">
                              {item.best} / {item.bestMax}
                            </span>
                          ) : (
                            <span className="text-muted text-xs">Pending</span>
                          )}
                        </td>
                        <td>
                          <span className="tch-selected-tag">
                            {item.selectedFrom}
                          </span>
                        </td>
                        <td className="text-center">
                          {item.improvementDiff !== null ? (
                            <span
                              className={`tch-imp-badge ${
                                item.improvementDiff > 0
                                  ? "positive"
                                  : item.improvementDiff < 0
                                  ? "negative"
                                  : "neutral"
                              }`}
                            >
                              {item.improvementDiff > 0 ? (
                                <>
                                  <TrendingUp size={12} />
                                  <span>+{item.improvementDiff}%</span>
                                </>
                              ) : item.improvementDiff < 0 ? (
                                <>
                                  <TrendingDown size={12} />
                                  <span>{item.improvementDiff}%</span>
                                </>
                              ) : (
                                <span>0.0%</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────── 6. EXCEEDING MARKS CONFIRMATION MODAL ───────────── */}
      {confirmModalData && (
        <div className="tch-modal-backdrop">
          <div className="tch-modal-dialog">
            <div className="tch-modal-header">
              <div className="modal-title-lockup">
                <AlertTriangle size={22} color="#DC2626" />
                <h3>Confirm Exam Maximum Marks Change</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setConfirmModalData(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="tch-modal-body">
              <p className="modal-lead-warning">
                <strong>{confirmModalData.exceedingCount} candidate(s)</strong> currently have recorded scores higher than the proposed maximum of <strong>{confirmModalData.proposedMax} Marks</strong>.
              </p>
              <div className="modal-info-box">
                <div>Highest recorded score in database: <strong>{confirmModalData.highestScore} Marks</strong></div>
                <div>Proposed new maximum ceiling: <strong>{confirmModalData.proposedMax} Marks</strong></div>
              </div>
              <p className="modal-disclaimer">
                Applying this new ceiling will safely update candidate records and synchronize the evaluation basis. Do you wish to confirm and apply this change?
              </p>
            </div>

            <div className="tch-modal-footer">
              <button
                type="button"
                className="tch-btn-secondary"
                onClick={() => setConfirmModalData(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tch-btn-danger"
                onClick={() => handleSaveExamMaxMarks(true)}
              >
                Confirm & Apply New Maximum
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
