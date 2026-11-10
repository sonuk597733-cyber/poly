import React, { useState, useEffect } from "react";
import {
  CalendarCheck2,
  Award,
  FileText,
  Clock,
  Bell,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Send,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Percent,
  BookOpen,
  GraduationCap,
  Briefcase,
  TrendingUp
} from "lucide-react";
import { authApi } from "../services/authApi";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import StatCard from "../components/dashboard/StatCard";
import StatusBadge from "../components/dashboard/StatusBadge";
import {
  AreaTrendChart,
  BarMetricChart,
  DonutProgressChart
} from "../components/dashboard/Charts";
import StudentsDirectory from "./StudentsDirectory";
import FacultyDirectory from "./FacultyDirectory";
import StudentPublicProfile from "./StudentPublicProfile";
import {
  StudentDashboard,
  StudentProfile,
  StudentAttendance,
  StudentSubjectAttendance,
  StudentResults,
  StudentAssignments,
  StudentNotes,
  StudentLectures,
  StudentTimetable,
  StudentNotices,
  StudentLeaves,
  StudentNotifications,
  StudentExams,
  StudentFees,
  StudentLibrary,
  StudentFeedback,
  StudentSettings
} from "./student";
import {
  TeacherDashboard,
  TeacherProfile,
  TeacherAttendance,
  TeacherStudents,
  TeacherAssignments,
  TeacherSubmissions,
  TeacherNotes,
  TeacherLectures,
  TeacherTimetable,
  TeacherMarks,
  TeacherLeaves,
  TeacherNotices,
  TeacherClasses,
  TeacherReports,
  TeacherNotifications,
  TeacherSettings
} from "./teacher";
import {
  HODDashboard,
  HODProfile,
  HODDepartment,
  HODStudents,
  HODTeachers,
  HODAttendance,
  HODResults,
  HODMaterials,
  HODTimetable,
  HODLeaves,
  HODNotices,
  HODReports,
  HODNotifications,
  HODSettings
} from "./hod";
import {
  CoordinatorDashboard,
  CoordinatorProfile,
  CoordinatorStudents,
  CoordinatorFaculty,
  CoordinatorCalendar,
  CoordinatorTimetable,
  CoordinatorRooms,
  CoordinatorExams,
  CoordinatorAttendance,
  CoordinatorAssignments,
  CoordinatorLeaves,
  CoordinatorApprovals,
  CoordinatorNotices,
  CoordinatorReports,
  CoordinatorNotifications,
  CoordinatorSettings
} from "./coordinator";
import {
  PrincipalDashboard,
  PrincipalProfile,
  PrincipalStudents,
  PrincipalFaculty,
  PrincipalAttendance,
  PrincipalApprovals,
  PrincipalReports,
  PrincipalTimetable,
  PrincipalNotices,
  PrincipalSettings,
  PrincipalExams
} from "./principal";
import {
  AdminDashboard,
  AdminUsers,
  AdminRoles,
  AdminBranches,
  AdminAudit,
  AdminSettings,
  AdminReports,
  AdminProfile,
  AdminNotices,
  AdminExams
} from "./admin";
import "./Dashboard.css";

