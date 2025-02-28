const mongoose = require("mongoose");

const currentTaskSchema = new mongoose.Schema({
  taskID: { type: String, required: true, unique: true }, // Unique task ID
  batch: { type: Number, required: true },
  academicYear: { type: String, required: true },
  program: { type: String, required: true }, // "UG" or "PG"
  year:{ type: Number, required: true },
  semester: { type: String, required: true }, // "Odd" or "Even"
  ccm: { type: String, required: true }, // "CCM 1", "CCM 2", or "CCM 3"
  meetingType: { type: String, required: true }, // "Course" or "Class"
  deadlineStart: { type: Date, required: true },
  deadlineEnd: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: "Active" }, // "Active" or "Completed"
});

module.exports = mongoose.model("CurrentTask", currentTaskSchema, "currenttask");