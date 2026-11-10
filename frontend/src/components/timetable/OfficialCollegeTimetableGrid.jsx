import React from "react";
import {
  MapPin,
  User,
  Clock,
  Printer,
  Edit3,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Coffee,
  ShieldCheck,
  Check
} from "lucide-react";
import {
  MANDATORY_TIMETABLE_PERIODS,
  SUBHARTI_FACULTY_LEGEND,
  SUBHARTI_AUTHORITY_SIGNATURES,
  SUBHARTI_TIMETABLE_HEADER
} from "../../utils/timetableConstants";
import "./OfficialCollegeTimetableGrid.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Official College Timetable Matrix Grid Component
 * Renders the authentic college timetable layout matching Subharti Polytechnic College, Meerut.
 * Supports:
 * - Master Manual Timetable Grid (Option A)
 * - AI OCR Extracted Timetable Draft Review (Option B)
 * - Student Weekly Master Timetable View
 * - HOD & Teacher Department Master Timetable View
 * - Official A4 Landscape Printing / PDF Export
 */
export default function OfficialCollegeTimetableGrid({
  scheduleDays = [],
  isOcrDraft = false,
  ocrConfidenceScore = 96,
  onApplyOcr = null,
  onEditSlot = null,
  onDeleteSlot = null,
  onAddSlot = null,
  onSlotClickForSwap = null,
  swapMode = { active: false, source: null },
  editable = false,
  institution = SUBHARTI_TIMETABLE_HEADER.institution,
  department = SUBHARTI_TIMETABLE_HEADER.department,
  branch = SUBHARTI_TIMETABLE_HEADER.branch,
  semester = SUBHARTI_TIMETABLE_HEADER.semester,
  academicSession = SUBHARTI_TIMETABLE_HEADER.academicSession,
  roomNo = SUBHARTI_TIMETABLE_HEADER.roomNo,
  status = "draft",
  selectedDayFilter = "All"
}) {
  const visibleDays =
    selectedDayFilter === "All"
      ? DAYS
      : DAYS.filter((d) => d === selectedDayFilter);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="subharti-official-timetable-sheet">
      {/* 1. OCR DRAFT ACTION HEADER (Option B only) */}
      {isOcrDraft && (
        <div className="subharti-ocr-draft-banner no-print">
          <div className="subharti-ocr-draft-info">
            <span className="subharti-ocr-badge">
              <Sparkles size={14} /> AI OCR Extracted Draft
            </span>
            <div className="subharti-ocr-score-chip">
              <CheckCircle2 size={15} className="text-emerald-600" />
              <strong>{ocrConfidenceScore}% Confidence Match</strong>
            </div>
            <p className="subharti-ocr-draft-hint">
              The neural OCR engine recognized the Subharti Polytechnic timetable structure.
              Review the matrix below; click any period to edit details before saving to the Master Grid.
            </p>
          </div>

          <div className="subharti-ocr-actions">
            <button
              type="button"
              onClick={handlePrint}
              className="subharti-btn-secondary"
            >
              <Printer size={15} />
              <span>Print Draft</span>
            </button>
            {onApplyOcr && (
              <button
                type="button"
                onClick={onApplyOcr}
                className="subharti-btn-primary"
              >
                <Check size={16} />
                <span>Apply & Save to Master Grid</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. OFFICIAL INSTITUTIONAL HEADER */}
      <div className="subharti-sheet-header">
        <div className="subharti-header-top">
          <div className="subharti-brand-seal-icon">
            <span>SPC</span>
          </div>
          <div className="subharti-header-titles">
            <h1 className="subharti-inst-name">{institution}</h1>
            <h2 className="subharti-dept-name">{department}</h2>
          </div>
          {!isOcrDraft && (
            <div className="subharti-header-tools no-print">
              <button
                type="button"
                onClick={handlePrint}
                className="subharti-btn-print"
                title="Print Official Timetable (A4 Landscape)"
              >
                <Printer size={15} />
                <span>Print Timetable</span>
              </button>
            </div>
          )}
        </div>

        {/* METADATA BAR */}
        <div className="subharti-meta-strip">
          <div className="subharti-meta-item">
            <span className="subharti-meta-key">BRANCH:</span>
            <span className="subharti-meta-val">{branch}</span>
          </div>
          <div className="subharti-meta-item">
            <span className="subharti-meta-key">YEAR:</span>
            <span className="subharti-meta-val">{semester}</span>
          </div>
          <div className="subharti-meta-item">
            <span className="subharti-meta-key">ACADEMIC SESSION:</span>
            <span className="subharti-meta-val">{academicSession}</span>
          </div>
          <div className="subharti-meta-item subharti-meta-room">
            <span className="subharti-meta-key">ROOM NO.:</span>
            <span className="subharti-meta-val highlight">{roomNo}</span>
          </div>
        </div>
      </div>

      {/* MOBILE SWIPE HINT */}
      <div className="subharti-mobile-scroll-hint no-print" aria-hidden="true">
        <span className="subharti-scroll-pill">
          ⇄ Swipe horizontally to explore full 6-day periods & laboratory blocks
        </span>
      </div>

      {/* 3. MASTER TIMETABLE MATRIX TABLE */}
      <div className="subharti-grid-wrapper">
        <table className="subharti-matrix-table">
          <thead>
            {/* TOP GROUP HEADER ROW */}
            <tr className="subharti-group-head-row">
              <th rowSpan={2} className="subharti-th-day">
                <div className="subharti-day-head-content">
                  <span className="subharti-head-time">TIME</span>
                  <div className="subharti-diagonal-slash" />
                  <span className="subharti-head-days">DAYS</span>
                </div>
              </th>
              <th colSpan={5} className="subharti-th-morning-group">
                MORNING THEORY & TUTORIAL SESSIONS (08:00 AM – 01:00 PM)
              </th>
              <th rowSpan={2} className="subharti-th-lunch">
                <div className="subharti-lunch-head-box">
                  <Coffee size={14} className="subharti-lunch-icon" />
                  <span className="subharti-lunch-head-title">LUNCH</span>
                  <span className="subharti-lunch-head-time">01:00 PM – 02:00 PM</span>
                </div>
              </th>
              <th colSpan={1} className="subharti-th-afternoon-group">
                AFTERNOON PRACTICAL / LAB SESSION (02:00 PM – 04:00 PM)
              </th>
            </tr>

            {/* PERIOD TIME HEADER ROW */}
            <tr className="subharti-periods-head-row">
              <th className="subharti-period-head">
                <span className="subharti-period-time">08:00 AM – 09:00 AM</span>
                <span className="subharti-period-num">I</span>
              </th>
              <th className="subharti-period-head">
                <span className="subharti-period-time">09:00 AM – 10:00 AM</span>
                <span className="subharti-period-num">II</span>
              </th>
              <th className="subharti-period-head">
                <span className="subharti-period-time">10:00 AM – 11:00 AM</span>
                <span className="subharti-period-num">III</span>
              </th>
              <th className="subharti-period-head">
                <span className="subharti-period-time">11:00 AM – 12:00 PM</span>
                <span className="subharti-period-num">IV</span>
              </th>
              <th className="subharti-period-head">
                <span className="subharti-period-time">12:00 PM – 01:00 PM</span>
                <span className="subharti-period-num">V</span>
              </th>
              <th className="subharti-period-head subharti-head-lab">
                <span className="subharti-period-time">02:00 PM – 04:00 PM</span>
                <span className="subharti-period-num">VI–VII (2-HOUR LAB / PRACTICAL)</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {visibleDays.map((dayName) => {
              const dayDoc = scheduleDays.find((d) => d.dayOfWeek === dayName);
              const slots = dayDoc?.slots || [];

              // Period lookup helper
              const getSlot = (pNum, sTime) =>
                slots.find(
                  (s) => !s.isBreak && (s.periodNumber === pNum || s.startTime === sTime)
                );

              const p1 = getSlot(1, "08:00");
              const p2 = getSlot(2, "09:00");
              const p3 = getSlot(3, "10:00");
              const p4 = getSlot(4, "11:00");
              const p5 = getSlot(5, "12:00");
              const p7 = getSlot(7, "14:00") || slots.find((s) => !s.isBreak && s.startTime === "14:00");

              // Determine morning activity merges:
              // Thursday: SCA-YOGA spans Period 1 & 2 (08:00 - 10:00)
              const mergeP1P2 =
                dayName === "Thursday" ||
                (p1 &&
                  p2 &&
                  p1.subjectCode &&
                  p1.subjectCode === p2.subjectCode &&
                  p1.subject === p2.subject);

              // Tuesday: SCA-SPORTS spans Period 4 & 5 (11:00 - 01:00)
              const mergeP4P5 =
                dayName === "Tuesday" ||
                (p4 &&
                  p5 &&
                  p4.subjectCode &&
                  p4.subjectCode === p5.subjectCode &&
                  p4.subject === p5.subject);

              // Render a slot cell
              const renderSlotCell = (slot, pNum, defaultTime, colSpan = 1, isMergedActivity = false) => {
                const isSelectedForSwap =
                  swapMode.active &&
                  swapMode.source?.day === dayName &&
                  swapMode.source?.slot?.startTime === (slot?.startTime || defaultTime.split("-")[0].trim());

                if (!slot) {
                  return (
                    <td
                      key={pNum}
                      colSpan={colSpan}
                      className="subharti-td-empty"
                    >
                      {editable ? (
                        <button
                          type="button"
                          className="subharti-btn-add-slot no-print"
                          onClick={() => {
                            const [sTime, eTime] = defaultTime.split("-").map((t) => t.trim());
                            if (onAddSlot) {
                              onAddSlot(dayName, pNum, {
                                periodNumber: pNum,
                                startTime: sTime,
                                endTime: eTime,
                                type: pNum === 7 ? "Practical" : "Theory",
                                roomNo: pNum === 7 ? "Comp. Lab" : "Room No. 302"
                              });
                            }
                          }}
                        >
                          <Plus size={13} />
                          <span>Assign</span>
                        </button>
                      ) : (
                        <span className="subharti-empty-dash">—</span>
                      )}
                    </td>
                  );
                }

                const sIdx = slots.indexOf(slot);
                const isPractical =
                  slot.type === "Practical" ||
                  slot.type === "lab" ||
                  slot.isConsecutive ||
                  pNum === 7 ||
                  slot.subject?.toLowerCase().includes("lab");

                const isActivity =
                  slot.subjectCode === "PSCA-005P" ||
                  slot.subject?.toLowerCase().includes("sca") ||
                  slot.subject?.toLowerCase().includes("yoga") ||
                  slot.subject?.toLowerCase().includes("sports") ||
                  slot.subject?.toLowerCase().includes("cultural");

                return (
                  <td
                    key={pNum}
                    colSpan={colSpan}
                    className={`subharti-td-cell ${isPractical ? "cell-practical" : "cell-theory"} ${
                      isActivity ? "cell-activity" : ""
                    } ${isSelectedForSwap ? "cell-swap-active" : ""}`}
                    onClick={() => {
                      if (swapMode.active && onSlotClickForSwap) {
                        onSlotClickForSwap(dayName, sIdx, slot);
                      }
                    }}
                  >
                    <div className="subharti-cell-box">
                      {/* CELL HEADER ROW */}
                      <div className="subharti-cell-top">
                        <span
                          className={`subharti-badge-type ${
                            isActivity
                              ? "type-activity"
                              : isPractical
                              ? "type-practical"
                              : "type-theory"
                          }`}
                        >
                          {isMergedActivity
                            ? "2-Hr Activity"
                            : pNum === 7
                            ? "2-Hr Lab"
                            : slot.type || "Theory"}
                        </span>

                        {isOcrDraft && (
                          <span
                            className={`subharti-badge-ocr ${
                              slot.ocrConfidence === "review_needed" ? "ocr-review" : "ocr-high"
                            }`}
                          >
                            {slot.ocrConfidence === "review_needed" ? "Review" : "High Match"}
                          </span>
                        )}

                        {editable && (
                          <div className="subharti-cell-actions no-print">
                            {onEditSlot && (
                              <button
                                type="button"
                                className="subharti-btn-mini edit"
                                title="Edit Class Period"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditSlot(dayName, sIdx, slot);
                                }}
                              >
                                <Edit3 size={11} />
                              </button>
                            )}
                            {onDeleteSlot && (
                              <button
                                type="button"
                                className="subharti-btn-mini delete"
                                title="Remove Class Period"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSlot(dayName, sIdx);
                                }}
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* SUBJECT TITLE */}
                      <div className="subharti-subject-title">
                        {slot.lectureTitle || slot.subject}
                      </div>

                      {/* SUBJECT CODE */}
                      {slot.subjectCode && (
                        <div className="subharti-subject-code">
                          ({slot.subjectCode})
                        </div>
                      )}

                      {/* ROOM / LAB PILL */}
                      <div className="subharti-cell-meta-row">
                        <div className="subharti-meta-pill room">
                          <MapPin size={10} />
                          <span>{slot.roomNo || "Room No. 302"}</span>
                        </div>
                      </div>

                      {/* FACULTY LEAD */}
                      <div className="subharti-faculty-pill">
                        <User size={10} />
                        <span className="subharti-faculty-name">
                          {slot.teacherName || "Faculty Lead"}
                        </span>
                      </div>
                    </div>
                  </td>
                );
              };

              return (
                <tr key={dayName} className="subharti-day-row">
                  {/* DAY LABEL COLUMN */}
                  <td className="subharti-td-day">
                    <div className="subharti-day-name">{dayName.toUpperCase()}</div>
                    <div className="subharti-day-count no-print">
                      {slots.filter((s) => !s.isBreak).length} Classes
                    </div>
                  </td>

                  {/* PERIOD I & II */}
                  {mergeP1P2 ? (
                    renderSlotCell(p1, 1, "08:00 - 10:00", 2, true)
                  ) : (
                    <>
                      {renderSlotCell(p1, 1, "08:00 - 09:00", 1)}
                      {renderSlotCell(p2, 2, "09:00 - 10:00", 1)}
                    </>
                  )}

                  {/* PERIOD III */}
                  {renderSlotCell(p3, 3, "10:00 - 11:00", 1)}

                  {/* PERIOD IV & V */}
                  {mergeP4P5 ? (
                    renderSlotCell(p4, 4, "11:00 - 13:00", 2, true)
                  ) : (
                    <>
                      {renderSlotCell(p4, 4, "11:00 - 12:00", 1)}
                      {renderSlotCell(p5, 5, "12:00 - 13:00", 1)}
                    </>
                  )}

                  {/* LUNCH BREAK COLUMN */}
                  <td className="subharti-td-lunch">
                    <div className="subharti-lunch-cell-content">
                      <span className="subharti-lunch-text">LUNCH</span>
                    </div>
                  </td>

                  {/* AFTERNOON 2-HOUR PRACTICAL / LAB */}
                  {renderSlotCell(p7, 7, "14:00 - 16:00", 1, false)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. FACULTY LEGEND SECTION (Matching reference photograph bottom box) */}
      <div className="subharti-legend-box">
        <div className="subharti-legend-title">FACULTY ABBREVIATIONS & DESIGNATIONS</div>
        <div className="subharti-legend-grid">
          {SUBHARTI_FACULTY_LEGEND.map((f, idx) => (
            <div key={idx} className="subharti-legend-item">
              <span className="subharti-legend-abbr">{f.abbr}</span>
              <span className="subharti-legend-sep">–</span>
              <span className="subharti-legend-name">{f.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. AUTHORITY SIGNATURES SECTION (Matching reference photograph signatures) */}
      <div className="subharti-signatures-row">
        {/* HOD SIGNATURE */}
        <div className="subharti-sig-col">
          <div className="subharti-sig-script">Er. Reena Singh</div>
          <div className="subharti-sig-line" />
          <div className="subharti-sig-name">Er. REENA SINGH</div>
          <div className="subharti-sig-title">(HOD, CSE)</div>
        </div>

        {/* ACADEMIC COORDINATOR SIGNATURE */}
        <div className="subharti-sig-col">
          <div className="subharti-sig-script">Er. Amit Kumar</div>
          <div className="subharti-sig-line" />
          <div className="subharti-sig-name">Er. AMIT KUMAR</div>
          <div className="subharti-sig-title">(ACADEMIC COORDINATOR)</div>
        </div>

        {/* PRINCIPAL SIGNATURE & COLLEGE STAMP */}
        <div className="subharti-sig-col subharti-sig-principal">
          <div className="subharti-stamp-seal">
            <div className="subharti-stamp-circle">
              <span className="stamp-top">SUBHARTI POLYTECHNIC COLLEGE</span>
              <span className="stamp-center">PRINCIPAL</span>
              <span className="stamp-bottom">MEERUT * APPROVED</span>
            </div>
          </div>
          <div className="subharti-sig-script">Prof. S. C. Tiwari</div>
          <div className="subharti-sig-line" />
          <div className="subharti-sig-name">PROF. (DR.) S. C. TIWARI</div>
          <div className="subharti-sig-title">(PRINCIPAL)</div>
        </div>
      </div>
    </div>
  );
}
