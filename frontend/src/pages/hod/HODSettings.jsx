import React, { useState, useEffect, useMemo, useCallback, useContext } from "react";
import { createPortal } from "react-dom";
import {
  User,
  Palette,
  Bell,
  Sliders,
  Shield,
  FileBarChart,
  Activity,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Check,
  Moon,
  Sun,
  Monitor,
  Building,
  Mail,
  Phone,
  Clock,
  Layers,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
  FileText,
  Wifi,
  WifiOff,
  Minus,
  Plus,
  X,
  Laptop
} from "lucide-react";
import { authApi } from "../../services/authApi";
import { ThemeContext } from "../../context/ThemeContext";
import "./HODTheme.css";
import "./HODSettings.css";

const CATEGORIES = [
  { id: "account", label: "Profile & Identity", icon: User, desc: "Personal info & department designation", color: "indigo" },
  { id: "appearance", label: "Display & Theme", icon: Palette, desc: "Theme modes, density & animations", color: "violet" },
  { id: "notifications", label: "Alerts & Triggers", icon: Bell, desc: "Faculty leaves & risk alerts", color: "amber" },
  { id: "academic", label: "Academic Rules", icon: Sliders, desc: "Attendance & examination thresholds", color: "emerald" },
  { id: "security", label: "Security & Credentials", icon: Shield, desc: "Password & executive sessions", color: "rose" },
  { id: "reports", label: "Reports & Data", icon: FileBarChart, desc: "Reporting period & export formats", color: "purple" },
  { id: "system", label: "System Health & Info", icon: Activity, desc: "Live API gateway & diagnostics", color: "cyan" }
];

