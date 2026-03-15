import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export default function ResidentLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      const response = await axios.post(
        `${API_BASE_URL}/residents/login`,
        {
          email,
          password
        }
      );

      const { access_token, user_id, name, email: userEmail, apartment_no } = response.data;

      // Store in localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user_id', user_id);
      localStorage.setItem('user_name', name);
      localStorage.setItem('user_email', userEmail);
      localStorage.setItem('apartment_no', apartment_no);

      // Update auth context
      login({ id: user_id, name, email: userEmail, apartment_no });

      // Show success message
      setTimeout(() => navigate('/resident/dashboard'), 500);
    } catch (err) {
      const errorMsg = typeof err.response?.data?.detail === 'string' 
        ? err.response.data.detail 
        : 'Login failed. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #030712 0%, #111827 50%, #1f2937 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative', overflow: 'hidden' }}>
      {/* Animated backgrounds */}
      <div style={{ position: 'absolute', width: '400px', height: '400px', background: '#22c55e', borderRadius: '50%', top: '-100px', right: '-100px', mixBlendMode: 'multiply', filter: 'blur(100px)', opacity: 0.1, animation: 'float 6s ease-in-out infinite' }}></div>
      <div style={{ position: 'absolute', width: '400px', height: '400px', background: '#0ea5e9', borderRadius: '50%', bottom: '-100px', left: '-100px', mixBlendMode: 'multiply', filter: 'blur(100px)', opacity: 0.1, animation: 'float 6s ease-in-out infinite 2s' }}></div>

      <div style={{ maxWidth: '500px', width: '100%', zIndex: 10 }} className="animate-slide-up">
        {/* Card */}
        <div className="card" style={{ padding: '40px 32px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>👤</div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Resident Login</h1>
            <p style={{ color: '#9ca3af' }}>Access your dashboard and notifications</p>
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
                  placeholder="your@email.com"
                  required
                  className="input-field"
                  style={{ paddingLeft: '40px', width: '100%' }}
                />
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#22c55e', fontSize: '18px' }}>
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
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#22c55e', fontSize: '18px' }}>
                  🔒
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px', transition: 'color 0.3s ease' }}
                  onMouseEnter={(e) => e.target.style.color = '#22c55e'}
                  onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="remember"
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#22c55e' }}
              />
              <label htmlFor="remember" style={{ cursor: 'pointer', fontSize: '14px', color: '#9ca3af' }}>
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '12px', fontSize: '16px' }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: '8px' }}></span>
                  Logging in...
                </>
              ) : (
                '🔓 Login'
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0', color: '#9ca3af' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(75, 85, 99, 0.3)' }}></div>
            <span style={{ fontSize: '12px' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(75, 85, 99, 0.3)' }}></div>
          </div>

          {/* Guest Entry */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              onClick={() => navigate('/visitor/check-in')}
              className="btn btn-secondary"
              style={{ fontSize: '14px' }}
              type="button"
            >
              ➕ Check In Visitor
            </button>
            <button
              onClick={() => navigate('/gate/entry')}
              className="btn btn-secondary"
              style={{ fontSize: '14px' }}
              type="button"
            >
              🎤 Gate Entry
            </button>
          </div>

          {/* Sign Up */}
          <div style={{ textAlign: 'center', marginTop: '24px', borderTop: '1px solid rgba(75, 85, 99, 0.3)', paddingTop: '24px' }}>
            <p style={{ color: '#9ca3af', marginBottom: '12px' }}>
              Don't have an account?
            </p>
            <button
              onClick={() => navigate('/resident/register')}
              className="btn btn-secondary"
              style={{ width: '100%' }}
              type="button"
            >
              📝 Create Account
            </button>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280', fontSize: '12px' }}>
            <button 
              onClick={() => navigate('/')} 
              style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', textDecoration: 'underline' }}
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