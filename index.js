const express = require("express");
const dotenv = require("dotenv");
const clerkAuth = require("./config/clerkAuth");
const cors = require("cors");
const limiter = require("./config/rateLimiters");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(limiter);

const allowedPatterns = [
  /^http:\/\/localhost:3001$/, // dev
  /^https:\/\/physiq-web-app-git-dev-john-gaynors-projects\.vercel\.app$/, // staging
  /^https:\/\/([a-z0-9-]+\.)?physiq\.app$/, // production + subdomains
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow non-browser requests (e.g. Postman)
      if (allowedPatterns.some((pattern) => pattern.test(origin))) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  })
);

app.use(express.json());

// authentication middleware
app.use("/api", clerkAuth);

app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}][${req.auth?.userId || "anonymous"}] ${
      req.method
    } ${req.originalUrl}`
  );
  next();
});

// import all defined api routes
require("./routes")(app);

// catchall for any remaining routes
app.use((req, res) => {
  res.status(404).json({ message: "Route does not exist" });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  console.log(err);

  // Serialize error for frontend
  const serializedError = {
    message: err.message || "Internal Server Error",
  };

  res.status(statusCode).json({ error: serializedError });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port: ${PORT}`);
});
