import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { theme } from '../styles/theme';
import { Button } from '../components/Button/Button';
import { Card, CardBody } from '../components/Card/Card';

const API_BASE_URL = 'http://localhost:8000';

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
  max-width: 1400px;
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
    font-size: ${theme.fontSizes.xl};
  }
`;

const Content = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 100px ${theme.spacing[4]} ${theme.spacing[8]};
`;

const InfoBanner = styled(Card)`
  background: rgba(14, 165, 233, 0.1);
  border-left: 4px solid #0ea5e9;
  margin-bottom: ${theme.spacing[6]};

  p {
    color: #7dd3fc;
    margin: 0;
    font-weight: ${theme.fontWeights.semibold};
    font-size: ${theme.fontSizes.sm};
  }
`;

const MessageBox = styled.div`
  padding: ${theme.spacing[4]};
  border-radius: ${theme.radius.lg};
  margin-bottom: ${theme.spacing[6]};
  background: ${props => props.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'};
  border: 1px solid ${props => props.type === 'error' ? theme.colors.error : theme.colors.success};
  color: ${props => props.type === 'error' ? theme.colors.errorLight : theme.colors.successLight};
  display: flex;
  gap: ${theme.spacing[3]};
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
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

const VisitorCard = styled(Card)`
  border-left: 4px solid #f97316;
  margin-bottom: ${theme.spacing[4]};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.spacing[4]};

  @media (max-width: ${theme.breakpoints.md}) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const VisitorInfo = styled.div`
  flex: 1;

  .header {
    display: flex;
    align-items: center;
    gap: ${theme.spacing[3]};
    margin-bottom: ${theme.spacing[4]};

    .icon {
      font-size: 40px;
    }

    .details h3 {
      margin: 0;
      font-size: ${theme.fontSizes.xl};
    }

    .details p {
      color: ${theme.colors.gray400};
      font-size: ${theme.fontSizes.sm};
      margin: 0;
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: ${theme.spacing[4]};

    .info-item {
      background: rgba(75, 85, 99, 0.3);
      padding: ${theme.spacing[3]};
      border-radius: ${theme.radius.lg};

      .label {
        color: ${theme.colors.gray400};
        font-size: ${theme.fontSizes.xs};
        font-weight: ${theme.fontWeights.semibold};
        text-transform: uppercase;
        margin-bottom: ${theme.spacing[1]};
      }

      .value {
        color: ${theme.colors.white};
        font-weight: ${theme.fontWeights.semibold};
        font-size: ${theme.fontSizes.base};
      }
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing[3]};
  flex-wrap: wrap;

  @media (max-width: ${theme.breakpoints.md}) {
    width: 100%;

    button {
      flex: 1;
      min-width: 120px;
    }
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ModalContent = styled(Card)`
  max-width: 500px;
  width: 90%;
`;

const EmptyState = styled(Card)`
  text-align: center;
  padding: ${theme.spacing[12]} ${theme.spacing[6]};

  .icon {
    font-size: 56px;
    margin-bottom: ${theme.spacing[4]};
  }

  h3 {
    color: ${theme.colors.success};
    margin: ${theme.spacing[4]} 0 ${theme.spacing[2]};
  }

  p {
    color: ${theme.colors.gray400};
  }
