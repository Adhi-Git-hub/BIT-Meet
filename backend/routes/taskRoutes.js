const express = require("express");
const CurrentTask = require("../models/CurrentTask");
const ActiveTask = require("../models/ActiveTask");
const Faculty = require("../models/Faculty");
const Student = require("../models/student");
const FacultySubmission = require("../models/FacultySubmission");
const FacultyCourseMapping = require("../models/FacultyCourseMapping");
const router = express.Router();
const nodemailer = require("nodemailer");

// Task Creation API
router.post("/create-task", async (req, res) => {
  const { batch, academicYear, program,year, semester, ccm, meetingType, deadlineStart, deadlineEnd } = req.body;

  try {   
    // Generate current task ID
    const currentTaskID = `${batch}${program}${year}${semester}${meetingType}${ccm}`;

    // Check for duplicates in currenttask collection
    const existingTask = await CurrentTask.findOne({ taskID: currentTaskID });
    if (existingTask) {
      return res.status(400).json({ message: "Task already exists for this batch, program, and semester." });
    }

    // Save the task to the currenttask collection
    const newTask = new CurrentTask({
      taskID: currentTaskID,
      batch,
      academicYear,
      program,
      year,
      semester,
      ccm,
      meetingType,
      deadlineStart: new Date(deadlineStart),
      deadlineEnd: new Date(deadlineEnd),
      createdAt: new Date(),
      status: "Active",
    });
    await newTask.save();

    // Save the task to the activetasks collection for faculties/HoDs
    if (meetingType === "Class") {
      // Send to all HoDs in the department
      const hods = await Faculty.find({ role: "hod" });
      hods.forEach(async (hod) => {
        const activeTaskID = `${currentTaskID}-${hod.department}`;
        const activeTask = new ActiveTask({
          taskID: activeTaskID,
          currentTaskID,
          batch,
          academicYear,
          program,
          department:hod.department,
          year,
          semester,
          ccm,
          meetingType: "Class",
          deadlineStart: new Date(deadlineStart),
          deadlineEnd: new Date(deadlineEnd),
          createdAt: new Date(),
          status: "Active",
          facultyID: hod.facultyID,
          facultyName: hod.facultyName,
          facultyemailID: hod.emailID,
        });
        await activeTask.save();
        sendEmail(hod.emailID, "New Task Created", `A new task has been created for ${ccm}.`);
      });
    } else if (meetingType === "Course") {
      // Send to course handling faculties
      const courses = await FacultyCourseMapping.find({ batch, semester });
      courses.forEach(async (course) => {
        const activeTaskID = `${currentTaskID}-${course.courseID}-${course.department}`;
        const activeTask = new ActiveTask({
          taskID: activeTaskID,
          currentTaskID,
          batch,
          academicYear,
          program,
          department:course.department,
          year,
          semester,
          ccm,
          meetingType: "Course",
          deadlineStart: new Date(deadlineStart),
          deadlineEnd: new Date(deadlineEnd),
          createdAt: new Date(),
          status: "Active",
          facultyID: course.facultyID,
          facultyName: course.facultyName,
          facultyemailID: course.facultyemailID,
        });
        await activeTask.save();
        sendEmail(course.facultyemailID, "New Task Created", `A new task has been created for ${ccm}.`);
      });
    }

    res.status(201).json({ message: "Task created successfully" });
  } catch (err) {
    console.error("Task Creation Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Email sending function
const sendEmail = (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Email Error:", err);
    } else {
      console.log("Email Sent:", info.response);
    }
  });
};
// Fetch all current tasks
router.get("/current-task", async (req, res) => {
  try {
    const tasks = await CurrentTask.find();
    res.json(tasks);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



// Fetch active tasks for a specific current task
router.get("/active-task/:currentTaskID", async (req, res) => {
  try {
    const tasks = await ActiveTask.find({ currentTaskID: req.params.currentTaskID });
    res.json(tasks);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Send reminder email
router.post("/send-reminder", async (req, res) => {
  const { taskID } = req.body;
  try {
    const task = await ActiveTask.findOne({ taskID });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    sendEmail(task.facultyemailID, "Reminder: Task Deadline Approaching", `Please complete the task (${task.taskID}) by ${task.deadlineEnd}.`);
    res.json({ message: "Reminder email sent successfully" });
  } catch (err) {
    console.error("Reminder Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Modify deadline for a task
router.put("/modify-deadline/:taskID", async (req, res) => {
  const { deadlineEnd } = req.body;
  try {
    await CurrentTask.updateOne({ taskID: req.params.taskID }, { deadlineEnd: new Date(deadlineEnd) });
    res.json({ message: "Deadline updated successfully" });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Fetch tasks assigned to a faculty member
router.get("/faculty-tasks/:email", async (req, res) => {
  try {
    const tasks = await ActiveTask.find({ facultyemailID: req.params.email });
    res.json(tasks);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch tasks assigned to an HoD
router.get("/hod-tasks/:email", async (req, res) => {
  try {
    const tasks = await ActiveTask.find({ facultyemailID: req.params.email, meetingType: "Class" });
    res.json(tasks);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch task details
router.get("/task-details/:taskID", async (req, res) => {
  try {
    const task = await ActiveTask.findOne({ taskID: req.params.taskID });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch faculty list
router.get("/faculty-list", async (req, res) => {
  try {
    const facultyList = await Faculty.find({}, { facultyID: 1, facultyName: 1 });
    res.json(facultyList);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch student list
router.get("/student-list", async (req, res) => {
  try {
    const studentList = await Student.find({}, { rollNumber: 1, studentName: 1 });
    res.json(studentList);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// Submit task
router.post("/submit-task", async (req, res) => {
  try {
    const submission = new FacultySubmission(req.body);
    await submission.save();
    res.json({ message: "Task submitted successfully" });
  } catch (err) {
    console.error("Submission Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove task from activetasks
router.delete("/remove-task/:taskID", async (req, res) => {
  try {
    await ActiveTask.deleteOne({ taskID: req.params.taskID });
    res.json({ message: "Task removed successfully" });
  } catch (err) {
    console.error("Remove Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;


