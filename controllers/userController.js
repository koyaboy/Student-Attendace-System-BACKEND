const User = require("../models/userModel")
const Attendance = require("../models/Attendance")
const Course = require("../models/Course")
const Complaints = require("../models/Complaints")
const Activity = require("../models/Activity")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")

const createToken = (_id) => {
    return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "3d" })
}

const generateToken = (req, res) => {
    try {
        const { rfidTag } = req.body;

        console.log("RFID TAG: " + rfidTag)

        // Verify the RFID tag or perform any necessary checks

        // Generate a JWT token with a shorter expiration time
        const token = createToken(rfidTag);

        res.status(200).json({ token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
}

//STUDENT

//login user
const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.login(username, password)

        const userdetails = await User.findOne({ username })

        const firstname = userdetails.firstname;
        const lastname = userdetails.lastname;
        const role = userdetails.role;
        const title = userdetails.title

        //create a token
        const token = createToken(user._id)

        res.status(200).json({ username, token, title, firstname, lastname, role })

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}


//view attendance
const viewAttendance = async (req, res) => {
    try {
        const { username, courseId } = req.params

        //Retrieve the User document based on the username
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const attendanceData = await Attendance.find({
            username: user.username,
            course_id: courseId
        });

        res.status(200).json(attendanceData);
    } catch (error) {
        res.status(500).json({ msg: "Failed to Fetch attendance" })
    }
}

const complaintsForm = async (req, res) => {

    const { username } = req.params
    const { selectedCourse, dateMissed, reason, isCompleted } = req.body

    const newComplaint = {
        username,
        selectedCourse: selectedCourse,
        dateMissed: dateMissed,
        reason: reason,
        isCompleted
    }

    try {
        const complaint = await Complaints.create(newComplaint)
        res.status(200).json({ message: complaint })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "An error occurred" })
    }



}

const markAttendance = async (req, res) => {

    const { rfidTag } = req.body

    try {
        const student = await User.findOne({ rfidTag })

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Get the current time
        const currentTime = new Date();

        const time = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const formattedDate = currentTime.toLocaleDateString();

        console.log(time);

        // Find the course with the given start and end time windows
        const course = await Course.findOne({
            $or: [
                {
                    entryWindow1Start: { $lte: time },
                    entryWindow1End: { $gte: time },
                },
                {
                    entryWindow2Start: { $lte: time },
                    entryWindow2End: { $gte: time },
                },
            ],
        });


        if (!course) {
            return res.status(404).json({ message: "No active course found" });
        }


        //     // Checking if attendance count is 2 


        // Mark Attendance and Update the attendance schema for the student in the course
        const attendance = new Attendance({
            username: student._id,
            course_id: course._id,
            date: formattedDate,
            present: true,
        });

        await attendance.save();

        res.status(200).json({ message: "Attendance marked successfully" });


    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Failed to Mark Attendance" })
    }
}

const getCourses = async (req, res) => {
    try {
        const { username } = req.params;

        // Retrieve the User document based on the username
        const user = await User.findOne({ username }).populate({
            path: "courses",
            populate: {
                path: "instructor",
                model: "User" // Replace "Instructor" with the actual model name of the instructor
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userCourses = user.courses;
        res.json(userCourses);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};





//ADMIN

const addStudent = async (req, res) => {

    try {
        const { firstname, lastname, username, password, department, role, level, courses, rfidTag, actionBy } = req.body

        const exists = await User.findOne({ username })

        if (exists) {
            throw Error("Username already in use")
        }

        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(password, salt)

        const student = await User.create({ firstname, lastname, username, password: hash, department, courses, rfidTag, level, role })

        //Update Activity Table
        const activity = await Activity.create({
            timestamp: Date.now(),
            action: `Student ${username} created Successfully`,
            actionBy: actionBy
        })

        res.status(200).json(student)

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Failed to create student" })
    }
}

const getComplaints = async (req, res) => {

    try {
        const complaints = await Complaints.find({}).populate("selectedCourse")
        res.status(200).json(complaints)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Failed to retrieve complaints' });
    }
}

const createCourse = async (req, res) => {
    try {
        const { department, title, code, description, instructor, actionBy } = req.body

        const course = await Course.create({
            department,
            title,
            code,
            description,
            instructor: [instructor]
        })


        //Update Instructor Courses

        const Instructor = await User.findOne({ _id: { $in: instructor } })
        if (!Instructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }
        Instructor.courses.push(course._id)
        await Instructor.save()

        //Update Activity Table
        const activity = await Activity.create({
            timestamp: Date.now(),
            action: `Course ${code} created Successfully`,
            actionBy: actionBy
        })


        res.status(200).json({ msg: course })


    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Internal Server Error" })
    }
}

const adminGetCourses = async (req, res) => {
    try {
        const courses = await Course.find({}).populate("instructor")
        res.status(200).json(courses)

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Failed to retrieve courses' });
    }
}

const adminGetStudents = async (req, res) => {
    try {
        const students = await User.find({ role: "S" })
        res.status(200).json(students)

    } catch (error) {
        console.log(error)
    }
}

const adminGetTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ role: "T" }).populate("courses")
        res.status(200).json(teachers)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Failed to retrieve Teachers' });
    }
}

