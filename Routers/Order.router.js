const express = require('express');

const OrderRouter =  express.Router();

const {createOrder,getOrders} = require('../Controllers/Order.controller');


OrderRouter.post('/create',createOrder);
OrderRouter.get('/',getOrders);

module.exports = OrderRouter;