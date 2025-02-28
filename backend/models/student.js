const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  studentName: { type: String, required: true }, // Faculty name
  rollNumber: { type: String, required: true, unique: true }, // Faculty ID (e.g., "21CT2034")
});

module.exports = mongoose.model("Student", studentSchema, "student");