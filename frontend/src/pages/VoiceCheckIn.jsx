import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { visitorAPI } from '../services/api';
import { theme } from '../styles/theme';
import { Button } from '../components/Button/Button';
import { Card, CardBody } from '../components/Card/Card';

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
    background: #a855f7;
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
  max-width: 800px;
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
    animation: float 3s ease-in-out infinite;
  }

  h1 {
    font-size: ${theme.fontSizes['3xl']};
    margin-bottom: ${theme.spacing[2]};
  }

  p {
    color: ${theme.colors.gray400};
    margin: 0;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
`;

const RecorderSection = styled.div`
  text-align: center;
  margin: ${theme.spacing[8]} 0;
`;

const StatusDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[3]};
  min-height: 80px;
  margin-bottom: ${theme.spacing[6]};
  font-size: ${theme.fontSizes.lg};
  font-weight: ${theme.fontWeights.semibold};

  .status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    animation: ${props => props.recording ? 'pulse 1s infinite' : 'none'};
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const MicButton = styled.button`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 48px;
  margin: ${theme.spacing[4]} auto;
  background: ${props => {
    if (props.recording) return theme.colors.error;
    if (props.hasAudio) return theme.colors.success;
    return theme.colors.primary;
  }};
  border: none;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all ${theme.transitions.base};
  opacity: ${props => props.disabled ? 0.6 : 1};

  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }
`;

const AudioPlayer = styled.audio`
  width: 100%;
  margin: ${theme.spacing[4]} 0;
`;

const ResultSection = styled.div`
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid ${theme.colors.gray700};
  border-radius: ${theme.radius.xl};
  padding: ${theme.spacing[6]};
  margin: ${theme.spacing[6]} 0;

  h3 {
    margin-top: 0;
    color: ${theme.colors.primary};
  }

  .result-item {
    display: flex;
    justify-content: space-between;
    padding: ${theme.spacing[3]} 0;
    border-bottom: 1px solid ${theme.colors.gray700};

    &:last-child {
      border-bottom: none;
    }

    .label {
      color: ${theme.colors.gray400};
      font-weight: ${theme.fontWeights.semibold};
    }

    .value {
      color: ${theme.colors.white};
    }
  }
`;

const InstructionsBox = styled(Card)`
  background: rgba(14, 165, 233, 0.1);
  border: 2px solid rgba(14, 165, 233, 0.3);
  margin-bottom: ${theme.spacing[6]};

  p {
    color: #7dd3fc;
  }
