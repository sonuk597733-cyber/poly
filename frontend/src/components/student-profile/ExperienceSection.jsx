import React from "react";
import {
  Briefcase,
  Calendar,
  MapPin,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from "lucide-react";

export const DEFAULT_EXPERIENCE = [
  {
    id: "exp-1",
    role: "Full-Stack Development Intern",
    company: "CollegeOS Core Systems",
    location: "Meerut / Hybrid",
    startDate: "Aug 2024",
    endDate: "Present",
    current: true,
    description: "Architected real-time student portals, optimized MongoDB queries, and engineered responsive user interfaces for university campus modules.",
    skills: ["React", "Express.js", "Node.js", "MongoDB", "Tailwind CSS"]
  },
  {
    id: "exp-2",
    role: "Peer Coding Mentor & Technical Lead",
    company: "Subharti Polytechnic Developer Guild",
    location: "Meerut Campus",
    startDate: "Jan 2024",
    endDate: "Jul 2024",
    current: false,
    description: "Mentored 40+ engineering peers in web development, Git version control, and data structures problem solving.",
    skills: ["JavaScript", "Git & GitHub", "Algorithms", "Mentorship"]
  }
];

export default function ExperienceSection({ experience = [] }) {
  const displayExp = Array.isArray(experience) && experience.length > 0
    ? experience
    : DEFAULT_EXPERIENCE;

  return (
    <div className="sp2-bento-card sp2-card-experience" id="section-experience">
      <div className="sp2-card-head">
        <div className="sp2-card-title-group">
          <div className="sp2-card-title-icon-wrap cyan">
            <Briefcase size={18} />
          </div>
          <div>
            <h2 className="sp2-card-title">Experience & Internships</h2>
            <p className="sp2-card-subtitle">
              Industry apprenticeships, campus leadership, and technical roles ({displayExp.length})
            </p>
          </div>
        </div>
      </div>

      <div className="sp2-exp-body">
        <div className="sp2-exp-list">
          {displayExp.map((exp, idx) => {
            const skillsList = Array.isArray(exp.skills) ? exp.skills : [];
            const roleTitle = exp.role || exp.title || "Engineering Role";

            return (
              <div key={exp.id || idx} className="sp2-exp-card">
                <div className="sp2-exp-top-row">
                  <div className="sp2-exp-meta">
                    <h3 className="sp2-exp-role">{roleTitle}</h3>
                    <div className="sp2-exp-org-row">
                      <span className="org">{exp.company || "Subharti Polytechnic"}</span>
                      {exp.location && (
                        <>
                          <span className="bullet">•</span>
                          <span className="loc">{exp.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`sp2-exp-period-badge ${exp.current ? "current" : ""}`}>
                    {exp.startDate || "2024"} — {exp.endDate || "Present"}
                  </span>
                </div>

                {exp.description && (
                  <p className="sp2-exp-desc">{exp.description}</p>
                )}

                {skillsList.length > 0 && (
                  <div className="sp2-exp-skills-strip">
                    {skillsList.map((sk, sIdx) => (
                      <span key={sIdx} className="exp-tag">{sk}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
