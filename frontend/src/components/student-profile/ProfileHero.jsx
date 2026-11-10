import React, { useState, useRef } from "react";
import {
  Camera,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Share2,
  Download,
  Edit3,
  Award,
  Sparkles,
  ShieldCheck,
  Copy,
  Check,
  Printer,
  Mail,
  Phone,
  CreditCard,
  Building2,
  ExternalLink
} from "lucide-react";

export default function ProfileHero({
  user,
  profile,
  completeness = { score: 85, missing: [] },
  onEdit,
  onShare,
  onDownloadId,
  onUploadAvatar,
  onUploadCover
}) {
  const [copiedEnrollment, setCopiedEnrollment] = useState(false);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const fullName = user?.fullName || profile?.fullName || "Student Candidate";
  const branch = profile?.branch || user?.branch || "CSE";
  const semester = profile?.semester || "Semester 5";
  const degree = profile?.degree || "Diploma in Engineering";
  const location = profile?.location || user?.location || "";
  const enrollmentNo =
    (profile?.enrollmentNo && profile.enrollmentNo.trim()) ||
    (user?.enrollmentNo && user.enrollmentNo.trim()) ||
    profile?.rollNo ||
    user?.rollNo ||
    "SUB-2024-0189";
  const tagline = profile?.tagline || "Passionate about technology, engineering, and building modern software.";
  const sgpa = profile?.sgpa !== undefined ? Number(profile.sgpa).toFixed(1) : "8.9";
  const attendance = profile?.attendancePercentage !== undefined ? profile.attendancePercentage : 85;
  const achievementCount = Array.isArray(profile?.achievements) && profile.achievements.length > 0 
    ? profile.achievements.length 
    : 4;
  const avatarUrl = user?.avatarUrl || profile?.avatarUrl;
  const coverUrl = user?.coverUrl || profile?.coverUrl || "/campus-banner.jpg";

  // User initials for avatar fallback
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "ST";

  const handleCopyEnrollment = () => {
    if (enrollmentNo && enrollmentNo !== "N/A" && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(enrollmentNo);
      setCopiedEnrollment(true);
      setTimeout(() => setCopiedEnrollment(false), 2000);
    }
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (file && onUploadAvatar) {
      onUploadAvatar(file);
    }
  };

  const handleCoverFile = (e) => {
    const file = e.target.files?.[0];
    if (file && onUploadCover) {
      onUploadCover(file);
    }
  };

  return (
    <section className="sp2-hero-card" aria-label="Student Profile Hero">
      {/* Hidden file inputs for Avatar & Cover banner */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarFile}
        accept="image/png,image/jpeg,image/webp"
        style={{ display: "none" }}
      />
      <input
        type="file"
        ref={coverInputRef}
        onChange={handleCoverFile}
        accept="image/png,image/jpeg,image/webp"
        style={{ display: "none" }}
      />

      {/* Panoramic Campus Background Cover */}
      <div className="sp2-hero-cover-wrap">
        <img
          src={coverUrl}
          alt="Campus Banner"
          className="sp2-hero-cover-img"
          onError={(e) => {
            e.currentTarget.src = "/campus-banner.jpg";
          }}
        />
        <div className="sp2-hero-cover-overlay" />

        {/* Institution Badge on Top Left */}
        <div className="sp2-hero-campus-badge">
          <Building2 size={14} className="text-blue-400" />
          <span>Swami Vivekanand Subharti University • Subharti Polytechnic</span>
        </div>

        {/* Cover Photo Upload Button on Top Right */}
        <button
          type="button"
          className="sp2-hero-cover-upload-btn"
          onClick={() => coverInputRef.current?.click()}
          title="Update panoramic cover photo"
          aria-label="Update cover photo"
        >
          <Camera size={14} />
          <span>Change Cover</span>
        </button>
      </div>

      {/* Main Profile Info Section */}
      <div className="sp2-hero-body">
        <div className="sp2-hero-content-grid">
          {/* Avatar and Primary Identity */}
          <div className="sp2-hero-left-identity">
            {/* Avatar with Camera Trigger & Ring */}
            <div className="sp2-hero-avatar-shell">
              <div className="sp2-avatar-ring">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="sp2-avatar-img"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.parentElement?.querySelector(".sp2-avatar-initials");
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="sp2-avatar-initials"
                  style={{ display: avatarUrl ? "none" : "flex" }}
                >
                  {initials}
                </div>
              </div>
              <button
                type="button"
                className="sp2-avatar-upload-trigger"
                onClick={() => avatarInputRef.current?.click()}
                title="Upload profile photo"
                aria-label="Upload photo"
              >
                <Camera size={15} />
              </button>
            </div>

            {/* Title, Badges, and Tagline */}
            <div className="sp2-hero-meta-block">
              <div className="sp2-hero-status-row">
                <span className="sp2-verified-badge">
                  <ShieldCheck size={13} />
                  <span>Verified Student</span>
                </span>
                <span className="sp2-branch-badge">
                  <GraduationCap size={13} />
                  <span>{branch} Engineering</span>
                </span>
                <span className="sp2-sem-badge">
                  <span>{semester}</span>
                </span>
                {enrollmentNo && enrollmentNo !== "N/A" && (
                  <button
                    type="button"
                    className="sp2-roll-badge"
                    onClick={handleCopyEnrollment}
                    title="Click to copy Institutional Roll Number"
                  >
                    <span className="roll-label">ROLL NO:</span>
                    <strong className="roll-val font-mono">{enrollmentNo}</strong>
                    {copiedEnrollment ? (
                      <Check size={11} className="text-emerald" />
                    ) : (
                      <Copy size={11} className="opacity-60" />
                    )}
                  </button>
                )}
              </div>

              <h1 className="sp2-student-name">
                <span>{fullName}</span>
                <CheckCircle2 size={22} className="sp2-verified-check-icon" />
              </h1>

              <p className="sp2-student-headline">
                <span className="headline-degree">{degree}</span>
                <span className="headline-sep">•</span>
                <span className="headline-dept">{branch} Department</span>
                <span className="headline-sep">•</span>
                <span className="headline-session">Batch 2024–2027</span>
              </p>

              {/* Tagline / Bio Quote with inline edit trigger */}
              <div className="sp2-student-tagline-wrap" onClick={onEdit} role="button" tabIndex={0} title="Click to edit personal motto">
                <span className="sp2-quote-mark">“</span>
                <span className="sp2-tagline-quote">{tagline}</span>
                <span className="sp2-quote-mark">”</span>
                <Edit3 size={12} className="sp2-tagline-edit-hint" />
              </div>

              {/* Academic Metadata Quick Pills */}
              <div className="sp2-meta-chips-strip">
                {location ? (
                  <span className="sp2-meta-chip">
                    <MapPin size={12} className="text-sky-500" />
                    <span>{location}</span>
                  </span>
                ) : (
                  <button type="button" className="sp2-meta-chip add-hint" onClick={onEdit}>
                    <MapPin size={12} />
                    <span>+ Add Location</span>
                  </button>
                )}

                {user?.email && (
                  <a href={`mailto:${user.email}`} className="sp2-meta-chip link" title="Send email">
                    <Mail size={12} className="text-blue-500" />
                    <span>{user.email}</span>
                  </a>
                )}

                {user?.phone && (
                  <a href={`tel:${user.phone}`} className="sp2-meta-chip link" title="Call student">
                    <Phone size={12} className="text-emerald-500" />
                    <span>{user.phone}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: High-Density Enterprise KPI Cards */}
          <div className="sp2-hero-kpi-rack">
            {/* Card 1: SGPA */}
            <div className="sp2-kpi-box purple">
              <div className="sp2-kpi-top-bar">
                <div className="sp2-kpi-icon-pill">
                  <GraduationCap size={16} />
                </div>
                <span className="sp2-kpi-tag text-purple">Top Tier</span>
              </div>
              <div className="sp2-kpi-bottom-meta">
                <div className="sp2-kpi-val-row">
                  <span className="sp2-kpi-num">{sgpa}</span>
                  <span className="sp2-kpi-scale">/10</span>
                </div>
                <span className="sp2-kpi-lbl">SGPA Score</span>
              </div>
            </div>

            {/* Card 2: Attendance */}
            <div className="sp2-kpi-box emerald">
              <div className="sp2-kpi-top-bar">
                <div className="sp2-kpi-icon-pill">
                  <ShieldCheck size={16} />
                </div>
                <span className="sp2-kpi-tag text-emerald">Eligible</span>
              </div>
              <div className="sp2-kpi-bottom-meta">
                <div className="sp2-kpi-val-row">
                  <span className="sp2-kpi-num">{attendance}</span>
                  <span className="sp2-kpi-unit">%</span>
                </div>
                <span className="sp2-kpi-lbl">Attendance</span>
              </div>
            </div>

            {/* Card 3: Profile Readiness */}
            <div className="sp2-kpi-box blue">
              <div className="sp2-kpi-top-bar">
                <div className="sp2-kpi-icon-pill">
                  <Sparkles size={16} />
                </div>
                <span className="sp2-kpi-tag text-blue">{completeness.score}%</span>
              </div>
              <div className="sp2-kpi-bottom-meta">
                <div className="sp2-kpi-mini-bar" title={`${completeness.score}% completed`}>
                  <div
                    className="sp2-kpi-mini-bar-fill"
                    style={{ width: `${Math.max(12, completeness.score)}%` }}
                  />
                </div>
                <span className="sp2-kpi-lbl">Profile Readiness</span>
              </div>
            </div>

            {/* Card 4: Honors & Awards */}
            <div className="sp2-kpi-box amber">
              <div className="sp2-kpi-top-bar">
                <div className="sp2-kpi-icon-pill">
                  <Award size={16} />
                </div>
                <span className="sp2-kpi-tag text-amber">Verified</span>
              </div>
              <div className="sp2-kpi-bottom-meta">
                <div className="sp2-kpi-val-row">
                  <span className="sp2-kpi-num">{achievementCount}</span>
                  <span className="sp2-kpi-unit">Awards</span>
                </div>
                <span className="sp2-kpi-lbl">Honors & Badges</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="sp2-hero-actions-bar">
          <div className="sp2-primary-action-group">
            <button
              type="button"
              className="sp2-btn-action primary"
              onClick={onEdit}
            >
              <Edit3 size={15} />
              <span>Edit Profile</span>
            </button>

            <button
              type="button"
              className="sp2-btn-action id-card"
              onClick={onDownloadId}
            >
              <CreditCard size={15} />
              <span>Digital Student ID</span>
            </button>

            <button
              type="button"
              className="sp2-btn-action secondary"
              onClick={onShare}
            >
              <Share2 size={15} />
              <span>Share Profile</span>
            </button>

            <button
              type="button"
              className="sp2-btn-action secondary"
              onClick={() => window.print()}
            >
              <Printer size={15} />
              <span>Print Profile</span>
            </button>
          </div>

          {/* Profile Completeness Recommendation Pill */}
          {completeness.missing.length > 0 && (
            <div className="sp2-completeness-hint-pill" onClick={onEdit} role="button" tabIndex={0}>
              <span className="hint-dot" />
              <span>
                Tip: {completeness.missing[0].label} (+{completeness.missing[0].bonus}%)
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
