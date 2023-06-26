const dotenv = require("dotenv");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
// const apiPort = 5000;
const port = process.env.PORT || 4000;
const path = require("path");
const connectDB = require("./config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("./models/userModel");
const authMiddleware = require("./middlewares/authMiddleware");
const mongoose = require("mongoose");

dotenv.config({ path: path.resolve(__dirname, ".env") });

//______________________________ MIDDLEWARES ______________________________//
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//______________________________ DB ______________________________

connectDB();

//______________________________ FUNCTIONS ______________________________

const updateUser = async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];

  try {
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decodedData.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name, email, address } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (address) user.address = address;

    const updatedUser = await user.save();
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Unauthorized" });
  }
};

// ____________________________ POST ______________________________

//user registration
app.post("/api/register", async (req, res) => {
  try {
    const user = new User(req.body);
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//user login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });

  console.log("USEEER ", user);

  // If user doesn't exist, return error
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Check if password is correct
  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  // If password is incorrect, return error
  if (!isPasswordCorrect) {
    return res.status(401).json({ message: "Incorrect password" });
  }

  // Generate JWT token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  // Send token in response
  res.status(200).json({ token });
});

//user logout
app.post("/api/logout", (req, res) => {
  // Clear the cookie containing the JWT token
  res.clearCookie("token");

  // Send a success response
  res.status(200).json({ message: "Logout successful" });

  //send back to home page
  res.redirect("/");
});


// add token to monitoredToken array
app.post("/api/user/addToken", authMiddleware, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  try {
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decodedData.id;

    const {
      ticker,
      blockchain,
      to_receive,
      received,
      logo,
      contract,
      decimals,
    } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          monitoredToken: {
            ticker,
            blockchain,
            to_receive,
            received,
            logo,
            contract,
            lastUpdate: Date.now(),
            decimals,
          },
        },
      },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ____________________________ GET ______________________________

//get user data with the token from local storage
app.get("/api/user", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decodedData.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
});

// ____________________________ PUT ______________________________

//update user data
app.put("/api/user", authMiddleware, updateUser);

//update monitored token
app.put("/api/user/editToken/:tokenId", authMiddleware, async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  try {
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    const userId = await User.findById(decodedData.id).select("-password");

    const {
      ticker,
      blockchain,
      to_receive,
      receivedAmount,
      lastUpdate,
      decimals,
    } = req.body;
    const tokenId = req.params.tokenId;

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId._id, "monitoredToken._id": tokenId },
      {
        $set: {
          "monitoredToken.$.ticker": ticker,
          "monitoredToken.$.blockchain": blockchain,
          "monitoredToken.$.to_receive": to_receive,
          "monitoredToken.$.receivedAmount": receivedAmount,
          "monitoredToken.$.lastUpdate": lastUpdate,
          "monitoredToken.$.decimals": decimals,
        },
      },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ____________________________ DELETE ______________________________

//delete monitored token
app.delete(
  "/api/user/deleteToken/:tokenId",
  authMiddleware,
  async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    try {
      const decodedData = jwt.verify(token, process.env.JWT_SECRET);

      const userId = await User.findById(decodedData.id).select("-password");
      const tokenId = req.params.tokenId;

      if (!mongoose.Types.ObjectId.isValid(tokenId)) {
        return res.status(400).json({ message: "Invalid tokenId" });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId._id,
        {
          $pull: {
            monitoredToken: { _id: new mongoose.Types.ObjectId(tokenId) },
          },
        },
        { new: true }
      );

      res.status(200).json(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

app.listen(port, "0.0.0.0", () =>
  console.log(`Server running on port ${port}`)
);
