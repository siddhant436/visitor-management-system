import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting admin login with:', { email });

      const response = await axios.post(
        `${API_BASE_URL}/admins/login`,
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Login successful:', response.data);

      const { access_token, user_id, name, email: adminEmail } = response.data;

      // Store in localStorage
      localStorage.setItem('admin_token', access_token);
      localStorage.setItem('admin_id', user_id);
      localStorage.setItem('admin_name', name);
      localStorage.setItem('admin_email', adminEmail);

      // Update auth context
      login({ id: user_id, name, email: adminEmail });

      // Redirect to dashboard
      setTimeout(() => navigate('/admin/dashboard'), 500);
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = typeof err.response?.data?.detail === 'string' 
        ? err.response.data.detail 
        : err.response?.status === 404
          ? 'Login endpoint not found. Please check backend.'
          : 'Login failed. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #030712 0%, #111827 50%, #1f2937 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative', overflow: 'hidden' }}>
      {/* Animated backgrounds */}
      <div style={{ position: 'absolute', width: '400px', height: '400px', background: '#f97316', borderRadius: '50%', top: '-100px', right: '-100px', mixBlendMode: 'multiply', filter: 'blur(100px)', opacity: 0.1, animation: 'float 6s ease-in-out infinite' }}></div>

      <div style={{ maxWidth: '500px', width: '100%', zIndex: 10 }} className="animate-slide-up">
        <div className="card" style={{ padding: '40px 32px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🛡️</div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Admin Login</h1>
            <p style={{ color: '#9ca3af' }}>Access admin dashboard and manage the system</p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '18px' }}>❌</span>
              <span style={{ fontSize: '14px' }}>{String(error)}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '8px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="input-field"
                  style={{ paddingLeft: '40px', width: '100%' }}
                />
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#f97316', fontSize: '18px' }}>
                  ✉️
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '8px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-field"
                  style={{ paddingLeft: '40px', paddingRight: '40px', width: '100%' }}
                />
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#f97316', fontSize: '18px' }}>
                  🔒
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px', transition: 'color 0.3s ease' }}
                  onMouseEnter={(e) => e.target.style.color = '#f97316'}
                  onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: 'white',
                padding: '14px 32px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                marginTop: '12px',
                boxShadow: '0 0 20px rgba(249, 115, 22, 0.3)',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.boxShadow = '0 0 30px rgba(249, 115, 22, 0.6)';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.boxShadow = '0 0 20px rgba(249, 115, 22, 0.3)';
                  e.target.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: '8px' }}></span>
                  Logging in...
                </>
              ) : (
                '🛡️ Admin Login'
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0', color: '#9ca3af' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(75, 85, 99, 0.3)' }}></div>
            <span style={{ fontSize: '12px' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(75, 85, 99, 0.3)' }}></div>
          </div>

          {/* Quick Links */}
          <button
            onClick={() => navigate('/resident/login')}
            className="btn btn-secondary"
            style={{ width: '100%' }}
            type="button"
          >
            👤 Resident Login
          </button>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280', fontSize: '12px' }}>
            <button 
              onClick={() => navigate('/')} 
              style={{ background: 'none', border: 'none', color: '#f97316', cursor: 'pointer', textDecoration: 'underline' }}
              type="button"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}