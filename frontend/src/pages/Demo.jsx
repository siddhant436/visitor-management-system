import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { Button } from '../components/Button/Button';
import { Card } from '../components/Card/Card';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.backgroundAlt} 50%, ${theme.colors.surface} 100%);
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

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 100px ${theme.spacing[4]} ${theme.spacing[12]};
`;

const Section = styled.section`
  margin-bottom: ${theme.spacing[12]};
`;

const Title = styled.h2`
  font-size: ${theme.fontSizes['3xl']};
  font-weight: ${theme.fontWeights.bold};
  text-align: center;
  margin-bottom: ${theme.spacing[4]};
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  text-align: center;
  color: ${theme.colors.gray400};
  font-size: ${theme.fontSizes.lg};
  margin-bottom: ${theme.spacing[8]};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${theme.spacing[6]};
`;

const ScenarioCard = styled(Card)`
  cursor: pointer;
  transition: all ${theme.transitions.base};
  border: 2px solid ${props => props.borderColor || theme.colors.gray700};

  &:hover {
    border-color: ${props => props.hoverColor || theme.colors.primary};
    transform: translateY(-8px);
  }

  h4 {
    font-size: ${theme.fontSizes.lg};
    margin: ${theme.spacing[4]} 0 ${theme.spacing[2]};
  }

  p {
    color: ${theme.colors.gray400};
    margin-bottom: ${theme.spacing[4]};
  }
`;

const TechStack = styled.div`
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border: 1px solid ${theme.colors.gray700};
  border-radius: ${theme.radius.xl};
  padding: ${theme.spacing[8]};
`;

const TechColumn = styled.div`
  h4 {
    font-weight: ${theme.fontWeights.bold};
    margin-bottom: ${theme.spacing[3]};
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing[2]};
    color: ${theme.colors.gray400};
    font-size: ${theme.fontSizes.sm};

    li::before {
      content: '✅ ';
      color: ${theme.colors.success};
      margin-right: ${theme.spacing[2]};
    }
  }
`;

const GettingStarted = styled(Card)`
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%);
  border-color: ${theme.colors.primary};
