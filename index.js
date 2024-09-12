const express = require('express');
require('./Models/index');
const port = 3000; 
const app = express();
app.use(express.json()); 
// Routers 
const ProductRouter = require('./Routers/Product.router');

app.use("/product",ProductRouter);






// server listening
app.listen(port,()=>{
    console.log("Our server is running on port 3000");
})