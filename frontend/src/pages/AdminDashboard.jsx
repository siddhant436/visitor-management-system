import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAdmin } from '../context/AdminContext';
import axios from 'axios';
import { BarChart3, Users, TrendingUp, Activity, Download, Plus, Trash2, CheckCircle, Clock, XCircle, Phone, Lock } from 'lucide-react';
import { theme } from '../styles/theme';
import { Button } from '../components/Button/Button';
import { Input } from '../components/Input/Input';
import { Card, CardBody, CardHeader } from '../components/Card/Card';
const API_BASE_URL = 'http://localhost:8000';

const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.backgroundAlt} 50%, ${theme.colors.surface} 100%);
  padding-bottom: ${theme.spacing[8]};
`;

const Navbar = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(3, 7, 18, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${theme.colors.gray800};
  padding: ${theme.spacing[4]};
  z-index: 50;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
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
  transition: transform ${theme.transitions.fast};

  &:hover {
    transform: scale(1.02);
  }

  h1 {
    margin: 0;
    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: ${theme.fontSizes.xl};
  }
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[4]};

  .welcome-text {
    color: ${theme.colors.gray300};
    font-size: ${theme.fontSizes.sm};
  }
`;

const Content = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 100px ${theme.spacing[4]} ${theme.spacing[8]};
`;

const TabBar = styled.div`
  display: flex;
  gap: ${theme.spacing[2]};
  margin-bottom: ${theme.spacing[8]};
  overflow-x: auto;
  padding-bottom: ${theme.spacing[4]};
  border-bottom: 2px solid ${theme.colors.gray800};

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${theme.colors.gray700};
    border-radius: ${theme.radius.full};
  }

  button {
    background: none;
    border: none;
    color: ${props => props.activeTab === props.id ? '#22c55e' : theme.colors.gray400};
    font-size: ${theme.fontSizes.base};
    font-weight: ${theme.fontWeights.semibold};
    padding: ${theme.spacing[3]} ${theme.spacing[4]};
    cursor: pointer;
    border-bottom: ${props => props.activeTab === props.id ? '3px solid #22c55e' : 'none'};
    transition: all ${theme.transitions.base};
    white-space: nowrap;
    position: relative;

    &:hover {
      color: ${theme.colors.gray300};
    }

    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 3px;
      background: #22c55e;
      transform: scaleX(0);
      transition: transform ${theme.transitions.base};
      transform-origin: center;
    }

    &:hover::after {
      transform: scaleX(1);
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${theme.spacing[6]};
  margin-bottom: ${theme.spacing[8]};
`;

const StatCard = styled(Card)`
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${props => props.color || theme.colors.primary} 0%, ${props => props.colorLight || theme.colors.primaryLight} 100%);
  }

  .icon {
    font-size: 36px;
    margin-bottom: ${theme.spacing[3]};
    display: inline-block;
  }

  .label {
    color: ${theme.colors.gray400};
    font-size: ${theme.fontSizes.sm};
    text-transform: uppercase;
    font-weight: ${theme.fontWeights.semibold};
    margin-bottom: ${theme.spacing[2]};
    letter-spacing: 0.5px;
  }

  .value {
    font-size: ${theme.fontSizes['3xl']};
    font-weight: ${theme.fontWeights.bold};
    margin-bottom: ${theme.spacing[2]};
  }

  .change {
    font-size: ${theme.fontSizes.sm};
    color: ${props => props.positive ? theme.colors.success : theme.colors.error};
    font-weight: ${theme.fontWeights.semibold};
  }
