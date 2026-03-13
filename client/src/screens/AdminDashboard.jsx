import { useState, useEffect, useCallback } from 'react';
import './AdminDashboard.css';

const ADMIN_KEY_STORAGE = 'catan_admin_key';

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

export default function AdminDashboard({ onBack }) {
  const [adminKey, setAdminKey] = useState(localStorage.getItem(ADMIN_KEY_STORAGE) || '');
  const [authenticated, setAuthenticated] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async (key) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/analytics?key=${encodeURIComponent(key)}`);
      if (!res.ok) {
        if (res.status === 401) {
          setAuthenticated(false);
          localStorage.removeItem(ADMIN_KEY_STORAGE);
          setError('Invalid admin key');
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
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    const key = keyInput.trim();
    if (!key) return;

    const res = await fetch(`/api/admin/analytics?key=${encodeURIComponent(key)}`);
    if (res.ok) {
      localStorage.setItem(ADMIN_KEY_STORAGE, key);
      setAdminKey(key);
      setAuthenticated(true);
      setError('');
      const data = await res.json();
      setStats(data);
    } else {
      setError('Wrong admin key');
    }
  };

  // Auto-login if key is stored
  useEffect(() => {
    if (adminKey && !authenticated) {
      fetch(`/api/admin/analytics?key=${encodeURIComponent(adminKey)}`)
        .then(res => {
          if (res.ok) {
            setAuthenticated(true);
            return res.json();
          }
          localStorage.removeItem(ADMIN_KEY_STORAGE);
          return null;
        })
        .then(data => { if (data) setStats(data); });
    }
  }, []);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!authenticated || !adminKey) return;
    const interval = setInterval(() => fetchStats(adminKey), 10000);
    return () => clearInterval(interval);
  }, [authenticated, adminKey, fetchStats]);

  if (!authenticated) {
    return (
      <div className="admin-login">
        <div className="admin-login-box">
          <h2>Admin Dashboard</h2>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter admin key..."
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              autoFocus
            />
            {error && <div className="admin-login-error">{error}</div>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Login
            </button>
          </form>
          <div style={{ marginTop: 16 }}>
            <button className="admin-back-btn btn btn-secondary" onClick={onBack}>
              Back to Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-screen">
      <div className="admin-header">
        <h1>Analytics Dashboard</h1>
        <div className="admin-header-actions">
          <button className="btn btn-secondary" onClick={() => fetchStats(adminKey)} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="admin-back-btn btn btn-secondary" onClick={onBack}>
            Back to Game
          </button>
          <button className="btn btn-secondary" onClick={() => {
            localStorage.removeItem(ADMIN_KEY_STORAGE);
            setAuthenticated(false);
            setAdminKey('');
            setStats(null);
          }}>
            Logout
          </button>
        </div>
      </div>

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
