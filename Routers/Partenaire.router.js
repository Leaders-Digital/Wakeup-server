const express = require('express');
const PartenaireRouter = express.Router();
const { addPartenaire, getPartenaires, deletePartenaire, updatePartenaire } = require('../Controllers/Partenaire.controller');
const { uploadFile } = require("../Middleware/imageUpload"); // Adjust path
// const upload = require("../Middleware/upload");
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });
PartenaireRouter.post('/addPartenaire', upload.single('logo'), addPartenaire);
PartenaireRouter.get('/getPartenaires', getPartenaires);
PartenaireRouter.delete('/deletePartenaire/:id', deletePartenaire);
PartenaireRouter.put('/updatePartenaire/:id', uploadFile({
  folder: "./uploads",
  acceptedTypes: [".png", ".jpeg", ".jpg"],
  fieldName: "logo", // This should match the form field name
  multiple: false,
}), updatePartenaire);

module.exports = PartenaireRouter;