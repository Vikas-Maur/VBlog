const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
  name:{
    type: String,
    required: true
  },
  email:{
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  bio: {
    type: String
  },
  token: {
    type: String
  }
})

exports.userSchema = userSchema

module.exports = mongoose.model('user', userSchema)