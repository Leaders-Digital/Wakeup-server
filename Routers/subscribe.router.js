// routes/subscriptionRoutes.js
const express = require('express');
const routerSub = express.Router();
const { subscribeEmail, getAllSubscriptions } = require('../Controllers/subscribe.controller');

routerSub.post('/', subscribeEmail);
routerSub.get('/getAllSubscriptions',getAllSubscriptions);

module.exports = routerSub;
