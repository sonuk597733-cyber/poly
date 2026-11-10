import React, { useState, useEffect } from "react";
import { BookOpen, FileText, Video, ExternalLink, Loader2, Layers, Search, Calendar, UserCheck, Play, Eye, CheckCircle2, Clock, Plus, X, Send, BarChart3, Download, UploadCloud, Sparkles } from "lucide-react";
import { authApi } from "../../services/authApi";
import { LectureWatchAnalyticsModal } from "../teacher/TeacherLectures";
import "./HODTheme.css";
import "./HODMaterials.css";

export default function HODMaterials({ currentUser }) {
  const [assignments, setAssignments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [notes, setNotes] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [activeTab, setActiveTab] = useState("lectures"); // 'lectures' | 'assignments' | 'materials'
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeVideo, setActiveVideo] = useState(null);
  const [analyticsLecture, setAnalyticsLecture] = useState(null);

  // HOD Lecture Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [lecTitle, setLecTitle] = useState("");
  const [lecSubject, setLecSubject] = useState("");
  const [lecSemester, setLecSemester] = useState("Semester 5");
  const [lecTopic, setLecTopic] = useState("");
  const [lecType, setLecType] = useState("Theory");
  const [lecVideoUrl, setLecVideoUrl] = useState("");
  const [lecDuration, setLecDuration] = useState(45);
  const [submittingLec, setSubmittingLec] = useState(false);

  // HOD Notes Upload State
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDesc, setNoteDesc] = useState("");
  const [noteSubject, setNoteSubject] = useState("");
  const [noteSemester, setNoteSemester] = useState("Semester 5");
  const [noteUnit, setNoteUnit] = useState("Unit 1");
  const [noteCategory, setNoteCategory] = useState("Syllabus");
  const [noteFile, setNoteFile] = useState(null);
  const [noteUploadMode, setNoteUploadMode] = useState("file");
  const [noteExternalUrl, setNoteExternalUrl] = useState("");
  const [noteExternalTitle, setNoteExternalTitle] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  const deptBranch = currentUser?.department || "CSE";

  const fetchAll = () => {
    setLoading(true);
    Promise.allSettled([
      authApi.getAssignments({ branch: deptBranch }),
      authApi.getMaterials({ branch: deptBranch }),
      authApi.getLectures({ branch: deptBranch }),
      authApi.getNotes({ branch: deptBranch })
    ])
      .then(([asgnRes, matRes, lecRes, notesRes]) => {
        setAssignments(asgnRes.status === "fulfilled" ? asgnRes.value?.assignments || [] : []);
        setMaterials(matRes.status === "fulfilled" ? matRes.value?.materials || [] : []);
        setLectures(lecRes.status === "fulfilled" ? lecRes.value?.lectures || [] : []);
        setNotes(notesRes.status === "fulfilled" ? notesRes.value?.notes || [] : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load materials:", err);
        setAssignments([]);
        setMaterials([]);
        setLectures([]);
        setNotes([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAll();
  }, [deptBranch]);

  const handlePublishHODNote = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteSubject.trim()) {
      alert("Please provide title and subject.");
      return;
    }
    if (noteUploadMode === "file" && !noteFile) {
      alert("Please choose a file to upload.");
      return;
    }
    if (noteUploadMode === "url" && !noteExternalUrl.trim()) {
      alert("Please enter a valid external resource URL.");
      return;
    }
    if (noteUploadMode === "both" && (!noteFile || !noteExternalUrl.trim())) {
      alert("Both mode requires an attached file and an external URL.");
      return;
    }

    setSubmittingNote(true);
    try {
      const formData = new FormData();
      formData.append("title", noteTitle.trim());
      formData.append("description", noteDesc.trim());
      formData.append("subject", noteSubject.trim());
      formData.append("branch", deptBranch);
      formData.append("semester", noteSemester);
      formData.append("academicYear", "3rd Year");
      formData.append("unit", noteUnit.trim());
      formData.append("category", noteCategory);
      formData.append("isImportant", "true");
      formData.append("publicationStatus", "published");
      formData.append("uploadMode", noteUploadMode);

      if (noteFile) {
        formData.append("file", noteFile);
      }
      if (noteExternalUrl.trim()) {
        const extArr = [
          {
            title: noteExternalTitle.trim() || noteTitle.trim(),
            url: noteExternalUrl.trim(),
            resourceType: "reference_guide"
          }
        ];
        formData.append("externalResources", JSON.stringify(extArr));
      }

      await authApi.createNote(formData);
      setShowNoteModal(false);
      setNoteTitle("");
      setNoteDesc("");
      setNoteSubject("");
      setNoteFile(null);
      setNoteExternalUrl("");
      setNoteExternalTitle("");
      fetchAll();
    } catch (err) {
      alert(err.message || "Failed to publish study material.");
    } finally {
      setSubmittingNote(false);
    }
  };

  const handlePublishHODLecture = async (e) => {
    e.preventDefault();
    if (!lecTitle.trim() || !lecSubject.trim() || !lecTopic.trim() || !lecVideoUrl.trim()) {
      alert("Please fill all required lecture fields.");
      return;
    }

    setSubmittingLec(true);
    try {
      await authApi.createLecture({
        title: lecTitle.trim(),
        branch: deptBranch,
        semester: lecSemester,
        academicYear: "3rd Year",
        subject: lecSubject.trim(),
        topic: lecTopic.trim(),
        lectureType: lecType,
        videoSource: "youtube",
        videoUrl: lecVideoUrl.trim(),
        durationMinutes: lecDuration
      });

      setShowUploadModal(false);
      setLecTitle("");
      setLecSubject("");
      setLecTopic("");
      setLecVideoUrl("");
      fetchAll();
    } catch (err) {
      alert(err.message || "Failed to publish lecture.");
    } finally {
      setSubmittingLec(false);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (a.title || "").toLowerCase().includes(q) ||
      (a.subject || "").toLowerCase().includes(q) ||
      (a.semester || "").toLowerCase().includes(q)
    );
  });

  const displayNotes = notes.length > 0 ? notes : materials;
  const filteredNotes = displayNotes.filter((n) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (n.title || "").toLowerCase().includes(q) ||
      (n.subject || "").toLowerCase().includes(q) ||
      (n.category || n.type || "").toLowerCase().includes(q) ||
      (n.uploaderName || n.uploadedByName || n.author || "").toLowerCase().includes(q)
    );
  });

  const filteredLectures = lectures.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (l.title || "").toLowerCase().includes(q) ||
      (l.subject || "").toLowerCase().includes(q) ||
      (l.topic || "").toLowerCase().includes(q) ||
      (l.uploadedByName || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="hod-role-view hod-mat-container">
      {/* Header */}
      <div className="hod-pane-header">
        <div>
          <h2>
            <BookOpen size={24} color="var(--hod-primary)" />
            Department Coursework &amp; Study Materials Monitoring
          </h2>
          <p>Supervise academic assignments, syllabus guides, laboratory manuals, and lecture video repositories for {deptBranch} Engineering.</p>
        </div>

        <div className="hod-mat-pills">
          <span className="hod-pill indigo">
            {assignments.length} Coursework Sets
          </span>
          <span className="hod-pill violet">
            {notes.length || materials.length} Study Notes
          </span>
          <span className="hod-pill emerald">
            {lectures.length} Recorded Lectures
          </span>
        </div>
      </div>

      {/* Tabs and Search Controls */}
      <div className="hod-mat-controls">
        <div className="hod-mat-tabs">
          <button
            type="button"
            className={`hod-mat-tab-btn ${activeTab === "lectures" ? "active" : ""}`}
            onClick={() => setActiveTab("lectures")}
          >
            <Video size={16} />
            <span>Digital Video Lectures ({lectures.length})</span>
          </button>
          <button
            type="button"
            className={`hod-mat-tab-btn ${activeTab === "assignments" ? "active" : ""}`}
            onClick={() => setActiveTab("assignments")}
          >
            <FileText size={16} />
            <span>Problem Sets &amp; Assignments ({assignments.length})</span>
          </button>
          <button
            type="button"
            className={`hod-mat-tab-btn ${activeTab === "materials" ? "active" : ""}`}
            onClick={() => setActiveTab("materials")}
          >
            <BookOpen size={16} />
            <span>Study Notes &amp; Syllabus ({notes.length || materials.length})</span>
          </button>
        </div>

        <div className="hod-search-wrap" style={{ maxWidth: 360 }}>
          <Search size={16} className="hod-search-icon" />
          <input
            type="text"
            className="hod-input"
            style={{ paddingLeft: 38 }}
            placeholder={`Search ${activeTab === "assignments" ? "assignments" : "study notes"}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--hod-text-secondary)" }}>
          <Loader2 size={32} className="spin" style={{ margin: "0 auto 12px auto" }} />
          <p>Retrieving department curriculum materials...</p>
        </div>
      ) : activeTab === "lectures" ? (
        /* Video Lectures View */
        <div className="hod-card">
          <div className="hod-mat-table-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "1.05rem", color: "var(--hod-text-primary)" }}>
                Department Recorded Video Lectures & Practical Tutorials
              </h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--hod-text-secondary)" }}>
                Digital video sessions and multimedia demonstrations delivered by {deptBranch} faculty members.
              </p>
            </div>
            <button
              type="button"
              className="hod-btn-primary"
              onClick={() => setShowUploadModal(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: "0.84rem", fontWeight: 700 }}
            >
              <Plus size={16} /> Publish Department Lecture
            </button>
          </div>

          {filteredLectures.length === 0 ? (
            <div className="hod-empty-box" style={{ marginTop: 16 }}>
              <Video size={40} style={{ opacity: 0.5 }} />
              <h3>No Video Lectures Published</h3>
              <p>Faculty recorded sessions and lab demonstrations will appear here once uploaded.</p>
            </div>
          ) : (
            <div className="hod-table-wrap" style={{ marginTop: 16 }}>
              <table className="hod-table">
                <thead>
                  <tr>
                    <th>Lecture Title</th>
                    <th>Subject & Topic</th>
                    <th>Type</th>
                    <th>Target Sem</th>
                    <th>Faculty Instructor</th>
                    <th>Engagement</th>
                    <th style={{ textAlign: "right" }}>Watch Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLectures.map((lec) => (
                    <tr key={lec.id || lec._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              background: "rgba(56, 189, 248, 0.15)",
                              color: "#38BDF8",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer"
                            }}
                            onClick={() => setActiveVideo(lec)}
                          >
                            <Play size={15} fill="currentColor" />
                          </span>
                          <div>
                            <strong style={{ color: "var(--hod-text-primary)", display: "block" }}>{lec.title}</strong>
                            <small style={{ color: "var(--hod-text-muted)" }}>
                              <Clock size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />
                              {lec.durationMinutes || 45} mins • {(lec.resources || []).length} attached files
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="hod-pill indigo">{lec.subject}</span>
                        {lec.topic && (
                          <span style={{ display: "block", fontSize: "0.74rem", color: "var(--hod-text-secondary)", marginTop: 4 }}>
                            {lec.topic}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="hod-pill violet">{lec.lectureType || "Theory"}</span>
                      </td>
                      <td>{lec.semester}</td>
                      <td>
                        <div>
                          <strong style={{ display: "block", fontSize: "0.84rem" }}>{lec.uploadedByName}</strong>
                          <small style={{ color: "var(--hod-text-muted)", fontSize: "0.72rem" }}>
                            {lec.uploadedByDesignation || "Faculty"}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: "0.76rem" }}>
                          <span><Eye size={12} /> {lec.viewsCount || 0} views</span>
                          <span className="hod-pill emerald" style={{ padding: "2px 6px" }}>
                            <CheckCircle2 size={11} /> {lec.completionsCount || 0} completed
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          <button
                            type="button"
                            className="hod-btn-secondary"
                            style={{ padding: "5px 10px", fontSize: "0.8rem", color: "var(--hod-primary)" }}
                            onClick={() => setAnalyticsLecture(lec)}
                            title="View Student Watch Analytics"
                          >
                            <BarChart3 size={13} />
                            <span>Analytics</span>
                          </button>
                          <button
                            type="button"
                            className="hod-btn-secondary"
                            style={{ padding: "5px 12px", fontSize: "0.8rem" }}
                            onClick={() => setActiveVideo(lec)}
                          >
                            <Play size={13} />
                            <span>Stream</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === "assignments" ? (
        /* Assignments View */
        <div className="hod-card">
          <div className="hod-mat-table-header">
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "1.05rem", color: "var(--hod-text-primary)" }}>
                Active Department Coursework Problem Sets
              </h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--hod-text-secondary)" }}>
                Continuous assessment assignments published across academic semesters.
              </p>
            </div>
          </div>

          {filteredAssignments.length === 0 ? (
            <div className="hod-empty-box" style={{ marginTop: 16 }}>
              <FileText size={40} style={{ opacity: 0.5 }} />
              <h3>No Coursework Assignments</h3>
              <p>Department faculty haven't published problem sets yet for this branch.</p>
            </div>
          ) : (
            <div className="hod-table-wrap" style={{ marginTop: 16 }}>
              <table className="hod-table">
                <thead>
                  <tr>
                    <th>Title & Topic</th>
                    <th>Subject</th>
                    <th>Branch / Sem</th>
                    <th>Due Date</th>
                    <th>Max Points</th>
                    <th>Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((a) => (
                    <tr key={a._id || a.id}>
                      <td>
                        <strong style={{ color: "var(--hod-text-primary)" }}>{a.title}</strong>
                        {a.description && (
                          <div style={{ fontSize: "0.78rem", color: "var(--hod-text-muted)", marginTop: 2 }}>
                            {a.description.slice(0, 70)}...
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="hod-pill indigo">{a.subject}</span>
                      </td>
                      <td>
                        {a.branch || deptBranch} • {a.semester || "Semester 5"}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Calendar size={13} color="var(--hod-text-muted)" />
                          <span>
                            {a.dueDate
                              ? new Date(a.dueDate).toLocaleDateString("en-IN", {
                                  month: "short",
                                  day: "numeric"
                                })
                              : "Open"}
                          </span>
                        </div>
                      </td>
                      <td>{a.maxPoints || 100} pts</td>
                      <td>
                        <span className="hod-pill emerald">
                          {(a.submissions || []).length || a.submissionsCount || 0} Submissions
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Materials / Notes View */
        <div className="hod-card">
          <div className="hod-mat-table-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "1.05rem", color: "var(--hod-text-primary)" }}>
                Department Study Notes, Syllabus &amp; Curriculum Resources
              </h3>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--hod-text-secondary)" }}>
                Verified academic documents, question banks, and curriculum guidelines for {deptBranch} Engineering.
              </p>
            </div>
            <button
              type="button"
              className="hod-btn-primary"
              onClick={() => setShowNoteModal(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: "0.84rem", fontWeight: 700 }}
            >
              <Plus size={16} /> Publish Department Material
            </button>
          </div>

          {filteredNotes.length === 0 ? (
            <div className="hod-empty-box" style={{ marginTop: 16 }}>
              <BookOpen size={40} style={{ opacity: 0.5 }} />
              <h3>No Study Resources Published</h3>
              <p>Lecture notes, laboratory manuals, and syllabus files will appear here once uploaded by department faculty.</p>
            </div>
          ) : (
            <div className="hod-table-wrap" style={{ marginTop: 16 }}>
              <table className="hod-table">
                <thead>
                  <tr>
                    <th>Document Title</th>
                    <th>Subject &amp; Unit</th>
                    <th>Category</th>
                    <th>Branch / Sem</th>
                    <th>Author / Role</th>
                    <th>Format &amp; Size</th>
                    <th>Downloads</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNotes.map((n) => {
                    const noteId = n._id || n.id;
                    const ext = n.file?.fileExtension?.toUpperCase() || (n.type ? n.type.toUpperCase() : "PDF");
                    const sizeText = n.file?.fileSize
                      ? (n.file.fileSize / 1024 > 1024
                          ? `${(n.file.fileSize / (1024 * 1024)).toFixed(1)} MB`
                          : `${(n.file.fileSize / 1024).toFixed(0)} KB`)
                      : "—";
                    const isNewNote = Boolean(n.file);

                    return (
                      <tr key={noteId}>
                        <td>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                            <FileText size={16} color="var(--hod-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                            <div>
                              <strong style={{ color: "var(--hod-text-primary)", display: "block" }}>{n.title}</strong>
                              {n.description && (
                                <small style={{ color: "var(--hod-text-muted)" }}>
                                  {n.description.slice(0, 65)}...
                                </small>
                              )}
                              {n.isImportant && (
                                <span className="hod-pill amber" style={{ marginLeft: 6, fontSize: "0.7rem", padding: "1px 6px" }}>
                                  <Sparkles size={10} /> Important
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="hod-pill indigo">{n.subject}</span>
                          {n.unit && (
                            <small style={{ display: "block", color: "var(--hod-text-muted)", marginTop: 4 }}>
                              {n.unit}
                            </small>
                          )}
                        </td>
                        <td>
                          <span className="hod-pill violet">{n.category || n.type || "Notes"}</span>
                        </td>
                        <td>
                          {n.branch || deptBranch} • {n.semester || "All Sem"}
                        </td>
                        <td>
                          <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                            {n.uploaderName || n.uploadedByName || n.author || "Faculty"}
                          </div>
                          <span className="hod-pill cyan" style={{ fontSize: "0.7rem", padding: "1px 6px", textTransform: "capitalize" }}>
                            {n.uploaderRole || "faculty"}
                          </span>
                        </td>
                        <td>
                          <code style={{ fontSize: "0.78rem" }}>{ext}</code>
                          <small style={{ display: "block", color: "var(--hod-text-muted)" }}>{sizeText}</small>
                        </td>
                        <td>
                          <strong style={{ color: "var(--hod-text-primary)" }}>{n.downloadCount || 0}</strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            {isNewNote ? (
                              <>
                                <a
                                  href={authApi.getNotePreviewUrl(noteId)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hod-btn-secondary"
                                  style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                                  title="Inline preview"
                                >
                                  <Eye size={12} />
                                  <span>Preview</span>
                                </a>
                                <button
                                  type="button"
                                  className="hod-btn-secondary"
                                  style={{ padding: "4px 8px", fontSize: "0.78rem", color: "var(--hod-primary)" }}
                                  onClick={() => authApi.downloadNoteFile(noteId, n.file?.originalFileName || `${n.title}.${n.file?.fileExtension || 'pdf'}`)}
                                  title="Download original file"
                                >
                                  <Download size={12} />
                                </button>
                              </>
                            ) : n.fileUrl || n.url ? (
                              <a
                                href={n.fileUrl || n.url}
                                target="_blank"
                                rel="noreferrer"
                                className="hod-btn-secondary"
                                style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                              >
                                <ExternalLink size={12} />
                                <span>Open</span>
                              </a>
                            ) : (
                              <span style={{ fontSize: "0.78rem", color: "var(--hod-text-muted)" }}>Internal</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Video Preview Modal */}
      {activeVideo && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10050,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
          onClick={() => setActiveVideo(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 860,
              background: "#0B1222",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.15)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                color: "#F8FAFC"
              }}
            >
              <div>
                <span className="hod-pill indigo" style={{ marginRight: 8 }}>{activeVideo.subject}</span>
                <strong style={{ fontSize: "1rem" }}>{activeVideo.title}</strong>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>

            <div style={{ width: "100%", aspectRatio: "16 / 9", background: "#000" }}>
              {activeVideo.videoUrl?.includes("youtube.com") || activeVideo.videoUrl?.includes("youtu.be") ? (
                <iframe
                  title={activeVideo.title}
                  src={`https://www.youtube.com/embed/${activeVideo.videoUrl.match(/(?:youtube\.com\/(?:embed\/|watch\?v=|shorts\/)|youtu\.be\/)([\w-]{11})/)?.[1]}?autoplay=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              ) : (
                <video
                  src={activeVideo.id ? authApi.getLectureStreamUrl(activeVideo.id) : activeVideo.videoUrl}
                  controls
                  autoPlay
                  style={{ width: "100%", height: "100%" }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* HOD Lecture Upload Modal */}
      {showUploadModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10050,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
          onClick={() => setShowUploadModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 680,
              background: "var(--hod-card-solid)",
              borderRadius: 16,
              border: "1px solid var(--hod-border)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
              overflow: "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--hod-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--hod-text-primary)" }}>
                Publish Department Lecture ({deptBranch})
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                style={{ background: "none", border: "none", color: "var(--hod-text-secondary)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePublishHODLecture} style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label className="hod-label">Lecture Title</label>
                  <input
                    type="text"
                    className="hod-input"
                    value={lecTitle}
                    onChange={(e) => setLecTitle(e.target.value)}
                    placeholder="e.g. Memory Management & Paging Architecture"
                    required
                  />
                </div>

                <div>
                  <label className="hod-label">Course Subject</label>
                  <input
                    type="text"
                    className="hod-input"
                    value={lecSubject}
                    onChange={(e) => setLecSubject(e.target.value)}
                    placeholder="e.g. Operating Systems"
                    required
                  />
                </div>

                <div>
                  <label className="hod-label">Target Semester</label>
                  <select
                    className="hod-select"
                    value={lecSemester}
                    onChange={(e) => setLecSemester(e.target.value)}
                  >
                    {[1, 2, 3, 4, 5, 6].map((s) => (
                      <option key={s} value={`Semester ${s}`}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="hod-label">Topic / Unit</label>
                  <input
                    type="text"
                    className="hod-input"
                    value={lecTopic}
                    onChange={(e) => setLecTopic(e.target.value)}
                    placeholder="e.g. Unit 3: Virtual Memory"
                    required
                  />
                </div>

                <div>
                  <label className="hod-label">Session Type</label>
                  <select
                    className="hod-select"
                    value={lecType}
                    onChange={(e) => setLecType(e.target.value)}
                  >
                    <option value="Theory">Theory</option>
                    <option value="Practical / Lab Demo">Practical / Lab Demo</option>
                    <option value="Tutorial">Tutorial</option>
                    <option value="Revision">Revision</option>
                    <option value="Guest Lecture">Guest Lecture</option>
                  </select>
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label className="hod-label">Video URL (YouTube / Stream)</label>
                  <input
                    type="url"
                    className="hod-input"
                    value={lecVideoUrl}
                    onChange={(e) => setLecVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                </div>

                <div>
                  <label className="hod-label">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="240"
                    className="hod-input"
                    value={lecDuration}
                    onChange={(e) => setLecDuration(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="hod-btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hod-btn-primary"
                  disabled={submittingLec}
                >
                  {submittingLec ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                  <span>Publish Lecture</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HOD Study Notes Upload Modal */}
      {showNoteModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10050,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }}
          onClick={() => setShowNoteModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 680,
              background: "var(--hod-card-solid)",
              borderRadius: 16,
              border: "1px solid var(--hod-border)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
              overflow: "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--hod-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--hod-text-primary)" }}>
                Publish Department Study Material &amp; Syllabus ({deptBranch})
              </h3>
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                style={{ background: "none", border: "none", color: "var(--hod-text-secondary)", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePublishHODNote} style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label className="hod-label">Document Title *</label>
                  <input
                    type="text"
                    className="hod-input"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="e.g. B.Tech Polytechnic 5th Sem Complete Syllabus &amp; Model Paper"
                    required
                  />
                </div>

                <div>
                  <label className="hod-label">Subject / Scope *</label>
                  <input
                    type="text"
                    className="hod-input"
                    value={noteSubject}
                    onChange={(e) => setNoteSubject(e.target.value)}
                    placeholder="e.g. Operating Systems / All Subjects"
                    required
                  />
                </div>

                <div>
                  <label className="hod-label">Category</label>
                  <select
                    className="hod-select"
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value)}
                  >
                    <option value="Syllabus">Syllabus</option>
                    <option value="Question Bank">Question Bank</option>
                    <option value="Department Guidelines">Department Guidelines</option>
                    <option value="Lecture Notes">Lecture Notes</option>
                    <option value="Lab Manual">Lab Manual</option>
                    <option value="Previous Year Papers">Previous Year Papers</option>
                    <option value="Model Question Paper">Model Question Paper</option>
                  </select>
                </div>

                <div>
                  <label className="hod-label">Target Semester</label>
                  <select
                    className="hod-select"
                    value={noteSemester}
                    onChange={(e) => setNoteSemester(e.target.value)}
                  >
                    {[1, 2, 3, 4, 5, 6].map((s) => (
                      <option key={s} value={`Semester ${s}`}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="hod-label">Unit / Module</label>
                  <input
                    type="text"
                    className="hod-input"
                    value={noteUnit}
                    onChange={(e) => setNoteUnit(e.target.value)}
                    placeholder="e.g. Complete Syllabus / Unit 1"
                  />
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label className="hod-label">Description / Summary</label>
                  <textarea
                    className="hod-input"
                    rows={2}
                    value={noteDesc}
                    onChange={(e) => setNoteDesc(e.target.value)}
                    placeholder="Key topics, exam guidelines, or revision instructions..."
                  />
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label className="hod-label">Resource Upload Mode</label>
                  <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: "0.85rem" }}>
                      <input
                        type="radio"
                        name="hodNoteMode"
                        value="file"
                        checked={noteUploadMode === "file"}
                        onChange={() => setNoteUploadMode("file")}
                      />
                      <span>File Only</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: "0.85rem" }}>
                      <input
                        type="radio"
                        name="hodNoteMode"
                        value="url"
                        checked={noteUploadMode === "url"}
                        onChange={() => setNoteUploadMode("url")}
                      />
                      <span>External URL (Drive / Docs)</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: "0.85rem" }}>
                      <input
                        type="radio"
                        name="hodNoteMode"
                        value="both"
                        checked={noteUploadMode === "both"}
                        onChange={() => setNoteUploadMode("both")}
                      />
                      <span>Both (File + URL)</span>
                    </label>
                  </div>
                </div>

                {(noteUploadMode === "file" || noteUploadMode === "both") && (
                  <div style={{ gridColumn: "span 2" }}>
                    <label className="hod-label">Document Attachment (.pdf, .pptx, .docx, .zip) *</label>
                    <input
                      type="file"
                      className="hod-input"
                      accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip,.rar,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setNoteFile(e.target.files[0]);
                        }
                      }}
                      required={noteUploadMode === "file"}
                    />
                    {noteFile && (
                      <small style={{ color: "var(--hod-emerald)", marginTop: 4, display: "block" }}>
                        Selected: {noteFile.name} ({(noteFile.size / 1024).toFixed(0)} KB)
                      </small>
                    )}
                  </div>
                )}

                {(noteUploadMode === "url" || noteUploadMode === "both") && (
                  <div style={{ gridColumn: "span 2", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label className="hod-label">External Resource URL *</label>
                      <input
                        type="url"
                        className="hod-input"
                        placeholder="https://drive.google.com/... or OneDrive URL"
                        value={noteExternalUrl}
                        onChange={(e) => setNoteExternalUrl(e.target.value)}
                        required={noteUploadMode === "url"}
                      />
                    </div>
                    <div>
                      <label className="hod-label">URL Label / Reference Title</label>
                      <input
                        type="text"
                        className="hod-input"
                        placeholder="e.g. Department Cloud Syllabus Repository"
                        value={noteExternalTitle}
                        onChange={(e) => setNoteExternalTitle(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="hod-btn-secondary"
                  onClick={() => setShowNoteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hod-btn-primary"
                  disabled={submittingNote}
                >
                  {submittingNote ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                  <span>Publish Study Material</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {analyticsLecture && (
        <LectureWatchAnalyticsModal
          lecture={analyticsLecture}
          onClose={() => setAnalyticsLecture(null)}
        />
      )}
    </div>
  );
}
