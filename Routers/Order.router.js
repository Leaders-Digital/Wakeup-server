const express = require('express');

const OrderRouter =  express.Router();

const {createOrder,getOrders, getOrderById} = require('../Controllers/Order.controller');


OrderRouter.post('/create',createOrder);
OrderRouter.get('/',getOrders);
OrderRouter.get("/:id",getOrderById);


module.exports = OrderRouter;