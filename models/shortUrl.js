const mongoose = require('mongoose')

const shortUrlSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true
    },
    name:{
        type: String,
        required: true
    },
    fullLink:{
        type: String,
        required : true
    }
})


const userSchema = new mongoose.Schema({
    username:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    shortUrl: {shortUrlSchema,
    type: Array}
  
})
module.exports = mongoose.model('urlDbase',userSchema)
