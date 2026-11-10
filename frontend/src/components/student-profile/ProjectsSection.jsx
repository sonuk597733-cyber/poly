import React from "react";
import {
  FolderGit2,
  ExternalLink,
  Plus,
  Star,
  Layers,
  Code2,
  Sparkles
} from "lucide-react";
import { IconGitHub } from "./BrandIcons";

export const SAMPLE_PROJECTS = [
  {
    title: "CollegeOS Sessional Engine",
    description: "Enterprise 3-sessional examination and automated best-of-three grading platform with synchronized ceiling controls.",
    technologies: ["React", "Node.js", "Express", "MongoDB", "REST APIs"],
    githubUrl: "https://github.com",
    liveUrl: "",
    category: "Full-Stack Web App",
    role: "Lead Engineer",
    stars: 4.9,
    featured: true
  },
  {
    title: "Polytechnic Campus Connect",
    description: "Real-time communication and digital handout distribution platform for diploma engineering departments.",
    technologies: ["JavaScript", "HTML5", "CSS3", "WebSockets"],
    githubUrl: "https://github.com",
    liveUrl: "",
    category: "Campus Tool",
    role: "Frontend Developer",
    stars: 4.8,
    featured: false
  }
];

export default function ProjectsSection({
  projects = [],
  onAddProject,
  onViewAll
}) {
  const displayProjects = Array.isArray(projects) && projects.length > 0
    ? projects
    : SAMPLE_PROJECTS;

  return (
    <div className="sp2-bento-card sp2-card-projects" id="section-projects">
      <div className="sp2-card-head">
        <div className="sp2-card-title-group">
          <div className="sp2-card-title-icon-wrap blue">
            <FolderGit2 size={18} />
          </div>
          <div>
            <h2 className="sp2-card-title">Featured Projects & Builds</h2>
            <p className="sp2-card-subtitle">
              Software applications, repositories, and engineering deliverables ({displayProjects.length})
            </p>
          </div>
        </div>
        <button
          type="button"
          className="sp2-card-action-pill"
          onClick={onAddProject}
          aria-label="Add New Project"
        >
          <Plus size={13} />
          <span>Add Project</span>
        </button>
      </div>

      <div className="sp2-projects-body">
        <div className="sp2-projects-grid">
          {displayProjects.map((proj, idx) => {
            const techs = Array.isArray(proj.technologies)
              ? proj.technologies
              : typeof proj.techStack === "string"
              ? proj.techStack.split(",").map((s) => s.trim())
              : Array.isArray(proj.techStack)
              ? proj.techStack
              : [];

            return (
              <div key={idx} className={`sp2-project-card ${proj.featured ? "featured" : ""}`}>
                <div className="sp2-project-card-top">
                  <div className="sp2-project-cat-pill">
                    <Layers size={11} />
                    <span>{proj.category || "Software Project"}</span>
                  </div>
                  {proj.stars && (
                    <div className="sp2-project-star-badge">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      <span>{Number(proj.stars).toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <h3 className="sp2-project-title">{proj.title}</h3>
                <p className="sp2-project-desc">{proj.description}</p>

                {/* Tech Badges */}
                {techs.length > 0 && (
                  <div className="sp2-project-tech-strip">
                    {techs.slice(0, 5).map((t, tIdx) => (
                      <span key={tIdx} className="tech-tag">{t}</span>
                    ))}
                    {techs.length > 5 && (
                      <span className="tech-tag more">+{techs.length - 5}</span>
                    )}
                  </div>
                )}

                {/* Footer Link Actions */}
                <div className="sp2-project-actions-row">
                  {proj.githubUrl && (
                    <a
                      href={proj.githubUrl.startsWith("http") ? proj.githubUrl : `https://${proj.githubUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sp2-proj-link-btn"
                    >
                      <IconGitHub size={14} />
                      <span>Repository</span>
                    </a>
                  )}

                  {proj.liveUrl && (
                    <a
                      href={proj.liveUrl.startsWith("http") ? proj.liveUrl : `https://${proj.liveUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sp2-proj-link-btn live"
                    >
                      <ExternalLink size={14} />
                      <span>Live Demo</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
