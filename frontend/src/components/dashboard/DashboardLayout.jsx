import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  LayoutDashboard, User, Users, CalendarCheck2, BookOpen,
  FileText, Clock, Bell, BarChart2, Award, ClipboardList,
  Building2, Calendar, LogOut, ChevronRight, Menu, X,
  Search, CheckCircle2, ShieldCheck, Layers,
  Sparkles, Database, FileBarChart, UserCog,
  GraduationCap, Activity, MapPin, Inbox,
  TrendingUp, Globe, AlertCircle, CreditCard, MessageSquare, Settings, Video,
  Sun, Moon, Command, Check, ExternalLink, ChevronDown, CheckCheck
} from "lucide-react";
import { authApi } from "../../services/authApi";
import { useTheme } from "../../context/ThemeContext";
import "./DashboardLayout.css";

// ============================================================
//  ROLE-SPECIFIC SIDEBAR NAVIGATION DEFINITIONS
// ============================================================

const STUDENT_NAV = [
  {
    label: "Main",
    items: [
      { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      { id: "profile", label: "My Profile", icon: User },
      { id: "settings", label: "Settings", icon: Settings }
    ]
  },
  {
    label: "People",
    items: [
      { id: "students", label: "All Students", icon: Users, isPage: true },
      { id: "faculty", label: "All Faculty", icon: UserCog, isPage: true }
    ]
  },
  {
    label: "Academics",
    items: [
      { id: "attendance", label: "My Attendance", icon: CalendarCheck2 },
      { id: "subject-attendance", label: "Subject Attendance", icon: BarChart2 },
      { id: "timetable", label: "Timetable", icon: Calendar },
      { id: "assignments", label: "Assignments", icon: FileText },
      { id: "notes", label: "Study Notes", icon: BookOpen },
      { id: "lectures", label: "Video Lectures", icon: Video },
      { id: "exams", label: "Examinations", icon: Award },
      { id: "results", label: "Results & Marks", icon: TrendingUp }
    ]
  },
  {
    label: "Campus Life",
    items: [
      { id: "leaves", label: "Leave Applications", icon: Clock },
      { id: "notices", label: "Notices & Circulars", icon: Bell },
      { id: "notifications", label: "Notifications", icon: Inbox },
      { id: "fees", label: "Fee Ledger", icon: CreditCard },
      { id: "library", label: "Digital Library", icon: BookOpen },
      { id: "feedback", label: "Faculty Feedback", icon: MessageSquare }
    ]
  }
];

const TEACHER_NAV = [
  {
    label: "Main",
    items: [
      { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      { id: "profile", label: "My Profile", icon: User },
      { id: "settings", label: "Settings", icon: Settings }
    ]
  },
  {
    label: "People",
    items: [
      { id: "students", label: "All Students", icon: Users, isPage: true },
      { id: "faculty", label: "All Faculty", icon: UserCog, isPage: true }
    ]
  },
  {
    label: "Teaching",
    items: [
      { id: "classes", label: "My Classes", icon: Layers },
      { id: "attendance", label: "Attendance Register", icon: CalendarCheck2 },
      { id: "assignments", label: "Assignments", icon: FileText },
      { id: "submissions", label: "Submissions & Grading", icon: ClipboardList },
      { id: "notes", label: "Study Notes", icon: BookOpen },
      { id: "lectures", label: "Video Lectures", icon: Video },
      { id: "exams", label: "Marks Entry", icon: Award }
    ]
  },
  {
    label: "Operations",
    items: [
      { id: "timetable", label: "Timetable", icon: Calendar },
      { id: "leaves", label: "Leave & Requests", icon: Clock },
      { id: "notices", label: "Notices & Communication", icon: Bell },
      { id: "notifications", label: "Notifications", icon: Inbox },
      { id: "reports", label: "Reports & Analytics", icon: FileBarChart }
    ]
  }
];

const HOD_NAV = [
  {
    label: "Main",
    items: [
      { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      { id: "profile", label: "My Profile", icon: User },
      { id: "settings", label: "Settings", icon: Settings }
    ]
  },
  {
    label: "People",
    items: [
      { id: "students", label: "All Students", icon: Users, isPage: true },
      { id: "faculty", label: "All Faculty", icon: UserCog, isPage: true },
      { id: "faculty-management", label: "Faculty Command Center", icon: Building2 }
    ]
  },
  {
    label: "Department",
    items: [
      { id: "department", label: "Department Overview", icon: Building2 },
      { id: "student-management", label: "Student Management", icon: GraduationCap }
    ]
  },
  {
    label: "Academics",
    items: [
      { id: "attendance", label: "Attendance Monitoring", icon: CalendarCheck2 },
      { id: "subjects", label: "Curriculum & Notes", icon: BookOpen },
      { id: "timetable", label: "Timetable Management", icon: Calendar },
      { id: "exams", label: "Marks & Results", icon: Award }
    ]
  },
  {
    label: "Operations",
    items: [
      { id: "leaves", label: "Leave Approvals Queue", icon: Clock },
      { id: "notices", label: "Department Notices", icon: Bell },
      { id: "notifications", label: "Notifications", icon: Inbox },
      { id: "reports", label: "Reports & Analytics", icon: FileBarChart }
    ]
  }
];

const COORDINATOR_NAV = [
  {
    label: "Main",
    items: [
      { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      { id: "profile", label: "My Profile", icon: User, isPage: true },
      { id: "settings", label: "Settings", icon: Settings }
    ]
  },
  {
    label: "People",
    items: [
      { id: "students", label: "All Students", icon: Users, isPage: true },
      { id: "faculty", label: "All Faculty", icon: UserCog, isPage: true }
    ]
  },
  {
    label: "Academic Planning",
    items: [
      { id: "academic-calendar", label: "Academic Calendar", icon: Calendar },
      { id: "timetable", label: "Timetable Planner", icon: Layers },
      { id: "rooms", label: "Room Allocation", icon: MapPin },
      { id: "exams", label: "Examination Schedule", icon: Award }
    ]
  },
  {
    label: "Monitoring",
    items: [
      { id: "attendance", label: "Attendance Monitoring", icon: CalendarCheck2 },
      { id: "assignments", label: "Assignment Monitoring", icon: FileText }
    ]
  },
  {
    label: "Operations",
    items: [
      { id: "leaves", label: "Leave & Requests", icon: Clock },
      { id: "approvals", label: "Approvals & Tasks", icon: CheckCircle2 },
      { id: "notices", label: "Notices", icon: Bell },
      { id: "notifications", label: "Notifications", icon: Inbox },
      { id: "reports", label: "Reports & Exports", icon: FileBarChart }
    ]
  }
];

const PRINCIPAL_NAV = [
  {
    label: "Main",
    items: [
      { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      { id: "profile", label: "My Profile", icon: User, isPage: true }
    ]
  },
  {
    label: "People",
    items: [
      { id: "students", label: "All Students", icon: Users, isPage: true },
      { id: "faculty", label: "All Faculty", icon: UserCog, isPage: true }
    ]
  },
  {
    label: "Institutional Overview",
    items: [
      { id: "student-overview", label: "Student Overview", icon: GraduationCap },
      { id: "faculty-overview", label: "Faculty Overview", icon: UserCog },
      { id: "department", label: "Department Overview", icon: Building2 }
    ]
  },
  {
    label: "Analytics",
    items: [
      { id: "attendance", label: "Attendance Analytics", icon: CalendarCheck2 },
      { id: "exams", label: "Examination Analytics", icon: Award },
      { id: "academic-calendar", label: "Academic Calendar", icon: Calendar },
      { id: "timetable", label: "Timetable Overview", icon: Layers }
    ]
  },
  {
    label: "Governance",
    items: [
      { id: "approvals", label: "Approvals", icon: CheckCircle2 },
      { id: "leaves", label: "Leave Overview", icon: Clock },
      { id: "notices", label: "Notices & Circulars", icon: Bell },
      { id: "placement", label: "Placement Overview", icon: TrendingUp },
      { id: "reports", label: "Reports & Accreditation", icon: FileBarChart }
    ]
  }
];

const ADMIN_NAV = [
  {
    label: "Main",
    items: [
      { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      { id: "profile", label: "My Profile", icon: User, isPage: true }
    ]
  },
  {
    label: "People",
    items: [
      { id: "students", label: "All Students", icon: Users, isPage: true },
      { id: "faculty", label: "All Faculty", icon: UserCog, isPage: true }
    ]
  },
  {
    label: "User Management",
    items: [
      { id: "users", label: "User Management", icon: UserCog },
      { id: "roles", label: "Role & Permissions", icon: ShieldCheck },
      { id: "student-accounts", label: "Student Accounts", icon: GraduationCap },
      { id: "faculty-accounts", label: "Faculty Accounts", icon: User }
    ]
  },
  {
    label: "Academics & Examination",
    items: [
      { id: "exams", label: "Examination Control", icon: Award },
      { id: "departments", label: "Department Management", icon: Building2 },
      { id: "branches", label: "Branch & Semester Setup", icon: Layers },
      { id: "sessions", label: "Academic Sessions", icon: Calendar }
    ]
  },
  {
    label: "System",
    items: [
      { id: "notices", label: "System Notifications", icon: Bell },
      { id: "audit", label: "Audit Logs", icon: Activity },
      { id: "integrations", label: "Integration Health", icon: Globe },
      { id: "files", label: "File & Media Management", icon: Database },
      { id: "security", label: "Security & Access Logs", icon: AlertCircle }
    ]
  }
];

const NAV_MAP = {
  student: STUDENT_NAV,
  teacher: TEACHER_NAV,
  hod: HOD_NAV,
  coordinator: COORDINATOR_NAV,
  principal: PRINCIPAL_NAV,
  admin: ADMIN_NAV
};

const ROLE_LABELS = {
  student: "Diploma Candidate",
  teacher: "Faculty / Instructor",
  hod: "Head of Department",
  coordinator: "Academic Coordinator",
  principal: "Principal / Executive",
  admin: "System Administrator"
};

// Mobile bottom navigation destinations (4 core actions per role)
const MOBILE_ROLE_NAV_MAP = {
  student: [
    { id: "overview", label: "Home", icon: LayoutDashboard },
    { id: "attendance", label: "Attendance", icon: CalendarCheck2 },
    { id: "assignments", label: "Assignments", icon: FileText },
    { id: "profile", label: "Profile", icon: User }
  ],
  teacher: [
    { id: "overview", label: "Home", icon: LayoutDashboard },
    { id: "classes", label: "Classes", icon: Layers },
    { id: "attendance", label: "Attendance", icon: CalendarCheck2 },
    { id: "profile", label: "Profile", icon: User }
  ],
  hod: [
    { id: "overview", label: "Home", icon: LayoutDashboard },
    { id: "department", label: "Dept", icon: Building2 },
    { id: "faculty-management", label: "Faculty", icon: UserCog },
    { id: "profile", label: "Profile", icon: User }
  ],
  coordinator: [
    { id: "overview", label: "Home", icon: LayoutDashboard },
    { id: "timetable", label: "Timetable", icon: Calendar },
    { id: "rooms", label: "Rooms", icon: MapPin },
    { id: "profile", label: "Profile", icon: User }
  ],
  principal: [
    { id: "overview", label: "Home", icon: LayoutDashboard },
    { id: "student-overview", label: "Students", icon: GraduationCap },
    { id: "faculty-overview", label: "Faculty", icon: UserCog },
    { id: "profile", label: "Profile", icon: User }
  ],
  admin: [
    { id: "overview", label: "Home", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: UserCog },
    { id: "departments", label: "Depts", icon: Building2 },
    { id: "profile", label: "Profile", icon: User }
  ]
};

// Relative timestamp helper for notification center
function formatTimeAgo(dateInput) {
  if (!dateInput) return "Recently";
  try {
    const now = new Date();
    const past = new Date(dateInput);
    const diffMs = now - past;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 45) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay}d ago`;
    return past.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

// ============================================================
//  DASHBOARD LAYOUT COMPONENT
// ============================================================

export default function DashboardLayout({
  user,
  activeTab = "overview",
  onNavigateTab,
  onNavigatePage,
  children
}) {
  const { theme, toggleTheme, isDark } = useTheme();

  // Sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile drawer open/close
  const [isSidebarHovered, setIsSidebarHovered] = useState(false); // Desktop hover auto-expansion
  const hoverTimeoutRef = useRef(null);

  // Desktop auto-expand on mouse enter
  const handleSidebarMouseEnter = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 992) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsSidebarHovered(true);
  };

  // Desktop auto-collapse on mouse leave with smooth debounce
  const handleSidebarMouseLeave = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 992) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsSidebarHovered(false);
    }, 140);
  };

  // Keyboard accessibility: expand on focus within sidebar
  const handleSidebarFocus = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 992) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsSidebarHovered(true);
  };

  // Keyboard accessibility: collapse when focus leaves sidebar
  const handleSidebarBlur = (e) => {
    if (typeof window !== "undefined" && window.innerWidth <= 992) return;
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      hoverTimeoutRef.current = setTimeout(() => {
        setIsSidebarHovered(false);
      }, 140);
    }
  };

  // Clean up hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Notification center states
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState("all"); // "all" | "unread"
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Profile dropdown menu state
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  // Quick search / command palette modal state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);

  // DOM Refs for click outside handling
  const notifRef = useRef(null);
  const profileMenuRef = useRef(null);
  const searchModalRef = useRef(null);
  const searchInputRef = useRef(null);

  const role = user?.role || "student";
  const navSections = NAV_MAP[role] || STUDENT_NAV;

  // Flattened navigation items for search indexing
  const allNavItems = useMemo(() => {
    return navSections.flatMap((section) =>
      section.items.map((item) => ({
        ...item,
        sectionLabel: section.label
      }))
    );
  }, [navSections]);

  // Filtered search items based on query
  const filteredSearchItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return allNavItems;
    }
    const q = searchQuery.toLowerCase().trim();
    return allNavItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.sectionLabel.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
    );
  }, [allNavItems, searchQuery]);

  // Reset selected search item index on filter change
  useEffect(() => {
    setSelectedSearchIndex(0);
  }, [filteredSearchItems.length]);

  // Auto focus search input when search modal opens
  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
      setSelectedSearchIndex(0);
    }
  }, [searchModalOpen]);

  // Click outside listener for popovers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
      if (
        searchModalOpen &&
        searchModalRef.current &&
        !searchModalRef.current.contains(e.target) &&
        !e.target.closest(".topbar-search-btn")
      ) {
        setSearchModalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [searchModalOpen]);

  // Handle global keyboard shortcuts: Ctrl+K or / to search, Escape to dismiss
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Escape closes any open modal or popover
      if (e.key === "Escape") {
        if (searchModalOpen) {
          setSearchModalOpen(false);
          return;
        }
        if (notifOpen) {
          setNotifOpen(false);
          return;
        }
        if (profileMenuOpen) {
          setProfileMenuOpen(false);
          return;
        }
        if (sidebarOpen) {
          setSidebarOpen(false);
          return;
        }
      }

      // Check for Ctrl+K, Cmd+K, or "/"
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      } else if (e.key === "/" && !isInput) {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [searchModalOpen, notifOpen, profileMenuOpen, sidebarOpen]);

  // Mobile drawer body scroll locking
  useEffect(() => {
    if (!sidebarOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [sidebarOpen]);

  // Fetch real notifications from backend
  useEffect(() => {
    let isMounted = true;
    authApi
      .getNotifications()
      .then((res) => {
        if (isMounted && res?.notifications) {
          setNotifications(res.notifications);
          setUnreadCount(res.notifications.filter((n) => !n.isRead).length);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await authApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  const handleSignOut = async () => {
    setProfileMenuOpen(false);
    await authApi.logout();
    if (onNavigatePage) onNavigatePage("home");
    else window.location.hash = "#/";
  };

  const handleNavClick = (item) => {
    setSidebarOpen(false);
    setSearchModalOpen(false);
    if (item.isPage) {
      if (onNavigatePage) onNavigatePage(item.id);
      else window.location.hash = `#/${item.id}`;
    } else {
      if (onNavigateTab) onNavigateTab(item.id);
    }
  };

  // Keyboard navigation within command palette
  const handleSearchKeyDown = (e) => {
    if (filteredSearchItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSearchIndex((prev) => (prev + 1) % filteredSearchItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSearchIndex((prev) =>
        prev === 0 ? filteredSearchItems.length - 1 : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selectedItem = filteredSearchItems[selectedSearchIndex];
      if (selectedItem) {
        handleNavClick(selectedItem);
      }
    }
  };

  const userInitials = (user?.fullName || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Determine current active breadcrumb label
  const activeLabel =
    navSections
      .flatMap((s) => s.items)
      .find((item) => item.id === activeTab)?.label || activeTab;

  // Filtered notification list
  const displayedNotifications =
    notifFilter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <div
      className={`dash-shell role-${role} ${
        !isSidebarHovered ? "sidebar-collapsed" : ""
      }`}
    >
      {/* Mobile Drawer Overlay Scrim */}
      <div
        className={`dash-scrim ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`dash-sidebar ${sidebarOpen ? "open" : ""} ${
          !isSidebarHovered ? "collapsed" : ""
        }`}
        aria-label="University Management Navigation"
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        onFocusCapture={handleSidebarFocus}
        onBlurCapture={handleSidebarBlur}
      >
        {/* Brand Header */}
        <div className="dash-sidebar-header">
          <div className="sidebar-brand-box">
            <div className="brand-logo-pill">
              <img
                src="/svsu-logo-whiten.webp"
                alt="SVSU Crest"
                className="brand-univ-logo"
              />
            </div>
            <div className="brand-text">
              <strong className="poly-title">Subharti Poly</strong>
              <span className="os-tag">
                CollegeOS <span className="os-ver">v2.5</span>
              </span>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Role & Campus Identity Banner */}
        <div className="sidebar-role-banner">
          <span className="role-tag-pill">
            <Sparkles size={12} className="role-sparkle-icon" />
            <span>{ROLE_LABELS[role] || role}</span>
          </span>
          <span className="campus-tag" title="Subharti University Main Campus">
            <MapPin size={11} className="campus-pin-icon" />
            <span>Meerut Campus</span>
          </span>
        </div>

        {/* Navigation Sections Tree */}
        <nav className="dash-nav-tree" aria-label="Role Navigation Modules">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="nav-group">
              <span className="nav-group-heading">{section.label}</span>
              <ul className="nav-items-list" role="list">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`nav-item-btn ${isActive ? "active" : ""}`}
                        onClick={() => handleNavClick(item)}
                        aria-current={isActive ? "page" : undefined}
                        title={item.label}
                        data-tooltip={item.label}
                      >
                        <span className="nav-icon-box">
                          <Icon size={17} />
                        </span>
                        <span className="nav-item-label">{item.label}</span>
                        {isActive && (
                          <ChevronRight size={14} className="active-chevron" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer User Info & Sign Out */}
        <div className="sidebar-footer">
          <div
            className="user-profile-snippet"
            onClick={() => {
              setSidebarOpen(false);
              onNavigatePage?.("profile");
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSidebarOpen(false);
                onNavigatePage?.("profile");
              }
            }}
            title="View Full Profile"
            aria-label="View Full Profile"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="footer-avatar-img" />
            ) : (
              <div className="footer-avatar-initials">{userInitials}</div>
            )}
            <div className="footer-user-info">
              <strong className="footer-user-name">
                {user?.fullName?.split(" ")[0] || "User"}
              </strong>
              <span className="footer-user-role">
                {ROLE_LABELS[role] || role}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="footer-signout-btn"
            onClick={handleSignOut}
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="dash-main-pane">
        {/* Sticky Executive Topbar */}
        <header className="dash-topbar">
          <div className="topbar-left">
            {/* Mobile Hamburger Drawer Trigger */}
            <button
              type="button"
              className="topbar-burger"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={sidebarOpen}
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumbs Navigation */}
            <nav className="topbar-breadcrumbs" aria-label="Current location">
              <span className="crumb-root">CollegeOS</span>
              <span className="crumb-sep">/</span>
              <span className="crumb-role">{ROLE_LABELS[role] || role}</span>
              <span className="crumb-sep">/</span>
              <strong className="crumb-active">{activeLabel}</strong>
            </nav>
          </div>

          <div className="topbar-right">
            {/* Global Search Bar (Trigger for Command Palette) */}
            <button
              type="button"
              className="topbar-search-btn"
              onClick={() => setSearchModalOpen(true)}
              aria-label="Quick search navigation modules (Ctrl+K)"
              title="Quick search navigation modules (Ctrl+K or /)"
            >
              <Search size={15} className="search-icon" />
              <span className="search-placeholder-text">Search modules…</span>
              <kbd className="search-shortcut-badge">
                <span className="kbd-symbol">⌘</span>K
              </kbd>
            </button>

            {/* Theme Toggle Button (Dark Glass <-> Light Blue) */}
            <button
              type="button"
              className="topbar-icon-btn theme-toggle-btn"
              onClick={toggleTheme}
              title={
                isDark
                  ? "Switch to Light Ice Blue Enterprise Theme"
                  : "Switch to Dark Executive Navy Theme"
              }
              aria-label={
                isDark
                  ? "Switch to Light Ice Blue Enterprise Theme"
                  : "Switch to Dark Executive Navy Theme"
              }
            >
              {isDark ? (
                <Sun size={18} className="theme-toggle-icon sun" />
              ) : (
                <Moon size={18} className="theme-toggle-icon moon" />
              )}
            </button>

            {/* Notification Center Popover Trigger */}
            <div className="notif-wrapper" ref={notifRef}>
              <button
                type="button"
                className={`topbar-icon-btn ${unreadCount > 0 ? "has-unread" : ""}`}
                onClick={() => setNotifOpen((prev) => !prev)}
                title="Notifications"
                aria-label={`Notifications${
                  unreadCount > 0 ? `, ${unreadCount} unread` : ""
                }`}
                aria-haspopup="dialog"
                aria-expanded={notifOpen}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="notif-badge" aria-hidden="true">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dialog */}
              {notifOpen && (
                <div
                  className="dash-notif-popover"
                  role="dialog"
                  aria-label="Notifications Center"
                >
                  <div className="notif-popover-header">
                    <div className="notif-title-group">
                      <strong>Notifications</strong>
                      {unreadCount > 0 && (
                        <span className="notif-header-badge">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="mark-all-btn"
                        onClick={handleMarkAllRead}
                        title="Mark all notifications as read"
                      >
                        <CheckCheck size={13} />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  {/* Filter Tabs */}
                  <div className="notif-filter-tabs">
                    <button
                      type="button"
                      className={`notif-tab ${notifFilter === "all" ? "active" : ""}`}
                      onClick={() => setNotifFilter("all")}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      type="button"
                      className={`notif-tab ${notifFilter === "unread" ? "active" : ""}`}
                      onClick={() => setNotifFilter("unread")}
                    >
                      Unread ({unreadCount})
                    </button>
                  </div>

                  {/* Notification List */}
                  <div className="notif-list">
                    {displayedNotifications.length === 0 ? (
                      <div className="notif-empty">
                        <CheckCircle2 size={26} className="notif-empty-icon" />
                        <strong>All caught up!</strong>
                        <span>
                          {notifFilter === "unread"
                            ? "No unread alerts at this time."
                            : "No notifications recorded for your account."}
                        </span>
                      </div>
                    ) : (
                      displayedNotifications.map((n) => (
                        <div
                          key={n.id || n._id}
                          className={`notif-item ${!n.isRead ? "unread" : ""}`}
                          onClick={() => {
                            if (!n.isRead) {
                              authApi.markNotificationRead(n.id || n._id);
                              setNotifications((prev) =>
                                prev.map((x) =>
                                  (x.id || x._id) === (n.id || n._id)
                                    ? { ...x, isRead: true }
                                    : x
                                )
                              );
                              setUnreadCount((c) => Math.max(0, c - 1));
                            }
                            setNotifOpen(false);
                            if (n.link?.startsWith("#/dashboard/")) {
                              const tab = n.link.replace("#/dashboard/", "");
                              onNavigateTab?.(tab);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="notif-item-top">
                            <span className="notif-title">{n.title}</span>
                            <div className="notif-meta">
                              <span className="notif-time">
                                {formatTimeAgo(n.createdAt || n.timestamp)}
                              </span>
                              {!n.isRead && <span className="notif-dot" />}
                            </div>
                          </div>
                          <p className="notif-msg">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill & Dropdown */}
            <div className="profile-pill-wrapper" ref={profileMenuRef}>
              <button
                type="button"
                className={`topbar-user-pill ${profileMenuOpen ? "active" : ""}`}
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                title="Account menu"
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="topbar-user-avatar"
                  />
                ) : (
                  <div className="topbar-user-fallback">{userInitials}</div>
                )}
                <span className="topbar-user-name">
                  {user?.fullName?.split(" ")[0] || "Profile"}
                </span>
                <ChevronDown
                  size={14}
                  className={`user-chevron ${profileMenuOpen ? "open" : ""}`}
                />
              </button>

              {/* Profile Menu Dropdown */}
              {profileMenuOpen && (
                <div
                  className="dash-profile-menu"
                  role="menu"
                  aria-label="Executive User Menu"
                >
                  <div className="profile-menu-header">
                    <div className="menu-header-avatar">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="avatar-img" />
                      ) : (
                        <div className="avatar-initials">{userInitials}</div>
                      )}
                      <span className="online-indicator" title="Active session" />
                    </div>
                    <div className="menu-header-details">
                      <strong className="header-user-name">
                        {user?.fullName || "University User"}
                      </strong>
                      <span className="header-user-role">
                        {ROLE_LABELS[role] || role}
                      </span>
                      <span className="header-user-email">
                        {user?.email || user?.rollNumber || "subharti.edu.in"}
                      </span>
                    </div>
                  </div>

                  <div className="profile-menu-divider" />

                  <div className="profile-menu-links">
                    <button
                      type="button"
                      className="profile-menu-item"
                      role="menuitem"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onNavigatePage?.("profile");
                      }}
                    >
                      <User size={16} className="menu-item-icon" />
                      <span>My Profile</span>
                    </button>

                    <button
                      type="button"
                      className="profile-menu-item"
                      role="menuitem"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onNavigateTab?.("settings");
                      }}
                    >
                      <Settings size={16} className="menu-item-icon" />
                      <span>Account Settings</span>
                    </button>

                    {/* Quick Inline Theme Switch */}
                    <button
                      type="button"
                      className="profile-menu-item theme-item"
                      role="menuitem"
                      onClick={toggleTheme}
                    >
                      {isDark ? (
                        <Sun size={16} className="menu-item-icon" />
                      ) : (
                        <Moon size={16} className="menu-item-icon" />
                      )}
                      <span>Theme: {isDark ? "Dark Navy" : "Light Blue"}</span>
                      <span className="menu-item-badge">
                        {isDark ? "Dark" : "Light"}
                      </span>
                    </button>
                  </div>

                  <div className="profile-menu-divider" />

                  <div className="profile-menu-footer">
                    <button
                      type="button"
                      className="profile-signout-btn"
                      role="menuitem"
                      onClick={handleSignOut}
                    >
                      <LogOut size={16} className="signout-icon" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ================= GLOBAL COMMAND PALETTE / QUICK SEARCH MODAL ================= */}
        {searchModalOpen && (
          <div
            className="dash-search-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Quick Search Command Palette"
          >
            <div className="dash-search-modal" ref={searchModalRef}>
              <div className="search-modal-header">
                <Search size={18} className="modal-search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type to search navigation modules..."
                  className="modal-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  aria-label="Search navigation modules"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="modal-search-clear"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search query"
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  type="button"
                  className="modal-search-close"
                  onClick={() => setSearchModalOpen(false)}
                  aria-label="Close search"
                >
                  <kbd className="esc-key">ESC</kbd>
                </button>
              </div>

              {/* Search Results List */}
              <div className="search-modal-results" role="listbox">
                {filteredSearchItems.length === 0 ? (
                  <div className="search-no-results">
                    <AlertCircle size={22} className="no-res-icon" />
                    <p>No navigation modules matching "{searchQuery}"</p>
                    <span>Try searching for Attendance, Timetable, Profile, or Exams</span>
                  </div>
                ) : (
                  filteredSearchItems.map((item, idx) => {
                    const Icon = item.icon;
                    const isHighlighted = idx === selectedSearchIndex;
                    const isActive = activeTab === item.id;
                    return (
                      <div
                        key={item.id}
                        role="option"
                        aria-selected={isHighlighted}
                        className={`search-result-item ${
                          isHighlighted ? "highlighted" : ""
                        } ${isActive ? "active-tab" : ""}`}
                        onMouseEnter={() => setSelectedSearchIndex(idx)}
                        onClick={() => handleNavClick(item)}
                      >
                        <div className="result-item-icon">
                          <Icon size={17} />
                        </div>
                        <div className="result-item-info">
                          <span className="result-item-title">{item.label}</span>
                          <span className="result-item-section">
                            {item.sectionLabel}
                          </span>
                        </div>
                        {isActive && (
                          <span className="result-active-pill">Current</span>
                        )}
                        <span className="result-enter-hint">Jump ↵</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Command Palette Keyboard Hints */}
              <div className="search-modal-footer">
                <span className="kbd-hint">
                  <kbd>↑</kbd> <kbd>↓</kbd> to navigate
                </span>
                <span className="kbd-hint">
                  <kbd>↵</kbd> to select
                </span>
                <span className="kbd-hint">
                  <kbd>ESC</kbd> to close
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Main Content Body */}
        <main className="dash-content-body">{children}</main>
      </div>

      {/* ================= MOBILE BOTTOM NAVIGATION BAR ================= */}
      <nav
        className="dash-mobile-bottom-bar"
        aria-label="Mobile Bottom Navigation"
      >
        <div className="bottom-bar-inner">
          {(MOBILE_ROLE_NAV_MAP[role] || MOBILE_ROLE_NAV_MAP.student).map(
            (dest) => {
              const Icon = dest.icon;
              const isActive =
                dest.id === "overview"
                  ? activeTab === "overview" || !activeTab
                  : dest.id === "attendance"
                  ? activeTab === "attendance" ||
                    activeTab === "subject-attendance"
                  : dest.id === "assignments"
                  ? activeTab === "assignments" ||
                    activeTab === "submissions"
                  : dest.id === "profile"
                  ? activeTab === "profile"
                  : activeTab === dest.id;

              return (
                <button
                  key={dest.id}
                  type="button"
                  className={`bottom-bar-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    if (dest.isPage) {
                      if (onNavigatePage) onNavigatePage(dest.id);
                      else window.location.hash = `#/${dest.id}`;
                    } else {
                      if (onNavigateTab) onNavigateTab(dest.id);
                    }
                  }}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={dest.label}
                >
                  <div className="bottom-bar-icon-wrap">
                    <Icon size={19} className="bottom-bar-icon" />
                    {isActive && (
                      <span
                        className="bottom-bar-active-glow"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <span className="bottom-bar-label">{dest.label}</span>
                </button>
              );
            }
          )}
        </div>
      </nav>
    </div>
  );
}
