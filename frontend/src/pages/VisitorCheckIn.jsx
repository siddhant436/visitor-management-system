import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export default function VisitorCheckIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    purpose: 'visit',
    apartment_no: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const purposes = ['visit', 'delivery', 'meeting', 'pickup', 'service', 'other'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(`${API_BASE_URL}/visitors/`, formData);
      setSuccess('✅ Visitor checked in successfully!');
      setFormData({ name: '', phone: '', purpose: 'visit', apartment_no: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = typeof err.response?.data?.detail === 'string'
        ? err.response.data.detail
        : 'Check-in failed. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #030712 0%, #111827 50%, #1f2937 100%)', padding: '80px 16px 32px', position: 'relative', overflow: 'hidden' }}>
      {/* Navbar */}
      <nav className="navbar" style={{ position: 'fixed', top: 0, left: 0, right: 0 }}>
        <div className="flex-between" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '24px' }} onClick={() => navigate('/')}>
            <span>🏠</span>
            <div className="gradient-text" style={{ fontSize: '20px', fontWeight: '700' }}>Visitor Check-In</div>
          </div>
          <button onClick={() => navigate('/')} className="btn btn-secondary btn-sm">
            ← Back
          </button>
        </div>
      </nav>

      {/* Animated backgrounds */}
      <div style={{ position: 'absolute', width: '400px', height: '400px', background: '#22c55e', borderRadius: '50%', top: '-100px', right: '-100px', mixBlendMode: 'multiply', filter: 'blur(100px)', opacity: 0.1, animation: 'float 6s ease-in-out infinite' }}></div>

      <div style={{ maxWidth: '700px', margin: '0 auto', zIndex: 10 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px' }} className="animate-fade-in">
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>➕</div>
          <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>Register Visitor</h1>
          <p style={{ color: '#9ca3af', fontSize: '16px' }}>Quick and easy visitor check-in</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '40px 32px' }}>
          {/* Messages */}
          {error && (
            <div style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '8px' }}>
              <span>❌</span>
              <span>{String(error)}</span>
            </div>
          )}

          {success && (
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#86efac', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '8px' }}>
              <span>✅</span>
              <span>{String(success)}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '8px' }}>
                Visitor Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
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
                name="phone"
                value={formData.phone}
                onChange={handleChange}
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
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                className="select-field"
                style={{ width: '100%' }}
              >
                {purposes.map(p => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Apartment */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '8px' }}>
                Apartment Number <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                name="apartment_no"
                value={formData.apartment_no}
                onChange={handleChange}
                placeholder="325"
                required
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '12px', fontSize: '16px' }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: '8px' }}></span>
                  Checking In...
                </>
              ) : (
                '✅ Check In'
              )}
            </button>
          </form>

          {/* Quick Links */}
          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(75, 85, 99, 0.3)' }}>
            <p style={{ color: '#9ca3af', marginBottom: '12px', fontSize: '14px', textAlign: 'center' }}>
              Other check-in methods
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => navigate('/visitor/voice-check-in')}
                className="btn btn-secondary"
                style={{ fontSize: '14px' }}
                type="button"
              >
                🎤 Voice Check-In
              </button>
              <button
                onClick={() => navigate('/gate/entry')}
                className="btn btn-secondary"
                style={{ fontSize: '14px' }}
                type="button"
              >
                🚪 Gate Entry
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}