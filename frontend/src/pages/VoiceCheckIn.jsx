import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { visitorAPI } from '../services/api';

export default function VoiceCheckIn() {
  const navigate = useNavigate();
  const { isRecording, audioBlob, audioURL, startRecording, stopRecording, resetRecording } = useVoiceRecorder();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleStartRecording = () => {
    console.log('Starting recording...');
    resetRecording();
    setRecordingTime(0);
    setMessage('');
    setResult(null);
    startRecording();
  };

  const handleStopRecording = () => {
    console.log('Stopping recording...');
    stopRecording();
  };

  const handleSubmit = async () => {
    if (!audioBlob) {
      setMessage('❌ Please record audio first');
      setSuccess(false);
      return;
    }

    console.log('Submitting audio blob:', audioBlob);
    setLoading(true);
    setMessage('');

    try {
      console.log('Calling visitorAPI.voiceCheckIn...');
      const response = await visitorAPI.voiceCheckIn(audioBlob);
      console.log('Response:', response.data);
      
      setSuccess(true);
      setResult(response.data);
      
      if (response.data.status === 'success') {
        setMessage(`✅ Visitor ${response.data.extracted_info.name} checked in successfully!`);
      } else if (response.data.status === 'partial_success') {
        setMessage(`⚠️ ${response.data.message}`);
      } else {
        setMessage(`❌ ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setSuccess(false);
      const errorMsg = error.response?.data?.detail || error.message || 'Voice check-in failed';
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to right, #f3e8ff, #dbeafe)' }}>
      {/* Navigation */}
      <nav style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5' }}>🏢 Visitor Management</h1>
          <button
            onClick={() => navigate('/')}
            style={{
              background: '#6b7280',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Home
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{
          background: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          padding: '2rem'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>
            🎤 Voice-Based Check-In
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Instructions */}
            <div style={{
              background: '#dbeafe',
              border: '1px solid #0284c7',
              borderRadius: '0.375rem',
              padding: '1rem'
            }}>
              <h3 style={{ fontWeight: 'bold', color: '#0c4a6e', marginBottom: '0.5rem' }}>📝 Instructions:</h3>
              <p style={{ color: '#0c4a6e', fontSize: '0.875rem', margin: 0 }}>
                Say something like: "Hi, my name is John Doe, my phone is 1234567890, I'm here for a meeting at apartment 301"
              </p>
            </div>

            {/* Voice Recorder */}
            <div style={{ textAlign: 'center' }}>
              {/* Status */}
              <div style={{ marginBottom: '1.5rem', minHeight: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isRecording ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '0.75rem',
                      height: '0.75rem',
                      background: '#dc2626',
                      borderRadius: '50%',
                      animation: 'pulse 1s infinite'
                    }}></div>
                    <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#dc2626' }}>
                      Recording... {formatTime(recordingTime)}
                    </span>
                  </div>
                ) : audioBlob ? (
                  <span style={{ fontSize: '1.125rem', fontWeight: '600', color: '#16a34a' }}>
                    ✅ Recording Complete
                  </span>
                ) : (
                  <span style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151' }}>
                    Ready to Record
                  </span>
                )}
              </div>

              {/* Microphone Button */}
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={loading}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '2.5rem',
                  marginBottom: '1.5rem',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  background: isRecording ? '#dc2626' : audioBlob ? '#16a34a' : '#4f46e5',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  opacity: loading ? 0.6 : 1
                }}
                title={isRecording ? 'Stop Recording' : 'Start Recording'}
              >
                {isRecording ? '⏹️' : audioBlob ? '✅' : '🎤'}
              </button>

              {/* Audio Playback */}
              {audioURL && (
                <div style={{ marginTop: '1.5rem' }}>
                  <audio src={audioURL} controls style={{ width: '100%', marginBottom: '1rem' }} />
                  <button
                    onClick={() => {
                      resetRecording();
                      setRecordingTime(0);
                      setMessage('');
                      setResult(null);
                    }}
                    style={{
                      color: '#4f46e5',
                      background: 'none',
                      border: 'none',
                      fontWeight: '500',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      fontSize: '0.875rem'
                    }}
                  >
                    Record Again
                  </button>
                </div>
              )}
            </div>

            {/* Message */}
            {message && (
              <div style={{
                padding: '1rem',
                borderRadius: '0.375rem',
                background: success ? '#dcfce7' : '#fee2e2',
                color: success ? '#166534' : '#991b1b',
                border: `1px solid ${success ? '#86efac' : '#fca5a5'}`
              }}>
                {message}
              </div>
            )}

            {/* Result */}
            {result && (
              <div style={{
                background: '#f3f4f6',
                borderRadius: '0.375rem',
                padding: '1.5rem',
                border: '1px solid #e5e7eb'
              }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', marginTop: 0 }}>Extraction Results:</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', textAlign: 'left' }}>
                  <p style={{ margin: 0 }}><strong>Transcribed:</strong> {result.transcribed_text}</p>
                  {result.extracted_info && (
                    <>
                      <p style={{ margin: 0 }}><strong>Name:</strong> {result.extracted_info.name || 'Not detected'}</p>
                      <p style={{ margin: 0 }}><strong>Phone:</strong> {result.extracted_info.phone || 'Not detected'}</p>
                      <p style={{ margin: 0 }}><strong>Purpose:</strong> {result.extracted_info.purpose || 'Not detected'}</p>
                      <p style={{ margin: 0 }}><strong>Apartment:</strong> {result.extracted_info.apartment_no || 'Not detected'}</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleSubmit}
                disabled={!audioBlob || loading}
                style={{
                  flex: 1,
                  background: '#4f46e5',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: (!audioBlob || loading) ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  opacity: (!audioBlob || loading) ? 0.5 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? '⏳ Processing...' : '✅ Submit Voice Check-In'}
              </button>
              <button
                onClick={() => navigate('/')}
                style={{
                  flex: 1,
                  background: '#6b7280',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
            </div>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Prefer manual check-in?{' '}
              <button
                onClick={() => navigate('/visitor/check-in')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4f46e5',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Use Form Check-In
              </button>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}