import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { Mail, Lock, Loader } from 'lucide-react';
import { theme } from '../styles/theme';
import { Button } from '../components/Button/Button';
import { Input } from '../components/Input/Input';
import { Card, CardBody } from '../components/Card/Card';
import { Container, Flex } from '../components/Layout/Container';

const API_BASE_URL = 'http://localhost:8000';

const LoginContainer = styled.div`
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
`;

const LoginCard = styled(Card)`
  max-width: 450px;
  width: 100%;
  position: relative;
  z-index: 1;

  @media (max-width: ${theme.breakpoints.sm}) {
    max-width: 100%;
  }
`;

const LogoSection = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing[8]};

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

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
`;

const ForgotLink = styled.a`
  text-align: right;
  color: ${theme.colors.primary};
  font-size: ${theme.fontSizes.sm};
  transition: color ${theme.transitions.fast};

  &:hover {
    color: ${theme.colors.primaryLight};
  }
`;

const SignupLink = styled.p`
  text-align: center;
  color: ${theme.colors.gray400};
  font-size: ${theme.fontSizes.sm};
  margin-top: ${theme.spacing[4]};

  a {
    color: ${theme.colors.primary};
    font-weight: ${theme.fontWeights.semibold};
    transition: color ${theme.transitions.fast};

    &:hover {
      color: ${theme.colors.primaryLight};
    }
  }
`;

const ErrorAlert = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid ${theme.colors.error};
  border-radius: ${theme.radius.lg};
  padding: ${theme.spacing[4]};
  color: ${theme.colors.errorLight};
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
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

export default function ModernResidentLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/residents/login`, {
        email: email.trim(),
        password,
      });

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('resident', JSON.stringify({
        id: response.data.user_id,
        name: response.data.name,
        email: response.data.email,
      }));

      navigate('/resident/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard hoverable={false}>
        <LogoSection>
          <h1>🏢 VMS</h1>
          <p>Visitor Management System</p>
        </LogoSection>

        <CardBody>
          {error && <ErrorAlert>⚠️ {error}</ErrorAlert>}

          <FormGroup>
            <Input
              label="Email Address"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              icon={Mail}
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              icon={Lock}
              showPasswordToggle
              disabled={loading}
            />
          </FormGroup>

          <ForgotLink href="#forgot">Forgot password?</ForgotLink>

          <Button
            variant="primary"
            size="lg"
            onClick={handleLogin}
            disabled={!email || !password || loading}
            icon={loading ? Loader : null}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>

          <SignupLink>
            Don't have an account? <a href="/resident/register">Create one</a>
          </SignupLink>
        </CardBody>
      </LoginCard>
    </LoginContainer>
  );
}