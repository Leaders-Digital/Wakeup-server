const express = require('express');
const { createReclamation, getReclamation , updateReclamationStatus } = require('../Controllers/Reclamation.controller');

const reclamationRouter = express.Router();

reclamationRouter.post('/create', createReclamation);
reclamationRouter.get('/get', getReclamation);
reclamationRouter.put('/update/:id', updateReclamationStatus);

module.exports = reclamationRouter;