`;

export default function Demo() {
  const navigate = useNavigate();

  const scenarios = [
    {
      title: '👤 Visitor Manual Check-In',
      description: 'A visitor fills out a form to check in',
      path: '/visitor/check-in',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      hoverColor: theme.colors.primary
    },
    {
      title: '🎤 Visitor Voice Check-In',
      description: 'A visitor speaks to automatically check in',
      path: '/visitor/voice-check-in',
      borderColor: 'rgba(168, 85, 247, 0.3)',
      hoverColor: '#a855f7'
    },
    {
      title: '📋 Resident Registration',
      description: 'A resident creates a new account',
      path: '/resident/register',
      borderColor: 'rgba(34, 197, 94, 0.3)',
      hoverColor: theme.colors.success
    },
    {
      title: '🔐 Resident Login',
      description: 'A resident logs in with email and password',
      path: '/resident/login',
      borderColor: 'rgba(79, 70, 229, 0.3)',
      hoverColor: theme.colors.primary
    }
  ];

  const features = [
    {
      icon: '🎤',
      title: 'Voice Recognition',
      description: 'Automatic speech-to-text using Whisper API'
    },
    {
      icon: '🔊',
      title: 'Voice Authentication',
      description: 'Residents authenticate using their voice'
    },
    {
      icon: '✅',
      title: 'Voice Verification',
      description: 'Verify visitor identity with voice matching'
    },
    {
      icon: '🔐',
      title: 'Secure Authentication',
      description: 'JWT tokens and encrypted passwords'
    },
    {
      icon: '📱',
      title: 'Real-time Processing',
      description: 'Instant voice analysis and visitor check-in'
    },
    {
      icon: '📊',
      title: 'Data Tracking',
      description: 'Track visitor and resident information'
    }
  ];

  return (
    <Container>
      <Navbar>
        <NavContent>
          <Logo onClick={() => navigate('/')}>
            <span style={{ fontSize: '24px' }}>🏢</span>
            <h1>VMS - Demo</h1>
          </Logo>
          <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
            ← Back to Home
          </Button>
        </NavContent>
      </Navbar>

      <Content>
        {/* Header */}
        <Section style={{ textAlign: 'center', marginBottom: theme.spacing[12] }}>
          <Title>Voice-Based Visitor Management System</Title>
          <Subtitle>
            A complete demonstration of voice recognition and authentication features
          </Subtitle>
        </Section>

        {/* Scenarios */}
        <Section>
          <Title>Try These Scenarios</Title>
          <Subtitle>Explore different use cases and features</Subtitle>
          <Grid>
            {scenarios.map((scenario, idx) => (
              <ScenarioCard
                key={idx}
                borderColor={scenario.borderColor}
                hoverColor={scenario.hoverColor}
                onClick={() => navigate(scenario.path)}
              >
                <h4>{scenario.title}</h4>
                <p>{scenario.description}</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(scenario.path);
                  }}
                  style={{ width: '100%' }}
                >
                  Try Now →
                </Button>
              </ScenarioCard>
            ))}
          </Grid>
        </Section>

        {/* Features */}
        <Section>
          <Title>Key Features</Title>
          <Subtitle>Powerful capabilities for visitor management</Subtitle>
          <Grid>
            {features.map((feature, idx) => (
              <Card key={idx} hoverable={true}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '48px', marginBottom: theme.spacing[4] }}>
                    {feature.icon}
                  </div>
                  <h4 style={{ marginTop: 0 }}>{feature.title}</h4>
                  <p style={{ color: theme.colors.gray400, margin: 0 }}>
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </Grid>
        </Section>

        {/* Tech Stack */}
        <Section>
          <Title>Technology Stack</Title>
          <TechStack>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing[6] }}>
              <TechColumn>
                <h4>Backend</h4>
                <ul>
                  <li>FastAPI</li>
                  <li>SQLAlchemy ORM</li>
                  <li>PostgreSQL</li>
                  <li>Whisper API (OpenAI)</li>
                  <li>MFCC Voice Embedding</li>
                  <li>JWT Authentication</li>
                </ul>
              </TechColumn>
              <TechColumn>
                <h4>Frontend</h4>
                <ul>
                  <li>React.js</li>
                  <li>React Router</li>
                  <li>Axios</li>
                  <li>MediaRecorder API</li>
                  <li>Context API</li>
                  <li>Local Storage</li>
                </ul>
              </TechColumn>
              <TechColumn>
                <h4>Libraries</h4>
                <ul>
                  <li>Librosa (MFCC)</li>
                  <li>NumPy</li>
                  <li>Scikit-learn</li>
                  <li>Pydantic</li>
                  <li>Argon2</li>
                  <li>Python-Jose</li>
                </ul>
              </TechColumn>
            </div>
          </TechStack>
        </Section>

        {/* Getting Started */}
        <Section>
          <GettingStarted>
            <h3 style={{ marginTop: 0 }}>🚀 Getting Started</h3>
            <ol style={{ paddingLeft: theme.spacing[6], lineHeight: 1.8, color: theme.colors.gray300 }}>
              <li><strong>New Visitor?</strong> Click "Visitor Manual Check-In" or "Visitor Voice Check-In"</li>
              <li><strong>New Resident?</strong> Click "Resident Registration" to create an account</li>
              <li><strong>Existing Resident?</strong> Click "Resident Login" with your credentials</li>
              <li><strong>Upload Voice?</strong> Once logged in, go to dashboard and upload your voice sample</li>
              <li><strong>Authenticate?</strong> Use your voice to authenticate instead of passwords</li>
            </ol>
          </GettingStarted>
        </Section>
      </Content>
    </Container>
  );
}