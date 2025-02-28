const mongoose = require("mongoose");

const facultySubmissionSchema = new mongoose.Schema({
  taskID: { type: String, required: true }, // Task ID
  academicYear: { type: String, required: true }, // Academic Year
  department: { type: String, required: true }, // Department
  semester: { type: String, required: true }, // Semester
  date: { type: Date, default: Date.now }, // Submission Date
  chairPerson: { type: String, required: true }, // Chair Person
  facultyPresent: [
    {
      facultyID: { type: String, required: true }, // Faculty ID
      facultyName: { type: String, required: true }, // Faculty Name
    },
  ], // List of Faculty Members Present
  studentsPresent: [
    {
      rollNumber: { type: String, required: true }, // Student Roll Number
      studentName: { type: String, required: true }, // Student Name
    },
  ], // List of Student Members Present
  previousMeetingDate: { type: Date }, // Date of Previous Meeting (for CCM II and III)
  pendingIssues: [
    {
      issue: { type: String }, // Pending Issue / Deviation
      reason: { type: String }, // Reason for Pending / Deviation
      correctiveAction: { type: String }, // Corrective Action
      responsibility: { type: String }, // Responsibility (Faculty ID)
      targetDate: { type: Date }, // Target Date
      targetAchieved: { type: String }, // Target Achieved
    },
  ], // Pending Issues (for CCM II and III)
  minutes: [
    {
      point: { type: String, required: true }, // Point Discussed
      actionPlanned: { type: String, required: true }, // Action Planned
      responsibility: { type: String, required: true }, // Responsibility (Faculty ID)
      targetDate: { type: Date, required: true }, // Target Date
      targetAchieved: { type: String, required: true }, // Target Achieved
    },
  ], // Meeting Minutes
  preparedBy: { type: String, required: true }, // Prepared By (Faculty Name)
  approvedBy: { type: String, required: true }, // Approved By (HOD Name)
  meetingType: { type: String, required: true }, // Meeting Type (CCM I, CCM II, CCM III)
  ccm: { type: String, required: true }, // CCM Type (I, II, III)
  taskPDF: { type: Object, required: true }, // PDF Data
  status: { type: String, default: "Not Approved" }, // Submission Status
});

module.exports = mongoose.model("FacultySubmission", facultySubmissionSchema);