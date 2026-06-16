import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    fetchUsers(1);
  }, [filterRole]);

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/users', {
        params: {
          page,
          limit: 10,
          search: searchTerm,
          role: filterRole
        }
      });
      
      if (response.data.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await axios.put(`/admin/users/${userId}/status`, {
        isActive: !currentStatus
      });
      
      if (response.data.success) {
        setUsers(users.map(u => 
          u._id === userId ? { ...u, isActive: !currentStatus } : u
        ));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await axios.put(`/admin/users/${userId}/role`, {
        role: newRole
      });
      
      if (response.data.success) {
        setUsers(users.map(u => 
          u._id === userId ? { ...u, role: newRole } : u
        ));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating role');
    }
  };

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>👥 User Management</h2>
      </div>

      <div className="admin-controls" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn-page">Search</button>
        </form>

        <select 
          className="filter-select"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="user">Users</option>
          <option value="trainer">Trainers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {error && <div style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</div>}

      <div className="table-container">
        {loading ? (
          <div className="admin-loader-container">
            <div className="admin-spinner"></div>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-cell-avatar">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-cell-info">
                          <span className="user-cell-name">{user.name}</span>
                          <span className="user-cell-email">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select 
                        value={user.role} 
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        style={{
                          background: 'transparent',
                          color: 'inherit',
                          border: '1px solid rgba(255,255,255,0.2)',
                          padding: '0.2rem',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="user">User</option>
                        <option value="trainer">Trainer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={user.isActive} 
                          onChange={() => toggleUserStatus(user._id, user.isActive)}
                        />
                        <span className="slider"></span>
                      </label>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {!loading && users.length > 0 && (
        <div className="pagination">
          <div className="page-info">
            Showing Page {pagination.currentPage} of {pagination.totalPages} (Total: {pagination.totalUsers})
          </div>
          <div className="page-controls">
            <button 
              className="btn-page" 
              disabled={!pagination.hasPrev}
              onClick={() => fetchUsers(pagination.currentPage - 1)}
            >
              Previous
            </button>
            <button 
              className="btn-page" 
              disabled={!pagination.hasNext}
              onClick={() => fetchUsers(pagination.currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
