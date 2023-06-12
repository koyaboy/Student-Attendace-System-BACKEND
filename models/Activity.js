const mongoose = require("mongoose")

const Schema = mongoose.Schema

const activitySchema = new Schema({
    timestamp: { type: Date, default: Date.now },
    action: { type: String, required: true },
    actionBy: { type: String, required: true }
})

module.exports = mongoose.model("Activity", activitySchema)