const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator') //to validate email

const Schema = mongoose.Schema;
//schema is the blue print of the documents in the collections we store
const userSchema = new Schema({
    name: {
        type: String, required: true
    },
    email: {
        type: String, required: true, unique: true //speeds up the quering process
    },
    password: {
        type: String, required: true, minlength: 6
    },
    image: {
        type: String, required: true
    },
    places: [{
        type: mongoose.Types.ObjectId, required: true, ref: 'Place' //ref to establish a connection between the place and User collection
    }]
})

userSchema.plugin(uniqueValidator);//only if the email doesnt exist create new user 
module.exports = mongoose.model('User', userSchema);
//User will be plural and it will be the name of the collection