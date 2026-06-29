import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TrainerManagement = () => {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerified, setFilterVerified] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    fetchTrainers(1);
  }, [filterVerified]);

  const fetchTrainers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/trainers', {
        params: {
          page,
          limit: 10,
          search: searchTerm,
          verified: filterVerified
        }
      });
      
      if (response.data.success) {
        setTrainers(response.data.trainers);
        setPagination(response.data.pagination);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching trainers:', err);
      setError(err.response?.data?.message || 'Error loading trainers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTrainers(1);
  };

  const toggleVerification = async (trainerId, currentStatus) => {
    try {
      const response = await axios.put(`/admin/trainers/${trainerId}/verify`, {
        isVerified: !currentStatus,
        notes: `Status changed by admin on ${new Date().toLocaleDateString()}`
      });
      
      if (response.data.success) {
        setTrainers(trainers.map(t => 
          t._id === trainerId ? { ...t, isVerified: !currentStatus } : t
        ));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating verification status');
    }
  };

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>🏆 Trainer Verification</h2>
      </div>

      <div className="admin-controls" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Search by name, email or specialization..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '300px' }}
          />
          <button type="submit" className="btn-page">Search</button>
        </form>

        <select 
          className="filter-select"
          value={filterVerified}
          onChange={(e) => setFilterVerified(e.target.value)}
        >
          <option value="">All Verification Status</option>
          <option value="true">Verified Trainers</option>
          <option value="false">Unverified Trainers</option>
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
                <th>Trainer Profile</th>
                <th>Specialization</th>
                <th>Experience</th>
                <th>Hourly Rate</th>
                <th>Verification</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trainers.length > 0 ? (
                trainers.map((trainer) => (
                  <tr key={trainer._id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-cell-avatar">
                          {trainer.userId?.name ? trainer.userId.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="user-cell-info">
                          <span className="user-cell-name">{trainer.userId?.name || 'Unknown User'}</span>
                          <span className="user-cell-email">{trainer.userId?.email || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td>{trainer.specialization}</td>
                    <td>{trainer.experience && typeof trainer.experience === 'object' ? trainer.experience.years : (trainer.experience || 0)} Years</td>
                    <td>${(trainer.services && trainer.services.length > 0) ? trainer.services[0].price : 0}/hr</td>
                    <td>
                      <span className={`status-badge ${trainer.isVerified ? 'status-active' : 'status-pending'}`}>
                        {trainer.isVerified ? '✓ Verified' : '⚠ Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        {!trainer.isVerified ? (
                          <button 
                            className="btn-action approve" 
                            title="Approve Verification"
                            onClick={() => toggleVerification(trainer._id, trainer.isVerified)}
                          >
                            ✓
                          </button>
                        ) : (
                          <button 
                            className="btn-action reject" 
                            title="Revoke Verification"
                            onClick={() => toggleVerification(trainer._id, trainer.isVerified)}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    No trainers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {!loading && trainers.length > 0 && (
        <div className="pagination">
          <div className="page-info">
            Showing Page {pagination.currentPage} of {pagination.totalPages} (Total: {pagination.totalTrainers})
          </div>
          <div className="page-controls">
            <button 
              className="btn-page" 
              disabled={!pagination.hasPrev}
              onClick={() => fetchTrainers(pagination.currentPage - 1)}
            >
              Previous
            </button>
            <button 
              className="btn-page" 
              disabled={!pagination.hasNext}
              onClick={() => fetchTrainers(pagination.currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerManagement;
