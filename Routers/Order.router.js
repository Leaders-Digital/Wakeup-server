const express = require('express');

const OrderRouter =  express.Router();

const {createOrder,getOrders} = require('../Controllers/Order.controller');


OrderRouter.post('/create/order',createOrder);
OrderRouter.get('/get/orders',getOrders);

module.exports = OrderRouter;