export default function HODSettings({ currentUser, onNavigate, showToast }) {
  const themeCtx = useContext(ThemeContext);

  // Navigation & Search state
  const [activeCategory, setActiveCategory] = useState("account");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  // Loading and feedback states
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingAcademic, setSavingAcademic] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // 1. Account / Profile state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("CSE");
  const [phone, setPhone] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");

  // 2. Appearance & Personalization state
  const [theme, setTheme] = useState("dark");
  const [tableDensity, setTableDensity] = useState("comfortable");
  const [defaultLandingTab, setDefaultLandingTab] = useState("overview");
  const [tablePageSize, setTablePageSize] = useState(10);
  const [reducedMotion, setReducedMotion] = useState(false);

  // 3. Notification Preferences state
  const [notifications, setNotifications] = useState({
    facultyLeaveAlerts: true,
    examSubmissionAlerts: true,
    nbaComplianceAlerts: true,
    lowAttendanceAlerts: true,
    academicRiskAlerts: true,
    emailDigest: false
  });

  // 4. Academic Rules & Thresholds state (SystemSettings)
  const [minAttendanceThreshold, setMinAttendanceThreshold] = useState(75);
  const [examRiskThreshold, setExamRiskThreshold] = useState(40);
  const [academicSession, setAcademicSession] = useState("2026-2027");
  const [obeTracking, setObeTracking] = useState(true);

  // 5. Security & Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submittingPass, setSubmittingPass] = useState(false);

  // 6. Reports state
  const [defaultPeriod, setDefaultPeriod] = useState("semester");
  const [exportFormat, setExportFormat] = useState("pdf");

  // 7. System Health state
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [lastPingTime, setLastPingTime] = useState("");

  // Baseline snapshots for separate persistence boundaries
  const [baselineData, setBaselineData] = useState(null);
  const [baselineAcademic, setBaselineAcademic] = useState({
    minAttendance: 75,
    examRisk: 40,
    session: "2026-2027"
  });

  // Network listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Live health status probe with response latency calculation
  const fetchHealthStatus = useCallback(async () => {
    setHealthLoading(true);
    const startTime = performance.now();
    try {
      const data = await authApi.getHealth();
      const latency = Math.round(performance.now() - startTime);
      setHealthData({ ...data, latencyMs: latency });
      setLastPingTime(new Date().toLocaleTimeString());
    } catch (err) {
      setHealthData({
        success: false,
        status: "degraded",
        service: "CollegeOS Core API Gateway",
        error: err.message,
        database: { connected: false },
        latencyMs: null
      });
      setLastPingTime(new Date().toLocaleTimeString());
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Async parallel initial data loader
  useEffect(() => {
    let ignore = false;

    const loadAllSettings = async () => {
      try {
        const [profileRes, settingsRes, healthRes] = await Promise.all([
          authApi.getProfile().catch(() => null),
          authApi.getSettings().catch(() => null),
          authApi.getHealth().catch((err) => ({
            success: false,
            status: "degraded",
            service: "CollegeOS Core API Gateway",
            error: err.message,
            database: { connected: false }
          }))
        ]);

        if (ignore) return;

        // 1. Profile Data
        const user = profileRes?.user || currentUser || {};
        const prof = profileRes?.profile || {};

        const currentFullName = user.fullName || "";
        const currentEmail = user.email || "";
        const currentDept = prof.department || user.department || "CSE";
        const currentPhone = user.phone || "";
        const currentHeadline = user.headline || "Head of Department";
        const currentBio = user.bio || "";

        setFullName(currentFullName);
        setEmail(currentEmail);
        setDepartment(currentDept);
        setPhone(currentPhone);
        setHeadline(currentHeadline);
        setBio(currentBio);

        // 2. Preferences
        const prefs = user.preferences || {};
        const currentTheme = prefs.theme || (themeCtx?.theme || "dark");
        const currentDensity = prefs.tableDensity || "comfortable";
        const currentTab = prefs.defaultLandingTab || "overview";
        const currentPageSize = prefs.tablePageSize || 10;
        const currentMotion = Boolean(prefs.reducedMotion);

        setTheme(currentTheme);
        setTableDensity(currentDensity);
        setDefaultLandingTab(currentTab);
        setTablePageSize(currentPageSize);
        setReducedMotion(currentMotion);

        const notifs = {
          facultyLeaveAlerts: prefs.notifications?.facultyLeaveAlerts ?? true,
          examSubmissionAlerts: prefs.notifications?.examSubmissionAlerts ?? true,
          nbaComplianceAlerts: prefs.notifications?.nbaComplianceAlerts ?? true,
          lowAttendanceAlerts: prefs.notifications?.lowAttendanceAlerts ?? true,
          academicRiskAlerts: prefs.notifications?.academicRiskAlerts ?? true,
          emailDigest: prefs.notifications?.emailDigest ?? false
        };
        setNotifications(notifs);

        const currentPeriod = prefs.reports?.defaultPeriod || "semester";
        const currentExport = prefs.reports?.exportFormat || "pdf";
        setDefaultPeriod(currentPeriod);
        setExportFormat(currentExport);

        // 3. Academic System Settings
        let initialMinAtt = 75;
        let initialExamRisk = 40;
        let initialSession = "2026-2027";

        if (settingsRes?.settings) {
          if (settingsRes.settings.min_attendance_threshold != null) {
            initialMinAtt = Number(settingsRes.settings.min_attendance_threshold);
            setMinAttendanceThreshold(initialMinAtt);
          }
          if (settingsRes.settings.exam_risk_threshold_percentage != null) {
            initialExamRisk = Number(settingsRes.settings.exam_risk_threshold_percentage);
            setExamRiskThreshold(initialExamRisk);
          }
          if (settingsRes.settings.academic_session) {
            initialSession = String(settingsRes.settings.academic_session);
            setAcademicSession(initialSession);
          }
        }
        setBaselineAcademic({
          minAttendance: initialMinAtt,
          examRisk: initialExamRisk,
          session: initialSession
        });

        // 4. System Health Data
        if (healthRes) {
          setHealthData(healthRes);
          setLastPingTime(new Date().toLocaleTimeString());
        }

        // 5. Baseline for dirty checking
        setBaselineData({
          fullName: currentFullName,
          phone: currentPhone,
          headline: currentHeadline,
          bio: currentBio,
          theme: currentTheme,
          tableDensity: currentDensity,
          defaultLandingTab: currentTab,
          tablePageSize: currentPageSize,
          reducedMotion: currentMotion,
          notifications: notifs,
          defaultPeriod: currentPeriod,
          exportFormat: currentExport
        });
      } catch (err) {
        if (!ignore) {
          showToast?.(err.message || "Failed to load settings.", true);
        }
      } finally {
        if (!ignore) {
          setLoadingInitial(false);
        }
      }
    };

    loadAllSettings();

    return () => {
      ignore = true;
    };
  }, [currentUser, showToast, themeCtx?.theme]);

  // Dirty state checking for Preferences
  const isPrefsDirty = useMemo(() => {
    if (!baselineData) return false;
    if (fullName !== baselineData.fullName) return true;
    if (phone !== baselineData.phone) return true;
    if (headline !== baselineData.headline) return true;
    if (bio !== baselineData.bio) return true;
    if (theme !== baselineData.theme) return true;
    if (tableDensity !== baselineData.tableDensity) return true;
    if (defaultLandingTab !== baselineData.defaultLandingTab) return true;
    if (tablePageSize !== baselineData.tablePageSize) return true;
    if (reducedMotion !== baselineData.reducedMotion) return true;
    if (defaultPeriod !== baselineData.defaultPeriod) return true;
    if (exportFormat !== baselineData.exportFormat) return true;

    for (const key of Object.keys(notifications)) {
      if (notifications[key] !== baselineData.notifications?.[key]) return true;
    }
    return false;
  }, [
    baselineData,
    fullName,
    phone,
    headline,
    bio,
    theme,
    tableDensity,
    defaultLandingTab,
    tablePageSize,
    reducedMotion,
    notifications,
    defaultPeriod,
    exportFormat
  ]);

  // Dirty state checking for Academic Thresholds
  const isAcademicDirty = useMemo(() => {
    if (!baselineAcademic) return false;
    if (Number(minAttendanceThreshold) !== baselineAcademic.minAttendance) return true;
    if (Number(examRiskThreshold) !== baselineAcademic.examRisk) return true;
    if (academicSession !== baselineAcademic.session) return true;
    return false;
  }, [baselineAcademic, minAttendanceThreshold, examRiskThreshold, academicSession]);

  // Immediate live theme changer
  const handleSelectTheme = (newTheme) => {
    setTheme(newTheme);
    if (themeCtx?.setTheme) {
      themeCtx.setTheme(newTheme);
    } else if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", newTheme);
      if (newTheme === "light") {
        document.documentElement.classList.add("theme-light");
        document.documentElement.classList.remove("theme-dark");
      } else {
        document.documentElement.classList.add("theme-dark");
        document.documentElement.classList.remove("theme-light");
      }
    }
  };

  // Discard all preference changes
  const handleDiscardPreferences = () => {
    if (!baselineData) return;
    setFullName(baselineData.fullName);
    setPhone(baselineData.phone);
    setHeadline(baselineData.headline);
    setBio(baselineData.bio);
    handleSelectTheme(baselineData.theme);
    setTableDensity(baselineData.tableDensity);
    setDefaultLandingTab(baselineData.defaultLandingTab);
    setTablePageSize(baselineData.tablePageSize);
    setReducedMotion(baselineData.reducedMotion);
    setNotifications({ ...baselineData.notifications });
    setDefaultPeriod(baselineData.defaultPeriod);
    setExportFormat(baselineData.exportFormat);
    showToast?.("Preference adjustments discarded.");
  };

  // Save Preferences to backend
  const handleSaveAllPreferences = async () => {
    setSavingSettings(true);
    setSaveSuccessMsg("");
    try {
      const payload = {
        fullName,
        phone,
        headline,
        bio,
        preferences: {
          theme,
          tableDensity,
          defaultLandingTab,
          tablePageSize,
          reducedMotion,
          notifications,
          reports: {
            defaultPeriod,
            exportFormat
          }
        }
      };

      const res = await authApi.updateProfile(payload);
      if (res?.user) {
        setBaselineData({
          fullName,
          phone,
          headline,
          bio,
          theme,
          tableDensity,
          defaultLandingTab,
          tablePageSize,
          reducedMotion,
          notifications: { ...notifications },
          defaultPeriod,
          exportFormat
        });
        setSaveSuccessMsg("Executive settings saved & synchronized successfully!");
        showToast?.("Preferences synchronized with backend!");
        setTimeout(() => setSaveSuccessMsg(""), 4000);
      }
    } catch (err) {
      showToast?.(err.message || "Failed to save settings.", true);
    } finally {
      setSavingSettings(false);
    }
  };

  // Save Academic Rules & Thresholds to backend SystemSetting with AuditLog
  const handleSaveAcademicSettings = async (e) => {
    e?.preventDefault();
    setSavingAcademic(true);
    try {
      await authApi.updateSetting({
        key: "min_attendance_threshold",
        value: Number(minAttendanceThreshold)
      });
      await authApi.updateSetting({
        key: "exam_risk_threshold_percentage",
        value: Number(examRiskThreshold)
      });
      await authApi.updateSetting({
        key: "academic_session",
        value: academicSession
      });

      setBaselineAcademic({
        minAttendance: Number(minAttendanceThreshold),
        examRisk: Number(examRiskThreshold),
        session: academicSession
      });

      showToast?.("Academic policies updated & immutably logged to AuditLog!");
    } catch (err) {
      showToast?.(err.message || "Failed to update academic rules.", true);
    } finally {
      setSavingAcademic(false);
    }
  };

  // Change Password Handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast?.("Current password is required.", true);
      return;
    }
    if (newPassword.length < 8) {
      showToast?.("New password must be at least 8 characters.", true);
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      showToast?.("Password must contain uppercase, lowercase, and numeric characters.", true);
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast?.("New passwords do not match.", true);
      return;
    }

    setSubmittingPass(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      showToast?.("Executive credentials updated securely!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast?.(err.message || "Failed to update password.", true);
    } finally {
      setSubmittingPass(false);
    }
  };

  // Sign out execution
  const executeLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      setShowLogoutModal(false);
      onNavigate?.("login");
    }
  };

  // Password Policy Checklist
  const passwordPolicy = useMemo(() => {
    return [
      { id: "len", text: "At least 8 characters", met: newPassword.length >= 8 },
      { id: "upper", text: "At least one uppercase letter (A-Z)", met: /[A-Z]/.test(newPassword) },
      { id: "lower", text: "At least one lowercase letter (a-z)", met: /[a-z]/.test(newPassword) },
      { id: "num", text: "At least one number (0-9)", met: /[0-9]/.test(newPassword) },
      { id: "match", text: "Passwords match", met: Boolean(confirmPassword && newPassword === confirmPassword) }
    ];
  }, [newPassword, confirmPassword]);

  // Password Strength calculation
  const pwdStrength = useMemo(() => {
    if (!newPassword) return { score: 0, text: "", width: "0%", color: "" };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score++;
    if (/\d/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    if (newPassword.length < 8) {
      return { score: 1, text: "Weak (minimum 8 characters required)", width: "25%", color: "var(--hod-rose)" };
    }
    if (score <= 2) {
      return { score: 2, text: "Fair — Add capital letters and numbers", width: "50%", color: "var(--hod-amber)" };
    }
    if (score === 3 || score === 4) {
      return { score: 3, text: "Good — Add special characters for maximum security", width: "75%", color: "var(--hod-cyan)" };
    }
    return { score: 5, text: "Excellent — Enterprise-grade passphrase", width: "100%", color: "var(--hod-emerald)" };
  }, [newPassword]);

  // Search Filter matching
  const categoryMatches = useMemo(() => {
    if (!searchQuery.trim()) return {};
    const q = searchQuery.toLowerCase().trim();
    const map = {};

    const keywords = {
      account: ["name", "email", "phone", "bio", "headline", "avatar", "profile", "account", "identity", "chair", "cse"],
      appearance: ["dark", "light", "theme", "density", "compact", "landing", "page size", "motion", "appearance", "display"],
      notifications: ["alert", "notification", "leave", "exam", "nba", "attendance alert", "risk alert", "email digest", "digest"],
      academic: ["threshold", "minimum attendance", "attendance threshold", "risk", "session", "academic", "obe", "rules", "policy", "criteria"],
      security: ["password", "security", "session", "credential", "logout", "token", "login", "auth", "jwt"],
      reports: ["report", "export", "pdf", "csv", "excel", "period", "semester", "format"],
      system: ["health", "system", "api", "database", "uptime", "version", "online", "network", "ping", "diagnostics"]
    };

    for (const cat of CATEGORIES) {
      const matchInTitle = cat.label.toLowerCase().includes(q) || cat.desc.toLowerCase().includes(q);
      const matchInKeywords = (keywords[cat.id] || []).some((k) => k.includes(q) || q.includes(k));
      if (matchInTitle || matchInKeywords) {
        map[cat.id] = true;
      }
    }
    return map;
  }, [searchQuery]);

  // Last login date display
  const formattedLastLogin = useMemo(() => {
    const raw = currentUser?.lastLoginAt;
    if (!raw) return "Current executive session";
    try {
      const d = new Date(raw);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return String(raw);
    }
  }, [currentUser?.lastLoginAt]);

  // Accessible custom Switch component with 44px tap target
  const renderSwitch = (id, checked, onChange, label) => (
    <div className="hod-switch-wrap">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`hod-switch-track ${checked ? "active" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="hod-switch-thumb" />
      </button>
    </div>
  );

  return (
    <div className={`hod-set-container ${isPrefsDirty || isAcademicDirty ? "has-dirty-padding" : ""}`}>
      {/* Ambient background lighting */}
      <div className="hod-set-ambient-glow left" />
      <div className="hod-set-ambient-glow right" />

      {/* Top Header */}
      <header className="hod-set-header">
        <div className="hod-set-title-group">
          <div className="hod-set-title-icon-wrap">
            <SlidersHorizontal size={22} />
          </div>
          <div>
            <h2>Department Leadership & Executive Settings</h2>
            <p>Institutional policies, academic thresholds, credentials & live infrastructure diagnostics</p>
          </div>
        </div>

        {/* Global Search and Quick Actions */}
        <div className="hod-set-top-actions">
          <div className="hod-set-search-wrap">
            <Search size={16} className="hod-set-search-icon" />
            <input
              type="text"
              placeholder="Search settings (e.g. theme, threshold)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="hod-set-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="hod-set-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="hod-btn-primary hod-set-quick-save"
            onClick={handleSaveAllPreferences}
            disabled={savingSettings || !isPrefsDirty}
            title={isPrefsDirty ? "Save pending adjustments" : "All settings synced"}
          >
            <Save size={15} />
            <span>{savingSettings ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </header>

      {/* Mobile Category Dropdown Selector (< 768px) */}
      <div className="hod-mobile-cat-selector">
        <label htmlFor="hodMobileCategorySelect" className="hod-label">
          Jump to Category:
        </label>
        <div className="hod-select-wrap">
          <select
            id="hodMobileCategorySelect"
            className="hod-input hod-mobile-cat-select"
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label} {categoryMatches[cat.id] ? "★" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Horizontal Scrollable Category Chips */}
      <nav className="hod-mobile-chips-bar" aria-label="Mobile categories">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const isMatch = Boolean(categoryMatches[cat.id]);

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`hod-mobile-chip ${isActive ? "active" : ""} ${isMatch ? "matched" : ""}`}
            >
              <Icon size={15} />
              <span>{cat.label}</span>
              {isMatch && <span className="hod-chip-dot" />}
            </button>
          );
        })}
      </nav>

      {/* Main Settings Split View */}
      <div className="hod-set-layout">
        {/* Left Category Sidebar Navigation (Desktop >= 768px) */}
        <aside className="hod-set-nav-sidebar">
          <nav className="hod-set-nav-list" aria-label="Settings categories">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              const isMatch = Boolean(categoryMatches[cat.id]);
              const showSearchHighlight = searchQuery.trim() && isMatch;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`hod-set-nav-item ${cat.color} ${isActive ? "active" : ""} ${
                    showSearchHighlight ? "search-matched" : ""
                  }`}
                  aria-selected={isActive}
                >
                  <div className={`hod-set-nav-icon ${cat.color}`}>
                    <Icon size={17} />
                  </div>
                  <div className="hod-set-nav-text">
                    <span className="hod-set-nav-label">{cat.label}</span>
                    <span className="hod-set-nav-desc">{cat.desc}</span>
                  </div>
                  {showSearchHighlight && <span className="hod-set-match-pill">Match</span>}
                  <ChevronRight size={14} className="hod-set-nav-chevron" />
                </button>
              );
            })}
          </nav>

          {/* Quick Network Status Card in Sidebar */}
          <div className="hod-set-sidebar-footer">
            <div className="hod-set-status-badge">
              {isOnline ? (
                <>
                  <span className="hod-dot online" />
                  <span>Network: Online</span>
                </>
              ) : (
                <>
                  <span className="hod-dot offline" />
                  <span>Network: Offline</span>
                </>
              )}
            </div>
            <div className="hod-set-version-info">
              <span>CollegeOS Enterprise v4.2.0</span>
              <span>SVSU Subharti Polytechnic</span>
            </div>
          </div>
        </aside>

        {/* Right Content Canvas */}
        <main className="hod-set-content-canvas">
          {loadingInitial ? (
            <div className="hod-set-loading-skeleton">
              <RefreshCw size={28} className="hod-spin" color="var(--hod-primary)" />
              <p>Synchronizing settings from CollegeOS API Gateway...</p>
            </div>
          ) : (
            <>
              {/* Category 1: Profile & Identity */}
              {activeCategory === "account" && (
                <section className="hod-set-section hod-stagger-1">
                  <div className="hod-set-section-header">
                    <div>
                      <div className="hod-set-sec-badge indigo">
                        <User size={13} />
                        <span>Profile & Department Identity</span>
                      </div>
                      <h3>Institutional Leadership Information</h3>
                      <p>View your verified academic credentials and update department office contact details.</p>
                    </div>
                  </div>

                  <div className="hod-card hod-set-card">
                    {/* Identity Banner */}
                    <div className="hod-set-identity-bar">
                      <div className="hod-set-avatar-circle">
                        {fullName
                          ? fullName
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()
                          : "HD"}
                      </div>
                      <div className="hod-set-identity-info">
                        <h4>{fullName || "Department Executive"}</h4>
                        <div className="hod-set-identity-badges">
                          <span className="hod-pill indigo">Head of Department</span>
                          <span className="hod-pill emerald">{department || "CSE"} Department</span>
                          <span className="hod-pill violet">Academic Council</span>
                        </div>
                      </div>
                    </div>

                    <div className="hod-set-grid-fields">
                      <div className="hod-form-field">
                        <label className="hod-label">
                          <User size={14} /> Full Executive Name
                        </label>
                        <input
                          type="text"
                          className="hod-input"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Dr. Rajesh K. Sharma"
                        />
                      </div>

                      <div className="hod-form-field">
                        <label className="hod-label">
                          <Mail size={14} /> Official Institutional Email
                        </label>
                        <div className="hod-input-wrap">
                          <input
                            type="email"
                            className="hod-input hod-input-readonly"
                            value={email}
                            readOnly
                            title="Email changes are restricted to University IT Registrar"
                          />
                          <Lock size={14} className="hod-input-lock-icon" />
                        </div>
                      </div>

                      <div className="hod-form-field">
                        <label className="hod-label">
                          <Building size={14} /> Academic Department
                        </label>
                        <div className="hod-input-wrap">
                          <input
                            type="text"
                            className="hod-input hod-input-readonly"
                            value={department}
                            readOnly
                            title="Department designation is authorized by Academic Council"
                          />
                          <Lock size={14} className="hod-input-lock-icon" />
                        </div>
                      </div>

                      <div className="hod-form-field">
                        <label className="hod-label">
                          <Phone size={14} /> Department Office Phone
                        </label>
                        <input
                          type="tel"
                          className="hod-input"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                        />
                      </div>

                      <div className="hod-form-field hod-field-full">
                        <label className="hod-label">Professional Academic Headline</label>
                        <input
                          type="text"
                          className="hod-input"
                          value={headline}
                          onChange={(e) => setHeadline(e.target.value)}
                          placeholder="e.g. Professor & Head of Department, Computer Science & Engineering"
                        />
                      </div>

                      <div className="hod-form-field hod-field-full">
                        <div className="hod-label-with-badge">
                          <label className="hod-label">Department Executive Bio</label>
                          <span className={`hod-char-counter ${bio.length >= 480 ? "warn" : ""}`}>
                            {bio.length} / 500
                          </span>
                        </div>
                        <textarea
                          className="hod-input hod-textarea"
                          rows="4"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Outline departmental objectives, research focus, curriculum oversight, and faculty development initiatives..."
                          maxLength={500}
                        />
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Category 2: Display & Appearance */}
              {activeCategory === "appearance" && (
                <section className="hod-set-section hod-stagger-1">
                  <div className="hod-set-section-header">
                    <div>
                      <div className="hod-set-sec-badge violet">
                        <Palette size={13} />
                        <span>Display & Personalization</span>
                      </div>
                      <h3>Theme, Table Density & Visual Controls</h3>
                      <p>Customize your dashboard experience with instant theme application and layout adjustments.</p>
                    </div>
                  </div>

                  {/* Theme Selector */}
                  <div className="hod-card hod-set-card">
                    <h4 className="hod-subhead">Executive Theme Mode</h4>
                    <p className="hod-subhead-desc">
                      Select your preferred theme. Click any option to preview and apply it instantly.
                    </p>

                    <div className="hod-theme-cards-grid">
                      <div
                        className={`hod-theme-mode-card ${theme === "dark" ? "selected" : ""}`}
                        onClick={() => handleSelectTheme("dark")}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleSelectTheme("dark")}
                      >
                        <div className="hod-theme-preview-icon dark">
                          <Moon size={22} />
                        </div>
                        <div className="hod-theme-mode-text">
                          <span className="hod-theme-mode-title">Midnight Indigo (Dark)</span>
                          <span className="hod-theme-mode-desc">
                            Deep contrast midnight palette engineered for low-light concentration.
                          </span>
                        </div>
                        <div className="hod-theme-check-radio">
                          {theme === "dark" && <Check size={14} />}
                        </div>
                      </div>

                      <div
                        className={`hod-theme-mode-card ${theme === "light" ? "selected" : ""}`}
                        onClick={() => handleSelectTheme("light")}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleSelectTheme("light")}
                      >
                        <div className="hod-theme-preview-icon light">
                          <Sun size={22} />
                        </div>
                        <div className="hod-theme-mode-text">
                          <span className="hod-theme-mode-title">Institutional Clean (Light)</span>
                          <span className="hod-theme-mode-desc">
                            High-legibility paper-white palette optimal for bright daylit offices.
                          </span>
                        </div>
                        <div className="hod-theme-check-radio">
                          {theme === "light" && <Check size={14} />}
                        </div>
                      </div>

                      <div
                        className={`hod-theme-mode-card ${theme === "system" ? "selected" : ""}`}
                        onClick={() => handleSelectTheme("system")}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleSelectTheme("system")}
                      >
                        <div className="hod-theme-preview-icon system">
                          <Monitor size={22} />
                        </div>
                        <div className="hod-theme-mode-text">
                          <span className="hod-theme-mode-title">System Default</span>
                          <span className="hod-theme-mode-desc">
                            Automatically synchronize with operating system dark/light preference.
                          </span>
                        </div>
                        <div className="hod-theme-check-radio">
                          {theme === "system" && <Check size={14} />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Layout & Table Controls */}
                  <div className="hod-card hod-set-card">
                    <h4 className="hod-subhead">Data Presentation & Layout Controls</h4>

                    <div className="hod-set-grid-fields">
                      <div className="hod-form-field">
                        <label className="hod-label">Table Row Density</label>
                        <div className="hod-btn-segmented">
                          <button
                            type="button"
                            className={`hod-segment-btn ${tableDensity === "comfortable" ? "active" : ""}`}
                            onClick={() => setTableDensity("comfortable")}
                          >
                            Comfortable
                          </button>
                          <button
                            type="button"
                            className={`hod-segment-btn ${tableDensity === "compact" ? "active" : ""}`}
                            onClick={() => setTableDensity("compact")}
                          >
                            Compact
                          </button>
                        </div>
                        <span className="hod-field-hint">
                          {tableDensity === "compact"
                            ? "Dense row heights allow viewing more roster entries without scrolling."
                            : "Standard comfortable spacing for effortless review."}
                        </span>
                      </div>

                      <div className="hod-form-field">
                        <label className="hod-label">Default Executive Landing Tab</label>
                        <select
                          className="hod-input hod-select"
                          value={defaultLandingTab}
                          onChange={(e) => setDefaultLandingTab(e.target.value)}
                        >
                          <option value="overview">Executive Command Overview</option>
                          <option value="teachers">Department Faculty Roster</option>
                          <option value="students">Department Student Directory</option>
                          <option value="attendance">Daily Attendance Monitoring</option>
                          <option value="results">Examinations & Marksheets</option>
                          <option value="timetable">Department Class Timetable</option>
                          <option value="materials">Course Notes & Syllabus</option>
                          <option value="leaves">Faculty Leave Applications</option>
                          <option value="reports">Academic Analytics Reports</option>
                        </select>
                      </div>

                      <div className="hod-form-field">
                        <label className="hod-label">Default Table Records Per Page</label>
                        <div className="hod-btn-segmented">
                          {[10, 25, 50].map((size) => (
                            <button
                              key={size}
                              type="button"
                              className={`hod-segment-btn ${tablePageSize === size ? "active" : ""}`}
                              onClick={() => setTablePageSize(size)}
                            >
                              {size} rows
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="hod-form-field">
                        <label className="hod-label">Reduced Motion Accessibility</label>
                        <div className="hod-pref-item">
                          <div className="hod-pref-info">
                            <span className="hod-pref-title">Minimize Animations</span>
                            <span className="hod-pref-desc">
                              Reduce transition speeds and motion effects for smoother rendering.
                            </span>
                          </div>
                          {renderSwitch(
                            "reducedMotionToggle",
                            reducedMotion,
                            setReducedMotion,
                            "Toggle reduced motion mode"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Category 3: Notifications & Triggers */}
              {activeCategory === "notifications" && (
                <section className="hod-set-section hod-stagger-1">
                  <div className="hod-set-section-header">
                    <div>
                      <div className="hod-set-sec-badge amber">
                        <Bell size={13} />
                        <span>Workflow Alerts & Triggers</span>
                      </div>
                      <h3>Department Notifications & Early Warnings</h3>
                      <p>Configure automated triggers for approvals, student compliance, and weekly summaries.</p>
                    </div>
                  </div>

                  <div className="hod-card hod-set-card">
                    <div className="hod-pref-list">
                      <div className="hod-pref-item">
                        <div className="hod-pref-info">
                          <span className="hod-pref-title">Faculty Leave Applications</span>
                          <span className="hod-pref-desc">
                            Receive notifications when faculty members apply for casual, earned, or duty leaves.
                          </span>
                        </div>
                        {renderSwitch(
                          "facultyLeaveAlerts",
                          notifications.facultyLeaveAlerts,
                          (val) => setNotifications((prev) => ({ ...prev, facultyLeaveAlerts: val })),
                          "Faculty leave alerts"
                        )}
                      </div>

                      <div className="hod-pref-item">
                        <div className="hod-pref-info">
                          <span className="hod-pref-title">Exam & Sessional Marks Submissions</span>
                          <span className="hod-pref-desc">
                            Alert when department teachers upload midterm marks or practical evaluations.
                          </span>
                        </div>
                        {renderSwitch(
                          "examSubmissionAlerts",
                          notifications.examSubmissionAlerts,
                          (val) => setNotifications((prev) => ({ ...prev, examSubmissionAlerts: val })),
                          "Exam marks alerts"
                        )}
                      </div>

                      <div className="hod-pref-item">
                        <div className="hod-pref-info">
                          <span className="hod-pref-title">NBA & Board of Technical Education Compliance</span>
                          <span className="hod-pref-desc">
                            Institutional advisories and compliance deadlines from Principal and University Registrar.
                          </span>
                        </div>
                        {renderSwitch(
                          "nbaComplianceAlerts",
                          notifications.nbaComplianceAlerts,
                          (val) => setNotifications((prev) => ({ ...prev, nbaComplianceAlerts: val })),
                          "NBA compliance alerts"
                        )}
                      </div>

                      <div className="hod-pref-item">
                        <div className="hod-pref-info">
                          <span className="hod-pref-title">Low Attendance Threshold Warnings</span>
                          <span className="hod-pref-desc">
                            Trigger automatic alerts when student monthly attendance falls below the minimum threshold.
                          </span>
                        </div>
                        {renderSwitch(
                          "lowAttendanceAlerts",
                          notifications.lowAttendanceAlerts,
                          (val) => setNotifications((prev) => ({ ...prev, lowAttendanceAlerts: val })),
                          "Low attendance warnings"
                        )}
                      </div>

                      <div className="hod-pref-item">
                        <div className="hod-pref-info">
                          <span className="hod-pref-title">Academic Risk & Backlog Registry Alerts</span>
                          <span className="hod-pref-desc">
                            Alert when students accumulate multiple backlogs or fail internal sessional tests.
                          </span>
                        </div>
                        {renderSwitch(
                          "academicRiskAlerts",
                          notifications.academicRiskAlerts,
                          (val) => setNotifications((prev) => ({ ...prev, academicRiskAlerts: val })),
                          "Academic risk alerts"
                        )}
                      </div>

                      <div className="hod-pref-item">
                        <div className="hod-pref-info">
                          <span className="hod-pref-title">Consolidated Weekly Executive Email Digest</span>
                          <span className="hod-pref-desc">
                            Send weekly department attendance and faculty leave summaries to your registered email.
                          </span>
                        </div>
                        {renderSwitch(
                          "emailDigest",
                          notifications.emailDigest,
                          (val) => setNotifications((prev) => ({ ...prev, emailDigest: val })),
                          "Weekly email digest"
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Category 4: Academic Rules & Thresholds */}
              {activeCategory === "academic" && (
                <section className="hod-set-section hod-stagger-1">
                  <div className="hod-set-section-header">
                    <div>
                      <div className="hod-set-sec-badge emerald">
                        <Sliders size={13} />
                        <span>Academic Rules & Policies</span>
                      </div>
                      <h3>Institutional Criteria & Threshold Configuration</h3>
                      <p>
                        Establish department criteria for exam eligibility and academic risk. All adjustments create an immutable AuditLog record.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveAcademicSettings} className="hod-card hod-set-card">
                    {/* Audit Trail Disclaimer Notice */}
                    <div className="hod-audit-notice-box">
                      <ShieldAlert size={20} className="hod-audit-notice-icon" />
                      <div>
                        <strong>Institutional Audit Trail Active:</strong>
                        <p>
                          Threshold modifications directly update eligibility checks across all student and teacher rosters.
                          Every adjustment is immutably logged with your HOD credentials into <code>AuditLog</code>.
                        </p>
                      </div>
                    </div>

                    <div className="hod-set-grid-fields">
                      {/* Attendance Threshold with Touch Step Buttons */}
                      <div className="hod-form-field">
                        <div className="hod-label-with-badge">
                          <label className="hod-label">Minimum Attendance Requirement</label>
                          <span className="hod-pill emerald">{minAttendanceThreshold}% Required</span>
                        </div>

                        <div className="hod-slider-control-row">
                          <button
                            type="button"
                            className="hod-slider-step-btn"
                            onClick={() => setMinAttendanceThreshold((prev) => Math.max(50, prev - 1))}
                            disabled={minAttendanceThreshold <= 50}
                            aria-label="Decrease attendance threshold by 1 percent"
                          >
                            <Minus size={15} />
                          </button>

                          <div className="hod-slider-track-wrap">
                            <input
                              type="range"
                              min="50"
                              max="90"
                              step="1"
                              value={minAttendanceThreshold}
                              onChange={(e) => setMinAttendanceThreshold(Number(e.target.value))}
                              className="hod-slider"
                              style={{
                                background: `linear-gradient(to right, #10B981 0%, #06B6D4 ${
                                  ((minAttendanceThreshold - 50) / 40) * 100
                                }%, rgba(255,255,255,0.12) ${((minAttendanceThreshold - 50) / 40) * 100}%)`
                              }}
                            />
                          </div>

                          <button
                            type="button"
                            className="hod-slider-step-btn"
                            onClick={() => setMinAttendanceThreshold((prev) => Math.min(90, prev + 1))}
                            disabled={minAttendanceThreshold >= 90}
                            aria-label="Increase attendance threshold by 1 percent"
                          >
                            <Plus size={15} />
                          </button>
                        </div>

                        <span className="hod-field-hint">
                          Standard BTEUP/SVSU guideline is 75%. Students below this threshold will be flagged as Ineligible for End-Semester examinations.
                        </span>
                      </div>

                      {/* Exam Risk Threshold with Touch Step Buttons */}
                      <div className="hod-form-field">
                        <div className="hod-label-with-badge">
                          <label className="hod-label">Exam Failure / Academic Risk Cutoff</label>
                          <span className="hod-pill rose">{examRiskThreshold}% Passing Mark</span>
                        </div>

                        <div className="hod-slider-control-row">
                          <button
                            type="button"
                            className="hod-slider-step-btn"
                            onClick={() => setExamRiskThreshold((prev) => Math.max(30, prev - 1))}
                            disabled={examRiskThreshold <= 30}
                            aria-label="Decrease exam risk cutoff by 1 percent"
                          >
                            <Minus size={15} />
                          </button>

                          <div className="hod-slider-track-wrap">
                            <input
                              type="range"
                              min="30"
                              max="60"
                              step="1"
                              value={examRiskThreshold}
                              onChange={(e) => setExamRiskThreshold(Number(e.target.value))}
                              className="hod-slider"
                              style={{
                                background: `linear-gradient(to right, #EF4444 0%, #F59E0B ${
                                  ((examRiskThreshold - 30) / 30) * 100
                                }%, rgba(255,255,255,0.12) ${((examRiskThreshold - 30) / 30) * 100}%)`
                              }}
                            />
                          </div>

                          <button
                            type="button"
                            className="hod-slider-step-btn"
                            onClick={() => setExamRiskThreshold((prev) => Math.min(60, prev + 1))}
                            disabled={examRiskThreshold >= 60}
                            aria-label="Increase exam risk cutoff by 1 percent"
                          >
                            <Plus size={15} />
                          </button>
                        </div>

                        <span className="hod-field-hint">
                          Students scoring below this percentage in internal sessionals will be marked for remedial tutoring.
                        </span>
                      </div>

                      {/* Academic Session */}
                      <div className="hod-form-field">
                        <label className="hod-label">Active Academic Session</label>
                        <select
                          className="hod-input hod-select"
                          value={academicSession}
                          onChange={(e) => setAcademicSession(e.target.value)}
                        >
                          <option value="2026-2027">2026-2027 (Current Active)</option>
                          <option value="2025-2026">2025-2026</option>
                          <option value="2024-2025">2024-2025</option>
                        </select>
                        <span className="hod-field-hint">
                          Enforces curriculum year for syllabus and attendance registers.
                        </span>
                      </div>

                      {/* OBE Tracking */}
                      <div className="hod-form-field">
                        <label className="hod-label">AICTE / NBA Outcome-Based Education (OBE)</label>
                        <div className="hod-pref-item">
                          <div className="hod-pref-info">
                            <span className="hod-pref-title">Course Outcomes (CO) & Program Outcomes (PO)</span>
                            <span className="hod-pref-desc">
                              Keep OBE matrix active for NBA departmental audit verification.
                            </span>
                          </div>
                          {renderSwitch(
                            "obeTrackingToggle",
                            obeTracking,
                            setObeTracking,
                            "Toggle OBE tracking"
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="hod-set-card-footer">
                      <button
                        type="submit"
                        className="hod-btn-primary"
                        disabled={savingAcademic || !isAcademicDirty}
                      >
                        <Save size={15} />
                        <span>{savingAcademic ? "Auditing & Updating..." : "Apply Academic Policies"}</span>
                      </button>
                    </div>
                  </form>
                </section>
              )}

              {/* Category 5: Security & Credentials */}
              {activeCategory === "security" && (
                <section className="hod-set-section hod-stagger-1">
                  <div className="hod-set-section-header">
                    <div>
                      <div className="hod-set-sec-badge rose">
                        <Shield size={13} />
                        <span>Security & Access Control</span>
                      </div>
                      <h3>Credentials & Executive Session Supervision</h3>
                      <p>Update your authentication password and supervise active leadership sessions.</p>
                    </div>
                  </div>

                  <div className="hod-set-grid">
                    {/* Password Change Card */}
                    <div className="hod-card hod-set-card">
                      <div className="hod-set-card-header">
                        <div className="hod-set-icon-box rose">
                          <KeyRound size={20} />
                        </div>
                        <div>
                          <h3>Change Executive Password</h3>
                          <p>Enforce strong credentials with uppercase, lowercase, and numeric security.</p>
                        </div>
                      </div>

                      <form onSubmit={handleChangePassword} className="hod-set-form">
                        <div className="hod-form-field">
                          <label className="hod-label">Current Password</label>
                          <div className="hod-input-wrap">
                            <input
                              type={showCurrent ? "text" : "password"}
                              className="hod-input"
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="Enter current password"
                              required
                            />
                            <button
                              type="button"
                              className="hod-eye-btn"
                              onClick={() => setShowCurrent(!showCurrent)}
                              aria-label={showCurrent ? "Hide current password" : "Show current password"}
                            >
                              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        <div className="hod-form-field">
                          <label className="hod-label">New Password</label>
                          <div className="hod-input-wrap">
                            <input
                              type={showNew ? "text" : "password"}
                              className="hod-input"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Minimum 8 characters (A-Z, a-z, 0-9)"
                              required
                            />
                            <button
                              type="button"
                              className="hod-eye-btn"
                              onClick={() => setShowNew(!showNew)}
                              aria-label={showNew ? "Hide new password" : "Show new password"}
                            >
                              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>

                          {pwdStrength.text && (
                            <div className="hod-strength-container">
                              <div className="hod-strength-track">
                                <div
                                  className="hod-strength-bar"
                                  style={{ width: pwdStrength.width, background: pwdStrength.color }}
                                />
                              </div>
                              <span className="hod-strength-text" style={{ color: pwdStrength.color }}>
                                {pwdStrength.text}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Interactive Password Policy Checklist */}
                        <div className="hod-password-checklist">
                          {passwordPolicy.map((item) => (
                            <div key={item.id} className={`hod-checklist-item ${item.met ? "met" : ""}`}>
                              <span className="hod-check-bullet">
                                {item.met ? <Check size={12} /> : "○"}
                              </span>
                              <span className="hod-check-text">{item.text}</span>
                            </div>
                          ))}
                        </div>

                        <div className="hod-form-field">
                          <label className="hod-label">Confirm New Password</label>
                          <div className="hod-input-wrap">
                            <input
                              type={showConfirm ? "text" : "password"}
                              className="hod-input"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Re-type new password"
                              required
                            />
                            <button
                              type="button"
                              className="hod-eye-btn"
                              onClick={() => setShowConfirm(!showConfirm)}
                              aria-label={showConfirm ? "Hide confirmation password" : "Show confirmation password"}
                            >
                              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="hod-btn-primary"
                          disabled={submittingPass}
                          style={{ width: "100%", marginTop: 8 }}
                        >
                          <Lock size={15} />
                          <span>{submittingPass ? "Validating & Updating..." : "Update HOD Password"}</span>
                        </button>
                      </form>
                    </div>

                    {/* Active Session & Session Revocation */}
                    <div className="hod-card hod-set-card">
                      <div className="hod-set-card-header">
                        <div className="hod-set-icon-box emerald">
                          <Shield size={20} />
                        </div>
                        <div>
                          <h3>Active Department Session</h3>
                          <p>Protected by CollegeOS multi-layer role-based access control.</p>
                        </div>
                      </div>

                      <div className="hod-session-body">
                        <div className="hod-session-meta">
                          <span className="hod-pill indigo">Role: Head of Department</span>
                          <span className="hod-pill emerald">
                            <span className="hod-dot online" /> Session: Encrypted & Active
                          </span>
                        </div>

                        <div className="hod-session-details-list">
                          <div className="hod-session-detail-item">
                            <Clock size={15} color="var(--hod-text-secondary)" />
                            <div>
                              <span className="label">Last Executive Login:</span>
                              <span className="value">{formattedLastLogin}</span>
                            </div>
                          </div>
                          <div className="hod-session-detail-item">
                            <Layers size={15} color="var(--hod-text-secondary)" />
                            <div>
                              <span className="label">Authentication Protocol:</span>
                              <span className="value">JWT Bearer + HTTP-Only Cookie</span>
                            </div>
                          </div>
                          <div className="hod-session-detail-item">
                            <ShieldAlert size={15} color="var(--hod-text-secondary)" />
                            <div>
                              <span className="label">Security Level:</span>
                              <span className="value">Departmental Executive Level 2</span>
                            </div>
                          </div>
                          <div className="hod-session-detail-item">
                            <Laptop size={15} color="var(--hod-text-secondary)" />
                            <div>
                              <span className="label">Current Terminal:</span>
                              <span className="value">Authenticated Browser Terminal</span>
                            </div>
                          </div>
                        </div>

                        <p className="hod-session-note">
                          Always terminate your session when leaving shared administrative departmental computers or laboratory workstations.
                        </p>

                        <button
                          type="button"
                          className="hod-btn-secondary hod-logout-btn"
                          onClick={() => setShowLogoutModal(true)}
                        >
                          <LogOut size={15} />
                          <span>Sign Out of CollegeOS</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Category 6: Reports & Data */}
              {activeCategory === "reports" && (
                <section className="hod-set-section hod-stagger-1">
                  <div className="hod-set-section-header">
                    <div>
                      <div className="hod-set-sec-badge purple">
                        <FileBarChart size={13} />
                        <span>Reports & Data Export</span>
                      </div>
                      <h3>Analytical Reporting Parameters</h3>
                      <p>Configure departmental reporting periods and preferred document output formats.</p>
                    </div>
                  </div>

                  <div className="hod-card hod-set-card">
                    <div className="hod-set-grid-fields">
                      <div className="hod-form-field">
                        <label className="hod-label">Default Analytics Reporting Period</label>
                        <div className="hod-btn-segmented">
                          <button
                            type="button"
                            className={`hod-segment-btn ${defaultPeriod === "semester" ? "active" : ""}`}
                            onClick={() => setDefaultPeriod("semester")}
                          >
                            Semester
                          </button>
                          <button
                            type="button"
                            className={`hod-segment-btn ${defaultPeriod === "academic_year" ? "active" : ""}`}
                            onClick={() => setDefaultPeriod("academic_year")}
                          >
                            Academic Year
                          </button>
                          <button
                            type="button"
                            className={`hod-segment-btn ${defaultPeriod === "monthly" ? "active" : ""}`}
                            onClick={() => setDefaultPeriod("monthly")}
                          >
                            Monthly
                          </button>
                        </div>
                      </div>

                      <div className="hod-form-field">
                        <label className="hod-label">Preferred Document Export Format</label>
                        <div className="hod-btn-segmented">
                          <button
                            type="button"
                            className={`hod-segment-btn ${exportFormat === "pdf" ? "active" : ""}`}
                            onClick={() => setExportFormat("pdf")}
                          >
                            PDF Document
                          </button>
                          <button
                            type="button"
                            className={`hod-segment-btn ${exportFormat === "csv" ? "active" : ""}`}
                            onClick={() => setExportFormat("csv")}
                          >
                            CSV Spreadsheet
                          </button>
                          <button
                            type="button"
                            className={`hod-segment-btn ${exportFormat === "excel" ? "active" : ""}`}
                            onClick={() => setExportFormat("excel")}
                          >
                            Excel Workbook
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="hod-audit-notice-box" style={{ marginTop: 20 }}>
                      <FileText size={20} className="hod-audit-notice-icon" />
                      <div>
                        <strong>Institutional Compliance Notice:</strong>
                        <p>
                          Department-wide analytical exports containing faculty evaluations, attendance registers, and student grades
                          are protected under Swami Vivekanand Subharti University confidentiality policies.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Category 7: System Information & Health Diagnostics */}
              {activeCategory === "system" && (
                <section className="hod-set-section hod-stagger-1">
                  <div className="hod-set-section-header">
                    <div>
                      <div className="hod-set-sec-badge cyan">
                        <Activity size={13} />
                        <span>System Health & Diagnostics</span>
                      </div>
                      <h3>API Gateway Status & Infrastructure Diagnostics</h3>
                      <p>Inspect real-time API Gateway status, database connectivity, and technical specifications.</p>
                    </div>

                    <button
                      type="button"
                      className="hod-btn-secondary"
                      onClick={fetchHealthStatus}
                      disabled={healthLoading}
                    >
                      <RefreshCw size={15} className={healthLoading ? "hod-spin" : ""} />
                      <span>{healthLoading ? "Measuring Latency..." : "Ping Health Check"}</span>
                    </button>
                  </div>

                  <div className="hod-card hod-set-card">
                    {/* Live Health Overview */}
                    <div className="hod-health-grid">
                      <div className="hod-health-metric-box">
                        <span className="metric-label">API Gateway Status</span>
                        <div className="metric-value-wrap">
                          {healthData?.success ? (
                            <>
                              <span className="hod-dot online" />
                              <span className="metric-value emerald">Operational & Healthy</span>
                            </>
                          ) : (
                            <>
                              <span className="hod-dot offline" />
                              <span className="metric-value rose">Degraded / Offline</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="hod-health-metric-box">
                        <span className="metric-label">MongoDB Cluster</span>
                        <div className="metric-value-wrap">
                          {healthData?.database?.connected ? (
                            <>
                              <span className="hod-dot online" />
                              <span className="metric-value emerald">Atlas Connected</span>
                            </>
                          ) : (
                            <>
                              <span className="hod-dot offline" />
                              <span className="metric-value rose">Disconnected</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="hod-health-metric-box">
                        <span className="metric-label">Client Network State</span>
                        <div className="metric-value-wrap">
                          {isOnline ? (
                            <>
                              <Wifi size={16} color="var(--hod-emerald)" />
                              <span className="metric-value emerald">Online</span>
                            </>
                          ) : (
                            <>
                              <WifiOff size={16} color="var(--hod-rose)" />
                              <span className="metric-value rose">Offline</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="hod-health-metric-box">
                        <span className="metric-label">Gateway Roundtrip</span>
                        <span className="metric-value cyan">
                          {healthData?.latencyMs != null ? `${healthData.latencyMs} ms` : "Live"}
                        </span>
                      </div>
                    </div>

                    {/* Detailed Specifications Table */}
                    <div className="hod-system-specs-table">
                      <div className="hod-spec-row">
                        <span className="spec-key">Core Service</span>
                        <span className="spec-val">{healthData?.service || "CollegeOS Core API Gateway"}</span>
                      </div>
                      <div className="hod-spec-row">
                        <span className="spec-key">Institution</span>
                        <span className="spec-val">{healthData?.institution || "Swami Vivekanand Subharti University"}</span>
                      </div>
                      <div className="hod-spec-row">
                        <span className="spec-key">Campus / Poly</span>
                        <span className="spec-val">{healthData?.campus || "Subharti Polytechnic"}</span>
                      </div>
                      <div className="hod-spec-row">
                        <span className="spec-key">Database Cluster</span>
                        <span className="spec-val">
                          {healthData?.database?.host
                            ? `${healthData.database.host} (${healthData.database.name || "collegeos"})`
                            : "MongoDB Atlas Primary"}
                        </span>
                      </div>
                      <div className="hod-spec-row">
                        <span className="spec-key">Server Uptime</span>
                        <span className="spec-val">
                          {healthData?.uptimeSeconds != null
                            ? `${Math.floor(healthData.uptimeSeconds / 60)} minutes (${healthData.uptimeSeconds}s)`
                            : "Continuous"}
                        </span>
                      </div>
                      <div className="hod-spec-row">
                        <span className="spec-key">Platform Release</span>
                        <span className="spec-val">v4.2.0 Executive Edition</span>
                      </div>
                      <div className="hod-spec-row">
                        <span className="spec-key">Security Architecture</span>
                        <span className="spec-val">Helmet, CORS, JWT, RBAC & MongoDB Transaction Isolation</span>
                      </div>
                      <div className="hod-spec-row">
                        <span className="spec-key">Last Probed</span>
                        <span className="spec-val">{lastPingTime || "Just now"}</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>

      {/* Floating Unsaved Changes Sticky Bar (Portaled to document.body in a viewport-level safe overlay) */}
      {isPrefsDirty && typeof document !== "undefined" && createPortal(
        <div
          className={`hod-unsaved-viewport-overlay ${themeCtx?.theme === "light" ? "light" : "dark"}`}
          role="region"
          aria-label="Unsaved changes notification"
        >
          <aside
            className="hod-unsaved-banner-panel hod-unsaved-banner-portal hod-unsaved-banner"
            aria-live="polite"
          >
            <div className="hod-unsaved-message">
              <AlertTriangle size={18} className="hod-unsaved-icon" aria-hidden="true" />
              <div className="hod-unsaved-message-text">
                <strong>Unsaved Adjustments:</strong>
                <span>You have modified preferences that have not been synchronized.</span>
              </div>
            </div>
            <div className="hod-unsaved-actions">
              <button
                type="button"
                className="hod-btn-secondary hod-unsaved-discard"
                onClick={handleDiscardPreferences}
                disabled={savingSettings}
                aria-label="Discard unsaved preference adjustments"
              >
                <RotateCcw size={14} aria-hidden="true" />
                <span>Discard</span>
              </button>
              <button
                type="button"
                className="hod-btn-primary hod-unsaved-save"
                onClick={handleSaveAllPreferences}
                disabled={savingSettings}
                aria-label="Save all modified preference adjustments"
              >
                <Save size={14} aria-hidden="true" />
                <span>{savingSettings ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </aside>
        </div>,
        document.body
      )}

      {/* Inline Save Success Banner */}
      {saveSuccessMsg && (
        <div className="hod-toast-banner success">
          <CheckCircle2 size={16} />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="hod-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div
            className="hod-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logoutModalTitle"
          >
            <div className="hod-modal-header">
              <div className="hod-modal-icon-box rose">
                <LogOut size={22} />
              </div>
              <div>
                <h3 id="logoutModalTitle">Sign Out of CollegeOS?</h3>
                <p>Ensure all pending academic grades and approvals are submitted.</p>
              </div>
            </div>

            <p className="hod-modal-body-text">
              Signing out will securely terminate your active executive token and redirect you to the institutional login portal.
            </p>

            <div className="hod-modal-actions">
              <button
                type="button"
                className="hod-btn-secondary"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="hod-btn-primary hod-logout-confirm-btn"
                onClick={executeLogout}
              >
                <LogOut size={15} />
                <span>Confirm Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
