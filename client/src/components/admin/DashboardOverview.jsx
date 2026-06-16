import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/dashboard');
      if (response.data.success) {
        setStats(response.data.stats);
      } else {
        setError('Failed to fetch dashboard statistics');
      }
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
      setError(err.response?.data?.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-loader-container">
        <div className="admin-spinner"></div>
        <p>Loading overview statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-panel" style={{ borderLeft: '4px solid #f87171' }}>
        <h3>Error Loading Dashboard</h3>
        <p style={{ color: '#f87171' }}>{error}</p>
        <button onClick={fetchDashboardStats} className="btn-page" style={{ marginTop: '1rem' }}>
          Try Again
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="dashboard-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-details">
            <h3>Total Users</h3>
            <p className="stat-value">{stats.users.total}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏋️</div>
          <div className="stat-details">
            <h3>Active Trainers</h3>
            <p className="stat-value">{stats.users.trainers}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-details">
            <h3>Total Sessions</h3>
            <p className="stat-value">{stats.sessions.total}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-details">
            <h3>Total Revenue</h3>
            <p className="stat-value">${stats.revenue.total}</p>
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <div className="panel-header">
          <h2>⭐ Top Performing Trainers</h2>
        </div>
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Trainer Name</th>
                <th>Specialization</th>
                <th>Clients</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {stats.topTrainers && stats.topTrainers.length > 0 ? (
                stats.topTrainers.map((trainer, index) => (
                  <tr key={index}>
                    <td>
                      <div className="user-cell">
                        <div className="user-cell-avatar">
                          {trainer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-cell-info">
                          <span className="user-cell-name">{trainer.name}</span>
                          <span className="user-cell-email">{trainer.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{trainer.specialization}</td>
                    <td>{trainer.clients}</td>
                    <td>
                      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>★</span> {trainer.rating?.average || 0}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                    No trainer data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="admin-panel">
          <div className="panel-header">
            <h2>📊 User Breakdown</h2>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span>Regular Users</span>
              <strong>{stats.users.regularUsers}</strong>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span>Active Users</span>
              <strong style={{ color: '#34d399' }}>{stats.users.active}</strong>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span>New (30 Days)</span>
              <strong>{stats.users.newUsers}</strong>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem' }}>
              <span>Admins</span>
              <strong>{stats.users.admins}</strong>
            </li>
          </ul>
        </div>

        <div className="admin-panel">
          <div className="panel-header">
            <h2>🎯 Session Status</h2>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span>Completed</span>
              <strong style={{ color: '#34d399' }}>{stats.sessions.completed}</strong>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span>Scheduled</span>
              <strong style={{ color: '#60a5fa' }}>{stats.sessions.scheduled}</strong>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span>Cancelled</span>
              <strong style={{ color: '#f87171' }}>{stats.sessions.cancelled}</strong>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem' }}>
              <span>Completion Rate</span>
              <strong>{stats.sessions.completionRate}%</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
