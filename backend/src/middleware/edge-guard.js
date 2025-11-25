export default function edgeGuard({ headerName, secret }) {
  const name = headerName || 'X-Edge-Secret';
  return (req, res, next) => {
    // Allow healthz even if mounted globally by mistake
    if (req.path === '/healthz') return next();
    const v = req.get(name);
    if (!secret) return res.status(403).json({ error: 'Edge secret not configured' });
    if (v !== secret) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
