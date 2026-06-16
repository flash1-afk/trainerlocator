import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SessionBookingManagement = () => {
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' or 'bookings'
  
  // Sessions State
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState('');
  const [sessionPagination, setSessionPagination] = useState({ currentPage: 1, totalPages: 1 });

  // Bookings State
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [bookingPagination, setBookingPagination] = useState({ currentPage: 1, totalPages: 1 });

  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions(1);
    } else {
      fetchBookings(1);
    }
  }, [activeTab, sessionStatus, bookingStatus, paymentStatus]);

  const fetchSessions = async (page = 1) => {
    try {
      setSessionsLoading(true);
      const response = await axios.get('/admin/sessions', {
        params: { page, limit: 10, status: sessionStatus }
      });
      if (response.data.success) {
        setSessions(response.data.sessions);
        setSessionPagination(response.data.pagination);
        setError(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading sessions');
    } finally {
      setSessionsLoading(false);
    }
  };

  const fetchBookings = async (page = 1) => {
    try {
      setBookingsLoading(true);
      const response = await axios.get('/admin/bookings', {
        params: { page, limit: 10, status: bookingStatus, paymentStatus }
      });
      if (response.data.success) {
        setBookings(response.data.bookings);
        setBookingPagination(response.data.pagination);
        setError(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading bookings');
    } finally {
      setBookingsLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': case 'paid': case 'confirmed':
        return 'status-active';
      case 'cancelled': case 'failed': case 'rejected':
        return 'status-inactive';
      default:
        return 'status-pending';
    }
  };

  return (
    <div className="admin-panel">
      <div className="panel-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
        <h2>📅 Sessions & Bookings Management</h2>
        
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', width: '100%' }}>
          <button 
            className={`btn-page ${activeTab === 'sessions' ? 'active' : ''}`}
            style={{ 
              background: activeTab === 'sessions' ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
              color: activeTab === 'sessions' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === 'sessions' ? '2px solid #38bdf8' : '2px solid transparent',
              borderRadius: '0',
              padding: '1rem 2rem'
            }}
            onClick={() => setActiveTab('sessions')}
          >
            All Sessions
          </button>
          <button 
            className={`btn-page ${activeTab === 'bookings' ? 'active' : ''}`}
            style={{ 
              background: activeTab === 'bookings' ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
              color: activeTab === 'bookings' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === 'bookings' ? '2px solid #38bdf8' : '2px solid transparent',
              borderRadius: '0',
              padding: '1rem 2rem'
            }}
            onClick={() => setActiveTab('bookings')}
          >
            All Bookings & Payments
          </button>
        </div>
      </div>

      {error && <div style={{ color: '#f87171', marginBottom: '1rem' }}>{error}</div>}

      {/* SESSIONS VIEW */}
      {activeTab === 'sessions' && (
        <>
          <div className="admin-controls" style={{ marginBottom: '1.5rem' }}>
            <select 
              className="filter-select"
              value={sessionStatus}
              onChange={(e) => setSessionStatus(e.target.value)}
            >
              <option value="">All Session Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="table-container">
            {sessionsLoading ? (
              <div className="admin-loader-container"><div className="admin-spinner"></div></div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Trainer</th>
                    <th>Trainee (User)</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length > 0 ? sessions.map(session => (
                    <tr key={session._id}>
                      <td>
                        <strong>{new Date(session.date).toLocaleDateString()}</strong><br />
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                          {session.startTime} - {session.endTime}
                        </span>
                      </td>
                      <td>{session.trainerId?.name || 'N/A'}</td>
                      <td>{session.userId?.name || 'N/A'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{session.type}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(session.status)}`}>
                          {session.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No sessions found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          
          {!sessionsLoading && sessions.length > 0 && (
            <div className="pagination">
              <div className="page-info">
                Page {sessionPagination.currentPage} of {sessionPagination.totalPages}
              </div>
              <div className="page-controls">
                <button className="btn-page" disabled={!sessionPagination.hasPrev} onClick={() => fetchSessions(sessionPagination.currentPage - 1)}>Prev</button>
                <button className="btn-page" disabled={!sessionPagination.hasNext} onClick={() => fetchSessions(sessionPagination.currentPage + 1)}>Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* BOOKINGS VIEW */}
      {activeTab === 'bookings' && (
        <>
          <div className="admin-controls" style={{ marginBottom: '1.5rem' }}>
            <select className="filter-select" value={bookingStatus} onChange={(e) => setBookingStatus(e.target.value)}>
              <option value="">All Booking Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select className="filter-select" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
              <option value="">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="table-container">
            {bookingsLoading ? (
              <div className="admin-loader-container"><div className="admin-spinner"></div></div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Created</th>
                    <th>Trainer & User</th>
                    <th>Price</th>
                    <th>Booking Status</th>
                    <th>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length > 0 ? bookings.map(booking => (
                    <tr key={booking._id}>
                      <td>{new Date(booking.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ fontSize: '0.9rem' }}>
                          <strong style={{ color: '#38bdf8' }}>T:</strong> {booking.trainerId?.name || 'N/A'}<br />
                          <strong style={{ color: '#a78bfa' }}>U:</strong> {booking.userId?.name || 'N/A'}
                        </div>
                      </td>
                      <td style={{ fontWeight: 'bold' }}>${booking.totalPrice}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(booking.paymentStatus)}`}>
                          {booking.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No bookings found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          
          {!bookingsLoading && bookings.length > 0 && (
            <div className="pagination">
              <div className="page-info">
                Page {bookingPagination.currentPage} of {bookingPagination.totalPages}
              </div>
              <div className="page-controls">
                <button className="btn-page" disabled={!bookingPagination.hasPrev} onClick={() => fetchBookings(bookingPagination.currentPage - 1)}>Prev</button>
                <button className="btn-page" disabled={!bookingPagination.hasNext} onClick={() => fetchBookings(bookingPagination.currentPage + 1)}>Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SessionBookingManagement;
