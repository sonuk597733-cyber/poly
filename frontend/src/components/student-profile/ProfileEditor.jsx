import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Save,
  Loader2,
  User,
  GraduationCap,
  Sparkles,
  Link2,
  FolderGit2,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Globe,
  Briefcase
} from "lucide-react";
import {
  IconLinkedIn,
  IconGitHub,
  IconYouTube,
  IconTwitter,
  IconInstagram,
  IconDiscord,
  IconLeetCode
} from "./BrandIcons";
import { BRANCH_CHOICES, SEMESTER_CHOICES, ACADEMIC_YEAR_CHOICES } from "../../pages/student/StudentProfile";

const EDITOR_TABS = [
  { id: "basic", label: "Basic Info", icon: User },
  { id: "academics", label: "Academics", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Sparkles },
  { id: "social", label: "Social Links", icon: Link2 },
  { id: "projects", label: "Projects", icon: FolderGit2 }
];

export default function ProfileEditor({
  profile,
  isOpen,
  onClose,
  onSave
}) {
  const [activeTab, setActiveTab] = useState("basic");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const modalRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    tagline: "",
    phone: "",
    location: "",
    bio: "",
    careerObjective: "",
    branch: "CSE",
    semester: "Semester 5",
    academicYear: "3rd Year",
    enrollmentNo: "",
    skills: [],
    socialLinks: {
      linkedin: "",
      github: "",
      youtube: "",
      portfolio: "",
      twitter: "",
      instagram: "",
      discord: "",
      website: "",
      leetcode: ""
    },
    projects: []
  });

  const [newSkillInput, setNewSkillInput] = useState("");
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    technologies: "",
    githubUrl: "",
    liveUrl: "",
    category: "Full-Stack Web App"
  });
  const [showAddProject, setShowAddProject] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        tagline: profile.tagline || "",
        phone: profile.phone || "",
        location: profile.location || "",
        bio: profile.bio || "",
        careerObjective: profile.careerObjective || profile.career?.objective || "",
        branch: profile.branch || "CSE",
        semester: profile.semester || "Semester 5",
        academicYear: profile.academicYear || "3rd Year",
        enrollmentNo: profile.enrollmentNo || profile.rollNo || "",
        skills: Array.isArray(profile.skills) ? [...profile.skills] : [],
        socialLinks: {
          linkedin: profile.socialLinks?.linkedin || profile.linkedin || "",
          github: profile.socialLinks?.github || profile.github || "",
          youtube: profile.socialLinks?.youtube || "",
          portfolio: profile.socialLinks?.portfolio || profile.portfolio || profile.website || "",
          twitter: profile.socialLinks?.twitter || "",
          instagram: profile.socialLinks?.instagram || "",
          discord: profile.socialLinks?.discord || "",
          website: profile.socialLinks?.website || profile.website || "",
          leetcode: profile.socialLinks?.leetcode || ""
        },
        projects: Array.isArray(profile.projects) ? [...profile.projects] : []
      });
    }
    setErrorMsg("");
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (network, value) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [network]: value
      }
    }));
  };

  const handleAddSkill = (e) => {
    e?.preventDefault();
    const clean = newSkillInput.trim();
    if (!clean) return;
    if (formData.skills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      setErrorMsg(`"${clean}" is already in your skills list.`);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, clean]
    }));
    setNewSkillInput("");
    setErrorMsg("");
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove)
    }));
  };

  const handleAddProject = (e) => {
    e?.preventDefault();
    if (!newProject.title.trim()) {
      setErrorMsg("Please enter a project title.");
      return;
    }
    const techArray = newProject.technologies
      ? newProject.technologies.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const projectObj = {
      title: newProject.title.trim(),
      description: newProject.description.trim(),
      technologies: techArray,
      githubUrl: newProject.githubUrl.trim(),
      liveUrl: newProject.liveUrl.trim(),
      category: newProject.category || "Full-Stack Web App",
      stars: 4.8,
      featured: formData.projects.length === 0
    };

    setFormData((prev) => ({
      ...prev,
      projects: [...prev.projects, projectObj]
    }));
    setNewProject({
      title: "",
      description: "",
      technologies: "",
      githubUrl: "",
      liveUrl: "",
      category: "Full-Stack Web App"
    });
    setShowAddProject(false);
    setErrorMsg("");
  };

  const handleRemoveProject = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setErrorMsg("");

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        tagline: formData.tagline.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        bio: formData.bio.trim(),
        careerObjective: formData.careerObjective.trim(),
        branch: formData.branch,
        semester: formData.semester,
        academicYear: formData.academicYear,
        enrollmentNo: formData.enrollmentNo.trim(),
        skills: formData.skills,
        socialLinks: formData.socialLinks,
        linkedin: formData.socialLinks.linkedin,
        github: formData.socialLinks.github,
        portfolio: formData.socialLinks.portfolio,
        website: formData.socialLinks.website,
        projects: formData.projects
      };

      const success = await onSave(payload);
      if (success) {
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="std-modal-backdrop profile-editor-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="profile-editor-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Edit Student Profile"
        ref={modalRef}
      >
        {/* Top Header */}
        <div className="editor-drawer-header">
          <div className="drawer-title-group">
            <h2 className="drawer-title">Edit Student Profile</h2>
            <p className="drawer-sub">Update your academic identity and verified details</p>
          </div>
          <button
            type="button"
            className="std-icon-btn close-drawer"
            onClick={onClose}
            aria-label="Close Editor"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="editor-tabs-bar" role="tablist">
          {EDITOR_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`editor-tab-pill ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="editor-alert-box error" role="alert">
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="editor-drawer-body">
          {/* TAB 1: BASIC INFO */}
          {activeTab === "basic" && (
            <div className="editor-section-fields">
              <div className="editor-field-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  placeholder="e.g. Satyam Kumar"
                  className="editor-input"
                  required
                />
              </div>

              <div className="editor-field-group">
                <label>Tagline / Engineering Motto</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleInputChange("tagline", e.target.value)}
                  placeholder="e.g. Code Today, Lead Tomorrow 🚀"
                  className="editor-input"
                />
              </div>

              <div className="editor-field-grid-2">
                <div className="editor-field-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+91 9876543210"
                    className="editor-input"
                  />
                </div>

                <div className="editor-field-group">
                  <label>Location / City</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="e.g. Meerut, Uttar Pradesh"
                    className="editor-input"
                  />
                </div>
              </div>

              <div className="editor-field-group">
                <label>About Me / Bio</label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Tell peers and recruiters about your engineering journey, passions, and background..."
                  className="editor-textarea"
                />
              </div>
            </div>
          )}

          {/* TAB 2: ACADEMICS */}
          {activeTab === "academics" && (
            <div className="editor-section-fields">
              <div className="editor-field-grid-2">
                <div className="editor-field-group">
                  <label>Branch / Department</label>
                  <select
                    value={formData.branch}
                    onChange={(e) => handleInputChange("branch", e.target.value)}
                    className="editor-select"
                  >
                    {BRANCH_CHOICES.map((b) => (
                      <option key={b.value} value={b.value}>{b.label}</option>
                    ))}
                  </select>
                </div>

                <div className="editor-field-group">
                  <label>Current Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => handleInputChange("semester", e.target.value)}
                    className="editor-select"
                  >
                    {SEMESTER_CHOICES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="editor-field-grid-2">
                <div className="editor-field-group">
                  <label>Academic Year</label>
                  <select
                    value={formData.academicYear}
                    onChange={(e) => handleInputChange("academicYear", e.target.value)}
                    className="editor-select"
                  >
                    {ACADEMIC_YEAR_CHOICES.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="editor-field-group">
                  <label>Enrollment / Roll Number</label>
                  <input
                    type="text"
                    value={formData.enrollmentNo}
                    onChange={(e) => handleInputChange("enrollmentNo", e.target.value)}
                    placeholder="e.g. SUB-CSE-2024-042"
                    className="editor-input font-mono"
                  />
                </div>
              </div>

              <div className="editor-field-group">
                <label>Career Objective</label>
                <textarea
                  rows={3}
                  value={formData.careerObjective}
                  onChange={(e) => handleInputChange("careerObjective", e.target.value)}
                  placeholder="e.g. Seeking a full-stack developer role to build scalable web platforms and intelligent cloud architectures..."
                  className="editor-textarea"
                />
              </div>
            </div>
          )}

          {/* TAB 3: SKILLS */}
          {activeTab === "skills" && (
            <div className="editor-section-fields">
              <div className="editor-skill-input-row">
                <input
                  type="text"
                  placeholder="Add a new skill (e.g. Docker, TypeScript, Next.js)..."
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  className="editor-input"
                />
                <button
                  type="button"
                  className="editor-btn-secondary"
                  onClick={handleAddSkill}
                  disabled={!newSkillInput.trim()}
                >
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </div>

              <div className="editor-skills-chips-wrap">
                {formData.skills.map((skill, index) => (
                  <span key={index} className="editor-skill-chip">
                    <span>{skill}</span>
                    <button
                      type="button"
                      className="chip-remove-btn"
                      onClick={() => handleRemoveSkill(skill)}
                      aria-label={`Remove ${skill}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SOCIAL LINKS */}
          {activeTab === "social" && (
            <div className="editor-section-fields">
              <div className="editor-field-group">
                <label className="flex-label">
                  <IconGitHub size={14} />
                  <span>GitHub Profile URL</span>
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username"
                  value={formData.socialLinks.github}
                  onChange={(e) => handleSocialChange("github", e.target.value)}
                  className="editor-input"
                />
              </div>

              <div className="editor-field-group">
                <label className="flex-label">
                  <IconLinkedIn size={14} />
                  <span>LinkedIn Profile URL</span>
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={formData.socialLinks.linkedin}
                  onChange={(e) => handleSocialChange("linkedin", e.target.value)}
                  className="editor-input"
                />
              </div>

              <div className="editor-field-group">
                <label className="flex-label">
                  <Globe size={14} />
                  <span>Portfolio / Personal Website</span>
                </label>
                <input
                  type="url"
                  placeholder="https://yourportfolio.dev"
                  value={formData.socialLinks.portfolio}
                  onChange={(e) => handleSocialChange("portfolio", e.target.value)}
                  className="editor-input"
                />
              </div>

              <div className="editor-field-group">
                <label className="flex-label">
                  <IconLeetCode size={14} />
                  <span>LeetCode Profile URL</span>
                </label>
                <input
                  type="url"
                  placeholder="https://leetcode.com/username"
                  value={formData.socialLinks.leetcode}
                  onChange={(e) => handleSocialChange("leetcode", e.target.value)}
                  className="editor-input"
                />
              </div>

              <div className="editor-field-grid-2">
                <div className="editor-field-group">
                  <label className="flex-label">
                    <IconTwitter size={14} />
                    <span>X (Twitter) URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://x.com/username"
                    value={formData.socialLinks.twitter}
                    onChange={(e) => handleSocialChange("twitter", e.target.value)}
                    className="editor-input"
                  />
                </div>

                <div className="editor-field-group">
                  <label className="flex-label">
                    <IconYouTube size={14} />
                    <span>YouTube URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/@channel"
                    value={formData.socialLinks.youtube}
                    onChange={(e) => handleSocialChange("youtube", e.target.value)}
                    className="editor-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PROJECTS */}
          {activeTab === "projects" && (
            <div className="editor-section-fields">
              <div className="editor-projects-top-bar">
                <span className="count-label">Projects List ({formData.projects.length})</span>
                <button
                  type="button"
                  className="editor-btn-secondary"
                  onClick={() => setShowAddProject(!showAddProject)}
                >
                  <Plus size={14} />
                  <span>{showAddProject ? "Cancel" : "Add Project"}</span>
                </button>
              </div>

              {/* Add Project Form */}
              {showAddProject && (
                <div className="editor-add-project-card">
                  <h4>New Project Details</h4>
                  <div className="editor-field-group">
                    <label>Project Title</label>
                    <input
                      type="text"
                      placeholder="e.g. AI Attendance Predictor"
                      value={newProject.title}
                      onChange={(e) => setNewProject((prev) => ({ ...prev, title: e.target.value }))}
                      className="editor-input"
                    />
                  </div>

                  <div className="editor-field-group">
                    <label>Description</label>
                    <textarea
                      rows={2}
                      placeholder="Summary of purpose, architecture, and results..."
                      value={newProject.description}
                      onChange={(e) => setNewProject((prev) => ({ ...prev, description: e.target.value }))}
                      className="editor-textarea"
                    />
                  </div>

                  <div className="editor-field-group">
                    <label>Technologies (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="React, Node.js, Express, MongoDB"
                      value={newProject.technologies}
                      onChange={(e) => setNewProject((prev) => ({ ...prev, technologies: e.target.value }))}
                      className="editor-input"
                    />
                  </div>

                  <div className="editor-field-grid-2">
                    <div className="editor-field-group">
                      <label>GitHub Repository URL</label>
                      <input
                        type="url"
                        placeholder="https://github.com/..."
                        value={newProject.githubUrl}
                        onChange={(e) => setNewProject((prev) => ({ ...prev, githubUrl: e.target.value }))}
                        className="editor-input"
                      />
                    </div>

                    <div className="editor-field-group">
                      <label>Live Demo URL</label>
                      <input
                        type="url"
                        placeholder="https://myproject.dev"
                        value={newProject.liveUrl}
                        onChange={(e) => setNewProject((prev) => ({ ...prev, liveUrl: e.target.value }))}
                        className="editor-input"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="editor-btn-save-project"
                    onClick={handleAddProject}
                  >
                    <Check size={14} />
                    <span>Add to Profile</span>
                  </button>
                </div>
              )}

              {/* Projects List */}
              <div className="editor-projects-list">
                {formData.projects.map((proj, idx) => (
                  <div key={idx} className="editor-proj-item">
                    <div className="proj-item-info">
                      <h4 className="proj-item-title">{proj.title}</h4>
                      <p className="proj-item-desc">{proj.description}</p>
                    </div>
                    <button
                      type="button"
                      className="proj-delete-btn"
                      onClick={() => handleRemoveProject(idx)}
                      aria-label={`Delete ${proj.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="editor-drawer-footer">
          <button
            type="button"
            className="editor-btn-cancel"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="editor-btn-save"
            onClick={handleSubmit}
            disabled={busy}
          >
            {busy ? (
              <>
                <Loader2 size={15} className="spin" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Save All Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
