export default function authMiddleware({ jwt, role } = {}) {
  return (req, res, next) => {
    const h = req.get("authorization") || "";
    const m = /^Bearer\s+(.+)$/i.exec(h);
    if (!m) return res.status(401).json({ error: "Missing token" });
    try {
      const payload = jwt.verify(m[1]);
      if (role && payload.role !== role)
        return res.status(403).json({ error: "Forbidden" });
      req.user = payload; // { username, role, id, exp }
      next();
    } catch (e) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}
