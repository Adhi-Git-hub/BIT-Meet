const mongoose = require("mongoose");

const facultyCourseMappingSchema = new mongoose.Schema({
  batch: { type: Number, required: true },
  year: { type: Number, required: true },
  semester: { type: String, required: true }, // "Odd" or "Even"
  department: { type: String, required: true },
  courseID: { type: String, required: true },
  courseName: { type: String, required: true },
  facultyID: { type: String, required: true },
  facultyName: { type: String, required: true },
  facultyemailID: { type: String, required: true },
});

module.exports = mongoose.model("FacultyCourseMapping", facultyCourseMappingSchema, "faculty-course-mapping");