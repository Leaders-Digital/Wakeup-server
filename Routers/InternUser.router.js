const express = require('express');

const {createInternUser , getInternUser , deleteInternUser , updateInternUser} = require('../Controllers/InternUser.controller');
const internUserRouter = express.Router();


internUserRouter.post('/create', createInternUser);
internUserRouter.get('/getInternUser', getInternUser);
internUserRouter.delete('/deleteInternUser/:id', deleteInternUser);
internUserRouter.put('/updateInternUser/:id', updateInternUser);

module.exports = internUserRouter;