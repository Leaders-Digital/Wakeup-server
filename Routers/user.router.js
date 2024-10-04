const express = require("express");
const userRouter = express.Router();
const {
  signup,
  login,
  getAllusers,
  deleteUser,
  changeRole,
} = require("../Controllers/user.controller");

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.get("/getAll", getAllusers);
userRouter.delete("/:id",deleteUser);
userRouter.put("/changeRole", changeRole);


module.exports = userRouter;
