import express from 'express';

export default function userRouter({ users }) {
  const r = express.Router();

  // GET /user/me
  r.get('/me', async (req, res, next) => {
    try {
      const u = await users.findById(req.user.id);
      if (!u) return res.status(404).json({ error: 'Not found' });
      return res.json({ username: u.username, signedUpAt: u.signedUpAt });
    } catch (e) { next(e); }
  });

  // PUT /user/password
  r.put('/password', async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword required' });
      await users.changePassword({ id: req.user.id, currentPassword, newPassword });
      return res.json({ ok: true });
    } catch (e) { next(e); }
  });

  return r;
}
