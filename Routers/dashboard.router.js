const express = require('express');
const { getOrdersStats } = require('../Controllers/dashboard.controller');
const router = express.Router();


router.get('/',getOrdersStats);

module.exports = router;
