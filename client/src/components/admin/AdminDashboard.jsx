import React, { useState } from 'react';
import './admin.css';

// Admin Components
import DashboardOverview from './DashboardOverview';
import UserManagement from './UserManagement';
import TrainerManagement from './TrainerManagement';
import SessionBookingManagement from './SessionBookingManagement';

const AdminDashboard = ({ user }) => {
  const [activeView, setActiveView] = useState('overview');

  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return <DashboardOverview />;
      case 'users':
        return <UserManagement />;
      case 'trainers':
        return <TrainerManagement />;
      case 'sessions':
        return <SessionBookingManagement />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">⚡</div>
          <h2>Control Panel</h2>
        </div>

        <nav className="admin-nav">
          <button 
            className={`admin-nav-item ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveView('overview')}
          >
            <span className="admin-nav-icon">📊</span>
            Dashboard Overview
          </button>
          
          <button 
            className={`admin-nav-item ${activeView === 'users' ? 'active' : ''}`}
            onClick={() => setActiveView('users')}
          >
            <span className="admin-nav-icon">👥</span>
            User Management
          </button>
          
          <button 
            className={`admin-nav-item ${activeView === 'trainers' ? 'active' : ''}`}
            onClick={() => setActiveView('trainers')}
          >
            <span className="admin-nav-icon">🏆</span>
            Trainer Verification
          </button>

          <button 
            className={`admin-nav-item ${activeView === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveView('sessions')}
          >
            <span className="admin-nav-icon">📅</span>
            Sessions & Bookings
          </button>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="admin-user-info">
            <div className="admin-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{user?.name || 'Administrator'}</div>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Admin Privilege</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-content">
        <header className="admin-header">
          <h1>
            {activeView === 'overview' && 'System Overview'}
            {activeView === 'users' && 'User Directory'}
            {activeView === 'trainers' && 'Trainer Operations'}
            {activeView === 'sessions' && 'Platform Activity'}
          </h1>
          <div className="admin-actions">
            {/* Can add global admin actions here like notifications, export, etc. */}
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>

        {renderView()}
      </main>
    </div>
  );
};

export default AdminDashboard;
