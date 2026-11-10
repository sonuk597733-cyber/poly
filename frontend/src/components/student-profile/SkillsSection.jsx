import React, { useState } from "react";
import { Code2, Plus, Sparkles, X, Check, Layers, Cpu, Database, Wrench } from "lucide-react";

export const DEFAULT_SKILLS = [
  "React",
  "JavaScript",
  "Node.js",
  "MongoDB",
  "Python",
  "C++",
  "Data Structures & Algorithms",
  "Tailwind CSS",
  "Express.js",
  "Git & GitHub",
  "REST APIs",
  "SQL",
  "Linux OS"
];

export default function SkillsSection({ skills = [], onAddSkill, onViewAll }) {
  const [newSkillText, setNewSkillText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const displaySkills = Array.isArray(skills) && skills.length > 0 ? skills : DEFAULT_SKILLS;

  const handleAddSubmit = (e) => {
    e?.preventDefault();
    const clean = newSkillText.trim();
    if (!clean) return;
    onAddSkill?.(clean);
    setNewSkillText("");
    setIsAdding(false);
  };

  return (
    <div className="sp2-bento-card sp2-card-skills" id="section-skills">
      <div className="sp2-card-head">
        <div className="sp2-card-title-group">
          <div className="sp2-card-title-icon-wrap purple">
            <Code2 size={18} />
          </div>
          <div>
            <h2 className="sp2-card-title">Skills & Technical Stack</h2>
            <p className="sp2-card-subtitle">
              Verified competencies, frameworks, and developer tools ({displaySkills.length})
            </p>
          </div>
        </div>
        <button
          type="button"
          className="sp2-card-action-pill"
          onClick={() => setIsAdding(!isAdding)}
          aria-label="Add Skill"
        >
          <Plus size={13} />
          <span>Add Skill</span>
        </button>
      </div>

      <div className="sp2-skills-body">
        {/* Inline Add Skill Form */}
        {isAdding && (
          <form className="sp2-inline-skill-form" onSubmit={handleAddSubmit}>
            <input
              type="text"
              placeholder="e.g. Next.js, Docker, TypeScript..."
              value={newSkillText}
              onChange={(e) => setNewSkillText(e.target.value)}
              className="sp2-skill-input"
              autoFocus
            />
            <button type="submit" className="sp2-skill-submit-btn" disabled={!newSkillText.trim()}>
              <Check size={14} />
              <span>Save</span>
            </button>
            <button
              type="button"
              className="sp2-skill-cancel-btn"
              onClick={() => {
                setNewSkillText("");
                setIsAdding(false);
              }}
            >
              <X size={14} />
            </button>
          </form>
        )}

        {/* Skill Chips Cloud */}
        <div className="sp2-skills-grid">
          {displaySkills.map((skill, index) => {
            const isHighlighted = index < 3;
            return (
              <div key={index} className={`sp2-skill-badge ${isHighlighted ? "highlight" : ""}`}>
                <span className="skill-dot" />
                <span className="skill-text">{skill}</span>
              </div>
            );
          })}
        </div>

        {/* Categories Breakdown Strip */}
        <div className="sp2-skill-categories-strip">
          <div className="cat-pill">
            <Layers size={12} className="text-blue" />
            <span>Frontend & Web</span>
          </div>
          <div className="cat-pill">
            <Cpu size={12} className="text-purple" />
            <span>Backend & Systems</span>
          </div>
          <div className="cat-pill">
            <Database size={12} className="text-emerald" />
            <span>Databases</span>
          </div>
          <div className="cat-pill">
            <Wrench size={12} className="text-amber" />
            <span>DevOps & Tools</span>
          </div>
        </div>
      </div>
    </div>
  );
}
