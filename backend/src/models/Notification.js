import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    recipientRole: {
      type: String,
      default: null,
      index: true
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true
    },
    type: {
      type: String,
      enum: ["info", "warning", "success", "alert"],
      default: "info"
    },
    link: {
      type: String,
      default: ""
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
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

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
