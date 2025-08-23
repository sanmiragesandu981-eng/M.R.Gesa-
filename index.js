const express = require("express");
const app = express();
const path = require("path");
const PORT = process.env.PORT || 8000;

const pairRoute = require("./pair"); // The router we made

app.use("/code", pairRoute);
app.use("/", (req, res) => {
  res.sendFile(path.join(__dirname, "pair.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 M.R.Gesa Web Pair running on http://localhost:${PORT}`);
});
