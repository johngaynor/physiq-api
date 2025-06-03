const { ClerkExpressWithAuth } = require("@clerk/clerk-sdk-node");

const clerkMiddleware = ClerkExpressWithAuth();

const clerkAuth = (req, res, next) => {
  clerkMiddleware(req, res, (err) => {
    if (err) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    if (!req.auth || !req.auth.userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No user session found" });
    }

    next();
  });
};

module.exports = clerkAuth;
