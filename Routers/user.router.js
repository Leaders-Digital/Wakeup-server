const express = require("express");
const userRouter = express.Router();
const {
  signup,
  login,
  getAllusers,
  deleteUser,
  changeRole,
  getUserInfo,
  changeStatus,
} = require("../Controllers/user.controller");
const authenticateToken = require("../Middleware/verifyToken");

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.get("/getAll", getAllusers);
userRouter.delete("/:id", deleteUser);
userRouter.put("/changeRole", changeRole);
userRouter.put("/status", changeStatus);

userRouter.get("/me", authenticateToken, getUserInfo);

module.exports = userRouter;
