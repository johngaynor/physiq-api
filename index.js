const express = require("express");
const dotenv = require("dotenv");
const apiKeyMiddleware = require("./middleware/apiKey");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Public route (no API key required)
app.get("/", (req, res) => {
  res.send("Welcome to the public route!");
});

// Protected routes
app.use("/api", apiKeyMiddleware);

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from a protected route!" });
});

app.get("/api/data", (req, res) => {
  res.json({ data: [1, 2, 3, 4] });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
