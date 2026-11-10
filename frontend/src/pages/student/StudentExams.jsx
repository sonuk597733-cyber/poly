import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Calendar,
  Clock,
  Download,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Search,
  FileSpreadsheet,
  BookOpen,
  ShieldCheck,
  Award,
  FileText,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  HelpCircle,
  Filter,
  Layers,
  Send,
  GraduationCap,
  Info,
  ExternalLink,
  Eye,
  RefreshCw,
  X,
  Timer,
  Check,
  Copy,
  MapPin,
  User,
  Hash,
  ArrowUpDown,
  SlidersHorizontal,
  AlertCircle,
  CalendarPlus,
  TrendingUp,
  BarChart3,
  CreditCard,
  Lock,
  FileCheck,
  Bell,
  MessageSquare,
  LifeBuoy,
  QrCode,
  Share2,
  FileDown
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./StudentTheme.css";
import "./StudentExams.css";

/* ------------------------------------------------------------------ */
/* Date and Helper Utilities                                          */
/* ------------------------------------------------------------------ */

const DAY_MS = 24 * 60 * 60 * 1000;

const formatDateLong = (date) =>
  date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

const formatWeekday = (date) =>
  date.toLocaleDateString("en-IN", { weekday: "long" });

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const toIcsDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
};

const escapeIcs = (text = "") =>
  String(text)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");

const escapeCsv = (value = "") => `"${String(value).replace(/"/g, '""')}"`;

const downloadBlob = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/* ------------------------------------------------------------------ */
/* Fallback / Seed Data for Complete Academic Experience              */
/* ------------------------------------------------------------------ */

const SEED_EXAMS = [
  {
    id: "ex-1",
    code: "CS-501",
    subject: "Operating Systems & Linux Architecture",
    category: "theory",
    examType: "Final Semester Examination",
    date: new Date(Date.now() + 6 * DAY_MS),
    time: "10:00 AM - 01:00 PM",
    hall: "Exam Hall A (Room 201)",
    seatNo: "Desk A-42",
    invigilator: "Dr. Arvind Sharma",
    maxMarks: 100,
    passingMarks: 40,
    credits: 4,
    status: "upcoming",
    syllabus: "Process Scheduling, Threading, Virtual Memory Management, Deadlocks, Linux Kernel Modules"
  },
  {
    id: "ex-2",
    code: "CS-502",
    subject: "Relational Database Management Systems",
    category: "theory",
    examType: "Final Semester Examination",
    date: new Date(Date.now() + 9 * DAY_MS),
    time: "10:00 AM - 01:00 PM",
    hall: "Exam Hall B (Room 204)",
    seatNo: "Desk B-18",
    invigilator: "Prof. Sunita Verma",
    maxMarks: 100,
    passingMarks: 40,
    credits: 4,
    status: "upcoming",
    syllabus: "3NF/BCNF Normalization, Transaction ACID Properties, Concurrency Control, Stored Procedures, B+ Trees"
  },
  {
    id: "ex-3",
    code: "CS-503",
    subject: "Computer Networks & Protocol Engineering",
    category: "theory",
    examType: "Final Semester Examination",
    date: new Date(Date.now() + 12 * DAY_MS),
    time: "10:00 AM - 01:00 PM",
    hall: "Exam Hall A (Room 201)",
    seatNo: "Desk A-42",
    invigilator: "Er. Rajesh Kumar",
    maxMarks: 100,
    passingMarks: 40,
    credits: 4,
    status: "upcoming",
    syllabus: "TCP/IP Suite, Congestion Control, Routing Algorithms, OSPF/BGP, Subnetting, Network Security"
  },
  {
    id: "ex-4",
    code: "CS-504P",
    subject: "Advanced Operating Systems & Networking Lab",
    category: "practical",
    examType: "Practical / Lab Assessment",
    date: new Date(Date.now() + 15 * DAY_MS),
    time: "02:00 PM - 05:00 PM",
    hall: "Computing Lab 301",
    seatNo: "Terminal Lab-07",
    invigilator: "Dr. Arvind Sharma & Er. Manoj",
    maxMarks: 50,
    passingMarks: 20,
    credits: 2,
    status: "upcoming",
    syllabus: "POSIX Multithreading, Socket Programming in C, Packet Sniffing with Wireshark, Shell Scripting"
  },
  {
    id: "ex-5",
    code: "CS-505V",
    subject: "Comprehensive Technical Seminar & Project Viva",
    category: "viva",
    examType: "Viva Examination",
    date: new Date(Date.now() + 18 * DAY_MS),
    time: "09:30 AM - 01:30 PM",
    hall: "Conference Room 102",
    seatNo: "Slot Panel #2",
    invigilator: "Board of External Examiners",
    maxMarks: 50,
    passingMarks: 20,
    credits: 2,
    status: "upcoming",
    syllabus: "Full-Stack ERP Architecture Presentation, Live Code Demonstration, Software Engineering Viva"
  }
];

const SEED_ASSESSMENTS = [
  {
    code: "CS-501",
    subject: "Operating Systems & Linux Architecture",
    credits: 4,
    sessional1: 18.5,
    sessional2: 19.0,
    quizzes: 9.0,
    assignments: 9.5,
    attendanceMarks: 5.0,
    internalTotal: 46.0,
    internalMax: 50,
    externalExpected: 84,
    externalMax: 100,
    predictedGrade: "A+",
    status: "Cleared",
    benchmarkMet: true
  },
  {
    code: "CS-502",
    subject: "Relational Database Management Systems",
    credits: 4,
    sessional1: 17.0,
    sessional2: 18.0,
    quizzes: 8.5,
    assignments: 9.0,
    attendanceMarks: 5.0,
    internalTotal: 43.5,
    internalMax: 50,
    externalExpected: 80,
    externalMax: 100,
    predictedGrade: "A",
    status: "Cleared",
    benchmarkMet: true
  },
  {
    code: "CS-503",
    subject: "Computer Networks & Protocol Engineering",
    credits: 4,
    sessional1: 18.0,
    sessional2: 17.5,
    quizzes: 9.0,
    assignments: 8.5,
    attendanceMarks: 4.5,
    internalTotal: 43.0,
    internalMax: 50,
    externalExpected: 78,
    externalMax: 100,
    predictedGrade: "A",
    status: "Cleared",
    benchmarkMet: true
  },
  {
    code: "CS-504P",
    subject: "Advanced OS & Networking Lab",
    credits: 2,
    sessional1: 23.0,
    sessional2: 24.0,
    quizzes: 0,
    assignments: 0,
    attendanceMarks: 5.0,
    internalTotal: 47.0,
    internalMax: 50,
    externalExpected: 46,
    externalMax: 50,
    predictedGrade: "A+",
    status: "Cleared",
    benchmarkMet: true
  },
  {
    code: "CS-505V",
    subject: "Technical Seminar & Project Viva",
    credits: 2,
    sessional1: 22.0,
    sessional2: 23.0,
    quizzes: 0,
    assignments: 0,
    attendanceMarks: 5.0,
    internalTotal: 45.0,
    internalMax: 50,
    externalExpected: 44,
    externalMax: 50,
    predictedGrade: "A",
    status: "Cleared",
    benchmarkMet: true
  }
];

const SEED_GPA_HISTORY = [
  { semester: "Semester 1", sgpa: 8.42, cgpa: 8.42, credits: 22, status: "First Class with Dist." },
  { semester: "Semester 2", sgpa: 8.58, cgpa: 8.50, credits: 24, status: "First Class with Dist." },
  { semester: "Semester 3", sgpa: 8.71, cgpa: 8.57, credits: 24, status: "First Class with Dist." },
  { semester: "Semester 4", sgpa: 8.85, cgpa: 8.64, credits: 22, status: "First Class with Dist." },
  { semester: "Semester 5 (Projected)", sgpa: 8.80, cgpa: 8.67, credits: 16, status: "Outstanding Standing" }
];

