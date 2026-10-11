const mongoose = require("mongoose");

const APPLICATION_STATUSES = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Rejected",
];

const applicationSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },

    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
      maxlength: [100, "Position cannot exceed 100 characters"],
    },

    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
      default: "",
    },

    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: "Applied",
    },

    appliedAt: {
      type: Date,
      default: Date.now,
    },

    followUpAt: {
      type: Date,
      default: null,
    },

    jobUrl: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2048, "Job URL is too long"],
    },

    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Notes cannot exceed 2000 characters"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

applicationSchema.index({ status: 1, appliedAt: -1 });

module.exports = mongoose.model("Application", applicationSchema);