const jwt  = require("jsonwebtoken");
const User = require("../models/User");

// ── protect: verify JWT, attach req.user ─────────────────────────────────
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select("-password");

      if (!user)          return res.status(401).json({ message: "User not found" });
      if (!user.isActive) return res.status(401).json({ message: "Account deactivated. Contact your admin." });
      if (user.isBlocked) return res.status(403).json({ message: "Account blocked. Contact your school admin." });

      req.user = user;
      next();
    } catch {
      res.status(401).json({ message: "Not authorized — invalid or expired token" });
    }
  } else {
    res.status(401).json({ message: "No token provided" });
  }
};

// ── requireRole: gate routes by role ─────────────────────────────────────
// Usage: router.get("/route", protect, requireRole("admin", "superadmin"), handler)
exports.requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Requires role: ${roles.join(" or ")}`
    });
  }
  next();
};

// ── requireSameSchool: prevent cross-school access ────────────────────────
// Superadmins bypass this check — they can see everything
exports.requireSameSchool = (req, res, next) => {
  if (req.user.role === "superadmin") return next();

  const targetSchoolId =
    req.params.schoolId || req.body.schoolId || req.query.schoolId;

  if (targetSchoolId && String(req.user.schoolId) !== String(targetSchoolId)) {
    return res.status(403).json({ message: "Access denied — school mismatch" });
  }
  next();
};
