import express from "express";
import rateLimit from "express-rate-limit";

export default function authRouter({ users, jwt, crypto, version, cfg }) {
  const r = express.Router();

  const limiter = rateLimit({ windowMs: 5 * 60 * 1000, limit: 100 });
  r.use(limiter);

  // POST /auth/signup
  r.post("/signup", async (req, res, next) => {
    try {
      const { username, password } = req.body || {};
      if (!username || !password)
        return res
          .status(400)
          .json({ error: "username and password required" });
      if (username.toLowerCase() === "admin")
        return res.status(400).json({ error: "Username admin is reserved" });
      await users.createSignup({ username, password });
      return res.json({ message: "Signup submitted. Await admin validation." });
    } catch (e) {
      next(e);
    }
  });

  // POST /auth/signin
  r.post("/signin", async (req, res, next) => {
    try {
      const { username, password } = req.body || {};
      if (!username || !password)
        return res
          .status(400)
          .json({ error: "username and password required" });
      const u = await users.findByUsername(username);
      if (!u) return res.status(400).json({ error: "Invalid credentials" });
      const ok = await crypto.compare(password, u.passwordHash);
      if (!ok) return res.status(400).json({ error: "Invalid credentials" });
      if (u.role !== "admin" && !u.validated)
        return res.status(403).json({ error: "Account pending validation" });

      const token = jwt.sign({ id: u.id, username: u.username, role: u.role });
      const ver = await version.get();
      return res.json({
        token,
        role: u.role,
        username: u.username,
        version: ver,
      });
    } catch (e) {
      next(e);
    }
  });

  return r;
}