`;

export default function VoiceCheckIn() {
  const navigate = useNavigate();
  const { isRecording, audioBlob, audioURL, startRecording, stopRecording, resetRecording } = useVoiceRecorder();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleStartRecording = () => {
    resetRecording();
    setRecordingTime(0);
    setMessage('');
    setResult(null);
    startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleSubmit = async () => {
    if (!audioBlob) {
      setMessage('❌ Please record audio first');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await visitorAPI.voiceCheckIn(audioBlob);
      
      setResult(response.data);
      
      if (response.data.status === 'success') {
        setMessage(`✅ Visitor ${response.data.extracted_info.name} checked in successfully!`);
      } else if (response.data.status === 'partial_success') {
        setMessage(`⚠️ ${response.data.message}`);
      } else {
        setMessage(`❌ ${response.data.message}`);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || 'Voice check-in failed';
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar>
        <NavContent>
          <Logo onClick={() => navigate('/')}>
            <span style={{ fontSize: '24px' }}>🎤</span>
            <h1>Voice Check-In</h1>
          </Logo>
          <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
            ← Back
          </Button>
        </NavContent>
      </Navbar>

      <Container>
        <ContentWrapper>
          <Header>
            <div className="icon">🎤</div>
            <h1>Voice-Based Check-In</h1>
            <p>Speak to automatically register as a visitor</p>
          </Header>

          <Card hoverable={false}>
            <CardBody>
              <InstructionsBox>
                <h3 style={{ marginTop: 0 }}>📝 Instructions</h3>
                <p style={{ margin: '0 0 8px 0' }}>
                  Say something like: "Hi, my name is John Doe, my phone is 1234567890, I'm here for a meeting at apartment 301"
                </p>
              </InstructionsBox>

              <RecorderSection>
                <StatusDisplay recording={isRecording}>
                  {isRecording ? (
                    <>
                      <div className="status-dot" style={{ background: theme.colors.error }} />
                      <span style={{ color: theme.colors.error }}>
                        Recording... {formatTime(recordingTime)}
                      </span>
                    </>
                  ) : audioBlob ? (
                    <>
                      <span style={{ color: theme.colors.success }}>✅ Recording Complete</span>
                    </>
                  ) : (
                    <span style={{ color: theme.colors.gray400 }}>Ready to Record</span>
                  )}
                </StatusDisplay>

                <MicButton
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  disabled={loading}
                  recording={isRecording}
                  hasAudio={!!audioBlob}
                  title={isRecording ? 'Stop Recording' : 'Start Recording'}
                >
                  {isRecording ? '⏹️' : audioBlob ? '✅' : '🎤'}
                </MicButton>

                {audioURL && (
                  <div style={{ marginTop: theme.spacing[6] }}>
                    <AudioPlayer src={audioURL} controls />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        resetRecording();
                        setRecordingTime(0);
                        setMessage('');
                        setResult(null);
                      }}
                      style={{ marginTop: theme.spacing[3] }}
                    >
                      Record Again
                    </Button>
                  </div>
                )}
              </RecorderSection>

              {message && (
                <div style={{
                  padding: theme.spacing[4],
                  borderRadius: theme.radius.lg,
                  background: message.includes('✅') 
                    ? 'rgba(34, 197, 94, 0.1)' 
                    : message.includes('⚠️')
                    ? 'rgba(249, 115, 22, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                  color: message.includes('✅') 
                    ? theme.colors.successLight
                    : message.includes('⚠️')
                    ? '#fbbf24'
                    : theme.colors.errorLight,
                  border: `1px solid ${
                    message.includes('✅') 
                      ? 'rgba(34, 197, 94, 0.3)'
                      : message.includes('⚠️')
                      ? 'rgba(249, 115, 22, 0.3)'
                      : 'rgba(239, 68, 68, 0.3)'
                  }`
                }}>
                  {message}
                </div>
              )}

              {result && (
                <ResultSection>
                  <h3>Extraction Results</h3>
                  <div className="result-item">
                    <span className="label">Transcribed:</span>
                    <span className="value">{result.transcribed_text}</span>
                  </div>
                  {result.extracted_info && (
                    <>
                      <div className="result-item">
                        <span className="label">Name:</span>
                        <span className="value">{result.extracted_info.name || 'Not detected'}</span>
                      </div>
                      <div className="result-item">
                        <span className="label">Phone:</span>
                        <span className="value">{result.extracted_info.phone || 'Not detected'}</span>
                      </div>
                      <div className="result-item">
                        <span className="label">Purpose:</span>
                        <span className="value">{result.extracted_info.purpose || 'Not detected'}</span>
                      </div>
                      <div className="result-item">
                        <span className="label">Apartment:</span>
                        <span className="value">{result.extracted_info.apartment_no || 'Not detected'}</span>
                      </div>
                    </>
                  )}
                </ResultSection>
              )}

              <div style={{ display: 'flex', gap: theme.spacing[4], marginTop: theme.spacing[6] }}>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={!audioBlob || loading}
                  style={{ flex: 1 }}
                >
                  {loading ? '⏳ Processing...' : '✅ Submit Check-In'}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/')}
                  style={{ flex: 1 }}
                >
                  Cancel
                </Button>
              </div>
            </CardBody>
          </Card>
        </ContentWrapper>
      </Container>
    </>
  );
}