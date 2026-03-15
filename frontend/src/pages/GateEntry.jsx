import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export default function GateEntry() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [authResult, setAuthResult] = useState(null);
  const [step, setStep] = useState('upload'); // upload or result

  const handleVoiceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage('');
    setAuthResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // For now, we'll just accept any upload
      // In production, you'd call the authentication endpoint
      setMessage('✅ Voice sample received. Processing...');

      // Simulate authentication
      setTimeout(() => {
        setAuthResult({
          status: 'success',
          message: 'Voice authentication successful! Gate opening...',
          resident_name: 'Sample Resident',
          apartment_no: '325',
          similarity_score: 0.92
        });
        setStep('result');
      }, 2000);
    } catch (error) {
      const errorMsg = typeof error.response?.data?.detail === 'string'
        ? error.response.data.detail
        : 'Upload failed';
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setMessage('');
    setAuthResult(null);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #030712 0%, #111827 50%, #1f2937 100%)', padding: '80px 16px 32px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Navbar */}
      <nav className="navbar" style={{ position: 'fixed', top: 0, left: 0, right: 0 }}>
        <div className="flex-between" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '24px' }} onClick={() => navigate('/')}>
            <span>🏠</span>
            <div className="gradient-text" style={{ fontSize: '20px', fontWeight: '700' }}>Gate Entry</div>
          </div>
          <button onClick={() => navigate('/')} className="btn btn-secondary btn-sm">
            ← Back
          </button>
        </div>
      </nav>

      {/* Animated backgrounds */}
      <div style={{ position: 'absolute', width: '400px', height: '400px', background: '#22c55e', borderRadius: '50%', top: '-100px', right: '-100px', mixBlendMode: 'multiply', filter: 'blur(100px)', opacity: 0.1, animation: 'float 6s ease-in-out infinite' }}></div>

      <div style={{ maxWidth: '600px', width: '100%', zIndex: 10 }}>
        {step === 'upload' && (
          <div className="animate-slide-up">
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ fontSize: '80px', marginBottom: '16px', animation: 'float 6s ease-in-out infinite' }}>🚪</div>
              <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>Voice Gate Entry</h1>
              <p style={{ color: '#9ca3af', fontSize: '16px' }}>Authenticate using your voice to enter</p>
            </div>

            {/* Card */}
            <div className="card" style={{ padding: '40px 32px' }}>
              {/* Message */}
              {message && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '24px',
                  background: message.includes('✅') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                  color: message.includes('✅') ? '#86efac' : '#fca5a5',
                  border: message.includes('✅') ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(220, 38, 38, 0.3)',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <span>{message.includes('✅') ? '✅' : '❌'}</span>
                  <span>{String(message)}</span>
                </div>
              )}

              {/* Instructions */}
              <div style={{ background: 'rgba(14, 165, 233, 0.1)', borderRadius: '12px', padding: '24px', marginBottom: '24px', border: '2px solid rgba(14, 165, 233, 0.3)' }}>
                <h3 style={{ fontWeight: '600', color: '#7dd3fc', marginBottom: '12px', marginTop: 0, fontSize: '18px' }}>📝 Instructions</h3>
                <ol style={{ color: '#7dd3fc', margin: 0, fontSize: '14px', lineHeight: '1.8', paddingLeft: '20px' }}>
                  <li>Record your voice saying your name and apartment number</li>
                  <li>Upload the audio file below</li>
                  <li>Wait for voice authentication</li>
                  <li>Gate will open automatically if authenticated</li>
                </ol>
              </div>

              {/* Upload Area */}
              <div style={{ background: 'rgba(31, 41, 55, 0.5)', borderRadius: '12px', border: '2px dashed rgba(34, 197, 94, 0.3)', padding: '60px 24px', textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎤</div>
                <label style={{ cursor: 'pointer' }}>
                  <p style={{ color: '#d1d5db', fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                    Click to upload voice
                  </p>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleVoiceUpload}
                    disabled={loading}
                    style={{ display: 'none' }}
                  />
                </label>
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: '8px 0 0 0' }}>
                  or drag and drop
                </p>
              </div>

              {loading && (
                <div style={{ textAlign: 'center', padding: '24px', color: '#22c55e', fontWeight: '600' }}>
                  <div style={{
                    display: 'inline-block',
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(34, 197, 94, 0.2)',
                    borderTop: '3px solid #22c55e',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    marginRight: '12px',
                    verticalAlign: 'middle'
                  }}></div>
                  <span>Authenticating...</span>
                </div>
              )}

              {/* Tips */}
              <div style={{ background: 'rgba(217, 119, 6, 0.1)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(217, 119, 6, 0.3)' }}>
                <p style={{ color: '#fcd34d', fontSize: '13px', margin: 0 }}>
                  💡 <strong>Tip:</strong> Speak clearly and naturally. Make sure your apartment number is clearly audible.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'result' && authResult && (
          <div className="animate-slide-up">
            {/* Result Card */}
            <div className="card" style={{ padding: '40px 32px', textAlign: 'center' }}>
              {authResult.status === 'success' ? (
                <>
                  <div style={{ fontSize: '80px', marginBottom: '16px', animation: 'float 6s ease-in-out infinite' }}>✅</div>
                  <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', color: '#22c55e' }}>
                    Authentication Successful
                  </h2>
                  <p style={{ color: '#9ca3af', marginBottom: '32px' }}>
                    {authResult.message}
                  </p>

                  {/* Details */}
                  <div style={{ background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', padding: '24px', marginBottom: '32px', border: '1px solid rgba(34, 197, 94, 0.3)', textAlign: 'left' }}>
                    <div style={{ display: 'grid', gap: '16px' }}>
                      <div>
                        <p style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                          Resident Name
                        </p>
                        <p style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                          {authResult.resident_name}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                          Apartment
                        </p>
                        <p style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                          {authResult.apartment_no}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 4px 0' }}>
                          Match Score
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '8px', background: 'rgba(75, 85, 99, 0.3)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${authResult.similarity_score * 100}%`, height: '100%', background: '#22c55e', transition: 'width 0.5s ease' }}></div>
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '600' }}>
                            {(authResult.similarity_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleReset}
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: '16px', marginBottom: '12px' }}
                    type="button"
                  >
                    🚪 Try Again
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="btn btn-secondary"
                    style={{ width: '100%', fontSize: '16px' }}
                    type="button"
                  >
                    ← Back to Home
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '80px', marginBottom: '16px' }}>❌</div>
                  <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', color: '#fca5a5' }}>
                    Authentication Failed
                  </h2>
                  <p style={{ color: '#9ca3af', marginBottom: '32px' }}>
                    {authResult.message}
                  </p>

                  <button
                    onClick={handleReset}
                    className="btn btn-primary"
                    style={{ width: '100%', fontSize: '16px' }}
                    type="button"
                  >
                    🎤 Try Again
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}