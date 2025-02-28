const mongoose = require("mongoose");

const activeTaskSchema = new mongoose.Schema({
  taskID: { type: String, required: true, unique: true }, // Unique task ID
  currentTaskID: { type: String, required: true }, // Reference to currenttask
  batch: { type: Number, required: true },
  academicYear: { type: String, required: true },
  program: { type: String, required: true }, // "UG" or "PG"
  department: { type: String, required: true },
  semester: { type: String, required: true }, // "Odd" or "Even"
  year:{ type: Number, required: true },
  ccm: { type: String, required: true }, // "CCM 1", "CCM 2", or "CCM 3"
  meetingType: { type: String, required: true }, // "Course" or "Class"
  deadlineStart: { type: Date, required: true },
  deadlineEnd: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: "Active" }, // "Active" or "Completed"
  facultyID: { type: String, required: true },
  facultyName: { type: String, required: true },
  facultyemailID: { type: String, required: true },
});

module.exports = mongoose.model("ActiveTask", activeTaskSchema, "activetasks");