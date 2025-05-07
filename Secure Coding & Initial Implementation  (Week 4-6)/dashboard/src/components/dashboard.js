import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardNavbar from './DNavbar';
import '../styles/Dashboard.css';

function Dashboard() {
  const [threats, setThreats] = useState([]);

  useEffect(() => {
    const fetchThreats = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/threats');
        setThreats(res.data.reverse()); // Show latest first
      } catch (err) {
        console.error("Error fetching threats:", err);
      }
    };

    fetchThreats();
    const interval = setInterval(fetchThreats, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-form">
        <header>
          <div className="logo">
            <h1>SAPI-G</h1>
            <span>Secure API Gateway</span>
          </div>
          <DashboardNavbar />
        </header>

        <div className="cyber-border"></div>

        <div className="dashboard">
          <div className="dashboard-title">
            <h2>API Security Dashboard</h2>
            <div className="status">
              <div className="status-indicator"></div>
              <span>System Operational</span>
            </div>
          </div>
        </div>

        <div className="grid-container">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Total API Requests</div>
              <i className="fas fa-exchange-alt" style={{ color: '#6c5ce7' }}></i>
            </div>
            <div className="card-value">24,892</div>
            <div className="card-change">
              <i className="fas fa-arrow-up"></i>
              <span>12% from yesterday</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Blocked Threats</div>
              <i className="fas fa-shield-alt" style={{ color: '#00f2c3' }}></i>
            </div>
            <div className="card-value">1,428</div>
            <div className="card-change">
              <i className="fas fa-arrow-down"></i>
              <span>5% from yesterday</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Avg. Response Time</div>
              <i className="fas fa-tachometer-alt" style={{ color: '#ff467e' }}></i>
            </div>
            <div className="card-value">142ms</div>
            <div className="card-change">
              <i className="fas fa-arrow-down"></i>
              <span>8% improvement</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Active Endpoints</div>
              <i className="fas fa-plug" style={{ color: '#f9ca24' }}></i>
            </div>
            <div className="card-value">37</div>
            <div className="card-change negative">
              <i className="fas fa-arrow-down"></i>
              <span>2 disabled</span>
            </div>
          </div>
        </div>

        <div className="monitor-threats-container">
          {/* Traffic Monitor */}
          <div className="large-card traffic-monitor">
            <div className="large-card-header">
              <div className="large-card-title">Traffic Monitor</div>
              <div className="time-filter">
                <button className="active">24h</button>
                <button>7d</button>
                <button>30d</button>
                <button>Custom</button>
              </div>
            </div>
            <div className="chart-container">
              <div className="chart-placeholder">
                <i className="fas fa-chart-line" style={{ fontSize: '2rem', marginRight: '10px' }}></i>
                Requests per hour visualization
              </div>
            </div>
            <div className="chart-legend">
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#6c5ce7', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '0.8rem' }}>Total Requests</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#ff467e', borderRadius: '2px' }}></div>
                  <span style={{ fontSize: '0.8rem' }}>Blocked</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Threats */}
          <div className="large-card recent-threats">
            <div className="large-card-header">
              <div className="large-card-title">Recent Threats</div>
              <button style={{ background: 'none', border: 'none', color: '#00f2c3', cursor: 'pointer' }}>
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Threat Type</th>
                    <th>Source IP</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {threats.map((t, idx) => (
                    <tr key={idx}>
                      <td>{new Date(t.detectedAt).toLocaleString()}</td>
                      <td>{t.threatType}</td>
                      <td>{t.ip}</td>
                      <td>
                        <span className={`status-badge ${t.threatType === 'BENIGN' ? 'allowed' : 'blocked'}`}>
                          {t.threatType === 'BENIGN' ? 'Allowed' : 'Blocked'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* IP Controls */}
        <div className="large-card">
          <div className="tabs">
            <div className="tab active">IP Blacklist</div>
            <div className="tab">Whitelist</div>
          </div>
          <div className="ip-controls">
            <input type="text" className="ip-input" placeholder="Enter IP address (e.g., 192.168.1.1)" />
            <button className="ip-btn">Add</button>
          </div>
          <div className="ip-list">
            <div className="ip-item">
              <span>192.168.1.45</span>
              <div className="ip-item-actions">
                <button className="ip-item-btn"><i className="fas fa-ban"></i></button>
                <button className="ip-item-btn"><i className="fas fa-trash"></i></button>
              </div>
            </div>
            <div className="ip-item">
              <span>45.227.253.109</span>
              <div className="ip-item-actions">
                <button className="ip-item-btn"><i className="fas fa-ban"></i></button>
                <button className="ip-item-btn"><i className="fas fa-trash"></i></button>
              </div>
            </div>
            <div className="ip-item">
              <span>78.129.203.4</span>
              <div className="ip-item-actions">
                <button className="ip-item-btn"><i className="fas fa-ban"></i></button>
                <button className="ip-item-btn"><i className="fas fa-trash"></i></button>
              </div>
            </div>
            <div className="ip-item">
              <span>223.71.167.29</span>
              <div className="ip-item-actions">
                <button className="ip-item-btn"><i className="fas fa-ban"></i></button>
                <button className="ip-item-btn"><i className="fas fa-trash"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

