import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const features = [
    { icon: '🎤', title: 'Voice Recognition', desc: 'AI-powered voice verification' },
    { icon: '🚪', title: 'Smart Gate Entry', desc: 'Automated gate control' },
    { icon: '🔔', title: 'Notifications', desc: 'Real-time visitor alerts' },
    { icon: '📊', title: 'Analytics', desc: 'Comprehensive statistics' },
  ];

  const quickActions = [
    { icon: '➕', label: 'Check In', desc: 'Register a new visitor', path: '/visitor/check-in' },
    { icon: '🎤', label: 'Voice Check-In', desc: 'Voice-based registration', path: '/visitor/voice-check-in' },
    { icon: '🚪', label: 'Gate Entry', desc: 'Voice-based gate access', path: '/gate/entry' },
    { icon: '👤', label: 'Resident Login', desc: 'Access dashboard', path: '/resident/login' },
  ];
  const adminActions = [
    { icon: '🛡️', label: 'Admin Login', desc: 'Access admin dashboard', path: '/admin/login' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #030712 0%, #111827 50%, #1f2937 100%)' }}>
      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }} className="navbar">
        <div className="flex-between" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px', height: '100%' }}>
          <div 
            className="flex"
            style={{ gap: '12px', cursor: 'pointer', fontSize: '24px' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onClick={() => navigate('/')}
          >
            <span>🏠</span>
            <div>
              <div className="gradient-text" style={{ fontSize: '24px', fontWeight: '700' }}>Visitor Management</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Smart Access Control</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', position: 'relative', overflow: 'hidden' }} className="animate-fade-in">
        {/* Animated backgrounds */}
        <div style={{ position: 'absolute', width: '400px', height: '400px', background: '#22c55e', borderRadius: '50%', top: '80px', left: '40px', mixBlendMode: 'multiply', filter: 'blur(100px)', opacity: 0.1, animation: 'float 6s ease-in-out infinite' }}></div>
        <div style={{ position: 'absolute', width: '400px', height: '400px', background: '#0ea5e9', borderRadius: '50%', top: '160px', right: '40px', mixBlendMode: 'multiply', filter: 'blur(100px)', opacity: 0.1, animation: 'float 6s ease-in-out infinite 2s' }}></div>

        <div style={{ textAlign: 'center', maxWidth: '800px', padding: '32px 16px', zIndex: 10 }}>
          <h1 style={{ fontSize: 'clamp(32px, 8vw, 72px)', fontWeight: 'bold', lineHeight: 1.2, marginBottom: '24px' }}>
            <span className="gradient-text">Smart Visitor</span>
            <br />
            <span style={{ color: 'white' }}>Access Control</span>
          </h1>
          <p style={{ fontSize: '18px', color: '#9ca3af', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            Advanced AI-powered visitor management system with voice recognition, real-time notifications, and smart gate access control.
          </p>
          <div className="flex" style={{ gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/visitor/check-in')}
            >
              ▶ Get Started
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/demo')}
            >
              View Demo ⚡
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 16px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '42px', fontWeight: 'bold', textAlign: 'center' }} className="gradient-text">
          Powerful Features
        </h2>
        <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '16px', fontSize: '18px' }}>
          Everything you need for secure and efficient visitor management
        </p>
        <div className="grid grid-3" style={{ marginTop: '48px' }}>
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="card card-interactive"
              style={{ textAlign: 'center', cursor: 'pointer' }}
              onMouseEnter={() => setHoveredCard(idx)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px', transition: 'transform 0.3s ease', transform: hoveredCard === idx ? 'scale(1.2)' : 'scale(1)' }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{feature.title}</h3>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

            {/* Quick Actions Section */}
      <section style={{ padding: '80px 16px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '42px', fontWeight: 'bold', textAlign: 'center' }} className="gradient-text">
          Quick Actions
        </h2>
        <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '16px', fontSize: '18px' }}>
          Access key features instantly
        </p>

        {/* User Quick Actions */}
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginTop: '48px', marginBottom: '24px', color: '#e5e7eb' }}>
          👥 For Users
        </h3>
        <div className="grid grid-2" style={{ marginBottom: '48px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {quickActions.map((action, idx) => (
            <div
              key={idx}
              className="card card-interactive"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px' }}
              onClick={() => navigate(action.path)}
              onMouseEnter={() => setHoveredCard(idx)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div>
                <div style={{ fontSize: '64px', marginBottom: '16px', transition: 'transform 0.3s ease', transform: hoveredCard === idx ? 'scale(1.3)' : 'scale(1)' }}>
                  {action.icon}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', transition: 'color 0.3s ease', color: hoveredCard === idx ? '#22c55e' : 'inherit' }}>
                  {action.label}
                </h3>
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                  {action.desc}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: hoveredCard === idx ? '12px' : '8px', color: '#22c55e', fontWeight: '600', fontSize: '14px', transition: 'gap 0.3s ease' }}>
                Access Now →
              </div>
            </div>
          ))}
        </div>

        {/* Admin Quick Actions */}
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginTop: '48px', marginBottom: '24px', color: '#e5e7eb' }}>
          🛡️ For Administrators
        </h3>
        <div className="grid grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {adminActions.map((action, idx) => (
            <div
              key={idx}
              className="card card-interactive"
              style={{ 
                cursor: 'pointer', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between', 
                minHeight: '300px',
                background: 'rgba(249, 115, 22, 0.05)',
                borderColor: 'rgba(249, 115, 22, 0.3)'
              }}
              onClick={() => navigate(action.path)}
              onMouseEnter={() => setHoveredCard(idx + 100)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div>
                <div style={{ fontSize: '64px', marginBottom: '16px', transition: 'transform 0.3s ease', transform: hoveredCard === idx + 100 ? 'scale(1.3)' : 'scale(1)' }}>
                  {action.icon}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', transition: 'color 0.3s ease', color: hoveredCard === idx + 100 ? '#f97316' : 'inherit' }}>
                  {action.label}
                </h3>
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                  {action.desc}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: hoveredCard === idx + 100 ? '12px' : '8px', color: '#f97316', fontWeight: '600', fontSize: '14px', transition: 'gap 0.3s ease' }}>
                Access Now →
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '80px 16px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="grid grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            { number: '1000+', label: 'Daily Visitors' },
            { number: '98%', label: 'Accuracy Rate' },
            { number: '24/7', label: 'Monitoring' },
          ].map((stat, idx) => (
            <div key={idx} className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }} className="gradient-text">
                {stat.number}
              </h3>
              <p style={{ color: '#9ca3af' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(55, 65, 81, 0.3)', padding: '32px 16px', textAlign: 'center', color: '#9ca3af' }}>
        <p>© 2026 Smart Visitor Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}