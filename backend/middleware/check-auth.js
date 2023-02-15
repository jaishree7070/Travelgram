const HttpError = require("../models/http-error");
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    //this wont block our post req to continue as options request
    if (req.method === 'OPTIONS') {
        return next();
    }

    try {
        if (!req.headers.authorization.split('Bearer ')[1]) {
            throw new Error("Authentication failed!")
        }
        const decodedToken = jwt.decode(req.headers.authorization.split('Bearer ')[1], process.env.JWT_KEY);
        req.userData = { userId: decodedToken.userId }
        next();
    } catch (error) {
        const e = new HttpError("Authentication failed!", 401)
        return next(e)
    }
}