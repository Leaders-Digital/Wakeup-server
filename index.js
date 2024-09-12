const express = require('express');
require('./Models/index');
const port = 3000; 
const app = express();







// server listening
app.listen(port,()=>{
    console.log("Our server is running on port 3000");
})