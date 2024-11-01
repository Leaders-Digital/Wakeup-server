const express = require('express');
const PartenaireRouter = express.Router();
const {addPartenaire,getPartenaires , deletePartenaire , updatePartenaire}=require('../Controllers/Partenaire.controller');
const { uploadFile } = require("../Middleware/imageUpload"); // Adjust path
// const upload = require("../Middleware/upload");
PartenaireRouter.post('/addPartenaire', 
    uploadFile({
    folder: "./uploads",
    acceptedTypes: [".png", ".jpeg", ".jpg"],
    fieldName: "logo", // This should match the form field name
    multiple: false,
  }),addPartenaire);
PartenaireRouter.get('/getPartenaires',getPartenaires);
PartenaireRouter.delete('/deletePartenaire/:id',deletePartenaire);
PartenaireRouter.put('/updatePartenaire/:id',    uploadFile({
  folder: "./uploads",
  acceptedTypes: [".png", ".jpeg", ".jpg"],
  fieldName: "logo", // This should match the form field name
  multiple: false,
}),updatePartenaire);

module.exports = PartenaireRouter;