const addTeacher = async (req, res) => {
    try {
        const { title, firstname, lastname, username, password, department, role, actionBy, coursesTaught } = req.body;

        const exists = await User.findOne({ username });

        if (exists) {
            throw Error("Username already in use");
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const teacher = await User.create({
            title,
            firstname,
            lastname,
            username,
            password: hash,
            department,
            role,
            courses: coursesTaught, // Assign the selected courses to the teacher
        });

        //Update Instructor field in Course Table
        const course = await Course.findOne({ _id: { $in: coursesTaught.map(course => course._id) } });



        const activity = await Activity.create({
            timestamp: Date.now(),
            action: `Teacher ${title}. ${firstname} ${lastname} created Successfully`,
            actionBy,
        });

        res.status(200).json(teacher);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to create Teacher" });
    }
};


const getActivity = async (req, res) => {
    try {
        const limit = 5; // Specify the maximum number of activities to retrieve

        const activities = await Activity.find()
            .sort({ timestamp: -1 }) // Sort by the most recent timestamp in descending order
            .limit(limit); // Limit the number of activities

        res.status(200).json(activities);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to retrieve Recent Activities" });
    }
};


const getComplaintsData = async (req, res) => {
    try {
        const completedCount = await Complaints.countDocuments({ isCompleted: true });
        const pendingCount = await Complaints.countDocuments({ isCompleted: false });
        res.json({ completedCount, pendingCount })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: "Internal Server error" })
    }
}

