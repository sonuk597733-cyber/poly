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
import "./PrincipalProfile.css";

export default function PrincipalProfile({ currentUser, onNavigate, showToast }) {
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
              "Institutional Governance",
              "AICTE / NBA Accreditation",
              "Academic Curriculum Strategy",
              "Industry & Corporate MoUs",
              "Campus Infrastructure Development"
            ]
          );
        }
      })
      .catch(() => {
        if (currentUser) {
          setBioInput(currentUser.bio || "");
          setSkillsList(
            currentUser.skills || [
              "Institutional Governance",
              "AICTE / NBA Accreditation",
              "Academic Strategy"
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
      showToast?.("Principal executive statement updated successfully!");
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
      showToast?.(`Added governance competency "${trimmed}"`);
    } catch (err) {
      showToast?.(err.message || "Failed to add competency", true);
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
    <div className="prin-profile-container">
      {/* Profile Header Card */}
      <div className="prin-profile-card">
        <div className="prin-profile-cover">
          <div className="prin-cover-campus-badge">
            <Building2 size={13} />
            <span>Subharti Polytechnic College • Main Campus</span>
          </div>
        </div>
        <div className="prin-profile-header-content">
          <div className="prin-avatar-wrapper">
            {profile?.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={profile.fullName}
                className="prin-avatar-img"
              />
            ) : (
              <div className="prin-avatar-placeholder">
                {(profile?.fullName || "Principal").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="prin-avatar-badge" title="Verified Campus Principal & Director">
              <ShieldCheck size={16} />
            </div>
          </div>

          <div className="prin-title-block">
            <div className="prin-name-row">
              <h2>{profile?.fullName || "Dr. Mahendra Singh"}</h2>
              <span className="prin-role-badge">Principal & Campus Director</span>
            </div>
            <p className="prin-dept-text">
              <Building2 size={15} />
              Office of the Principal • Executive Campus Leadership
            </p>
            <p className="prin-inst-text">
              Swami Vivekanand Subharti University • Polytechnic College
            </p>
          </div>

          <div className="prin-profile-meta-grid">
            <div className="prin-meta-item">
              <Mail size={15} className="prin-meta-icon" />
              <div>
                <span className="prin-meta-label">Executive Mail</span>
                <span className="prin-meta-val">{profile?.email || "principal@subharti.edu"}</span>
              </div>
            </div>

            <div className="prin-meta-item">
              <GraduationCap size={15} className="prin-meta-icon" />
              <div>
                <span className="prin-meta-label">Credentials</span>
                <span className="prin-meta-val">Ph.D. in Mechanical Engineering, M.Tech</span>
              </div>
            </div>

            <div className="prin-meta-item">
              <Award size={15} className="prin-meta-icon" />
              <div>
                <span className="prin-meta-label">Institutional Role</span>
                <span className="prin-meta-val">Chief Executive & Academic Officer</span>
              </div>
            </div>

            <div className="prin-meta-item">
              <CheckCircle2 size={15} className="prin-meta-icon" style={{ color: "#059669" }} />
              <div>
                <span className="prin-meta-label">Statutory Status</span>
                <span className="prin-meta-val" style={{ color: "#059669", fontWeight: 700 }}>
                  BTEUP & AICTE Authorized Signatory
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Body Grid */}
      <div className="prin-profile-body-grid">
        {/* Left Column: Leadership Vision */}
        <div className="prin-section-card">
          <div className="prin-section-header">
            <div>
              <h3>Institutional Vision & Leadership Mandate</h3>
              <p>Directorial philosophy, academic excellence goals, and industry integration strategy.</p>
            </div>
            {!editingBio && (
              <button
                type="button"
                className="prin-icon-btn"
                onClick={() => setEditingBio(true)}
              >
                <Edit2 size={16} />
                <span>Edit</span>
              </button>
            )}
          </div>

          {editingBio ? (
            <div className="prin-edit-statement">
              <textarea
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                placeholder="Enter institutional vision and executive directive..."
                rows={5}
                className="prin-bio-textarea"
              />
              <div className="prin-bio-actions">
                <button
                  type="button"
                  className="prin-btn secondary"
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
                  className="prin-btn primary"
                  onClick={handleSaveBio}
                  disabled={savingBio}
                >
                  <Save size={15} /> {savingBio ? "Saving..." : "Save Vision"}
                </button>
              </div>
            </div>
          ) : (
            <div className="prin-bio-display">
              <p>
                {profile?.bio ||
                  "Dedicated to steering Subharti Polytechnic as a premier diploma engineering institution in Uttar Pradesh. Focused on state-of-the-art laboratory infrastructure, practical skill empowerment, NBA Tier-II outcome-based education, and strong industrial partnerships to achieve 100% placement and academic clearance for every diploma candidate."}
              </p>
            </div>
          )}

          {/* Directorial Highlights */}
          <div className="prin-highlights-grid">
            <div className="prin-highlight-box">
              <Building2 size={18} className="prin-hi-icon" />
              <div>
                <strong>NBA Accreditation Tier-II</strong>
                <p>Leading 5 Engineering streams toward full statutory accreditation.</p>
              </div>
            </div>
            <div className="prin-highlight-box">
              <Briefcase size={18} className="prin-hi-icon" />
              <div>
                <strong>Corporate Placements</strong>
                <p>MoUs signed with Tata Motors, L&T, and Bharat Electronics.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Governance Competencies & Fast Actions */}
        <div className="prin-section-card">
          <div className="prin-section-header">
            <div>
              <h3>Key Governance Competencies</h3>
              <p>Executive leadership and administrative portfolios.</p>
            </div>
          </div>

          <div className="prin-skills-cloud">
            {skillsList.map((skill, idx) => (
              <span key={idx} className="prin-skill-tag">
                <Tag size={12} />
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  disabled={savingSkill}
                  className="prin-tag-del-btn"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddSkill} className="prin-add-skill-form">
            <input
              type="text"
              placeholder="Add competency (e.g. AICTE Approval Process)..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="prin-skill-input"
            />
            <button
              type="submit"
              className="prin-btn primary"
              disabled={!newSkill.trim() || savingSkill}
            >
              <Plus size={15} /> Add
            </button>
          </form>

          {/* Quick Shortcuts */}
          <div className="prin-shortcuts-box">
            <h4>Directorial Navigation</h4>
            <div className="prin-shortcuts-grid">
              <button
                type="button"
                className="prin-shortcut-btn"
                onClick={() => onNavigate?.("department")}
              >
                <Building2 size={14} /> 5-Branch Performance
              </button>
              <button
                type="button"
                className="prin-shortcut-btn"
                onClick={() => onNavigate?.("students")}
              >
                <GraduationCap size={14} /> Polytechnic Candidates
              </button>
              <button
                type="button"
                className="prin-shortcut-btn"
                onClick={() => onNavigate?.("reports")}
              >
                <Award size={14} /> Accreditation Audit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
