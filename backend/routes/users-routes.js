
const express = require("express");
const { check } = require("express-validator")
const upload = require('../middleware/image-upload')

const usersControllers = require("../controllers/users-controllers")
const router = express.Router();
router.get('/', usersControllers.getUsers)

router.post('/signup',
    upload.single('image'),
    [check('name').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').not().isEmpty().isLength({ min: 5 }),
    ],
    usersControllers.signup);
    
router.post('/login', usersControllers.login)

module.exports = router;