const DOWNLOADABLE_RESOURCES = [
  {
    id: "res-datesheet",
    title: "Official Examination Date Sheet (Autumn Session 2026)",
    type: "PDF",
    size: "1.4 MB",
    version: "Gazetted v2.4",
    dept: "Office of the Controller of Examinations",
    description: "Gazetted schedule for Polytechnic Diploma Semester 5 Regular & Carry-Over examinations.",
    url: "#"
  },
  {
    id: "res-syllabus",
    title: "Polytechnic Diploma CSE Curriculum & Examination Blueprint",
    type: "PDF",
    size: "3.2 MB",
    version: "2026 Curriculum",
    dept: "Board of Studies (CSE)",
    description: "Detailed unit-wise mark weightage, question paper blueprint, and recommended literature.",
    url: "#"
  },
  {
    id: "res-ordinance",
    title: "Subharti University Examination Ordinances & UFM Regulations",
    type: "PDF",
    size: "890 KB",
    version: "Statutory 2026",
    dept: "Academic Council",
    description: "Mandatory statutory code of conduct, grading scales, attendance threshold, and UFM penalties.",
    url: "#"
  },
  {
    id: "res-sample",
    title: "Previous 3 Years Solved Question Papers & Model Solutions",
    type: "ZIP",
    size: "12.8 MB",
    version: "2023-2025 Archive",
    dept: "Department Knowledge Bank",
    description: "Complete repository of previous semester board question papers with step-by-step solutions.",
    url: "#"
  }
];

const NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Gazetted Release: Autumn 2026 Examination Date Sheet & Hall Tickets",
    date: "28 Oct 2026",
    category: "Exam Cell Gazette",
    badge: "Urgent",
    body: "The Final Semester Examination for Polytechnic Diploma Semester 5 commences on schedule. All candidates are advised to verify their Admit Cards and seating halls immediately."
  },
  {
    id: "notif-2",
    title: "Strict Guidelines Regarding Non-Programmable Calculators and Smartwatches",
    date: "25 Oct 2026",
    category: "Proctorial Board",
    badge: "Important",
    body: "Candidates are strictly forbidden from bringing smart watches, programmable scientific calculators, or any Bluetooth-enabled peripherals into the examination halls. Only fx-82MS / fx-991MS permitted."
  },
  {
    id: "notif-3",
    title: "Practical & Project Viva External Examiners Panel Finalized",
    date: "20 Oct 2026",
    category: "Department of CSE",
    badge: "Notice",
    body: "External examiners from industry and technical universities have been appointed for CS-504P and CS-505V. Ensure laboratory notebooks and project reports are signed by faculty beforehand."
  }
];

const CODE_OF_CONDUCT = [
  {
    title: "Mandatory Documentation",
    desc: "Candidate MUST carry the printed Digital Hall Ticket and College Student ID card to every examination session. No candidate will be admitted without both credentials."
  },
  {
    title: "Reporting Time & Gate Closure",
    desc: "Arrive at the designated examination hall at least 30 minutes before the scheduled start time. Examination hall doors will be sealed 15 minutes after session commencement."
  },
  {
    title: "Prohibited Electronics & Materials",
    desc: "Mobile phones, smart fitness bands, digital voice recorders, programmable calculators, and unauthorized paper notes are strictly banned under the University Anti-UFM Ordinance."
  },
  {
    title: "Writing Protocol & Materials",
    desc: "Use only royal blue or black ballpoint pens for all answer scripts. Drawing instruments and non-programmable standard calculators are permitted where specified on the question paper."
  },
  {
    title: "Answer Book Verification",
    desc: "Verify that the answer booklet contains all 32 serial pages without damage. Barcode sticker must be affixed properly on the front cover in the presence of the invigilator."
  },
  {
    title: "Emergency & Grievance Protocol",
    desc: "In case of sudden illness, seating discrepancy, or subject mismatch, report immediately to the Center Superintendent in Room 101."
  }
];

