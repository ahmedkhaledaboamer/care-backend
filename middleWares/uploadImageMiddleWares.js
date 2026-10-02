// eslint-disable-next-line import/no-extraneous-dependencies
const multer = require("multer");
const ApiError = require("../utils/apiError");

const multerOption = () =>{
// diskStorage

// const multerStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/categories");
//   },
//   filename: function (req, file, cb) {
//     const ext = file.mimetype.split("/")[1];
//     const fileName = `catergory-${uuidv4()}-${Date.now()}.${ext}`;

//     cb(null, fileName);
//   },
// });

// memoryStorage
const multerStorage = multer.memoryStorage();

const multerfilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new ApiError("only images allowed", 400), false);
  }
};
const upload = multer({ storage: multerStorage, fileFilter: multerfilter });

return upload;
}
 


exports.uploadSingleImage=(fieldName) => multerOption().single(fieldName )



exports.uploadMixOfImages= (arrayFields) =>  multerOption().fields(arrayFields)