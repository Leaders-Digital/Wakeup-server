const express = require('express');

const {createInternUser , getInternUser , deleteInternUser , updateInternUser, codePromoCheck} = require('../Controllers/InternUser.controller');
const internUserRouter = express.Router();


internUserRouter.post('/create', createInternUser);
internUserRouter.get('/getInternUser', getInternUser);
internUserRouter.delete('/deleteInternUser/:id', deleteInternUser);
internUserRouter.put('/updateInternUser/:id', updateInternUser);
internUserRouter.post('/codePromoCheck', codePromoCheck);

module.exports = internUserRouter;