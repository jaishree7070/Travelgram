const express = require("express");

const router = express.Router();
const placeControllers = require("../controllers/places-controllers")
const { check } = require("express-validator")
const upload = require('../middleware/image-upload')
const checkAuth = require('../middleware/check-auth');

router.get('/:pid', placeControllers.getPlaceByPlaceId)

router.get('/user/:uid', placeControllers.getPlacesByUserId)

router.use(checkAuth);
//all routes after checkAuth are protected by jwt tokens

router.post('/',
    upload.single('image'),
    [check('title').not().isEmpty(),
    check('description').isLength({ min: 5 }),
    check('address').not().isEmpty(),
    ],
    placeControllers.createPlace)
    
router.patch('/:pid',
    [check('title').not().isEmpty(),
    check('description').isLength({ min: 5 }),
    ],
    placeControllers.updatePlace)

router.delete('/:pid', placeControllers.deletePlace)

module.exports = router;
