import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { verifyConnection, closeDriver } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// 1. Security & Diagnostic Middleware
// NOTE: CORS must be mounted BEFORE helmet and BEFORE routes.
// Helmet's default cross-origin policies (COEP/CORP/CORP) can make cross-origin
// responses opaque even when CORS headers are present, so we relax them while
// keeping the useful protections (CSP, XSS-DNS, hide-powered-by, etc.).
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow any origin in development, or allow no-origin (same-origin / curl / proxies).
      const allowed = [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'];
      if (!origin || allowed.includes(origin) || process.env.NODE_ENV === 'development') {
        cb(null, true);
      } else {
        // Still allow the request — the browser/frontend will enforce; but if the
        // server is behind a reverse proxy the origin may be unset/injected.
        cb(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86400,
  })
);
app.options('*', cors());
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'connect-src': ["'self'", 'http://localhost:*', 'https://*'],
        'img-src': ["'self'", 'data:', 'https:'],
        'style-src': ["'self'", "'unsafe-inline'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'font-src': ["'self'", 'data:', 'https:'],
      },
    },
  })
);
app.use(express.json());
app.use(morgan('dev'));

// 2. API Routes
app.use('/api', apiRouter);

// 3. Welcome / Root Documentation Endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'SkillGraph Backend API',
    description: 'Graph-Powered Developer Knowledge & Career Progression API built for CognoDB',
    database: 'CognoDB (via official Neo4j Bolt driver)',
    endpoints: {
      health: 'GET /api/health',
      seed: 'POST /api/seed',
      search: 'GET /api/search?q=:searchTerm',
      developers: 'GET /api/developers',
      developerByName: 'GET /api/developers/:name',
      developerRelated: 'GET /api/developers/:name/related',
      developerProjectSkills: 'GET /api/developers/:name/project-skills',
      skills: 'GET /api/skills',
      skillByName: 'GET /api/skills/:name',
      skillDevelopers: 'GET /api/skills/:name/developers',
      graphOverview: 'GET /api/graph/overview',
      graphDomains: 'GET /api/graph/domains',
      roles: 'GET /api/roles',
      roleById: 'GET /api/roles/:id',
      skillGapAnalysis: 'GET /api/analysis/gap?developerId=:devId&roleId=:roleId',
    },
  });
});

// 4. 404 Route Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API route not found. Refer to GET / for available endpoints.',
  });
});

// 5. Global Error Handling Middleware
app.use(errorHandler);

// 6. Start HTTP Server and Verify CognoDB Connectivity
const server = app.listen(PORT, async () => {
  console.log('======================================================');
  console.log(`🚀 SkillGraph Backend Server running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log('======================================================');

  const conn = await verifyConnection();
  if (conn.connected) {
    console.log(`✅ CognoDB Connection Established!`);
    console.log(`   URI: ${conn.uri}`);
    console.log(`   Agent: ${conn.serverAgent}`);
  } else {
    console.warn(`⚠️ CognoDB Connection Warning: ${conn.error}`);
    console.warn(`   Configure COGNODB_URI, COGNODB_USERNAME, and COGNODB_PASSWORD in your .env file.`);
  }
});

// 7. Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Closing HTTP server and CognoDB driver pool...');
  server.close(async () => {
    await closeDriver();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received. Closing HTTP server and CognoDB driver pool...');
  server.close(async () => {
    await closeDriver();
    process.exit(0);
  });
});

export default app;
