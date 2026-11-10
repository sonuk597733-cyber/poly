import React, { useState, useEffect } from "react";
import { MapPin, Building2, Search, Plus, CheckCircle2, AlertCircle, Wrench, Loader2 } from "lucide-react";
import { authApi } from "../../services/authApi";
import "./CoordinatorRooms.css";

const INITIAL_ROOMS = [
  { id: "LT-101", name: "Lecture Theater 101", type: "Lecture Theater", capacity: 90, equipment: "Smart Interactive Projector, Audio System, Wi-Fi 6", occupancy: "CSE Sem 3 (Operating Systems)", status: "Occupied", floor: "Ground Floor" },
  { id: "LT-102", name: "Lecture Theater 102", type: "Lecture Theater", capacity: 90, equipment: "Digital Podium, Dual Displays, AC", occupancy: "ME Sem 5 (Thermodynamics)", status: "Occupied", floor: "Ground Floor" },
  { id: "LT-103", name: "Lecture Theater 103", type: "Lecture Theater", capacity: 80, equipment: "Smart Board, Collar Microphone System", occupancy: "EE Sem 1 (Circuit Analysis)", status: "Occupied", floor: "1st Floor" },
  { id: "LT-104", name: "Lecture Theater 104", type: "Lecture Theater", capacity: 80, equipment: "Overhead Projector, Whiteboard", occupancy: "Available for Booking", status: "Available", floor: "1st Floor" },
  { id: "LAB-01", name: "Computer Lab 1 (Software)", type: "Computer Lab", capacity: 45, equipment: "45 Core-i7 Workstations, Dual OS, Gigabit LAN", occupancy: "CSE Sem 3 (Data Structures Lab)", status: "Occupied", floor: "2nd Floor" },
  { id: "LAB-02", name: "Computer Lab 2 (Networks)", type: "Computer Lab", capacity: 40, equipment: "40 Workstations, Cisco Routers Rack, Wireshark", occupancy: "IT Sem 5 (Network Security Lab)", status: "Occupied", floor: "2nd Floor" },
  { id: "LAB-03", name: "Hardware & Microprocessor Lab", type: "Hardware Lab", capacity: 35, equipment: "8085/8086 Microprocessor Kits, Digital Trainers", occupancy: "ECE Sem 4 (Microprocessor Lab)", status: "Occupied", floor: "Ground Floor" },
  { id: "LAB-04", name: "CAD / CAM Laboratory", type: "Engineering Lab", capacity: 40, equipment: "AutoCAD & SolidWorks Workstations, 3D Printer", occupancy: "ME Sem 3 (Machine Drawing Lab)", status: "Occupied", floor: "Workshop Wing" },
  { id: "SEM-01", name: "Central Polytechnic Seminar Hall", type: "Auditorium", capacity: 250, equipment: "Stage AV, Dual HD Projectors, Motorized Screen", occupancy: "Available for Academic Seminars", status: "Available", floor: "3rd Floor" },
  { id: "WS-01", name: "Mechanical Fitting & Carpentry Workshop", type: "Workshop", capacity: 60, equipment: "Lathes, Milling Machines, Shaping Machines", occupancy: "Scheduled Maintenance & Tool Calibration", status: "Maintenance", floor: "Workshop Wing" }
];

