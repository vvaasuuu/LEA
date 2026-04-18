const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// TEMP: no MongoDB yet, just test server
app.get("/", (req, res) => {
  res.send("Backend is working!");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});