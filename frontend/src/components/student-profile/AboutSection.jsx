import React, { useState } from "react";
import { User, Edit2, ChevronDown, ChevronUp, Sparkles, Target, Compass, Briefcase } from "lucide-react";

export default function AboutSection({ user, profile, onEdit }) {
  const [expanded, setExpanded] = useState(false);

  const fullName = user?.fullName || profile?.fullName || "Student";
  const bio =
    profile?.bio ||
    user?.bio ||
    `Hello! I'm ${fullName}, a dedicated engineering student at Swami Vivekanand Subharti University. I focus on software development, computer engineering, building scalable applications, and mastering modern software architecture.`;

  const objective =
    profile?.careerObjective ||
    profile?.career?.objective ||
    "Seeking a challenging software engineering or developer role to design scalable web platforms, high-performance APIs, and user-centric products.";

  const preferredRoles = profile?.career?.preferredRoles?.length
    ? profile.career.preferredRoles
    : ["Frontend Engineer", "Full-Stack Developer", "Software Engineer", "React Specialist"];

  return (
    <div className="sp2-bento-card sp2-card-about" id="section-about">
      <div className="sp2-card-head">
        <div className="sp2-card-title-group">
          <div className="sp2-card-title-icon-wrap blue">
            <User size={18} />
          </div>
          <div>
            <h2 className="sp2-card-title">Professional Bio & About Me</h2>
            <p className="sp2-card-subtitle">Personal statement and engineering journey</p>
          </div>
        </div>
        <button
          type="button"
          className="sp2-card-action-pill"
          onClick={() => onEdit?.("about")}
          aria-label="Edit About Me"
        >
          <Edit2 size={13} />
          <span>Edit</span>
        </button>
      </div>

      <div className="sp2-about-body">
        {/* Bio Text */}
        <div className="sp2-about-text-block">
          <p className={`sp2-about-bio-text ${expanded ? "expanded" : ""}`}>{bio}</p>
          {bio.length > 180 && (
            <button
              type="button"
              className="sp2-read-more-btn"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
            >
              <span>{expanded ? "Read Less" : "Read More"}</span>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>

        {/* Career Objective */}
        <div className="sp2-career-objective-box">
          <div className="sp2-obj-head">
            <Target size={15} className="text-blue" />
            <span className="sp2-obj-title">Career Objective</span>
          </div>
          <p className="sp2-obj-text">{objective}</p>
        </div>

        {/* Target Roles & Strengths Chips */}
        <div className="sp2-roles-target-wrap">
          <span className="sp2-roles-title">Target Roles:</span>
          <div className="sp2-roles-chips">
            {preferredRoles.map((role, idx) => (
              <span key={idx} className="sp2-role-pill">
                <Briefcase size={12} className="text-blue-400" />
                <span>{role}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
