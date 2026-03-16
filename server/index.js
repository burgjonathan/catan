import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { registerSocketHandlers } from './socketHandlers.js';
import { getStats } from './analytics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ADMIN_TOKENS_FILE = path.join(__dirname, '..', 'admin_tokens.json');

// Admin tokens that are allowed to access analytics
// Persisted to file so they survive restarts
function loadAdminTokens() {
  try {
    const data = JSON.parse(fs.readFileSync(ADMIN_TOKENS_FILE, 'utf-8'));
    return { tokens: new Set(data.tokens || []), claimed: data.claimed || false };
  } catch {
    return { tokens: new Set(), claimed: false };
  }
}

function saveAdminTokens() {
  fs.writeFileSync(ADMIN_TOKENS_FILE, JSON.stringify({
    tokens: [...adminTokens],
    claimed: setupClaimed,
  }), 'utf-8');
}

const savedAdmin = loadAdminTokens();
const adminTokens = savedAdmin.tokens;
if (process.env.ADMIN_TOKEN) {
  adminTokens.add(process.env.ADMIN_TOKEN);
}
let setupClaimed = savedAdmin.claimed || !!process.env.ADMIN_TOKEN;

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
  saveAdminTokens();
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
