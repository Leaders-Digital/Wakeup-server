const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadFile = ({
    folder = "./uploads",
    acceptedTypes = ['.xls', '.xlsx', '.png', '.jpeg', '.jpg'],
    fieldName = "file", // Default field name changed to 'file' for general use
    fileName = "file",
    multiple = false,
    maxCount = 5
} = {}) => {
    var storage = multer.diskStorage({
        destination: function (req, file, cb) {
            // Ensure the directory exists
            if (!fs.existsSync(folder)) { 
                fs.mkdirSync(folder, { recursive: true }); 
            }
            cb(null, folder);
        },
        filename: function (req, file, cb) {
            if (!acceptedTypes.includes(path.extname(file.originalname).toLowerCase())) {
                return cb(new Error("Unsupported file type"));
            }
            const uniqueSuffix = crypto.randomBytes(8).toString('hex'); // Generate a unique hex string
            cb(null, fileName + "-" + uniqueSuffix + path.extname(file.originalname));
        }
    });

    // Return multer instance with appropriate method based on `multiple` parameter
    return multiple ? multer({ storage }).array(fieldName, maxCount) : multer({ storage }).single(fieldName);
};

module.exports = { uploadFile };
