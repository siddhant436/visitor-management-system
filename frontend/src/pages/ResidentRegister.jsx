import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { Mail, Lock, User, Phone, Home, ArrowRight } from 'lucide-react';
import { theme } from '../styles/theme';
import { Button } from '../components/Button/Button';
import { Input } from '../components/Input/Input';
import { Card, CardBody } from '../components/Card/Card';

const API_BASE_URL = 'http://localhost:8000';

const RegisterContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing[4]};
  background: linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.backgroundAlt} 50%, ${theme.colors.surface} 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    background: ${theme.colors.primary};
    border-radius: 50%;
    top: -100px;
    right: -100px;
    opacity: 0.1;
    filter: blur(100px);
    animation: float 6s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    background: ${theme.colors.secondary};
    border-radius: 50%;
    bottom: -100px;
    left: -100px;
    opacity: 0.1;
    filter: blur(100px);
    animation: float 8s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
`;

const RegisterCard = styled(Card)`
  max-width: 550px;
  width: 100%;
  position: relative;
  z-index: 1;

  @media (max-width: ${theme.breakpoints.sm}) {
    max-width: 100%;
  }
`;

const LogoSection = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing[6]};

  h1 {
    font-size: ${theme.fontSizes['3xl']};
    background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
  }

  p {
    color: ${theme.colors.gray400};
    margin-top: ${theme.spacing[2]};
  }
`;

const ProgressBar = styled.div`
  display: flex;
  gap: ${theme.spacing[2]};
  margin-bottom: ${theme.spacing[6]};

  div {
    flex: 1;
    height: 4px;
    background: ${theme.colors.gray700};
    border-radius: ${theme.radius.full};
    transition: background ${theme.transitions.base};
    background: ${props => props.active ? `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)` : theme.colors.gray700};
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing[4]};

  @media (max-width: ${theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
`;

