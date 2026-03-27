import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export default function ResidentDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // State management
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [residentData, setResidentData] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState('');

  // Get from localStorage with validation
  const token = localStorage.getItem('access_token');
  const residentId = localStorage.getItem('user_id');
  const apartmentNo = localStorage.getItem('apartment_no');

  console.log('🏠 ResidentDashboard - Checking values:', {
    user: user?.name,
    token: token ? '✅' : '❌',
    residentId: residentId ? `✅ (${residentId})` : '❌',
    apartmentNo: apartmentNo ? `✅ (${apartmentNo})` : '❌'
  });

  // ===== VALIDATE DATA =====
  useEffect(() => {
    console.log('🔍 Validation effect running...');

    if (authLoading) {
      console.log('⏳ Auth still loading...');
      return;
    }

    // Check if critical data is missing
    if (!user) {
      console.log('❌ No user in context');
      navigate('/resident/login', { replace: true });
      return;
    }

    if (!token) {
      console.log('❌ No token in localStorage');
      localStorage.clear();
      navigate('/resident/login', { replace: true });
      return;
    }

    if (!residentId || residentId === 'undefined') {
      console.log('❌ Invalid residentId:', residentId);
      setError('❌ Invalid session. Please login again.');
      setTimeout(() => {
        localStorage.clear();
        navigate('/resident/login', { replace: true });
      }, 2000);
      return;
    }

    if (!apartmentNo || apartmentNo === 'undefined') {
      console.log('❌ Invalid apartmentNo:', apartmentNo);
      setError('❌ Invalid session. Please login again.');
      setTimeout(() => {
        localStorage.clear();
        navigate('/resident/login', { replace: true });
      }, 2000);
      return;
    }

    console.log('✅ All validations passed, fetching data');
    fetchResidentData();
    fetchPendingApprovals();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchPendingApprovals, 5000);
    return () => clearInterval(interval);
  }, [user, authLoading, token, residentId, apartmentNo, navigate]);

  // ===== FETCH RESIDENT DATA =====
  const fetchResidentData = async () => {
    try {
      console.log('📡 Fetching resident data:', {
        url: `${API_BASE_URL}/residents/${residentId}`,
        residentId
      });

      setLoading(true);
      setError('');

      const response = await axios.get(
        `${API_BASE_URL}/residents/${residentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Resident data received:', response.data);

      if (response.data) {
        setResidentData(response.data);
        console.log('💾 Data set successfully');
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching resident data:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });

      if (error.response?.status === 401) {
        setError('❌ Session expired. Please login again.');
        setTimeout(() => {
          localStorage.clear();
          navigate('/resident/login', { replace: true });
        }, 2000);
      } else if (error.response?.status === 422) {
        setError('❌ Invalid resident ID. Please login again.');
        setTimeout(() => {
          localStorage.clear();
          navigate('/resident/login', { replace: true });
        }, 2000);
      } else {
        setError(`❌ Failed to load profile: ${error.message}`);
      }

      setLoading(false);
    }
  };

  // ===== FETCH PENDING APPROVALS =====
  const fetchPendingApprovals = async () => {
    try {
      if (!apartmentNo || apartmentNo === 'undefined' || !token) {
        console.log('⚠️ Cannot fetch approvals - missing apartmentNo or token');
        return;
      }

      console.log('📡 Fetching pending approvals for apt:', apartmentNo);

      const response = await axios.get(
        `${API_BASE_URL}/visitors/status/pending?apartment_no=${apartmentNo}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const count = Array.isArray(response.data) ? response.data.length : 0;
      console.log('✅ Pending count:', count);
      setPendingCount(count);
    } catch (error) {
      console.error('❌ Error fetching pending approvals:', error);
    }
  };

  // ===== VOICE UPLOAD =====
  const handleVoiceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setMessage('');

      console.log('🎤 Uploading voice file:', file.name);

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

      console.log('✅ Voice uploaded:', response.data);
      setMessage('✅ Voice sample uploaded successfully!');

      setTimeout(() => setMessage(''), 3000);
      fetchResidentData();
    } catch (error) {
      console.error('❌ Voice upload error:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'Upload failed';
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // ===== LOGOUT =====
  const handleLogout = () => {
    console.log('🚪 Logout clicked');
    localStorage.clear();
    navigate('/', { replace: true });
  };

  // ===== LOADING SCREEN =====
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #030712 0%, #111827 50%, #1f2937 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
            animation: 'spin 2s linear infinite'
          }}>
            ⏳
          </div>
          <p>Initializing...</p>
        </div>
      </div>
    );
  }

  // ===== NOT AUTHENTICATED =====
  if (!user || !token) {
    return null;
  }

  // ===== MAIN RENDER =====
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #030712 0%, #111827 50%, #1f2937 100%)'
    }}>
      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '1px solid rgba(75, 85, 99, 0.2)',
        padding: '0 16px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backdropFilter: 'blur(10px)'
      }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            fontSize: '24px'
          }}
          onClick={() => navigate('/')}
        >
          <span>🏢</span>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #22C55E 0%, #16a34a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Resident Dashboard
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          {pendingCount > 0 && (
            <div style={{
              background: 'rgba(249, 115, 22, 0.1)',
              color: '#f97316',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              ⏳ {pendingCount} pending
            </div>
          )}

          <span style={{
            color: '#d1d5db',
            fontSize: '14px'
          }}>
            Welcome, {user?.name}!
          </span>

          <button
            onClick={handleLogout}
            style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '100px 16px 32px'
      }}>
        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            background: 'rgba(220, 38, 38, 0.1)',
            color: '#fca5a5',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            display: 'flex',
            gap: '8px'
          }}>
            <span>❌</span>
            <span>{String(error)}</span>
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            background: message.includes('✅') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(220, 38, 38, 0.1)',
            color: message.includes('✅') ? '#86efac' : '#fca5a5',
            border: message.includes('✅') ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(220, 38, 38, 0.3)',
            display: 'flex',
            gap: '8px'
          }}>
            <span>{message.includes('✅') ? '✅' : '❌'}</span>
            <span>{String(message)}</span>
          </div>
        )}

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
          borderBottom: '2px solid rgba(75, 85, 99, 0.3)',
          paddingBottom: '16px',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'profile', label: '👤 Profile' },
            { id: 'voice', label: '🎤 Voice Upload' },
            { id: 'approvals', label: '⏳ Approvals' }
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
                transition: 'all 0.3s ease'
              }}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== PROFILE TAB ===== */}
        {activeTab === 'profile' && (
          <div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              marginBottom: '32px',
              color: '#e5e7eb',
              marginTop: 0
            }}>
              👤 My Profile
            </h2>

            {loading ? (
              <div style={{
                textAlign: 'center',
                padding: '48px',
                color: '#9ca3af',
                background: 'rgba(31, 41, 55, 0.7)',
                borderRadius: '8px',
                border: '1px solid rgba(75, 85, 99, 0.3)'
              }}>
                <div style={{
                  fontSize: '24px',
                  marginBottom: '16px',
                  animation: 'spin 2s linear infinite'
                }}>
                  ⏳
                </div>
                <p style={{ margin: 0 }}>Loading profile...</p>
              </div>
            ) : residentData ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '24px'
              }}>
                {[
                  { label: 'Name', value: residentData.name, icon: '👤' },
                  { label: 'Email', value: residentData.email, icon: '📧' },
                  { label: 'Phone', value: residentData.phone, icon: '📞' },
                  { label: 'Apartment', value: `Apt ${residentData.apartment_no}`, icon: '🏠' }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'rgba(31, 41, 55, 0.7)',
                      border: '1px solid rgba(75, 85, 99, 0.3)',
                      padding: '20px',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}
                  >
                    <p style={{
                      fontSize: '24px',
                      margin: '0 0 8px 0'
                    }}>
                      {item.icon}
                    </p>
                    <p style={{
                      color: '#9ca3af',
                      fontSize: '12px',
                      marginBottom: '8px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      margin: '0 0 8px 0'
                    }}>
                      {item.label}
                    </p>
                    <p style={{
                      fontSize: '18px',
                      fontWeight: '700',
                      margin: 0,
                      color: '#e5e7eb',
                      wordBreak: 'break-word'
                    }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '48px',
                color: '#9ca3af',
                background: 'rgba(31, 41, 55, 0.7)',
                borderRadius: '8px',
                border: '1px solid rgba(75, 85, 99, 0.3)'
              }}>
                <p style={{ fontSize: '24px', margin: '0 0 16px 0' }}>⚠️</p>
                <p style={{ margin: '0 0 4px 0' }}>No profile data available</p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '8px 0 0 0' }}>
                  Try refreshing the page or logging in again
                </p>
                <button
                  onClick={fetchResidentData}
                  style={{
                    marginTop: '16px',
                    background: '#22c55e',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  🔄 Retry
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== VOICE UPLOAD TAB ===== */}
        {activeTab === 'voice' && (
          <div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              marginBottom: '24px',
              color: '#e5e7eb',
              marginTop: 0
            }}>
              🎤 Voice Upload
            </h2>

            <div style={{
              background: 'rgba(31, 41, 55, 0.7)',
              border: '1px solid rgba(75, 85, 99, 0.3)',
              padding: '32px',
              borderRadius: '8px',
              maxWidth: '600px'
            }}>
              <div style={{
                background: 'rgba(14, 165, 233, 0.1)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                border: '2px solid rgba(14, 165, 233, 0.3)'
              }}>
                <h3 style={{
                  fontWeight: '600',
                  color: '#7dd3fc',
                  marginBottom: '12px',
                  marginTop: 0,
                  fontSize: '18px'
                }}>
                  📝 Instructions
                </h3>
                <p style={{
                  color: '#7dd3fc',
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  lineHeight: 1.6
                }}>
                  Record a voice sample with your name and phone number. This will be used for voice-based gate entry recognition.
                </p>
                <p style={{
                  color: '#7dd3fc',
                  margin: 0,
                  fontSize: '13px',
                  fontStyle: 'italic'
                }}>
                  <strong>Example:</strong> "Hi, my name is John, my phone number is 1234567890"
                </p>
              </div>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
                border: '2px dashed rgba(34, 197, 94, 0.3)',
                borderRadius: '12px',
                cursor: 'pointer',
                background: 'rgba(31, 41, 55, 0.5)',
                transition: 'all 0.3s ease',
                marginBottom: '24px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: '48px',
                    marginBottom: '16px'
                  }}>
                    🎤
                  </div>
                  <p style={{
                    color: '#d1d5db',
                    fontSize: '16px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    margin: '0 0 8px 0'
                  }}>
                    Click to upload voice sample
                  </p>
                  <p style={{
                    color: '#9ca3af',
                    fontSize: '13px',
                    margin: 0
                  }}>
                    Supported formats: MP3, WAV, OGG, M4A
                  </p>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleVoiceUpload}
                    disabled={loading}
                    style={{ display: 'none' }}
                  />
                </div>
              </label>

              {loading && (
                <div style={{
                  textAlign: 'center',
                  padding: '24px',
                  color: '#22c55e',
                  fontWeight: '600'
                }}>
                  <div style={{
                    display: 'inline-block',
                    width: '30px',
                    height: '30px',
                    border: '3px solid rgba(34, 197, 94, 0.2)',
                    borderTopColor: '#22c55e',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    marginRight: '12px',
                    verticalAlign: 'middle'
                  }} />
                  Uploading voice sample...
                </div>
              )}

              {residentData?.voice_registered && (
                <div style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  color: '#86efac',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '2px solid rgba(34, 197, 94, 0.3)',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '20px',
                    margin: '0 0 8px 0'
                  }}>
                    ✅
                  </p>
                  <p style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 8px 0'
                  }}>
                    Voice sample registered!
                  </p>
                  <p style={{
                    fontSize: '13px',
                    color: '#7dd3fc',
                    margin: 0
                  }}>
                    Your voice is ready for gate entry authentication
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== APPROVALS TAB ===== */}
        {activeTab === 'approvals' && (
          <div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              marginBottom: '24px',
              color: '#e5e7eb',
              marginTop: 0
            }}>
              ⏳ Pending Visitor Approvals
            </h2>

            <div style={{
              background: 'rgba(31, 41, 55, 0.7)',
              border: '1px solid rgba(75, 85, 99, 0.3)',
              padding: '32px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '56px',
                margin: '0 0 16px 0'
              }}>
                ⏳
              </p>
              <p style={{
                fontSize: '22px',
                fontWeight: '700',
                color: '#22c55e',
                margin: '0 0 8px 0'
              }}>
                {pendingCount === 0 ? 'All Clear!' : `${pendingCount} Pending Approvals`}
              </p>
              <p style={{
                fontSize: '15px',
                color: '#9ca3af',
                margin: 0,
                marginBottom: '24px'
              }}>
                {pendingCount === 0
                  ? 'No pending visitor approvals'
                  : 'Review and approve pending visitors'}
              </p>
              <button
                onClick={() => navigate('/resident/approvals')}
                style={{
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                type="button"
              >
                View All Approvals →
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}