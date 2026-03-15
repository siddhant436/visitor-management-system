import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export default function ResidentApprovals() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [pendingVisitors, setPendingVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedVisitorId, setSelectedVisitorId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processedVisitors, setProcessedVisitors] = useState([]);

  const token = localStorage.getItem('access_token');
  const apartmentNo = localStorage.getItem('apartment_no');
  const residentId = localStorage.getItem('user_id');

  useEffect(() => {
    if (!user || !token) {
      navigate('/resident/login');
      return;
    }

    fetchPendingVisitors();
    // Poll for new visitors every 5 seconds
    const interval = setInterval(fetchPendingVisitors, 5000);
    return () => clearInterval(interval);
  }, [token, apartmentNo]);

  const fetchPendingVisitors = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/visitors/status/pending?apartment_no=${apartmentNo}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setPendingVisitors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching pending visitors:', error);
    }
  };

  const handleApprove = async (visitorId, visitorName) => {
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/visitors/${visitorId}/approve?resident_id=${residentId}`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setMessage(`✅ ${visitorName} approved! Entry pending admin confirmation.`);
      setProcessedVisitors([...processedVisitors, visitorId]);
      fetchPendingVisitors();
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessage('❌ Error approving visitor');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setMessage('❌ Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/visitors/${selectedVisitorId}/reject?resident_id=${residentId}&rejection_reason=${encodeURIComponent(rejectionReason)}`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setMessage('✅ Visitor rejected successfully!');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedVisitorId(null);
      setProcessedVisitors([...processedVisitors, selectedVisitorId]);
      fetchPendingVisitors();
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessage('❌ Error rejecting visitor');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #030712 0%, #111827 50%, #1f2937 100%)' }}>
      {/* Navigation */}
      <nav className="navbar" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <div className="flex-between" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '24px' }} onClick={() => navigate('/')}>
            <span>🏠</span>
            <div className="gradient-text" style={{ fontSize: '20px', fontWeight: '700' }}>Visitor Approval System</div>
          </div>
          <div className="flex" style={{ gap: '16px', alignItems: 'center' }}>
            <span style={{ color: '#d1d5db', fontSize: '14px' }}>Apt {apartmentNo} • {user?.name}</span>
            <button
              onClick={() => navigate('/resident/dashboard')}
              style={{
                background: 'rgba(75, 85, 99, 0.3)',
                color: '#9ca3af',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                marginRight: '8px'
              }}
            >
              ← Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="btn btn-danger btn-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '100px 16px 32px' }}>
        {/* Info Banner */}
        <div className="card" style={{ 
          padding: '20px', 
          marginBottom: '24px', 
          background: 'rgba(14, 165, 233, 0.1)',
          borderLeft: '4px solid #0ea5e9'
        }}>
          <p style={{ color: '#7dd3fc', margin: 0, fontWeight: '600', fontSize: '14px' }}>
            👋 New visitors are waiting for your approval. Please review and approve or reject them below.
          </p>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: '14px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            background: message.includes('✅') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(220, 38, 38, 0.1)',
            color: message.includes('✅') ? '#86efac' : '#fca5a5',
            border: message.includes('✅') ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(220, 38, 38, 0.3)',
            display: 'flex',
            gap: '8px',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <span>{message.includes('✅') ? '✅' : '❌'}</span>
            <span>{String(message)}</span>
          </div>
        )}

        {/* Pending Visitors */}
        {loading && pendingVisitors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
            <p>Loading pending approvals...</p>
          </div>
        ) : pendingVisitors.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {pendingVisitors.map((visitor) => (
              <div
                key={visitor.id}
                className="card"
                style={{
                  padding: '24px',
                  background: 'rgba(31, 41, 55, 0.7)',
                  borderLeft: '4px solid #f97316',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '20px'
                }}
              >
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <span style={{ fontSize: '40px' }}>👤</span>
                    <div>
                      <h3 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 4px 0' }}>{visitor.name}</h3>
                      <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                        Visitor • Check-in: {new Date(visitor.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginTop: '12px' }}>
                    <div style={{ background: 'rgba(75, 85, 99, 0.3)', padding: '12px', borderRadius: '6px' }}>
                      <p style={{ color: '#9ca3af', fontSize: '11px', margin: '0 0 4px 0', fontWeight: '600', textTransform: 'uppercase' }}>📞 Phone</p>
                      <p style={{ color: '#e5e7eb', fontSize: '15px', margin: 0, fontWeight: '600' }}>{visitor.phone}</p>
                    </div>
                    <div style={{ background: 'rgba(75, 85, 99, 0.3)', padding: '12px', borderRadius: '6px' }}>
                      <p style={{ color: '#9ca3af', fontSize: '11px', margin: '0 0 4px 0', fontWeight: '600', textTransform: 'uppercase' }}>🎯 Purpose</p>
                      <p style={{ color: '#e5e7eb', fontSize: '15px', margin: 0, fontWeight: '600', textTransform: 'capitalize' }}>{visitor.purpose}</p>
                    </div>
                    <div style={{ background: 'rgba(75, 85, 99, 0.3)', padding: '12px', borderRadius: '6px' }}>
                      <p style={{ color: '#9ca3af', fontSize: '11px', margin: '0 0 4px 0', fontWeight: '600', textTransform: 'uppercase' }}>🏠 Apartment</p>
                      <p style={{ color: '#e5e7eb', fontSize: '15px', margin: 0, fontWeight: '600' }}>Apt {visitor.apartment_no}</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', minWidth: '280px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleApprove(visitor.id, visitor.name)}
                    disabled={loading || processedVisitors.includes(visitor.id)}
                    style={{
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      color: 'white',
                      padding: '12px 28px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: '600',
                      cursor: processedVisitors.includes(visitor.id) ? 'not-allowed' : 'pointer',
                      fontSize: '15px',
                      flex: '1',
                      minWidth: '120px',
                      opacity: (loading || processedVisitors.includes(visitor.id)) ? 0.6 : 1,
                      boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && !processedVisitors.includes(visitor.id)) {
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(34, 197, 94, 0.5)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(34, 197, 94, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {processedVisitors.includes(visitor.id) ? '✅ Approved' : '✅ Approve'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedVisitorId(visitor.id);
                      setShowRejectModal(true);
                    }}
                    disabled={loading || processedVisitors.includes(visitor.id)}
                    style={{
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      color: 'white',
                      padding: '12px 28px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: '600',
                      cursor: processedVisitors.includes(visitor.id) ? 'not-allowed' : 'pointer',
                      fontSize: '15px',
                      flex: '1',
                      minWidth: '120px',
                      opacity: (loading || processedVisitors.includes(visitor.id)) ? 0.6 : 1,
                      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && !processedVisitors.includes(visitor.id)) {
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.5)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {processedVisitors.includes(visitor.id) ? '❌ Rejected' : '❌ Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: '64px 32px', textAlign: 'center' }}>
            <p style={{ fontSize: '56px', margin: '0 0 16px 0' }}>✨</p>
            <p style={{ fontSize: '22px', fontWeight: '700', color: '#22c55e', margin: '0 0 8px 0' }}>All Clear!</p>
            <p style={{ fontSize: '15px', color: '#9ca3af', margin: 0 }}>No pending visitor approvals at the moment</p>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', padding: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>❌ Reject Visitor?</h2>
            <p style={{ color: '#9ca3af', marginBottom: '20px', fontSize: '14px' }}>
              Please provide a reason for rejecting this visitor. The admin will be notified of your decision.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Not recognized, No appointment, Suspicious behavior, Unauthorized entry..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                background: 'rgba(31, 41, 55, 0.7)',
                border: '1px solid rgba(75, 85, 99, 0.3)',
                color: '#e5e7eb',
                fontSize: '14px',
                minHeight: '100px',
                fontFamily: 'inherit',
                marginBottom: '20px',
                resize: 'vertical'
              }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: (loading || !rejectionReason.trim()) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: (loading || !rejectionReason.trim()) ? 0.6 : 1
                }}
              >
                {loading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedVisitorId(null);
                }}
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'rgba(75, 85, 99, 0.3)',
                  color: '#9ca3af',
                  padding: '12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}