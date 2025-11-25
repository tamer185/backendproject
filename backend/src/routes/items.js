import express from 'express';

export default function itemsRouter({ items, cfg }) {
  const r = express.Router();

  // GET /items
  r.get('/', async (req, res, next) => {
    try {
      const data = await items.list(req.user.id);
      res.json({ items: data });
    } catch (e) { next(e); }
  });

  // POST /items { text }
  r.post('/', async (req, res, next) => {
    try {
      let { text } = req.body || {};
      if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'text required' });
      let truncated = false;
      if (text.length > cfg.MAX_ITEM_TEXT_LENGTH) {
        text = text.slice(0, cfg.MAX_ITEM_TEXT_LENGTH);
        truncated = true;
      }
      const item = await items.add(req.user.id, text);
      if (truncated) res.set('X-Notice', 'truncated');
      res.json({ item });
    } catch (e) { next(e); }
  });

  // PUT /items { id, text }
  r.put('/', async (req, res, next) => {
    try {
      let { id, text } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'text required' });
      let truncated = false;
      if (text.length > cfg.MAX_ITEM_TEXT_LENGTH) {
        text = text.slice(0, cfg.MAX_ITEM_TEXT_LENGTH);
        truncated = true;
      }
      const item = await items.update(req.user.id, id, text);
      if (!item) return res.status(404).json({ error: 'Not found' });
      if (truncated) res.set('X-Notice', 'truncated');
      res.json({ item });
    } catch (e) { next(e); }
  });

  // DELETE /items { id }
  r.delete('/', async (req, res, next) => {
    try {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const ok = await items.remove(req.user.id, id);
      if (!ok) return res.status(404).json({ error: 'Not found' });
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  return r;
}