const ErrorAlert = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid ${theme.colors.error};
  border-radius: ${theme.radius.lg};
  padding: ${theme.spacing[4]};
  color: ${theme.colors.errorLight};
  font-size: ${theme.fontSizes.sm};
  animation: slideInFromTop 0.3s ease-out;

  @keyframes slideInFromTop {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const SuccessAlert = styled.div`
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid ${theme.colors.success};
  border-radius: ${theme.radius.lg};
  padding: ${theme.spacing[4]};
  color: ${theme.colors.successLight};
  font-size: ${theme.fontSizes.sm};
  animation: slideInFromTop 0.3s ease-out;

  @keyframes slideInFromTop {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const LoginLink = styled.p`
  text-align: center;
  color: ${theme.colors.gray400};
  font-size: ${theme.fontSizes.sm};
  margin-top: ${theme.spacing[4]};

  a {
    color: ${theme.colors.primary};
    font-weight: ${theme.fontWeights.semibold};
    text-decoration: none;
    transition: color ${theme.transitions.fast};

    &:hover {
      color: ${theme.colors.primaryLight};
    }
  }
`;

export default function ResidentRegister() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    phone: '',
    apartment_no: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Timer for OTP
  useEffect(() => {
    if (!emailSent || currentStep !== 2) return;

    let startTime = Date.now();
    const TEN_MINUTES = 10 * 60 * 1000;

    const updateTimer = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, TEN_MINUTES - elapsed);
      const seconds = Math.ceil(remaining / 1000);

      setTimeRemaining(seconds);

      if (remaining <= 0) {
        setOtpError('OTP has expired. Please request a new one.');
        clearInterval(interval);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [emailSent, currentStep]);

  const validateEmail = (emailValue) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/otp/request`, {
        email: email.trim()
      });

      setEmailSent(true);
      setOtp('');
      setOtpError('');
      setCurrentStep(2);
    } catch (err) {
      const errorMessage = typeof err.response?.data?.detail === 'string'
        ? err.response.data.detail
        : 'Failed to send OTP. Please try again.';
      setEmailError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');

    if (!otp || otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/otp/verify`, {
        email: email.trim(),
        otp_code: otp
      });

      setSuccess('✅ Email verified successfully!');
      setCurrentStep(3);
    } catch (err) {
      const errorMessage = typeof err.response?.data?.detail === 'string'
        ? err.response.data.detail
        : 'OTP verification failed. Please try again.';
      setOtpError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.name.length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (formData.phone.length < 7) newErrors.phone = 'Invalid phone number';
    if (formData.apartment_no.length < 1) newErrors.apartment_no = 'Apartment number is required';

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/residents/register`, {
        name: formData.name,
        email: email.trim(),
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
      setFormErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegisterContainer>
      <RegisterCard hoverable={false}>
        <LogoSection>
          <h1>🏢 VMS</h1>
          <p>Create Your Account</p>
        </LogoSection>

        <ProgressBar>
          <div active={currentStep >= 1} />
          <div active={currentStep >= 2} />
          <div active={currentStep >= 3} />
        </ProgressBar>

        <CardBody>
          {formErrors.submit && <ErrorAlert>⚠️ {formErrors.submit}</ErrorAlert>}
          {success && <SuccessAlert>✅ {success}</SuccessAlert>}

          {/* STEP 1: EMAIL */}
          {currentStep === 1 && (
            <form onSubmit={handleRequestOtp}>
              <FormGroup>
                {emailError && <ErrorAlert>{emailError}</ErrorAlert>}

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  icon={Mail}
                  disabled={loading}
                />

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleRequestOtp}
                  disabled={!email || loading}
                  icon={loading ? null : ArrowRight}
                >
                  {loading ? 'Sending...' : 'Continue'}
                </Button>

                <LoginLink>
                  Already have an account? <a href="/resident/login">Sign in</a>
                </LoginLink>
              </FormGroup>
            </form>
          )}

          {/* STEP 2: OTP */}
          {currentStep === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <FormGroup>
                {otpError && <ErrorAlert>{otpError}</ErrorAlert>}

                <div>
                  <label style={{ color: theme.colors.gray300, fontSize: theme.fontSizes.sm }}>
                    Enter OTP sent to: <strong>{email}</strong>
                  </label>
                </div>

                <Input
                  label="OTP Code"
                  type="text"
                  placeholder="000000"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    setOtpError('');
                  }}
                  disabled={loading}
                />

                {emailSent && (
                  <div style={{ textAlign: 'center', color: timeRemaining < 60 ? theme.colors.warning : theme.colors.gray400 }}>
                    ⏱️ OTP expires in: <strong>{Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}</strong>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6 || loading}
                  icon={loading ? null : null}
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setCurrentStep(1);
                    setOtp('');
                    setOtpError('');
                  }}
                  disabled={loading}
                >
                  ← Change Email
                </Button>
              </FormGroup>
            </form>
          )}

          {/* STEP 3: REGISTRATION */}
          {currentStep === 3 && (
            <form onSubmit={handleRegister}>
              <FormGroup>
                <FormGrid>
                  <Input
                    label="Full Name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    icon={User}
                    disabled={loading}
                    error={formErrors.name}
                    name="name"
                  />

                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    icon={Phone}
                    disabled={loading}
                    error={formErrors.phone}
                    name="phone"
                  />
                </FormGrid>

                <Input
                  label="Email (Verified)"
                  type="email"
                  placeholder={email}
                  value={email}
                  disabled
                  icon={Mail}
                />

                <Input
                  label="Apartment Number"
                  type="text"
                  placeholder="101"
                  value={formData.apartment_no}
                  onChange={handleChange}
                  icon={Home}
                  disabled={loading}
                  error={formErrors.apartment_no}
                  name="apartment_no"
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  icon={Lock}
                  showPasswordToggle
                  disabled={loading}
                  error={formErrors.password}
                  name="password"
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  icon={Lock}
                  showPasswordToggle
                  disabled={loading}
                  error={formErrors.confirmPassword}
                  name="confirmPassword"
                />

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleRegister}
                  disabled={loading}
                  icon={loading ? null : ArrowRight}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>

                <LoginLink>
                  Already have an account? <a href="/resident/login">Sign in</a>
                </LoginLink>
              </FormGroup>
            </form>
          )}
        </CardBody>
      </RegisterCard>
    </RegisterContainer>
  );
}