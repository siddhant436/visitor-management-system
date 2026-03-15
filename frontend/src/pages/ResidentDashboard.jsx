import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export default function ResidentDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [residentData, setResidentData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedVisitorId, setSelectedVisitorId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [quickVisitorForm, setQuickVisitorForm] = useState({
    name: '',
    phone: '',
    purpose: 'visit',
    apartment_no: localStorage.getItem('apartment_no') || ''
  });

  const token = localStorage.getItem('access_token');
  const residentId = localStorage.getItem('user_id');

  useEffect(() => {
    if (!user || !token || !residentId) {
      navigate('/resident/login');
      return;
    }

    fetchResidentData();
    fetchNotifications();
    fetchUnreadCount();
    fetchPendingApprovals();

    // Poll for new notifications and approvals every 5 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchPendingApprovals();
      fetchNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, [token, residentId, user]);

  const fetchResidentData = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/residents/${residentId}`,
        { 
          headers: { 
            'Authorization': `Bearer ${token}`
          } 
        }
      );
      setResidentData(response.data);
    } catch (error) {
      console.error('Error fetching resident data:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/resident/login');
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      const apartmentNo = localStorage.getItem('apartment_no');
      
      // Fetch all visitors and filter by apartment
      const response = await axios.get(
        `${API_BASE_URL}/visitors/?skip=0&limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Filter visitors by apartment number
      const filteredVisitors = (response.data || []).filter(
        visitor => visitor.apartment_no === apartmentNo
      );
      
      setNotifications(filteredVisitors);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const apartmentNo = localStorage.getItem('apartment_no');
      const response = await axios.get(
        `${API_BASE_URL}/visitors/status/pending?apartment_no=${apartmentNo}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setPendingCount(Array.isArray(response.data) ? response.data.length : 0);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const apartmentNo = localStorage.getItem('apartment_no');
      
      // Fetch all visitors
      const response = await axios.get(
        `${API_BASE_URL}/visitors/?skip=0&limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Filter and count unread visitors for this apartment
      const filteredVisitors = (response.data || []).filter(
        visitor => visitor.apartment_no === apartmentNo
      );
      
      const unreadVisitors = filteredVisitors.filter(v => !v.is_read) || [];
      setUnreadCount(unreadVisitors.length);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleApproveVisitor = async (visitorId, visitorName) => {
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/visitors/${visitorId}/approve?resident_id=${residentId}`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setMessage(`✅ ${visitorName} approved! Waiting for admin confirmation.`);
      fetchNotifications();
      fetchPendingApprovals();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error approving visitor:', error);
      setMessage('❌ Error approving visitor');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectVisitor = async () => {
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
      fetchNotifications();
      fetchPendingApprovals();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error rejecting visitor:', error);
      setMessage('❌ Error rejecting visitor');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_BASE_URL}/residents/${residentId}/upload-voice`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setMessage('✅ Voice sample uploaded successfully');
      setTimeout(() => setMessage(''), 3000);
      fetchResidentData();
    } catch (error) {
      const errorMsg = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : 'Upload failed';
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRegisterVisitor = async (e) => {
    e.preventDefault();

    if (!quickVisitorForm.name || !quickVisitorForm.phone || !quickVisitorForm.apartment_no) {
      setMessage('❌ Please fill in all required fields');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await axios.post(
        `${API_BASE_URL}/visitors/`,
        {
          name: quickVisitorForm.name,
          phone: quickVisitorForm.phone,
          purpose: quickVisitorForm.purpose,
          apartment_no: quickVisitorForm.apartment_no
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setMessage('✅ Visitor registered successfully!');
      setQuickVisitorForm({ name: '', phone: '', purpose: 'visit', apartment_no: localStorage.getItem('apartment_no') || '' });
      setTimeout(() => setMessage(''), 3000);
      fetchPendingApprovals();
    } catch (error) {
      const errorMsg = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : 'Registration failed';
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate('/');
  };

  if (!user || !token) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #030712 0%, #111827 50%, #1f2937 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #030712 0%, #111827 50%, #1f2937 100%)' }}>
      {/* Navigation */}
      <nav className="navbar" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <div className="flex-between" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '24px' }} onClick={() => navigate('/')}>
            <span>🏠</span>
            <div className="gradient-text" style={{ fontSize: '20px', fontWeight: '700' }}>Resident Dashboard</div>
          </div>
          <div className="flex" style={{ gap: '16px', alignItems: 'center' }}>
            {/* Pending Approvals Badge */}
            {pendingCount > 0 && (
              <div style={{
                background: 'rgba(249, 115, 22, 0.1)',
                color: '#f97316',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                animation: 'glowPulse 2s ease-in-out infinite'
              }}>
                ⏳ {pendingCount} pending approval{pendingCount !== 1 ? 's' : ''}
              </div>
            )}

            <span style={{ color: '#d1d5db', fontSize: '14px' }}>Welcome, {user?.name}!</span>
            <button
              onClick={handleLogout}
              className="btn btn-danger btn-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '100px 16px 32px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap', borderBottom: '2px solid rgba(75, 85, 99, 0.3)', paddingBottom: '16px', overflowX: 'auto' }}>
          {[
            { id: 'profile', label: '👤 Profile', badge: null },
            { id: 'voice', label: '🎤 Voice Upload', badge: null },
            { id: 'notifications', label: '⏳ Pending Approvals', badge: pendingCount > 0 ? pendingCount : null },
            { id: 'quick-register', label: '➕ Register Visitor', badge: null }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === tab.id ? '#22c55e' : '#9ca3af',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '12px 20px',
                borderBottom: activeTab === tab.id ? '2px solid #22c55e' : 'none',
                position: 'relative',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.color = '#86efac';
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) e.currentTarget.style.color = '#9ca3af';
              }}
              type="button"
            >
              {tab.label}
              {tab.badge && (
                <span style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div style={{
            padding: '12px 16px',
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

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '32px' }}>👤 My Profile</h2>

            {residentData ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                <div className="card" style={{ padding: '20px', textAlign: 'center', background: 'rgba(31, 41, 55, 0.7)' }}>
                  <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase' }}>Name</p>
                  <p style={{ fontSize: '20px', fontWeight: '700' }}>{residentData.name}</p>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center', background: 'rgba(31, 41, 55, 0.7)' }}>
                  <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase' }}>Email</p>
                  <p style={{ fontSize: '20px', fontWeight: '700' }}>{residentData.email}</p>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center', background: 'rgba(31, 41, 55, 0.7)' }}>
                  <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase' }}>Phone</p>
                  <p style={{ fontSize: '20px', fontWeight: '700' }}>{residentData.phone}</p>
                </div>
                <div className="card" style={{ padding: '20px', textAlign: 'center', background: 'rgba(31, 41, 55, 0.7)' }}>
                  <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase' }}>Apartment</p>
                  <p style={{ fontSize: '20px', fontWeight: '700' }}>{residentData.apartment_no}</p>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
                <p>Loading profile...</p>
              </div>
            )}
          </div>
        )}

        {/* Voice Upload Tab */}
        {activeTab === 'voice' && (
          <div className="card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '24px' }}>🎤 Voice Upload</h2>

            <div style={{ background: 'rgba(14, 165, 233, 0.1)', borderRadius: '12px', padding: '24px', marginBottom: '24px', border: '2px solid rgba(14, 165, 233, 0.3)' }}>
              <h3 style={{ fontWeight: '600', color: '#7dd3fc', marginBottom: '12px', marginTop: 0, fontSize: '18px' }}>📝 Instructions</h3>
              <p style={{ color: '#7dd3fc', margin: '0 0 8px 0', fontSize: '14px', lineHeight: '1.6' }}>
                Record a voice sample with your name and phone number. This will be used for voice-based gate entry recognition.
              </p>
              <p style={{ color: '#7dd3fc', margin: 0, fontSize: '13px', fontStyle: 'italic' }}>
                <strong>Example:</strong> "Hi, my name is Han, my phone number is 2344234243243"
              </p>
            </div>

            <div style={{ background: 'rgba(31, 41, 55, 0.5)', borderRadius: '12px', border: '2px dashed rgba(34, 197, 94, 0.3)', padding: '40px 24px', textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎤</div>
              <label style={{ cursor: 'pointer' }}>
                <p style={{ color: '#d1d5db', fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                  Click to upload voice sample
                </p>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleVoiceUpload}
                  style={{ display: 'none' }}
                />
              </label>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                Supported formats: MP3, WAV, OGG, M4A
              </p>
            </div>

            {loading && (
              <div style={{ textAlign: 'center', padding: '24px', color: '#22c55e', fontWeight: '600' }}>
                <div style={{
                  display: 'inline-block',
                  width: '30px',
                  height: '30px',
                  border: '3px solid rgba(34, 197, 94, 0.2)',
                  borderTop: '3px solid #22c55e',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  marginRight: '12px',
                  verticalAlign: 'middle'
                }}></div>
                Uploading voice sample...
              </div>
            )}

            {residentData?.voice_registered && (
              <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#86efac', padding: '20px', borderRadius: '12px', border: '2px solid rgba(34, 197, 94, 0.3)', textAlign: 'center' }}>
                <p style={{ fontSize: '20px', margin: '0 0 8px 0' }}>✅</p>
                <p style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Voice sample registered!</p>
                <p style={{ fontSize: '13px', color: '#7dd3fc', marginTop: '8px', margin: '8px 0 0 0' }}>Your voice is ready for gate entry authentication</p>
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab - Pending Approvals */}
        {activeTab === 'notifications' && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '24px' }}>⏳ Pending Visitor Approvals</h2>

            {/* Info Banner */}
            <div className="card" style={{ 
              padding: '16px', 
              marginBottom: '24px', 
              background: 'rgba(14, 165, 233, 0.1)',
              borderLeft: '4px solid #0ea5e9'
            }}>
              <p style={{ color: '#7dd3fc', margin: 0, fontWeight: '600', fontSize: '14px' }}>
                👋 Please review and approve or reject pending visitors below. Your decision will be sent to the admin.
              </p>
            </div>

            {notifications.filter(n => n.status === 'pending').length > 0 ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                {notifications.filter(n => n.status === 'pending').map((visitor) => (
                  <div
                    key={visitor.id}
                    className="card"
                    style={{
                      padding: '24px',
                      background: 'rgba(249, 115, 22, 0.08)',
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
                            📍 Apt {visitor.apartment_no} • {new Date(visitor.created_at).toLocaleTimeString()}
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
                          <p style={{ color: '#9ca3af', fontSize: '11px', margin: '0 0 4px 0', fontWeight: '600', textTransform: 'uppercase' }}>⏳ Status</p>
                          <p style={{ color: '#f97316', fontSize: '15px', margin: 0, fontWeight: '600' }}>Pending</p>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', minWidth: '280px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleApproveVisitor(visitor.id, visitor.name)}
                        disabled={loading}
                        style={{
                          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                          color: 'white',
                          padding: '12px 28px',
                          borderRadius: '8px',
                          border: 'none',
                          fontWeight: '600',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontSize: '15px',
                          flex: '1',
                          minWidth: '120px',
                          opacity: loading ? 0.6 : 1,
                          boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(34, 197, 94, 0.5)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(34, 197, 94, 0.3)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedVisitorId(visitor.id);
                          setShowRejectModal(true);
                        }}
                        disabled={loading}
                        style={{
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: 'white',
                          padding: '12px 28px',
                          borderRadius: '8px',
                          border: 'none',
                          fontWeight: '600',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontSize: '15px',
                          flex: '1',
                          minWidth: '120px',
                          opacity: loading ? 0.6 : 1,
                          boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!loading) {
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.5)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ padding: '64px 32px', textAlign: 'center' }}>
                <p style={{ fontSize: '56px', margin: '0 0 16px 0' }}>✨</p>
                <p style={{ fontSize: '22px', fontWeight: '700', color: '#22c55e', margin: '0 0 8px 0' }}>All Clear!</p>
                <p style={{ fontSize: '15px', color: '#9ca3af', margin: 0 }}>No pending visitor approvals</p>
              </div>
            )}

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
                    placeholder="e.g., Not recognized, No appointment, Suspicious behavior..."
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
                      onClick={handleRejectVisitor}
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
        )}

        {/* Quick Register Visitor Tab */}
        {activeTab === 'quick-register' && (
          <div className="card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '24px' }}>➕ Quick Visitor Registration</h2>

            <form
              onSubmit={handleQuickRegisterVisitor}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}
            >
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '8px' }}>
                  Visitor Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={quickVisitorForm.name}
                  onChange={(e) => setQuickVisitorForm({ ...quickVisitorForm, name: e.target.value })}
                  placeholder="John Doe"
                  required
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '8px' }}>
                  Phone Number <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="tel"
                  value={quickVisitorForm.phone}
                  onChange={(e) => setQuickVisitorForm({ ...quickVisitorForm, phone: e.target.value })}
                  placeholder="9876543210"
                  required
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Purpose */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '8px' }}>
                  Purpose <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={quickVisitorForm.purpose}
                  onChange={(e) => setQuickVisitorForm({ ...quickVisitorForm, purpose: e.target.value })}
                  className="select-field"
                  style={{ width: '100%' }}
                >
                  <option value="visit">Visit</option>
                  <option value="delivery">Delivery</option>
                  <option value="meeting">Meeting</option>
                  <option value="pickup">Pickup</option>
                  <option value="service">Service</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Apartment Number */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '8px' }}>
                  Apartment Number <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={quickVisitorForm.apartment_no}
                  onChange={(e) => setQuickVisitorForm({ ...quickVisitorForm, apartment_no: e.target.value })}
                  placeholder="325"
                  required
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Submit Button */}
              <div style={{ gridColumn: '1 / -1' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '16px' }}
                >
                  {loading ? (
                    <>
                      <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: '8px' }}></span>
                      Registering...
                    </>
                  ) : (
                    '✅ Register Visitor'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  ); 
}