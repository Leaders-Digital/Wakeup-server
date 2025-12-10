// multerConfig.js - Now using S3
const upload = require('./s3UploadSimple');

// Export the middleware for use in routes
module.exports = upload;
