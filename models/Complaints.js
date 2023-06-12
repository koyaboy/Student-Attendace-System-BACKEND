const mongoose = require("mongoose")
const Course = require("../models/Course")

const Schema = mongoose.Schema

const complaintsSchema = new Schema({

    username: {
        type: String,
        required: true
    },
    selectedCourse: {
        type: String
    },
    dateMissed: {
        type: Date
    },

    reason: {
        type: String
    },

    isCompleted: { type: Boolean, default: false }
});

module.exports = mongoose.model("Complaints", complaintsSchema)