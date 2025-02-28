const express = require("express");
const Faculty = require("../models/Faculty");
const router = express.Router();

// Login API
router.post("/login", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await Faculty.findOne({ emailID: email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    res.json({ role: user.role });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;