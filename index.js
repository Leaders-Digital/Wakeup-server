const express = require('express');
require('./Models/index');
const port = 7000; 
const app = express();
app.use(express.json()); 
// Routers 
const ProductRouter = require('./Routers/Product.router');
const OrderRouter = require('./Routers/Order.router');
const reviewRouter = require('./Routers/Review.router');
const PartenaireRouter = require('./Routers/Partenaire.router');
app.use("/product",ProductRouter);
app.use("/order",OrderRouter);
app.use("/review",reviewRouter);
app.use("/partenaire",PartenaireRouter);



// server listening
app.listen(port,()=>{
    console.log(`Our server is running on port ${port}`);
})