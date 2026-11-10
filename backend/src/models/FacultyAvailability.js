import mongoose from "mongoose";

const unavailableSlotSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true
    },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    reason: { type: String, trim: true, default: "Faculty unavailable / Research / Duty" }
  },
  { _id: true }
);

const preferredSlotSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true
    },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true }
  },
  { _id: true }
);

const facultyAvailabilitySchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    teacherName: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    maxWeeklyLoad: {
      type: Number,
      default: 20,
      min: 1,
      max: 40
    },
    availableDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    },
    unavailableSlots: [unavailableSlotSchema],
    preferredSlots: [preferredSlotSchema],
    approvedLeaves: [
      {
        startDate: { type: String, trim: true },
        endDate: { type: String, trim: true },
        reason: { type: String, trim: true, default: "Approved Leave" }
      }
    ],
    notes: {
      type: String,
      trim: true,
      default: ""
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

const FacultyAvailability = mongoose.model("FacultyAvailability", facultyAvailabilitySchema);
export default FacultyAvailability;
