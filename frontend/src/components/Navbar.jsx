import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  X,
  LogIn,
  ArrowRight,
  Briefcase,
  User,
  LogOut,
  LayoutDashboard,
  GraduationCap,
  Sun,
  Moon,
  ChevronDown,
  ShieldCheck
} from "lucide-react";
import { authApi } from "../services/authApi";
import { useTheme } from "../context/ThemeContext";
import { assetUrl } from "../utils/assetUrl";
import "./Navbar.css";

/* ==========================================================================
   NAV LINKS - Mapped to real sections (Aligned with International Standard)
   ========================================================================== */
const LINKS = [
  ["Home", "home"],
  ["Programs", "departments"],
  ["Curriculum", "curriculum"],
  ["360 Tour", "campus-tour-360"],
  ["Life & Labs", "facilities"],
  ["Fees & Aid", "fee-calculator"],
  ["Placements", "placements"],
  ["Admissions", "admission"],
  ["Contact", "contact"],
];

/* ==========================================================================
   PLACEMENT TICKER DATA - Real corporate recruitment partners
   ========================================================================== */
const BRANCHES = [
  {
    id: "cse",
    label: "Computer Science",
    color: "#3B82F6",
    companies: [
      { name: "TCS", domain: "tcs.com" },
      { name: "Infosys", domain: "infosys.com" },
      { name: "Wipro", domain: "wipro.com" },
      { name: "HCL Tech", domain: "hcltech.com" },
      { name: "Tech Mahindra", domain: "techmahindra.com" },
      { name: "Cognizant", domain: "cognizant.com" },
    ],
  },
  {
    id: "mech",
    label: "Mechanical",
    color: "#F97316",
    companies: [
      { name: "Maruti Suzuki", domain: "marutisuzuki.com" },
      { name: "Hero MotoCorp", domain: "heromotocorp.com" },
      { name: "Bajaj Auto", domain: "bajajauto.com" },
      { name: "Mahindra", domain: "mahindra.com" },
      { name: "TVS Motor", domain: "tvsmotor.com" },
    ],
  },
  {
    id: "civil",
    label: "Civil",
    color: "#10B981",
    companies: [
      { name: "L&T", domain: "larsentoubro.com" },
      { name: "Tata Projects", domain: "tataprojects.com" },
      { name: "Shapoorji Pallonji", domain: "shapoorjipallonji.com" },
      { name: "GMR Group", domain: "gmrgroup.in" },
    ],
  },
  {
    id: "elec",
    label: "Electrical",
    color: "#F59E0B",
    companies: [
      { name: "Havells", domain: "havells.com" },
      { name: "Polycab", domain: "polycab.com" },
      { name: "Siemens", domain: "siemens.com" },
      { name: "Schneider Electric", domain: "se.com" },
      { name: "ABB", domain: "abb.com" },
    ],
  },
  {
    id: "ece",
    label: "Electronics",
    color: "#06B6D4",
    companies: [
      { name: "Samsung", domain: "samsung.com" },
      { name: "Bosch", domain: "bosch.com" },
      { name: "Dixon Technologies", domain: "dixoninfo.com" },
      { name: "Bharat Electronics", domain: "bel-india.in" },
    ],
  },
];

const TOTAL_COMPANIES = BRANCHES.reduce((n, b) => n + b.companies.length, 0);
const TICKER_SECONDS = TOTAL_COMPANIES * 2.8;

