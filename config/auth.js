require("dotenv").config();

function auth(req, res, next) {
  const userKey = req.header("x-api-key");
  const apiKey = process.env.TEST_API_KEY;

  if (!userKey || userKey !== apiKey) {
    return res.status(401).json({
      error: "Unauthorized: Invalid or missing API key",
    });
  }

  next();
}

module.exports = auth;