/* ------------------------------------------------------------------ */
/* Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function StudentExams({ currentUser, showToast, onNavigate }) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState("schedule"); // 'schedule', 'hall_ticket', 'assessments', 'registration', 'guidelines'
  
  // Data states
  const [examRecords, setExamRecords] = useState([]);
  const [dbSchedules, setDbSchedules] = useState([]);
  const [feeRecords, setFeeRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Filters & layout state
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // 'all', 'theory', 'practical', 'viva'
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date(2026, 10, 1)); // Nov 2026

  // Live countdown state (hours, minutes, seconds)
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Grievance Redressal Form state
  const [grievanceForm, setGrievanceForm] = useState({
    category: "Admit Card Discrepancy",
    subjectCode: "CS-501",
    description: "",
    priority: "Normal"
  });
  const [submittedTickets, setSubmittedTickets] = useState([
    {
      id: "EXAM-TKT-9912",
      category: "Internal Assessment Verification",
      subject: "CS-502 DBMS Sessional 2",
      status: "Resolved & Updated",
      date: "24 Oct 2026",
      remarks: "Sessional 2 marks verified from faculty ledger and updated to 18.0."
    }
  ]);
  const [submittingGrievance, setSubmittingGrievance] = useState(false);

  /* ---------- Data Fetching ---------- */
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(false);

    Promise.allSettled([
      authApi.getExamSchedules({ branch: currentUser?.branch || "CSE" }),
      authApi.getExams(),
      authApi.getExamResults(),
      authApi.getFees()
    ])
      .then(([schedRes, examsRes, resRes, feesRes]) => {
        if (ignore) return;

        if (schedRes.status === "fulfilled" && schedRes.value?.schedules?.length) {
          setDbSchedules(schedRes.value.schedules);
        }
        if (examsRes.status === "fulfilled" && examsRes.value?.marks) {
          setExamRecords(examsRes.value.marks);
        }
        if (feesRes.status === "fulfilled" && feesRes.value?.fees) {
          setFeeRecords(feesRes.value.fees);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!ignore) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [reloadKey, currentUser]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  /* ---------- Unified Normalized Examination List ---------- */
  const displayExams = useMemo(() => {
    const today = startOfDay(new Date());

    // If backend schedules exist, merge with seed data to ensure rich presentation
    let sourceList = SEED_EXAMS;
    if (dbSchedules.length > 0) {
      sourceList = dbSchedules.map((s, idx) => {
        const rawDate = s.examDate ? new Date(s.examDate) : new Date(Date.now() + (idx + 4) * DAY_MS);
        const isPractical = s.examType?.toLowerCase().includes("practical") || s.subjectName?.toLowerCase().includes("lab");
        const isViva = s.examType?.toLowerCase().includes("viva") || s.subjectName?.toLowerCase().includes("viva");

        return {
          id: s._id || s.id || `ex-${idx}`,
          code: s.subjectCode || `CS-50${idx + 1}`,
          subject: s.subjectName || "Subject",
          category: isViva ? "viva" : isPractical ? "practical" : "theory",
          examType: s.examType || "Final Semester Examination",
          date: rawDate,
          time: s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : "10:00 AM - 01:00 PM",
          hall: s.roomNo || "Exam Hall A (Room 201)",
          seatNo: `Desk A-${20 + idx * 4}`,
          invigilator: s.invigilatorName || "Faculty Proctor",
          maxMarks: s.maxMarks || 100,
          passingMarks: s.passingMarks || 40,
          credits: isPractical ? 2 : 4,
          status: s.status || "upcoming",
          syllabus: "Comprehensive semester syllabus & university blueprint units."
        };
      });
    }

    return sourceList.map((ex) => {
      const dateObj = ex.date instanceof Date && !isNaN(ex.date.getTime()) ? ex.date : new Date();
      const diffDays = Math.round((startOfDay(dateObj) - today) / DAY_MS);
      let status = "upcoming";
      if (diffDays < 0) status = "completed";
      else if (diffDays === 0) status = "today";

      return {
        ...ex,
        dateObj,
        formattedDate: formatDateLong(dateObj),
        weekday: formatWeekday(dateObj),
        diffDays,
        status
      };
    });
  }, [dbSchedules]);

  /* ---------- Nearest Next Exam & Live Countdown ---------- */
  const nextExam = useMemo(() => {
    const upcoming = displayExams
      .filter((e) => e.diffDays >= 0)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    return upcoming[0] || displayExams[0];
  }, [displayExams]);

  useEffect(() => {
    if (!nextExam || !nextExam.dateObj) return;

    const targetDate = new Date(nextExam.dateObj);
    targetDate.setHours(10, 0, 0, 0); // 10:00 AM session

    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextExam]);

  /* ---------- Filtered Exams ---------- */
  const filteredExams = useMemo(() => {
    const q = query.trim().toLowerCase();

    return displayExams
      .filter((e) => {
        if (typeFilter !== "all" && e.category !== typeFilter) return false;
        if (!q) return true;
        return (
          e.subject.toLowerCase().includes(q) ||
          e.code.toLowerCase().includes(q) ||
          e.hall.toLowerCase().includes(q) ||
          e.invigilator.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const ta = a.dateObj.getTime();
        const tb = b.dateObj.getTime();
        return sortAsc ? ta - tb : tb - ta;
      });
  }, [displayExams, query, typeFilter, sortAsc]);

  /* ---------- Summary Stats ---------- */
  const stats = useMemo(() => {
    const total = displayExams.length;
    const theoryCount = displayExams.filter((e) => e.category === "theory").length;
    const practicalCount = displayExams.filter((e) => e.category === "practical" || e.category === "viva").length;
    const upcomingCount = displayExams.filter((e) => e.status === "upcoming" || e.status === "today").length;
    return { total, theoryCount, practicalCount, upcomingCount };
  }, [displayExams]);

  /* ---------- Interactive Calendar Engine ---------- */
  const calendarDays = useMemo(() => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Adjust so Monday is 0
    const startOffset = (firstDayIndex + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        dayNumber: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - i),
        exams: []
      });
    }

    // Current month days
    const today = startOfDay(new Date());
    for (let d = 1; d <= daysInMonth; d++) {
      const currentDate = new Date(year, month, d);
      const isToday = currentDate.getTime() === today.getTime();
      const isSunday = currentDate.getDay() === 0;

      // Find exams on this date
      const matchingExams = displayExams.filter(
        (ex) =>
          ex.dateObj.getFullYear() === year &&
          ex.dateObj.getMonth() === month &&
          ex.dateObj.getDate() === d
      );

      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        isToday,
        isSunday,
        date: currentDate,
        exams: matchingExams
      });
    }

    // Next month padding to fill a complete 35 or 42 grid
    const totalCells = Math.ceil(days.length / 7) * 7;
    let nextDay = 1;
    while (days.length < totalCells) {
      days.push({
        dayNumber: nextDay,
        isCurrentMonth: false,
        date: new Date(year, month + 1, nextDay),
        exams: []
      });
      nextDay++;
    }

    return days;
  }, [currentCalendarMonth, displayExams]);

  /* ---------- Actions ---------- */
  const handlePrintAdmitCard = () => {
    showToast?.("Preparing digital hall ticket for printing. Select 'Save as PDF' to export.");
    window.print();
  };

  const handleExportCsv = () => {
    if (!displayExams.length) {
      showToast?.("No examination papers to export.");
      return;
    }
    const header = ["Course Code", "Subject Name", "Category", "Date", "Session Time", "Venue", "Invigilator", "Max Marks"];
    const rows = displayExams.map((e) =>
      [e.code, e.subject, e.category, e.formattedDate, e.time, e.hall, e.invigilator, e.maxMarks].map(escapeCsv).join(",")
    );
    downloadBlob(
      [header.map(escapeCsv).join(","), ...rows].join("\n"),
      "subharti-exam-datesheet-2026.csv",
      "text/csv;charset=utf-8;"
    );
    showToast?.("Official date sheet exported as CSV.");
  };

  const handleAddToCalendar = (exam) => {
    const start = toIcsDate(exam.dateObj);
    const end = toIcsDate(new Date(exam.dateObj.getTime() + DAY_MS));
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Subharti University//Examination Portal//EN",
      "BEGIN:VEVENT",
      `UID:svsu-exam-${exam.id}-${start}@subharti.org`,
      `DTSTAMP:${toIcsDate(new Date())}T000000Z`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${escapeIcs(`${exam.subject} (${exam.code}) - ${exam.examType}`)}`,
      `LOCATION:${escapeIcs(exam.hall)}`,
      `DESCRIPTION:${escapeIcs(`Seating: ${exam.seatNo} | Session: ${exam.time} | Invigilator: ${exam.invigilator}`)}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    downloadBlob(ics, `${exam.code}-exam-schedule.ics`, "text/calendar;charset=utf-8;");
    showToast?.(`${exam.code} examination added to calendar file.`);
  };

  const handleGrievanceSubmit = (e) => {
    e.preventDefault();
    if (!grievanceForm.description.trim()) {
      showToast?.("Please explain your inquiry or grievance.");
      return;
    }
    setSubmittingGrievance(true);
    setTimeout(() => {
      const newTicket = {
        id: `EXAM-TKT-${Math.floor(1000 + Math.random() * 9000)}`,
        category: grievanceForm.category,
        subject: `${grievanceForm.subjectCode} - Inquiry`,
        status: "Registered with Exam Cell (Pending Review)",
        date: formatDateLong(new Date()),
        remarks: "Assigned to Deputy Registrar (Examinations). Resolution SLA: 24 Hours."
      };
      setSubmittedTickets((prev) => [newTicket, ...prev]);
      setGrievanceForm({ category: "Admit Card Discrepancy", subjectCode: "CS-501", description: "", priority: "Normal" });
      setSubmittingGrievance(false);
      showToast?.(`Grievance submitted successfully. Ticket ID: ${newTicket.id}`);
    }, 700);
  };

  /* ------------------------------------------------------------------ */
  /* Main UI Render                                                     */
  /* ------------------------------------------------------------------ */

  return (
    <div className="student-role-view student-exam-page">
      {/* 1. Header Banner & Live Countdown */}
      <header className="std-exam-hero-header">
        <div className="std-exam-hero-content">
          <div className="std-exam-hero-badges">
            <span className="std-exam-badge primary">
              <Sparkles size={13} aria-hidden="true" />
              Swami Vivekanand Subharti University
            </span>
            <span className="std-exam-badge success">
              <ShieldCheck size={13} aria-hidden="true" />
              Autumn Session 2026-2027
            </span>
            <span className="std-exam-badge cyan">
              Polytechnic Diploma • Semester 5
            </span>
          </div>

          <h1 className="std-exam-hero-title">
            <GraduationCap size={32} className="std-exam-title-icon" aria-hidden="true" />
            University Examination &amp; Assessment Portal
          </h1>

          <p className="std-exam-hero-subtitle">
            Centralized academic evaluation command center for Diploma in Computer Science &amp; Engineering.
            Access official date sheets, digital hall tickets, continuous internal evaluations, and verified transcripts.
          </p>

          <div className="std-exam-hero-student-meta">
            <div className="std-meta-chip">
              <User size={14} />
              <span>Candidate: <strong>{currentUser?.fullName || "Satyam Kumar"}</strong></span>
            </div>
            <div className="std-meta-chip">
              <Hash size={14} />
              <span>Roll No: <strong>{currentUser?.rollNo || "2024-POLY-CSE-042"}</strong></span>
            </div>
            <div className="std-meta-chip">
              <BookOpen size={14} />
              <span>Enrollment: <strong>{currentUser?.enrollmentNo || "SVSU/2024/09842"}</strong></span>
            </div>
            <div className="std-meta-chip verified">
              <CheckCircle2 size={14} />
              <span>Clearance: <strong>All Cleared (84.6% Attd.)</strong></span>
            </div>
          </div>
        </div>

        {/* Live Countdown Card */}
        {nextExam && (
          <div className="std-exam-countdown-box" aria-label="Upcoming examination countdown">
            <div className="std-countdown-top">
              <span className="std-countdown-label">
                <Timer size={16} className="std-pulse-icon" />
                Next Upcoming Paper
              </span>
              <span className="std-countdown-badge">{nextExam.code}</span>
            </div>

            <h4 className="std-countdown-subject">{nextExam.subject}</h4>
            <div className="std-countdown-meta">
              <span><Calendar size={13} /> {nextExam.formattedDate}</span>
              <span><Clock size={13} /> {nextExam.time}</span>
              <span><MapPin size={13} /> {nextExam.hall}</span>
            </div>

            <div className="std-timer-grid">
              <div className="std-timer-unit">
                <span className="std-timer-val">{String(timeRemaining.days).padStart(2, "0")}</span>
                <span className="std-timer-tag">Days</span>
              </div>
              <span className="std-timer-sep">:</span>
              <div className="std-timer-unit">
                <span className="std-timer-val">{String(timeRemaining.hours).padStart(2, "0")}</span>
                <span className="std-timer-tag">Hours</span>
              </div>
              <span className="std-timer-sep">:</span>
              <div className="std-timer-unit">
                <span className="std-timer-val">{String(timeRemaining.minutes).padStart(2, "0")}</span>
                <span className="std-timer-tag">Mins</span>
              </div>
              <span className="std-timer-sep">:</span>
              <div className="std-timer-unit">
                <span className="std-timer-val highlight">{String(timeRemaining.seconds).padStart(2, "0")}</span>
                <span className="std-timer-tag">Secs</span>
              </div>
            </div>

            <div className="std-countdown-actions">
              <button
                type="button"
                className="std-exam-btn primary small"
                onClick={() => setActiveTab("hall_ticket")}
              >
                <Eye size={14} /> View Hall Ticket
              </button>
              <button
                type="button"
                className="std-exam-btn ghost small"
                onClick={() => handleAddToCalendar(nextExam)}
                title="Add to personal calendar"
              >
                <CalendarPlus size={14} /> Add Reminder
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Top-Level Metric KPI Cards */}
      <section className="std-exam-kpi-grid" aria-label="Examination overview statistics">
        <div className="std-exam-kpi-card highlight-cyan">
          <div className="std-kpi-icon-wrap cyan">
            <BookOpen size={22} />
          </div>
          <div className="std-kpi-body">
            <span className="std-kpi-title">Total Scheduled Papers</span>
            <div className="std-kpi-value-row">
              <span className="std-kpi-num">{stats.total}</span>
              <span className="std-kpi-sub-pill blue">
                {stats.theoryCount} Theory • {stats.practicalCount} Practical/Viva
              </span>
            </div>
            <span className="std-kpi-caption">100% gazetted by Subharti Exam Cell</span>
          </div>
        </div>

        <div className="std-exam-kpi-card highlight-emerald">
          <div className="std-kpi-icon-wrap emerald">
            <ShieldCheck size={22} />
          </div>
          <div className="std-kpi-body">
            <span className="std-kpi-title">Admit Card Sanctioned</span>
            <div className="std-kpi-value-row">
              <span className="std-kpi-num green">Verified</span>
              <span className="std-kpi-sub-pill green">Active &amp; Valid</span>
            </div>
            <span className="std-kpi-caption">Attendance 84.6% ≥ 75% • Accounts Cleared</span>
          </div>
        </div>

        <div className="std-exam-kpi-card highlight-purple">
          <div className="std-kpi-icon-wrap purple">
            <TrendingUp size={22} />
          </div>
          <div className="std-kpi-body">
            <span className="std-kpi-title">Continuous Internal Eval</span>
            <div className="std-kpi-value-row">
              <span className="std-kpi-num purple">88.5%</span>
              <span className="std-kpi-sub-pill purple">Avg 44.3 / 50</span>
            </div>
            <span className="std-kpi-caption">Sessional tests &amp; lab assignments cleared</span>
          </div>
        </div>

        <div className="std-exam-kpi-card highlight-amber">
          <div className="std-kpi-icon-wrap amber">
            <Award size={22} />
          </div>
          <div className="std-kpi-body">
            <span className="std-kpi-title">Academic Standing</span>
            <div className="std-kpi-value-row">
              <span className="std-kpi-num amber">8.64</span>
              <span className="std-kpi-sub-pill amber">CGPA (Sem 1-4)</span>
            </div>
            <span className="std-kpi-caption">First Class with Distinction • 0 Backlogs</span>
          </div>
        </div>
      </section>

      {/* 3. Master Navigation Sub-Tabs */}
      <nav className="std-exam-nav-tabs" role="tablist" aria-label="Examination portal views">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "schedule"}
          className={`std-exam-tab-btn ${activeTab === "schedule" ? "is-active" : ""}`}
          onClick={() => setActiveTab("schedule")}
        >
          <Calendar size={16} />
          <span>Timetable &amp; Calendar</span>
          <span className="std-tab-count">{stats.total}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "hall_ticket"}
          className={`std-exam-tab-btn ${activeTab === "hall_ticket" ? "is-active" : ""}`}
          onClick={() => setActiveTab("hall_ticket")}
        >
          <QrCode size={16} />
          <span>Admit Card / Hall Ticket</span>
          <span className="std-tab-badge-verified">Verified</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "assessments"}
          className={`std-exam-tab-btn ${activeTab === "assessments" ? "is-active" : ""}`}
          onClick={() => setActiveTab("assessments")}
        >
          <BarChart3 size={16} />
          <span>Assessments &amp; Results</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "registration"}
          className={`std-exam-tab-btn ${activeTab === "registration" ? "is-active" : ""}`}
          onClick={() => setActiveTab("registration")}
        >
          <CreditCard size={16} />
          <span>Exam Form &amp; Fee Status</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "guidelines"}
          className={`std-exam-tab-btn ${activeTab === "guidelines" ? "is-active" : ""}`}
          onClick={() => setActiveTab("guidelines")}
        >
          <LifeBuoy size={16} />
          <span>Instructions &amp; Helpdesk</span>
        </button>
      </nav>

      {/* 4. Tab Content: SCHEDULE & CALENDAR */}
      {activeTab === "schedule" && (
        <div className="std-exam-tab-pane">
          {/* Calendar + Schedule Dual Layout */}
          <div className="std-schedule-calendar-layout">
            {/* Left: Monthly Examination Calendar */}
            <section className="std-calendar-section-card" aria-label="Monthly Examination Calendar">
              <div className="std-card-header-clean">
                <div>
                  <h3 className="std-card-title">
                    <Calendar size={18} className="std-accent-icon" />
                    Monthly Examination Calendar
                  </h3>
                  <p className="std-card-subtitle">
                    November 2026 examination and practical session dates
                  </p>
                </div>

                <div className="std-calendar-nav-controls">
                  <button
                    type="button"
                    className="std-cal-btn"
                    onClick={() =>
                      setCurrentCalendarMonth(
                        new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1, 1)
                      )
                    }
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="std-cal-month-name">
                    {currentCalendarMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </span>
                  <button
                    type="button"
                    className="std-cal-btn"
                    onClick={() =>
                      setCurrentCalendarMonth(
                        new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 1)
                      )
                    }
                    aria-label="Next month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="std-month-calendar-grid">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((wd) => (
                  <div key={wd} className="std-cal-weekday-header">
                    {wd}
                  </div>
                ))}

                {calendarDays.map((cell, idx) => {
                  const hasExam = cell.exams.length > 0;
                  const isSelected =
                    selectedCalendarDate &&
                    selectedCalendarDate.getTime() === cell.date.getTime();

                  return (
                    <button
                      type="button"
                      key={`cal-d-${idx}`}
                      className={`std-cal-day-cell ${cell.isCurrentMonth ? "in-month" : "out-month"} ${
                        cell.isToday ? "is-today" : ""
                      } ${cell.isSunday ? "is-sunday" : ""} ${hasExam ? "has-exam" : ""} ${
                        isSelected ? "is-selected" : ""
                      }`}
                      onClick={() => setSelectedCalendarDate(hasExam ? cell.date : null)}
                      disabled={!hasExam && !cell.isCurrentMonth}
                    >
                      <span className="std-cal-day-num">{cell.dayNumber}</span>
                      {hasExam && (
                        <div className="std-cal-day-events">
                          {cell.exams.map((ex) => (
                            <span
                              key={ex.id}
                              className={`std-cal-event-pill ${ex.category}`}
                              title={`${ex.code}: ${ex.subject}`}
                            >
                              {ex.code}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Calendar Legend */}
              <div className="std-cal-legend">
                <div className="std-legend-item">
                  <span className="std-legend-dot theory" />
                  <span>Theory Papers</span>
                </div>
                <div className="std-legend-item">
                  <span className="std-legend-dot practical" />
                  <span>Practical Lab Exam</span>
                </div>
                <div className="std-legend-item">
                  <span className="std-legend-dot viva" />
                  <span>Viva Voce Panel</span>
                </div>
                <div className="std-legend-item">
                  <span className="std-legend-dot today" />
                  <span>Today</span>
                </div>
              </div>

              {/* Selected Date Inspector Card */}
              {selectedCalendarDate && (
                <div className="std-selected-date-inspector">
                  <div className="std-inspector-header">
                    <h4>
                      Scheduled Papers on {formatDateLong(selectedCalendarDate)} (
                      {formatWeekday(selectedCalendarDate)})
                    </h4>
                    <button
                      type="button"
                      className="std-inspector-close"
                      onClick={() => setSelectedCalendarDate(null)}
                      aria-label="Close date inspector"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="std-inspector-list">
                    {displayExams
                      .filter(
                        (e) =>
                          e.dateObj.getFullYear() === selectedCalendarDate.getFullYear() &&
                          e.dateObj.getMonth() === selectedCalendarDate.getMonth() &&
                          e.dateObj.getDate() === selectedCalendarDate.getDate()
                      )
                      .map((ex) => (
                        <div key={ex.id} className={`std-inspector-item ${ex.category}`}>
                          <div className="std-insp-top">
                            <span className="std-exam-code-badge">{ex.code}</span>
                            <span className={`std-exam-cat-pill ${ex.category}`}>{ex.examType}</span>
                          </div>
                          <h5>{ex.subject}</h5>
                          <div className="std-insp-details">
                            <span><Clock size={13} /> {ex.time}</span>
                            <span><MapPin size={13} /> {ex.hall}</span>
                            <span><User size={13} /> Invigilator: {ex.invigilator}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </section>

            {/* Right: Subject-wise Timetable List & Table */}
            <section className="std-timetable-card" aria-label="Subject-wise Examination Timetable">
              <div className="std-timetable-card-header">
                <div>
                  <h3 className="std-card-title">
                    <BookOpen size={18} className="std-accent-icon" />
                    Subject-Wise Timetable &amp; Seating Details
                  </h3>
                  <p className="std-card-subtitle">
                    Official schedule, hall allocations, and session timings for Semester 5
                  </p>
                </div>

                <div className="std-timetable-actions">
                  <button
                    type="button"
                    className="std-exam-ghost-btn"
                    onClick={handleExportCsv}
                  >
                    <FileSpreadsheet size={15} />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    className="std-exam-ghost-btn"
                    onClick={handlePrintAdmitCard}
                  >
                    <Printer size={15} />
                    <span>Print Timetable</span>
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="std-exam-toolbar">
                <label className="std-exam-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search subject code, title or hall..."
                    aria-label="Search examination papers"
                  />
                  {query && (
                    <button
                      type="button"
                      className="std-search-clear"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </label>

                {/* Filter Pills */}
                <div className="std-exam-filter-pills" role="group" aria-label="Filter by paper category">
                  {[
                    { key: "all", label: "All Papers" },
                    { key: "theory", label: "Theory" },
                    { key: "practical", label: "Practical Lab" },
                    { key: "viva", label: "Viva Voce" }
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      className={`std-filter-pill-btn ${typeFilter === p.key ? "is-active" : ""}`}
                      onClick={() => setTypeFilter(p.key)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* View Mode Toggle */}
                <div className="std-view-toggle">
                  <button
                    type="button"
                    className={`std-view-btn ${viewMode === "cards" ? "is-active" : ""}`}
                    onClick={() => setViewMode("cards")}
                    title="Card grid view"
                  >
                    <Layers size={14} />
                  </button>
                  <button
                    type="button"
                    className={`std-view-btn ${viewMode === "table" ? "is-active" : ""}`}
                    onClick={() => setViewMode("table")}
                    title="Data table view"
                  >
                    <FileText size={14} />
                  </button>
                </div>
              </div>

              {/* Schedule List Render: Cards or Table */}
              {viewMode === "cards" ? (
                <div className="std-papers-cards-grid">
                  {filteredExams.map((ex, idx) => (
                    <div
                      key={ex.id}
                      className={`std-paper-card ${ex.category} ${ex.status === "today" ? "is-today" : ""}`}
                      style={{ "--card-idx": idx }}
                    >
                      <div className="std-card-top-row">
                        <span className="std-paper-code">{ex.code}</span>
                        <span className={`std-paper-badge ${ex.category}`}>
                          {ex.category === "theory" ? "Theory Exam" : ex.category === "practical" ? "Lab Exam" : "Viva Voce"}
                        </span>
                        <span className={`std-status-pill ${ex.status}`}>
                          {ex.status === "today" ? "Today" : ex.status === "completed" ? "Completed" : `In ${ex.diffDays} Days`}
                        </span>
                      </div>

                      <h4 className="std-paper-title">{ex.subject}</h4>
                      <p className="std-paper-syllabus">{ex.syllabus}</p>

                      <div className="std-paper-meta-grid">
                        <div className="std-pm-item">
                          <Calendar size={13} className="std-pm-icon" />
                          <div>
                            <span className="std-pm-lbl">Exam Date</span>
                            <span className="std-pm-val">{ex.formattedDate} ({ex.weekday})</span>
                          </div>
                        </div>

                        <div className="std-pm-item">
                          <Clock size={13} className="std-pm-icon" />
                          <div>
                            <span className="std-pm-lbl">Session Time</span>
                            <span className="std-pm-val">{ex.time}</span>
                          </div>
                        </div>

                        <div className="std-pm-item">
                          <MapPin size={13} className="std-pm-icon" />
                          <div>
                            <span className="std-pm-lbl">Venue / Room</span>
                            <span className="std-pm-val">{ex.hall}</span>
                          </div>
                        </div>

                        <div className="std-pm-item">
                          <User size={13} className="std-pm-icon" />
                          <div>
                            <span className="std-pm-lbl">Seat &amp; Proctor</span>
                            <span className="std-pm-val">{ex.seatNo} • {ex.invigilator}</span>
                          </div>
                        </div>
                      </div>

                      <div className="std-paper-card-footer">
                        <span className="std-marks-tag">Max: {ex.maxMarks} Marks (Pass: {ex.passingMarks})</span>
                        <button
                          type="button"
                          className="std-exam-cal-add-btn"
                          onClick={() => handleAddToCalendar(ex)}
                          title="Add paper to calendar file"
                        >
                          <CalendarPlus size={14} /> Add Reminder
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Table View */
                <div className="std-table-wrapper">
                  <table className="std-papers-table">
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Subject Title</th>
                        <th>Category</th>
                        <th>Exam Date</th>
                        <th>Time Slot</th>
                        <th>Assigned Hall</th>
                        <th>Invigilator</th>
                        <th>Max Marks</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExams.map((ex) => (
                        <tr key={ex.id} className={ex.status === "today" ? "is-today" : ""}>
                          <td><span className="std-table-code">{ex.code}</span></td>
                          <td>
                            <strong>{ex.subject}</strong>
                            <small className="std-table-sub">{ex.syllabus}</small>
                          </td>
                          <td>
                            <span className={`std-cat-tag ${ex.category}`}>
                              {ex.category}
                            </span>
                          </td>
                          <td>
                            <div className="std-tbl-datetime">
                              <span>{ex.formattedDate}</span>
                              <small>{ex.weekday}</small>
                            </div>
                          </td>
                          <td>{ex.time}</td>
                          <td>
                            <div className="std-tbl-hall">
                              <MapPin size={13} />
                              <span>{ex.hall}</span>
                            </div>
                          </td>
                          <td>{ex.invigilator}</td>
                          <td><strong>{ex.maxMarks}</strong></td>
                          <td>
                            <button
                              type="button"
                              className="std-tbl-icon-btn"
                              onClick={() => handleAddToCalendar(ex)}
                              title="Add to calendar"
                            >
                              <CalendarPlus size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* 5. Tab Content: ADMIT CARD / HALL TICKET */}
      {activeTab === "hall_ticket" && (
        <div className="std-exam-tab-pane">
          {/* Action Toolbar */}
          <div className="std-hall-ticket-toolbar">
            <div className="std-ht-info-banner">
              <ShieldCheck size={20} className="std-ht-shield-icon" />
              <div>
                <h4>Official Examination Hall Ticket Sanctioned &amp; Verified</h4>
                <p>Present this document in digital or printed format alongside your university ID card at all examination sessions.</p>
              </div>
            </div>

            <div className="std-ht-actions">
              <button
                type="button"
                className="std-exam-btn primary"
                onClick={handlePrintAdmitCard}
              >
                <Printer size={16} /> Print Official Hall Ticket
              </button>
              <button
                type="button"
                className="std-exam-btn secondary"
                onClick={handleExportCsv}
              >
                <Download size={16} /> Export Paper Schedule
              </button>
            </div>
          </div>

          {/* Printable Official University Admit Card */}
          <article className="std-official-hall-ticket" id="subharti-official-admit-card">
            {/* University Crest Header */}
            <div className="std-ht-header">
              <div className="std-ht-crest-area">
                <div className="std-ht-crest-logo">
                  <GraduationCap size={36} />
                </div>
                <div className="std-ht-university-titles">
                  <h2>SWAMI VIVEKANAND SUBHARTI UNIVERSITY</h2>
                  <h3>POLYTECHNIC DIPLOMA EXAMINATION CELL</h3>
                  <p>Subhartipuram, NH-58, Delhi-Haridwar Bypass Road, Meerut, Uttar Pradesh - 250005</p>
                  <span className="std-ht-doc-title">
                    OFFICIAL EXAMINATION ADMIT CARD / DIGITAL HALL TICKET • AUTUMN SESSION 2026-2027
                  </span>
                </div>
              </div>

              {/* Barcode & Security Stamp */}
              <div className="std-ht-security-block">
                <div className="std-ht-barcode-placeholder">
                  <div className="std-barcode-bars" />
                  <span className="std-barcode-text">*SVSU-2024-POLY-CSE-042*</span>
                </div>
                <div className="std-ht-qr-box">
                  <QrCode size={56} />
                  <span>Scan to Authenticate</span>
                </div>
              </div>
            </div>

            {/* Candidate Details Grid */}
            <div className="std-ht-candidate-details-grid">
              <div className="std-ht-photo-box">
                <div className="std-ht-photo-inner">
                  <User size={52} />
                  <span>Candidate Photo Verified</span>
                </div>
                <div className="std-ht-cand-signature-placeholder">
                  <span className="std-sig-label">Candidate Signature</span>
                </div>
              </div>

              <div className="std-ht-data-columns">
                <div className="std-ht-data-row">
                  <div className="std-ht-field">
                    <span className="std-ht-field-label">Candidate Full Name</span>
                    <strong className="std-ht-field-val">{currentUser?.fullName || "Satyam Kumar"}</strong>
                  </div>
                  <div className="std-ht-field">
                    <span className="std-ht-field-label">Roll Number</span>
                    <strong className="std-ht-field-val highlight">{currentUser?.rollNo || "2024-POLY-CSE-042"}</strong>
                  </div>
                  <div className="std-ht-field">
                    <span className="std-ht-field-label">Enrollment Number</span>
                    <strong className="std-ht-field-val">{currentUser?.enrollmentNo || "SVSU/2024/09842"}</strong>
                  </div>
                </div>

                <div className="std-ht-data-row">
                  <div className="std-ht-field">
                    <span className="std-ht-field-label">Father / Guardian Name</span>
                    <strong className="std-ht-field-val">{currentUser?.fatherName || "Shri Rameshwar Kumar"}</strong>
                  </div>
                  <div className="std-ht-field">
                    <span className="std-ht-field-label">Academic Program</span>
                    <strong className="std-ht-field-val">Polytechnic Diploma in Engineering</strong>
                  </div>
                  <div className="std-ht-field">
                    <span className="std-ht-field-label">Branch / Department</span>
                    <strong className="std-ht-field-val">{currentUser?.branch || "Computer Science & Engineering"}</strong>
                  </div>
                </div>

                <div className="std-ht-data-row">
                  <div className="std-ht-field">
                    <span className="std-ht-field-label">Semester / Term</span>
                    <strong className="std-ht-field-val">{currentUser?.semester || "Semester 5 (Final Year)"}</strong>
                  </div>
                  <div className="std-ht-field">
                    <span className="std-ht-field-label">Candidate Category</span>
                    <strong className="std-ht-field-val">Regular Enrolled Student</strong>
                  </div>
                  <div className="std-ht-field">
                    <span className="std-ht-field-label">Examination Center</span>
                    <strong className="std-ht-field-val">Main Academic Block, Subharti Polytechnic (Center Code: 084)</strong>
                  </div>
                </div>

                {/* Clearance Badges */}
                <div className="std-ht-clearances-row">
                  <span className="std-ht-pill green">
                    <CheckCircle2 size={13} /> Attendance Verified: 84.6% (≥ 75%)
                  </span>
                  <span className="std-ht-pill green">
                    <CheckCircle2 size={13} /> Accounts &amp; Fee Cleared (Receipt #SV-EX26-9042)
                  </span>
                  <span className="std-ht-pill blue">
                    <CheckCircle2 size={13} /> HOD Sanction Endorsed (Dept of CSE)
                  </span>
                </div>
              </div>
            </div>

            {/* Admitted Papers Table */}
            <div className="std-ht-table-section">
              <h4 className="std-ht-subheading">Coursework Papers Admitted for Autumn 2026 Examination</h4>
              <table className="std-ht-table">
                <thead>
                  <tr>
                    <th>Paper Code</th>
                    <th>Course Subject Title</th>
                    <th>Assessment Category</th>
                    <th>Exam Date</th>
                    <th>Session Timing</th>
                    <th>Assigned Hall</th>
                    <th>Seat Desk</th>
                    <th>Invigilator Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {displayExams.map((ex) => (
                    <tr key={ex.id}>
                      <td><strong>{ex.code}</strong></td>
                      <td>{ex.subject}</td>
                      <td>
                        <span className={`std-ht-category-tag ${ex.category}`}>
                          {ex.examType}
                        </span>
                      </td>
                      <td>{ex.formattedDate}</td>
                      <td>{ex.time}</td>
                      <td>{ex.hall}</td>
                      <td><strong>{ex.seatNo}</strong></td>
                      <td className="std-ht-sign-box">
                        <div className="std-ht-sign-area" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Instructions on Hall Ticket */}
            <div className="std-ht-instructions-box">
              <h5>IMPORTANT INSTRUCTIONS FOR THE CANDIDATE</h5>
              <ol>
                <li>Candidate MUST report to the designated hall 30 minutes before session commencement. Gates close 15 minutes after start.</li>
                <li>Digital devices, smartwatches, programmable calculators, bags, and loose study notes are STRICTLY PROHIBITED inside the hall.</li>
                <li>Verify your answer booklet serial number and sign the attendance register against your photograph and seat number.</li>
                <li>Any discrepancy in Candidate Name, Enrollment No, or Subject Papers must be reported to the Center Superintendent before exam commencement.</li>
              </ol>
            </div>

            {/* Institutional Signatures & Seal */}
            <div className="std-ht-signatures-footer">
              <div className="std-ht-sign-column">
                <div className="std-ht-sign-line" />
                <span>Candidate’s Signature</span>
                <small>(To be signed in presence of Invigilator)</small>
              </div>

              <div className="std-ht-seal-column">
                <div className="std-ht-official-seal">
                  <span>EXAMINATION CELL</span>
                  <strong>SEAL</strong>
                  <small>SVSU MEERUT</small>
                </div>
              </div>

              <div className="std-ht-sign-column">
                <div className="std-ht-sign-line signed">
                  <span className="std-ht-digital-signature">Dr. P.K. Agarwal</span>
                </div>
                <span>Controller of Examinations</span>
                <small>Swami Vivekanand Subharti University</small>
              </div>
            </div>
          </article>
        </div>
      )}

      {/* 6. Tab Content: ASSESSMENTS & RESULTS */}
      {activeTab === "assessments" && (
        <div className="std-exam-tab-pane">
          {/* Top Assessment Overview */}
          <div className="std-assessments-grid">
            {/* Section 7: Internal Assessment Marks */}
            <div className="std-card-box std-internals-card">
              <div className="std-card-header-clean">
                <div>
                  <h3 className="std-card-title">
                    <FileCheck size={18} className="std-accent-icon" />
                    Continuous Internal Evaluation (CIE) Ledger
                  </h3>
                  <p className="std-card-subtitle">
                    Sessional test scores, continuous quizzes, lab evaluations, and attendance credits
                  </p>
                </div>
                <span className="std-badge-pill green">
                  <CheckCircle2 size={13} /> Sessional Standing: Cleared
                </span>
              </div>

              <div className="std-table-wrapper">
                <table className="std-assess-table">
                  <thead>
                    <tr>
                      <th>Course Code &amp; Subject</th>
                      <th>Sessional 1 (20)</th>
                      <th>Sessional 2 (20)</th>
                      <th>Quiz &amp; Assignments (10)</th>
                      <th>Attd. Credit (5)</th>
                      <th>Total Internal (50)</th>
                      <th>Expected Grade</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SEED_ASSESSMENTS.map((a) => (
                      <tr key={a.code}>
                        <td>
                          <strong>{a.code}</strong>
                          <span className="std-sub-inline">{a.subject}</span>
                        </td>
                        <td><strong>{a.sessional1}</strong> / 20</td>
                        <td><strong>{a.sessional2}</strong> / 20</td>
                        <td>{a.quizzes + a.assignments} / 10</td>
                        <td>{a.attendanceMarks} / 5</td>
                        <td>
                          <strong className="std-text-highlight">{a.internalTotal} / 50</strong>
                          <span className="std-pct-sub">({Math.round((a.internalTotal / a.internalMax) * 100)}%)</span>
                        </td>
                        <td>
                          <span className={`std-grade-pill grade-${a.predictedGrade.toLowerCase().replace("+", "-plus")}`}>
                            {a.predictedGrade}
                          </span>
                        </td>
                        <td>
                          <span className="std-status-pill success">{a.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 13: SGPA / CGPA Progression History */}
            <div className="std-card-box std-cgpa-history-card">
              <div className="std-card-header-clean">
                <div>
                  <h3 className="std-card-title">
                    <TrendingUp size={18} className="std-accent-icon" />
                    SGPA &amp; CGPA Progression History
                  </h3>
                  <p className="std-card-subtitle">
                    Cumulative grade point average trajectory across completed semesters
                  </p>
                </div>
                <div className="std-cgpa-hero-badge">
                  <span>Current CGPA</span>
                  <strong>8.64</strong>
                </div>
              </div>

              {/* Visual SVG Progression Graph */}
              <div className="std-cgpa-chart-container">
                <div className="std-cgpa-bars">
                  {SEED_GPA_HISTORY.map((item, idx) => {
                    const heightPct = Math.round((item.sgpa / 10) * 100);
                    return (
                      <div key={item.semester} className="std-cgpa-bar-col">
                        <div className="std-cgpa-val-bubble">{item.sgpa}</div>
                        <div className="std-cgpa-bar-track">
                          <div
                            className={`std-cgpa-bar-fill ${idx === SEED_GPA_HISTORY.length - 1 ? "projected" : ""}`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="std-cgpa-sem-label">{item.semester.replace("Semester ", "Sem ")}</span>
                        <small className="std-cgpa-credits">{item.credits} Credits</small>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Semester Breakdown Cards */}
              <div className="std-cgpa-breakdown-list">
                {SEED_GPA_HISTORY.map((item) => (
                  <div key={item.semester} className="std-cgpa-row-item">
                    <div className="std-cgpa-row-info">
                      <strong>{item.semester}</strong>
                      <small>{item.credits} Credits Earned • {item.status}</small>
                    </div>
                    <div className="std-cgpa-row-scores">
                      <div className="std-score-chip">
                        <span>SGPA</span>
                        <strong>{item.sgpa}</strong>
                      </div>
                      <div className="std-score-chip">
                        <span>CGPA</span>
                        <strong>{item.cgpa}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 14: Backlog and Reappear Examination Tracking */}
            <div className="std-card-box std-backlog-tracker-card">
              <div className="std-card-header-clean">
                <div>
                  <h3 className="std-card-title">
                    <CheckCircle2 size={18} className="std-accent-icon green" />
                    Backlog &amp; Reappear Examination Audit
                  </h3>
                  <p className="std-card-subtitle">
                    Academic clearing tracking, carry-over eligibility, and degree progress
                  </p>
                </div>
                <span className="std-badge-pill green">0 Active Backlogs</span>
              </div>

              <div className="std-backlog-stats-row">
                <div className="std-backlog-metric">
                  <span className="std-bm-label">Active Backlogs</span>
                  <span className="std-bm-val green">0</span>
                  <small>Clean Academic Record</small>
                </div>
                <div className="std-backlog-metric">
                  <span className="std-bm-label">Courses Cleared</span>
                  <span className="std-bm-val">24 / 24</span>
                  <small>100% First Attempt Cleared</small>
                </div>
                <div className="std-backlog-metric">
                  <span className="std-bm-label">Total Credits Earned</span>
                  <span className="std-bm-val">92 Credits</span>
                  <small>Target: 108 Credits</small>
                </div>
                <div className="std-backlog-metric">
                  <span className="std-bm-label">Degree Standing</span>
                  <span className="std-bm-val blue">Eligible on-Time</span>
                  <small>Subharti Class of 2027</small>
                </div>
              </div>

              <div className="std-backlog-info-box">
                <Info size={16} className="std-info-icon" />
                <p>
                  <strong>Carry-over Examination Ordinance:</strong> In case of any paper backlog, special reappear examinations are conducted immediately preceding the odd/even semester cycles. Your academic record is currently 100% clear with zero pending backlogs.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Tab Content: EXAM FORM & FEE STATUS */}
      {activeTab === "registration" && (
        <div className="std-exam-tab-pane">
          <div className="std-form-fee-grid">
            {/* Section 10: Examination Form & Application Status */}
            <div className="std-card-box std-exam-form-card">
              <div className="std-card-header-clean">
                <div>
                  <h3 className="std-card-title">
                    <FileCheck size={18} className="std-accent-icon" />
                    Examination Form &amp; Registration Status
                  </h3>
                  <p className="std-card-subtitle">
                    Official candidate registration, verification timeline, and gazette status
                  </p>
                </div>
                <span className="std-badge-pill green">
                  <CheckCircle2 size={13} /> Form Approved
                </span>
              </div>

              <div className="std-form-details-summary">
                <div className="std-fds-row">
                  <span className="std-fds-lbl">Form Application ID:</span>
                  <strong>SVSU-EXAM-2026-AUTUMN-5042</strong>
                </div>
                <div className="std-fds-row">
                  <span className="std-fds-lbl">Application Type:</span>
                  <span>Regular Semester V Examination Form</span>
                </div>
                <div className="std-fds-row">
                  <span className="std-fds-lbl">Submission Date:</span>
                  <span>12 October 2026, 04:15 PM</span>
                </div>
                <div className="std-fds-row">
                  <span className="std-fds-lbl">Endorsing Authority:</span>
                  <span>Head of Department, Computer Science &amp; Engineering</span>
                </div>
                <div className="std-fds-row">
                  <span className="std-fds-lbl">Official Gazette Status:</span>
                  <span className="std-status-pill success">Gazetted &amp; Seating Allocated</span>
                </div>
              </div>

              {/* Stepper Timeline */}
              <div className="std-registration-stepper">
                <div className="std-step completed">
                  <div className="std-step-circle"><Check size={14} /></div>
                  <div className="std-step-content">
                    <strong>1. Form Submission</strong>
                    <small>Completed on 12 Oct</small>
                  </div>
                </div>

                <div className="std-step completed">
                  <div className="std-step-circle"><Check size={14} /></div>
                  <div className="std-step-content">
                    <strong>2. HOD Verification</strong>
                    <small>Approved by Dept of CSE</small>
                  </div>
                </div>

                <div className="std-step completed">
                  <div className="std-step-circle"><Check size={14} /></div>
                  <div className="std-step-content">
                    <strong>3. Fee Clearance</strong>
                    <small>Accounts Settled #SV-9042</small>
                  </div>
                </div>

                <div className="std-step completed">
                  <div className="std-step-circle"><Check size={14} /></div>
                  <div className="std-step-content">
                    <strong>4. Hall Ticket Issued</strong>
                    <small>Active &amp; Ready to Print</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 11: Examination Fee & Payment Status */}
            <div className="std-card-box std-fee-status-card">
              <div className="std-card-header-clean">
                <div>
                  <h3 className="std-card-title">
                    <CreditCard size={18} className="std-accent-icon" />
                    Examination Fee &amp; Verified Payment
                  </h3>
                  <p className="std-card-subtitle">
                    Subharti University accounts clearance and transaction verification
                  </p>
                </div>
                <span className="std-badge-pill green">
                  <CheckCircle2 size={13} /> Paid &amp; Verified
                </span>
              </div>

              <div className="std-fee-amount-card">
                <span className="std-fee-card-tag">Examination Registration Fee</span>
                <div className="std-fee-big-val">
                  <span>₹2,500.00</span>
                  <span className="std-fee-paid-badge">
                    <CheckCircle2 size={14} /> Fully Paid
                  </span>
                </div>
                <p className="std-fee-note">
                  Includes Semester 5 Theory Papers, Practical Lab Assessment, and External Viva Voce fees.
                </p>
              </div>

              <div className="std-fee-breakdown-details">
                <div className="std-fbd-row">
                  <span>Transaction Reference ID:</span>
                  <code>TXN-SVSU-20261014-99812</code>
                </div>
                <div className="std-fbd-row">
                  <span>Payment Gateway:</span>
                  <span>Subharti Institutional NetBanking / UPI</span>
                </div>
                <div className="std-fbd-row">
                  <span>Date &amp; Time Settled:</span>
                  <span>14 October 2026, 11:24 AM IST</span>
                </div>
                <div className="std-fbd-row">
                  <span>Bank Authorization Code:</span>
                  <code>AUTH-HDFC-882194</code>
                </div>
              </div>

              <div className="std-fee-actions">
                <button
                  type="button"
                  className="std-exam-btn primary small"
                  onClick={() => showToast?.("Fee Payment Receipt PDF downloaded.")}
                >
                  <FileDown size={14} /> Download Fee Receipt
                </button>
                <button
                  type="button"
                  className="std-exam-btn ghost small"
                  onClick={() => onNavigate?.("fees")}
                >
                  <ExternalLink size={14} /> View General Fee Ledger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Tab Content: INSTRUCTIONS & HELPDESK */}
      {activeTab === "guidelines" && (
        <div className="std-exam-tab-pane">
          <div className="std-guidelines-grid">
            {/* Section 6: Official Instructions & Code of Conduct */}
            <div className="std-card-box std-instructions-card">
              <div className="std-card-header-clean">
                <div>
                  <h3 className="std-card-title">
                    <ShieldCheck size={18} className="std-accent-icon" />
                    Candidate Code of Conduct &amp; Examination Instructions
                  </h3>
                  <p className="std-card-subtitle">
                    Statutory guidelines governed by the Controller of Examinations and Proctorial Board
                  </p>
                </div>
              </div>

              <div className="std-instructions-list">
                {CODE_OF_CONDUCT.map((rule, idx) => (
                  <div key={rule.title} className="std-instruction-item">
                    <div className="std-inst-num">{idx + 1}</div>
                    <div className="std-inst-body">
                      <strong>{rule.title}</strong>
                      <p>{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 15: Download Center */}
            <div className="std-card-box std-downloads-card">
              <div className="std-card-header-clean">
                <div>
                  <h3 className="std-card-title">
                    <Download size={18} className="std-accent-icon" />
                    Examination Download Center
                  </h3>
                  <p className="std-card-subtitle">
                    Official gazetted circulars, blueprints, and solved sample question banks
                  </p>
                </div>
              </div>

              <div className="std-downloads-list">
                {DOWNLOADABLE_RESOURCES.map((res) => (
                  <div key={res.id} className="std-download-item">
                    <div className="std-dl-icon-wrap">
                      <FileText size={20} />
                      <span className="std-dl-format">{res.type}</span>
                    </div>

                    <div className="std-dl-content">
                      <strong>{res.title}</strong>
                      <p>{res.description}</p>
                      <div className="std-dl-meta">
                        <span>{res.size}</span>
                        <span>•</span>
                        <span>{res.version}</span>
                        <span>•</span>
                        <span>{res.dept}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="std-dl-btn"
                      onClick={() => showToast?.(`Downloading ${res.title}...`)}
                      aria-label={`Download ${res.title}`}
                    >
                      <Download size={16} />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 16: Examination Notifications */}
            <div className="std-card-box std-notices-card">
              <div className="std-card-header-clean">
                <div>
                  <h3 className="std-card-title">
                    <Bell size={18} className="std-accent-icon" />
                    Gazetted Examination Notifications &amp; Circulars
                  </h3>
                  <p className="std-card-subtitle">
                    Official circulars issued by the Controller of Examinations
                  </p>
                </div>
              </div>

              <div className="std-notices-list">
                {NOTIFICATIONS.map((n) => (
                  <div key={n.id} className="std-notice-item">
                    <div className="std-notice-top">
                      <span className="std-notice-cat">{n.category}</span>
                      <span className={`std-notice-badge ${n.badge.toLowerCase()}`}>{n.badge}</span>
                      <span className="std-notice-date">{n.date}</span>
                    </div>
                    <h4>{n.title}</h4>
                    <p>{n.body}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 17: Examination Helpdesk & Grievance Redressal */}
            <div className="std-card-box std-helpdesk-card">
              <div className="std-card-header-clean">
                <div>
                  <h3 className="std-card-title">
                    <MessageSquare size={18} className="std-accent-icon" />
                    Examination Cell Helpdesk &amp; Grievance Redressal
                  </h3>
                  <p className="std-card-subtitle">
                    Submit questions, report timetable conflicts, or address admit card discrepancies
                  </p>
                </div>
              </div>

              <form onSubmit={handleGrievanceSubmit} className="std-grievance-form">
                <div className="std-form-row-2">
                  <div className="std-form-field">
                    <label htmlFor="grievance-category">Issue Category</label>
                    <select
                      id="grievance-category"
                      value={grievanceForm.category}
                      onChange={(e) => setGrievanceForm({ ...grievanceForm, category: e.target.value })}
                    >
                      <option value="Admit Card Discrepancy">Admit Card / Personal Detail Discrepancy</option>
                      <option value="Timetable Conflict">Timetable / Seating Conflict</option>
                      <option value="Internal Assessment Query">Internal Assessment Re-verification</option>
                      <option value="Examination Fee Clearance">Fee Clearance / Receipt Issue</option>
                      <option value="Special Accommodation">Special Medical Accommodation</option>
                    </select>
                  </div>

                  <div className="std-form-field">
                    <label htmlFor="grievance-subject">Related Subject Paper</label>
                    <select
                      id="grievance-subject"
                      value={grievanceForm.subjectCode}
                      onChange={(e) => setGrievanceForm({ ...grievanceForm, subjectCode: e.target.value })}
                    >
                      {displayExams.map((ex) => (
                        <option key={ex.code} value={ex.code}>
                          {ex.code} — {ex.subject}
                        </option>
                      ))}
                      <option value="General">General Examination Query</option>
                    </select>
                  </div>
                </div>

                <div className="std-form-field">
                  <label htmlFor="grievance-desc">Description of Inquiry / Grievance</label>
                  <textarea
                    id="grievance-desc"
                    rows={3}
                    value={grievanceForm.description}
                    onChange={(e) => setGrievanceForm({ ...grievanceForm, description: e.target.value })}
                    placeholder="Provide exact details of the discrepancy or query. Attach roll number and paper code..."
                  />
                </div>

                <div className="std-form-submit-row">
                  <div className="std-helpdesk-contact-info">
                    <LifeBuoy size={15} />
                    <span>Exam Cell Helpline: <strong>+91 (0121) 2439052</strong> • Room 102 Main Academic Block</span>
                  </div>
                  <button
                    type="submit"
                    className="std-exam-btn primary"
                    disabled={submittingGrievance}
                  >
                    <Send size={15} />
                    <span>{submittingGrievance ? "Submitting Ticket..." : "Submit Grievance Ticket"}</span>
                  </button>
                </div>
              </form>

              {/* Submitted Grievance Tracking List */}
              {submittedTickets.length > 0 && (
                <div className="std-submitted-tickets-list">
                  <h5>Active Grievance Tickets</h5>
                  {submittedTickets.map((t) => (
                    <div key={t.id} className="std-ticket-item">
                      <div className="std-tkt-header">
                        <span className="std-tkt-id">#{t.id}</span>
                        <span className="std-tkt-cat">{t.category}</span>
                        <span className="std-tkt-date">{t.date}</span>
                        <span className="std-status-pill success">{t.status}</span>
                      </div>
                      <p className="std-tkt-subject">{t.subject}</p>
                      <small className="std-tkt-remarks">{t.remarks}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
