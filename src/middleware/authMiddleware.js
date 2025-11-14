import jwt from "jsonwebtoken";

/**
 * Middleware to check if request has valid JWT token
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Expect: Bearer <token>

  if (!token) {
    return res.status(401).json({
      rrn: req.rrn,
      success: false,
      message: "Access Denied: No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user payload to request
    next();
  } catch (err) {
    return res.status(403).json({
      rrn: req.rrn,
      success: false,
      message: "Invalid or expired token",
    });
  }
};

/**
 * Middleware for Role-Based Access Control
 * @param {Array} roles - allowed roles e.g. ["admin", "teacher"]
 */
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        rrn: req.rrn,
        success: false,
        message: "Unauthorized: No user data found",
      });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        rrn: req.rrn,
        success: false,
        message: "Forbidden: You don’t have permission",
      });
    }

    next();
  };
};
