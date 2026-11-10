import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Building2,
  GraduationCap,
  Award,
  Layers,
  Edit2,
  Save,
  X,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  Tag
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./CoordinatorProfile.css";

export default function CoordinatorProfile({ currentUser, onNavigate, showToast }) {
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
          setSkillsList(
            res.user.skills || [
              "Master Timetable Planning",
              "Classroom & Lab Allocation",
              "Examination Scheduling",
              "AICTE / NBA Compliance",
              "Faculty Workload Balance"
            ]
          );
        }
      })
      .catch(() => {
        if (currentUser) {
          setBioInput(currentUser.bio || "");
          setSkillsList(
            currentUser.skills || [
              "Master Timetable Planning",
              "Classroom & Lab Allocation",
              "Examination Scheduling"
            ]
          );
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
      showToast?.("Academic Coordinator statement updated successfully!");
    } catch (err) {
      showToast?.(err.message || "Failed to update statement", true);
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
      const res = await authApi.updateProfile({ skills: updated });
      if (res?.user) setProfile(res.user);
      setSkillsList(updated);
      setNewSkill("");
      showToast?.(`Added coordination area "${trimmed}"`);
    } catch (err) {
      showToast?.(err.message || "Failed to add coordination area", true);
    } finally {
      setSavingSkill(false);
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const updated = skillsList.filter((s) => s !== skillToRemove);
    setSavingSkill(true);
    try {
      const res = await authApi.updateProfile({ skills: updated });
      if (res?.user) setProfile(res.user);
      setSkillsList(updated);
      showToast?.(`Removed "${skillToRemove}"`);
    } catch (err) {
      showToast?.(err.message || "Failed to remove area", true);
    } finally {
      setSavingSkill(false);
    }
  };

  return (
    <div className="coord-profile-container">
      {/* Profile Header Card */}
      <div className="coord-profile-card">
        <div className="coord-profile-cover" />
        <div className="coord-profile-header-content">
          <div className="coord-avatar-wrapper">
            {profile?.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={profile.fullName}
                className="coord-avatar-img"
              />
            ) : (
              <div className="coord-avatar-placeholder">
                {(profile?.fullName || "Coordinator").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="coord-avatar-badge" title="Verified Academic Coordinator">
              <ShieldCheck size={16} />
            </div>
          </div>

          <div className="coord-title-block">
            <div className="coord-name-row">
              <h2>{profile?.fullName || "Academic Coordinator"}</h2>
              <span className="coord-role-badge">Academic Coordinator</span>
            </div>
            <p className="coord-dept-text">
              <Building2 size={15} />
              Central Academic Planning & Coordination Cell
            </p>
            <p className="coord-inst-text">
              Swami Vivekanand Subharti University • Polytechnic Campus
            </p>
          </div>

          <div className="coord-profile-meta-grid">
            <div className="coord-meta-item">
              <Mail size={15} className="coord-meta-icon" />
              <div>
                <span className="coord-meta-label">Institutional Email</span>
                <span className="coord-meta-val">{profile?.email || "coordinator@subharti.edu"}</span>
              </div>
            </div>

            <div className="coord-meta-item">
              <GraduationCap size={15} className="coord-meta-icon" />
              <div>
                <span className="coord-meta-label">Employee ID</span>
                <span className="coord-meta-val mono">
                  {profile?.employeeId || profile?.profile?.employeeId || "COORD-2024-001"}
                </span>
              </div>
            </div>

            <div className="coord-meta-item">
              <Award size={15} className="coord-meta-icon" />
              <div>
                <span className="coord-meta-label">Academic Scope</span>
                <span className="coord-meta-val">Polytechnic 5-Branch Central Coordination</span>
              </div>
            </div>

            <div className="coord-meta-item">
              <CheckCircle2 size={15} className="coord-meta-icon" style={{ color: "#059669" }} />
              <div>
                <span className="coord-meta-label">Account Verification</span>
                <span className="coord-meta-val" style={{ color: "#059669", fontWeight: 700 }}>
                  Active & Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Two Column Body */}
      <div className="coord-profile-body-grid">
        {/* Left Column: Academic Vision & Coordination Statement */}
        <div className="coord-section-card">
          <div className="coord-section-header">
            <div>
              <h3>Academic Coordination Mandate</h3>
              <p>Institutional coordination goals, schedule adherence, and instructional quality oversight.</p>
            </div>
            {!editingBio && (
              <button
                type="button"
                className="coord-icon-btn"
                onClick={() => setEditingBio(true)}
                title="Edit Mandate"
              >
                <Edit2 size={16} />
                <span>Edit</span>
              </button>
            )}
          </div>

          {editingBio ? (
            <div className="coord-edit-statement">
              <textarea
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                placeholder="Enter coordination mandate and academic oversight vision..."
                rows={5}
                className="coord-bio-textarea"
              />
              <div className="coord-bio-actions">
                <button
                  type="button"
                  className="coord-btn secondary"
                  onClick={() => {
                    setBioInput(profile?.bio || "");
                    setEditingBio(false);
                  }}
                  disabled={savingBio}
                >
                  <X size={15} /> Cancel
                </button>
                <button
                  type="button"
                  className="coord-btn primary"
                  onClick={handleSaveBio}
                  disabled={savingBio}
                >
                  <Save size={15} /> {savingBio ? "Saving..." : "Save Mandate"}
                </button>
              </div>
            </div>
          ) : (
            <div className="coord-bio-display">
              <p>
                {profile?.bio ||
                  "Committed to synchronizing academic schedules, optimizing laboratory and smart classroom allocations, ensuring timely conduct of semester and continuous assessments, and maintaining seamless faculty-student coordination across all 5 engineering streams at Subharti Polytechnic."}
              </p>
            </div>
          )}

          {/* Coordination Portfolio Highlights */}
          <div className="coord-highlights-grid">
            <div className="coord-highlight-box">
              <Layers size={18} className="coord-hi-icon" />
              <div>
                <strong>Master Timetables</strong>
                <p>Synchronized scheduling for 18 Polytechnic sections with zero conflicts.</p>
              </div>
            </div>
            <div className="coord-highlight-box">
              <Briefcase size={18} className="coord-hi-icon" />
              <div>
                <strong>Infrastructure Management</strong>
                <p>12 Lecture Theaters & 8 Specialized Labs allocated dynamically.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Key Coordination Competencies & Fast Actions */}
        <div className="coord-section-card">
          <div className="coord-section-header">
            <div>
              <h3>Key Coordination Competencies</h3>
              <p>Operational domains and specialized administrative focus areas.</p>
            </div>
          </div>

          <div className="coord-skills-cloud">
            {skillsList.map((skill, idx) => (
              <span key={idx} className="coord-skill-tag">
                <Tag size={12} />
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  disabled={savingSkill}
                  className="coord-tag-del-btn"
                  title="Remove"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddSkill} className="coord-add-skill-form">
            <input
              type="text"
              placeholder="Add domain (e.g. NBA Tier-II Documentation)..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="coord-skill-input"
            />
            <button
              type="submit"
              className="coord-btn primary"
              disabled={!newSkill.trim() || savingSkill}
            >
              <Plus size={15} /> Add Area
            </button>
          </form>

          {/* Quick Shortcuts */}
          <div className="coord-shortcuts-box">
            <h4>Quick Administrative Access</h4>
            <div className="coord-shortcuts-grid">
              <button
                type="button"
                className="coord-shortcut-btn"
                onClick={() => onNavigate?.("timetable")}
              >
                <Layers size={14} /> Master Timetable
              </button>
              <button
                type="button"
                className="coord-shortcut-btn"
                onClick={() => onNavigate?.("rooms")}
              >
                <Building2 size={14} /> Room Allocations
              </button>
              <button
                type="button"
                className="coord-shortcut-btn"
                onClick={() => onNavigate?.("students")}
              >
                <GraduationCap size={14} /> Polytechnic Roster
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
