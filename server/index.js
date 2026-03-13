import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerSocketHandlers } from './socketHandlers.js';
import { getStats } from './analytics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ADMIN_KEY = process.env.ADMIN_KEY || 'catan-admin-2024';

const app = express();
app.use(cors());

// Admin analytics API (password-protected)
app.get('/api/admin/analytics', (req, res) => {
  const key = req.query.key || req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) {
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
