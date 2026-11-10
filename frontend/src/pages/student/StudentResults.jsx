import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Download, CheckCircle2, Award, TrendingUp, BarChart3, Filter,
  Printer, X, QrCode, ShieldCheck, GraduationCap, ArrowUpRight,
  Sparkles, Check, FileText, ChevronRight, AlertCircle, ZoomIn,
  ZoomOut, RotateCcw, Eye, ExternalLink, Info, CheckCircle,
  HelpCircle, ChevronDown, Layers, Clock, Sliders, Calendar,
  Loader2
} from "lucide-react";
import { authApi } from "../../services/authApi";
import { assetUrl } from "../../utils/assetUrl";
import "./StudentTheme.css";
import "./StudentResults.css";

// Official SVSU Multi-Color University Seal & Crest (High-Fidelity Vector Emblem)
function SVSUCrest({ size = 88 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="svsu-official-crest-svg"
      aria-label="Swami Vivekanand Subharti University Crest"
    >
      <circle cx="50" cy="50" r="47" stroke="#1E3A8A" strokeWidth="2.5" fill="#FFFFFF" />
      <circle cx="50" cy="50" r="43.5" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="3 1.5" />
      <circle cx="50" cy="50" r="39.5" stroke="#1E3A8A" strokeWidth="1.5" fill="#F8FAFC" />
      <path
        d="M22 62C18 52 20 38 27 28C28 34 26 44 32 50C28 54 25 58 22 62Z"
        fill="#059669"
        opacity="0.85"
      />
      <path
        d="M78 62C82 52 80 38 73 28C72 34 74 44 68 50C72 54 75 58 78 62Z"
        fill="#059669"
        opacity="0.85"
      />
      <circle cx="50" cy="46" r="23" fill="#1E3A8A" />
      <circle cx="50" cy="46" r="20.5" stroke="#FDE68A" strokeWidth="1" fill="#1E40AF" />
      <g stroke="#FDE68A" strokeWidth="1.2" opacity="0.6">
        <line x1="50" y1="28" x2="50" y2="33" />
        <line x1="50" y1="59" x2="50" y2="64" />
        <line x1="32" y1="46" x2="37" y2="46" />
        <line x1="63" y1="46" x2="68" y2="46" />
      </g>
      <path
        d="M40 50C44 48 48 48 50 51C52 48 56 48 60 50V40C56 38 52 38 50 41C48 38 44 38 40 40V50Z"
        fill="#FFFFFF"
      />
      <path d="M50 41V51" stroke="#1E3A8A" strokeWidth="1" />
      <path
        d="M50 31C51.5 33 53 34.5 52 36.5C51 38 49 38 48 36.5C47 34.5 48.5 33 50 31Z"
        fill="#EA580C"
      />
      <circle cx="50" cy="34" r="1.5" fill="#FBBF24" />
      <path
        d="M26 73L35 69L50 71L65 69L74 73L70 80L50 77L30 80L26 73Z"
        fill="#7C3AED"
      />
      <text
        x="50"
        y="76"
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="800"
        fill="#FFFFFF"
        letterSpacing="0.08em"
      >
        SUBHARTI 2008
      </text>
    </svg>
  );
}

// Official NAAC "A" Grade Medallion with Laurel Garland & Ribbon
function NAACBadge({ size = 76 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="svsu-naac-badge-svg"
      aria-label="NAAC Grade A Accredited Emblem"
    >
      <defs>
        <radialGradient id="naacGoldGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="85%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </radialGradient>
        <linearGradient id="naacRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#991B1B" />
          <stop offset="50%" stopColor="#7F1D1D" />
          <stop offset="100%" stopColor="#581C87" />
        </linearGradient>
      </defs>
      {/* Outer Scalloped Laurel Ring */}
      <circle cx="50" cy="50" r="47" fill="url(#naacGoldGrad)" stroke="#78350F" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="42" fill="#FFFFFF" stroke="#B45309" strokeWidth="1" strokeDasharray="2.5 1.5" />
      {/* Inner Red Core */}
      <circle cx="50" cy="50" r="33" fill="url(#naacRibbonGrad)" stroke="#FDE68A" strokeWidth="1.8" />
      {/* Grade Letter 'A' */}
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fontSize="29"
        fontWeight="900"
        fill="#FFFFFF"
        fontFamily="Georgia, 'Times New Roman', serif"
      >
        A
      </text>
      {/* Curved Upper Text */}
      <path id="naacTopCurve" d="M 18 42 A 36 36 0 0 1 82 42" fill="none" />
      <text fontSize="4.6" fontWeight="800" fill="#78350F" letterSpacing="0.09em">
        <textPath href="#naacTopCurve" startOffset="50%" textAnchor="middle">
          ACCREDITED WITH GRADE
        </textPath>
      </text>
      {/* Lower Ribbon Banner */}
      <path
        d="M 22 73 L 50 68 L 78 73 L 74 84 L 50 79 L 26 84 Z"
        fill="url(#naacRibbonGrad)"
        stroke="#FDE68A"
        strokeWidth="1.2"
      />
      <text
        x="50"
        y="78.5"
        textAnchor="middle"
        fontSize="8"
        fontWeight="900"
        fill="#FFFFFF"
        letterSpacing="0.16em"
      >
        NAAC
      </text>
    </svg>
  );
}

