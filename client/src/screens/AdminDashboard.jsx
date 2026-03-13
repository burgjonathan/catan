import { useState, useEffect, useCallback } from 'react';
import './AdminDashboard.css';

const ADMIN_TOKEN_KEY = 'catan_admin_token';

function formatDuration(ms) {
  if (ms < 1000) return '0s';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString();
}

function shortenSession(id) {
  if (!id || id === 'unknown') return 'unknown';
  return id.substring(0, 8) + '...';
}

export function isAdmin() {
  return !!localStorage.getItem(ADMIN_TOKEN_KEY);
}

export default function AdminDashboard({ onBack }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/analytics', {
        headers: { 'x-admin-token': token }
      });
      if (!res.ok) {
        if (res.status === 401) {
          setError('Admin access revoked');
          return;
        }
        throw new Error('Failed to fetch');
      }
      const data = await res.json();
      setStats(data);
      setError('');
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return (
    <div className="admin-screen">
      <div className="admin-header">
        <h1>Analytics Dashboard</h1>
        <div className="admin-header-actions">
          <button className="btn btn-secondary" onClick={fetchStats} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="admin-back-btn btn btn-secondary" onClick={onBack}>
            Back to Game
          </button>
        </div>
      </div>

      {error && <div className="lobby-error" style={{ marginBottom: 16 }}>{error}</div>}

      {stats && (
        <>
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-value">{stats.activeUsersCount}</div>
              <div className="admin-stat-label">Users Online Now</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-value">{stats.totalVisits}</div>
              <div className="admin-stat-label">Total Visits</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-value">{stats.uniqueSessions}</div>
              <div className="admin-stat-label">Unique Visitors</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-value">{formatDuration(stats.serverUptime)}</div>
              <div className="admin-stat-label">Server Uptime</div>
            </div>
          </div>

          {stats.activeUsers.length > 0 && (
            <div className="admin-section">
              <h2>Currently Online ({stats.activeUsers.length})</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Session</th>
                    <th>Connected</th>
                    <th>Duration</th>
                    <th>In Game</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.activeUsers.map(u => (
                    <tr key={u.socketId}>
                      <td><span className="admin-online-dot online" />Online</td>
                      <td title={u.sessionId}>{shortenSession(u.sessionId)}</td>
                      <td>{formatTime(u.connectedAt)}</td>
                      <td>{formatDuration(u.currentSessionDuration)}</td>
                      <td>{u.inGame ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="admin-section">
            <h2>All Visitors ({stats.sessions.length})</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Session</th>
                  <th>First Visit</th>
                  <th>Last Seen</th>
                  <th>Total Time</th>
                  <th>Visits</th>
                  <th>Games Played</th>
                </tr>
              </thead>
              <tbody>
                {stats.sessions.map(s => (
                  <tr key={s.sessionId}>
                    <td>
                      <span className={`admin-online-dot ${s.isOnline ? 'online' : 'offline'}`} />
                      {s.isOnline ? 'Online' : 'Offline'}
                    </td>
                    <td title={s.sessionId}>{shortenSession(s.sessionId)}</td>
                    <td>{formatTime(s.firstSeen)}</td>
                    <td>{formatTime(s.lastSeen)}</td>
                    <td>{formatDuration(s.totalTime)}</td>
                    <td>{s.visits}</td>
                    <td>{s.gamesPlayed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-refresh-note">
            Auto-refreshes every 10 seconds | Server started {formatTime(stats.serverStartedAt)}
          </div>
        </>
      )}
    </div>
  );
}
