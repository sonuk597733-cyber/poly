import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Building2,
  GraduationCap,
  Award,
  BookOpen,
  Edit2,
  Save,
  X,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  Tag,
  Phone,
  FileCheck
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./TeacherTheme.css";
import "./TeacherProfile.css";

export default function TeacherProfile({ currentUser, onNavigate, showToast }) {
  const [profile, setProfile] = useState(currentUser || null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [skillsList, setSkillsList] = useState([]);
  const [savingSkill, setSavingSkill] = useState(false);

  useEffect(() => {
    let ignore = false;
    authApi
      .getProfile()
      .then((res) => {
        if (!ignore && res?.user) {
          setProfile(res.user);
          setBioInput(res.user.bio || "");
          setSkillsList(Array.isArray(res.user.skills) ? res.user.skills : []);
        }
      })
      .catch(() => {
        if (currentUser) {
          setBioInput(currentUser.bio || "");
          setSkillsList(Array.isArray(currentUser.skills) ? currentUser.skills : []);
        }
      });
    return () => {
      ignore = true;
    };
  }, [currentUser]);

  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      const res = await authApi.updateProfile({ bio: bioInput.trim() });
      if (res?.user) setProfile(res.user);
      setEditingBio(false);
      showToast?.("Faculty profile bio updated successfully!");
    } catch (err) {
      showToast?.(err.message || "Failed to update bio", true);
    } finally {
      setSavingBio(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (!trimmed || skillsList.includes(trimmed)) return;

    const updated = [...skillsList, trimmed];
    setSavingSkill(true);
    try {
      await authApi.updateProfile({ skills: updated });
      setSkillsList(updated);
      setNewSkill("");
      showToast?.(`Specialization area "${trimmed}" saved!`);
    } catch (err) {
      showToast?.(err.message || "Failed to add specialization", true);
    } finally {
      setSavingSkill(false);
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const updated = skillsList.filter((s) => s !== skillToRemove);
    try {
      await authApi.updateProfile({ skills: updated });
      setSkillsList(updated);
      showToast?.("Specialization removed.");
    } catch (err) {
      showToast?.(err.message || "Failed to remove item", true);
    }
  };

  const userInitial = profile?.fullName ? profile.fullName.trim().charAt(0).toUpperCase() : "F";

  return (
    <div className="teacher-role-view teacher-profile-container">
      {/* Profile Header Hero Card */}
      <div className="tch-card teacher-profile-hero">
        <div className="teacher-cover-banner">
          {profile?.coverUrl && (
            <img src={profile.coverUrl} alt="Cover" className="teacher-cover-img" />
          )}
          <div className="teacher-cover-overlay">
            <span className="tch-pill blue">
              <ShieldCheck size={14} /> Subharti Faculty Identity
            </span>
          </div>
        </div>

        <div className="teacher-profile-header-body">
          <div className="teacher-avatar-wrap">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.fullName} className="teacher-avatar-img" />
            ) : (
              <div className="teacher-avatar-fallback">{userInitial}</div>
            )}
          </div>

          <div className="teacher-header-content">
            <div className="teacher-name-group">
              <div className="teacher-name-title-row">
                <h2>{profile?.fullName || "Faculty Member"}</h2>
                <CheckCircle2 size={20} color="var(--tch-primary)" />
              </div>

              <p className="teacher-headline">
                {profile?.designation || "Lecturer"} • Department of {profile?.department || "Polytechnic Engineering"}
              </p>

              <div className="teacher-quick-meta">
                <span className="tch-pill blue">
                  <Briefcase size={13} /> ID: {profile?.employeeId || "FAC-SUBHARTI"}
                </span>
                <span className="tch-pill cyan">
                  <Building2 size={13} /> {profile?.department || "Academic"} Division
                </span>
                {profile?.email && (
                  <span className="tch-pill emerald">
                    <Mail size={13} /> {profile.email}
                  </span>
                )}
                {profile?.phone && (
                  <span className="tch-pill amber">
                    <Phone size={13} /> {profile.phone}
                  </span>
                )}
              </div>
            </div>

            <div className="teacher-status-card">
              <span className="tch-pill emerald">
                <FileCheck size={13} /> Active & Verified Faculty
              </span>
              <p>Approved institutional educator authorized for classroom instruction, assessment scoring, and syllabus mentoring.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Content Grid */}
      <div className="teacher-profile-grid">
        <div className="teacher-profile-main-col">
          {/* Bio / Teaching Statement */}
          <div className="tch-card">
            <div className="tch-pane-header" style={{ marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", display: "flex", alignItems: "center", gap: 8, color: "var(--tch-text-primary)" }}>
                  <BookOpen size={18} color="var(--tch-primary)" /> Teaching Statement & Bio
                </h3>
              </div>
              {!editingBio ? (
                <button
                  type="button"
                  className="tch-btn-secondary"
                  style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                  onClick={() => setEditingBio(true)}
                >
                  <Edit2 size={13} /> Edit Statement
                </button>
              ) : (
                <button
                  type="button"
                  className="tch-btn-secondary"
                  style={{ padding: "6px 14px", fontSize: "0.82rem" }}
                  onClick={() => setEditingBio(false)}
                >
                  <X size={13} /> Cancel
                </button>
              )}
            </div>

            {!editingBio ? (
              profile?.bio ? (
                <p className="teacher-bio-text">{profile.bio}</p>
              ) : (
                <div className="tch-empty-box" style={{ padding: "36px 16px" }}>
                  <BookOpen size={32} style={{ opacity: 0.6 }} />
                  <h3>No Teaching Statement Added</h3>
                  <p>Click "Edit Statement" above to describe your pedagogy, research focus, and coursework areas.</p>
                </div>
              )
            ) : (
              <div className="teacher-bio-edit-area">
                <textarea
                  rows={4}
                  className="tch-textarea"
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  placeholder="Share your teaching statement, syllabus delivery methods, and research specialization..."
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                  <button
                    type="button"
                    className="tch-btn-primary"
                    onClick={handleSaveBio}
                    disabled={savingBio}
                  >
                    <Save size={15} />
                    <span>{savingBio ? "Saving..." : "Save Statement"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Specializations & Courses Taught */}
          <div className="tch-card" style={{ marginTop: 20 }}>
            <div className="tch-pane-header" style={{ marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", display: "flex", alignItems: "center", gap: 8, color: "var(--tch-text-primary)" }}>
                  <Tag size={18} color="var(--tch-primary)" /> Core Subjects & Specializations
                </h3>
              </div>
            </div>

            <div className="teacher-skills-cloud">
              {skillsList.length === 0 ? (
                <p style={{ color: "var(--tch-text-muted)", fontSize: "0.88rem", fontStyle: "italic", margin: 0 }}>
                  No subject areas listed yet. Add your courses below.
                </p>
              ) : (
                skillsList.map((skill, idx) => (
                  <span key={idx} className="teacher-skill-chip">
                    <span>{skill}</span>
                    <button
                      type="button"
                      className="teacher-skill-remove"
                      onClick={() => handleRemoveSkill(skill)}
                      title="Remove item"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>

            <form onSubmit={handleAddSkill} className="teacher-skill-add-row" style={{ marginTop: 16 }}>
              <input
                type="text"
                className="tch-input"
                placeholder="Add subject (e.g. Operating Systems, Computer Architecture, Embedded C)..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                style={{ flex: 1 }}
              />
              <button
                type="submit"
                className="tch-btn-primary"
                disabled={savingSkill || !newSkill.trim()}
              >
                <Plus size={15} />
                <span>Add</span>
              </button>
            </form>
          </div>
        </div>

        <div className="teacher-profile-side-col">
          {/* Institutional Credentials */}
          <div className="tch-card">
            <div className="tch-pane-header" style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", display: "flex", alignItems: "center", gap: 8, color: "var(--tch-text-primary)" }}>
                <Award size={18} color="var(--tch-primary)" /> Faculty Credentials
              </h3>
            </div>

            <div className="teacher-info-list">
              <div className="teacher-info-row">
                <span className="teacher-info-label">Academic Department</span>
                <span className="teacher-info-val">{profile?.department || "CSE"} Engineering</span>
              </div>
              <div className="teacher-info-row">
                <span className="teacher-info-label">Designation</span>
                <span className="teacher-info-val">{profile?.designation || "Lecturer / Assistant Professor"}</span>
              </div>
              <div className="teacher-info-row">
                <span className="teacher-info-label">Institutional Status</span>
                <span className="teacher-info-val" style={{ color: "var(--tch-emerald)" }}>
                  Verified Faculty
                </span>
              </div>
              <div className="teacher-info-row">
                <span className="teacher-info-label">Faculty Roster</span>
                <span className="teacher-info-val">Active Voting Council</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
