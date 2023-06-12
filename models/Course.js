const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    department: { type: String, required: true },
    title: { type: String, required: true },
    code: { type: String, required: true },
    description: { type: String, required: true },
    instructor: { type: [mongoose.Schema.Types.ObjectId], ref: "User" },
    date: { type: Date },
    startTime: { type: String },
    endTime: { type: String },

    entryWindow1Start: {
        type: String,
        required: true,
    },
    entryWindow1End: {
        type: String,
        required: true,
    },
    entryWindow2Start: {
        type: String,
        required: true,
    },
    entryWindow2End: {
        type: String,
        required: true,
    },

});

module.exports = mongoose.model('Course', courseSchema);
