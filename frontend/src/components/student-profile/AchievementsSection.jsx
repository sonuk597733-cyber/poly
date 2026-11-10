import React from "react";
import {
  Trophy,
  Award,
  Crown,
  Code2,
  Star,
  Flame,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

export const DEFAULT_BADGES = [
  {
    id: "top-student",
    title: "Academic Distinction",
    year: "2025",
    category: "Academic Excellence",
    issuer: "Faculty of Engineering & Technology",
    description: "Secured top academic standing with SGPA 8.5+ in Computer Science & Engineering.",
    icon: Crown,
    colorClass: "amber"
  },
  {
    id: "coding-star",
    title: "Algorithmic Master",
    year: "2024",
    category: "Problem Solving",
    issuer: "CollegeOS Coding Arena",
    description: "Completed 200+ algorithm and data structures challenges with distinction.",
    icon: Code2,
    colorClass: "purple"
  },
  {
    id: "project-expert",
    title: "Full-Stack Builder",
    year: "2024",
    category: "Software Development",
    issuer: "Polytechnic Innovation Guild",
    description: "Built and deployed enterprise full-stack web and database applications.",
    icon: Star,
    colorClass: "blue"
  },
  {
    id: "attendance-honor",
    title: "Attendance Honor",
    year: "2024",
    category: "Campus Discipline",
    issuer: "Office of the Principal",
    description: "Consistently maintained 85%+ lecture and laboratory attendance.",
    icon: ShieldCheck,
    colorClass: "emerald"
  }
];

export default function AchievementsSection({ achievements = [], onViewAll }) {
  const displayBadges = Array.isArray(achievements) && achievements.length > 0
    ? achievements.map((a, idx) => ({
        id: a.id || `ach-${idx}`,
        title: a.title || "Academic Honor",
        year: a.year || "2024",
        category: a.category || "University Recognition",
        issuer: a.issuer || "Subharti Polytechnic",
        description: a.description || "Awarded for exceptional academic and campus standing.",
        icon: a.badge === "coding_star" ? Code2 : a.badge === "top_student" ? Crown : Award,
        colorClass: idx % 2 === 0 ? "amber" : "blue"
      }))
    : DEFAULT_BADGES;

  return (
    <div className="sp2-bento-card sp2-card-achievements" id="section-achievements">
      <div className="sp2-card-head">
        <div className="sp2-card-title-group">
          <div className="sp2-card-title-icon-wrap amber">
            <Trophy size={18} />
          </div>
          <div>
            <h2 className="sp2-card-title">Honors & Verified Badges</h2>
            <p className="sp2-card-subtitle">
              Institutional recognitions, hackathons, and technical milestones ({displayBadges.length})
            </p>
          </div>
        </div>
      </div>

      <div className="sp2-achievements-body">
        <div className="sp2-badges-grid">
          {displayBadges.map((badge) => {
            const Icon = badge.icon || Trophy;
            return (
              <div key={badge.id} className={`sp2-badge-card ${badge.colorClass || "amber"}`}>
                <div className="sp2-badge-icon-wrap">
                  <Icon size={20} />
                </div>
                <div className="sp2-badge-info">
                  <div className="sp2-badge-title-row">
                    <h3 className="sp2-badge-title">{badge.title}</h3>
                    <span className="sp2-badge-year">{badge.year}</span>
                  </div>
                  <span className="sp2-badge-issuer">{badge.issuer}</span>
                  <p className="sp2-badge-desc">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