function Logo({ name, domain, src, color }) {
  const sources = [
    src,
    domain && `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
  ].filter(Boolean);

  const [i, setI] = useState(0);

  if (i >= sources.length) {
    return (
      <span className="tk-mono" style={{ "--c": color }} aria-hidden="true">
        {name.trim().charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      key={sources[i]}
      src={sources[i]}
      alt=""
      className="tk-logo"
      loading="lazy"
      decoding="async"
      draggable="false"
      referrerPolicy="no-referrer"
      onError={() => setI((n) => n + 1)}
    />
  );
}

function TickerRound({ hidden = false }) {
  return (
    <div className="tk-round" aria-hidden={hidden}>
      {BRANCHES.map((b) => (
        <div className="tk-group" key={b.id} style={{ "--c": b.color }}>
          <span className="tk-branch">
            <span className="tk-branch-dot" /> {b.label}
          </span>
          {b.companies.map((c) => (
            <span className="tk-chip" key={c.name} title={`${c.name} (${b.label})`}>
              <Logo name={c.name} domain={c.domain} src={c.logo} color={b.color} />
              <span className="tk-name">{c.name}</span>
            </span>
          ))}
          <span className="tk-sep" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   OFFICIAL SVSU UNIVERSITY & POLYTECHNIC BRAND LOCKUP
   ========================================================================== */
function BrandLockup({ className = "" }) {
  return (
    <div className={`brand-lockup ${className}`.trim()}>
      <img
        src={assetUrl("/svsu-seal-official.png")}
        alt="Swami Vivekanand Subharti University"
        className="brand-crest-img"
      />
      <div className="brand-text-block">
        <span className="brand-title">Subharti Polytechnic</span>
        <span className="brand-subtitle">Swami Vivekanand Subharti University</span>
      </div>
    </div>
  );
}

function NavAvatar({ user }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const initials = (user?.fullName || "U").charAt(0).toUpperCase();
  const isFailed = Boolean(user?.avatarUrl && failedUrl === user.avatarUrl);

  if (user?.avatarUrl && !isFailed) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.fullName || "User"}
        className="nav-avatar-img"
        onError={() => setFailedUrl(user.avatarUrl)}
      />
    );
  }

  return <span className="nav-avatar-fallback">{initials}</span>;
}

/* ==========================================================================
   NAVBAR COMPONENT
   ========================================================================== */
export default function Navbar({ onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("home");
  const [open, setOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(() => authApi.getCurrentUser());
  const { theme, toggleTheme } = useTheme();

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [userDropdownOpen]);

  // Keep auth in sync
  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(authApi.getCurrentUser());
    };
    window.addEventListener("authChange", handleAuthChange);
    return () => window.removeEventListener("authChange", handleAuthChange);
  }, []);

  // Scroll listener for sticky compact state
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 30);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Instantaneous Scroll Spy for Active Section Detection
  useEffect(() => {
    const getSections = () => LINKS.map(([, id]) => document.getElementById(id)).filter(Boolean);
    let sections = getSections();

    const onScrollSpy = () => {
      if (!sections.length) sections = getSections();
      const scrollPos = window.scrollY + 140;
      for (let i = sections.length - 1; i >= 0; i--) {
        const s = sections[i];
        if (s && s.offsetTop <= scrollPos) {
          setActive(s.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", onScrollSpy, { passive: true });
    // Run after DOM paint
    const t = setTimeout(onScrollSpy, 150);

    return () => {
      window.removeEventListener("scroll", onScrollSpy);
      clearTimeout(t);
    };
  }, []);

  // Navigation handlers
  const nav = (route) => {
    setOpen(false);
    if (onNavigate) {
      onNavigate(route);
    } else {
      window.location.hash = `#/${route.replace(/^\//, "")}`;
    }
  };

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    setOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const navOffset = 84;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setActive(id);
      window.history.replaceState(null, "", `#${id}`);
    } else {
      window.location.hash = `#/`;
    }
  };

  const handleSignOut = () => {
    authApi.logout();
    setCurrentUser(null);
    setOpen(false);
    nav("home");
  };

  return (
    <header className={`nav-wrap ${scrolled ? "is-scrolled" : ""}`}>
      {/* ───────────── SLIM PLACEMENT TICKER ───────────── */}
      <div className="ticker" aria-label="Recent campus placements">
        <div className="tk-label">
          <Briefcase size={12} />
          <span>Placements</span>
          <span className="tk-live-dot" />
        </div>

        <div className="tk-viewport">
          <div className="tk-track" style={{ "--tk-dur": `${TICKER_SECONDS}s` }}>
            <TickerRound />
            <TickerRound hidden />
          </div>
        </div>

        <a href="#placements" onClick={scrollTo("placements")} className="tk-cta">
          <span>Placement Cell</span>
          <ArrowRight size={11} />
        </a>
      </div>

      {/* ───────────── MAIN SLIM NAVIGATION BAR ───────────── */}
      <div className="nav-shell">
        <nav className="nav" aria-label="Main navigation">
          {/* Official Brand Lockup */}
          <a
            href="#home"
            className="nav-brand"
            onClick={scrollTo("home")}
            aria-label="Subharti Polytechnic Home"
          >
            <BrandLockup />
          </a>

          {/* Clean, Elegant Navigation Links */}
          <ul className="nav-links">
            {LINKS.map(([label, id]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  onClick={scrollTo(id)}
                  className={`nav-link-item ${active === id ? "active" : ""}`}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          {/* Actions & State Handling */}
          <div className="nav-actions">
            {/* Theme Toggle */}
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              <span className="theme-toggle-text">{theme === "dark" ? "Light" : "Dark"}</span>
            </button>

            {currentUser ? (
              <div className="nav-user-dropdown-anchor" ref={userDropdownRef}>
                <button
                  type="button"
                  className={`nav-avatar-trigger-btn ${userDropdownOpen ? "active" : ""}`}
                  onClick={() => setUserDropdownOpen((o) => !o)}
                  title={`Account: ${currentUser.fullName || "User"}`}
                  aria-expanded={userDropdownOpen}
                >
                  <NavAvatar user={currentUser} />
                  <span className="nav-avatar-online-dot" />
                  <ChevronDown size={13} className={`nav-avatar-chevron ${userDropdownOpen ? "open" : ""}`} />
                </button>

                {/* Floating Profile Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="nav-profile-dropdown-card">
                    <div className="dropdown-user-header">
                      <NavAvatar user={currentUser} />
                      <div className="dropdown-user-details">
                        <strong className="dropdown-user-name">{currentUser.fullName || "Scholar"}</strong>
                        <span className="dropdown-user-email">{currentUser.email || "student@subharti.org"}</span>
                        <span className="dropdown-user-role-chip">
                          <ShieldCheck size={11} />
                          <span>{currentUser.role === "teacher" ? "Faculty Member" : currentUser.role === "principal" ? "Principal" : "Verified Student"}</span>
                        </span>
                      </div>
                    </div>

                    <div className="dropdown-menu-sep" />

                    <div className="dropdown-menu-actions">
                      <button
                        type="button"
                        className="dropdown-menu-link"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          nav("dashboard");
                        }}
                      >
                        <LayoutDashboard size={15} />
                        <span>Executive Dashboard</span>
                      </button>

                      <button
                        type="button"
                        className="dropdown-menu-link"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          nav("profile");
                        }}
                      >
                        <User size={15} />
                        <span>My Profile</span>
                      </button>
                    </div>

                    <div className="dropdown-menu-sep" />

                    <button
                      type="button"
                      className="dropdown-menu-link dropdown-logout-action"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleSignOut();
                      }}
                    >
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="nav-btn nav-btn-ghost"
                  onClick={() => nav("login")}
                >
                  <LogIn size={14} />
                  <span>Login</span>
                </button>
                <button
                  type="button"
                  className="nav-btn nav-btn-primary"
                  onClick={() => nav("register")}
                >
                  <span>Apply Now</span>
                  <ArrowRight size={14} />
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className={`nav-burger ${open ? "open" : ""}`}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>
        </nav>
      </div>

      {/* ───────────── MOBILE DRAWER ───────────── */}
      <div className={`nav-scrim ${open ? "show" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`nav-drawer ${open ? "show" : ""}`} aria-hidden={!open}>
        <div className="nav-drawer-header">
          <BrandLockup />
          <button
            type="button"
            className="nav-drawer-close"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <ul className="drawer-links">
          {LINKS.map(([label, id]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={scrollTo(id)}
                className={active === id ? "active" : ""}
              >
                <span>{label}</span>
                <ArrowRight size={14} />
              </a>
            </li>
          ))}
        </ul>

        <div className="nav-drawer-cta">
          {currentUser ? (
            <div className="drawer-user-box">
              <div className="drawer-user-identity">
                <NavAvatar user={currentUser} />
                <div className="drawer-user-meta">
                  <strong className="drawer-user-name">{currentUser.fullName || "Scholar"}</strong>
                  <span className="drawer-user-role-tag">
                    {currentUser.role === "teacher" ? "Faculty Member" : currentUser.role === "principal" ? "Principal" : "Verified Student"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="nav-btn nav-btn-primary w-full"
                onClick={() => nav("dashboard")}
              >
                <LayoutDashboard size={15} />
                <span>Open Dashboard</span>
              </button>
              <button
                type="button"
                className="nav-btn nav-btn-ghost w-full"
                onClick={() => nav("profile")}
              >
                <User size={15} />
                <span>My Profile</span>
              </button>
              <button
                type="button"
                className="nav-btn nav-btn-danger w-full"
                onClick={handleSignOut}
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="nav-btn nav-btn-ghost w-full"
                onClick={() => nav("login")}
              >
                <LogIn size={15} />
                <span>Login to Portal</span>
              </button>
              <button
                type="button"
                className="nav-btn nav-btn-primary w-full"
                onClick={() => nav("register")}
              >
                <span>Apply for Admission</span>
                <ArrowRight size={15} />
              </button>
            </>
          )}
        </div>
      </aside>
    </header>
  );
}
