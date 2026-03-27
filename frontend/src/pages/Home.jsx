import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { Button } from '../components/Button/Button';
import { Card } from '../components/Card/Card';

const HeroContainer = styled.section`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing[8]} ${theme.spacing[4]};
  background: linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.backgroundAlt} 50%, ${theme.colors.surface} 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 500px;
    height: 500px;
    background: ${theme.colors.primary};
    border-radius: 50%;
    top: 50%;
    left: -200px;
    opacity: 0.1;
    filter: blur(100px);
    animation: float 8s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    width: 500px;
    height: 500px;
    background: ${theme.colors.success};
    border-radius: 50%;
    bottom: -200px;
    right: -200px;
    opacity: 0.1;
    filter: blur(100px);
    animation: float 10s ease-in-out infinite 2s;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-30px); }
  }
`;

const HeroContent = styled.div`
  max-width: 800px;
  text-align: center;
  z-index: 10;

  h1 {
    font-size: clamp(32px, 8vw, 72px);
    font-weight: ${theme.fontWeights.bold};
    line-height: 1.2;
    margin-bottom: ${theme.spacing[6]};

    background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    font-size: ${theme.fontSizes.lg};
    color: ${theme.colors.gray400};
    margin-bottom: ${theme.spacing[8]};
    line-height: 1.6;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${theme.spacing[4]};
  justify-content: center;
  flex-wrap: wrap;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${theme.spacing[6]};
  margin-bottom: ${theme.spacing[12]};
`;

const FeatureCard = styled(Card)`
  text-align: center;
  cursor: pointer;
  transition: transform ${theme.transitions.base};

  &:hover {
    transform: translateY(-8px);
  }

  .icon {
    font-size: 48px;
    margin-bottom: ${theme.spacing[4]};
  }

  h3 {
    font-size: ${theme.fontSizes.xl};
    margin-bottom: ${theme.spacing[2]};
  }
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${theme.spacing[6]};
`;

const ActionCard = styled(Card)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 300px;
  cursor: pointer;
  transition: all ${theme.transitions.base};

  &:hover {
    transform: translateY(-8px);
  }

  .icon {
    font-size: 64px;
    margin-bottom: ${theme.spacing[4]};
    transition: transform ${theme.transitions.base};
  }

  h3 {
    font-size: ${theme.fontSizes.xl};
    margin-bottom: ${theme.spacing[2]};
  }

  &:hover .icon {
    transform: scale(1.1);
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
  transition: transform ${theme.transitions.fast};

  &:hover {
    transform: scale(1.05);
  }

  .icon {
    font-size: 28px;
  }

  h1 {
    font-size: ${theme.fontSizes.xl};
    background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
  }
`;

export default function Home() {
  const navigate = useNavigate();

  const features = [
    { icon: '🎤', title: 'Voice Recognition', desc: 'AI-powered voice verification' },
    { icon: '🚪', title: 'Smart Gate Entry', desc: 'Automated gate control' },
    { icon: '📊', title: 'Analytics', desc: 'Comprehensive statistics' },
  ];

  const userActions = [
    { icon: '➕', label: 'Check In', desc: 'Register a new visitor', path: '/visitor/check-in' },
    { icon: '🎤', label: 'Voice Check-In', desc: 'Voice-based registration', path: '/visitor/voice-check-in' },
    { icon: '🚪', label: 'Gate Entry', desc: 'Voice-based gate access', path: '/gate/entry' },
    { icon: '👤', label: 'Resident Login', desc: 'Access dashboard', path: '/resident/login' },
  ];

  const adminActions = [
    { icon: '🛡️', label: 'Admin Login', desc: 'Access admin dashboard', path: '/admin/login' },
  ];

  return (
    <>
      <Navbar>
        <NavContent>
          <Logo onClick={() => navigate('/')}>
            <span className="icon">🏢</span>
            <h1>Visitor Management</h1>
          </Logo>
          <div style={{ display: 'flex', gap: theme.spacing[4] }}>
            <Button variant="outline" size="sm" onClick={() => navigate('/resident/login')}>
              👤 Resident
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/login')}>
              🛡️ Admin
            </Button>
          </div>
        </NavContent>
      </Navbar>

      <HeroContainer>
        <HeroContent>
          <h1>Smart Visitor Access Control</h1>
          <p>Advanced AI-powered visitor management system with voice recognition, real-time notifications, and smart gate access control.</p>
          <ButtonGroup>
            <Button variant="primary" size="lg" onClick={() => navigate('/visitor/check-in')}>
              Get Started
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/demo')}>
              View Demo
            </Button>
          </ButtonGroup>
        </HeroContent>
      </HeroContainer>

      <section style={{ padding: `${theme.spacing[12]} ${theme.spacing[4]}`, maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: theme.fontSizes['3xl'], fontWeight: theme.fontWeights.bold, textAlign: 'center', marginBottom: theme.spacing[4] }}>
          Powerful Features
        </h2>
        <FeaturesGrid>
          {features.map((feature, idx) => (
            <FeatureCard key={idx} hoverable={true}>
              <div className="icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p style={{ color: theme.colors.gray400, margin: 0 }}>{feature.desc}</p>
            </FeatureCard>
          ))}
        </FeaturesGrid>
      </section>

      <section style={{ padding: `${theme.spacing[12]} ${theme.spacing[4]}`, maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: theme.fontSizes['3xl'], fontWeight: theme.fontWeights.bold, textAlign: 'center', marginBottom: theme.spacing[8] }}>
          Quick Actions
        </h2>

        <h3 style={{ fontSize: theme.fontSizes.xl, marginBottom: theme.spacing[4], color: theme.colors.gray300 }}>👥 For Users</h3>
        <ActionGrid style={{ marginBottom: theme.spacing[12] }}>
          {userActions.map((action, idx) => (
            <ActionCard key={idx} onClick={() => navigate(action.path)} hoverable={true}>
              <div>
                <div className="icon">{action.icon}</div>
                <h3>{action.label}</h3>
                <p style={{ color: theme.colors.gray400 }}>{action.desc}</p>
              </div>
              <div style={{ color: theme.colors.primary, fontWeight: theme.fontWeights.semibold }}>
                Access Now →
              </div>
            </ActionCard>
          ))}
        </ActionGrid>

        <h3 style={{ fontSize: theme.fontSizes.xl, marginBottom: theme.spacing[4], color: theme.colors.gray300 }}>🛡️ For Administrators</h3>
        <ActionGrid>
          {adminActions.map((action, idx) => (
            <ActionCard key={idx} onClick={() => navigate(action.path)} hoverable={true} style={{ background: 'rgba(249, 115, 22, 0.05)', borderColor: 'rgba(249, 115, 22, 0.3)' }}>
              <div>
                <div className="icon">{action.icon}</div>
                <h3 style={{ color: '#f97316' }}>{action.label}</h3>
                <p style={{ color: theme.colors.gray400 }}>{action.desc}</p>
              </div>
              <div style={{ color: '#f97316', fontWeight: theme.fontWeights.semibold }}>
                Access Now →
              </div>
            </ActionCard>
          ))}
        </ActionGrid>
      </section>

      <footer style={{ padding: theme.spacing[8], textAlign: 'center', color: theme.colors.gray500, borderTop: `1px solid ${theme.colors.gray800}`, marginTop: theme.spacing[12] }}>
        <p>© 2026 Smart Visitor Management System. All rights reserved.</p>
      </footer>
    </>
  );
}