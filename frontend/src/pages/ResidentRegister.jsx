import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export default function ResidentRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    apartment_no: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.name.length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email format';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (formData.phone.length < 7) newErrors.phone = 'Invalid phone number';
    if (formData.apartment_no.length < 1) newErrors.apartment_no = 'Apartment number is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setSuccess('');

    try {
      await axios.post(`${API_BASE_URL}/residents/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        apartment_no: formData.apartment_no,
      });

      setSuccess('✅ Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/resident/login'), 2000);
    } catch (err) {
      const errorMessage = typeof err.response?.data?.detail === 'string'
        ? err.response.data.detail
        : 'Registration failed. Please try again.';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #030712 0%, #111827 50%, #1f2937 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative', overflow: 'hidden' }}>
      {/* Animated backgrounds */}
      <div style={{ position: 'absolute', width: '400px', height: '400px', background: '#22c55e', borderRadius: '50%', top: '-100px', right: '-100px', mixBlendMode: 'multiply', filter: 'blur(100px)', opacity: 0.1, animation: 'float 6s ease-in-out infinite' }}></div>

      <div style={{ maxWidth: '600px', width: '100%', zIndex: 10 }} className="animate-slide-up">
        <div className="card" style={{ padding: '40px 32px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Create Account</h1>
            <p style={{ color: '#9ca3af' }}>Join our smart visitor management system</p>
          </div>

          {/* Success Message */}
          {success && (
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#86efac', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '18px' }}>✅</span>
              <span style={{ fontSize: '14px' }}>{String(success)}</span>
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div style={{ background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '18px' }}>❌</span>
              <span style={{ fontSize: '14px' }}>{String(errors.submit)}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Name */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '6px' }}>
                Full Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={`input-field ${errors.name ? 'input-field-error' : ''}`}
                style={{ width: '100%' }}
              />
              {errors.name && <p className="input-error">❌ {String(errors.name)}</p>}
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '6px' }}>
                Email Address <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className={`input-field ${errors.email ? 'input-field-error' : ''}`}
                style={{ width: '100%' }}
              />
              {errors.email && <p className="input-error">❌ {String(errors.email)}</p>}
            </div>

            {/* Password & Confirm Password */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '6px' }}>
                  Password <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`input-field ${errors.password ? 'input-field-error' : ''}`}
                    style={{ width: '100%', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '16px' }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {errors.password && <p className="input-error">❌ {String(errors.password)}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '6px' }}>
                  Confirm Password <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`input-field ${errors.confirmPassword ? 'input-field-error' : ''}`}
                  style={{ width: '100%' }}
                />
                {errors.confirmPassword && <p className="input-error">❌ {String(errors.confirmPassword)}</p>}
              </div>
            </div>

            {/* Phone & Apartment */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '6px' }}>
                  Phone Number <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className={`input-field ${errors.phone ? 'input-field-error' : ''}`}
                  style={{ width: '100%' }}
                />
                {errors.phone && <p className="input-error">❌ {String(errors.phone)}</p>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '6px' }}>
                  Apartment Number <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="apartment_no"
                  value={formData.apartment_no}
                  onChange={handleChange}
                  placeholder="325"
                  className={`input-field ${errors.apartment_no ? 'input-field-error' : ''}`}
                  style={{ width: '100%' }}
                />
                {errors.apartment_no && <p className="input-error">❌ {String(errors.apartment_no)}</p>}
              </div>
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
                  Creating Account...
                </>
              ) : (
                '📝 Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div style={{ textAlign: 'center', marginTop: '24px', borderTop: '1px solid rgba(75, 85, 99, 0.3)', paddingTop: '24px' }}>
            <p style={{ color: '#9ca3af', marginBottom: '12px' }}>
              Already have an account?
            </p>
            <button
              onClick={() => navigate('/resident/login')}
              className="btn btn-secondary"
              style={{ width: '100%' }}
              type="button"
            >
              🔓 Login Now
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