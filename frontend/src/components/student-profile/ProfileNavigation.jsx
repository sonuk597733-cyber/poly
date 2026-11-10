import React, { useRef } from "react";
import {
  LayoutGrid,
  GraduationCap,
  Code2,
  FolderGit2,
  Award,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from "lucide-react";

export const PROFILE_TABS = [
  { id: "all", label: "Overview & Bento", icon: LayoutGrid },
  { id: "academics", label: "Academics", icon: GraduationCap },
  { id: "skills", label: "Skills & Stack", icon: Code2 },
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "experience", label: "Experience & Activity", icon: Briefcase }
];

export default function ProfileNavigation({ activeTab, onSelectTab, onTabChange }) {
  const scrollRef = useRef(null);
  const handleTabClick = onSelectTab || onTabChange;

  const handleScroll = (offset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <nav className="sp2-sticky-nav-container" aria-label="Profile Sections Navigation">
      <div className="sp2-nav-scroll-shell">
        <button
          type="button"
          className="sp2-nav-scroll-btn sp2-scroll-left"
          onClick={() => handleScroll(-180)}
          aria-label="Scroll Tabs Left"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="sp2-nav-pills-row" ref={scrollRef} role="tablist">
          {PROFILE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                className={`sp2-nav-pill-btn ${isActive ? "active" : ""}`}
                onClick={() => handleTabClick?.(tab.id)}
              >
                <Icon size={15} className="sp2-tab-icon" />
                <span className="sp2-tab-label">{tab.label}</span>
                {isActive && <span className="sp2-active-glow-dot" />}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="sp2-nav-scroll-btn sp2-scroll-right"
          onClick={() => handleScroll(180)}
          aria-label="Scroll Tabs Right"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
