const express = require("express");
const app = express();
__path = process.cwd();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;

// Branding Info
const BOT_NAME = "🤖 M.R.Gesa";
const BOT_LOGO = "brand.png"; // save logo in root folder

// Pair system
let code = require("./pair");

// Increase listener limit to avoid memory leaks
require("events").EventEmitter.defaultMaxListeners = 500;

// Middleware
app.use("/code", code);

// Root route → branding page
app.use("/", async (req, res, next) => {
  res.sendFile(__path + "/pair.html");
});

// Parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Banner function
function printBanner() {
  console.clear();
  console.log("=================================");
  console.log(`🚀 ${BOT_NAME} Server is starting...`);
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`🖼️ Logo: ${BOT_LOGO}`);
  console.log("=================================");
}

// Start server
app.listen(PORT, () => {
  printBanner();
});

module.exports = app;
