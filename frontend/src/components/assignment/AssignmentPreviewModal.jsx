import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  X,
  Printer,
  Download,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Paperclip,
  Award,
  Calendar,
  Clock,
  ShieldAlert,
  BookOpen,
  Layers,
  CheckCircle2,
  ChevronRight,
  Info
} from "lucide-react";
import { authApi } from "../../services/authApi";
import "./AssignmentPreviewModal.css";

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function AssignmentPreviewModal({
  assignment,
  initialFile = null,
  initialTab = "overview", // "overview" | "handout"
  onClose,
  onStartAssignment = null
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fileLoadError, setFileLoadError] = useState(false);
  const modalRef = useRef(null);

  const files = assignment?.referenceAttachments || [];
  const resources = assignment?.externalResources || [];
  const rubrics = assignment?.rubricCriteria || [];

  useEffect(() => {
    if (initialFile && files.length > 0) {
      const idx = files.findIndex(
        (f) => (f._id && f._id === initialFile._id) || f.fileName === initialFile.fileName
      );
      if (idx >= 0) {
        setSelectedFileIdx(idx);
        setActiveTab("handout");
      }
    }
  }, [initialFile, files]);

  const activeFile = files[selectedFileIdx] || files[0] || null;

  const handlePrint = () => {
    window.print();
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const handleZoomIn = () => {
    setZoomLevel((z) => Math.min(200, z + 20));
  };

  const handleZoomOut = () => {
    setZoomLevel((z) => Math.max(60, z - 20));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  if (!assignment) return null;

  const isPDF =
    activeFile &&
    ((activeFile.fileExtension || "").toLowerCase() === ".pdf" ||
      (activeFile.fileName || "").toLowerCase().endsWith(".pdf") ||
      (activeFile.mimeType || "").includes("pdf"));

  const isImage =
    activeFile &&
    [".png", ".jpg", ".jpeg", ".webp"].some((ext) =>
      (activeFile.fileName || "").toLowerCase().endsWith(ext)
    );

  const fileUrl = activeFile?.fileUrl || (activeFile?.fileName ? `/uploads/assignments/references/${activeFile.fileName}` : "");

  return createPortal(
    <div className={`asgn-preview-backdrop ${isFullscreen ? "fullscreen-backdrop" : ""}`} onClick={onClose}>
      <div
        ref={modalRef}
        className={`asgn-preview-modal ${isFullscreen ? "fullscreen-modal" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <header className="asgn-preview-header">
          <div className="asgn-preview-title-block">
            <div className="asgn-preview-badges">
              <span className="asgn-badge-subject">{assignment.subject || "Subject"}</span>
              <span className="asgn-badge-scope">
                {assignment.branch} · {assignment.semester}
              </span>
              <span className={`asgn-badge-priority ${assignment.priority || "normal"}`}>
                {assignment.priority || "normal"} Priority
              </span>
              {assignment.status === "draft" && <span className="asgn-badge-draft">Draft Preview</span>}
            </div>
            <h2 className="asgn-preview-title">{assignment.title}</h2>
            <div className="asgn-preview-meta-row">
              <span>
                <Clock size={13} /> Due: <strong>{formatDate(assignment.dueDate)} {assignment.dueTime || "23:59"}</strong>
              </span>
              <span>
                <Award size={13} /> Total Marks: <strong>{assignment.totalPoints || assignment.maxMarks || 100}</strong> (Passing: {assignment.passingMarks || 40})
              </span>
              <span>
                By: <strong>{assignment.creatorName || assignment.createdBy?.fullName || "Faculty"}</strong>
              </span>
            </div>
          </div>

          <div className="asgn-preview-actions">
            <button
              type="button"
              className="preview-btn-icon"
              onClick={handlePrint}
              title="Print Assignment Sheet"
            >
              <Printer size={16} />
              <span className="preview-btn-label">Print</span>
            </button>

            <button
              type="button"
              className="preview-btn-icon"
              onClick={handleToggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <button type="button" className="preview-btn-close" onClick={onClose} title="Close Preview">
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Tab Navigation Strip */}
        <div className="asgn-preview-tabs">
          <button
            type="button"
            className={`asgn-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <BookOpen size={14} />
            <span>Problem Statement & Rubric</span>
          </button>

          <button
            type="button"
            className={`asgn-tab-btn ${activeTab === "handout" ? "active" : ""}`}
            onClick={() => setActiveTab("handout")}
          >
            <Paperclip size={14} />
            <span>Attached Handouts ({files.length})</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="asgn-preview-body">
          {/* TAB 1: OVERVIEW & INSTRUCTIONS */}
          {activeTab === "overview" && (
            <div className="asgn-overview-pane">
              {/* Instructions Section */}
              <section className="preview-section printable-section">
                <h3 className="preview-section-title">
                  <FileText size={16} color="var(--tch-primary, #2563EB)" />
                  Assignment Instructions & Problem Statement
                </h3>
                <div className="asgn-instructions-box">
                  {assignment.description ? (
                    <div className="instructions-prose">{assignment.description}</div>
                  ) : (
                    <p className="no-data-msg">No instructions provided for this assignment.</p>
                  )}
                </div>
              </section>

              {/* Scope & Policy Grid */}
              <section className="preview-section">
                <h3 className="preview-section-title">
                  <Layers size={16} color="var(--tch-primary, #2563EB)" />
                  Submission Policies & Academic Rules
                </h3>
                <div className="preview-rules-grid">
                  <div className="rule-card">
                    <span className="rule-label">Curriculum Scope</span>
                    <strong>{assignment.unit ? `${assignment.unit}` : "Standard Curriculum"}</strong>
                    <small>{assignment.chapter ? `Chapter: ${assignment.chapter}` : `Section: ${assignment.section || "All"}`}</small>
                  </div>

                  <div className="rule-card">
                    <span className="rule-label">Late Policy</span>
                    <strong>
                      {assignment.lateSubmissionPolicy === "disallowed"
                        ? "Strict Deadline (No Late Submissions)"
                        : assignment.lateSubmissionPolicy === "allowed_penalty"
                        ? `Permitted with -${assignment.latePenaltyPercent || 10}% penalty`
                        : "Permitted without Penalty"}
                    </strong>
                    <small>Cut-off benchmark: {assignment.dueTime || "23:59"}</small>
                  </div>

                  <div className="rule-card">
                    <span className="rule-label">File Constraints</span>
                    <strong>Max {assignment.maxFileSizeMB || 50} MB per submission</strong>
                    <small>Formats: {(assignment.allowedFileFormats || [".pdf", ".docx", ".zip"]).join(", ")}</small>
                  </div>

                  <div className="rule-card">
                    <span className="rule-label">Passing Benchmark</span>
                    <strong>{assignment.passingMarks || 40} / {assignment.totalPoints || 100} Marks</strong>
                    <small>Continuous Internal Assessment</small>
                  </div>
                </div>
              </section>

              {/* Rubric Evaluation Scheme */}
              {rubrics.length > 0 && (
                <section className="preview-section printable-section">
                  <h3 className="preview-section-title">
                    <Award size={16} color="var(--tch-primary, #2563EB)" />
                    Grading Rubric Breakdown ({rubrics.reduce((acc, r) => acc + (r.maxPoints || 0), 0)} Total Points)
                  </h3>
                  <div className="rubric-table-wrapper">
                    <table className="rubric-preview-table">
                      <thead>
                        <tr>
                          <th>Assessment Criteria</th>
                          <th>Evaluation Description</th>
                          <th style={{ width: 110, textAlign: "right" }}>Max Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rubrics.map((r, i) => (
                          <tr key={i}>
                            <td>
                              <strong>{r.title}</strong>
                            </td>
                            <td>{r.description || "Adherence to academic specifications and code/theory correctness."}</td>
                            <td style={{ textAlign: "right", fontWeight: 700, color: "var(--tch-primary, #2563EB)" }}>
                              {r.maxPoints} pts
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* External Cloud Resources */}
              {resources.length > 0 && (
                <section className="preview-section">
                  <h3 className="preview-section-title">
                    <ExternalLink size={16} color="var(--tch-primary, #2563EB)" />
                    Reference Cloud Resources & Dives
                  </h3>
                  <div className="preview-resources-list">
                    {resources.map((res, i) => (
                      <a
                        key={i}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="preview-resource-pill"
                      >
                        <ExternalLink size={14} />
                        <div>
                          <strong>{res.title}</strong>
                          <small>{res.url}</small>
                        </div>
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* TAB 2: INTEGRATED HANDOUT & DOCUMENT VIEWER */}
          {activeTab === "handout" && (
            <div className="asgn-handout-pane">
              {files.length === 0 ? (
                <div className="preview-empty-handout">
                  <FileText size={48} color="#94A3B8" />
                  <h4>No Handouts Attached</h4>
                  <p>The instructor has not uploaded physical reference files for this assignment. Refer to problem statement instructions.</p>
                </div>
              ) : (
                <div className="handout-viewer-layout">
                  {/* Multi-file switcher (if more than 1 file) */}
                  {files.length > 1 && (
                    <div className="handout-file-selector">
                      {files.map((f, i) => (
                        <button
                          key={f._id || i}
                          type="button"
                          className={`handout-select-btn ${selectedFileIdx === i ? "active" : ""}`}
                          onClick={() => {
                            setSelectedFileIdx(i);
                            setZoomLevel(100);
                          }}
                        >
                          <FileText size={14} />
                          <span className="file-name">{f.originalFileName || f.fileName}</span>
                          <span className="file-size">{formatFileSize(f.fileSize)}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Viewer Toolbar */}
                  <div className="handout-toolbar">
                    <div className="toolbar-info">
                      <strong>{activeFile?.originalFileName || activeFile?.fileName}</strong>
                      <span>({formatFileSize(activeFile?.fileSize)})</span>
                    </div>

                    <div className="toolbar-controls">
                      <button type="button" className="tb-btn" onClick={handleZoomOut} title="Zoom Out">
                        <ZoomOut size={14} />
                      </button>
                      <span className="zoom-text">{zoomLevel}%</span>
                      <button type="button" className="tb-btn" onClick={handleZoomIn} title="Zoom In">
                        <ZoomIn size={14} />
                      </button>
                      <button type="button" className="tb-btn" onClick={handleResetZoom} title="Reset Zoom">
                        <RotateCcw size={13} />
                      </button>

                      <button
                        type="button"
                        className="tb-btn-download"
                        onClick={() =>
                          authApi.downloadAssignmentReference(
                            assignment.id || assignment._id,
                            activeFile._id || activeFile.fileName,
                            activeFile.originalFileName
                          )
                        }
                        title="Download Original Handout"
                      >
                        <Download size={14} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  {/* Document View Canvas */}
                  <div className="handout-canvas-container">
                    {fileLoadError ? (
                      <div className="unsupported-handout-box error-box">
                        <FileText size={48} color="#DC2626" />
                        <h4>Preview Failed: {activeFile.originalFileName || activeFile.fileName}</h4>
                        <p>
                          This file could not be rendered inline or is corrupted. You can download the physical file directly to inspect it locally.
                        </p>
                        <button
                          type="button"
                          className="btn-primary-download"
                          onClick={() =>
                            authApi.downloadAssignmentReference(
                              assignment.id || assignment._id,
                              activeFile._id || activeFile.fileName,
                              activeFile.originalFileName
                            )
                          }
                        >
                          <Download size={15} />
                          <span>Download File ({formatFileSize(activeFile.fileSize)})</span>
                        </button>
                      </div>
                    ) : isPDF ? (
                      <div
                        className="pdf-viewport-wrapper"
                        style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
                      >
                        <iframe
                          title={activeFile.originalFileName || "Handout PDF"}
                          src={fileUrl}
                          className="pdf-viewer-iframe"
                          onError={() => setFileLoadError(true)}
                        />
                      </div>
                    ) : isImage ? (
                      <div className="image-viewport-wrapper">
                        <img
                          src={fileUrl}
                          alt={activeFile.originalFileName || "Handout"}
                          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "center center" }}
                          className="image-viewer-element"
                          onError={() => setFileLoadError(true)}
                        />
                      </div>
                    ) : (
                      <div className="unsupported-handout-box">
                        <FileText size={48} color="#2563EB" />
                        <h4>Document Attachment: {activeFile.originalFileName || activeFile.fileName}</h4>
                        <p>
                          This file type (<strong>{activeFile.fileExtension || "document"}</strong>) is best viewed in its native application.
                        </p>
                        <button
                          type="button"
                          className="btn-primary-download"
                          onClick={() =>
                            authApi.downloadAssignmentReference(
                              assignment.id || assignment._id,
                              activeFile._id || activeFile.fileName,
                              activeFile.originalFileName
                            )
                          }
                        >
                          <Download size={15} />
                          <span>Download File ({formatFileSize(activeFile.fileSize)})</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="asgn-preview-footer">
          <button type="button" className="btn-footer-secondary" onClick={onClose}>
            Close Preview
          </button>

          {onStartAssignment && (
            <button
              type="button"
              className="btn-footer-primary"
              onClick={() => {
                onClose();
                onStartAssignment(assignment);
              }}
            >
              <span>Open Solution Workspace</span>
              <ChevronRight size={15} />
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
}
