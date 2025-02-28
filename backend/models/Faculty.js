const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema({
  facultyName: { type: String, required: true }, // Faculty name
  facultyID: { type: String, required: true, unique: true }, // Faculty ID (e.g., "21CT2034")
  role: { type: String, required: true }, // "faculty" or "hod"
  department: { type: String, required: true }, // Department (e.g., "AD", "CT", "CSE")
  emailID: { type: String, required: true, unique: true }, // Faculty email
});

module.exports = mongoose.model("Faculty", facultySchema, "faculty");