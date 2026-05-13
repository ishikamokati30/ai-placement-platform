const jwt = require("jsonwebtoken");

const getAuthToken = (req) => {
  const authHeader = req.get("authorization") || "";
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const bearerToken = bearerMatch?.[1]?.trim();

  if (bearerToken && !["null", "undefined"].includes(bearerToken.toLowerCase())) {
    return bearerToken;
  }

  const fallbackToken =
    req.get("x-auth-token") ||
    req.get("x-access-token") ||
    req.body?.token ||
    req.query?.token;

  return typeof fallbackToken === "string" ? fallbackToken.trim() : null;
};

const protect = (req, res, next) => {
  try {
    const token = getAuthToken(req);

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("Auth Middleware Error: JWT_SECRET is not configured");
      return res.status(500).json({ message: "Server authentication is not configured" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.user = {
      ...decoded,
      id: userId,
      userId,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }

    console.error("Auth Middleware Error:", err);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

module.exports = protect;
