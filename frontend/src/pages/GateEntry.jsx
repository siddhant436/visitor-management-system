import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { theme } from '../styles/theme';
import { Card, CardBody } from '../components/Card/Card';
import { Button } from '../components/Button/Button';

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
    animation: float 6s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
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
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  z-index: 10;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing[8]};

  .icon {
    font-size: 80px;
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
`;

const InstructionsBox = styled(Card)`
  background: rgba(14, 165, 233, 0.1);
  border: 2px solid rgba(14, 165, 233, 0.3);
  margin-bottom: ${theme.spacing[6]};

  h3 {
    color: ${theme.colors.primary};
    margin-top: 0;
  }

  ol {
    margin: 0;
    padding-left: ${theme.spacing[6]};
    color: ${theme.colors.gray300};
    line-height: 1.8;
  }
`;

const UploadArea = styled.div`
  background: rgba(31, 41, 55, 0.5);
  border: 2px dashed ${theme.colors.primary};
  border-radius: ${theme.radius.xl};
  padding: ${theme.spacing[8]} ${theme.spacing[6]};
  text-align: center;
  margin-bottom: ${theme.spacing[6]};
  cursor: pointer;
  transition: all ${theme.transitions.base};

  &:hover {
    border-color: ${theme.colors.primaryLight};
    background: rgba(31, 41, 55, 0.7);
  }

  .icon {
    font-size: 64px;
    margin-bottom: ${theme.spacing[4]};
  }

  p {
    color: ${theme.colors.gray400};
    margin: 0;
  }

  input {
    display: none;
  }
`;

const ResultBox = styled(Card)`
  background: ${props => props.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  border-color: ${props => props.success ? theme.colors.success : theme.colors.error};
  text-align: center;

  .icon {
    font-size: 80px;
    margin-bottom: ${theme.spacing[4]};
  }

  h2 {
    color: ${props => props.success ? theme.colors.success : theme.colors.error};
    margin: ${theme.spacing[4]} 0 ${theme.spacing[2]};
  }

  p {
    color: ${theme.colors.gray400};
  }
`;

const DetailsGrid = styled.div`
  display: grid;
  gap: ${theme.spacing[4]};
  margin: ${theme.spacing[6]} 0;

  .detail-item {
    background: rgba(75, 85, 99, 0.3);
    padding: ${theme.spacing[4]};
    border-radius: ${theme.radius.lg};
    text-align: left;

    .label {
      color: ${theme.colors.gray400};
      font-size: ${theme.fontSizes.sm};
      font-weight: ${theme.fontWeights.semibold};
      text-transform: uppercase;
      margin-bottom: ${theme.spacing[2]};
    }

    .value {
      color: ${theme.colors.white};
      font-size: ${theme.fontSizes.lg};
      font-weight: ${theme.fontWeights.bold};
    }
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${theme.colors.gray700};
  border-radius: ${theme.radius.full};
  overflow: hidden;
  margin: ${theme.spacing[2]} 0;

  .fill {
    height: 100%;
    background: linear-gradient(90deg, ${theme.colors.success} 0%, ${theme.colors.primary} 100%);
    width: ${props => props.percent}%;
    transition: width 0.5s ease;
  }
`;

export default function GateEntry() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [authResult, setAuthResult] = useState(null);
  const [step, setStep] = useState('input');
  const [residentId, setResidentId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // ==================== STEP 1: INPUT RESIDENT ID ====================

  const handleInputResident = (e) => {
    setResidentId(e.target.value);
  };

  const handleProceedWithId = () => {
    if (!residentId.trim()) {
      setMessage('❌ Please enter a resident ID');
      return;
    }
    setStep('upload');
    setMessage('');
  };

  // ==================== STEP 2: UPLOAD VOICE ====================

  const handleVoiceUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/flac', 'audio/aac'];
    if (!validTypes.includes(file.type)) {
      setMessage('❌ Please select a valid audio file (WAV, MP3, OGG, FLAC, AAC)');
      return;
    }

    setSelectedFile(file);
    setLoading(true);
    setMessage('🎤 Processing voice authentication...');
    setAuthResult(null);

    // ==================== CALL BACKEND ====================

    const formData = new FormData();
    formData.append('file', file);

    axios
      .post(`${API_BASE_URL}/residents/${residentId}/authenticate-voice`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((response) => {
        console.log('✅ Backend response:', response.data);

        const result = response.data;

        // ==================== PARSE RESPONSE ====================

        const isAuthenticated = result.status === 'authenticated';

        setAuthResult({
          status: isAuthenticated ? 'success' : 'failed',
          message: result.message,
          resident_id: result.resident_id,
          resident_name: result.resident_name,
          apartment_no: result.apartment_no,
          similarity_score: result.similarity_score,
          match_percentage: (result.similarity_score * 100).toFixed(1),
          confidence: result.confidence,
          entry_granted: isAuthenticated,
        });

        setStep('result');
        setMessage('');
      })
      .catch((error) => {
        console.error('❌ Backend error:', error);

        // Handle different error types
        if (error.response) {
          // Server responded with error
          const errorData = error.response.data;
          setAuthResult({
            status: 'error',
            message: errorData.detail || 'Authentication failed',
            entry_granted: false,
            error_code: error.response.status,
          });
        } else if (error.request) {
          // Request made but no response
          setMessage('❌ Server error: No response from backend');
          setAuthResult({
            status: 'error',
            message: 'Server connection failed',
            entry_granted: false,
          });
        } else {
          // Error in request setup
          setMessage(`❌ Error: ${error.message}`);
          setAuthResult({
            status: 'error',
            message: error.message,
            entry_granted: false,
          });
        }

        setStep('result');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleReset = () => {
    setStep('input');
    setMessage('');
    setAuthResult(null);
    setResidentId('');
    setSelectedFile(null);
  };

  return (
    <>
      <Navbar>
        <NavContent>
          <Logo onClick={() => navigate('/')}>
            <span style={{ fontSize: '24px' }}>🚪</span>
            <h1>Gate Entry</h1>
          </Logo>
          <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
            ← Back
          </Button>
        </NavContent>
      </Navbar>

      <Container>
        <ContentWrapper>
          {/* ==================== STEP 1: INPUT RESIDENT ID ==================== */}

          {step === 'input' && (
            <>
              <Header>
                <div className="icon">🚪</div>
                <h1>Voice Gate Entry</h1>
                <p>Authenticate using your voice to enter</p>
              </Header>

              <Card hoverable={false}>
                <CardBody>
                  <InstructionsBox>
                    <h3>📝 Instructions</h3>
                    <ol>
                      <li>Enter your Resident ID</li>
                      <li>Upload your voice recording</li>
                      <li>System will verify your voice</li>
                      <li>Gate will open if authenticated</li>
                    </ol>
                  </InstructionsBox>

                  <div style={{ marginBottom: theme.spacing[4] }}>
                    <label style={{ display: 'block', marginBottom: theme.spacing[2], color: theme.colors.gray300 }}>
                      <strong>Resident ID</strong>
                    </label>
                    <input
                      type="number"
                      value={residentId}
                      onChange={handleInputResident}
                      placeholder="Enter your resident ID"
                      style={{
                        width: '100%',
                        padding: theme.spacing[3],
                        background: 'rgba(31, 41, 55, 0.5)',
                        border: `1px solid ${theme.colors.gray700}`,
                        borderRadius: theme.radius.lg,
                        color: theme.colors.white,
                        fontSize: theme.fontSizes.base,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {message && (
                    <div
                      style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: `1px solid ${theme.colors.primary}`,
                        color: theme.colors.primary,
                        padding: theme.spacing[4],
                        borderRadius: theme.radius.lg,
                        textAlign: 'center',
                        fontWeight: theme.fontWeights.semibold,
                        marginBottom: theme.spacing[4],
                      }}
                    >
                      {message}
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleProceedWithId}
                    style={{ width: '100%' }}
                  >
                    Continue with Voice Upload →
                  </Button>

                  <div
                    style={{
                      background: 'rgba(217, 119, 6, 0.1)',
                      border: `1px solid rgba(217, 119, 6, 0.3)`,
                      borderRadius: theme.radius.lg,
                      padding: theme.spacing[4],
                      marginTop: theme.spacing[6],
                    }}
                  >
                    <p style={{ color: '#fcd34d', fontSize: theme.fontSizes.sm, margin: 0 }}>
                      💡 <strong>Tip:</strong> You can find your Resident ID in your account profile.
                    </p>
                  </div>
                </CardBody>
              </Card>
            </>
          )}

          {/* ==================== STEP 2: UPLOAD VOICE ==================== */}

          {step === 'upload' && (
            <>
              <Header>
                <div className="icon">🎤</div>
                <h1>Voice Authentication</h1>
                <p>Recording for Resident #{residentId}</p>
              </Header>

              <Card hoverable={false}>
                <CardBody>
                  <label>
                    <UploadArea>
                      <div className="icon">🎤</div>
                      <p style={{ fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing[2] }}>
                        Click to upload voice
                      </p>
                      <p>or drag and drop</p>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleVoiceUpload}
                        disabled={loading}
                      />
                    </UploadArea>
                  </label>

                  {message && (
                    <div
                      style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: `1px solid ${theme.colors.primary}`,
                        color: theme.colors.primary,
                        padding: theme.spacing[4],
                        borderRadius: theme.radius.lg,
                        textAlign: 'center',
                        fontWeight: theme.fontWeights.semibold,
                        marginBottom: theme.spacing[4],
                      }}
                    >
                      {message}
                    </div>
                  )}

                  {loading && (
                    <div style={{ textAlign: 'center', padding: theme.spacing[6] }}>
                      <div
                        style={{
                          display: 'inline-block',
                          width: '40px',
                          height: '40px',
                          border: `3px solid rgba(59, 130, 246, 0.2)`,
                          borderTopColor: theme.colors.primary,
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                      <p style={{ marginTop: theme.spacing[4], color: theme.colors.gray400 }}>
                        Authenticating your voice...
                      </p>
                    </div>
                  )}

                  {!loading && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setStep('input')}
                      style={{ width: '100%', marginTop: theme.spacing[4] }}
                    >
                      ← Change Resident ID
                    </Button>
                  )}

                  <div
                    style={{
                      background: 'rgba(217, 119, 6, 0.1)',
                      border: `1px solid rgba(217, 119, 6, 0.3)`,
                      borderRadius: theme.radius.lg,
                      padding: theme.spacing[4],
                      marginTop: theme.spacing[6],
                    }}
                  >
                    <p style={{ color: '#fcd34d', fontSize: theme.fontSizes.sm, margin: 0 }}>
                      🎙️ <strong>Recording Tips:</strong> Speak clearly and naturally. Record in a quiet environment.
                    </p>
                  </div>
                </CardBody>
              </Card>
            </>
          )}

          {/* ==================== STEP 3: RESULT ==================== */}

          {step === 'result' && authResult && (
            <ResultBox success={authResult.entry_granted} hoverable={false}>
              <CardBody>
                <div className="icon">
                  {authResult.entry_granted ? '✅' : '❌'}
                </div>
                <h2>
                  {authResult.entry_granted ? 'Authentication Successful' : 'Authentication Failed'}
                </h2>
                <p>{authResult.message}</p>

                {authResult.entry_granted && (
                  <>
                    <DetailsGrid>
                      <div className="detail-item">
                        <div className="label">Resident Name</div>
                        <div className="value">{authResult.resident_name}</div>
                      </div>
                      <div className="detail-item">
                        <div className="label">Apartment</div>
                        <div className="value">{authResult.apartment_no}</div>
                      </div>
                      <div className="detail-item">
                        <div className="label">Match Score</div>
                        <ProgressBar percent={authResult.similarity_score * 100}>
                          <div className="fill" />
                        </ProgressBar>
                        <div className="value" style={{ fontSize: theme.fontSizes.base }}>
                          {authResult.match_percentage}%
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="label">Confidence</div>
                        <div className="value" style={{ textTransform: 'capitalize' }}>
                          {authResult.confidence}
                        </div>
                      </div>
                    </DetailsGrid>

                    <div
                      style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: `1px solid ${theme.colors.success}`,
                        borderRadius: theme.radius.lg,
                        padding: theme.spacing[4],
                        marginTop: theme.spacing[6],
                      }}
                    >
                      <p style={{ color: theme.colors.success, fontSize: theme.fontSizes.sm, margin: 0 }}>
                        🔓 <strong>Gate is unlocked!</strong> You can now enter.
                      </p>
                    </div>
                  </>
                )}

                {!authResult.entry_granted && (
                  <>
                    <DetailsGrid>
                      <div className="detail-item">
                        <div className="label">Match Score</div>
                        <ProgressBar percent={authResult.similarity_score * 100}>
                          <div className="fill" />
                        </ProgressBar>
                        <div className="value" style={{ fontSize: theme.fontSizes.base }}>
                          {authResult.match_percentage}%
                        </div>
                      </div>
                      <div className="detail-item">
                        <div className="label">Required Score</div>
                        <div className="value">75%</div>
                      </div>
                    </DetailsGrid>

                    <div
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${theme.colors.error}`,
                        borderRadius: theme.radius.lg,
                        padding: theme.spacing[4],
                        marginTop: theme.spacing[6],
                      }}
                    >
                      <p style={{ color: theme.colors.error, fontSize: theme.fontSizes.sm, margin: 0 }}>
                        🔒 <strong>Access Denied:</strong> Your voice does not match the registered profile. Please try again.
                      </p>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', gap: theme.spacing[4], marginTop: theme.spacing[6] }}>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleReset}
                    style={{ flex: 1 }}
                  >
                    🎤 Try Again
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate('/')}
                    style={{ flex: 1 }}
                  >
                    ← Home
                  </Button>
                </div>
              </CardBody>
            </ResultBox>
          )}
        </ContentWrapper>
      </Container>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}