export default function Dashboard({
  onNavigate,
  onNavigatePage,
  initialTab = "overview",
  initialStudentId = null
}) {
  const [currentUser, setCurrentUser] = useState(() => authApi.getCurrentUser());
  const [activeTab, setActiveTab] = useState(initialTab);
  const [studentProfileId, setStudentProfileId] = useState(initialStudentId);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialStudentId) {
      setStudentProfileId(initialStudentId);
    }
  }, [initialStudentId]);

  // Sub-view data states
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [examRecords, setExamRecords] = useState([]);
  const [assignmentRecords, setAssignmentRecords] = useState([]);
  const [timetableDays, setTimetableDays] = useState([]);
  const [selectedTimetableDay, setSelectedTimetableDay] = useState("Monday");
  const [leavesList, setLeavesList] = useState([]);
  const [noticesList, setNoticesList] = useState([]);
  const [managementUsersList, setManagementUsersList] = useState([]);

  // Form states
  const [leaveType, setLeaveType] = useState("Medical");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // New assignment form state (for teachers)
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [asgnTitle, setAsgnTitle] = useState("");
  const [asgnDesc, setAsgnDesc] = useState("");
  const [asgnBranch, setAsgnBranch] = useState("CSE");
  const [asgnSem, setAsgnSem] = useState("Semester 5");
  const [asgnSub, setAsgnSub] = useState("Operating Systems");
  const [asgnDue, setAsgnDue] = useState("");

  // Student submission form state
  const [selectedAssignmentForSubmit, setSelectedAssignmentForSubmit] = useState(null);
  const [studentSubmissionText, setStudentSubmissionText] = useState("");
  const [submittingAsgn, setSubmittingAsgn] = useState(false);

  // Notice form state
  const [showCreateNotice, setShowCreateNotice] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeCategory, setNoticeCategory] = useState("Academic");
  const [noticePriority, setNoticePriority] = useState("normal");

  // Attendance Register interactive state (for teachers)
  const [showAttendanceRegister, setShowAttendanceRegister] = useState(false);
  const [attRegisterBranch, setAttRegisterBranch] = useState("CSE");
  const [attRegisterSem, setAttRegisterSem] = useState("Semester 5");
  const [attRegisterYear, setAttRegisterYear] = useState("3rd Year");
  const [attRegisterSubject, setAttRegisterSubject] = useState("Operating Systems");
  const [attRegisterDate, setAttRegisterDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [attClassStudents, setAttClassStudents] = useState([]);
  const [attStudentStatuses, setAttStudentStatuses] = useState({});
  const [attStudentRemarks, setAttStudentRemarks] = useState({});
  const [attLoadingRoster, setAttLoadingRoster] = useState(false);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  // Marks Entry state (for teachers/staff)
  const [showCreateMark, setShowCreateMark] = useState(false);
  const [markStudentId, setMarkStudentId] = useState("");
  const [markSubject, setMarkSubject] = useState("Operating Systems");
  const [markExamType, setMarkExamType] = useState("Mid Term 1");
  const [markMax, setMarkMax] = useState(50);
  const [markObtained, setMarkObtained] = useState("");
  const [markRemarks, setMarkRemarks] = useState("");
  const [submittingMark, setSubmittingMark] = useState(false);

  // Submissions Review & Grading state (for teachers)
  const [viewingAssignmentSubmissions, setViewingAssignmentSubmissions] = useState(null);
  const [gradingStudentId, setGradingStudentId] = useState(null);
  const [gradeScore, setGradeScore] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [submittingGrade, setSubmittingGrade] = useState(false);

  // Course Materials & Video Lectures state
  const [materialsList, setMaterialsList] = useState([]);
  const [materialFilterType, setMaterialFilterType] = useState("all");
  const [showCreateMaterial, setShowCreateMaterial] = useState(false);
  const [matTitle, setMatTitle] = useState("");
  const [matDesc, setMatDesc] = useState("");
  const [matType, setMatType] = useState("notes");
  const [matBranch, setMatBranch] = useState("CSE");
  const [matYear, setMatYear] = useState("3rd Year");
  const [matSem, setMatSem] = useState("Semester 5");
  const [matSubject, setMatSubject] = useState("Operating Systems");
  const [matFileUrl, setMatFileUrl] = useState("");
  const [matVideoUrl, setMatVideoUrl] = useState("");
  const [submittingMaterial, setSubmittingMaterial] = useState(false);

  // Load user & dashboard summary
  useEffect(() => {
    let ignore = false;

    // Verify session
    authApi
      .getMe()
      .then((user) => {
        if (!ignore) {
          if (!user) {
            onNavigate?.("login");
            return;
          }
          setCurrentUser(user);
        }
      })
      .catch(() => {
        if (!ignore) onNavigate?.("login");
      });

    // Fetch primary stats & charts with graceful fallback timeout
    const fallbackTimer = setTimeout(() => {
      if (!ignore) setLoading(false);
    }, 1000);

    Promise.all([authApi.getDashboardStats(), authApi.getDashboardCharts()])
      .then(([statsRes, chartsRes]) => {
        if (!ignore) {
          clearTimeout(fallbackTimer);
          setStats(statsRes);
          setCharts(chartsRes?.charts || null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          clearTimeout(fallbackTimer);
          setErrorMsg(err.message || "Failed to load dashboard metrics.");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
      clearTimeout(fallbackTimer);
    };
  }, [onNavigate]);

  // Load specific sub-tab data when tab changes
  useEffect(() => {
    let ignore = false;
    setErrorMsg("");

    if (activeTab === "attendance") {
      authApi
        .getAttendance()
        .then((res) => {
          if (!ignore && res?.records) setAttendanceRecords(res.records);
        })
        .catch(() => {});
    } else if (activeTab === "exams") {
      authApi
        .getExams()
        .then((res) => {
          if (!ignore && res?.marks) setExamRecords(res.marks);
        })
        .catch(() => {});
    } else if (activeTab === "assignments") {
      authApi
        .getAssignments()
        .then((res) => {
          if (!ignore && res?.assignments) setAssignmentRecords(res.assignments);
        })
        .catch(() => {});
    } else if (activeTab === "timetable") {
      authApi
        .getTimetable()
        .then((res) => {
          if (!ignore && res?.timetable) setTimetableDays(res.timetable);
        })
        .catch(() => {});
    } else if (activeTab === "leaves") {
      authApi
        .getLeaves()
        .then((res) => {
          if (!ignore && res?.leaves) setLeavesList(res.leaves);
        })
        .catch(() => {});
    } else if (activeTab === "notices") {
      authApi
        .getNotices()
        .then((res) => {
          if (!ignore && res?.notices) setNoticesList(res.notices);
        })
        .catch(() => {});
    } else if (activeTab === "users") {
      authApi
        .getManagementUsers()
        .then((res) => {
          if (!ignore && res?.users) setManagementUsersList(res.users);
        })
        .catch(() => {});
    } else if (activeTab === "subjects") {
      authApi
        .getMaterials()
        .then((res) => {
          if (!ignore && res?.materials) setMaterialsList(res.materials);
        })
        .catch(() => {});
    }

    return () => {
      ignore = true;
    };
  }, [activeTab]);

  // Toast auto-clear
  const showToast = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 4500);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(""), 4500);
    }
  };

  // Leave Submit Handler
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd || !leaveReason.trim()) {
      showToast("Please provide leave dates and a clear justification.", true);
      return;
    }
    setSubmittingLeave(true);
    try {
      const res = await authApi.applyLeave({
        leaveType,
        startDate: leaveStart,
        endDate: leaveEnd,
        reason: leaveReason
      });
      showToast(res.message || "Leave request submitted to Dean.");
      setLeaveReason("");
      setLeaveStart("");
      setLeaveEnd("");
      // Refresh leaves list
      const updated = await authApi.getLeaves();
      if (updated?.leaves) setLeavesList(updated.leaves);
    } catch (err) {
      showToast(err.message || "Failed to submit leave application.", true);
    } finally {
      setSubmittingLeave(false);
    }
  };

  // Leave Status Update Handler (HOD, Principal, Admin)
  const handleUpdateLeaveStatus = async (leaveId, status) => {
    try {
      await authApi.updateLeaveStatus(leaveId, { status });
      showToast(`Leave application marked as ${status}.`);
      setLeavesList((prev) =>
        prev.map((l) => (l._id === leaveId ? { ...l, status } : l))
      );
    } catch (err) {
      showToast(err.message || "Failed to update leave status.", true);
    }
  };

  // Create Assignment Handler (Faculty)
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!asgnTitle || !asgnDesc || !asgnDue) {
      showToast("Please fill in title, description, and due date.", true);
      return;
    }
    try {
      await authApi.createAssignment({
        title: asgnTitle,
        description: asgnDesc,
        branch: asgnBranch,
        semester: asgnSem,
        subject: asgnSub,
        dueDate: asgnDue
      });
      showToast("Assignment published to students successfully!");
      setShowCreateAssignment(false);
      setAsgnTitle("");
      setAsgnDesc("");
      const updated = await authApi.getAssignments();
      if (updated?.assignments) setAssignmentRecords(updated.assignments);
    } catch (err) {
      showToast(err.message || "Failed to create assignment.", true);
    }
  };

  // Submit Assignment Handler (Student)
  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!selectedAssignmentForSubmit) return;
    setSubmittingAsgn(true);
    try {
      await authApi.submitAssignment(selectedAssignmentForSubmit.id, {
        submissionText: studentSubmissionText
      });
      showToast("Assignment solution submitted successfully!");
      setSelectedAssignmentForSubmit(null);
      setStudentSubmissionText("");
      const updated = await authApi.getAssignments();
      if (updated?.assignments) setAssignmentRecords(updated.assignments);
    } catch (err) {
      showToast(err.message || "Failed to submit assignment.", true);
    } finally {
      setSubmittingAsgn(false);
    }
  };

  // Create Notice Handler
  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      showToast("Notice title and content are required.", true);
      return;
    }
    try {
      await authApi.createNotice({
        title: noticeTitle,
        content: noticeContent,
        category: noticeCategory,
        priority: noticePriority
      });
      showToast("Institutional notice published successfully!");
      setShowCreateNotice(false);
      setNoticeTitle("");
      setNoticeContent("");
      const updated = await authApi.getNotices();
      if (updated?.notices) setNoticesList(updated.notices);
    } catch (err) {
      showToast(err.message || "Failed to publish notice.", true);
    }
  };

  // User Status Toggle (Admin)
  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === "verified" || currentStatus === "active" ? "suspended" : "verified";
    try {
      await authApi.updateUserStatus(userId, { status: nextStatus });
      showToast(`User status set to ${nextStatus}.`);
      setManagementUsersList((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status: nextStatus } : u))
      );
    } catch (err) {
      showToast(err.message || "Failed to update account status.", true);
    }
  };

  // Attendance Register Handlers (Teacher / Staff)
  const handleFetchAttendanceRoster = async () => {
    setAttLoadingRoster(true);
    try {
      const res = await authApi.getStudentsDirectory({
        branch: attRegisterBranch,
        semester: attRegisterSem,
        limit: 50
      });
      const roster = res?.students || [];
      setAttClassStudents(roster);
      const initialStatuses = {};
      roster.forEach((s) => {
        initialStatuses[s.id] = "present";
      });
      setAttStudentStatuses(initialStatuses);
      if (roster.length === 0) {
        showToast("No enrolled students found for the selected branch/semester.", true);
      }
    } catch (err) {
      showToast(err.message || "Failed to load class roster.", true);
    } finally {
      setAttLoadingRoster(false);
    }
  };

  const handleMarkAllPresent = () => {
    const updated = {};
    attClassStudents.forEach((s) => {
      updated[s.id] = "present";
    });
    setAttStudentStatuses(updated);
  };

  const handleSetStudentStatus = (studentId, status) => {
    setAttStudentStatuses((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmitAttendanceRegister = async (e) => {
    e.preventDefault();
    if (attClassStudents.length === 0) {
      showToast("Please load the student roster before recording attendance.", true);
      return;
    }
    setSubmittingAttendance(true);
    try {
      const records = attClassStudents.map((s) => ({
        studentId: s.id,
        status: attStudentStatuses[s.id] || "present",
        remarks: attStudentRemarks[s.id] || ""
      }));
      await authApi.markAttendance({
        branch: attRegisterBranch,
        academicYear: attRegisterYear,
        semester: attRegisterSem,
        subject: attRegisterSubject,
        date: attRegisterDate,
        records
      });
      showToast(`Attendance recorded for ${records.length} students!`);
      setShowAttendanceRegister(false);
      const updated = await authApi.getAttendance();
      if (updated?.records) setAttendanceRecords(updated.records);
    } catch (err) {
      showToast(err.message || "Failed to record attendance.", true);
    } finally {
      setSubmittingAttendance(false);
    }
  };

  // Exam Marks Submit Handler (Teacher / Staff)
  const handleSubmitExamMark = async (e) => {
    e.preventDefault();
    if (!markStudentId || !markSubject || markObtained === "") {
      showToast("Please provide student ID, subject, and entered score.", true);
      return;
    }
    setSubmittingMark(true);
    try {
      await authApi.submitExamMark({
        studentId: markStudentId,
        branch: summary.branch || "CSE",
        academicYear: "2nd Year",
        semester: summary.semester || "Semester 3",
        subject: markSubject,
        examType: markExamType,
        maxMarks: Number(markMax) || 100,
        marksObtained: Number(markObtained),
        remarks: markRemarks
      });
      showToast("Examination score recorded in academic ledger successfully!");
      setShowCreateMark(false);
      setMarkObtained("");
      setMarkRemarks("");
      const updated = await authApi.getExams();
      if (updated?.marks) setExamRecords(updated.marks);
    } catch (err) {
      showToast(err.message || "Failed to record examination score.", true);
    } finally {
      setSubmittingMark(false);
    }
  };

  // Grade Assignment Submission Handler (Teacher)
  const handleGradeStudentSubmission = async (e) => {
    e.preventDefault();
    if (!viewingAssignmentSubmissions || !gradingStudentId) return;
    setSubmittingGrade(true);
    try {
      await authApi.gradeAssignment(viewingAssignmentSubmissions.id, {
        studentId: gradingStudentId,
        grade: Number(gradeScore),
        feedback: gradeFeedback
      });
      showToast("Grade and feedback saved successfully!");
      setGradingStudentId(null);
      setGradeScore("");
      setGradeFeedback("");
      const updated = await authApi.getAssignments();
      if (updated?.assignments) {
        setAssignmentRecords(updated.assignments);
        const refreshed = updated.assignments.find((a) => a.id === viewingAssignmentSubmissions.id);
        if (refreshed) setViewingAssignmentSubmissions(refreshed);
      }
    } catch (err) {
      showToast(err.message || "Failed to submit evaluation grade.", true);
    } finally {
      setSubmittingGrade(false);
    }
  };

  // Course Materials Handlers
  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    if (!matTitle.trim() || !matSubject.trim()) {
      showToast("Material title and subject are required.", true);
      return;
    }
    setSubmittingMaterial(true);
    try {
      await authApi.createMaterial({
        title: matTitle,
        description: matDesc,
        type: matType,
        branch: matBranch,
        academicYear: matYear,
        semester: matSem,
        subject: matSubject,
        fileUrl: matFileUrl.trim() || null,
        videoUrl: matVideoUrl.trim() || null
      });
      showToast("Course material published to students successfully!");
      setShowCreateMaterial(false);
      setMatTitle("");
      setMatDesc("");
      setMatFileUrl("");
      setMatVideoUrl("");
      const updated = await authApi.getMaterials();
      if (updated?.materials) setMaterialsList(updated.materials);
    } catch (err) {
      showToast(err.message || "Failed to publish material.", true);
    } finally {
      setSubmittingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (id) => {
    try {
      await authApi.deleteMaterial(id);
      showToast("Course material deleted.");
      setMaterialsList((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      showToast(err.message || "Failed to delete material.", true);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "students") {
      if (onNavigate) onNavigate("students");
      else window.location.hash = "#/students";
    } else if (tab === "faculty" || tab === "all-faculty") {
      if (onNavigate) onNavigate("faculty");
      else window.location.hash = "#/faculty";
    } else if (tab === "overview") {
      if (onNavigate) onNavigate("dashboard");
      else window.location.hash = "#/dashboard";
    } else {
      if (onNavigate) onNavigate("dashboard", tab);
      else window.location.hash = `#/dashboard/${tab}`;
    }
  };

  const handleViewStudentProfile = (studentId) => {
    setStudentProfileId(studentId);
    setActiveTab("student-profile");
    if (onNavigate) {
      onNavigate("student-profile", studentId);
    } else {
      window.location.hash = `#/students/${studentId}`;
    }
  };

  const handleBackFromProfile = () => {
    setActiveTab("students");
    if (onNavigate) {
      onNavigate("students");
    } else {
      window.location.hash = "#/students";
    }
  };

  if (loading) {
    return (
      <div className="dash-loading-screen">
        <Loader2 size={36} className="spinner" />
        <p>Loading CollegeOS authorized workspace...</p>
      </div>
    );
  }

  const role = currentUser?.role || "student";
  const summary = stats?.summary || {};

  return (
    <DashboardLayout
      user={currentUser}
      activeTab={activeTab}
      onNavigateTab={handleTabChange}
      onNavigatePage={onNavigatePage || onNavigate}
    >
      {/* Toast Banner Alerts */}
      {errorMsg && (
        <div className="dash-toast-banner error" role="alert">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="dash-toast-banner success" role="alert">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Role-tailored Student Modular Architecture */}
      {role === "student" ? (
        <div className="student-role-view">
          {activeTab === "overview" && (
            <StudentDashboard
              currentUser={currentUser}
              stats={stats}
              charts={charts}
              onNavigate={onNavigate}
              setActiveTab={handleTabChange}
            />
          )}
          {activeTab === "profile" && (
            <StudentProfile
              currentUser={currentUser}
              onNavigate={onNavigate}
              showToast={showToast}
            />
          )}
          {activeTab === "attendance" && (
            <StudentAttendance stats={stats} currentUser={currentUser} onNavigate={handleTabChange} />
          )}
          {activeTab === "subject-attendance" && (
            <StudentSubjectAttendance stats={stats} currentUser={currentUser} onNavigate={handleTabChange} />
          )}
          {activeTab === "results" && (
            <StudentResults currentUser={currentUser} />
          )}
          {(activeTab === "assignments" || activeTab === "submissions") && (
            <StudentAssignments showToast={showToast} />
          )}
          {(activeTab === "notes" || activeTab === "subjects") && (
            <StudentNotes currentUser={currentUser} showToast={showToast} />
          )}
          {activeTab === "lectures" && (
            <StudentLectures currentUser={currentUser} />
          )}
          {activeTab === "timetable" && (
            <StudentTimetable stats={stats} currentUser={currentUser} />
          )}
          {activeTab === "notices" && (
            <StudentNotices />
          )}
          {activeTab === "leaves" && (
            <StudentLeaves showToast={showToast} currentUser={currentUser} summary={summary} />
          )}
          {activeTab === "notifications" && (
            <StudentNotifications showToast={showToast} />
          )}
          {activeTab === "exams" && (
            <StudentExams currentUser={currentUser} showToast={showToast} onNavigate={handleTabChange} />
          )}
          {activeTab === "fees" && (
            <StudentFees currentUser={currentUser} showToast={showToast} />
          )}
          {activeTab === "library" && (
            <StudentLibrary currentUser={currentUser} showToast={showToast} />
          )}
          {activeTab === "feedback" && (
            <StudentFeedback showToast={showToast} />
          )}
          {activeTab === "settings" && (
            <StudentSettings onNavigate={onNavigate} showToast={showToast} />
          )}
          {activeTab === "students" && (
            <StudentsDirectory
              currentUser={currentUser}
              onNavigate={onNavigate}
              onSelectStudent={handleViewStudentProfile}
            />
          )}
          {(activeTab === "faculty" || activeTab === "all-faculty" || activeTab === "faculty-directory") && (
            <FacultyDirectory
              currentUser={currentUser}
              callerRole={role}
              onNavigate={onNavigate}
            />
          )}
          {activeTab === "student-profile" && (
            <StudentPublicProfile
              studentId={studentProfileId}
              currentUser={currentUser}
              onBack={handleBackFromProfile}
              onNavigate={onNavigate}
            />
          )}
        </div>
      ) : role === "teacher" ? (
        <div className="teacher-role-view">
          {activeTab === "overview" && (
            <TeacherDashboard
              currentUser={currentUser}
              stats={stats}
              charts={charts}
              onNavigate={onNavigate}
              setActiveTab={handleTabChange}
            />
          )}
          {activeTab === "profile" && (
            <TeacherProfile
              currentUser={currentUser}
              onNavigate={onNavigate}
              showToast={showToast}
            />
          )}
          {(activeTab === "attendance" || activeTab === "attendance-reports") && (
            <TeacherAttendance stats={stats} showToast={showToast} currentUser={currentUser} />
          )}
          {activeTab === "students" && (
            <TeacherStudents onSelectStudent={handleViewStudentProfile} showToast={showToast} />
          )}
          {(activeTab === "faculty" || activeTab === "all-faculty" || activeTab === "faculty-directory") && (
            <FacultyDirectory
              currentUser={currentUser}
              callerRole={role}
              onNavigate={onNavigate}
            />
          )}
          {activeTab === "student-profile" && (
            <StudentPublicProfile
              studentId={studentProfileId}
              currentUser={currentUser}
              onBack={handleBackFromProfile}
              onNavigate={onNavigate}
            />
          )}
          {activeTab === "assignments" && (
            <TeacherAssignments
              setActiveTab={handleTabChange}
              setViewingAssignment={setViewingAssignmentSubmissions}
              showToast={showToast}
            />
          )}
          {activeTab === "submissions" && (
            <TeacherSubmissions
              initialAssignment={viewingAssignmentSubmissions}
              showToast={showToast}
            />
          )}
          {(activeTab === "notes" || activeTab === "subjects") && (
            <TeacherNotes showToast={showToast} />
          )}
          {activeTab === "lectures" && (
            <TeacherLectures showToast={showToast} currentUser={currentUser} />
          )}
          {activeTab === "timetable" && (
            <TeacherTimetable currentUser={currentUser} />
          )}
          {(activeTab === "exams" || activeTab === "results" || activeTab === "marks") && (
            <TeacherMarks showToast={showToast} />
          )}
          {activeTab === "leaves" && (
            <TeacherLeaves showToast={showToast} />
          )}
          {activeTab === "notices" && (
            <TeacherNotices showToast={showToast} />
          )}
          {activeTab === "classes" && (
            <TeacherClasses setActiveTab={handleTabChange} />
          )}
          {activeTab === "reports" && (
            <TeacherReports showToast={showToast} />
          )}
          {activeTab === "notifications" && (
            <TeacherNotifications showToast={showToast} />
          )}
          {activeTab === "settings" && (
            <TeacherSettings onNavigate={onNavigate} showToast={showToast} />
          )}
        </div>
      ) : role === "hod" ? (
        <div className="hod-role-view">
          {activeTab === "overview" && (
            <HODDashboard
              currentUser={currentUser}
              stats={stats}
              charts={charts}
              onNavigate={onNavigate}
              setActiveTab={handleTabChange}
            />
          )}
          {activeTab === "profile" && (
            <HODProfile
              currentUser={currentUser}
              onNavigate={onNavigate}
              showToast={showToast}
            />
          )}
          {(activeTab === "department" || activeTab === "departments") && (
            <HODDepartment currentUser={currentUser} stats={stats} charts={charts} setActiveTab={handleTabChange} />
          )}
          {(activeTab === "student-management" || activeTab === "students") && (
            <HODStudents
              currentUser={currentUser}
              onSelectStudent={handleViewStudentProfile}
              showToast={showToast}
            />
          )}
          {activeTab === "student-profile" && (
            <StudentPublicProfile
              studentId={studentProfileId}
              currentUser={currentUser}
              onBack={handleBackFromProfile}
              onNavigate={onNavigate}
            />
          )}
          {(activeTab === "faculty" || activeTab === "all-faculty") && (
            <FacultyDirectory
              currentUser={currentUser}
              callerRole={role}
              onNavigate={onNavigate}
            />
          )}
          {(activeTab === "faculty-management" || activeTab === "faculty-directory" || activeTab === "teachers") && (
            <HODTeachers
              currentUser={currentUser}
              onNavigate={onNavigate}
              showToast={showToast}
            />
          )}
          {activeTab === "attendance" && (
            <HODAttendance currentUser={currentUser} stats={stats} />
          )}
          {(activeTab === "results" || activeTab === "exams") && (
            <HODResults currentUser={currentUser} />
          )}
          {(activeTab === "subjects" || activeTab === "assignments" || activeTab === "notes" || activeTab === "lectures" || activeTab === "materials") && (
            <HODMaterials currentUser={currentUser} />
          )}
          {activeTab === "timetable" && (
            <HODTimetable currentUser={currentUser} />
          )}
          {activeTab === "leaves" && (
            <HODLeaves showToast={showToast} />
          )}
          {activeTab === "notices" && (
            <HODNotices showToast={showToast} />
          )}
          {(activeTab === "reports" || activeTab === "attendance-reports") && (
            <HODReports showToast={showToast} />
          )}
          {activeTab === "notifications" && (
            <HODNotifications showToast={showToast} />
          )}
          {activeTab === "settings" && (
            <HODSettings currentUser={currentUser} onNavigate={onNavigate} showToast={showToast} />
          )}
        </div>
      ) : role === "coordinator" ? (
        <div className="coordinator-role-view">
          {activeTab === "overview" && (
            <CoordinatorDashboard
              currentUser={currentUser}
              stats={stats}
              charts={charts}
              onNavigate={onNavigate}
              setActiveTab={handleTabChange}
            />
          )}
          {activeTab === "profile" && (
            <CoordinatorProfile
              currentUser={currentUser}
              onNavigate={onNavigate}
              showToast={showToast}
            />
          )}
          {activeTab === "students" && (
            <CoordinatorStudents
              currentUser={currentUser}
              onSelectStudent={handleViewStudentProfile}
              showToast={showToast}
            />
          )}
          {activeTab === "student-profile" && (
            <StudentPublicProfile
              studentId={studentProfileId}
              currentUser={currentUser}
              onBack={handleBackFromProfile}
              onNavigate={onNavigate}
            />
          )}
          {(activeTab === "faculty" || activeTab === "all-faculty") && (
            <FacultyDirectory
              currentUser={currentUser}
              callerRole={role}
              onNavigate={onNavigate}
            />
          )}
          {(activeTab === "faculty-directory" || activeTab === "faculty-management") && (
            <CoordinatorFaculty currentUser={currentUser} />
          )}
          {activeTab === "academic-calendar" && (
            <CoordinatorCalendar showToast={showToast} />
          )}
          {activeTab === "timetable" && (
            <CoordinatorTimetable showToast={showToast} />
          )}
          {activeTab === "rooms" && (
            <CoordinatorRooms showToast={showToast} />
          )}
          {activeTab === "exams" && (
            <CoordinatorExams showToast={showToast} />
          )}
          {activeTab === "attendance" && (
            <CoordinatorAttendance currentUser={currentUser} showToast={showToast} />
          )}
          {activeTab === "assignments" && (
            <CoordinatorAssignments showToast={showToast} />
          )}
          {(activeTab === "lectures" || activeTab === "materials") && (
            <TeacherLectures showToast={showToast} currentUser={currentUser} />
          )}
          {(activeTab === "notes" || activeTab === "subjects") && (
            <TeacherNotes showToast={showToast} currentUser={currentUser} />
          )}
          {activeTab === "leaves" && (
            <CoordinatorLeaves showToast={showToast} />
          )}
          {activeTab === "approvals" && (
            <CoordinatorApprovals showToast={showToast} />
          )}
          {activeTab === "notices" && (
            <CoordinatorNotices showToast={showToast} />
          )}
          {activeTab === "reports" && (
            <CoordinatorReports showToast={showToast} />
          )}
          {activeTab === "notifications" && (
            <CoordinatorNotifications showToast={showToast} />
          )}
          {activeTab === "settings" && (
            <CoordinatorSettings onNavigate={onNavigate} showToast={showToast} />
          )}
        </div>
      ) : role === "principal" ? (
        <div className="principal-role-view">
          {activeTab === "overview" && (
            <PrincipalDashboard
              currentUser={currentUser}
              stats={stats}
              charts={charts}
              onNavigate={onNavigate}
              setActiveTab={handleTabChange}
            />
          )}
          {activeTab === "profile" && (
            <PrincipalProfile
              currentUser={currentUser}
              onNavigate={onNavigate}
              showToast={showToast}
            />
          )}
          {(activeTab === "students" || activeTab === "student-overview") && (
            <PrincipalStudents
              currentUser={currentUser}
              onSelectStudent={handleViewStudentProfile}
              showToast={showToast}
            />
          )}
          {activeTab === "student-profile" && (
            <StudentPublicProfile
              studentId={studentProfileId}
              currentUser={currentUser}
              onBack={handleBackFromProfile}
              onNavigate={onNavigate}
            />
          )}
          {(activeTab === "faculty" || activeTab === "all-faculty") && (
            <FacultyDirectory
              currentUser={currentUser}
              callerRole={role}
              onNavigate={onNavigate}
            />
          )}
          {activeTab === "faculty-overview" && (
            <PrincipalFaculty
              currentUser={currentUser}
              showToast={showToast}
            />
          )}
          {(activeTab === "attendance" || activeTab === "attendance-reports") && (
            <PrincipalAttendance
              currentUser={currentUser}
              showToast={showToast}
            />
          )}
          {activeTab === "timetable" && (
            <PrincipalTimetable
              currentUser={currentUser}
              showToast={showToast}
            />
          )}
          {(activeTab === "exams" || activeTab === "results") && (
            <PrincipalExams
              currentUser={currentUser}
              showToast={showToast}
            />
          )}
          {activeTab === "approvals" && (
            <PrincipalApprovals
              currentUser={currentUser}
              showToast={showToast}
            />
          )}
          {(activeTab === "reports" || activeTab === "placement") && (
            <PrincipalReports
              currentUser={currentUser}
              showToast={showToast}
            />
          )}
          {activeTab === "notices" && (
            <PrincipalNotices
              currentUser={currentUser}
              showToast={showToast}
            />
          )}
          {activeTab === "settings" && (
            <PrincipalSettings
              currentUser={currentUser}
              onNavigate={onNavigate}
              showToast={showToast}
            />
          )}
        </div>
      ) : role === "admin" ? (
        <div className="admin-role-view">
          {activeTab === "overview" && (
            <AdminDashboard
              currentUser={currentUser}
              stats={stats}
              charts={charts}
              onNavigate={onNavigate}
              setActiveTab={handleTabChange}
            />
          )}
          {activeTab === "profile" && (
            <AdminProfile
              currentUser={currentUser}
              onNavigate={onNavigate}
              showToast={showToast}
            />
          )}
          {(activeTab === "users" || activeTab === "student-accounts" || activeTab === "faculty-accounts") && (
            <AdminUsers
              currentUser={currentUser}
              showToast={showToast}
            />
          )}
          {activeTab === "students" && (
            <PrincipalStudents
              currentUser={currentUser}
              onSelectStudent={handleViewStudentProfile}
              showToast={showToast}
            />
          )}
          {(activeTab === "faculty" || activeTab === "all-faculty") && (
            <FacultyDirectory
              currentUser={currentUser}
              callerRole={role}
              onNavigate={onNavigate}
            />
          )}
          {activeTab === "student-profile" && (
            <StudentPublicProfile
              studentId={studentProfileId}
              currentUser={currentUser}
              onBack={handleBackFromProfile}
              onNavigate={onNavigate}
            />
          )}
          {activeTab === "roles" && (
            <AdminRoles
              currentUser={currentUser}
            />
          )}
          {(activeTab === "departments" || activeTab === "branches" || activeTab === "sessions") && (
            <AdminBranches
              currentUser={currentUser}
            />
          )}
          {(activeTab === "exams" || activeTab === "results") && (
            <AdminExams
              currentUser={currentUser}
              showToast={showToast}
            />
          )}
          {(activeTab === "audit" || activeTab === "security") && (
            <AdminAudit
              currentUser={currentUser}
              showToast={showToast}
            />
          )}
          {(activeTab === "settings" || activeTab === "integrations" || activeTab === "files") && (
            <AdminSettings
              currentUser={currentUser}
              showToast={showToast}
            />
          )}
          {activeTab === "reports" && (
            <AdminReports
              currentUser={currentUser}
              showToast={showToast}
            />
          )}
          {activeTab === "notices" && (
            <AdminNotices
              currentUser={currentUser}
              showToast={showToast}
            />
          )}
        </div>
      ) : (
        <div className="empty-role-view" style={{ padding: 40, textAlign: "center", color: "#64748B" }}>
          <p>Please select a valid institutional view or log in again.</p>
        </div>
      )}

    </DashboardLayout>
  );
}
