const { ClerkExpressWithAuth } = require("@clerk/clerk-sdk-node");

const clerkMiddleware = ClerkExpressWithAuth();

const clerkAuth = async (req, res, next) => {
  try {
    await new Promise((resolve, reject) => {
      clerkMiddleware(req, res, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(null);
        }
      });
    });

    if (!req.auth || !req.auth.userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No user session found" });
    }

    next();
  } catch (error) {
    console.error("Clerk authentication error:", error);
    return res
      .status(401)
      .json({ error: "Unauthorized: Invalid token or internal error" });
  }
};

module.exports = clerkAuth;