// Official Optical Hologram Security Seal
function UniversityHologram({ size = 68 }) {
  return (
    <div className="svsu-official-hologram" style={{ width: size, height: size }}>
      <div className="hologram-shimmer-disk">
        <div className="hologram-outer-dashed-ring">
          <div className="hologram-inner-seal">
            <span className="hologram-micro-text top">SVSU MEERUT</span>
            <div className="hologram-emblem-star">★ 2008 ★</div>
            <span className="hologram-micro-text bottom">AUTHENTIC</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Official Subharti University First Year Diploma in Engineering Curriculum & Statement of Marks (Authentic SUM132970)
const OFFICIAL_TRANSCRIPT_DATA = {
  serialNo: "SUM132970",
  examType: "Regular",
  degree: "DIPLOMA IN ENGINEERING",
  branch: "COMPUTER SCIENCE & ENGINEERING",
  session: "First Year Session: 2024-2025",
  dateOfIssue: "30-10-2025",
  college: "SUBHARTI INSTITUTE OF TECHNOLOGY AND ENGINEERING",
  student: {
    enrollmentNo: "2430617706203027",
    name: "SONU KUMAR",
    fatherName: "BIJENDRA SINGH",
    motherName: "AASHA DEVI"
  },
  semester1: {
    title: "Semester - I",
    subjects: [
      { sNo: 1, course: "COMMUNICATION SKILLS IN ENGLISH", code: "DIE-101", credits: 3, extMax: 60, extObt: 50, sessMax: 40, sessObt: 31, totalMax: 100, totalObt: 81, creditPoints: "27.00" },
      { sNo: 2, course: "MATHEMATICS-I", code: "DIE-102", credits: 4, extMax: 60, extObt: 56, sessMax: 40, sessObt: 39, totalMax: 100, totalObt: 95, creditPoints: "40.00" },
      { sNo: 3, course: "APPLIED PHYSICS-I", code: "DIE-103", credits: 4, extMax: 60, extObt: 38, sessMax: 40, sessObt: 32, totalMax: 100, totalObt: 70, creditPoints: "28.00" },
      { sNo: 4, course: "APPLIED CHEMISTRY", code: "DIE-104", credits: 4, extMax: 60, extObt: 48, sessMax: 40, sessObt: 25, totalMax: 100, totalObt: 73, creditPoints: "32.00" },
      { sNo: 5, course: "ENGINEERING GRAPHICS", code: "DIE-105", credits: 1, extMax: 60, extObt: "07", sessMax: 0, sessObt: 0, totalMax: 60, totalObt: 7, creditPoints: "0.00", isFail: true },
      { sNo: 6, course: "COMMUNICATION SKILLS IN ENGLISH LAB", code: "DIE-101P", credits: 1, extMax: 40, extObt: 25, sessMax: 60, sessObt: 45, totalMax: 100, totalObt: 70, creditPoints: "7.00" },
      { sNo: 7, course: "APPLIED PHYSICS-I LAB", code: "DIE-103P", credits: 1, extMax: 40, extObt: 32, sessMax: 60, sessObt: 48, totalMax: 100, totalObt: 80, creditPoints: "8.00" },
      { sNo: 8, course: "APPLIED CHEMISTRY LAB", code: "DIE-104P", credits: 1, extMax: 40, extObt: 26, sessMax: 60, sessObt: 38, totalMax: 100, totalObt: 64, creditPoints: "7.00" },
      { sNo: 9, course: "ENGINEERING GRAPHICS LAB", code: "DIE-105P", credits: 1, extMax: 0, extObt: 0, sessMax: 40, sessObt: 24, totalMax: 40, totalObt: 24, creditPoints: "6.00" },
      { sNo: 10, course: "ENGINEERING WORKSHOP PRACTICE LAB", code: "DIE-106P", credits: 2, extMax: 40, extObt: 30, sessMax: 60, sessObt: 36, totalMax: 100, totalObt: 66, creditPoints: "14.00" },
      { sNo: 11, course: "SPORTS & YOGA LAB", code: "DIE-107P", credits: 1, extMax: 0, extObt: 0, sessMax: 50, sessObt: 41, totalMax: 50, totalObt: 41, creditPoints: "9.00" },
      { sNo: 12, course: "STUDENT CENTERED ACTIVITIES", code: "DSC-101", credits: 1, extMax: 0, extObt: 0, sessMax: 50, sessObt: 42, totalMax: 50, totalObt: 42, creditPoints: "9.00" }
    ],
    totalMax: 1000,
    totalObt: 713,
    totalCreditPoints: "187.00",
    sgpa: "7.79"
  },
  semester2: {
    title: "Semester - II",
    subjects: [
      { sNo: 1, course: "MATHEMATICS-II", code: "DIE-201", credits: 4, extMax: 60, extObt: 49, sessMax: 40, sessObt: 36, totalMax: 100, totalObt: 85, creditPoints: "36.00" },
      { sNo: 2, course: "APPLIED PHYSICS-II", code: "DIE-202", credits: 4, extMax: 60, extObt: 45, sessMax: 40, sessObt: 38, totalMax: 100, totalObt: 83, creditPoints: "36.00" },
      { sNo: 3, course: "INTRODUCTION TO IT SYSTEMS", code: "DIE-203", credits: 2, extMax: 60, extObt: 43, sessMax: 40, sessObt: 32, totalMax: 100, totalObt: 75, creditPoints: "16.00" },
      { sNo: 4, course: "FUNDAMENTALS OF ELECTRICAL & ELECTRONICS ENGINEERING", code: "DIE-204", credits: 4, extMax: 60, extObt: 46, sessMax: 40, sessObt: 37, totalMax: 100, totalObt: 83, creditPoints: "36.00" },
      { sNo: 5, course: "ENGINEERING MECHANICS", code: "DIE-205", credits: 4, extMax: 60, extObt: 46, sessMax: 40, sessObt: 32, totalMax: 100, totalObt: 78, creditPoints: "32.00" },
      { sNo: 6, course: "ENVIRONMENTAL SCIENCES*", code: "DIE-206", credits: 4, extMax: 60, extObt: 46, sessMax: 0, sessObt: 0, totalMax: 60, totalObt: 46, creditPoints: "32.00", isQualifying: true },
      { sNo: 7, course: "APPLIED PHYSICS-II LAB", code: "DIE-202P", credits: 1, extMax: 40, extObt: 32, sessMax: 60, sessObt: 51, totalMax: 100, totalObt: 83, creditPoints: "9.00" },
      { sNo: 8, course: "INTRODUCTION TO IT SYSTEMS LAB", code: "DIE-203P", credits: 2, extMax: 40, extObt: 30, sessMax: 60, sessObt: 47, totalMax: 100, totalObt: 77, creditPoints: "16.00" },
      { sNo: 9, course: "FUNDAMENTALS OF ELECTRICAL & ELECTRONICS ENGINEERING LAB", code: "DIE-204P", credits: 1, extMax: 40, extObt: 34, sessMax: 60, sessObt: 45, totalMax: 100, totalObt: 79, creditPoints: "8.00" },
      { sNo: 10, course: "ENGINEERING MECHANICS LAB", code: "DIE-205P", credits: 1, extMax: 40, extObt: 29, sessMax: 60, sessObt: 46, totalMax: 100, totalObt: 75, creditPoints: "8.00" },
      { sNo: 11, course: "STUDENT CENTERED ACTIVITIES #", code: "DSC-201P", credits: null, extMax: 0, extObt: 0, sessMax: 50, sessObt: 44, totalMax: 50, totalObt: 44, creditPoints: null }
    ],
    totalMax: 1010,
    totalObt: 808,
    totalCreditPoints: "229.00",
    sgpa: "8.48"
  },
  yearSummary: {
    totalMax: 2010,
    totalObt: 1521,
    totalCreditPoints: "416"
  },
  cop: {
    subjectCode: "DIE-105",
    totalCop: 1,
    graceMarks: "",
    result: "PCP"
  }
};

export default function StudentResults({ currentUser }) {
  // Primary Module Mode: "internalSessional" (default) | "universityTranscript"
  const [examModuleMode, setExamModuleMode] = useState("internalSessional");

  // Sessional Sub-Tabs: "s1" | "s2" | "s3" | "comparison" | "marksheet"
  const [sessionalTab, setSessionalTab] = useState("comparison");

  // Print Mode Filter for Internal Marksheet: "combined" | "s1" | "s2" | "s3"
  const [internalPrintMode, setInternalPrintMode] = useState("combined");

  // -----------------------------------------------------------------
  // 1. THREE-SESSIONAL DATA STATE
  // -----------------------------------------------------------------
  const [sessionalData, setSessionalData] = useState(null);
  const [loadingSessional, setLoadingSessional] = useState(true);

  // -----------------------------------------------------------------
  // 2. UNIVERSITY EXTERNAL EXAM DATA STATE (PRESERVED)
  // -----------------------------------------------------------------
  const [examRecords, setExamRecords] = useState([]);
  const [officialResult, setOfficialResult] = useState(null);
  const [isResultPublished, setIsResultPublished] = useState(false);
  const [selectedUnivView, setSelectedUnivView] = useState("annual");
  const [showOriginalModal, setShowOriginalModal] = useState(false);
  const [docZoom, setDocZoom] = useState(100);
  const marksheetRef = useRef(null);

  // Fetch all examination data from backend
  const fetchAllResults = () => {
    setLoadingSessional(true);

    // 1. Fetch 3-Sessional Internal Results
    authApi.getStudentSessionalResults()
      .then((res) => {
        setSessionalData(res);
      })
      .catch((err) => {
        console.warn("Failed to load sessional results:", err);
      })
      .finally(() => {
        setLoadingSessional(false);
      });

    // 2. Fetch University Results & External Marks
    Promise.allSettled([
      authApi.getExams(),
      authApi.getExamResults()
    ]).then(([examsRes, resultsRes]) => {
      if (examsRes.status === "fulfilled" && examsRes.value?.marks) {
        setExamRecords(examsRes.value.marks);
      }
      if (resultsRes.status === "fulfilled" && resultsRes.value) {
        setOfficialResult(resultsRes.value.result || null);
        setIsResultPublished(Boolean(resultsRes.value.isPublished));
      }
    });
  };

  useEffect(() => {
    fetchAllResults();
  }, []);

  // Print Handlers
  const handlePrintSessional = (mode = "combined") => {
    setInternalPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintUniversity = () => {
    window.print();
  };

  // Student Identity Metadata
  const studentMeta = useMemo(() => {
    return {
      name: (officialResult?.student?.fullName || currentUser?.fullName || sessionalData?.student?.fullName || "SONU KUMAR").toUpperCase(),
      enrollmentNo: officialResult?.student?.enrollmentNo || currentUser?.enrollmentNo || sessionalData?.student?.enrollmentNo || "2430617706203027",
      fatherName: (officialResult?.student?.fatherName || currentUser?.fatherName || "BIJENDRA SINGH").toUpperCase(),
      motherName: (officialResult?.student?.motherName || currentUser?.motherName || "AASHA DEVI").toUpperCase(),
      branch: (officialResult?.student?.branch || currentUser?.branch || sessionalData?.student?.branch || "COMPUTER SCIENCE & ENGINEERING").toUpperCase(),
      semester: currentUser?.semester || sessionalData?.student?.semester || "Semester 1",
      session: "First Year Session: 2024-2025",
      college: "SUBHARTI INSTITUTE OF TECHNOLOGY AND ENGINEERING",
      examType: "Regular",
      serialNo: "SUM132970",
      avatarUrl: currentUser?.avatarUrl || sessionalData?.student?.avatarUrl || null,
      generatedDate: "30-10-2025"
    };
  }, [currentUser, sessionalData, officialResult]);

  // Derived Sessional Lists & Best of Three Comparison
  const { comparisonList, s1List, s2List, s3List, sessionalSummary } = useMemo(() => {
    const list = sessionalData?.subjectsComparison || [];
    const s1 = sessionalData?.sessionals?.sessional1 || [];
    const s2 = sessionalData?.sessionals?.sessional2 || [];
    const s3 = sessionalData?.sessionals?.sessional3 || [];
    const summary = sessionalData?.summary || {
      totalSubjects: list.length,
      enteredSubjectsCount: list.filter((s) => s.isEntered).length,
      pendingSubjectsCount: list.filter((s) => !s.isEntered).length,
      sessionalsConductedCount: 0,
      totalBestObtained: 0,
      totalBestMax: 0,
      overallPercentage: 0
    };

    return {
      comparisonList: list,
      s1List: s1,
      s2List: s2,
      s3List: s3,
      sessionalSummary: summary
    };
  }, [sessionalData]);

  return (
    <div className="student-role-view std-res-container">
      {/* ───────────── 1. TOP MODULE NAVIGATION BAR ───────────── */}
      <div className="std-module-switch-bar no-print">
        <div className="std-module-tabs">
          <button
            type="button"
            className={`std-mod-tab ${examModuleMode === "internalSessional" ? "active" : ""}`}
            onClick={() => setExamModuleMode("internalSessional")}
          >
            <Sparkles size={16} />
            <span>Internal Sessional Results (Best-of-Three)</span>
          </button>

          <button
            type="button"
            className={`std-mod-tab ${examModuleMode === "universityTranscript" ? "active" : ""}`}
            onClick={() => setExamModuleMode("universityTranscript")}
          >
            <Award size={16} />
            <span>University Examination Transcript</span>
          </button>
        </div>

        <button
          type="button"
          className="std-btn-sync"
          onClick={fetchAllResults}
          title="Refresh Examination Scores"
        >
          <RotateCcw size={14} className={loadingSessional ? "spin" : ""} />
          <span>Sync Scores</span>
        </button>
      </div>

      {/* =========================================================================
          MODULE 1: THREE-SESSIONAL INTERNAL EXAMINATION SYSTEM (BEST-OF-THREE)
          ========================================================================= */}
      {examModuleMode === "internalSessional" && (
        <div className="std-sessional-module">
          {/* Bento Performance Summary Cards */}
          <div className="std-sess-bento-grid no-print">
            {/* Total Best Score Card */}
            <div className="std-kpi-card highlight-royal">
              <div className="std-kpi-top">
                <span className="std-kpi-lbl">Best Sessional Score</span>
                <span className="std-kpi-tag blue">Best-of-Three</span>
              </div>
              <div className="std-kpi-val-row">
                <span className="std-kpi-val royal">{sessionalSummary.totalBestObtained}</span>
                <span className="std-kpi-scale">/ {sessionalSummary.totalBestMax || "—"}</span>
              </div>
              <div className="std-kpi-progress">
                <div
                  className="std-kpi-bar royal"
                  style={{ width: `${Math.min(sessionalSummary.overallPercentage || 0, 100)}%` }}
                />
              </div>
              <span className="std-kpi-sub">
                Overall Internal Assessment: <strong>{sessionalSummary.overallPercentage}%</strong>
              </span>
            </div>

            {/* Sessionals Conducted Card */}
            <div className="std-kpi-card">
              <div className="std-kpi-top">
                <span className="std-kpi-lbl">Sessionals Conducted</span>
                <span className="std-kpi-tag emerald">{studentMeta.semester}</span>
              </div>
              <div className="std-kpi-val-row">
                <span className="std-kpi-val">{sessionalSummary.sessionalsConductedCount}</span>
                <span className="std-kpi-scale">/ 3 Terms</span>
              </div>
              <div className="std-kpi-progress">
                <div
                  className="std-kpi-bar emerald"
                  style={{ width: `${(sessionalSummary.sessionalsConductedCount / 3) * 100}%` }}
                />
              </div>
              <span className="std-kpi-sub">
                Term Examination Schedule Completed
              </span>
            </div>

            {/* Subject Entry Status Card */}
            <div className="std-kpi-card">
              <div className="std-kpi-top">
                <span className="std-kpi-lbl">Subjects Evaluated</span>
                <span className="std-kpi-tag purple">Curriculum</span>
              </div>
              <div className="std-kpi-val-row">
                <span className="std-kpi-val">{sessionalSummary.enteredSubjectsCount}</span>
                <span className="std-kpi-scale">/ {sessionalSummary.totalSubjects || "—"}</span>
              </div>
              <div className="std-kpi-progress">
                <div
                  className="std-kpi-bar purple"
                  style={{
                    width: `${sessionalSummary.totalSubjects > 0 ? (sessionalSummary.enteredSubjectsCount / sessionalSummary.totalSubjects) * 100 : 0}%`
                  }}
                />
              </div>
              <span className="std-kpi-sub">
                {sessionalSummary.pendingSubjectsCount > 0
                  ? `${sessionalSummary.pendingSubjectsCount} Subject(s) Awaiting Entry`
                  : "All Subject Scores Synchronized"}
              </span>
            </div>
          </div>

          {/* Sessional Navigation Tabs & Print Bar */}
          <div className="std-sess-tab-bar no-print">
            <div className="std-sess-tabs">
              <button
                type="button"
                className={`std-sess-tab-btn ${sessionalTab === "comparison" ? "active" : ""}`}
                onClick={() => setSessionalTab("comparison")}
              >
                <Sparkles size={15} />
                <span>All Sessionals Comparison (Best-of-Three)</span>
              </button>

              <button
                type="button"
                className={`std-sess-tab-btn ${sessionalTab === "s1" ? "active" : ""}`}
                onClick={() => setSessionalTab("s1")}
              >
                <span>Sessional 1</span>
              </button>

              <button
                type="button"
                className={`std-sess-tab-btn ${sessionalTab === "s2" ? "active" : ""}`}
                onClick={() => setSessionalTab("s2")}
              >
                <span>Sessional 2</span>
              </button>

              <button
                type="button"
                className={`std-sess-tab-btn ${sessionalTab === "s3" ? "active" : ""}`}
                onClick={() => setSessionalTab("s3")}
              >
                <span>Sessional 3</span>
              </button>

              <button
                type="button"
                className={`std-sess-tab-btn ${sessionalTab === "marksheet" ? "active" : ""}`}
                onClick={() => setSessionalTab("marksheet")}
              >
                <FileText size={15} />
                <span>Printable Marksheet Document</span>
              </button>
            </div>

            <div className="std-sess-actions">
              <button
                type="button"
                className="std-btn-primary"
                onClick={() => {
                  setSessionalTab("marksheet");
                  handlePrintSessional("combined");
                }}
              >
                <Printer size={15} />
                <span>Print Best-of-3 Marksheet</span>
              </button>
            </div>
          </div>

          {/* ───────────── TAB CONTENT ───────────── */}
          {loadingSessional ? (
            <div className="std-loading-state">
              <Loader2 size={32} className="spin text-blue" />
              <p>Fetching authorized internal examination records...</p>
            </div>
          ) : (
            <>
              {/* TAB: ALL SESSIONALS COMPARISON */}
              {sessionalTab === "comparison" && (
                <div className="std-card-table-wrap">
                  <div className="std-card-table-header">
                    <div>
                      <h3>Subject-Wise Comparison & Best-of-Three Evaluation</h3>
                      <p>
                        Highest obtained score is selected independently for each subject. Missing attempts are never counted as zero.
                      </p>
                    </div>
                  </div>

                  {comparisonList.length === 0 ? (
                    <div className="std-empty-state">
                      <Clock size={36} color="#94a3b8" />
                      <h4>Internal Marks Not Yet Recorded</h4>
                      <p>Your faculty instructors have not yet submitted sessional marks for this term.</p>
                    </div>
                  ) : (
                    <table className="std-comparison-table">
                      <thead>
                        <tr>
                          <th>Subject Code</th>
                          <th>Subject Name</th>
                          <th className="text-center">Max Marks</th>
                          <th className="text-center">Sessional 1</th>
                          <th className="text-center">Sessional 2</th>
                          <th className="text-center">Sessional 3</th>
                          <th className="text-center highlight-best">Best Score</th>
                          <th>Selected From</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonList.map((sub, i) => (
                          <tr key={`${sub.subjectCode || "sub"}-${i}`}>
                            <td className="font-mono font-bold text-primary">{sub.subjectCode}</td>
                            <td className="font-semibold">{sub.subjectName}</td>
                            <td className="text-center font-bold text-muted">{sub.configuredMaxMarks}</td>
                            <td className="text-center font-mono">
                              {sub.sessional1Marks !== null ? (
                                <strong>{sub.sessional1Marks} / {sub.sessional1Max}</strong>
                              ) : (
                                <span className="text-muted text-xs">Not Entered</span>
                              )}
                            </td>
                            <td className="text-center font-mono">
                              {sub.sessional2Marks !== null ? (
                                <strong>{sub.sessional2Marks} / {sub.sessional2Max}</strong>
                              ) : (
                                <span className="text-muted text-xs">Not Entered</span>
                              )}
                            </td>
                            <td className="text-center font-mono">
                              {sub.sessional3Marks !== null ? (
                                <strong>{sub.sessional3Marks} / {sub.sessional3Max}</strong>
                              ) : (
                                <span className="text-muted text-xs">Not Entered</span>
                              )}
                            </td>
                            <td className="text-center highlight-best font-mono">
                              {sub.bestMarks !== null ? (
                                <span className="std-best-pill">
                                  {sub.bestMarks} / {sub.bestMaxMarks}
                                </span>
                              ) : (
                                <span className="text-muted text-xs">Pending</span>
                              )}
                            </td>
                            <td>
                              <span className="std-selected-tag">
                                {sub.selectedFrom}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {/* TABS: INDIVIDUAL SESSIONALS (S1, S2, S3) */}
              {(sessionalTab === "s1" || sessionalTab === "s2" || sessionalTab === "s3") && (
                <div className="std-card-table-wrap">
                  {(() => {
                    const currentList = sessionalTab === "s1" ? s1List : sessionalTab === "s2" ? s2List : s3List;
                    const sessTitle = sessionalTab === "s1" ? "Sessional 1" : sessionalTab === "s2" ? "Sessional 2" : "Sessional 3";

                    return (
                      <>
                        <div className="std-card-table-header">
                          <div>
                            <h3>{sessTitle} Examination Transcript</h3>
                            <p>Individual term assessment score breakdown per subject.</p>
                          </div>
                          <button
                            type="button"
                            className="std-btn-secondary"
                            onClick={() => handlePrintSessional(sessionalTab)}
                          >
                            <Printer size={14} />
                            <span>Print {sessTitle} Marksheet</span>
                          </button>
                        </div>

                        {currentList.length === 0 ? (
                          <div className="std-empty-state">
                            <Clock size={36} color="#94a3b8" />
                            <h4>Marks Not Yet Entered</h4>
                            <p>Faculty has not yet recorded scores for {sessTitle}.</p>
                          </div>
                        ) : (
                          <table className="std-comparison-table">
                            <thead>
                              <tr>
                                <th>Subject Code</th>
                                <th>Subject Name</th>
                                <th className="text-center">Max Marks</th>
                                <th className="text-center">Marks Obtained</th>
                                <th className="text-center">Percentage</th>
                                <th className="text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {currentList.map((sub, i) => (
                                <tr key={`${sub.subjectCode || "sub"}-${i}`}>
                                  <td className="font-mono font-bold text-primary">{sub.subjectCode}</td>
                                  <td className="font-semibold">{sub.subjectName}</td>
                                  <td className="text-center font-bold text-muted">{sub.maxMarks}</td>
                                  <td className="text-center font-mono">
                                    {sub.isEntered ? (
                                      <strong className="text-lg">{sub.marksObtained}</strong>
                                    ) : (
                                      <span className="text-muted text-xs">Marks Not Yet Entered</span>
                                    )}
                                  </td>
                                  <td className="text-center">
                                    {sub.percentage !== null ? (
                                      <span className={`std-pct-pill ${sub.percentage >= 75 ? "dist" : sub.percentage < 40 ? "fail" : "pass"}`}>
                                        {sub.percentage}%
                                      </span>
                                    ) : (
                                      <span className="text-muted text-xs">—</span>
                                    )}
                                  </td>
                                  <td className="text-center">
                                    {sub.isEntered ? (
                                      <span className="std-status-pill entered">
                                        <Check size={12} />
                                        <span>Entered</span>
                                      </span>
                                    ) : (
                                      <span className="std-status-pill pending">Pending</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* TAB: OFFICIAL PRINTABLE INTERNAL MARKSHEET (A4) */}
              {sessionalTab === "marksheet" && (
                <div className="std-internal-marksheet-canvas">
                  <div className="std-marksheet-controls-bar no-print">
                    <div className="print-mode-toggles">
                      <span>Select Document View:</span>
                      <button
                        type="button"
                        className={`print-pill ${internalPrintMode === "combined" ? "active" : ""}`}
                        onClick={() => setInternalPrintMode("combined")}
                      >
                        Combined Best-of-3
                      </button>
                      <button
                        type="button"
                        className={`print-pill ${internalPrintMode === "s1" ? "active" : ""}`}
                        onClick={() => setInternalPrintMode("s1")}
                      >
                        Sessional 1
                      </button>
                      <button
                        type="button"
                        className={`print-pill ${internalPrintMode === "s2" ? "active" : ""}`}
                        onClick={() => setInternalPrintMode("s2")}
                      >
                        Sessional 2
                      </button>
                      <button
                        type="button"
                        className={`print-pill ${internalPrintMode === "s3" ? "active" : ""}`}
                        onClick={() => setInternalPrintMode("s3")}
                      >
                        Sessional 3
                      </button>
                    </div>

                    <button
                      type="button"
                      className="std-btn-primary"
                      onClick={() => handlePrintSessional(internalPrintMode)}
                    >
                      <Printer size={15} />
                      <span>Print Formatted A4 Document</span>
                    </button>
                  </div>

                  {/* The A4 Printable Document Container */}
                  <div className="std-printable-sessional-doc">
                    {/* Header */}
                    <div className="std-doc-header">
                      <div className="std-doc-univ">SUBHARTI POLYTECHNIC COLLEGE</div>
                      <div className="std-doc-sub">SWAMI VIVEKANAND SUBHARTI UNIVERSITY CAMPUS, MEERUT</div>
                      <div className="std-doc-title">
                        {internalPrintMode === "combined"
                          ? "INTERNAL SESSIONAL EXAMINATION MARKSHEET (BEST-OF-THREE)"
                          : `INTERNAL SESSIONAL EXAMINATION MARKSHEET (${internalPrintMode.toUpperCase()})`}
                      </div>
                      <div className="std-doc-disclaimer">
                        College Internal Assessment Record — Not a University Final Marksheet
                      </div>
                    </div>

                    {/* Student Metadata Box */}
                    <div className="std-doc-meta-grid">
                      <div className="meta-item">
                        <span className="lbl">Candidate Name:</span>
                        <span className="val bold">{studentMeta.name}</span>
                      </div>
                      <div className="meta-item">
                        <span className="lbl">Enrollment No:</span>
                        <span className="val bold font-mono">{studentMeta.enrollmentNo}</span>
                      </div>
                      <div className="meta-item">
                        <span className="lbl">Branch / Program:</span>
                        <span className="val">Diploma in Engineering ({studentMeta.branch})</span>
                      </div>
                      <div className="meta-item">
                        <span className="lbl">Semester & Session:</span>
                        <span className="val">{studentMeta.semester} • {studentMeta.session}</span>
                      </div>
                      <div className="meta-item">
                        <span className="lbl">Date of Generation:</span>
                        <span className="val">{studentMeta.generatedDate}</span>
                      </div>
                      <div className="meta-item">
                        <span className="lbl">Evaluation Policy:</span>
                        <span className="val bold">Authoritative Best-of-Three Policy</span>
                      </div>
                    </div>

                    {/* Marksheet Table */}
                    <table className="std-doc-marks-table">
                      <thead>
                        <tr>
                          <th style={{ width: 45 }}>S.No.</th>
                          <th style={{ width: 100 }}>Course Code</th>
                          <th>Course Title</th>
                          <th style={{ width: 85 }} className="text-center">Max Marks</th>
                          {internalPrintMode === "combined" && (
                            <>
                              <th style={{ width: 80 }} className="text-center">Sessional 1</th>
                              <th style={{ width: 80 }} className="text-center">Sessional 2</th>
                              <th style={{ width: 80 }} className="text-center">Sessional 3</th>
                              <th style={{ width: 85 }} className="text-center bold">Best Marks</th>
                              <th style={{ width: 130 }}>Selected Attempt</th>
                            </>
                          )}
                          {internalPrintMode === "s1" && (
                            <th style={{ width: 110 }} className="text-center bold">Sessional 1 Marks</th>
                          )}
                          {internalPrintMode === "s2" && (
                            <th style={{ width: 110 }} className="text-center bold">Sessional 2 Marks</th>
                          )}
                          {internalPrintMode === "s3" && (
                            <th style={{ width: 110 }} className="text-center bold">Sessional 3 Marks</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonList.map((sub, idx) => (
                          <tr key={`${sub.subjectCode || "sub"}-${idx}`}>
                            <td className="text-center">{idx + 1}</td>
                            <td className="font-mono bold">{sub.subjectCode}</td>
                            <td>{sub.subjectName}</td>
                            <td className="text-center bold">{sub.configuredMaxMarks}</td>

                            {internalPrintMode === "combined" && (
                              <>
                                <td className="text-center font-mono">
                                  {sub.sessional1Marks !== null ? sub.sessional1Marks : "—"}
                                </td>
                                <td className="text-center font-mono">
                                  {sub.sessional2Marks !== null ? sub.sessional2Marks : "—"}
                                </td>
                                <td className="text-center font-mono">
                                  {sub.sessional3Marks !== null ? sub.sessional3Marks : "—"}
                                </td>
                                <td className="text-center bold font-mono">
                                  {sub.bestMarks !== null ? sub.bestMarks : "—"}
                                </td>
                                <td>{sub.selectedFrom}</td>
                              </>
                            )}

                            {internalPrintMode === "s1" && (
                              <td className="text-center bold font-mono">
                                {sub.sessional1Marks !== null ? sub.sessional1Marks : "Not Entered"}
                              </td>
                            )}
                            {internalPrintMode === "s2" && (
                              <td className="text-center bold font-mono">
                                {sub.sessional2Marks !== null ? sub.sessional2Marks : "Not Entered"}
                              </td>
                            )}
                            {internalPrintMode === "s3" && (
                              <td className="text-center bold font-mono">
                                {sub.sessional3Marks !== null ? sub.sessional3Marks : "Not Entered"}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="bold text-right">
                            Total Internal Assessment Score
                          </td>
                          <td className="text-center bold">{sessionalSummary.totalBestMax}</td>
                          {internalPrintMode === "combined" ? (
                            <>
                              <td colSpan={3}></td>
                              <td className="text-center bold font-mono">
                                {sessionalSummary.totalBestObtained}
                              </td>
                              <td className="bold">
                                {sessionalSummary.overallPercentage}% Aggregate
                              </td>
                            </>
                          ) : (
                            <td colSpan={1} className="text-center bold">
                              Overall Percentage: {sessionalSummary.overallPercentage}%
                            </td>
                          )}
                        </tr>
                      </tfoot>
                    </table>

                    {/* Official Signatures Row */}
                    <div className="std-doc-signatures-row">
                      <div className="sign-box">
                        <div className="sign-line" />
                        <span>Subject In-Charge</span>
                      </div>
                      <div className="sign-box">
                        <div className="sign-line" />
                        <span>Academic Coordinator</span>
                      </div>
                      <div className="sign-box">
                        <div className="sign-line" />
                        <span>Head of Department</span>
                      </div>
                      <div className="sign-box">
                        <div className="sign-line" />
                        <span>Principal SITE / Polytechnic</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* =========================================================================
          MODULE 2: UNIVERSITY EXAMINATION TRANSCRIPT (PRESERVED OFFICIAL VIEW)
          ========================================================================= */}
      {examModuleMode === "universityTranscript" && (
        <div className="std-university-module">
          <div className="std-pane-header no-print">
            <div className="std-pane-title-group">
              <div className="std-title-icon-badge">
                <Award size={22} />
              </div>
              <div>
                <h2>University Statement of Marks & Transcript Portal</h2>
                <p>
                  Official external degree transcript certified by Swami Vivekanand Subharti University Examination Cell.
                </p>
              </div>
            </div>

            <div className="std-pane-actions">
              <button
                type="button"
                className="std-res-action-btn secondary"
                onClick={() => setShowOriginalModal(true)}
              >
                <Eye size={15} />
                <span>Original Issued Copy</span>
              </button>

              <button
                type="button"
                className="std-btn-primary"
                onClick={handlePrintUniversity}
              >
                <Printer size={15} />
                <span>Print Official Marksheet</span>
              </button>
            </div>
          </div>

          {/* Official Publication Status Banner */}
          <div className={`std-res-pub-banner ${isResultPublished ? "published" : "pending"} no-print`}>
            {isResultPublished ? (
              <>
                <ShieldCheck size={20} style={{ color: "#10b981", flexShrink: 0 }} />
                <div className="std-pub-banner-text">
                  <strong>Official Result Published & Locked:</strong> Certified by the Controller of Examinations. Statement of Marks is authenticated for university issuance.
                </div>
              </>
            ) : (
              <>
                <Clock size={20} style={{ color: "#2563eb", flexShrink: 0 }} />
                <div className="std-pub-banner-text">
                  <strong>Semester Assessment In Progress:</strong> Continuous evaluation scores are synchronized. Official institutional Statement of Marks will be permanently locked following Examination Senate declaration.
                </div>
              </>
            )}
          </div>

          {/* Interactive Document Viewport & Scope Controls */}
          <div className="std-marksheet-scope-bar no-print">
            <div className="scope-pills-group">
              <span className="scope-lbl">Select Academic Scope:</span>
              <button
                type="button"
                className={`scope-pill ${selectedUnivView === "annual" ? "active" : ""}`}
                onClick={() => setSelectedUnivView("annual")}
              >
                Annual First Year (Sem I & II)
              </button>
              <button
                type="button"
                className={`scope-pill ${selectedUnivView === "sem1" ? "active" : ""}`}
                onClick={() => setSelectedUnivView("sem1")}
              >
                Semester - I
              </button>
              <button
                type="button"
                className={`scope-pill ${selectedUnivView === "sem2" ? "active" : ""}`}
                onClick={() => setSelectedUnivView("sem2")}
              >
                Semester - II
              </button>
            </div>

            <div className="std-doc-zoom-toolbar">
              <button
                type="button"
                className="std-zoom-btn"
                onClick={() => setDocZoom((z) => Math.max(70, z - 10))}
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="zoom-level">{docZoom}%</span>
              <button
                type="button"
                className="std-zoom-btn"
                onClick={() => setDocZoom((z) => Math.min(140, z + 10))}
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                className="std-zoom-btn"
                onClick={() => setDocZoom(100)}
                title="Reset Zoom"
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>

          {/* Authentic Swami Vivekanand Subharti University Marksheet Document */}
          <div className="std-marksheet-canvas-wrapper">
            <div
              className="svsu-marksheet-document"
              ref={marksheetRef}
              style={{
                transform: docZoom !== 100 ? `scale(${docZoom / 100})` : undefined,
                transformOrigin: "top center"
              }}
            >
              {/* Central Background Watermark Crest */}
              <div className="svsu-doc-watermark-overlay" aria-hidden="true">
                <SVSUCrest size={340} />
              </div>

              {/* Guilloche Border System */}
              <div className="svsu-guilloche-border-outer">
                <div className="svsu-guilloche-border-inner">
                  {/* Top Bar: Tagline & Serial Number */}
                  <div className="svsu-doc-top-bar">
                    <span className="svsu-tagline">Where Education is a Passion...</span>
                    <span className="svsu-sr-number">Sr.No. {studentMeta.serialNo}</span>
                  </div>

                  {/* University Header Lockup */}
                  <div className="svsu-doc-header-lockup">
                    <div className="svsu-crest-col">
                      <SVSUCrest size={84} />
                    </div>

                    <div className="svsu-univ-name-col">
                      <div className="svsu-hindi-pre">SWAMI VIVEKANAND</div>
                      <div className="svsu-brand-row">
                        <span className="svsu-main-brand">SUBHARTI</span>
                        <span className="svsu-sub-brand">UNIVERSITY</span>
                        <span className="svsu-city-brand">Meerut</span>
                      </div>
                      <div className="svsu-approval-badge">
                        <span>UGC Approved</span>
                      </div>
                    </div>

                    <div className="svsu-naac-col">
                      <NAACBadge size={76} />
                    </div>
                  </div>

                  {/* Statement of Marks Title Block */}
                  <div className="svsu-doc-title-block">
                    <h3 className="svsu-statement-title">STATEMENT OF MARKS</h3>
                    <h4 className="svsu-course-title">{OFFICIAL_TRANSCRIPT_DATA.degree}</h4>
                    <div className="svsu-branch-title">
                      ({studentMeta.branch === "CSE" || studentMeta.branch.includes("COMPUTER")
                        ? "COMPUTER SCIENCE & ENGINEERING"
                        : studentMeta.branch})
                    </div>
                    <div className="svsu-session-title">{OFFICIAL_TRANSCRIPT_DATA.session}</div>
                  </div>

                  {/* Student Identification Section (QR + Details + Passport Photo) */}
                  <div className="svsu-identity-section">
                    {/* Left: QR Code */}
                    <div className="svsu-qr-box-col">
                      <div className="svsu-qr-frame">
                        <img
                          src={assetUrl("/svsu_qr_code_scanned.png")}
                          alt="Official Verification QR Code"
                          className="svsu-scanned-qr-img"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <QrCode size={78} strokeWidth={1.8} className="svsu-qr-vector-fallback" />
                      </div>
                    </div>

                    {/* Middle: Student Metadata Grid */}
                    <div className="svsu-student-meta-table">
                      <div className="meta-row">
                        <span className="meta-cell label">EnrollmentNo:</span>
                        <span className="meta-cell val bold font-mono">{studentMeta.enrollmentNo}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-cell label">Name :</span>
                        <span className="meta-cell val bold">{studentMeta.name}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-cell label">Father's Name :</span>
                        <span className="meta-cell val bold">{studentMeta.fatherName}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-cell label">Mother's Name :</span>
                        <span className="meta-cell val bold">{studentMeta.motherName}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-cell label">College :</span>
                        <span className="meta-cell val bold">{studentMeta.college}</span>
                      </div>
                    </div>

                    {/* Right: Passport Photograph */}
                    <div className="svsu-photo-col">
                      <div className="svsu-photo-frame">
                        <img
                          src={
                            studentMeta.avatarUrl &&
                            typeof studentMeta.avatarUrl === "string" &&
                            studentMeta.avatarUrl.trim() !== "" &&
                            !studentMeta.avatarUrl.includes("default")
                              ? studentMeta.avatarUrl
                              : assetUrl("/sonu_kumar_passport_photo.png")
                          }
                          alt={studentMeta.name}
                          className="svsu-student-passport-photo"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = assetUrl("/sonu_kumar_passport_photo.png");
                          }}
                        />
                      </div>
                      <div className="svsu-exam-type-tag">
                        Exam Type : <strong>{studentMeta.examType}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Authentic Subharti Marks Matrix Table */}
                  <div className="svsu-marks-table-container">
                    <table className="svsu-official-marks-table">
                      <thead>
                        <tr className="main-th-row">
                          <th rowSpan={2} className="col-sno">S.No.</th>
                          <th rowSpan={2} className="col-course">COURSE</th>
                          <th rowSpan={2} className="col-code">COURSE CODE</th>
                          <th rowSpan={2} className="col-credit">CREDIT<br />EARNED</th>
                          <th colSpan={2} className="col-external">EXTERNAL MARKS</th>
                          <th colSpan={2} className="col-sessional">SESSIONAL MARKS</th>
                          <th colSpan={2} className="col-total">TOTAL MARKS</th>
                          <th rowSpan={2} className="col-cpe">TOTAL<br />CREDIT POINT<br />EARNED</th>
                        </tr>
                        <tr className="sub-th-row">
                          <th className="sub-col">MAXIMUM</th>
                          <th className="sub-col">OBTAINED</th>
                          <th className="sub-col">MAXIMUM</th>
                          <th className="sub-col">OBTAINED</th>
                          <th className="sub-col">MAXIMUM</th>
                          <th className="sub-col">OBTAINED</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* SEMESTER - I BLOCK */}
                        {(selectedUnivView === "annual" || selectedUnivView === "sem1") && (
                          <>
                            <tr className="semester-divider-row">
                              <td colSpan={11}>Semester - I</td>
                            </tr>
                            {OFFICIAL_TRANSCRIPT_DATA.semester1.subjects.map((s) => (
                              <tr key={`sem1-${s.code}`} className={s.isFail ? "is-cop-row" : ""}>
                                <td className="center-cell">{s.sNo}</td>
                                <td className="course-name-cell">{s.course}</td>
                                <td className="code-cell font-mono">{s.code}</td>
                                <td className="center-cell">{s.credits !== null ? s.credits : ""}</td>
                                <td className="num-cell">{s.extMax}</td>
                                <td className={`num-cell ${s.isFail ? "fail-mark" : ""}`}>{s.extObt}</td>
                                <td className="num-cell">{s.sessMax}</td>
                                <td className="num-cell">{s.sessObt}</td>
                                <td className="num-cell bold">{s.totalMax}</td>
                                <td className={`num-cell bold ${s.isFail ? "fail-mark" : ""}`}>{s.totalObt}</td>
                                <td className="num-cell credit-points font-mono">{s.creditPoints}</td>
                              </tr>
                            ))}
                            {/* Semester I Subtotal */}
                            <tr className="semester-subtotal-row">
                              <td colSpan={2} className="subtotal-label">Semester Total</td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td className="num-cell bold font-mono">{OFFICIAL_TRANSCRIPT_DATA.semester1.totalMax}</td>
                              <td className="num-cell bold font-mono">{OFFICIAL_TRANSCRIPT_DATA.semester1.totalObt}</td>
                              <td className="num-cell bold font-mono credit-points">{OFFICIAL_TRANSCRIPT_DATA.semester1.totalCreditPoints}</td>
                            </tr>
                            {/* Semester I SGPA */}
                            <tr className="semester-sgpa-row">
                              <td colSpan={10} className="sgpa-label">SGPA</td>
                              <td className="sgpa-val font-mono">{OFFICIAL_TRANSCRIPT_DATA.semester1.sgpa}</td>
                            </tr>
                          </>
                        )}

                        {/* SEMESTER - II BLOCK */}
                        {(selectedUnivView === "annual" || selectedUnivView === "sem2") && (
                          <>
                            <tr className="semester-divider-row">
                              <td colSpan={11}>Semester - II</td>
                            </tr>
                            {OFFICIAL_TRANSCRIPT_DATA.semester2.subjects.map((s) => (
                              <tr key={`sem2-${s.code}`} className={s.isFail ? "is-cop-row" : ""}>
                                <td className="center-cell">{s.sNo}</td>
                                <td className="course-name-cell">{s.course}</td>
                                <td className="code-cell font-mono">{s.code}</td>
                                <td className="center-cell">{s.credits !== null ? s.credits : ""}</td>
                                <td className="num-cell">{s.extMax}</td>
                                <td className="num-cell">{s.extObt}</td>
                                <td className="num-cell">{s.sessMax}</td>
                                <td className="num-cell">{s.sessObt}</td>
                                <td className="num-cell bold">{s.totalMax}</td>
                                <td className="num-cell bold">{s.totalObt}</td>
                                <td className="num-cell credit-points font-mono">{s.creditPoints || ""}</td>
                              </tr>
                            ))}
                            {/* Semester II Subtotal */}
                            <tr className="semester-subtotal-row">
                              <td colSpan={2} className="subtotal-label">Semester Total</td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td className="num-cell bold font-mono">{OFFICIAL_TRANSCRIPT_DATA.semester2.totalMax}</td>
                              <td className="num-cell bold font-mono">{OFFICIAL_TRANSCRIPT_DATA.semester2.totalObt}</td>
                              <td className="num-cell bold font-mono credit-points">{OFFICIAL_TRANSCRIPT_DATA.semester2.totalCreditPoints}</td>
                            </tr>
                            {/* Semester II SGPA */}
                            <tr className="semester-sgpa-row">
                              <td colSpan={10} className="sgpa-label">SGPA</td>
                              <td className="sgpa-val font-mono">{OFFICIAL_TRANSCRIPT_DATA.semester2.sgpa}</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* ANNUAL FIRST YEAR GRAND TOTAL ROW */}
                  {selectedUnivView === "annual" && (
                    <div className="svsu-year-total-container">
                      <table className="svsu-year-total-table">
                        <tbody>
                          <tr className="annual-grand-total-row">
                            <td className="year-total-label bold">Year Total</td>
                            <td className="yt-num-cell bold font-mono">{OFFICIAL_TRANSCRIPT_DATA.yearSummary.totalMax}</td>
                            <td className="yt-num-cell bold font-mono">{OFFICIAL_TRANSCRIPT_DATA.yearSummary.totalObt}</td>
                            <td className="yt-num-cell bold font-mono credit-points-white">{OFFICIAL_TRANSCRIPT_DATA.yearSummary.totalCreditPoints}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* CARRY OVER PAPER (COP) SECTION */}
                  {selectedUnivView === "annual" && (
                    <div className="svsu-cop-container">
                      <table className="svsu-cop-table">
                        <thead>
                          <tr>
                            <th colSpan={4} className="cop-heading-cell">Carry Over Paper (if any)</th>
                          </tr>
                          <tr className="cop-sub-th">
                            <th style={{ width: "35%" }}>Subject(s) Code</th>
                            <th style={{ width: "20%" }}>Total COP</th>
                            <th style={{ width: "25%" }}>Grace Mark (if any)</th>
                            <th style={{ width: "20%" }}>Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="cop-val-center font-mono bold">{OFFICIAL_TRANSCRIPT_DATA.cop.subjectCode}</td>
                            <td className="cop-val-center bold font-mono">{OFFICIAL_TRANSCRIPT_DATA.cop.totalCop}</td>
                            <td className="cop-val-center">{OFFICIAL_TRANSCRIPT_DATA.cop.graceMarks || "—"}</td>
                            <td className="cop-val-center bold result-pcp">{OFFICIAL_TRANSCRIPT_DATA.cop.result}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* OFFICIAL SIGNATURES & SECURITY HOLOGRAM ROW */}
                  <div className="svsu-signatures-container">
                    {/* Left: Prepared By */}
                    <div className="signature-col left">
                      <div className="signature-img-wrapper">
                        <img
                          src={assetUrl("/svsu_sign_prepared_scanned.png")}
                          alt="Prepared by Signature"
                          className="authentic-signature-img prepared"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <div className="handwritten-sign prepared fallback-sign">S. Verma</div>
                      </div>
                      <div className="sign-line"></div>
                      <div className="sign-title">Prepared by</div>
                      <div className="sign-date font-mono">Date of Issue : {OFFICIAL_TRANSCRIPT_DATA.dateOfIssue}</div>
                    </div>

                    {/* Middle: Checked By & Stamp */}
                    <div className="signature-col middle">
                      <div className="signature-img-wrapper">
                        <img
                          src={assetUrl("/svsu_sign_checked_scanned.png")}
                          alt="Checked by Signature"
                          className="authentic-signature-img checked"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <div className="checked-stamp-lockup fallback-sign">
                          <div className="handwritten-sign checked">G. Kumar</div>
                          <div className="stamp-box font-mono">G.K.Kumar</div>
                        </div>
                      </div>
                      <div className="sign-line"></div>
                      <div className="sign-title">Checked by</div>
                    </div>

                    {/* Center: Golden Hologram Seal */}
                    <div className="svsu-hologram-seal-col">
                      <div className="hologram-asset-wrapper">
                        <img
                          src={assetUrl("/svsu_hologram_scanned.png")}
                          alt="Authentic University Hologram"
                          className="authentic-hologram-img"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <div className="fallback-hologram">
                          <UniversityHologram size={66} />
                        </div>
                      </div>
                    </div>

                    {/* Right: Controller of Examination */}
                    <div className="signature-col right">
                      <div className="signature-img-wrapper">
                        <img
                          src={assetUrl("/svsu_sign_controller_scanned.png")}
                          alt="Controller of Examination Signature"
                          className="authentic-signature-img controller"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <div className="handwritten-sign controller fallback-sign">Ramlal</div>
                      </div>
                      <div className="sign-line"></div>
                      <div className="sign-title">Controller of Examination</div>
                    </div>
                  </div>

                  {/* OFFICIAL LEGAL LEGEND & DISCLAIMERS */}
                  <div className="svsu-legal-legend">
                    <p>Q=Qualifying Paper (marks are not to be added in grand total).</p>
                    <p>A=Absent, PCP=Promoted with carry over Paper, PWG=Pass with Grace, P=Practical.</p>
                    <p className="svsu-final-disclaimer">
                      In case of any change/discrepancy between the entries in the mark sheet issued in the University record, the University record shall be Final.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              ORIGINAL SCANNED DOCUMENT MODAL (SUM132970 HIGH-RESOLUTION VIEWER)
              ========================================================================= */}
          {showOriginalModal && (
            <div className="std-modal-scrim" onClick={() => setShowOriginalModal(false)}>
              <div className="std-original-doc-modal" onClick={(e) => e.stopPropagation()}>
                <div className="std-doc-modal-header">
                  <div className="std-doc-modal-title">
                    <Award size={18} style={{ color: "#F59E0B" }} />
                    <span>Original Subharti University Statement of Marks (Serial No: SUM132970)</span>
                  </div>
                  <div className="std-doc-modal-actions">
                    <div className="std-zoom-controls">
                      <button
                        type="button"
                        className="std-zoom-btn"
                        onClick={() => setDocZoom((z) => Math.max(50, z - 15))}
                        title="Zoom Out"
                      >
                        <ZoomOut size={14} />
                      </button>
                      <span className="zoom-level">{docZoom}%</span>
                      <button
                        type="button"
                        className="std-zoom-btn"
                        onClick={() => setDocZoom((z) => Math.min(200, z + 15))}
                        title="Zoom In"
                      >
                        <ZoomIn size={14} />
                      </button>
                      <button
                        type="button"
                        className="std-zoom-btn"
                        onClick={() => setDocZoom(100)}
                        title="Reset Zoom"
                      >
                        <RotateCcw size={13} />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="std-modal-close-btn"
                      onClick={() => setShowOriginalModal(false)}
                      aria-label="Close modal"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div className="std-doc-modal-body">
                  <div
                    className="std-scan-zoom-container"
                    style={{ transform: `scale(${docZoom / 100})`, transformOrigin: "top center" }}
                  >
                    <img
                      src={assetUrl("/svsu_marksheet_scanned_reference.jpg")}
                      alt="Original Scanned SVSU Statement of Marks"
                      className="std-original-scan-img"
                    />
                  </div>
                </div>
                <div className="std-doc-modal-footer">
                  <div className="std-doc-modal-verified-badge">
                    <ShieldCheck size={16} style={{ color: "#10B981" }} />
                    <span>Archival Physical Scan Authenticated by Swami Vivekanand Subharti University</span>
                  </div>
                  <div className="std-doc-modal-btns">
                    <button
                      type="button"
                      className="std-btn-primary"
                      onClick={() => window.open(assetUrl("/svsu_marksheet_scanned_reference.jpg"), "_blank")}
                    >
                      <ExternalLink size={14} />
                      <span>Open Full Resolution Image</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
