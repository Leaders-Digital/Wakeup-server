const express = require('express');
require('./Models/index');
const port = 3000; 
const app = express();
app.use(express.json()); 
// Routers 
const ProductRouter = require('./Routers/Product.router');
const OrderRouter = require('./Routers/Order.router');

app.use("/product",ProductRouter);
app.use("/order",OrderRouter);





// server listening
app.listen(port,()=>{
    console.log("Our server is running on port 3000");
})