import React, { useState, useEffect } from "react";
import { Calendar, Plus, Filter, Tag, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./CoordinatorCalendar.css";

const INITIAL_EVENTS = [
  { id: "EV-01", date: "01 Aug 2026", title: "Commencement of Academic Classes (Odd Semester)", tag: "Academic", description: "Classes begin for 1st, 3rd, and 5th Semester Diploma candidates across all branches.", status: "Completed" },
  { id: "EV-02", date: "15 Sep 2026", title: "First Mid-Semester Continuous Evaluation Test", tag: "Exam", description: "Unit Test 1 covering Units 1 & 2 of the polytechnic syllabus.", status: "Completed" },
  { id: "EV-03", date: "02 Oct 2026", title: "Gandhi Jayanti (National Holiday)", tag: "Holiday", description: "Campus closed in observance of Gandhi Jayanti.", status: "Completed" },
  { id: "EV-04", date: "20 Oct 2026", title: "Mid-Term Lab Practical Progress Review", tag: "Evaluation", description: "Continuous assessment of lab journals, CAD sheets, and workshop jobs.", status: "Ongoing" },
  { id: "EV-05", date: "15 Nov 2026", title: "Second Mid-Semester Evaluation & Internal Marks Finalization", tag: "Exam", description: "Unit Test 2 and internal assessment calculation based on attendance & lab viva.", status: "Upcoming" },
  { id: "EV-06", date: "28 Nov 2026", title: "Annual Polytechnic Technical Exhibition & Project Showcase", tag: "Event", description: "Display of final-year engineering prototypes, robotics and IoT projects.", status: "Upcoming" },
  { id: "EV-07", date: "10 Dec 2026", title: "Semester End Practical & External Viva Examinations", tag: "Board Exam", description: "BTEUP external practical viva conducted with appointed state examiners.", status: "Upcoming" },
  { id: "EV-08", date: "20 Dec 2026", title: "Commencement of Final Theory Board Examinations", tag: "Board Exam", description: "Final polytechnic diploma written board exams.", status: "Upcoming" }
];

export default function CoordinatorCalendar({ showToast }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    tag: "Academic",
    description: "",
    status: "Upcoming"
  });

  const loadEvents = () => {
    setLoading(true);
    authApi
      .getCalendarEvents()
      .then((res) => {
        if (res?.events && res.events.length > 0) {
          setEvents(res.events);
        } else {
          setEvents(INITIAL_EVENTS);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch calendar events:", err);
        setEvents(INITIAL_EVENTS);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) {
      showToast?.("Please provide event title and date", true);
      return;
    }
    setSubmitting(true);
    try {
      const res = await authApi.createCalendarEvent(newEvent);
      if (res?.event) {
        setEvents([res.event, ...events]);
      } else {
        const created = {
          ...newEvent,
          id: `EV-${Date.now()}`
        };
        setEvents([created, ...events]);
      }
      setShowAddModal(false);
      setNewEvent({ title: "", date: "", tag: "Academic", description: "", status: "Upcoming" });
      showToast?.("Academic calendar event added and saved to database!");
    } catch (err) {
      showToast?.(err.message || "Failed to create event.", true);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = events.filter((ev) => {
    if (filterTag !== "all" && ev.tag !== filterTag) return false;
    return true;
  });

  return (
    <div className="coord-cal-container">
      {/* Header */}
      <div className="coord-pane-header">
        <div>
          <h2>Subharti Polytechnic Academic Calendar (2025-2026)</h2>
          <p>
            Approved session roadmap for semester commencement, evaluations, holidays, and board examinations.
          </p>
        </div>

        <div className="coord-filter-controls">
          <select
            className="coord-filter-select"
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
            <option value="all">All Event Categories</option>
            <option value="Academic">Academic</option>
            <option value="Exam">Examinations</option>
            <option value="Evaluation">Lab Evaluations</option>
            <option value="Event">Events & Tech Fests</option>
            <option value="Holiday">Holidays</option>
            <option value="Board Exam">Board Examinations</option>
          </select>

          <button
            type="button"
            className="coord-add-ev-btn"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            <span>Add Calendar Event</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <Loader2 size={32} className="animate-spin text-primary" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        /* Events List */
        <div className="coord-events-timeline">
          {filtered.map((ev) => (
            <div key={ev.id || ev._id} className="coord-event-card">
              <div className="coord-ev-left">
                <span className="coord-ev-date">{ev.date}</span>
                <span className={`coord-ev-badge ${(ev.status || "Upcoming").toLowerCase().replace(" ", "-")}`}>
                  {ev.status || "Upcoming"}
                </span>
              </div>

              <div className="coord-ev-center">
                <h4>{ev.title}</h4>
                <p>{ev.description}</p>
              </div>

              <div className="coord-ev-right">
                <span className="coord-tag-pill">
                  <Tag size={12} />
                  <span>{ev.tag}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="coord-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="coord-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="coord-modal-header">
              <h3>Schedule Academic Event</h3>
              <button
                type="button"
                className="coord-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="coord-modal-form">
              <div className="coord-form-group">
                <label>Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. Mid-Term Theory Evaluation 2"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  required
                />
              </div>

              <div className="coord-form-row">
                <div className="coord-form-group">
                  <label>Event Date</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    required
                  />
                </div>

                <div className="coord-form-group">
                  <label>Category</label>
                  <select
                    value={newEvent.tag}
                    onChange={(e) => setNewEvent({ ...newEvent, tag: e.target.value })}
                  >
                    <option value="Academic">Academic</option>
                    <option value="Exam">Examinations</option>
                    <option value="Evaluation">Lab Evaluations</option>
                    <option value="Event">Events & Tech Fests</option>
                    <option value="Holiday">Holidays</option>
                    <option value="Board Exam">Board Examinations</option>
                  </select>
                </div>
              </div>

              <div className="coord-form-group">
                <label>Description & Scope</label>
                <textarea
                  rows={3}
                  placeholder="Provide syllabus chapters, designated batches, or institutional instructions..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
              </div>

              <div className="coord-form-group">
                <label>Initial Status</label>
                <select
                  value={newEvent.status}
                  onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value })}
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="coord-modal-actions">
                <button
                  type="button"
                  className="coord-btn-ghost"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="coord-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Publishing..." : "Publish Event to Calendar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
