const express = require("express");
const dotenv = require("dotenv");
const apiKeyMiddleware = require("./middleware/apiKey");
const { mysqlPromise } = require("./config/database");

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

app.get("/api/logs", async (req, res) => {
  try {
    const pool = await mysqlPromise;
    const [result] = await pool.query(
      "select log.* from weightLogs log left join apiUsers api on api.id = log.userId where api.clerkId = ?",
      [process.env.USER_ID]
    );
    res.status(200).json({ result });
  } catch (error) {
    res.status(400).json({ message: "failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
