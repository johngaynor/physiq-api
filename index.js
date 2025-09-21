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

// Add routeError function to all responses
app.use((req, res, next) => {
  /**
   * @param {String} path
   * @param {Error} error
   */
  res.routeError = (path, error) => {
    console.error(path, error);
    if (error instanceof Error) {
      // Standard error equivalent to before consolidation
      res
        .status(400)
        .json({ message: `${path} - ${error.message}`, stack: error.stack });
    } else {
      // For custom errors. (When a model function rejects with a string)
      const custom = Error(error);
      res.status(444).json({ message: custom.message, stack: custom.stack });
    }
  };
  next();
});

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

// catchall for any remaining routes that don't exist
app.use((req, res) => {
  res.status(404).json({ message: `${req.path} - route does not exist` });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // Use the standardized routeError if available, otherwise fall back to default
  if (res.routeError) {
    res.routeError(req.originalUrl, err);
  } else {
    // Fallback error handling
    const serializedError = {
      message: err.message || "Internal Server Error",
    };
    res.status(statusCode).json({ error: serializedError });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port: ${PORT}`);
});
