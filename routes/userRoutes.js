const {
  authUser,
  registerUser,
  userUpdateProfile,
} = require("../controllers/userControllers.js");
const { protect } = require("../middlewares/authMiddleware.js");
const express = require("express");
const router = express.Router();

router.route("/").post(registerUser);
router.route("/login").post(authUser);
router.route("/profile").post(userUpdateProfile);

module.exports = router;
