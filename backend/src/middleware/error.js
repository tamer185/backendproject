export default function errorMiddleware() {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.expose ? err.message : (status === 500 ? 'Internal Server Error' : err.message);
    if (status === 500) console.error('[error]', err);
    res.status(status).json({ error: message });
  };
}
