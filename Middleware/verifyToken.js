const jwt = require("jsonwebtoken");
const User = require("../Models/user.model");

require("dotenv").config();
// aa middleware to verify the role of a cordinator
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decodedToken);
    
    const user = await User.findOne({ _id: decodedToken.userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    req.user = {role:user.role,id:user._id}; // Attach the user object to the request for later use in route handlers
    next();
    // Call next middleware or route handler
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    } else {
      return res.status(401).json({ message: "Invalid token" });
    }
  }
};

module.exports = authenticateToken;