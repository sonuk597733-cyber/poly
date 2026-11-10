import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, AlertCircle, Award, BookOpen, Briefcase, Building2, CalendarClock, Check, CheckCircle2,
  ChevronRight, ClipboardList, FileBadge, FileText, GraduationCap, ImagePlus, KeyRound,
  Mail, MapPin, Phone, Save, ShieldCheck, Sparkles, UserRound, X
} from "lucide-react";
import { authApi } from "../../services/authApi";
import { ThemeContext } from "../../context/ThemeContext";
import "./HODTheme.css";
import "./Profile.css";

const NOTIFICATION_OPTIONS = [
  ["facultyLeaveAlerts", "Faculty leave requests", "Updates when staff submit leave requests."],
  ["examSubmissionAlerts", "Exam submissions", "Updates when department marks are submitted."],
  ["nbaComplianceAlerts", "Accreditation updates", "Reminders related to NBA compliance."],
  ["lowAttendanceAlerts", "Low attendance", "Alerts for department attendance concerns."],
  ["academicRiskAlerts", "Academic risk", "Updates about students flagged for academic support."],
  ["emailDigest", "Email digest", "Receive a periodic summary by email."]
];

const DEFAULT_NOTIFICATIONS = {
  facultyLeaveAlerts: true,
  examSubmissionAlerts: true,
  nbaComplianceAlerts: true,
  lowAttendanceAlerts: true,
  academicRiskAlerts: true,
  emailDigest: false
};

const PROFILE_TABS = [
  ["overview", Activity, "Overview"],
  ["personal", UserRound, "Personal details"],
  ["professional", Briefcase, "Professional"],
  ["achievements", Award, "Achievements"],
  ["documents", FileBadge, "Documents"],
  ["security", ShieldCheck, "Security"],
  ["preferences", Sparkles, "Preferences"]
];

