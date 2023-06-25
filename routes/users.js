const User = require("../models/userModel");
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const restrictToRole = require("../middleware/restrictToRole");


const router = express.Router();

const multer = require('multer');

// Set up Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify the destination folder for uploaded files
    },
    filename: (req, file, cb) => {
        const uniquePrefix = Date.now() + '-';
        cb(null, uniquePrefix + file.originalname); // Set a unique filename for the uploaded file
    },
});

// Create the Multer instance
const upload = multer({ storage: storage });

// Controller functions
const {
    generateToken,
    loginUser,
    viewAttendance,
    complaintsForm,
    registerCourses,
    markAttendance,
    addStudent,
    getCourses,
    getComplaints,
    createCourse,
    adminGetCourses,
    adminGetStudents,
    adminGetTeachers,
    addTeacher,
    getActivity,
    getComplaintsData,
    updateStudent,
    updateCourse,
    updateTeacher,
    updateComplaint,
    deleteStudent,
    deleteCourse,
    deleteTeacher,
    deleteComplaint,
    getTeacherCourses,
    setupAttendance,
    getAttendance,
    uploadAttendance
} = require("../controllers/userController");



router.post("/login", loginUser);
router.post("/generateToken", generateToken)
router.post("/markAttendance", markAttendance)


// Middleware
router.use(authMiddleware);


// Temporary token for attendance marking


// STUDENT ROUTES

const studentRouter = express.Router();
// studentRouter.use(restrictToRole("S"));
studentRouter.get("/viewattendance/:studentUsername/:courseId", viewAttendance);
studentRouter.get("/courses/:username", getCourses);
studentRouter.get("/getCourses", adminGetCourses);

studentRouter.post("/complaintsform/:username", upload.single("photo"), complaintsForm);

studentRouter.post("/registerCourses/:username", registerCourses)
// ADMIN ROUTES
const adminRouter = express.Router();
// adminRouter.use(restrictToRole("A"));
adminRouter.get("/complaints", getComplaints);
adminRouter.get("/getCourses", adminGetCourses);
adminRouter.get("/getStudents", adminGetStudents);
adminRouter.get("/getTeachers", adminGetTeachers);
adminRouter.get("/activity", getActivity);
adminRouter.get("/complaintsData", getComplaintsData);
adminRouter.post("/addStudent", addStudent);
adminRouter.post("/createCourse", createCourse);
adminRouter.post("/addTeacher", addTeacher);
adminRouter.put("/updateStudent/:studentId", updateStudent);
adminRouter.put("/updateCourse/:courseId", updateCourse);
adminRouter.put("/updateTeacher/:teacherId", updateTeacher);
adminRouter.put("/updateComplaint/:complaintId/:username/:actionBy", updateComplaint);
adminRouter.delete("/deleteStudent/:studentId/:username/:actionBy", deleteStudent);
adminRouter.delete("/deleteCourse/:courseId/:courseCode/:actionBy", deleteCourse);
adminRouter.delete("/deleteTeacher/:teacherId/:username/:actionBy", deleteTeacher);
adminRouter.delete("/deleteComplaint/:complaintId/:actionBy", deleteComplaint);

const teacherRouter = express.Router()
teacherRouter.get("/getTeacherCourses/:username", getTeacherCourses);
teacherRouter.get("/getAttendance/:courseId/:date", getAttendance);
teacherRouter.post("/uploadAttendance", uploadAttendance)
teacherRouter.put("/setupAttendance", setupAttendance);

// Register the student, admin and teacher routers
router.use("/", studentRouter);
router.use("/admin", adminRouter);
router.use("/teacher", teacherRouter);


module.exports = router;
