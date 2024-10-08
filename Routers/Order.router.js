const express = require('express');

const OrderRouter =  express.Router();

const {createOrder,getOrders, getOrderById, updateOrderStatus, getOrderByCode , getDeliveredOrders} = require('../Controllers/Order.controller');


OrderRouter.post('/create',createOrder);
OrderRouter.get('/',getOrders);
OrderRouter.get('/livre',getDeliveredOrders);
OrderRouter.get('/code/:orderCode',getOrderByCode);

OrderRouter.get("/:id",getOrderById);
OrderRouter.patch("/:id/status",updateOrderStatus);



module.exports = OrderRouter;