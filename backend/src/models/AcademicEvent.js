import mongoose from "mongoose";

const academicEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    category: {
      type: String,
      enum: ["Academic", "Examination", "Holiday", "Sports & Fitness", "Technical Workshop", "Faculty Development", "Cultural"],
      default: "Academic",
      index: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    location: {
      type: String,
      default: "Campus Auditorium"
    },
    branch: {
      type: String,
      default: "ALL",
      index: true
    },
    department: {
      type: String,
      default: ""
    },
    coordinatorFaculty: {
      type: String,
      default: ""
    },
    approvalStatus: {
      type: String,
      enum: ["draft", "submitted", "approved", "completed", "cancelled"],
      default: "approved",
      index: true
    },
    registeredStudentsCount: {
      type: Number,
      default: 0
    },
    maxParticipants: {
      type: Number,
      default: 120
    },
    targetRoles: [
      {
        type: String,
        default: ["ALL"]
      }
    ],
    isHoliday: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
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

const AcademicEvent = mongoose.model("AcademicEvent", academicEventSchema);
export default AcademicEvent;
