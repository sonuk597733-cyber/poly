import mongoose from "mongoose";
import { ALLOWED_BRANCHES } from "./User.js";

const maintenanceLogSchema = new mongoose.Schema(
  {
    issue: {
      type: String,
      required: true,
      trim: true
    },
    reportedDate: {
      type: Date,
      default: Date.now
    },
    resolvedDate: {
      type: Date,
      default: null
    },
    cost: {
      type: Number,
      default: 0
    },
    technician: {
      type: String,
      trim: true,
      default: ""
    },
    status: {
      type: String,
      enum: ["reported", "in_repair", "resolved"],
      default: "reported"
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { _id: true }
);

const labEquipmentSchema = new mongoose.Schema(
  {
    branch: {
      type: String,
      enum: ALLOWED_BRANCHES,
      required: true,
      index: true
    },
    labName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true
    },
    equipmentName: {
      type: String,
      required: true,
      trim: true
    },
    assetTag: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    category: {
      type: String,
      enum: [
        "Computing & Workstation",
        "Networking Gear",
        "Embedded & IoT",
        "Measurement & Testing",
        "Robotics & Automation",
        "Power & Electrical",
        "General Hardware"
      ],
      default: "Computing & Workstation"
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1
    },
    specifications: {
      type: String,
      trim: true,
      default: ""
    },
    purchaseDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["operational", "maintenance", "damaged", "decommissioned"],
      default: "operational",
      index: true
    },
    inChargeFaculty: {
      type: String,
      trim: true,
      default: ""
    },
    labAssistant: {
      type: String,
      trim: true,
      default: ""
    },
    maintenanceLogs: {
      type: [maintenanceLogSchema],
      default: []
    },
    utilizationSchedule: [
      {
        dayOfWeek: { type: String, default: "Monday" },
        timeSlot: { type: String, default: "10:00 AM - 01:00 PM" },
        semester: { type: String, default: "Semester 5" },
        subject: { type: String, default: "Advanced Lab" }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

const LabEquipment = mongoose.model("LabEquipment", labEquipmentSchema);
export default LabEquipment;
