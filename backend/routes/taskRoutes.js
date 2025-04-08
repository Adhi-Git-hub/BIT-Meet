const express = require("express");
const CurrentTask = require("../models/CurrentTask");
const ActiveTask = require("../models/ActiveTask");
const Faculty = require("../models/Faculty");
const Student = require("../models/student");
const FacultySubmission = require("../models/FacultySubmission");
const FacultyCourseMapping = require("../models/FacultyCourseMapping");
const router = express.Router();
const nodemailer = require("nodemailer");

// Email sending function
const sendEmail = (to, subject, htmlContent) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Use environment variables
      pass: process.env.EMAIL_PASSWORD, // Use environment variables
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: htmlContent,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error("Email Error:", err);
    } else {
      console.log("Email Sent:", info.response);
    }
  });
};

// Task Creation API

router.post("/create-task", async (req, res) => {
  const { batch, academicYear, program, year, semester, ccm, meetingType, deadlineStart, deadlineEnd } = req.body;

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
          department: hod.department,
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

        // Send email with task details
        const emailContent = `
          <div style="font-family: Arial, sans-serif; color: #333;">
          <h1>testing email, kindly ignore<h1>
            <h2 style="color: #007bff;">New Task Created</h2>
            <p>Dear ${hod.facultyName},</p>
            <p>A new task has been assigned to you. Please find the details below:</p>
            <ul>
              <li><strong>Task Name:</strong> Class Committee Meeting - ${ccm}</li>
              <li><strong>Task ID:</strong> ${activeTaskID}</li>
              <li><strong>Start Date:</strong> ${new Date(deadlineStart).toLocaleDateString()}</li>
              <li><strong>End Date:</strong> ${new Date(deadlineEnd).toLocaleDateString()}</li>
              <li><strong>Meeting Type:</strong> Class</li>
              <li><strong>CCM:</strong> ${ccm}</li>
            </ul>
            <p>To start working on the task, click the link below:</p>
            <a href="http://localhost:3000/task/${activeTaskID}" style="background-color: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Start Task</a>
            <p>If you have any questions, please contact your administrator.</p>
            <p>Best regards,</p>
            <p><strong>Class and Course Committee Automation System</strong></p>
          </div>
        `;
        sendEmail(hod.emailID, "New Task Created", emailContent);
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
          department: course.department,
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

        // Send email with task details
        const emailContent = `
          <div style="font-family: Arial, sans-serif; color: #333;">
          <h1>testing email, kindly ignore<h1>
            <h2 style="color: #007bff;">New Task Created</h2>
            <p>Dear ${course.facultyName},</p>
            <p>A new task has been assigned to you. Please find the details below:</p>
            <ul>
              <li><strong>Task Name:</strong> Course Committee Meeting - ${ccm}</li>
              <li><strong>Task ID:</strong> ${activeTaskID}</li>
              <li><strong>Start Date:</strong> ${new Date(deadlineStart).toLocaleDateString()}</li>
              <li><strong>End Date:</strong> ${new Date(deadlineEnd).toLocaleDateString()}</li>
              <li><strong>Meeting Type:</strong> Course</li>
              <li><strong>CCM:</strong> ${ccm}</li>
            </ul>
            <p>To start working on the task, click the link below:</p>
            <a href="http://localhost:3000/task/${activeTaskID}" style="background-color: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Start Task</a>
            <p>If you have any questions, please contact your administrator.</p>
            <p>Best regards,</p>
            <p><strong>Class and Course Committee Automation System</strong></p>
          </div>
        `;
        sendEmail(course.facultyemailID, "New Task Created", emailContent);
      });
    }

    res.status(201).json({ message: "Task created successfully" });
  } catch (err) {
    console.error("Task Creation Error:", err);
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

    const emailContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
      <h1>testing email, kindly ignore<h1>
        <h2 style="color: #007bff;">Reminder: Task Deadline Approaching</h2>
        <p>Dear ${task.facultyName},</p>
        <p>This is a reminder that the deadline for the following task is approaching:</p>
        <ul>
          <li><strong>Task Name:</strong> ${task.meetingType} Committee Meeting - ${task.ccm}</li>
          <li><strong>Task ID:</strong> ${task.taskID}</li>
          <li><strong>End Date:</strong> ${new Date(task.deadlineEnd).toLocaleDateString()}</li>
        </ul>
        <p>Please ensure that the task is completed before the deadline.</p>
        <p>To view the task, click the link below:</p>
        <a href="http://localhost:3000/faculty/facultytasksub/${task.taskID}" style="background-color: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Task</a>
        <p>If you have any questions, please contact your administrator.</p>
        <p>Best regards,</p>
        <p><strong>Class and Course Committee Automation System</strong></p>
      </div>
    `;
    sendEmail(task.facultyemailID, "Reminder: Task Deadline Approaching", emailContent);

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
    // Update deadline in the CurrentTask collection
    await CurrentTask.updateOne({ taskID: req.params.taskID }, { deadlineEnd: new Date(deadlineEnd) });

    // Fetch the task details to send an email notification
    const task = await CurrentTask.findOne({ taskID: req.params.taskID });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Fetch the faculty/HoD assigned to this task
    const activeTasks = await ActiveTask.find({ currentTaskID: task.taskID });
    if (activeTasks.length === 0) {
      return res.status(404).json({ message: "No active tasks found for this task ID." });
    }

    // Send email notification to all assigned faculty/HoD
    activeTasks.forEach((activeTask) => {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
        <h1>testing email, kindly ignore</h1>
          <h2 style="color: #007bff;">Deadline Extended</h2>
          <p>Dear ${activeTask.facultyName},</p>
          <p>The deadline for the following task has been extended:</p>
          <ul>
            <li><strong>Task Name:</strong> ${activeTask.meetingType} Committee Meeting - ${activeTask.ccm}</li>
            <li><strong>Task ID:</strong> ${activeTask.taskID}</li>
            <li><strong>New End Date:</strong> ${new Date(deadlineEnd).toLocaleDateString()}</li>
          </ul>
          <p>Please ensure that the task is completed before the new deadline.</p>
          <p>To view the task, click the link below:</p>
          <a href="http://localhost:3000/faculty/facultytasksub/${activeTask.taskID}" style="background-color: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Task</a>
          <p>If you have any questions, please contact your administrator.</p>
          <p>Best regards,</p>
          <p><strong>Class and Course Committee Automation System</strong></p>
        </div>
      `;
      sendEmail(activeTask.facultyemailID, "Deadline Extended", emailContent);
    });

    res.json({ message: "Deadline updated successfully" });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});




