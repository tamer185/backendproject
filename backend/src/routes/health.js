import express from 'express';
export default function healthRouter() {
  const r = express.Router();
  r.get('/', (req, res) => res.json({ ok: true }));
  return r;
}
