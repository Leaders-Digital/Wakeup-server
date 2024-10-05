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
      console.log(error);
      res.status(500).json({ error: "Error creating user" });
    }
  },

  // Login Controller
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

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
      const lastLogin = Date.now();
      await User.findByIdAndUpdate(user._id, { lastLogin });

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

  // Get all users controller
  getAllusers: async (req, res) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      res.status(200).json({ data: users });
    } catch (error) {
      res.status(500).json({ error: "Error getting users" });
    }
  },

  // Get user info controller
  getUserInfo: async (req, res) => {
    try {
      const userId = req.user.id;
      console.log(userId);
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ user });
    } catch (error) {
      res.status(500).json({ error: "Error fetching user info" });
    }
  },

  // Delete user controller
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      await User.findByIdAndDelete(id);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Error deleting user" });
    }
  },

  // Change user role controller
  changeRole: async (req, res) => {
    try {
      const { id, newRole } = req.body;

      // Check if the role is valid (you can define valid roles)
      const validRoles = ["admin", "editor", "viewer"];
      if (!validRoles.includes(newRole)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Find user by ID and update role
      const user = await User.findByIdAndUpdate(
        id,
        { role: newRole },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({ message: "Role updated successfully", user });
    } catch (error) {
      res.status(500).json({ error: "Error updating role" });
    }
  },
};

module.exports = authController;
