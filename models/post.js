const mongoose = require("mongoose")

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        default: ""
    },
    postimg: {
        type: String,
    },
    authorid: {
        type: String,
        required: true
    },
    likedby: [String],
    updatedOn: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('post', postSchema)