import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { admin, logout } = useAdmin();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [visitors, setVisitors] = useState([]);
  const [residents, setResidents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
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
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('admin_token');
  const adminId = localStorage.getItem('admin_id');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (!admin || !token || !adminId) {
      navigate('/admin/login');
      return;
    }

    fetchDashboardData();
  }, [token, adminId, admin, selectedMonth, selectedYear]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch visitors
      const visitorsResponse = await axios.get(
        `${API_BASE_URL}/visitors/?skip=0&limit=100`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      setVisitors(Array.isArray(visitorsResponse.data) ? visitorsResponse.data : []);

      // Fetch residents
      const residentsResponse = await axios.get(
        `${API_BASE_URL}/residents/?skip=0&limit=100`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      setResidents(Array.isArray(residentsResponse.data) ? residentsResponse.data : []);

      // Fetch analytics
      const analyticsResponse = await axios.get(
        `${API_BASE_URL}/visitors/analytics/monthly?month=${selectedMonth}&year=${selectedYear}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      setAnalytics(analyticsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Error loading data');
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
    setMessage(`✅ Entry granted to ${visitorName}! They can now enter.`);
    fetchDashboardData();
    setTimeout(() => setMessage(''), 3000);
  } catch (error) {
    const errorMsg = error.response?.data?.detail || 'Error granting entry';
    setMessage(`❌ ${errorMsg}`);
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

      // Create blob and download
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
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #030712 0%, #111827 50%, #1f2937 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #030712 0%, #111827 50%, #1f2937 100%)' }}>
      {/* Navigation */}
      <nav className="navbar" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <div className="flex-between" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '24px' }} onClick={() => navigate('/')}>
            <span>🏠</span>
            <div className="gradient-text" style={{ fontSize: '20px', fontWeight: '700' }}>Admin Dashboard</div>
          </div>
          <div className="flex" style={{ gap: '16px', alignItems: 'center' }}>
            <span style={{ color: '#d1d5db', fontSize: '14px' }}>Welcome, {admin?.name}!</span>
            <button
              onClick={handleLogout}
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '100px 16px 32px' }}>
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

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            background: 'rgba(220, 38, 38, 0.1)',
            color: '#fca5a5',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            display: 'flex',
            gap: '8px'
          }}>
            <span>❌</span>
            <span>{String(error)}</span>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap', borderBottom: '2px solid rgba(75, 85, 99, 0.3)', paddingBottom: '16px' }}>
          {[
            { id: 'overview', label: '📊 Analytics' },
            { id: 'visitors', label: '👥 Visitors' },
            { id: 'residents', label: '👤 Residents' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === tab.id ? '#22c55e' : '#9ca3af',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '12px 20px',
                borderBottom: activeTab === tab.id ? '2px solid #22c55e' : 'none',
                transition: 'all 0.3s ease'
              }}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Analytics Tab */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in">
            {/* Month/Year Selector & Download Button */}
            <div className="card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '4px', display: 'block' }}>Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(31, 41, 55, 0.7)',
                    border: '1px solid rgba(75, 85, 99, 0.3)',
                    color: '#e5e7eb',
                    cursor: 'pointer'
                  }}
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                    <option key={m} value={m}>{new Date(2024, m-1).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '4px', display: 'block' }}>Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(31, 41, 55, 0.7)',
                    border: '1px solid rgba(75, 85, 99, 0.3)',
                    color: '#e5e7eb',
                    cursor: 'pointer'
                  }}
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleDownloadCSV}
                style={{
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginTop: '20px'
                }}
              >
                📥 Download CSV
              </button>
            </div>

            {/* Analytics Cards */}
            {analytics && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                  {[
                    { icon: '👥', label: 'Total Visitors', value: analytics.total_visitors, color: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.3)' },
                    { icon: '📅', label: 'Days Active', value: Object.keys(analytics.daily_breakdown).length, color: 'rgba(14, 165, 233, 0.1)', borderColor: 'rgba(14, 165, 233, 0.3)' },
                    { icon: '📊', label: 'Average Daily', value: analytics.average_daily.toFixed(1), color: 'rgba(249, 115, 22, 0.1)', borderColor: 'rgba(249, 115, 22, 0.3)' },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="card"
                      style={{ padding: '24px', background: stat.color, borderColor: stat.borderColor }}
                    >
                      <div style={{ fontSize: '32px', marginBottom: '12px' }}>{stat.icon}</div>
                      <p style={{ color: '#9ca3af', fontSize: '13px', margin: '0 0 8px 0', fontWeight: '600', textTransform: 'uppercase' }}>
                        {stat.label}
                      </p>
                      <p style={{ fontSize: '32px', fontWeight: '700', margin: 0 }}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Purpose Breakdown */}
                <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', margin: '0 0 20px 0' }}>📋 Visitors by Purpose</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {Object.entries(analytics.purpose_breakdown).map(([purpose, count]) => (
                      <div
                        key={purpose}
                        style={{
                          background: 'rgba(31, 41, 55, 0.7)',
                          padding: '16px',
                          borderRadius: '8px',
                          border: '1px solid rgba(75, 85, 99, 0.3)',
                          textAlign: 'center'
                        }}
                      >
                        <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 8px 0', textTransform: 'capitalize' }}>{purpose}</p>
                        <p style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>{count}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Chart Visualization */}
                <div className="card" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', margin: '0 0 20px 0' }}>📈 Daily Visitors</h3>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '300px', padding: '16px', background: 'rgba(31, 41, 55, 0.5)', borderRadius: '8px', overflowX: 'auto' }}>
                    {Object.entries(analytics.daily_breakdown).map(([day, data]) => {
                      const maxCount = Math.max(...Object.values(analytics.daily_breakdown).map(d => d.count));
                      const height = (data.count / maxCount) * 100;
                      return (
                        <div
                          key={day}
                          style={{
                            flex: '1 1 auto',
                            minWidth: '30px',
                            height: `${height}%`,
                            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                            borderRadius: '6px 6px 0 0',
                            cursor: 'pointer',
                            position: 'relative',
                            group: 'hover',
                            transition: 'all 0.3s ease'
                          }}
                          title={`Day ${day}: ${data.count} visitors`}
                        >
                          <span style={{
                            position: 'absolute',
                            bottom: '-20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '11px',
                            color: '#9ca3af',
                            whiteSpace: 'nowrap'
                          }}>
                            {day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ marginTop: '40px', color: '#9ca3af', fontSize: '13px' }}>
                    📍 Hover over bars to see daily visitor count
                  </p>
                </div>
              </>
            )}
          </div>
        )}


{/* Visitors Tab */}
{activeTab === 'visitors' && (
  <div className="animate-fade-in">
    <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <input
        type="text"
        placeholder="Search by name, phone, or apartment..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="input-field"
        style={{ flex: '1', minWidth: '250px' }}
      />
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        style={{
          padding: '10px 12px',
          borderRadius: '6px',
          background: 'rgba(31, 41, 55, 0.7)',
          border: '1px solid rgba(75, 85, 99, 0.3)',
          color: '#e5e7eb',
          cursor: 'pointer'
        }}
      >
        <option value="">All Status</option>
        <option value="pending">⏳ Pending</option>
        <option value="approved">✅ Approved</option>
        <option value="rejected">❌ Rejected</option>
      </select>
    </div>

    {loading ? (
      <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
        <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
        <p>Loading visitors...</p>
      </div>
    ) : filteredVisitors.length > 0 ? (
      <div className="card" style={{ padding: 0, overflow: 'hidden', overflowX: 'auto' }}>
        <table className="table" style={{ marginBottom: 0 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Apartment</th>
              <th>Purpose</th>
              <th>Status</th>
              <th>Approval Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVisitors.map((visitor, idx) => (
              <tr key={idx} style={{
                background: visitor.status === 'pending' ? 'rgba(249, 115, 22, 0.05)' : 
                            visitor.status === 'approved' ? 'rgba(34, 197, 94, 0.05)' :
                            'rgba(239, 68, 68, 0.05)'
              }}>
                <td style={{ fontWeight: '600' }}>{visitor.name}</td>
                <td>{visitor.phone}</td>
                <td style={{ fontWeight: '600' }}>Apt {visitor.apartment_no}</td>
                <td>
                  <span className="badge badge-success">
                    {visitor.purpose}
                  </span>
                </td>
                <td>
                  <span className={`badge ${
                    visitor.status === 'pending' ? 'badge-warning' :
                    visitor.status === 'approved' ? 'badge-success' :
                    'badge-danger'
                  }`} style={{ fontSize: '12px' }}>
                    {visitor.status === 'pending' ? '⏳ Pending Resident Approval' :
                     visitor.status === 'approved' ? '✅ Resident Approved' :
                     '❌ Resident Rejected'}
                  </span>
                </td>
                <td style={{ color: '#9ca3af', fontSize: '12px' }}>
                  {visitor.approval_timestamp 
                    ? new Date(visitor.approval_timestamp).toLocaleString()
                    : new Date(visitor.created_at).toLocaleString()}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {visitor.status === 'approved' && (
                      <button
                        onClick={() => handleGrantEntry(visitor.id, visitor.name)}
                        style={{
                          background: 'rgba(34, 197, 94, 0.2)',
                          color: '#86efac',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        🚪 Grant Entry
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteVisitor(visitor.id)}
                      style={{
                        background: 'rgba(220, 38, 38, 0.2)',
                        color: '#fca5a5',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
        <p style={{ fontSize: '36px', margin: '0 0 12px 0' }}>📭</p>
        <p style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>No visitors found</p>
      </div>
    )}
  </div>
)}

        {/* Residents Tab */}
        {activeTab === 'residents' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search by name, email, or apartment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
                style={{ flex: '1', minWidth: '250px' }}
              />
              <button
                onClick={() => setShowAddResident(true)}
                style={{
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ➕ Add Resident
              </button>
            </div>

            {/* Add Resident Modal */}
            {showAddResident && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100
              }}>
                <div className="card" style={{ width: '90%', maxWidth: '500px', padding: '32px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>➕ Register New Resident</h2>

                  <form onSubmit={handleAddResident} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '6px', fontWeight: '600' }}>Name</label>
                      <input
                        type="text"
                        value={newResident.name}
                        onChange={(e) => setNewResident({ ...newResident, name: e.target.value })}
                        required
                        className="input-field"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '6px', fontWeight: '600' }}>Email</label>
                      <input
                        type="email"
                        value={newResident.email}
                        onChange={(e) => setNewResident({ ...newResident, email: e.target.value })}
                        required
                        className="input-field"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '6px', fontWeight: '600' }}>Phone</label>
                      <input
                        type="tel"
                        value={newResident.phone}
                        onChange={(e) => setNewResident({ ...newResident, phone: e.target.value })}
                        required
                        className="input-field"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '6px', fontWeight: '600' }}>Apartment Number</label>
                      <input
                        type="text"
                        value={newResident.apartment_no}
                        onChange={(e) => setNewResident({ ...newResident, apartment_no: e.target.value })}
                        required
                        className="input-field"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '13px', color: '#9ca3af', marginBottom: '6px', fontWeight: '600' }}>Password</label>
                      <input
                        type="password"
                        value={newResident.password}
                        onChange={(e) => setNewResident({ ...newResident, password: e.target.value })}
                        required
                        className="input-field"
                        style={{ width: '100%' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                      <button
                        type="submit"
                        style={{
                          flex: 1,
                          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                          color: 'white',
                          padding: '10px',
                          borderRadius: '6px',
                          border: 'none',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        ✅ Register
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddResident(false)}
                        style={{
                          flex: 1,
                          background: 'rgba(75, 85, 99, 0.3)',
                          color: '#9ca3af',
                          padding: '10px',
                          borderRadius: '6px',
                          border: 'none',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
                <p>Loading residents...</p>
              </div>
            ) : filteredResidents.length > 0 ? (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="table" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Apartment</th>
                      <th>Voice Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResidents.map((resident, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '600' }}>{resident.name}</td>
                        <td>{resident.email}</td>
                        <td>{resident.phone}</td>
                        <td>{resident.apartment_no}</td>
                        <td>
                          <span className={`badge ${resident.voice_registered ? 'badge-success' : 'badge-warning'}`}>
                            {resident.voice_registered ? '✅ Yes' : '❌ No'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteResident(resident.id)}
                            style={{
                              background: 'rgba(220, 38, 38, 0.2)',
                              color: '#fca5a5',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                <p style={{ fontSize: '36px', margin: '0 0 12px 0' }}>📭</p>
                <p style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>No residents found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}