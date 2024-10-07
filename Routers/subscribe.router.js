// routes/subscriptionRoutes.js
const express = require('express');
const routerSub = express.Router();
const { subscribeEmail } = require('../Controllers/subscribe.controller');

routerSub.post('/', subscribeEmail);

module.exports = routerSub;
