const mongoose = require("mongoose");

const facultySubmissionSchema = new mongoose.Schema({
  taskID: { type: String, required: true }, // Task ID
  academicYear: { type: String, required: true }, // Academic Year
  department: { type: String, required: true }, // Department
  semester: { type: String, required: true }, // Semester
  date: { type: Date, default: Date.now }, // Submission Date
  preparedBy: { type: String, required: true }, // Prepared By (Faculty Name)
  approvedBy: { type: String, required: false }, // Approved By (HOD Name)
  meetingType: { type: String, required: true }, // Meeting Type (CCM I, CCM II, CCM III)
  ccm: { type: String, required: true }, // CCM Type (I, II, III)
  taskPDF: { type: Object, required: true }, // PDF Data
  status: { type: String, default: "Not Approved" }, // Submission Status
});

module.exports = mongoose.model("FacultySubmission", facultySubmissionSchema);