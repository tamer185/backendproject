import express from 'express';

export default function adminRouter({ users }) {
  const r = express.Router();

  // GET /admin/users
  r.get('/users', async (req, res, next) => {
    try {
      const list = await users.listSafe();
      res.json({ users: list });
    } catch (e) { next(e); }
  });

  // POST /admin/users { username, password }
  r.post('/users', async (req, res, next) => {
    try {
      const { username, password } = req.body || {};
      const user = await users.adminAddUser({ username, password });
      res.json({ user: { id: user.id, username: user.username, validated: user.validated } });
    } catch (e) { next(e); }
  });

  // PUT /admin/users { id, username?, validated? }
  r.put('/users', async (req, res, next) => {
    try {
      const { id, username, validated } = req.body || {};
      const updated = await users.adminUpdateUser({ id, username, validated });
      res.json({ user: { id: updated.id, username: updated.username, validated: updated.validated } });
    } catch (e) { next(e); }
  });

  // DELETE /admin/users { id }
  r.delete('/users', async (req, res, next) => {
    try {
      const { id } = req.body || {};
      const ok = await users.adminDeleteUser(id);
      if (!ok) return res.status(400).json({ error: 'Cannot delete user' });
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  // POST /admin/users/:id/reset-password { tempPassword }
  r.post('/users/:id/reset-password', async (req, res, next) => {
    try {
      const { tempPassword } = req.body || {};
      await users.adminResetPassword({ id: req.params.id, tempPassword });
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  r.post('/users/:id/validate', async (req, res, next) => {
    try { await users.adminSetValidated(req.params.id, true); res.json({ ok: true }); }
    catch (e) { next(e); }
  });

  r.post('/users/:id/invalidate', async (req, res, next) => {
    try { await users.adminSetValidated(req.params.id, false); res.json({ ok: true }); }
    catch (e) { next(e); }
  });

  return r;
}
