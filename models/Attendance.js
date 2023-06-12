const mongoose = require("mongoose")

const Schema = mongoose.Schema

const attendanceSchema = new Schema({
    username:
    {
        type: Schema.Types.ObjectId, ref: "User",
        required: true
    },

    course_id:
    {
        type: Schema.Types.ObjectId, ref: "Course"
    },

    date: {
        type: Date,
        default: Date.now
    },

    present: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model("Attendance", attendanceSchema)

//username: 647f9dd324406d88b085bcb8
//course_id: 648079a5866b254211c3d4ba
// date: "2023-06-08T00:00:00.000Z"