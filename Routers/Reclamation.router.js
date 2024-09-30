const express = require('express');
const { createReclamation, getReclamation } = require('../Controllers/Reclamation.controller');

const reclamationRouter = express.Router();

reclamationRouter.post('/create', createReclamation);
reclamationRouter.get('/get', getReclamation);

module.exports = reclamationRouter;