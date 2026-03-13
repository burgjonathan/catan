import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { registerSocketHandlers } from './socketHandlers.js';
import { getStats } from './analytics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Admin tokens that are allowed to access analytics
// The first person to visit ?admin-setup gets a token, or set ADMIN_TOKEN env var
const adminTokens = new Set();
if (process.env.ADMIN_TOKEN) {
  adminTokens.add(process.env.ADMIN_TOKEN);
}
let setupClaimed = !!process.env.ADMIN_TOKEN;

const app = express();
app.use(cors());
app.use(express.json());

// One-time admin setup: first person to call this gets admin access
app.post('/api/admin/setup', (req, res) => {
  if (setupClaimed) {
    return res.status(403).json({ error: 'Admin already set up' });
  }
  const token = crypto.randomUUID();
  adminTokens.add(token);
  setupClaimed = true;
  console.log('Admin token claimed');
  res.json({ token });
});

// Admin analytics API (token-protected)
app.get('/api/admin/analytics', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (!token || !adminTokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json(getStats());
});

// Serve built client files in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/socket.io')) return next();
  if (req.url.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

registerSocketHandlers(io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Catan server listening on port ${PORT}`);
});
