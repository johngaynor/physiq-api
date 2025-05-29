const express = require("express");
const dotenv = require("dotenv");
const auth = require("./config/auth");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.status(200).json({ message: "PUBLIC ROUTE" });
});

// authentication middleware
app.use("/api", auth);

// import all defined api routes
require("./routes");

// catchall for any remaining routes
app.all("/api/*", (req, res) => {
  res.status(404).json({ message: "Route does not exist" });
});

app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});
