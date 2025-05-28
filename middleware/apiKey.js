require("dotenv").config();

function apiKeyMiddleware(req, res, next) {
  const userKey = req.header("x-api-key");
  const apiKey = process.env.API_KEY;

  console.log("Received API Key:", userKey);
  console.log("Expected API Key:", apiKey);

  if (!userKey || userKey !== apiKey) {
    return res.status(401).json({
      error: "Unauthorized: Invalid or missing API key",
    });
  }

  next();
}

module.exports = apiKeyMiddleware;
