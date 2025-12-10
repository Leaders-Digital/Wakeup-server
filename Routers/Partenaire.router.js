const express = require('express');
const PartenaireRouter = express.Router();
const { addPartenaire, getPartenaires, deletePartenaire, updatePartenaire } = require('../Controllers/Partenaire.controller');
const { uploadFile } = require("../Middleware/imageUpload"); // Now uses S3

PartenaireRouter.post('/addPartenaire',   uploadFile({
    folder: "uploads",
    fieldName: "logo",
    fileName: "logo",
    multiple: false,
  }), addPartenaire);
PartenaireRouter.get('/getPartenaires', getPartenaires);
PartenaireRouter.delete('/deletePartenaire/:id', deletePartenaire);
PartenaireRouter.put('/updatePartenaire/:id',   uploadFile({
    folder: "partenaires",
    fieldName: "logo", // This should match the form field name
    fileName: "logo",
    multiple: false,
  }), updatePartenaire);

module.exports = PartenaireRouter;