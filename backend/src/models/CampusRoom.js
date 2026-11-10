import mongoose from "mongoose";

const campusRoomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    building: {
      type: String,
      required: true,
      default: "Academic Block A"
    },
    floor: {
      type: String,
      default: "1st Floor"
    },
    type: {
      type: String,
      enum: ["Classroom", "Computer Lab", "Engineering Workshop", "Electronics Lab", "Seminar Hall", "Library Study Room"],
      default: "Classroom"
    },
    capacity: {
      type: Number,
      required: true,
      default: 60
    },
    equipment: [
      {
        type: String
      }
    ],
    isAvailable: {
      type: Boolean,
      default: true
    },
    branch: {
      type: String,
      default: "ALL",
      trim: true
    },
    unavailableSlots: [
      {
        dayOfWeek: { type: String, trim: true },
        startTime: { type: String, trim: true },
        endTime: { type: String, trim: true },
        reason: { type: String, trim: true, default: "Maintenance / Reserved" }
      }
    ],
    currentAllocation: {
      subject: { type: String, default: "" },
      teacherName: { type: String, default: "" },
      branch: { type: String, default: "" },
      semester: { type: String, default: "" },
      timeSlot: { type: String, default: "" }
    }
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

const CampusRoom = mongoose.model("CampusRoom", campusRoomSchema);
export default CampusRoom;
