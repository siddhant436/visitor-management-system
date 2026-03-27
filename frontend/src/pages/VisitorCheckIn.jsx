import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { User, Phone, MapPin, AlertCircle } from 'lucide-react';
import { theme } from '../styles/theme';
import { Button } from '../components/Button/Button';
import { Input } from '../components/Input/Input';
import { Card, CardBody } from '../components/Card/Card';

const API_BASE_URL = 'http://localhost:8000';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.backgroundAlt} 50%, ${theme.colors.surface} 100%);
  padding: 100px ${theme.spacing[4]} ${theme.spacing[8]};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    background: ${theme.colors.success};
    border-radius: 50%;
    top: -100px;
    right: -100px;
    opacity: 0.1;
    filter: blur(100px);
  }
`;

const Navbar = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(3, 7, 18, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${theme.colors.gray800};
  padding: ${theme.spacing[4]};
  z-index: 50;
`;

const NavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  cursor: pointer;
  h1 {
    margin: 0;
    background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const ContentWrapper = styled.div`
  max-width: 700px;
  margin: 0 auto;
  position: relative;
  z-index: 10;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing[8]};

  .icon {
    font-size: 64px;
    margin-bottom: ${theme.spacing[4]};
  }

  h1 {
    font-size: ${theme.fontSizes['3xl']};
    margin-bottom: ${theme.spacing[2]};
  }

  p {
    color: ${theme.colors.gray400};
    margin: 0;
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

const Select = styled.select`
  width: 100%;
  padding: ${theme.spacing[3]} ${theme.spacing[4]};
  background: ${theme.colors.gray800};
  border: 2px solid ${theme.colors.gray700};
  border-radius: ${theme.radius.lg};
  color: ${theme.colors.white};
  font-size: ${theme.fontSizes.base};
  font-family: ${theme.fonts.primary};
  cursor: pointer;
  transition: all ${theme.transitions.base};

  &:hover {
    border-color: ${theme.colors.primary};
  }

  &:focus {
    border-color: ${theme.colors.primary};
    outline: none;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const AlertBox = styled.div`
  background: ${props => props.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'};
  border: 1px solid ${props => props.type === 'error' ? theme.colors.error : theme.colors.success};
  border-radius: ${theme.radius.lg};
  padding: ${theme.spacing[4]};
  margin-bottom: ${theme.spacing[6]};
  display: flex;
  gap: ${theme.spacing[3]};
  color: ${props => props.type === 'error' ? theme.colors.errorLight : theme.colors.successLight};
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

const QuickLinks = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing[4]};
  margin-top: ${theme.spacing[6]};
  padding-top: ${theme.spacing[6]};
  border-top: 1px solid ${theme.colors.gray700};
`;

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
    <>
      <Navbar>
        <NavContent>
          <Logo onClick={() => navigate('/')}>
            <span style={{ fontSize: '24px' }}>➕</span>
            <h1>Visitor Check-In</h1>
          </Logo>
          <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
            ← Back
          </Button>
        </NavContent>
      </Navbar>

      <Container>
        <ContentWrapper>
          <Header>
            <div className="icon">➕</div>
            <h1>Register Visitor</h1>
            <p>Quick and easy visitor check-in</p>
          </Header>

          <Card hoverable={false}>
            <CardBody>
              {error && (
                <AlertBox type="error">
                  <AlertCircle size={20} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </AlertBox>
              )}

              {success && (
                <AlertBox type="success">
                  <span>✅</span>
                  <span>{success}</span>
                </AlertBox>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
                <FormGrid>
                  <Input
                    label="Visitor Name"
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    icon={User}
                    disabled={loading}
                    required
                  />

                  <Input
                    label="Phone Number"
                    type="tel"
                    name="phone"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    icon={Phone}
                    disabled={loading}
                    required
                  />
                </FormGrid>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: theme.fontSizes.sm,
                    fontWeight: theme.fontWeights.semibold,
                    color: theme.colors.white,
                    marginBottom: theme.spacing[2]
                  }}>
                    Purpose
                  </label>
                  <Select
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    {purposes.map(p => (
                      <option key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </option>
                    ))}
                  </Select>
                </div>

                <Input
                  label="Apartment Number"
                  type="text"
                  name="apartment_no"
                  placeholder="325"
                  value={formData.apartment_no}
                  onChange={handleChange}
                  icon={MapPin}
                  disabled={loading}
                  required
                />

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{ width: '100%' }}
                >
                  {loading ? 'Checking In...' : '✅ Check In'}
                </Button>

                <QuickLinks>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => navigate('/visitor/voice-check-in')}
                    style={{ width: '100%' }}
                  >
                    🎤 Voice Check-In
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => navigate('/gate/entry')}
                    style={{ width: '100%' }}
                  >
                    🚪 Gate Entry
                  </Button>
                </QuickLinks>
              </form>
            </CardBody>
          </Card>
        </ContentWrapper>
      </Container>
    </>
  );
}