import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import OtpInput from '../components/OtpInput';

const API_BASE_URL = 'http://localhost:8000';

// Step identifiers
const STEP_EMAIL = 'email';
const STEP_OTP   = 'otp';
const STEP_FORM  = 'form';

const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const RESEND_COOLDOWN_SECONDS = 60; // 1 minute cooldown before resend

export default function ResidentRegister() {
  const navigate = useNavigate();

  // ---- step control ----
  const [step, setStep] = useState(STEP_EMAIL);

  // ---- email step ----
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // ---- OTP step ----
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpTimer, setOtpTimer] = useState(OTP_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpIntervalRef = useRef(null);
  const resendIntervalRef = useRef(null);

  // ---- registration form step ----
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    phone: '',
    apartment_no: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // ---- shared ----
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // ---- OTP countdown timer ----
  useEffect(() => {
    if (step !== STEP_OTP) return;
    otpIntervalRef.current = setInterval(() => {
      setOtpTimer(t => {
        if (t <= 1) {
          clearInterval(otpIntervalRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(otpIntervalRef.current);
  }, [step]);

  // ---- resend cooldown timer ----
  useEffect(() => {
    if (resendCooldown <= 0) return;
    resendIntervalRef.current = setInterval(() => {
      setResendCooldown(c => {
        if (c <= 1) {
          clearInterval(resendIntervalRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(resendIntervalRef.current);
  }, [resendCooldown]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ============ Step 1: request OTP ============
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setEmailError('');

    if (!email.includes('@')) {
      setEmailError('Invalid email format');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/residents/request-otp`, { email });
      setStep(STEP_OTP);
      setOtpValue('');
      setOtpTimer(OTP_EXPIRY_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const msg = typeof err.response?.data?.detail === 'string'
        ? err.response.data.detail
        : 'Failed to send OTP. Please try again.';
      setEmailError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ============ Resend OTP ============
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtpError('');
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/residents/request-otp`, { email });
      setOtpValue('');
      setOtpTimer(OTP_EXPIRY_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      clearInterval(otpIntervalRef.current);
    } catch (err) {
      const msg = typeof err.response?.data?.detail === 'string'
        ? err.response.data.detail
        : 'Failed to resend OTP. Please try again.';
      setOtpError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ============ Step 2: verify OTP ============
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');

    if (otpValue.length !== 6) {
      setOtpError('Please enter all 6 digits.');
      return;
    }

    if (otpTimer === 0) {
      setOtpError('OTP has expired. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/residents/verify-otp`, {
        email,
        otp_code: otpValue,
      });
      clearInterval(otpIntervalRef.current);
      setStep(STEP_FORM);
    } catch (err) {
      const msg = typeof err.response?.data?.detail === 'string'
        ? err.response.data.detail
        : 'OTP verification failed. Please try again.';
      setOtpError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ============ Step 3: register ============
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errs = {};
    if (formData.name.length < 2)          errs.name = 'Name must be at least 2 characters';
    if (formData.password.length < 8)      errs.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (formData.phone.length < 7)         errs.phone = 'Invalid phone number';
    if (!formData.apartment_no)            errs.apartment_no = 'Apartment number is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setSuccess('');
    setFormErrors({});

    try {
      await axios.post(`${API_BASE_URL}/residents/register`, {
        name: formData.name,
        email,
        password: formData.password,
        phone: formData.phone,
        apartment_no: formData.apartment_no,
      });

      setSuccess('✅ Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/resident/login'), 2000);
    } catch (err) {
      const msg = typeof err.response?.data?.detail === 'string'
        ? err.response.data.detail
        : 'Registration failed. Please try again.';
      setFormErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  // ============ Step indicators ============
  const steps = [
    { id: STEP_EMAIL, label: 'Email',    icon: '📧', num: 1 },
    { id: STEP_OTP,   label: 'Verify',   icon: '🔐', num: 2 },
    { id: STEP_FORM,  label: 'Register', icon: '📝', num: 3 },
  ];
  const currentStepIndex = steps.findIndex(s => s.id === step);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #030712 0%, #111827 50%, #1f2937 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative', overflow: 'hidden' }}>
      {/* Animated background blob */}
      <div style={{ position: 'absolute', width: '400px', height: '400px', background: '#22c55e', borderRadius: '50%', top: '-100px', right: '-100px', mixBlendMode: 'multiply', filter: 'blur(100px)', opacity: 0.1, animation: 'float 6s ease-in-out infinite' }}></div>

      <div style={{ maxWidth: '600px', width: '100%', zIndex: 10 }} className="animate-slide-up">
        <div className="card" style={{ padding: '40px 32px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>📝</div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '6px' }}>Create Account</h1>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>Join our smart visitor management system</p>
          </div>

          {/* Step progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
            {steps.map((s, i) => (
              <React.Fragment key={s.id}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '700', fontSize: '15px',
                    background: i < currentStepIndex ? '#22c55e'
                               : i === currentStepIndex ? 'rgba(34,197,94,0.2)'
                               : 'rgba(75,85,99,0.3)',
                    border: `2px solid ${i <= currentStepIndex ? '#22c55e' : 'rgba(75,85,99,0.4)'}`,
                    color: i < currentStepIndex ? '#fff'
                           : i === currentStepIndex ? '#22c55e'
                           : '#6b7280',
                    transition: 'all 0.3s',
                  }}>
                    {i < currentStepIndex ? '✓' : s.num}
                  </div>
                  <span style={{ fontSize: '11px', marginTop: '4px', color: i === currentStepIndex ? '#22c55e' : '#6b7280' }}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{
                    flex: 2, height: '2px', marginBottom: '18px',
                    background: i < currentStepIndex ? '#22c55e' : 'rgba(75,85,99,0.3)',
                    transition: 'background 0.3s',
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Success Message */}
          {success && (
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '18px' }}>✅</span>
              <span style={{ fontSize: '14px' }}>{success}</span>
            </div>
          )}

          {/* ========== STEP 1: Email ========== */}
          {step === STEP_EMAIL && (
            <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '6px' }}>
                  Email Address <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                  placeholder="your@email.com"
                  className={`input-field ${emailError ? 'input-field-error' : ''}`}
                  style={{ width: '100%' }}
                  autoFocus
                />
                {emailError && <p className="input-error">❌ {emailError}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '4px', fontSize: '16px' }}
              >
                {loading ? (
                  <>
                    <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: '8px' }}></span>
                    Sending OTP...
                  </>
                ) : '📧 Send Verification OTP'}
              </button>

              <p style={{ color: '#6b7280', fontSize: '12px', textAlign: 'center', margin: 0 }}>
                We'll send a 6-digit code to verify your email address.
              </p>
            </form>
          )}

          {/* ========== STEP 2: OTP Verify ========== */}
          {step === STEP_OTP && (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '6px' }}>
                  OTP sent to
                </p>
                <p style={{ color: '#22c55e', fontWeight: '600', fontSize: '15px', marginBottom: '20px' }}>
                  {email}
                </p>

                <OtpInput
                  value={otpValue}
                  onChange={setOtpValue}
                  disabled={loading || otpTimer === 0}
                  hasError={!!otpError}
                />
              </div>

              {/* Timer */}
              <div style={{ textAlign: 'center' }}>
                {otpTimer > 0 ? (
                  <p style={{ color: otpTimer < 60 ? '#f59e0b' : '#6b7280', fontSize: '13px' }}>
                    ⏰ Code expires in <strong style={{ fontFamily: 'monospace' }}>{formatTime(otpTimer)}</strong>
                  </p>
                ) : (
                  <p style={{ color: '#dc2626', fontSize: '13px' }}>
                    ⌛ OTP has expired. Please request a new one.
                  </p>
                )}
              </div>

              {/* OTP Error */}
              {otpError && (
                <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span>❌</span>
                  <span style={{ fontSize: '14px' }}>{otpError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otpValue.length !== 6 || otpTimer === 0}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '16px' }}
              >
                {loading ? (
                  <>
                    <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: '8px' }}></span>
                    Verifying...
                  </>
                ) : '🔐 Verify OTP'}
              </button>

              {/* Resend */}
              <div style={{ textAlign: 'center' }}>
                {resendCooldown > 0 ? (
                  <p style={{ color: '#6b7280', fontSize: '13px' }}>
                    Resend available in <strong style={{ fontFamily: 'monospace' }}>{resendCooldown}s</strong>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}
                  >
                    🔄 Resend OTP
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => { setStep(STEP_EMAIL); setOtpValue(''); setOtpError(''); }}
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '13px', textAlign: 'center' }}
              >
                ← Change email
              </button>
            </form>
          )}

          {/* ========== STEP 3: Registration Form ========== */}
          {step === STEP_FORM && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Verified email badge */}
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '10px 14px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span>✅</span>
                <span style={{ color: '#86efac', fontSize: '13px' }}>
                  Email verified: <strong>{email}</strong>
                </span>
              </div>

              {formErrors.submit && (
                <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span>❌</span>
                  <span style={{ fontSize: '14px' }}>{formErrors.submit}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '6px' }}>
                  Full Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="John Doe"
                  className={`input-field ${formErrors.name ? 'input-field-error' : ''}`}
                  style={{ width: '100%' }}
                />
                {formErrors.name && <p className="input-error">❌ {formErrors.name}</p>}
              </div>

              {/* Password & Confirm */}
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
                      onChange={handleFormChange}
                      placeholder="••••••••"
                      className={`input-field ${formErrors.password ? 'input-field-error' : ''}`}
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
                  {formErrors.password && <p className="input-error">❌ {formErrors.password}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '6px' }}>
                    Confirm Password <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleFormChange}
                    placeholder="••••••••"
                    className={`input-field ${formErrors.confirmPassword ? 'input-field-error' : ''}`}
                    style={{ width: '100%' }}
                  />
                  {formErrors.confirmPassword && <p className="input-error">❌ {formErrors.confirmPassword}</p>}
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
                    onChange={handleFormChange}
                    placeholder="9876543210"
                    className={`input-field ${formErrors.phone ? 'input-field-error' : ''}`}
                    style={{ width: '100%' }}
                  />
                  {formErrors.phone && <p className="input-error">❌ {formErrors.phone}</p>}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#d1d5db', marginBottom: '6px' }}>
                    Apartment Number <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="apartment_no"
                    value={formData.apartment_no}
                    onChange={handleFormChange}
                    placeholder="325"
                    className={`input-field ${formErrors.apartment_no ? 'input-field-error' : ''}`}
                    style={{ width: '100%' }}
                  />
                  {formErrors.apartment_no && <p className="input-error">❌ {formErrors.apartment_no}</p>}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '8px', fontSize: '16px' }}
              >
                {loading ? (
                  <>
                    <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: '8px' }}></span>
                    Creating Account...
                  </>
                ) : '📝 Create Account'}
              </button>
            </form>
          )}

          {/* Login Link */}
          <div style={{ textAlign: 'center', marginTop: '24px', borderTop: '1px solid rgba(75,85,99,0.3)', paddingTop: '24px' }}>
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

          {/* Back to Home */}
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