const updateStudent = async (req, res) => {
    try {
        const { id, firstname, lastname, username, password, level, department, role, rfidTag, actionBy } = req.body
        const student = await User.findById(id)

        if (!student) {
            return res.status(404).json({ message: 'Student not found' })
        }

        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(password, salt)

        student.firstname = firstname;
        student.lastname = lastname;
        student.username = username;
        student.password = hash;
        student.level = level;
        student.department = department;
        student.role = role;
        student.rfidTag = rfidTag;

        // Save the updated student
        await student.save();

        //Update Activity table
        const activity = await Activity.create({
            timestamp: Date.now(),
            action: `Student ${username} Information Updated`,
            actionBy: actionBy
        })

        res.status(200).json({ message: "Student Updated Successfully" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Failed to Update Student" })
    }
}

const updateCourse = async (req, res) => {
    const { department, code, title, description, instructor, actionBy } = req.body
    const { courseId } = req.params

    try {
        const course = await Course.findById(courseId)

        if (!course) {
            res.status(404).json({ message: "Course Not Found" })
        }

        course.title = title;
        course.department = department;
        course.code = code;
        course.description = description;
        course.instructor = instructor;

        //Save the Updated course
        await course.save();

        //Update Activity table
        const activity = await Activity.create({
            timestamp: Date.now(),
            action: `Course ${code} Information Updated`,
            actionBy: actionBy
        })

        res.status(200).json({ message: "Course Updated Successfully" })



    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Failed to Update Course Information" })
    }
}

const updateTeacher = async (req, res) => {
    const { title, firstname, lastname, username, password, department, role, coursesTaught, actionBy } = req.body
    const { teacherId } = req.params

    try {
        const teacher = await User.findById(teacherId)

        if (!teacher) {
            res.status(404).json({ message: "Teacher Not Found" })
        }

        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(password, salt)

        teacher.title = title
        teacher.firstname = firstname
        teacher.lastname = lastname
        teacher.username = username
        teacher.password = hash
        teacher.department = department
        teacher.role = role
        teacher.courses = coursesTaught

        //Save Updated teacher
        teacher.save()

        //Update Activity table
        const activity = await Activity.create({
            timestamp: Date.now(),
            action: `Teacher ${title}. ${firstname} ${lastname} Information Updated`,
            actionBy: actionBy
        })

        res.status(200).json({ message: "Teacher Information Updated Successfully" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Failed to Update Teacher Information" })
    }
}

const updateComplaint = async (req, res) => {
    const { complaintId, username, actionBy } = req.params

    try {
        const complaint = await Complaints.findById(complaintId)

        if (!complaint) {
            return res.status(404).json({ message: "Complaint not found" });
        }

        //Update the isCompleted field
        complaint.isCompleted = !complaint.isCompleted;

        await complaint.save()

        //Update Activity table
        const activity = await Activity.create({
            timestamp: Date.now(),
            action: `Complaint ${complaintId} by ${username} Completed`,
            actionBy: actionBy
        })

        res.status(200).json({ message: "Complaint completed" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Complaint could not be completed" })
    }
}

const deleteStudent = async (req, res) => {
    const { studentId, username, actionBy } = req.params

    try {
        const result = await User.deleteOne({ _id: studentId })


        if (result.deletedCount == 1) {
            res.status(200).json({ message: "Student successfully deleted" })
        } else {
            res.status(404).json({ message: "Student Not Found" })
        }

        //Update Activity table
        const activity = await Activity.create({
            timestamp: Date.now(),
            action: `Student ${username} Deleted`,
            actionBy: actionBy
        })



    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Failed to delete student" })
    }
}

const deleteCourse = async (req, res) => {
    const { courseId, courseCode, actionBy } = req.params;

    try {
        const course = await Course.deleteOne({ _id: courseId })

        if (course.deletedCount == 1) {
            res.status(200).json({ message: "Course Successfully deleted" })
        } else {
            res.status(400).json({ message: "Course Not Found" })
        }

        //Update Activity table
        const activity = await Activity.create({
            timestamp: Date.now(),
            action: `Course ${courseCode} Deleted`,
            actionBy: actionBy
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Failed to delete course" })
    }


}

const deleteTeacher = async (req, res) => {
    const { teacherId, username, actionBy } = req.params

    try {
        const teacher = await User.deleteOne({ _id: teacherId })

        if (teacher.deletedCount == 1) {
            res.status(200).json({ message: "Teacher Successfully deleted" })
        } else {
            res.status(400).json({ message: "Teacher Not Found" })
        }

        //Update Activity table
        const activity = await Activity.create({
            timestamp: Date.now(),
            action: `Teacher ${username} Deleted`,
            actionBy: actionBy
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Failed to Delete Teacher" })
    }
}

const deleteComplaint = async (req, res) => {
    const { complaintId, actionBy } = req.params
    try {
        const complaint = await Complaints.deleteOne({ _id: complaintId })

        if (complaint.deletedCount == 1) {
            res.status(200).json({ message: "Complaint Successfully Delete" })
        } else {
            res.status(400).json({ message: "Complaint Not Found" })
        }

        //Update Activity table
        const activity = await Activity.create({
            timestamp: Date.now(),
            action: `Complaint Id: ${complaintId} Deleted`,
            actionBy: actionBy
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Failed to Delete Complaint" })
    }
}

const getTeacherCourses = async (req, res) => {
    const { username } = req.params
    try {

        const teacher = await User.findOne({ username }).populate({
            path: "courses",
            populate: {
                path: "instructor",
                model: "User"
            }
        })

        if (!teacher) {
            res.status(404).json({ message: "Teacher Not Found" })
        }
        res.status(200).json(teacher.courses)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Failed to Retrieve Teacher Courses" })
    }
}

const setupAttendance = async (req, res) => {
    const
        { selectedCourse,
            date,
            startTime,
            endTime,
            attendance1Start,
            attendance1End,
            attendance2Start,
            attendance2End } = req.body

    try {

        const course = await Course.findById(selectedCourse)

        if (!course) {
            res.status(404).json({ message: "Course Not Found" })
        }



        course.date = date;
        course.startTime = startTime.toLocaleString();
        course.endTime = endTime.toLocaleString();
        course.entryWindow1Start = attendance1Start;
        course.entryWindow1End = attendance1End;
        course.entryWindow2Start = attendance2Start;
        course.entryWindow2End = attendance2End;

        await course.save();

        res.status(200).json(course)

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Could not setup Attendance" })
    }
}

const getAttendance = async (req, res) => {
    const { courseId, date } = req.params


    try {
        const attendance = await Attendance.find({ date, course_id: courseId }).populate({
            path: "username",
            select: "username firstname lastname"
        })

        if (!attendance) {
            res.status(404).json({ message: "Attendance Record Not Found" })
        }

        res.status(200).json(attendance)

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Failed to retrieve Attendance" })
    }

}

const uploadAttendance = async (req, res) => {
    const { attendances, selectedCourse, formattedDate } = req.body

    console.log(selectedCourse)
    try {
        const deletedAttendance = await Attendance.deleteMany({
            course: selectedCourse,
            date: formattedDate
        })

        if (!deletedAttendance) {
            res.status(404).json({ message: "Attendance Not Found" })
        }

        await Attendance.insertMany(attendances)

        res.status(200).json({ message: "Attendance uploaded successfully" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Failed to upload Attendance" })
    }
}

module.exports = {
    generateToken,
    loginUser,
    viewAttendance,
    complaintsForm,
    markAttendance,
    addStudent,
    getCourses,
    complaintsForm,
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
}

//6472269d27849edf3ecbe348 (csc 424)
//6473c306809776f16dc4c6e8 (csc 446)


