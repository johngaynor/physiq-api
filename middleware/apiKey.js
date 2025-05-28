require("dotenv").config();

function apiKeyMiddleware(req, res, next) {
  const userKey = req.header("x-api-key");
  const apiKey = process.env.API_KEY;

  if (!userKey || userKey !== validKey) {
    return res.status(401).json({
      error: "Unauthorized: Invalid or missing API key",
      req,
    });
  }

  next();
}

module.exports = apiKeyMiddleware;
