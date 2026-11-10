import React, { useState, useId, useEffect, useRef } from "react";
import {
  GraduationCap,
  BookOpen,
  Layers,
  Award,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
  Calendar,
  Hash,
  Loader2,
  Check,
  FileCheck,
  Home as HomeIcon,
  LogIn,
  Cpu,
  Cog,
  Zap,
  Radio,
  FileText,
  RotateCw,
  Edit3,
  KeyRound
} from "lucide-react";
import { authApi } from "../services/authApi";
import AuthLayout from "../components/AuthLayout";
import "./Register.css";

// 5 Polytechnic Diploma Branches with icons and tags
const BRANCHES = [
  {
    code: "CSE",
    name: "Computer Science Engineering",
    icon: Cpu,
    tag: "AI, Web & Software",
    desc: "Software development, data structures, cloud architectures, and computer systems."
  },
  {
    code: "Mechanical",
    name: "Mechanical Engineering",
    icon: Cog,
    tag: "CAD/CAM & Robotics",
    desc: "Industrial automation, CNC machining, thermodynamics, and machine design."
  },
  {
    code: "Electrical",
    name: "Electrical Engineering",
    icon: Zap,
    tag: "Smart Grid & EV",
    desc: "Power distribution, renewable solar energy, industrial drives, and EV powertrains."
  },
  {
    code: "Civil",
    name: "Civil Engineering",
    icon: Building2,
    tag: "Smart Infrastructure",
    desc: "Structural engineering, surveying, geo-technical testing, and green construction."
  },
  {
    code: "ECE",
    name: "Electronics & Communication",
    icon: Radio,
    tag: "IoT & Embedded VLSI",
    desc: "Microcontrollers, signal processing, wireless communications, and IoT systems."
  }
];

// 5 Roles with institutional authorization policies
const ROLES = [
  {
    id: "student",
    title: "Student",
    subtitle: "Diploma Candidate",
    desc: "Access daily lectures, attendance records, exam hall tickets, and course journals.",
    icon: GraduationCap,
    badge: "Student Onboarding",
    badgeType: "student",
    requiresApproval: false
  },
  {
    id: "teacher",
    title: "Teacher / Faculty",
    subtitle: "Department Faculty & Lecturers",
    desc: "Punch biometric attendance, publish coursework, score lab journals, and submit internals.",
    icon: BookOpen,
    badge: "Requires Dean Approval",
    badgeType: "staff",
    requiresApproval: true
  },
  {
    id: "hod",
    title: "Head of Department (HOD)",
    subtitle: "Branch Leadership",
    desc: "Manage faculty load, review branch performance, approve lab procurement, and sign clearances.",
    icon: Layers,
    badge: "Requires Dean Approval",
    badgeType: "staff",
    requiresApproval: true
  },
  {
    id: "coordinator",
    title: "Coordinator",
    subtitle: "Academic, Exam, or T&P Cell",
    desc: "Publish exam date sheets, coordinate industry placement drives, and maintain compliance records.",
    icon: Award,
    badge: "Requires Admin Authorization",
    badgeType: "staff",
    requiresApproval: true
  },
  {
    id: "principal",
    title: "Principal / Leadership",
    subtitle: "Institutional Executive Office",
    desc: "Comprehensive polytechnic oversight, regulatory university synchronization, and governance.",
    icon: ShieldCheck,
    badge: "Requires Executive Authorization",
    badgeType: "staff",
    requiresApproval: true
  }
];

// Academic Year definitions for 3-Year Polytechnic Diploma
const ACADEMIC_YEARS = [
  {
    id: "1st Year",
    label: "First Year",
    stage: "Fresher Batch",
    desc: "Foundational sciences, workshop practice, and introductory engineering."
  },
  {
    id: "2nd Year",
    label: "Second Year",
    stage: "Core Engineering",
    desc: "Specialized departmental theory, laboratory courses, and mini projects."
  },
  {
    id: "3rd Year",
    label: "Third Year",
    stage: "Final Diploma Year",
    desc: "Advanced electives, industrial training internship, and major capstone."
  }
];

// Strictly filtered semesters according to academic year (Subharti 3-year diploma)
const SEMESTERS_BY_YEAR = {
  "1st Year": [
    { id: "Semester 1", label: "Semester 1", term: "Odd Term (Autumn)" },
    { id: "Semester 2", label: "Semester 2", term: "Even Term (Spring)" }
  ],
  "2nd Year": [
    { id: "Semester 3", label: "Semester 3", term: "Odd Term (Autumn)" },
    { id: "Semester 4", label: "Semester 4", term: "Even Term (Spring)" }
  ],
  "3rd Year": [
    { id: "Semester 5", label: "Semester 5", term: "Odd Term (Autumn)" },
    { id: "Semester 6", label: "Semester 6", term: "Even Term (Spring)" }
  ]
};

// Staff Departments
const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Electronics & Communication",
  "Applied Sciences & Humanities",
  "Polytechnic Administration",
  "Examination Cell",
  "Training & Placement Cell"
];

