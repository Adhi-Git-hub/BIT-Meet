const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  batch: { type: Number, required: true }, // Batch year (e.g., 2024)
  academicYear: { type: String, required: true }, // Academic year (e.g., "2024-2025")
  program: { type: String, required: true }, // "UG" or "PG"
  semester: { type: String, required: true }, // "Semester 7"
  ccm: { type: String, required: true }, // "CCM 1", "CCM 2", or "CCM 3"
  meetingType: { type: String, required: true }, // "Course", "Class", or "Course+Class"
  deadlineStart: { type: Date, required: true }, // Start date of the deadline
  deadlineEnd: { type: Date, required: true }, // End date of the deadline
  createdAt: { type: Date, default: Date.now }, // Timestamp of task creation
  status: { type: String, default: "Active" }, // "Active" or "Completed"
});

module.exports = mongoose.model("Task", taskSchema, "currenttask");