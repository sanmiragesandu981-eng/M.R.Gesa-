// index.js
const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;
const codeRouter = require("./pair"); // Make sure pair.js exists
require("events").EventEmitter.defaultMaxListeners = 500;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API Route for pairing
app.use("/code", codeRouter);

// Serve frontend HTML
app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "pair.html"), (err) => {
    if (err) {
      console.error("Error serving HTML:", err);
      res.status(500).send("File not found");
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`⏩ Server running on http://localhost:${PORT}`);
});

module.exports = app;