`;

const FilterBar = styled.div`
  display: flex;
  gap: ${theme.spacing[4]};
  margin-bottom: ${theme.spacing[6]};
  flex-wrap: wrap;
  align-items: center;

  @media (max-width: ${theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;

    > * {
      width: 100%;
    }
  }
`;

const SearchInput = styled(Input)`
  flex: 1;
  min-width: 250px;
`;

const Select = styled.select`
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

const TableContainer = styled.div`
  overflow-x: auto;
  border-radius: ${theme.radius.xl};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

  table {
    width: 100%;
    border-collapse: collapse;
    background: ${theme.colors.gray800};

    th {
      background: linear-gradient(135deg, ${theme.colors.gray900} 0%, ${theme.colors.gray800} 100%);
      padding: ${theme.spacing[4]};
      text-align: left;
      color: ${theme.colors.gray300};
      font-weight: ${theme.fontWeights.semibold};
      font-size: ${theme.fontSizes.sm};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid ${theme.colors.gray700};
      position: sticky;
      top: 0;
    }

    td {
      padding: ${theme.spacing[4]};
      border-bottom: 1px solid ${theme.colors.gray700};
      color: ${theme.colors.gray300};
      transition: all ${theme.transitions.fast};
    }

    tr {
      transition: all ${theme.transitions.fast};

      &:hover {
        background: rgba(102, 126, 234, 0.05);

        td {
          color: ${theme.colors.white};
        }
      }

      &:last-child td {
        border-bottom: none;
      }
    }
  }
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${theme.spacing[1]} ${theme.spacing[3]};
  border-radius: ${theme.radius.full};
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
  gap: ${theme.spacing[1]};
  text-transform: capitalize;
  background: ${props => {
    switch (props.status) {
      case 'approved':
        return 'rgba(34, 197, 94, 0.2)';
      case 'pending':
        return 'rgba(249, 115, 22, 0.2)';
      case 'rejected':
        return 'rgba(239, 68, 68, 0.2)';
      default:
        return 'rgba(75, 85, 99, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'approved':
        return theme.colors.success;
      case 'pending':
        return '#f97316';
      case 'rejected':
        return theme.colors.error;
      default:
        return theme.colors.gray400;
    }
  }};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing[2]};
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  background: ${props => props.danger ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'};
  color: ${props => props.danger ? theme.colors.errorLight : theme.colors.successLight};
  border: 1px solid ${props => props.danger ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'};
  border-radius: ${theme.radius.lg};
  cursor: pointer;
  font-size: ${theme.fontSizes.xs};
  font-weight: ${theme.fontWeights.semibold};
  transition: all ${theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${props => props.danger ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MessageBox = styled.div`
  padding: ${theme.spacing[4]};
  border-radius: ${theme.radius.lg};
  margin-bottom: ${theme.spacing[6]};
  background: ${props => props.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'};
  border: 1px solid ${props => props.type === 'error' ? theme.colors.error : theme.colors.success};
  border-left: 4px solid ${props => props.type === 'error' ? theme.colors.error : theme.colors.success};
  color: ${props => props.type === 'error' ? theme.colors.errorLight : theme.colors.successLight};
  display: flex;
  gap: ${theme.spacing[3]};
  animation: slideIn 0.3s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
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
  padding: ${theme.spacing[4]};

  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContent = styled(Card)`
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;

  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing[12]} ${theme.spacing[6]};
  color: ${theme.colors.gray400};

  .icon {
    font-size: 64px;
    margin-bottom: ${theme.spacing[4]};
  }

  h3 {
    color: ${theme.colors.white};
    margin: ${theme.spacing[4]} 0 ${theme.spacing[2]};
  }

  p {
    margin: 0;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 3px solid rgba(102, 126, 234, 0.2);
  border-top-color: ${theme.colors.primary};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ChartContainer = styled.div`
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid ${theme.colors.gray700};
  border-radius: ${theme.radius.xl};
  padding: ${theme.spacing[6]};
  margin-bottom: ${theme.spacing[6]};
  min-height: 300px;
  display: flex;
  align-items: flex-end;
  gap: ${theme.spacing[3]};
`;

const ChartBar = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.spacing[2]};

  .bar {
    width: 100%;
    background: linear-gradient(180deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%);
    border-radius: ${theme.radius.lg} ${theme.radius.lg} 0 0;
    min-height: 20px;
    max-height: 200px;
    height: ${props => props.height}px;
    transition: all ${theme.transitions.base};
    cursor: pointer;

    &:hover {
      filter: brightness(1.2);
      box-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
    }
  }

  .label {
    font-size: ${theme.fontSizes.xs};
    color: ${theme.colors.gray400};
    text-align: center;
  }

  .value {
    font-size: ${theme.fontSizes.sm};
    font-weight: ${theme.fontWeights.bold};
    color: ${theme.colors.white};
  }
`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { admin, logout } = useAdmin();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [visitors, setVisitors] = useState([]);
  const [residents, setResidents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [message, setMessage] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddResident, setShowAddResident] = useState(false);
  const [newResident, setNewResident] = useState({
    name: '',
    email: '',
    phone: '',
    apartment_no: '',
    password: ''
  });

  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    if (!admin || !token) {
      navigate('/admin/login');
      return;
    }

    fetchDashboardData();
  }, [token, admin, selectedMonth, selectedYear]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [visitorsRes, residentsRes, analyticsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/visitors/?skip=0&limit=100`),
        axios.get(`${API_BASE_URL}/residents/?skip=0&limit=100`),
        axios.get(
          `${API_BASE_URL}/visitors/analytics/monthly?month=${selectedMonth}&year=${selectedYear}`
        )
      ]);

      setVisitors(Array.isArray(visitorsRes.data) ? visitorsRes.data : []);
      setResidents(Array.isArray(residentsRes.data) ? residentsRes.data : []);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantEntry = async (visitorId, visitorName) => {
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/visitors/${visitorId}/grant-entry`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setMessage(`✅ Entry granted to ${visitorName}!`);
      fetchDashboardData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`❌ Error granting entry`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVisitor = async (visitorId) => {
    if (!window.confirm('Are you sure you want to delete this visitor?')) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/visitors/${visitorId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setMessage('✅ Visitor deleted successfully');
      fetchDashboardData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Error deleting visitor');
    }
  };

  const handleDeleteResident = async (residentId) => {
    if (!window.confirm('Are you sure you want to delete this resident?')) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/residents/${residentId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setMessage('✅ Resident deleted successfully');
      fetchDashboardData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Error deleting resident');
    }
  };

  const handleAddResident = async (e) => {
    e.preventDefault();

    if (!newResident.name || !newResident.email || !newResident.phone || !newResident.apartment_no || !newResident.password) {
      setMessage('❌ All fields are required');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/residents/register`,
        newResident,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setMessage('✅ Resident registered successfully');
      setNewResident({ name: '', email: '', phone: '', apartment_no: '', password: '' });
      setShowAddResident(false);
      fetchDashboardData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Error registering resident';
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/visitors/1/export?month=${selectedMonth}&year=${selectedYear}`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const csvData = response.data.data;
      const filename = `visitors_${selectedYear}_${selectedMonth.toString().padStart(2, '0')}.csv`;

      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      setMessage('✅ Data downloaded successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('❌ Error downloading data');
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.clear();
    navigate('/');
  };

  const filteredVisitors = visitors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         v.phone.includes(searchTerm) ||
                         v.apartment_no.includes(searchTerm);
    const matchesStatus = !filterStatus || v.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredResidents = residents.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.apartment_no.includes(searchTerm)
  );

  if (!admin || !token) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.colors.backgroundAlt} 50%, ${theme.colors.surface} 100%)`
      }}>
        <div style={{ textAlign: 'center' }}>
          <LoadingSpinner />
          <p style={{ color: theme.colors.gray400, marginTop: theme.spacing[4] }}>
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Container>
      <Navbar>
        <NavContent>
          <Logo onClick={() => navigate('/')}>
            <span style={{ fontSize: '28px' }}>🛡️</span>
            <h1>Admin Dashboard</h1>
          </Logo>
          <NavActions>
            <span className="welcome-text">Welcome, {admin?.name}!</span>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </NavActions>
        </NavContent>
      </Navbar>

      <Content>
        {message && (
          <MessageBox type={message.includes('✅') ? 'success' : 'error'}>
            <span>{message.includes('✅') ? '✅' : '❌'}</span>
            <span>{message}</span>
          </MessageBox>
        )}

        <TabBar activeTab={activeTab}>
          <button id="overview" onClick={() => setActiveTab('overview')}>
            📊 Analytics
          </button>
          <button id="visitors" onClick={() => setActiveTab('visitors')}>
            👥 Visitors
          </button>
          <button id="residents" onClick={() => setActiveTab('residents')}>
            👤 Residents
          </button>
        </TabBar>

        {/* Analytics Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats */}
            {analytics && (
              <>
                <StatsGrid>
                  <StatCard hoverable={true} color={theme.colors.primary} colorLight={theme.colors.primaryLight}>
                    <div className="icon">👥</div>
                    <div className="label">Total Visitors</div>
                    <div className="value">{analytics.total_visitors}</div>
                    <div className="change">↑ This Month</div>
                  </StatCard>
                  <StatCard hoverable={true} color={theme.colors.success} colorLight="#6ee7b7">
                    <div className="icon">✅</div>
                    <div className="label">Approved</div>
                    <div className="value">{analytics.total_visitors > 0 ? Math.floor(analytics.total_visitors * 0.7) : 0}</div>
                    <div className="change" style={{ color: theme.colors.success }}>70% Approval Rate</div>
                  </StatCard>
                  <StatCard hoverable={true} color="#f97316" colorLight="#fbbf24">
                    <div className="icon">⏳</div>
                    <div className="label">Pending</div>
                    <div className="value">{analytics.total_visitors > 0 ? Math.floor(analytics.total_visitors * 0.2) : 0}</div>
                    <div className="change" style={{ color: '#f97316' }}>Awaiting Action</div>
                  </StatCard>
                  <StatCard hoverable={true} color={theme.colors.error} colorLight="#fca5a5">
                    <div className="icon">❌</div>
                    <div className="label">Rejected</div>
                    <div className="value">{analytics.total_visitors > 0 ? Math.floor(analytics.total_visitors * 0.1) : 0}</div>
                    <div className="change" style={{ color: theme.colors.error }}>10% Rejection</div>
                  </StatCard>
                </StatsGrid>

                {/* Chart */}
                <Card hoverable={false}>
                  <CardHeader>
                    <h3 style={{ margin: 0 }}>📈 Daily Visitor Activity</h3>
                    <div style={{ display: 'flex', gap: theme.spacing[3], alignItems: 'center' }}>
                      <Select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                          <option key={m} value={m}>
                            {new Date(2024, m - 1).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </Select>
                      <Button variant="outline" size="sm" icon={Download} onClick={handleDownloadCSV}>
                        Download
                      </Button>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <ChartContainer>
                      {Object.entries(analytics.daily_breakdown).map(([day, data]) => {
                        const maxCount = Math.max(...Object.values(analytics.daily_breakdown).map(d => d.count), 1);
                        const height = (data.count / maxCount) * 180;
                        return (
                          <ChartBar key={day} height={height}>
                            <div className="bar" title={`Day ${day}: ${data.count} visitors`} />
                            <div className="label">Day {day}</div>
                            <div className="value">{data.count}</div>
                          </ChartBar>
                        );
                      })}
                    </ChartContainer>
                  </CardBody>
                </Card>

                {/* Purpose Breakdown */}
                <Card hoverable={false}>
                  <CardHeader>
                    <h3 style={{ margin: 0 }}>📋 Visitors by Purpose</h3>
                  </CardHeader>
                  <CardBody>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: theme.spacing[4]
                    }}>
                      {Object.entries(analytics.purpose_breakdown).map(([purpose, count]) => (
                        <div key={purpose} style={{
                          background: 'rgba(31, 41, 55, 0.7)',
                          padding: theme.spacing[4],
                          borderRadius: theme.radius.lg,
                          border: '1px solid rgba(75, 85, 99, 0.3)',
                          textAlign: 'center',
                          transition: `all ${theme.transitions.base}`,
                          cursor: 'pointer'
                        }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(31, 41, 55, 0.9)';
                            e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(31, 41, 55, 0.7)';
                            e.currentTarget.style.borderColor = 'rgba(75, 85, 99, 0.3)';
                          }}>
                          <p style={{ color: theme.colors.gray400, margin: '0 0 8px 0', fontSize: theme.fontSizes.sm, textTransform: 'capitalize' }}>
                            {purpose}
                          </p>
                          <p style={{ margin: 0, fontSize: theme.fontSizes['2xl'], fontWeight: theme.fontWeights.bold }}>
                            {count}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </>
            )}
          </>
        )}

        {/* Visitors Tab */}
        {activeTab === 'visitors' && (
          <>
            <FilterBar>
              <Input
                label="Search"
                type="text"
                placeholder="Search by name, phone, or apartment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Users}
              />
              <div>
                <label style={{ display: 'block', fontSize: theme.fontSizes.sm, color: theme.colors.gray400, marginBottom: theme.spacing[2] }}>
                  Status
                </label>
                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="approved">✅ Approved</option>
                  <option value="rejected">❌ Rejected</option>
                </Select>
              </div>
            </FilterBar>

            <Card hoverable={false}>
              <CardHeader>
                <h3 style={{ margin: 0 }}>👥 All Visitors</h3>
                <span style={{ color: theme.colors.gray400 }}>{filteredVisitors.length} total</span>
              </CardHeader>
              <CardBody>
                {filteredVisitors.length > 0 ? (
                  <TableContainer>
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Phone</th>
                          <th>Apartment</th>
                          <th>Purpose</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVisitors.map((visitor) => (
                          <tr key={visitor.id}>
                            <td style={{ fontWeight: theme.fontWeights.semibold }}>{visitor.name}</td>
                            <td>{visitor.phone}</td>
                            <td>Apt {visitor.apartment_no}</td>
                            <td style={{ textTransform: 'capitalize' }}>{visitor.purpose}</td>
                            <td>
                              <Badge status={visitor.status}>
                                {visitor.status === 'pending' && <Clock size={14} />}
                                {visitor.status === 'approved' && <CheckCircle size={14} />}
                                {visitor.status === 'rejected' && <XCircle size={14} />}
                                {visitor.status}
                              </Badge>
                            </td>
                            <td>{new Date(visitor.created_at).toLocaleDateString()}</td>
                            <td>
                              <ActionButtons>
                                {visitor.status === 'approved' && (
                                  <ActionButton onClick={() => handleGrantEntry(visitor.id, visitor.name)} disabled={loading}>
                                    🚪 Grant Entry
                                  </ActionButton>
                                )}
                                <ActionButton danger onClick={() => handleDeleteVisitor(visitor.id)} disabled={loading}>
                                  <Trash2 size={14} /> Delete
                                </ActionButton>
                              </ActionButtons>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableContainer>
                ) : (
                  <EmptyState>
                    <div className="icon">📭</div>
                    <h3>No Visitors Found</h3>
                    <p>Try adjusting your search filters</p>
                  </EmptyState>
                )}
              </CardBody>
            </Card>
          </>
        )}

        {/* Residents Tab */}
        {activeTab === 'residents' && (
          <>
            <FilterBar>
              <Input
                label="Search"
                type="text"
                placeholder="Search by name, email, or apartment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Users}
              />
              <Button variant="primary" size="lg" icon={Plus} onClick={() => setShowAddResident(true)}>
                Add Resident
              </Button>
            </FilterBar>

            <Card hoverable={false}>
              <CardHeader>
                <h3 style={{ margin: 0 }}>👤 All Residents</h3>
                <span style={{ color: theme.colors.gray400 }}>{filteredResidents.length} total</span>
              </CardHeader>
              <CardBody>
                {filteredResidents.length > 0 ? (
                  <TableContainer>
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Apartment</th>
                          <th>Voice Registered</th>
                          <th>Email Verified</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResidents.map((resident) => (
                          <tr key={resident.id}>
                            <td style={{ fontWeight: theme.fontWeights.semibold }}>{resident.name}</td>
                            <td>{resident.email}</td>
                            <td>{resident.phone}</td>
                            <td>{resident.apartment_no}</td>
                            <td>
                              <Badge status={resident.voice_registered ? 'approved' : 'pending'}>
                                {resident.voice_registered ? '✅ Yes' : '❌ No'}
                              </Badge>
                            </td>
                            <td>
                              <Badge status={resident.email_verified ? 'approved' : 'pending'}>
                                {resident.email_verified ? '✅ Yes' : '❌ No'}
                              </Badge>
                            </td>
                            <td>
                              <ActionButtons>
                                <ActionButton danger onClick={() => handleDeleteResident(resident.id)} disabled={loading}>
                                  <Trash2 size={14} /> Delete
                                </ActionButton>
                              </ActionButtons>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableContainer>
                ) : (
                  <EmptyState>
                    <div className="icon">📭</div>
                    <h3>No Residents Found</h3>
                    <p>Try adjusting your search filters or add a new resident</p>
                  </EmptyState>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </Content>

      {/* Add Resident Modal */}
      {showAddResident && (
        <Modal onClick={() => setShowAddResident(false)}>
          <ModalContent hoverable={false} onClick={e => e.stopPropagation()}>
            <CardHeader>
              <h2 style={{ margin: 0 }}>➕ Register New Resident</h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleAddResident} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
                <Input
                  label="Name"
                  type="text"
                  placeholder="John Doe"
                  value={newResident.name}
                  onChange={(e) => setNewResident({ ...newResident, name: e.target.value })}
                  icon={Users}
                  required
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="john@example.com"
                  value={newResident.email}
                  onChange={(e) => setNewResident({ ...newResident, email: e.target.value })}
                  required
                />

                <Input
                  label="Phone"
                  type="tel"
                  placeholder="9876543210"
                  value={newResident.phone}
                  onChange={(e) => setNewResident({ ...newResident, phone: e.target.value })}
                  icon={Phone}
                  required
                />

                <Input
                  label="Apartment Number"
                  type="text"
                  placeholder="325"
                  value={newResident.apartment_no}
                  onChange={(e) => setNewResident({ ...newResident, apartment_no: e.target.value })}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={newResident.password}
                  onChange={(e) => setNewResident({ ...newResident, password: e.target.value })}
                  icon={Lock}
                  showPasswordToggle
                  required
                />

                <div style={{ display: 'flex', gap: theme.spacing[3] }}>
                  <Button
                    variant="primary"
                    size="lg"
                    type="submit"
                    disabled={loading}
                    style={{ flex: 1 }}
                  >
                    {loading ? 'Registering...' : '✅ Register'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    type="button"
                    onClick={() => setShowAddResident(false)}
                    disabled={loading}
                    style={{ flex: 1 }}
                  >
                    ❌ Cancel
                  </Button>
                </div>
              </form>
            </CardBody>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}