export default function Register({ onNavigate }) {
  // Wizard Question Index
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState("forward");

  // Form Fields
  const [role, setRole] = useState("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Student Profile
  const [branch, setBranch] = useState("CSE");
  const [academicYear, setAcademicYear] = useState("1st Year");
  const [semester, setSemester] = useState("Semester 1");
  const [enrollmentNo, setEnrollmentNo] = useState("");

  // Staff Profile
  const [department, setDepartment] = useState("Computer Science & Engineering");
  const [employeeId, setEmployeeId] = useState("");
  const [responsibilities, setResponsibilities] = useState("");

  // Agreement
  const [agreed, setAgreed] = useState(false);

  // Submission State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Email OTP Verification States
  const [otpStage, setOtpStage] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [devOtp, setDevOtp] = useState("");
  const otpInputRefs = useRef([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-focus input ref
  const inputRef = useRef(null);

  // Unique accessible IDs
  const fullNameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const enrollmentNoId = useId();
  const employeeIdId = useId();
  const responsibilitiesId = useId();

  // Dynamic step sequence generation based on selected role
  // One meaningful question at a time!
  const getStepSequence = () => {
    if (role === "student") {
      return [
        { id: "welcome", title: "Welcome", category: "Introduction" },
        { id: "role", title: "Select Role", category: "Personalization" },
        { id: "name", title: "Full Name", category: "Account Details" },
        { id: "email", title: "Email Address", category: "Account Details" },
        { id: "password", title: "Password", category: "Security" },
        { id: "confirmPassword", title: "Confirm Password", category: "Security" },
        { id: "branch", title: "Engineering Branch", category: "Academic Profile" },
        { id: "year", title: "Academic Year", category: "Academic Profile" },
        { id: "semester", title: "Semester", category: "Academic Profile" },
        { id: "enrollment", title: "Enrollment Number", category: "Academic Profile" },
        { id: "review", title: "Review & Submit", category: "Confirmation" }
      ];
    } else {
      return [
        { id: "welcome", title: "Welcome", category: "Introduction" },
        { id: "role", title: "Select Role", category: "Personalization" },
        { id: "name", title: "Full Name", category: "Account Details" },
        { id: "email", title: "Email Address", category: "Account Details" },
        { id: "password", title: "Password", category: "Security" },
        { id: "confirmPassword", title: "Confirm Password", category: "Security" },
        { id: "department", title: "Department", category: "Institutional Profile" },
        { id: "employeeId", title: "Employee ID", category: "Institutional Profile" },
        { id: "responsibilities", title: "Access Request", category: "Institutional Profile" },
        { id: "review", title: "Review & Submit", category: "Confirmation" }
      ];
    }
  };

  const steps = getStepSequence();
  const currentStep = steps[stepIndex] || steps[0];
  const isResultScreen = stepIndex >= steps.length;
  const isStaff = role !== "student";

  // Focus input on step change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [stepIndex]);

  // Synchronize semester when academic year changes
  const handleYearSelect = (year) => {
    setAcademicYear(year);
    const validSems = SEMESTERS_BY_YEAR[year] || SEMESTERS_BY_YEAR["1st Year"];
    setSemester(validSems[0].id);
  };

  // Password Strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "None", color: "#94a3b8" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score: 1, label: "Weak", color: "#ef4444" };
    if (score <= 4) return { score: 2, label: "Medium", color: "#f59e0b" };
    return { score: 3, label: "Strong", color: "#10b981" };
  };

  const strength = getPasswordStrength(password);

  // Validation per individual question
  const validateCurrentQuestion = () => {
    setErrorMsg("");
    setIsDuplicateEmail(false);

    if (currentStep.id === "name") {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setErrorMsg("Please enter your legal full name (minimum 2 characters).");
        return false;
      }
    } else if (currentStep.id === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email.trim())) {
        setErrorMsg("Please enter a valid email address (e.g., student.svsu@subharti.org).");
        return false;
      }
    } else if (currentStep.id === "password") {
      if (password.length < 8) {
        setErrorMsg("Password must be at least 8 characters long.");
        return false;
      }
    } else if (currentStep.id === "confirmPassword") {
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match. Please verify your entries.");
        return false;
      }
    } else if (currentStep.id === "enrollment") {
      if (!enrollmentNo.trim() || enrollmentNo.trim().length < 3) {
        setErrorMsg("Please enter your university enrollment or admission registration number.");
        return false;
      }
    } else if (currentStep.id === "employeeId") {
      if (!employeeId.trim()) {
        setErrorMsg("Please provide your institutional Employee ID or Faculty Code.");
        return false;
      }
    } else if (currentStep.id === "review") {
      if (!agreed) {
        setErrorMsg("Please accept the Institutional Code of Conduct & CollegeOS Terms to proceed.");
        return false;
      }
    }

    return true;
  };

  // Next Question
  const handleNext = () => {
    if (!validateCurrentQuestion()) return;

    if (currentStep.id === "review") {
      handleFinalSubmit();
      return;
    }

    setDirection("forward");
    setStepIndex((prev) => Math.min(prev + 1, steps.length));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Back Question
  const handleBack = () => {
    setErrorMsg("");
    setDirection("backward");
    setStepIndex((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Direct Jump from Review Screen
  const jumpToQuestion = (stepId) => {
    setErrorMsg("");
    const targetIdx = steps.findIndex((s) => s.id === stepId);
    if (targetIdx !== -1) {
      setDirection(targetIdx > stepIndex ? "forward" : "backward");
      setStepIndex(targetIdx);
    }
  };

  // OTP Handlers
  const handleOtpChange = (index, val) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);
    setErrorMsg("");

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!paste) return;
    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = paste[i] || "";
    }
    setOtpDigits(updated);
    setErrorMsg("");
    if (paste.length === 6) {
      otpInputRefs.current[5]?.focus();
      handleVerifyOtp(paste);
    } else {
      otpInputRefs.current[Math.min(5, paste.length)]?.focus();
    }
  };

  const handleVerifyOtp = async (overrideOtp) => {
    const otpCode = overrideOtp || otpDigits.join("");
    if (otpCode.length !== 6) {
      setErrorMsg("Please enter all 6 digits of the verification code.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await authApi.verifyEmailOtp({
        email: email.trim().toLowerCase(),
        otp: otpCode
      });
      setSubmissionResult(res);
      setOtpStage(false);
      setStepIndex(steps.length); // Advance to Result Celebration screen
    } catch (err) {
      setErrorMsg(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendCount >= 5) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await authApi.resendEmailOtp(email.trim().toLowerCase());
      setResendCooldown(45);
      setResendCount((c) => c + 1);
      if (res?.devOtp) setDevOtp(res.devOtp);
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 50);
    } catch (err) {
      setErrorMsg(err.message || "Failed to resend verification code.");
    } finally {
      setLoading(false);
    }
  };

  // Final Submission to API
  const handleFinalSubmit = async () => {
    setLoading(true);
    setErrorMsg("");
    setIsDuplicateEmail(false);

    const payload = {
      role,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      ...(role === "student"
        ? {
            branch,
            academicYear,
            semester,
            enrollmentNo: enrollmentNo.trim().toUpperCase()
          }
        : {
            department: department.trim(),
            employeeId: employeeId.trim().toUpperCase(),
            responsibilities: responsibilities.trim()
          })
    };

    try {
      const response = await authApi.register(payload);
      if (response?.requiresOtp) {
        setOtpStage(true);
        setMaskedEmail(response.maskedEmail || email);
        setResendCooldown(45);
        if (response.devOtp) setDevOtp(response.devOtp);
        setOtpDigits(["", "", "", "", "", ""]);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
      } else {
        setSubmissionResult(response);
        setStepIndex(steps.length);
      }
    } catch (err) {
      if (err.status === 409) {
        setIsDuplicateEmail(true);
        setErrorMsg(err.message || "An account with this email already exists. Please sign in instead.");
      } else {
        setErrorMsg(err.message || "An error occurred while registering your profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Keyboard navigation: Enter key triggers Next
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (currentStep?.id === "responsibilities") {
        // Allow multiline in textarea unless Ctrl+Enter or Cmd+Enter
        if (!e.ctrlKey && !e.metaKey) return;
      }
      e.preventDefault();
      handleNext();
    }
  };

  const selectedRoleObj = ROLES.find((r) => r.id === role) || ROLES[0];
  const progressPercent = Math.min(100, Math.round(((stepIndex + 1) / steps.length) * 100));

  return (
    <AuthLayout currentView="register" onNavigate={onNavigate}>
      <div className="onboard-card card-glass" onKeyDown={handleKeyDown}>
        {/* Progress Tracker (Active during questions 0 to steps.length - 1) */}
        {!isResultScreen && !otpStage && (
            <div className="wizard-progress-header">
              <div className="wizard-step-info">
                <span className="step-counter">
                  Question {stepIndex + 1} of {steps.length}
                </span>
                <span className="step-title-hint">
                  <span className="step-category-prefix">{currentStep.category} • </span>
                  {currentStep.title}
                </span>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Registration progress ${progressPercent}%`}
              >
                <div
                  className="progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Inline Error Alert */}
          {errorMsg && (
            <div className="onboard-alert error-alert" role="alert">
              <AlertCircle size={18} className="alert-icon" />
              <div className="alert-content">
                <p>{errorMsg}</p>
                {isDuplicateEmail && (
                  <button
                    type="button"
                    className="alert-action-btn"
                    onClick={() => onNavigate?.("login")}
                  >
                    Go to Sign In <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ================= STEP 0: WELCOME ================= */}
          {currentStep?.id === "welcome" && !isResultScreen && (
            <div className={`wizard-screen ${direction}`}>
              <div className="welcome-hero">
                <div className="welcome-badge-row">
                  <div className="welcome-logo-container">
                    <img
                      src="/svsu-logo-whiten.webp"
                      alt="Subharti University"
                      className="welcome-univ-img"
                    />
                  </div>
                  <div className="welcome-badge-chip">
                    <Sparkles size={14} /> Official Campus Onboarding
                  </div>
                </div>

                <h1 className="welcome-headline">Welcome to CollegeOS</h1>
                <p className="welcome-subhead">
                  Your college journey, organized in one place. We'll set up your personalized digital workspace in a few simple steps.
                </p>

                <div className="welcome-features-grid">
                  <div className="wf-card">
                    <div className="wf-icon-box">
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <strong>Smart Academic Ledger</strong>
                      <p>Track live attendance percentages, lab journals, and semester hall tickets.</p>
                    </div>
                  </div>

                  <div className="wf-card">
                    <div className="wf-icon-box">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <strong>Conflict-Free Timetables</strong>
                      <p>Stay updated with lecture timings, workshop bay rotations, and official circulars.</p>
                    </div>
                  </div>

                  <div className="wf-card">
                    <div className="wf-icon-box">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <strong>Verified Institutional Security</strong>
                      <p>Encrypted credentials with role-based access for students, faculty, and administration.</p>
                    </div>
                  </div>
                </div>

                <div className="screen-footer-actions">
                  <button
                    type="button"
                    className="primary-flow-btn"
                    onClick={handleNext}
                  >
                    <span>Get Started</span>
                    <ArrowRight size={18} />
                  </button>
                  <p className="footer-switch-text">
                    Already registered?{" "}
                    <button
                      type="button"
                      className="inline-link"
                      onClick={() => onNavigate?.("login")}
                    >
                      Sign into your account
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 1: SELECT YOUR ROLE ================= */}
          {currentStep?.id === "role" && !isResultScreen && (
            <div className={`wizard-screen ${direction}`}>
              <div className="screen-header">
                <h2>How will you use CollegeOS?</h2>
                <p>Choose your role to personalize your experience across Subharti Polytechnic.</p>
              </div>

              {/* Institutional security note */}
              <div className="institutional-notice-banner">
                <ShieldCheck size={18} className="notice-icon" />
                <p>
                  <strong>Institutional Security Policy:</strong> Students proceed with academic profile verification. Faculty, HOD, and administrative roles submit a verified institutional access request subject to Dean/Registrar authorization.
                </p>
              </div>

              <div className="roles-grid" role="radiogroup" aria-label="Select role">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <div
                      key={r.id}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      className={`role-option-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setRole(r.id)}
                      onKeyDown={(e) => {
                        if (e.key === " " || e.key === "Enter") {
                          e.preventDefault();
                          setRole(r.id);
                        }
                      }}
                    >
                      <div className="role-top-row">
                        <div className={`role-icon-box ${r.badgeType}`}>
                          <Icon size={22} />
                        </div>
                        <span className={`role-badge ${r.badgeType}`}>
                          {r.badge}
                        </span>
                      </div>
                      <div className="role-body">
                        <strong className="role-title">{r.title}</strong>
                        <span className="role-sub">{r.subtitle}</span>
                        <p className="role-desc">{r.desc}</p>
                      </div>
                      <div className="role-check-indicator">
                        <div className="radio-circle">
                          {isSelected && <div className="radio-dot" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="screen-footer-actions dual">
                <button
                  type="button"
                  className="secondary-flow-btn"
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  className="primary-flow-btn"
                  onClick={handleNext}
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP: FULL NAME ================= */}
          {currentStep?.id === "name" && !isResultScreen && (
            <div className={`wizard-screen ${direction}`}>
              <div className="screen-header">
                <h2>What is your full name?</h2>
                <p>Please enter your legal name as registered in university admissions or staff records.</p>
              </div>

              <div className="focused-question-container">
                <div className="field-group">
                  <label htmlFor={fullNameId}>
                    <User size={16} /> Legal Full Name
                  </label>
                  <input
                    ref={inputRef}
                    id={fullNameId}
                    type="text"
                    className="form-input large-input"
                    placeholder="e.g., Rishabh Singhania"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                  <span className="field-hint">This will appear on your official attendance slips and grade cards.</span>
                </div>
              </div>

              <div className="screen-footer-actions dual">
                <button
                  type="button"
                  className="secondary-flow-btn"
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  className="primary-flow-btn"
                  onClick={handleNext}
                  disabled={!fullName.trim()}
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP: EMAIL ADDRESS ================= */}
          {currentStep?.id === "email" && !isResultScreen && (
            <div className={`wizard-screen ${direction}`}>
              <div className="screen-header">
                <h2>What is your email address?</h2>
                <p>We'll use this for your single sign-on credentials, campus notices, and academic notifications.</p>
              </div>

              <div className="focused-question-container">
                <div className="field-group">
                  <label htmlFor={emailId}>
                    <Mail size={16} /> Email Address
                  </label>
                  <input
                    ref={inputRef}
                    id={emailId}
                    type="email"
                    className="form-input large-input"
                    placeholder="e.g., student.svsu@subharti.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                  <span className="field-hint">
                    {isStaff ? "Institutional @subharti.org email recommended." : "University or personal email address."}
                  </span>
                </div>
              </div>

              <div className="screen-footer-actions dual">
                <button
                  type="button"
                  className="secondary-flow-btn"
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  className="primary-flow-btn"
                  onClick={handleNext}
                  disabled={!email.trim()}
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP: CREATE PASSWORD ================= */}
          {currentStep?.id === "password" && !isResultScreen && (
            <div className={`wizard-screen ${direction}`}>
              <div className="screen-header">
                <h2>Create a password</h2>
                <p>Choose a secure password of at least 8 characters to protect your institutional account.</p>
              </div>

              <div className="focused-question-container">
                <div className="field-group">
                  <label htmlFor={passwordId}>
                    <Lock size={16} /> Secure Password
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      ref={inputRef}
                      id={passwordId}
                      type={showPassword ? "text" : "password"}
                      className="form-input large-input"
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="toggle-pwd-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Real-time Password Strength Meter */}
                  {password.length > 0 && (
                    <div className="pwd-strength-container">
                      <div className="pwd-meter-bars">
                        <div
                          className="meter-bar"
                          style={{
                            backgroundColor: strength.score >= 1 ? strength.color : "#e2e8f0"
                          }}
                        />
                        <div
                          className="meter-bar"
                          style={{
                            backgroundColor: strength.score >= 2 ? strength.color : "#e2e8f0"
                          }}
                        />
                        <div
                          className="meter-bar"
                          style={{
                            backgroundColor: strength.score >= 3 ? strength.color : "#e2e8f0"
                          }}
                        />
                      </div>
                      <span className="strength-label" style={{ color: strength.color }}>
                        {strength.label} Strength
                      </span>
                    </div>
                  )}
                  <span className="field-hint">Combine letters, numbers, and symbols for maximum security.</span>
                </div>
              </div>

              <div className="screen-footer-actions dual">
                <button
                  type="button"
                  className="secondary-flow-btn"
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  className="primary-flow-btn"
                  onClick={handleNext}
                  disabled={password.length < 8}
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP: CONFIRM PASSWORD ================= */}
          {currentStep?.id === "confirmPassword" && !isResultScreen && (
            <div className={`wizard-screen ${direction}`}>
              <div className="screen-header">
                <h2>Confirm your password</h2>
                <p>Re-enter your password to ensure you have typed it correctly.</p>
              </div>

              <div className="focused-question-container">
                <div className="field-group">
                  <label htmlFor={confirmPasswordId}>
                    <Lock size={16} /> Confirm Password
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      ref={inputRef}
                      id={confirmPasswordId}
                      type={showConfirmPassword ? "text" : "password"}
                      className="form-input large-input"
                      placeholder="Re-type your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="toggle-pwd-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <span className="field-error-inline">Passwords do not match. Please re-check.</span>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <span className="field-success-inline">
                      <Check size={14} /> Passwords match!
                    </span>
                  )}
                </div>
              </div>

              <div className="screen-footer-actions dual">
                <button
                  type="button"
                  className="secondary-flow-btn"
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  className="primary-flow-btn"
                  onClick={handleNext}
                  disabled={!confirmPassword || password !== confirmPassword}
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STUDENT STEP: BRANCH ================= */}
          {currentStep?.id === "branch" && !isResultScreen && (
            <div className={`wizard-screen ${direction}`}>
              <div className="screen-header">
                <h2>Which branch are you studying in?</h2>
                <p>Select your diploma engineering program at Subharti Polytechnic.</p>
              </div>

              <div className="branch-cards-list" role="radiogroup" aria-label="Select engineering branch">
                {BRANCHES.map((b) => {
                  const Icon = b.icon;
                  const isSelected = branch === b.code;
                  return (
                    <div
                      key={b.code}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      className={`branch-select-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setBranch(b.code)}
                      onKeyDown={(e) => {
                        if (e.key === " " || e.key === "Enter") {
                          e.preventDefault();
                          setBranch(b.code);
                        }
                      }}
                    >
                      <div className="branch-card-icon-box">
                        <Icon size={24} />
                      </div>
                      <div className="branch-card-content">
                        <div className="branch-card-head">
                          <strong>{b.name}</strong>
                          <span className="branch-code-badge">{b.code}</span>
                        </div>
                        <span className="branch-tagline">{b.tag}</span>
                        <p className="branch-desc-text">{b.desc}</p>
                      </div>
                      <div className="radio-circle">
                        {isSelected && <div className="radio-dot" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="screen-footer-actions dual">
                <button
                  type="button"
                  className="secondary-flow-btn"
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  className="primary-flow-btn"
                  onClick={handleNext}
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STUDENT STEP: ACADEMIC YEAR ================= */}
          {currentStep?.id === "year" && !isResultScreen && (
            <div className={`wizard-screen ${direction}`}>
              <div className="screen-header">
                <h2>Which academic year are you in?</h2>
                <p>Subharti Polytechnic offers a 3-year diploma engineering curriculum.</p>
              </div>

              <div className="year-cards-list" role="radiogroup" aria-label="Select academic year">
                {ACADEMIC_YEARS.map((y) => {
                  const isSelected = academicYear === y.id;
                  return (
                    <div
                      key={y.id}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      className={`year-select-card ${isSelected ? "selected" : ""}`}
                      onClick={() => handleYearSelect(y.id)}
                      onKeyDown={(e) => {
                        if (e.key === " " || e.key === "Enter") {
                          e.preventDefault();
                          handleYearSelect(y.id);
                        }
                      }}
                    >
                      <div className="year-card-icon">
                        <Calendar size={22} />
                      </div>
                      <div className="year-card-content">
                        <div className="year-head">
                          <strong>{y.label}</strong>
                          <span className="year-stage-badge">{y.stage}</span>
                        </div>
                        <p className="year-desc">{y.desc}</p>
                      </div>
                      <div className="radio-circle">
                        {isSelected && <div className="radio-dot" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="screen-footer-actions dual">
                <button
                  type="button"
                  className="secondary-flow-btn"
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  className="primary-flow-btn"
                  onClick={handleNext}
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STUDENT STEP: SEMESTER ================= */}
          {currentStep?.id === "semester" && !isResultScreen && (
            <div className={`wizard-screen ${direction}`}>
              <div className="screen-header">
                <h2>Which semester are you currently studying in?</h2>
                <p>Showing valid semesters for your selected {academicYear}.</p>
              </div>

              <div className="semester-cards-grid" role="radiogroup" aria-label="Select semester">
                {(SEMESTERS_BY_YEAR[academicYear] || SEMESTERS_BY_YEAR["1st Year"]).map((s) => {
                  const isSelected = semester === s.id;
                  return (
                    <div
                      key={s.id}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      className={`semester-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setSemester(s.id)}
                      onKeyDown={(e) => {
                        if (e.key === " " || e.key === "Enter") {
                          e.preventDefault();
                          setSemester(s.id);
                        }
                      }}
                    >
                      <div className="sem-top">
                        <Hash size={18} className="sem-icon" />
                        <span className="sem-term-tag">{s.term}</span>
                      </div>
                      <strong className="sem-title">{s.label}</strong>
                      <span className="sem-academic-tag">{academicYear} Curriculum</span>
                      <div className="radio-circle sem-radio">
                        {isSelected && <div className="radio-dot" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="screen-footer-actions dual">
                <button
                  type="button"
                  className="secondary-flow-btn"
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  className="primary-flow-btn"
                  onClick={handleNext}
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STUDENT STEP: ENROLLMENT NUMBER ================= */}
          {currentStep?.id === "enrollment" && !isResultScreen && (
            <div className={`wizard-screen ${direction}`}>
              <div className="screen-header">
                <h2>What is your enrollment number?</h2>
                <p>Enter your university enrollment or admission registration number for academic ledger mapping.</p>
              </div>

              <div className="focused-question-container">
                <div className="field-group">
                  <label htmlFor={enrollmentNoId}>
                    <Hash size={16} /> University Enrollment / Roll Number
                  </label>
                  <input
                    ref={inputRef}
                    id={enrollmentNoId}
                    type="text"
                    className="form-input large-input mono"
                    placeholder="e.g., SVSU/2026/CSE/042"
                    value={enrollmentNo}
                    onChange={(e) => setEnrollmentNo(e.target.value.toUpperCase())}
                    required
                  />
                  <span className="field-hint">
                    Found on your Subharti Polytechnic admission receipt or semester fee voucher.
                  </span>
                </div>

                <div className="verification-status-note">
                  <FileText size={16} />
                  <span>
                    Your profile will be flagged as <strong>Pending Verification</strong> until validated against official registrar admission ledgers.
                  </span>
                </div>
              </div>

              <div className="screen-footer-actions dual">
                <button
                  type="button"
                  className="secondary-flow-btn"
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  className="primary-flow-btn"
                  onClick={handleNext}
                  disabled={!enrollmentNo.trim()}
                >
                  <span>Review Details</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STAFF STEP: DEPARTMENT ================= */}
          {currentStep?.id === "department" && !isResultScreen && (
            <div className={`wizard-screen ${direction}`}>
              <div className="screen-header">
                <h2>Which department do you belong to?</h2>
                <p>Select your assigned academic branch or administrative cell at Subharti Polytechnic.</p>
              </div>

              <div className="department-cards-grid" role="radiogroup" aria-label="Select department">
                {DEPARTMENTS.map((dept) => {
                  const isSelected = department === dept;
                  return (
                    <div
                      key={dept}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      className={`dept-choice-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setDepartment(dept)}
                      onKeyDown={(e) => {
                        if (e.key === " " || e.key === "Enter") {
                          e.preventDefault();
                          setDepartment(dept);
                        }
                      }}
                    >
                      <Building2 size={18} className="dept-icon" />
                      <span className="dept-name">{dept}</span>
                      <div className="radio-circle">
                        {isSelected && <div className="radio-dot" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="screen-footer-actions dual">
                <button
                  type="button"
                  className="secondary-flow-btn"
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  className="primary-flow-btn"
                  onClick={handleNext}
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STAFF STEP: EMPLOYEE ID ================= */}
          {currentStep?.id === "employeeId" && !isResultScreen && (
            <div className={`wizard-screen ${direction}`}>
              <div className="screen-header">
                <h2>What is your Employee ID?</h2>
                <p>Provide your institutional employee code assigned by SVSU administration.</p>
              </div>

              <div className="focused-question-container">
                <div className="field-group">
                  <label htmlFor={employeeIdId}>
                    <Hash size={16} /> Institutional Employee ID / Faculty Code
                  </label>
                  <input
                    ref={inputRef}
                    id={employeeIdId}
                    type="text"
                    className="form-input large-input mono"
                    placeholder="e.g., SVSU-FAC-204"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                    required
                  />
                  <span className="field-hint">Used by the Dean's office to cross-reference appointment orders.</span>
                </div>
              </div>

              <div className="screen-footer-actions dual">
                <button
                  type="button"
                  className="secondary-flow-btn"
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  className="primary-flow-btn"
                  onClick={handleNext}
                  disabled={!employeeId.trim()}
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STAFF STEP: RESPONSIBILITIES & SECURITY NOTICE ================= */}
          {currentStep?.id === "responsibilities" && !isResultScreen && (
            <div className={`wizard-screen ${direction}`}>
              <div className="screen-header">
                <h2>Institutional Access Request Details</h2>
                <p>Specify your academic designation and key institutional responsibilities.</p>
              </div>

              <div className="focused-question-container">
                <div className="field-group">
                  <label htmlFor={responsibilitiesId}>
                    <FileCheck size={16} /> Designation & Key Responsibilities
                  </label>
                  <textarea
                    ref={inputRef}
                    id={responsibilitiesId}
                    className="form-textarea large-textarea"
                    rows={3}
                    placeholder="e.g., Lecturer for CAD/CAM; In-charge of Industrial Automation Lab; Mentor for Batch 2026."
                    value={responsibilities}
                    onChange={(e) => setResponsibilities(e.target.value)}
                  />
                  <span className="field-hint">Brief description of your role in the department.</span>
                </div>

                <div className="institutional-notice-banner warning-style">
                  <ShieldCheck size={18} className="notice-icon" />
                  <p>
                    <strong>Administrative Authorization Required:</strong> In accordance with institutional security rules, public registration does NOT automatically grant administrative rights. Your account will be created with status <em>pending_approval</em> until authorized by the Polytechnic Dean or Registrar.
                  </p>
                </div>
              </div>

              <div className="screen-footer-actions dual">
                <button
                  type="button"
                  className="secondary-flow-btn"
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  className="primary-flow-btn"
                  onClick={handleNext}
                >
                  <span>Review Details</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP: REVIEW DETAILS ================= */}
          {currentStep?.id === "review" && !isResultScreen && (
            <div className={`wizard-screen ${direction}`}>
              <div className="screen-header">
                <h2>Review Your Details</h2>
                <p>Please review your information before final submission. Click Edit on any section to adjust it.</p>
              </div>

              <div className="review-sheet card-sub">
                {/* Role */}
                <div className="review-section">
                  <div className="review-section-header">
                    <span className="sec-tag">Role Classification</span>
                    <button
                      type="button"
                      className="edit-shortcut-btn"
                      onClick={() => jumpToQuestion("role")}
                    >
                      Edit
                    </button>
                  </div>
                  <div className="review-row-highlight">
                    <div className={`review-role-badge ${selectedRoleObj.badgeType}`}>
                      {selectedRoleObj.title}
                    </div>
                    <span className="review-inst-note">
                      {isStaff
                        ? "Institutional Staff Account (Requires Dean Authorization)"
                        : "Subharti Polytechnic Diploma Candidate"}
                    </span>
                  </div>
                </div>

                {/* Account Details */}
                <div className="review-section">
                  <div className="review-section-header">
                    <span className="sec-tag">Account Credentials</span>
                    <button
                      type="button"
                      className="edit-shortcut-btn"
                      onClick={() => jumpToQuestion("name")}
                    >
                      Edit
                    </button>
                  </div>
                  <div className="review-grid-data">
                    <div className="data-pair">
                      <span className="dp-label">Full Name</span>
                      <strong className="dp-val">{fullName}</strong>
                    </div>
                    <div className="data-pair">
                      <span className="dp-label">Email Address</span>
                      <strong className="dp-val">{email}</strong>
                    </div>
                    <div className="data-pair">
                      <span className="dp-label">Password</span>
                      <span className="dp-val masked">••••••••••••</span>
                    </div>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="review-section">
                  <div className="review-section-header">
                    <span className="sec-tag">
                      {isStaff ? "Institutional Profile" : "Academic Program"}
                    </span>
                    <button
                      type="button"
                      className="edit-shortcut-btn"
                      onClick={() => jumpToQuestion(isStaff ? "department" : "branch")}
                    >
                      Edit
                    </button>
                  </div>

                  {!isStaff ? (
                    <div className="review-grid-data">
                      <div className="data-pair">
                        <span className="dp-label">Branch</span>
                        <strong className="dp-val">{branch} Engineering</strong>
                      </div>
                      <div className="data-pair">
                        <span className="dp-label">Academic Year</span>
                        <strong className="dp-val">{academicYear}</strong>
                      </div>
                      <div className="data-pair">
                        <span className="dp-label">Semester</span>
                        <strong className="dp-val">{semester}</strong>
                      </div>
                      <div className="data-pair">
                        <span className="dp-label">Enrollment No.</span>
                        <strong className="dp-val mono">{enrollmentNo}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="review-grid-data">
                      <div className="data-pair">
                        <span className="dp-label">Department</span>
                        <strong className="dp-val">{department}</strong>
                      </div>
                      <div className="data-pair">
                        <span className="dp-label">Employee ID</span>
                        <strong className="dp-val mono">{employeeId}</strong>
                      </div>
                      {responsibilities && (
                        <div className="data-pair full-col">
                          <span className="dp-label">Responsibilities</span>
                          <span className="dp-val-desc">{responsibilities}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Notice */}
              <div className="review-status-notice">
                <ShieldCheck size={18} />
                <div>
                  <strong>
                    {isStaff
                      ? "Staff Access Request Notice"
                      : "Academic Verification Notice"}
                  </strong>
                  <p>
                    {isStaff
                      ? "Your account will be registered with status pending_approval. High-privilege features are unlocked only upon Dean authorization."
                      : "Your account credentials will be provisioned with status pending_verification, granting access to student features while registrar records verify enrollment."}
                  </p>
                </div>
              </div>

              {/* Code of Conduct Agreement Checkbox */}
              <div className="agreement-block">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="custom-checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <span>
                    I confirm that the details provided are accurate and correspond to official records at Swami Vivekanand Subharti University. I agree to comply with the <strong>Institutional Academic Code of Conduct</strong> and <strong>CollegeOS Privacy Terms</strong>.
                  </span>
                </label>
              </div>

              <div className="screen-footer-actions dual">
                <button
                  type="button"
                  className="secondary-flow-btn"
                  onClick={handleBack}
                  disabled={loading}
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  className="primary-flow-btn submit-btn"
                  onClick={handleFinalSubmit}
                  disabled={loading || !agreed}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="spinner" />
                      <span>Submitting to Gateway...</span>
                    </>
                  ) : (
                    <>
                      <span>{isStaff ? "Request Staff Access" : "Create My Account"}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================= OTP VERIFICATION SCREEN ================= */}
          {otpStage && !isResultScreen && (
            <div className={`wizard-screen otp-verification-screen ${direction}`}>
              <div className="otp-card-header">
                <div className="otp-icon-bubble">
                  <Mail size={32} className="otp-mail-icon" />
                </div>
                <div className="otp-badge-chip">
                  <Sparkles size={13} /> SVSU Institutional Verification
                </div>
                <h2>Verify Your Email Address</h2>
                <p>
                  To secure your academic profile, enter the 6-digit verification code dispatched to:
                </p>
                <div className="masked-email-pill">
                  <span className="masked-text">{maskedEmail || email}</span>
                  <button
                    type="button"
                    className="edit-email-btn"
                    onClick={() => {
                      setOtpStage(false);
                      jumpToQuestion("email");
                    }}
                    title="Change email address"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                </div>
              </div>

              {/* 6-Digit OTP Inputs Row */}
              <div className="otp-inputs-row" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    className={`otp-digit-box ${digit ? "filled" : ""}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    aria-label={`Digit ${idx + 1}`}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              {/* Dev Helper Callout */}
              {devOtp && (
                <div className="dev-otp-callout">
                  <span className="dev-tag">Local Simulation Helper</span>
                  <p>Your verification code is: <strong>{devOtp}</strong></p>
                  <button
                    type="button"
                    className="dev-quick-fill-btn"
                    onClick={() => {
                      const d = String(devOtp).split("");
                      setOtpDigits(d);
                      handleVerifyOtp(devOtp);
                    }}
                  >
                    Auto-fill & Verify Code
                  </button>
                </div>
              )}

              {/* Security Instruction Note */}
              <div className="otp-security-note">
                <KeyRound size={16} />
                <span>Verification codes expire in <strong>5 minutes</strong>. Never share your security credentials.</span>
              </div>

              {/* Actions & Resend Controls */}
              <div className="otp-actions-block">
                <button
                  type="button"
                  className="primary-flow-btn submit-btn"
                  onClick={() => handleVerifyOtp()}
                  disabled={loading || otpDigits.join("").length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="spinner" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Complete Onboarding</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="otp-resend-row">
                  {resendCooldown > 0 ? (
                    <span className="resend-countdown-text">
                      Resend code in <strong>{resendCooldown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="resend-otp-btn"
                      onClick={handleResendOtp}
                      disabled={loading || resendCount >= 5}
                    >
                      <RotateCw size={14} className={loading ? "spin" : ""} />
                      <span>Resend Verification Code</span>
                    </button>
                  )}
                  {resendCount > 0 && (
                    <span className="resend-limit-tag">
                      {5 - resendCount} resends left
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="cancel-otp-btn"
                  onClick={() => {
                    setOtpStage(false);
                    setErrorMsg("");
                  }}
                >
                  <ArrowLeft size={14} /> Back to Application Review
                </button>
              </div>
            </div>
          )}

          {/* ================= RESULT SCREEN: CELEBRATION & RECEIPT ================= */}
          {isResultScreen && (
            <div className={`wizard-screen result-screen ${direction}`}>
              <div className="celebration-badge-anim">
                <div className="success-pulse-circle">
                  <CheckCircle2 size={56} className="success-check-icon" />
                </div>
              </div>

              <h2 className="result-headline">
                {isStaff ? "Staff Access Request Submitted!" : "Welcome to Subharti Polytechnic!"}
              </h2>

              <p className="result-subtext">
                {submissionResult?.message ||
                  (isStaff
                    ? "Your faculty access request has been securely registered in the CollegeOS Gateway and routed for Dean authorization."
                    : "Your student credentials have been securely provisioned in the Subharti Academic Ledger.")}
              </p>

              {/* Account summary receipt */}
              <div className="account-summary-receipt">
                <div className="receipt-header">
                  <div className="receipt-brand">
                    <img
                      src="/svsu-logo-whiten.webp"
                      alt="SVSU"
                      className="receipt-logo"
                    />
                    <span>CollegeOS Official Gateway</span>
                  </div>
                  <span className={`status-pill ${isStaff ? "pending" : "active"}`}>
                    {isStaff ? "Pending Dean Approval" : "Pending Ledger Verification"}
                  </span>
                </div>

                <div className="receipt-body">
                  <div className="receipt-row">
                    <span>Account Holder:</span>
                    <strong>{fullName}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Email:</span>
                    <strong>{email}</strong>
                  </div>
                  <div className="receipt-row">
                    <span>Role:</span>
                    <strong>{selectedRoleObj.title}</strong>
                  </div>
                  {!isStaff ? (
                    <>
                      <div className="receipt-row">
                        <span>Branch:</span>
                        <strong>{branch} ({academicYear})</strong>
                      </div>
                      <div className="receipt-row">
                        <span>Semester:</span>
                        <strong>{semester}</strong>
                      </div>
                      <div className="receipt-row">
                        <span>Enrollment:</span>
                        <strong className="mono">{enrollmentNo}</strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="receipt-row">
                        <span>Department:</span>
                        <strong>{department}</strong>
                      </div>
                      <div className="receipt-row">
                        <span>Employee Code:</span>
                        <strong className="mono">{employeeId}</strong>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="result-action-buttons">
                <button
                  type="button"
                  className="primary-flow-btn"
                  onClick={() => onNavigate?.("login")}
                >
                  <LogIn size={18} />
                  <span>Proceed to Sign In</span>
                </button>
                <button
                  type="button"
                  className="secondary-flow-btn"
                  onClick={() => onNavigate?.("home")}
                >
                  <HomeIcon size={16} /> Return to Campus Home
                </button>
              </div>
            </div>
          )}
        </div>
      </AuthLayout>
    );
  }
