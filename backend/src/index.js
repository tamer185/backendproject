import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'http';
import { createConfig } from './config.js';
import { dbService } from './services/db.js';
import { usersServiceFactory } from './services/users.js';
import { itemsServiceFactory } from './services/items.js';
import { jwtService } from './services/jwt.js';
import { cryptoService } from './services/crypto.js';
import { versionService } from './services/version.js';
import authMiddleware from './middleware/auth.js';
import errorMiddleware from './middleware/error.js';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import itemsRouter from './routes/items.js';
import adminRouter from './routes/admin.js';

const cfg = createConfig(process.env);

// Services
const db = dbService();
const crypto = cryptoService({ rounds: 10 });
const jwt = jwtService({ secret: cfg.JWT_SECRET, ttlHours: cfg.TOKEN_TTL_HOURS });
const users = usersServiceFactory({ db, crypto });
const items = itemsServiceFactory({ db });
const version = versionService();

// Express app
const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: cfg.JSON_BODY_LIMIT || '256kb' }));
app.use(morgan(cfg.isDev ? 'dev' : 'combined'));
app.set('trust proxy', true);

// CORS
const allowlist = new Set([
  cfg.CORS_ORIGIN,                           // e.g. 'https://itec401-nov5-nf.sgubproject.com'
  cfg.CORS_ORIGIN_PRODUCTION
]);

app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowlist.has(origin)),
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: false
}));


// Public health route
app.use('/api/v1/healthz', healthRouter());

// Main API v1 routes
const api = express.Router();
api.use('/auth', authRouter({ users, jwt, crypto, version, cfg }));
api.use('/user', authMiddleware({ jwt }), userRouter({ users }));
api.use('/items', authMiddleware({ jwt }), itemsRouter({ items, cfg }));
api.use('/admin', authMiddleware({ jwt, role: 'admin' }), adminRouter({ users }));
app.use('/api/v1', api);

// Error handling
app.use(errorMiddleware());

// HTTP server
const server = createServer(app);
const port = Number(process.env.PORT ?? cfg.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';

server.listen(port, host, () => {
  console.log(`[server] listening on http://${host}:${port} env=${cfg.NODE_ENV}`);
});
server.on('error', (err) => {
  console.error('[server] listen error:', err?.code || err);
});

// Background initialization
(async () => {
  try {
    await db.init();
    await users.seedAdmin({ adminPassword: cfg.ADMIN_DEFAULT_PASSWORD });
    await users.seedSampleUser(cfg.SAMPLE_USERS || []);
    console.log('[init] DB ready');
  } catch (e) {
    console.error('[init] failed:', e);
  }
})();

// Graceful shutdown
const shutdown = (sig) => () => {
  console.log(`[server] ${sig} received; closing`);
  server.close(() => {
    console.log('[server] closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGINT', shutdown('SIGINT'));
process.on('SIGTERM', shutdown('SIGTERM'));