// Other APIs (unchanged)
// ...

// Reject and remove a task
// Add this new route to your existing taskRoutes.js
router.delete("/reject-task/:taskID", async (req, res) => {
  try {
    // Remove from FacultySubmission collection
    const result = await FacultySubmission.deleteOne({ taskID: req.params.taskID });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    res.json({ message: "Task rejected and removed successfully" });
  } catch (err) {
    console.error("Rejection Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
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





// Get all faculty submissions with optional filtering
router.get("/faculty-submissions/filtered", async (req, res) => {
  try {
    const { academicYear, department, semester, meetingType, ccm, search } = req.query;
    
    let query = {};
    
    if (academicYear) query.academicYear = academicYear;
    if (department) query.department = department;
    if (semester) query.semester = semester;
    if (meetingType) query.meetingType = meetingType;
    if (ccm) query.ccm = ccm;
    
    if (search) {
      query.$or = [
        { taskID: { $regex: search, $options: 'i' } },
        { preparedBy: { $regex: search, $options: 'i' } },
        { approvedBy: { $regex: search, $options: 'i' } }
      ];
    }

    const submissions = await FacultySubmission.find(query)
      .sort({ date: -1 }); // Sort by most recent first

    // Get distinct values for filters
    const academicYears = await FacultySubmission.distinct("academicYear");
    const departments = await FacultySubmission.distinct("department");
    const semesters = await FacultySubmission.distinct("semester");
    const meetingTypes = await FacultySubmission.distinct("meetingType");
    const ccms = await FacultySubmission.distinct("ccm");

    res.json({
      submissions,
      filters: {
        academicYears,
        departments,
        semesters,
        meetingTypes,
        ccms
      }
    });
  } catch (err) {
    console.error("Filter Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});





// Get submissions for a specific task
router.get("/submissions-by-task/:taskID", async (req, res) => {
  try {
    const submissions = await FacultySubmission.find({
      taskID: { $regex: req.params.taskID }
    });
    res.json(submissions);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get submission statistics
router.get("/submission-stats/:taskID", async (req, res) => {
  try {
    const allSubmissions = await FacultySubmission.find({
      taskID: { $regex: req.params.taskID }
    });
    
    const approved = allSubmissions.filter(s => s.status === "Approved").length;
    const pending = allSubmissions.filter(s => s.status === "Not Approved").length;
    
    res.json({
      total: allSubmissions.length,
      approved,
      pending
    });
  } catch (err) {
    console.error("Fetch Error:", err);
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

// Fetch tasks by  faculty member
router.get("/faculty-tasks/:email", async (req, res) => {
  try {
    const tasks = await FacultySubmission.find({ facultyemailID: req.params.email });
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

// Fetch submissions by department
router.get("/faculty-submissions-by-department/:department", async (req, res) => {
  try {
    const submissions = await FacultySubmission.find({ department: req.params.department });
    res.json(submissions);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch all faculty submissions
router.get("/faculty-submissions", async (req, res) => {
  try {
    const submissions = await FacultySubmission.find();
    res.json(submissions);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Approve a task
router.put("/approve-task/:taskID", async (req, res) => {
  try {
    const { status } = req.body;
    await FacultySubmission.updateOne({ taskID: req.params.taskID }, { status });
    res.json({ message: "Task approved successfully" });
  } catch (err) {
    console.error("Approval Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/faculty-tasks/:email", async (req, res) => {
  try {
    const tasks = await FacultySubmission.find({ facultyemailID: req.params.email });
    res.json(tasks);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Approve a task
router.put("/approve-task/:taskID", async (req, res) => {
  try {
    const { status } = req.body;
    await FacultySubmission.updateOne({ taskID: req.params.taskID }, { status });
    res.json({ message: "Task approved successfully" });
  } catch (err) {
    console.error("Approval Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Fetch faculty by email
router.get("/faculty-by-email/:email", async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ emailID: req.params.email });
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found." });
    }
    res.json(faculty);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//FacultySubmission
router.get("/faculty-submissions/:facultyName", async (req, res) => {
  try {
    const submissions = await FacultySubmission.find({ preparedBy: req.params.facultyName });
    res.json(submissions);
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
    // Extract only important details from the request body
    const { taskID, academicYear, department, semester, preparedBy, approvedBy, meetingType, ccm, taskPDF } = req.body;

    // Create a new submission with only important details
    const submission = new FacultySubmission({
      taskID,
      academicYear,
      department,
      semester,
      preparedBy,
      approvedBy,
      meetingType,
      ccm,
      taskPDF, // Store the PDF data
      status: "Not Approved",
    });

    await submission.save();
    res.json({ message: "Task submitted successfully" });
  } catch (err) {
    console.error("Submission Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/faculty-by-email/:email", async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ emailID: req.params.email });
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found." });
    }
    res.json(faculty);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/faculty-submissions", async (req, res) => {
  try {
    const submissions = await FacultySubmission.find();
    res.json(submissions);
  } catch (err) {
    console.error("Fetch Error:", err);
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