function initialsFor(name) {
  return (name || "HOD").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function formatDate(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function EmptyState({ icon: Icon = FileText, children }) {
  return <div className="hod-profile-empty-state"><span><Icon size={19}/></span><p>{children}</p></div>;
}

function ProfileCard({ icon: Icon, eyebrow, title, action, className = "", children }) {
  return (
    <section className={`hod-card hod-profile-card ${className}`}>
      <header className="hod-profile-card-heading">
        <div className="hod-profile-card-heading-main">
          <span className="hod-profile-card-icon"><Icon size={17}/></span>
          <div><span className="hod-profile-eyebrow">{eyebrow}</span><h2>{title}</h2></div>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function ProfileSkeleton() {
  return (
    <main className="hod-role-view hod-profile-page" aria-busy="true" aria-live="polite">
      <span className="hod-profile-sr-only">Loading HOD profile…</span>
      <div className="hod-profile-skeleton-hero"/>
      <div className="hod-profile-skeleton-grid"><div/><div/><div/></div>
    </main>
  );
}

export default function HODProfile({ currentUser, onNavigate, showToast }) {
  const themeContext = useContext(ThemeContext);
  const [userData, setUserData] = useState(currentUser || {});
  const [roleProfile, setRoleProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [feedback, setFeedback] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const photoInput = useRef(null);
  const tabRefs = useRef({});
  const editorRef = useRef(null);
  const editorTitleRef = useRef(null);
  const [form, setForm] = useState({ fullName: "", phone: "", headline: "", location: "", bio: "", leadershipDetails: "" });
  const [preferences, setPreferences] = useState({ theme: "system", reducedMotion: false, notifications: DEFAULT_NOTIFICATIONS });
  const [savingPreferences, setSavingPreferences] = useState(false);

  const notify = useCallback((message, isError = false) => {
    setFeedback({ message, isError });
    showToast?.(message, isError);
  }, [showToast]);

  const hydrate = useCallback((user, profile) => {
    const safeUser = user || currentUser || {};
    const safeRoleProfile = profile || {};
    setUserData(safeUser);
    setRoleProfile(safeRoleProfile);
    setForm({
      fullName: safeUser.fullName || "",
      phone: safeUser.phone || "",
      headline: safeUser.headline || "",
      location: safeUser.location || "",
      bio: safeUser.bio || safeRoleProfile.bio || "",
      leadershipDetails: safeRoleProfile.leadershipDetails || ""
    });
    const savedPreferences = safeUser.preferences || {};
    setPreferences({
      theme: savedPreferences.theme || themeContext?.rawTheme || "system",
      reducedMotion: savedPreferences.reducedMotion ?? false,
      notifications: { ...DEFAULT_NOTIFICATIONS, ...(savedPreferences.notifications || {}) }
    });
  }, [currentUser, themeContext?.rawTheme]);

  useEffect(() => {
    let mounted = true;
    authApi.getProfile()
      .then((result) => {
        if (!mounted) return;
        hydrate(result?.user, result?.profile);
      })
      .catch((error) => {
        if (!mounted) return;
        console.error("Failed to load HOD profile:", error);
        hydrate(currentUser, null);
        setLoadError(error?.message || "Could not load the latest profile details.");
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [currentUser, hydrate, reloadKey]);

  const profile = useMemo(() => ({ ...userData, ...roleProfile }), [userData, roleProfile]);
  const department = roleProfile.department || userData.department || "";
  const approvalStatus = roleProfile.approvalStatus || "";
  const statusLabel = approvalStatus.replaceAll("_", " ") || userData.status || (userData.isEmailVerified ? "Email verified" : "Status unavailable");
  const statusIsPositive = ["approved", "active", "verified", "email verified"].includes(statusLabel.toLowerCase());
  const completeness = useMemo(() => {
    const values = [profile.fullName, profile.email, department, profile.phone, profile.avatarUrl, profile.bio || profile.leadershipDetails];
    return Math.round(values.filter(Boolean).length / values.length * 100);
  }, [department, profile]);
  const initials = initialsFor(profile.fullName);
  const preferenceDirty = preferences.theme !== (userData.preferences?.theme || themeContext?.rawTheme || "system")
    || preferences.reducedMotion !== (userData.preferences?.reducedMotion ?? false)
    || NOTIFICATION_OPTIONS.some(([key]) => preferences.notifications[key] !== (userData.preferences?.notifications?.[key] ?? DEFAULT_NOTIFICATIONS[key]));

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const handleTabKey = (event, index) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % PROFILE_TABS.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + PROFILE_TABS.length) % PROFILE_TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = PROFILE_TABS.length - 1;
    else return;
    event.preventDefault();
    const nextTab = PROFILE_TABS[next][0];
    setActiveTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };
  const cancelEditing = useCallback(() => {
    setForm({
      fullName: userData.fullName || "",
      phone: userData.phone || "",
      headline: userData.headline || "",
      location: userData.location || "",
      bio: userData.bio || roleProfile.bio || "",
      leadershipDetails: roleProfile.leadershipDetails || ""
    });
    setEditing(false);
  }, [roleProfile, userData]);

  useEffect(() => {
    if (!editing) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() => editorTitleRef.current?.focus());
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        cancelEditing();
      } else if (event.key === "Tab" && editorRef.current) {
        const elements = [...editorRef.current.querySelectorAll("button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])")];
        if (!elements.length) return;
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [editing, cancelEditing]);
  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (saving) return;
    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      headline: form.headline.trim(),
      location: form.location.trim(),
      bio: form.bio.trim(),
      leadershipDetails: form.leadershipDetails.trim()
    };
    if (payload.fullName.length < 2) {
      notify("Enter a name with at least 2 characters.", true);
      return;
    }
    if (payload.phone && !/^[0-9+\-\s()]{7,25}$/.test(payload.phone)) {
      notify("Enter a valid phone number.", true);
      return;
    }
    setSaving(true);
    try {
      const result = await authApi.updateProfile(payload);
      setUserData(result?.user || { ...userData, ...payload });
      setRoleProfile(result?.profile || { ...roleProfile, bio: payload.bio, leadershipDetails: payload.leadershipDetails });
      setEditing(false);
      notify("Profile changes saved.");
    } catch (error) {
      notify(error?.message || "Could not save profile changes.", true);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024) {
      notify("Choose a JPG, PNG or WebP image up to 2 MB.", true);
      return;
    }
    setUploadingPhoto(true);
    try {
      const result = await authApi.uploadAvatar(file);
      setUserData((current) => ({ ...current, avatarUrl: result.avatarUrl || current.avatarUrl }));
      setAvatarFailed(false);
      notify("Profile photo updated.");
    } catch (error) {
      notify(error?.message || "Could not upload the profile photo.", true);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSavePreferences = async (event) => {
    event.preventDefault();
    if (savingPreferences || !preferenceDirty) return;
    setSavingPreferences(true);
    try {
      const nextPrefs = {
        ...userData.preferences,
        theme: preferences.theme,
        reducedMotion: preferences.reducedMotion,
        notifications: { ...userData.preferences?.notifications, ...preferences.notifications }
      };
      const result = await authApi.updateProfile({ preferences: nextPrefs });
      setUserData(result?.user || { ...userData, preferences: nextPrefs });
      themeContext?.setTheme?.(preferences.theme);
      notify("Profile preferences saved.");
    } catch (error) {
      notify(error?.message || "Could not save preferences.", true);
    } finally {
      setSavingPreferences(false);
    }
  };

  const openSettings = () => {
    if (onNavigate) onNavigate("dashboard", "settings");
    else window.location.hash = "#/dashboard/settings";
  };
  const editAction = <button className="hod-profile-button-secondary" type="button" onClick={() => { if (editing) cancelEditing(); else { setEditing(true); setActiveTab("personal"); } }}>{editing ? <X size={15}/> : <UserRound size={15}/>}<span>{editing ? "Cancel edit" : "Edit details"}</span></button>;
  const professionalEditAction = <button className="hod-profile-button-secondary" type="button" onClick={() => { if (editing) cancelEditing(); else { setEditing(true); setActiveTab("professional"); } }}>{editing ? <X size={15}/> : <Briefcase size={15}/>}<span>{editing ? "Cancel edit" : "Edit details"}</span></button>;
  const unavailable = "No information is available for this account in the current profile service.";
  const recordList = (records) => Array.isArray(records) && records.length > 0;
  const showOverview = activeTab === "overview";
  const showPersonal = showOverview || activeTab === "personal";
  const showProfessional = showOverview || activeTab === "professional";
  const showAchievements = showOverview || activeTab === "achievements";
  const showDocuments = showOverview || activeTab === "documents";

  if (loading) return <ProfileSkeleton/>;

  return (
    <main className="hod-role-view hod-profile-page" data-reduced-motion={preferences.reducedMotion ? "true" : "false"}>
      <div className="hod-profile-breadcrumb"><span>Workspace</span><ChevronRight size={13}/><span>Account</span><ChevronRight size={13}/><strong>HOD profile</strong></div>
      {loadError && <div className="hod-profile-alert" role="alert"><AlertCircle size={18}/><div><strong>Using available session details</strong><span>{loadError}</span></div><button className="hod-profile-button-secondary" type="button" onClick={() => { setLoadError(""); setLoading(true); setReloadKey((value) => value + 1); }}>Retry</button></div>}
      {feedback && <div className={`hod-profile-feedback ${feedback.isError ? "error" : "success"}`} role={feedback.isError ? "alert" : "status"}><span>{feedback.isError ? <AlertCircle size={16}/> : <CheckCircle2 size={16}/>}</span>{feedback.message}<button type="button" onClick={() => setFeedback(null)} aria-label="Dismiss message"><X size={14}/></button></div>}

      <header className="hod-profile-hero">
        <div className="hod-profile-cover" aria-hidden="true">{profile.coverUrl && <img src={profile.coverUrl} alt=""/>}<div className="hod-profile-cover-glow"/></div>
        <div className="hod-profile-hero-content">
          <div className="hod-profile-identity">
            <div className="hod-profile-avatar-wrap">
              {profile.avatarUrl && !avatarFailed ? <img src={profile.avatarUrl} alt={`${profile.fullName || "HOD"} profile`} className="hod-profile-avatar" onError={() => setAvatarFailed(true)}/> : <span className="hod-profile-avatar-fallback" aria-hidden="true">{initials}</span>}
              <button type="button" className="hod-profile-photo-button" onClick={() => photoInput.current?.click()} disabled={uploadingPhoto} aria-label="Update profile photo">{uploadingPhoto ? <span className="hod-profile-spinner"/> : <ImagePlus size={15}/>}</button>
              <input ref={photoInput} className="hod-profile-sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} aria-label="Choose a profile photo"/>
            </div>
            <div className="hod-profile-name-block">
              <span className="hod-profile-kicker"><Sparkles size={13}/> CollegeOS · Executive profile</span>
              <h1>{profile.fullName || "HOD profile"}</h1>
              <p>{profile.designation || "Head of Department"}{department ? ` · Department of ${department}` : ""}</p>
              <div className="hod-profile-hero-meta">
                {department && <span><Building2 size={14}/>{department}</span>}
                {roleProfile.employeeId && <span><Briefcase size={14}/>ID · {roleProfile.employeeId}</span>}
                {profile.email && <span><Mail size={14}/>{profile.email}</span>}
                {statusLabel && <span className={`hod-profile-status ${statusIsPositive ? "approved" : "pending"}`}><i/>{statusLabel.replaceAll("_", " ")}</span>}
              </div>
            </div>
          </div>
          <div className="hod-profile-hero-side">
            <div className="hod-profile-completeness"><span className="hod-profile-completeness-ring" style={{ "--completion": `${completeness}%` }}><strong>{completeness}%</strong></span><span><b>Profile completeness</b><small>Based on available profile fields</small></span></div>
            <button className="hod-profile-button-primary" type="button" onClick={() => { setEditing(true); setActiveTab("personal"); }}><UserRound size={15}/>Edit profile</button>
          </div>
        </div>
      </header>

      <nav className="hod-profile-tabs" role="tablist" aria-label="Profile areas">
        {PROFILE_TABS.map(([id, Icon, label], index) => <button type="button" role="tab" ref={(element) => { tabRefs.current[id] = element; }} aria-selected={activeTab === id} id={`hod-profile-tab-${id}`} tabIndex={activeTab === id ? 0 : -1} className={`hod-profile-tab ${activeTab === id ? "active" : ""}`} key={id} onClick={() => setActiveTab(id)} onKeyDown={(event) => handleTabKey(event, index)}><Icon size={16}/><span>{label}</span></button>)}
      </nav>

      {(showOverview || showPersonal || showProfessional || showAchievements || showDocuments) && <div className={`hod-profile-panel hod-profile-grid hod-profile-grid-${activeTab}`} role="tabpanel" id={`hod-profile-panel-${activeTab}`} aria-labelledby={`hod-profile-tab-${activeTab}`}>
        {showPersonal && <><ProfileCard icon={UserRound} eyebrow="PERSONAL INFORMATION" title="Personal details" className="hod-profile-card-personal" action={editAction}>
          <dl className="hod-profile-detail-list">
            <div><dt><UserRound size={15}/>Full name</dt><dd>{profile.fullName || "Not available"}</dd></div>
            <div><dt><Mail size={15}/>Email</dt><dd>{profile.email || "Not available"}</dd></div>
            <div><dt><CalendarClock size={15}/>Member since</dt><dd>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "Not recorded"}</dd></div>
          </dl>
        </ProfileCard>

        <ProfileCard icon={Phone} eyebrow="DIRECT CONTACT" title="Contact information" className="hod-profile-card-contact">
          <dl className="hod-profile-detail-list"><div><dt><Mail size={15}/>Official email</dt><dd>{profile.email || "Not available"}</dd></div><div><dt><Phone size={15}/>Phone</dt><dd>{profile.phone || "Not added"}</dd></div><div><dt><MapPin size={15}/>Location</dt><dd>{profile.location || "Not added"}</dd></div></dl>
        </ProfileCard>

        <ProfileCard icon={ShieldCheck} eyebrow="PRIVATE CONTACT" title="Emergency contact" className="hod-profile-card-emergency">
          {profile.emergencyContact?.name || profile.emergencyContact?.phone ? <dl className="hod-profile-detail-list"><div><dt>Contact name</dt><dd>{profile.emergencyContact.name || "Not recorded"}</dd></div><div><dt>Phone</dt><dd>{profile.emergencyContact.phone || "Not recorded"}</dd></div><div><dt>Relationship</dt><dd>{profile.emergencyContact.relationship || "Not recorded"}</dd></div></dl> : <EmptyState icon={Phone}>Emergency contact details are not part of the current HOD profile record.</EmptyState>}
        </ProfileCard></>}

        {showProfessional && <><ProfileCard icon={Building2} eyebrow="APPOINTMENT" title="Department information" className="hod-profile-card-department">
          <dl className="hod-profile-detail-list">
            <div><dt><Building2 size={15}/>Department</dt><dd>{department || "Not recorded"}</dd></div>
            <div><dt><Briefcase size={15}/>Employee ID</dt><dd>{roleProfile.employeeId || "Not recorded"}</dd></div>
            <div><dt><ShieldCheck size={15}/>{approvalStatus ? "Appointment status" : "Account status"}</dt><dd>{approvalStatus ? approvalStatus.replaceAll("_", " ") : profile.status || "Not recorded"}</dd></div>
            <div><dt><UserRound size={15}/>Position</dt><dd>Head of Department</dd></div>
          </dl>
        </ProfileCard>

        <ProfileCard icon={ClipboardList} eyebrow="PROFESSIONAL" title="Professional profile" className="hod-profile-card-professional" action={professionalEditAction}>
          <div className="hod-profile-prose-stack">
            <div><h3>Headline</h3><p>{profile.headline || "Not added"}</p></div>
            <div><h3>Biography</h3><p>{profile.bio || "No professional biography has been added."}</p></div>
            <div><h3>Leadership details</h3><p>{roleProfile.leadershipDetails || "No leadership details have been added."}</p></div>
          </div>
        </ProfileCard>

        <ProfileCard icon={GraduationCap} eyebrow="ACADEMIC BACKGROUND" title="Academic qualifications" className="hod-profile-card-qualifications">
          {recordList(roleProfile.education || profile.education) ? <div className="hod-profile-record-list">{(roleProfile.education || profile.education).map((item, index) => <div className="hod-profile-record" key={`${item.title || "qualification"}-${index}`}><span className="hod-profile-record-icon"><GraduationCap size={16}/></span><span><strong>{item.title}</strong><small>{[item.issuer, item.year].filter(Boolean).join(" · ")}</small>{item.description && <small>{item.description}</small>}</span></div>)}</div> : <EmptyState icon={GraduationCap}>{unavailable}</EmptyState>}
        </ProfileCard>

        <ProfileCard icon={Briefcase} eyebrow="CAREER" title="Experience" className="hod-profile-card-experience">
          {recordList(profile.experience) ? <div className="hod-profile-record-list">{profile.experience.map((item, index) => <div className="hod-profile-record" key={`${item.title || "experience"}-${index}`}><span className="hod-profile-record-icon violet"><Briefcase size={16}/></span><span><strong>{item.title || "Role"}</strong><small>{[item.issuer || item.organization, item.year || item.period].filter(Boolean).join(" · ")}</small>{item.description && <small>{item.description}</small>}</span></div>)}</div> : <EmptyState icon={Briefcase}>{unavailable}</EmptyState>}
        </ProfileCard>

        <ProfileCard icon={BookOpen} eyebrow="ACADEMIC INTERESTS" title="Research interests" className="hod-profile-card-research">
          {Array.isArray(profile.researchInterests) && profile.researchInterests.length ? <ul className="hod-profile-interest-list">{profile.researchInterests.map((interest, index) => <li key={`${interest}-${index}`}>{typeof interest === "string" ? interest : interest.title}</li>)}</ul> : <EmptyState icon={BookOpen}>{unavailable}</EmptyState>}
        </ProfileCard></>}

        {showAchievements && <ProfileCard icon={Award} eyebrow="RECOGNITION" title="Achievements & certifications" className="hod-profile-card-achievements">
          {recordList(roleProfile.achievements || profile.achievements || profile.certifications) ? <div className="hod-profile-record-list">{(roleProfile.achievements || profile.achievements || profile.certifications).map((item, index) => <div className="hod-profile-record" key={`${item.title || "recognition"}-${index}`}><span className="hod-profile-record-icon violet"><Award size={16}/></span><span><strong>{item.title}</strong><small>{[item.issuer, item.year].filter(Boolean).join(" · ")}</small>{item.description && <small>{item.description}</small>}</span></div>)}</div> : <EmptyState icon={Award}>{unavailable}</EmptyState>}
        </ProfileCard>}

        {showDocuments && <ProfileCard icon={FileBadge} eyebrow="VERIFICATION" title="Documents & verification" className="hod-profile-card-documents">
          {recordList(roleProfile.documents || profile.documents) ? <div className="hod-profile-record-list">{(roleProfile.documents || profile.documents).map((item, index) => <div className="hod-profile-record" key={`${item.title || "document"}-${index}`}><span className="hod-profile-record-icon"><FileText size={16}/></span><span><strong>{item.title || "Document"}</strong><small>{item.status || "Verification status unavailable"}</small></span>{item.url && <a className="hod-profile-download-link" href={item.url} target="_blank" rel="noreferrer" download>Open</a>}</div>)}</div> : <EmptyState icon={FileBadge}>Document upload and verification are not available through the current HOD profile service.</EmptyState>}
        </ProfileCard>}
      </div>}

      {activeTab === "preferences" && <div className="hod-profile-panel hod-profile-preferences-grid" role="tabpanel" id="hod-profile-panel-preferences" aria-labelledby="hod-profile-tab-preferences">
        <ProfileCard icon={Activity} eyebrow="COMMUNICATION" title="Notification preferences" className="hod-profile-card-notifications">
          <form onSubmit={handleSavePreferences}>
            <div className="hod-profile-toggle-list">{NOTIFICATION_OPTIONS.map(([key, label, description]) => <label className="hod-profile-toggle-row" key={key}><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={Boolean(preferences.notifications[key])} onChange={(event) => setPreferences((current) => ({ ...current, notifications: { ...current.notifications, [key]: event.target.checked } }))}/><i aria-hidden="true"/></label>)}</div>
            <div className="hod-profile-form-actions"><span>Preferences are saved to your account.</span><button className="hod-profile-button-primary" type="submit" disabled={!preferenceDirty || savingPreferences}>{savingPreferences ? <span className="hod-profile-spinner"/> : <Save size={15}/>} {savingPreferences ? "Saving…" : "Save preferences"}</button></div>
          </form>
        </ProfileCard>
        <ProfileCard icon={Sparkles} eyebrow="DISPLAY" title="Theme & accessibility" className="hod-profile-card-display">
          <form onSubmit={handleSavePreferences}>
            <fieldset className="hod-profile-theme-options"><legend>Color theme</legend>{[["light", "Light", "Clean surfaces"], ["dark", "Dark", "Low-light workspace"], ["system", "System", "Follow this device"]].map(([value, label, detail]) => <label className={`hod-profile-theme-option ${preferences.theme === value ? "selected" : ""}`} key={value}><input type="radio" name="hod-profile-theme" value={value} checked={preferences.theme === value} onChange={() => setPreferences((current) => ({ ...current, theme: value }))}/><span className={`hod-profile-theme-swatch ${value}`}/><span><strong>{label}</strong><small>{detail}</small></span>{preferences.theme === value && <Check size={15}/>}</label>)}</fieldset>
            <label className="hod-profile-motion-option"><span><strong>Reduce motion</strong><small>Limit decorative movement and transitions.</small></span><input type="checkbox" checked={preferences.reducedMotion} onChange={(event) => setPreferences((current) => ({ ...current, reducedMotion: event.target.checked }))}/></label>
            <div className="hod-profile-form-actions"><span>Theme applies after saving.</span><button className="hod-profile-button-primary" type="submit" disabled={!preferenceDirty || savingPreferences}>{savingPreferences ? <span className="hod-profile-spinner"/> : <Save size={15}/>} {savingPreferences ? "Saving…" : "Save display settings"}</button></div>
          </form>
        </ProfileCard>
      </div>}

      {activeTab === "security" && <div className="hod-profile-panel hod-profile-security-grid" role="tabpanel" id="hod-profile-panel-security" aria-labelledby="hod-profile-tab-security">
        <ProfileCard icon={KeyRound} eyebrow="ACCOUNT SECURITY" title="Password & access" className="hod-profile-card-security">
          <p className="hod-profile-card-copy">Password changes and sign-out are handled by the existing CollegeOS account security controls.</p>
          <button className="hod-profile-button-primary" type="button" onClick={openSettings}><KeyRound size={15}/>Open account security<ChevronRight size={15}/></button>
        </ProfileCard>
        <ProfileCard icon={CalendarClock} eyebrow="SIGN-IN ACTIVITY" title="Login history & sessions" className="hod-profile-card-login">
          <div className="hod-profile-login-entry"><span className="hod-profile-login-icon"><CheckCircle2 size={17}/></span><span><strong>Most recent sign-in</strong><small>{formatDate(profile.lastLoginAt)}</small></span></div>
          <div className="hod-profile-security-note"><ShieldCheck size={16}/><p>The profile API provides the most recent sign-in timestamp only. It does not expose full login history or a list of active sessions.</p></div>
          <button className="hod-profile-button-secondary" type="button" onClick={openSettings}>Account settings<ChevronRight size={14}/></button>
        </ProfileCard>
      </div>}

      {editing && <div className="hod-profile-editor-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) cancelEditing(); }}>
        <aside className="hod-profile-editor" ref={editorRef} role="dialog" aria-modal="true" aria-labelledby="hod-profile-editor-title">
          <header className="hod-profile-editor-header"><div><span className="hod-profile-eyebrow">PROFILE MANAGEMENT</span><h2 id="hod-profile-editor-title" ref={editorTitleRef} tabIndex={-1}>Edit your profile</h2><p>Update the personal and professional details available to your HOD account.</p></div><button className="hod-profile-editor-close" type="button" onClick={cancelEditing} aria-label="Close profile editor"><X size={18}/></button></header>
          <form className="hod-profile-editor-form" onSubmit={handleSaveProfile}>
            <div className="hod-profile-editor-fields">
              <label>Full name<input className="hod-input" value={form.fullName} onChange={(event) => updateForm("fullName", event.target.value)} maxLength={100} minLength={2} required autoComplete="name"/></label>
              <label>Email address<input className="hod-input" value={profile.email || ""} readOnly disabled/><small>Email changes are managed by account support.</small></label>
              <label>Phone<input className="hod-input" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} maxLength={25} placeholder="Add a contact number"/></label>
              <label>Location<input className="hod-input" value={form.location} onChange={(event) => updateForm("location", event.target.value)} maxLength={120} placeholder="Add your location"/></label>
              <label className="hod-profile-editor-wide">Professional headline<input className="hod-input" value={form.headline} onChange={(event) => updateForm("headline", event.target.value)} maxLength={120} placeholder="Role or area of responsibility"/></label>
              <label className="hod-profile-editor-wide">Profile biography<textarea className="hod-textarea" rows={4} value={form.bio} onChange={(event) => updateForm("bio", event.target.value)} maxLength={500} placeholder="A concise professional biography"/><small>{form.bio.length}/500 characters</small></label>
              <label className="hod-profile-editor-wide">Leadership details<textarea className="hod-textarea" rows={4} value={form.leadershipDetails} onChange={(event) => updateForm("leadershipDetails", event.target.value)} maxLength={2000} placeholder="Department leadership responsibilities"/></label>
            </div>
            <div className="hod-profile-editor-footer"><span>Only fields permitted by the HOD profile service are submitted.</span><div><button className="hod-profile-button-secondary" type="button" onClick={cancelEditing} disabled={saving}>Cancel</button><button className="hod-profile-button-primary" type="submit" disabled={saving}>{saving ? <span className="hod-profile-spinner"/> : <Save size={15}/>} {saving ? "Saving changes…" : "Save changes"}</button></div></div>
          </form>
        </aside>
      </div>}
    </main>
  );
}
