const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  role: String,
});

module.exports = mongoose.model("User", userSchema, "staffdb"); // Use the correct collection name