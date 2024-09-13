const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto');
const uploadFile = ({
    folder = "./uploads",
    acceptedTypes = ['.xls', '.xlsx', '.png', '.jpeg', '.jpg'],
    fieldName = "excelFile",
    fileName = "collaborators-excel",
    multiple = false,
    maxCount = 5
} = {}) => {
    var storage = multer.diskStorage({
        destination: function (req, file, cb) {
            if (!fs.existsSync(folder)) { fs.mkdirSync(folder); }
            cb(null, folder);
        },
        filename: function (req, file, cb) {
            if (!acceptedTypes.includes(path.extname(file.originalname))) {
                return cb(new Error("Bad file format"));
            }
            const uniqueSuffix = crypto.randomBytes(8).toString('hex'); // Generate a 16 characters hex string
            cb(null, fileName + "-" + uniqueSuffix + path.extname(file.originalname));
        }
    });
    return multiple ? multer({ storage }).array(fieldName, maxCount) : multer({ storage }).single(fieldName)
}
module.exports = { uploadFile }