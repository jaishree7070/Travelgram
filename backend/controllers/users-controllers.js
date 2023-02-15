const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator")
const User = require('../models/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');

const getUsers = async (req, res, next) => {
    let users;
    try {
        users = await User.find({}, '-password') //excluding the password fetch all the documents in the collection
    } catch (err) {
        const error = new HttpError("Fetching users failed ,Please try again later", 500)
        return next(error)
    }
    res.json({ users: users.map(user => user.toObject({ getters: true })) })

}
const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new HttpError("Invalid Inputs Passed,Please check your data", 422)
        return next(error)
    }

    const {
        name,
        email,
        password,
    } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email })
    } catch (err) {
        const error = new HttpError("SignUp failed,Please try again later", 500)
        return next(error)
    }
    if (existingUser) {
        const error = new HttpError("Could not create new user as user already seems to exist , Try logging in", 422)
        return next(error)
    }

    let hashedPassword;
    try { hashedPassword = await bcrypt.hash(password, 12) }
    catch (err) {
        const error = new HttpError(
            'Some Technical error,Please try again later', 500
        );
        return next(error)
    }
    const createdUser = new User({
        name,
        email,
        password: hashedPassword,
        image: req.file.path,
        places: [] //users newly created has no places at first
    });
    try {
        await createdUser.save();
    } catch (error) {
        const err = new HttpError(
            'signing up failed ,Please try again later', 500
        );
        return next(error)
    }
    let token;
    try {
        token = jwt.sign(
            {//passed createdid and email to the token fo decoding purposes
                userId: createdUser.id,
                email: createdUser.email
            },
            process.env.JWT_KEY, //token generation by this name
            { expiresIn: '1h' } //for security reasons token must expire in 1hr or less
        )
    } catch (e) {
        const err = new HttpError(
            'signing up failed ,Please try again later', 500
        );
        return next(err)
    }


    res.status(201).json({ userId: createdUser.id, userEmail: createdUser.email, token: token }) //to fetcfh the ID
}
const login = async (req, res, next) => {
    const { email, password } = req.body;

    let existingUser;
    //Check If user with that email exists 
    try {
        existingUser = await User.findOne({ email: email })
    } catch (err) {
        const error = new HttpError("Logging In failed,Please try again later", 500)
        return next(error)
    }

    if (!existingUser) {
        const error = new HttpError("Invalid credentials ,Please try again later", 401)
        return next(error)
    }
    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (e) {
        const error = new HttpError("Invalid credentials ,Please try again later", 500)
        return next(error)
    }
    if (!isValidPassword) {
        const error = new HttpError("Invalid credentials ,Please try again later with correct password", 401)
        return next(error)
    }

    let token;
    try {
        token = jwt.sign(
            {
                userId: existingUser.id,
                email: existingUser.email
            },
            process.env.JWT_KEY,
            { expiresIn: '1h' }
        )
    } catch (e) {
        const err = new HttpError(
            'Logging up failed ,Please try again later', 500
        );
        return next(err)
    }
    res.status(200).json({ userId:existingUser.id,email:existingUser.email,token:token })
}

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
