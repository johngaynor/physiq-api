const express = require("express");
const dotenv = require("dotenv");
const clerkAuth = require("./config/clerkAuth");
const cors = require("cors");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// app.use(
//   cors({
//     origin: true,
//     credentials: true,
//   })
// );

const allowedOrigins = {
  production: "https://www.physiq.app",
  development: "http://localhost:3001",
};

app.use(
  cors({
    origin: allowedOrigins[process.env.NODE_ENV],
    credentials: true,
  })
);

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

app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});