`;

export default function ResidentApprovals() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [pendingVisitors, setPendingVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedVisitorId, setSelectedVisitorId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processedVisitors, setProcessedVisitors] = useState([]);

  const token = localStorage.getItem('access_token');
  const apartmentNo = localStorage.getItem('apartment_no');
  const residentId = localStorage.getItem('user_id');

  useEffect(() => {
    if (!user || !token) {
      navigate('/resident/login');
      return;
    }

    fetchPendingVisitors();
    const interval = setInterval(fetchPendingVisitors, 5000);
    return () => clearInterval(interval);
  }, [token, apartmentNo]);

  const fetchPendingVisitors = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/visitors/status/pending?apartment_no=${apartmentNo}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setPendingVisitors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching pending visitors:', error);
    }
  };

  const handleApprove = async (visitorId, visitorName) => {
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/visitors/${visitorId}/approve?resident_id=${residentId}`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setMessage(`✅ ${visitorName} approved! Entry pending admin confirmation.`);
      setProcessedVisitors([...processedVisitors, visitorId]);
      fetchPendingVisitors();
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessage('❌ Error approving visitor');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setMessage('❌ Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/visitors/${selectedVisitorId}/reject?resident_id=${residentId}&rejection_reason=${encodeURIComponent(rejectionReason)}`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setMessage('✅ Visitor rejected successfully!');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedVisitorId(null);
      setProcessedVisitors([...processedVisitors, selectedVisitorId]);
      fetchPendingVisitors();
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessage('❌ Error rejecting visitor');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate('/');
  };

  return (
    <Container>
      <Navbar>
        <NavContent>
          <Logo onClick={() => navigate('/')}>
            <span style={{ fontSize: '24px' }}>⏳</span>
            <h1>Visitor Approvals</h1>
          </Logo>
          <div style={{ display: 'flex', gap: theme.spacing[4], alignItems: 'center' }}>
            <span style={{ color: theme.colors.gray300, fontSize: theme.fontSizes.sm }}>
              Apt {apartmentNo} • {user?.name}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/resident/dashboard')}
            >
              ← Dashboard
            </Button>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </NavContent>
      </Navbar>

      <Content>
        <InfoBanner hoverable={false}>
          <p>👋 New visitors are waiting for your approval. Please review and approve or reject them below.</p>
        </InfoBanner>

        {message && (
          <MessageBox type={message.includes('✅') ? 'success' : 'error'}>
            <span>{message.includes('✅') ? '✅' : '❌'}</span>
            <span>{message}</span>
          </MessageBox>
        )}

        {loading && pendingVisitors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: theme.spacing[12], color: theme.colors.gray400 }}>
            <div style={{ fontSize: '24px', marginBottom: theme.spacing[4] }}>⏳</div>
            <p>Loading pending approvals...</p>
          </div>
        ) : pendingVisitors.length > 0 ? (
          <div>
            {pendingVisitors.map((visitor) => (
              <VisitorCard key={visitor.id} hoverable={false}>
                <VisitorInfo>
                  <div className="header">
                    <div className="icon">👤</div>
                    <div className="details">
                      <h3>{visitor.name}</h3>
                      <p>Check-in: {new Date(visitor.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="info-grid">
                    <div className="info-item">
                      <div className="label">📞 Phone</div>
                      <div className="value">{visitor.phone}</div>
                    </div>
                    <div className="info-item">
                      <div className="label">🎯 Purpose</div>
                      <div className="value" style={{ textTransform: 'capitalize' }}>
                        {visitor.purpose}
                      </div>
                    </div>
                    <div className="info-item">
                      <div className="label">🏠 Apartment</div>
                      <div className="value">Apt {visitor.apartment_no}</div>
                    </div>
                  </div>
                </VisitorInfo>

                <ActionButtons>
                  <Button
                    variant="success"
                    size="md"
                    onClick={() => handleApprove(visitor.id, visitor.name)}
                    disabled={loading || processedVisitors.includes(visitor.id)}
                  >
                    {processedVisitors.includes(visitor.id) ? '✅ Approved' : '✅ Approve'}
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => {
                      setSelectedVisitorId(visitor.id);
                      setShowRejectModal(true);
                    }}
                    disabled={loading || processedVisitors.includes(visitor.id)}
                  >
                    {processedVisitors.includes(visitor.id) ? '❌ Rejected' : '❌ Reject'}
                  </Button>
                </ActionButtons>
              </VisitorCard>
            ))}
          </div>
        ) : (
          <EmptyState hoverable={false}>
            <div className="icon">✨</div>
            <h3>All Clear!</h3>
            <p>No pending visitor approvals at the moment</p>
          </EmptyState>
        )}
      </Content>

      {/* Rejection Modal */}
      {showRejectModal && (
        <Modal onClick={() => {
          setShowRejectModal(false);
          setRejectionReason('');
          setSelectedVisitorId(null);
        }}>
          <ModalContent hoverable={false} onClick={e => e.stopPropagation()}>
            <CardBody>
              <h2 style={{ marginTop: 0, fontSize: theme.fontSizes['2xl'] }}>❌ Reject Visitor?</h2>
              <p style={{ color: theme.colors.gray400, marginBottom: theme.spacing[6] }}>
                Please provide a reason for rejecting this visitor. The admin will be notified of your decision.
              </p>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Not recognized, No appointment, Suspicious behavior..."
                style={{
                  width: '100%',
                  padding: theme.spacing[3],
                  borderRadius: theme.radius.lg,
                  background: theme.colors.gray800,
                  border: `1px solid ${theme.colors.gray700}`,
                  color: theme.colors.white,
                  fontSize: theme.fontSizes.sm,
                  fontFamily: theme.fonts.primary,
                  minHeight: '100px',
                  marginBottom: theme.spacing[6],
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />

              <div style={{ display: 'flex', gap: theme.spacing[3] }}>
                <Button
                  variant="danger"
                  size="lg"
                  onClick={handleReject}
                  disabled={loading || !rejectionReason.trim()}
                  style={{ flex: 1 }}
                >
                  {loading ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setSelectedVisitorId(null);
                  }}
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  Cancel
                </Button>
              </div>
            </CardBody>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}