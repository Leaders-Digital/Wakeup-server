const express = require('express');
const PartenaireRouter = express.Router();
const {addPartenaire,getPartenaires}=require('../Controllers/Partenaire.controller');


PartenaireRouter.post('/addPartenaire',addPartenaire);
PartenaireRouter.get('/getPartenaires',getPartenaires);

module.exports = PartenaireRouter;