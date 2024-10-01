const express = require('express');
const { createReclamation, getReclamation , updateReclamationStatus , deleteReclamation } = require('../Controllers/Reclamation.controller');

const reclamationRouter = express.Router();

reclamationRouter.post('/create', createReclamation);
reclamationRouter.get('/get', getReclamation);
reclamationRouter.delete('/delete/:id', deleteReclamation);
reclamationRouter.put('/update/:id', updateReclamationStatus);

module.exports = reclamationRouter;