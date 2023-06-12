const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const Schema = mongoose.Schema

const userSchema = new Schema({

    username: {
        type: String,
        required: true,
        unique: true,
    },

    password: {
        type: String,
        required: true,
    },

    firstname: {
        type: String,
        required: true,
    },

    lastname: {
        type: String,
        required: true,
    },

    courses: {
        type: [Schema.Types.ObjectId],
        ref: "Course",
    },

    attendance: {
        type: [Schema.Types.ObjectId],
        ref: "Attendance"
    },

    rfidTag: {
        type: String
    },

    department: {
        type: String
    },

    level: {
        type: String,
    },

    title: {
        type: String
    },
    role: {
        type: String,
        required: true
    }
})


// static login method

userSchema.statics.login = async function (username, password) {

    if (!username || !password) {
        throw Error("All fields must be filled")
    }

    const user = await this.findOne({ username })

    if (!user) {
        throw Error("Incorrect details")
    }

    const match = await bcrypt.compare(password, user.password)


    //If it's a student or teacher trying to login

    if ((user.role === "S" || user.role === "T") && !match) {
        throw Error("Incorrect password")
    }

    //If it's an admin
    if ((user.role === "A") && password !== user.password) {
        throw Error("Incorrect password")
    }

    return user
}

module.exports = mongoose.model("User", userSchema)