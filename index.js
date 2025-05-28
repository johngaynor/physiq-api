const express = require("express");
const dotenv = require("dotenv");
const apiKeyMiddleware = require("./middleware/apiKey");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Public route");
});

app.use("/api", apiKeyMiddleware);

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from protected route!" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
