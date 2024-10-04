const User = require("../Models/user.model"); // Assuming the user schema is in `models/User.js`
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Secret key for JWT (you should store this in an environment variable)
const JWT_SECRET = process.env.JWT_SECRET;

const authController = {
  // Signup Controller
  signup: async (req, res) => {
    try {
      const { username, password, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const newUser = new User({
        username,
        password: hashedPassword,
        role, // Default role is 'viewer'
      });

      await newUser.save();

      res.status(201).json({ message: "User created successfully" });
    } catch (error) {
      res.status(500).json({ error: "Error creating user" });
    }
  },

  // Login Controller
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
console.log(username , password);


      // Find user by email
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      // Compare passwords
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        JWT_SECRET,
        {
          expiresIn: "1h", // Token will expire in 1 hour
        }
      );

      res.status(200).json({ token });
    } catch (error) {
      res.status(500).json({ error: "Error logging in" });
    }
  },

  // Token verification middleware
  verifyToken: (req, res, next) => {
    const token = req.headers["authorization"];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // Save the decoded user info to the request
      next();
    } catch (error) {
      res.status(400).json({ message: "Invalid token" });
    }
  },

  // Controller to access user dashboard (protected route)
  getDashboard: (req, res) => {
    // Assuming the user has been authenticated via verifyToken middleware
    res
      .status(200)
      .json({ message: `Welcome to the dashboard, ${req.user.role}!` });
  },
};

module.exports = authController;
