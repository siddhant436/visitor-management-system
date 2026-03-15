import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Demo() {
  const navigate = useNavigate();

  const scenarios = [
    {
      title: '👤 Visitor Manual Check-In',
      description: 'A visitor fills out a form to check in',
      path: '/visitor/check-in',
      color: '#2563eb'
    },
    {
      title: '🎤 Visitor Voice Check-In',
      description: 'A visitor speaks to automatically check in',
      path: '/visitor/voice-check-in',
      color: '#a855f7'
    },
    {
      title: '📋 Resident Registration',
      description: 'A resident creates a new account',
      path: '/resident/register',
      color: '#16a34a'
    },
    {
      title: '🔐 Resident Login',
      description: 'A resident logs in with email and password',
      path: '/resident/login',
      color: '#4f46e5'
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to br, #f0f9ff, #f0fdf4)' }}>
      {/* Navigation */}
      <nav style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5' }}>🏢 VMS - Demo</h1>
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
            Back to Home
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Voice-Based Visitor Management System
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
            A complete demonstration of voice recognition and authentication features
          </p>
        </div>

        {/* Scenarios */}
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Try These Scenarios:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {scenarios.map((scenario, index) => (
              <div
                key={index}
                style={{
                  background: 'white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease',
                  border: `3px solid ${scenario.color}`
                }}
                onClick={() => navigate(scenario.path)}
              >
                <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {scenario.title}
                </h4>
                <p style={{ color: '#6b7280', marginBottom: '1rem', minHeight: '2.5rem' }}>
                  {scenario.description}
                </p>
                <button
                  style={{
                    background: scenario.color,
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    width: '100%'
                  }}
                >
                  Try Now →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div style={{ marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Key Features:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {features.map((feature, index) => (
              <div
                key={index}
                style={{
                  background: 'white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  padding: '1.5rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{feature.icon}</div>
                <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {feature.title}
                </h4>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div style={{
          background: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          padding: '2rem'
        }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Technology Stack:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Backend</h4>
              <ul style={{ listStyle: 'none', padding: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                <li>✅ FastAPI</li>
                <li>✅ SQLAlchemy ORM</li>
                <li>✅ PostgreSQL</li>
                <li>✅ Whisper API (OpenAI)</li>
                <li>✅ MFCC Voice Embedding</li>
                <li>✅ JWT Authentication</li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Frontend</h4>
              <ul style={{ listStyle: 'none', padding: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                <li>✅ React.js</li>
                <li>✅ React Router</li>
                <li>✅ Axios</li>
                <li>✅ MediaRecorder API</li>
                <li>✅ Context API</li>
                <li>✅ Local Storage</li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Libraries</h4>
              <ul style={{ listStyle: 'none', padding: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                <li>✅ Librosa (MFCC)</li>
                <li>✅ NumPy</li>
                <li>✅ Scikit-learn</li>
                <li>✅ Pydantic</li>
                <li>✅ Argon2</li>
                <li>✅ Python-Jose</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div style={{
          background: 'linear-gradient(to right, #e0e7ff, #f0e7fe)',
          borderRadius: '0.5rem',
          padding: '2rem',
          marginTop: '2rem'
        }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>🚀 Getting Started:</h3>
          <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
            <li><strong>New Visitor?</strong> Click "Visitor Manual Check-In" or "Visitor Voice Check-In"</li>
            <li><strong>New Resident?</strong> Click "Resident Registration" to create an account</li>
            <li><strong>Existing Resident?</strong> Click "Resident Login" with your credentials</li>
            <li><strong>Upload Voice?</strong> Once logged in, go to dashboard and upload your voice sample</li>
            <li><strong>Authenticate?</strong> Use your voice to authenticate instead of passwords</li>
          </ol>
        </div>
      </div>
    </div>
  );
}