export default function CoordinatorRooms({ showToast }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [allocation, setAllocation] = useState({
    roomId: "LT-104",
    purpose: "",
    branchSem: "",
    duration: "1 Hour"
  });

  const loadRooms = () => {
    setLoading(true);
    authApi
      .getRooms()
      .then((res) => {
        if (res?.rooms && res.rooms.length > 0) {
          const mapped = res.rooms.map((r) => ({
            id: r.roomNumber || r._id,
            mongoId: r._id,
            name: r.name || `Room ${r.roomNumber}`,
            type: r.type || "Lecture Theater",
            capacity: r.capacity || 80,
            equipment: Array.isArray(r.equipment) ? r.equipment.join(", ") : r.equipment || "Standard Classroom AV",
            occupancy: r.allocatedTo ? `${r.allocatedTo} (${r.allocationPurpose || "Class"})` : "Available for Booking",
            status: r.currentStatus === "occupied" ? "Occupied" : r.currentStatus === "maintenance" ? "Maintenance" : "Available",
            floor: r.floor || "1st Floor"
          }));
          setRooms(mapped);
          if (mapped.length > 0 && !mapped.some((m) => m.id === allocation.roomId)) {
            setAllocation((prev) => ({ ...prev, roomId: mapped[0].id }));
          }
        } else {
          setRooms(INITIAL_ROOMS);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load rooms:", err);
        setRooms(INITIAL_ROOMS);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const filtered = rooms.filter((r) => {
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (r.name || "").toLowerCase().includes(q) || (r.id || "").toLowerCase().includes(q);
      const matchOcc = (r.occupancy || "").toLowerCase().includes(q);
      return matchName || matchOcc;
    }
    return true;
  });

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!allocation.purpose || !allocation.branchSem) {
      showToast?.("Please complete allocation details", true);
      return;
    }
    setSubmitting(true);
    try {
      const targetRoom = rooms.find((r) => r.id === allocation.roomId);
      const targetId = targetRoom?.mongoId || allocation.roomId;

      await authApi.allocateRoom(targetId, {
        currentStatus: "occupied",
        allocatedTo: allocation.branchSem,
        allocationPurpose: allocation.purpose
      });

      const updated = rooms.map((r) => {
        if (r.id === allocation.roomId) {
          return {
            ...r,
            status: "Occupied",
            occupancy: `${allocation.branchSem} (${allocation.purpose})`
          };
        }
        return r;
      });
      setRooms(updated);
      setShowAllocateModal(false);
      setAllocation({ roomId: rooms[0]?.id || "LT-104", purpose: "", branchSem: "", duration: "1 Hour" });
      showToast?.(`Room ${allocation.roomId} allocated and recorded in database!`);
    } catch (err) {
      showToast?.(err.message || "Failed to allocate room", true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelease = async (roomId) => {
    try {
      const targetRoom = rooms.find((r) => r.id === roomId);
      const targetId = targetRoom?.mongoId || roomId;

      await authApi.allocateRoom(targetId, {
        currentStatus: "available",
        allocatedTo: "",
        allocationPurpose: ""
      });

      const updated = rooms.map((r) => {
        if (r.id === roomId) {
          return {
            ...r,
            status: "Available",
            occupancy: "Available for Booking"
          };
        }
        return r;
      });
      setRooms(updated);
      showToast?.(`Room ${roomId} has been marked Available and saved.`);
    } catch (err) {
      showToast?.(err.message || "Failed to release room", true);
    }
  };

  return (
    <div className="coord-rooms-container">
      {/* Header */}
      <div className="coord-pane-header">
        <div>
          <h2>Lecture Theaters & Specialized Labs Allocation</h2>
          <p>
            Real-time classroom capacity, equipment status, active bookings, and lab allocation management.
          </p>
        </div>

        <div className="coord-filter-controls">
          <div className="coord-search-box">
            <Search size={16} color="#64748B" />
            <input
              type="text"
              placeholder="Search by room name, code, or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="coord-filter-select"
            value={typeFilter}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Room Categories</option>
            <option value="Lecture Theater">Lecture Theaters</option>
            <option value="Computer Lab">Computer Labs</option>
            <option value="Hardware Lab">Hardware Labs</option>
            <option value="Engineering Lab">Engineering Labs</option>
            <option value="Auditorium">Seminar Halls</option>
            <option value="Workshop">Workshops</option>
          </select>

          <button
            type="button"
            className="coord-add-ev-btn"
            onClick={() => setShowAllocateModal(true)}
          >
            <Plus size={16} />
            <span>Book / Allocate Room</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <Loader2 size={32} className="animate-spin text-primary" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : (
        /* Rooms Grid */
        <div className="coord-rooms-grid">
          {filtered.map((r) => (
            <div key={r.id} className="coord-room-card">
              <div className="coord-room-card-head">
                <div>
                  <span className="coord-room-id">{r.id}</span>
                  <h4>{r.name}</h4>
                  <span className="coord-room-floor">{r.floor}</span>
                </div>
                <span className={`coord-room-status-badge ${r.status.toLowerCase()}`}>
                  {r.status}
                </span>
              </div>

              <div className="coord-room-details">
                <div className="coord-room-metric">
                  <span className="label">Capacity</span>
                  <span className="val">{r.capacity} Seats</span>
                </div>
                <div className="coord-room-metric">
                  <span className="label">Current Occupancy</span>
                  <span className="val occupancy">{r.occupancy}</span>
                </div>
                <div className="coord-room-equip">
                  <span className="label">Installed Equipment:</span>
                  <p>{r.equipment}</p>
                </div>
              </div>

              <div className="coord-room-actions">
                {r.status === "Occupied" ? (
                  <button
                    type="button"
                    className="coord-btn-ghost-sm"
                    onClick={() => handleRelease(r.id)}
                  >
                    Release Booking
                  </button>
                ) : (
                  <button
                    type="button"
                    className="coord-btn-primary-sm"
                    onClick={() => {
                      setAllocation({ ...allocation, roomId: r.id });
                      setShowAllocateModal(true);
                    }}
                  >
                    Allocate Session
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Allocate Room Modal */}
      {showAllocateModal && (
        <div className="coord-modal-backdrop" onClick={() => setShowAllocateModal(false)}>
          <div className="coord-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="coord-modal-header">
              <h3>Allocate Classroom or Lab</h3>
              <button
                type="button"
                className="coord-modal-close"
                onClick={() => setShowAllocateModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAllocate} className="coord-modal-form">
              <div className="coord-form-group">
                <label>Select Facility</label>
                <select
                  value={allocation.roomId}
                  onChange={(e) => setAllocation({ ...allocation, roomId: e.target.value })}
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id} — {r.name} ({r.capacity} seats, {r.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="coord-form-row">
                <div className="coord-form-group">
                  <label>Batch / Section</label>
                  <input
                    type="text"
                    placeholder="e.g. CSE-3A (Sem 5)"
                    value={allocation.branchSem}
                    onChange={(e) => setAllocation({ ...allocation, branchSem: e.target.value })}
                    required
                  />
                </div>

                <div className="coord-form-group">
                  <label>Duration</label>
                  <select
                    value={allocation.duration}
                    onChange={(e) => setAllocation({ ...allocation, duration: e.target.value })}
                  >
                    <option value="1 Hour">1 Hour (Single Period)</option>
                    <option value="2 Hours">2 Hours (Lab Practical Block)</option>
                    <option value="3 Hours">3 Hours (Workshop Session)</option>
                    <option value="Full Day">Full Day (Exam / Event)</option>
                  </select>
                </div>
              </div>

              <div className="coord-form-group">
                <label>Subject / Session Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Operating Systems Kernel Lab or Remedial Class"
                  value={allocation.purpose}
                  onChange={(e) => setAllocation({ ...allocation, purpose: e.target.value })}
                  required
                />
              </div>

              <div className="coord-modal-actions">
                <button
                  type="button"
                  className="coord-btn-ghost"
                  onClick={() => setShowAllocateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="coord-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Allocating..." : "Confirm Room Allocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
