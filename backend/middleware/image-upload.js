// var multer = require('multer');

// var storage = multer.diskStorage({

//     destination : function(req,file,cb){
//         cb(null,'./uploads');
//     },
//     filename : function(req,file,cb){
//         cb(null,file.originalname);
//     }   
// });

// var filefilter = function(req,file,cb){ 

//          if(file.originalname.match(/\.(png|jpeg|jpg)$/))
//             {
//             return cb(null,true);     
//             }
//         else{
//              return  cb(new Error(('in image only image is allowed')));
//             }

// }    
// var upload = multer({storage : storage,limits : {
//     filesize :1024*1024*5
//     },fileFilter :filefilter
// });

// module.exports = upload; 
const multer = require('multer');
const {v1 : uuid} = require('uuid')

//multer will allow us to share more than just data unlike json
const MIME_TYPE_MAP = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpeg',
    'image/png': 'png'

};
const fileUpload = multer({
    limits: 500000, //px of image
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/images') //destination to store the images
        },
        filename: (req, file, cb) => {
            const ext = MIME_TYPE_MAP[file.mimetype];
            //to retreive the extention
            cb(null, uuid() + '.' + ext);
        }
    }),
    fileFilter: (req, file, cb) => {
        const isValid = !!MIME_TYPE_MAP[file.mimetype]; //checks whether the  image has correct file extensions or its a valid imag
        let error = isValid ? null : new Error('Invalid mime type!');
        cb(error, isValid);
    }
});

module.exports = fileUpload;