import React, { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area } from 'recharts';
import { API_URL } from '../config';

const ThreatDashboard = () => {
    const [threatData, setThreatData] = useState([]);
    const [threatStats, setThreatStats] = useState({
      totalThreats: 0,
      blockedThreats: 0,
      activeThreats: 0
    });
    const [threatTypes, setThreatTypes] = useState([]);
    const [recentThreats, setRecentThreats] = useState([]);
    const [timeRange, setTimeRange] = useState('hour');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    useEffect(() => {
        const fetchData = async () => {
          try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem("token");
            
            // Fetch all data in parallel
            const [trafficRes, requestsRes, blockedRes, threatsRes] = await Promise.all([
              axios.get(`${API_URL}/api/stats/traffic?range=${timeRange}`, {
                headers: { Authorization: `Bearer ${token}` }
              }),
              axios.get(`${API_URL}/api/stats/requests`, {
                headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get(`${API_URL}/api/stats/blocked`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get(`${API_URL}/api/threats`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          ]);

          // Update traffic data
          if (trafficRes.data && trafficRes.data.traffic) {
            setThreatData(trafficRes.data.traffic.map(item => ({
                label: item.label,
                total: item.total,
                detected: item.detected,
                blocked: item.blocked
              })));
            }
    
            // Update threat stats
            setThreatStats({
              totalThreats: requestsRes.data.totalRequests,
              blockedThreats: blockedRes.data.blockedThreats,
              activeThreats: requestsRes.data.totalRequests - blockedRes.data.blockedThreats
            });
    
            // Update threat types
            if (threatsRes.data) {
                const typeCounts = threatsRes.data.reduce((acc, threat) => {
                  acc[threat.threatType] = (acc[threat.threatType] || 0) + 1;
                  return acc;
                }, {});
      
                const types = Object.entries(typeCounts).map(([name, count]) => ({
                  name,
                  count,
                  icon: getThreatIcon(name)
                }));
      
                setThreatTypes(types);
            }
    
            // Update recent threats
            if (threatsRes.data) {
              const recent = threatsRes.data.slice(0, 10).map(threat => ({
                name: threat.threatType,
                ip: threat.ip,
                time: formatTimeAgo(new Date(threat.detectedAt)),
                status: threat.threatType === 'BENIGN' ? 'mitigated' : 'active',
                icon: getThreatIcon(threat.threatType)
            }));
            setRecentThreats(recent);
          }
  
          setLoading(false);
        } catch (err) {
          console.error("Error fetching dashboard data:", err);
          setError("Failed to load dashboard data");
          setLoading(false);
        }
      };

      fetchData();
      const interval = setInterval(fetchData, 10000);
      return () => clearInterval(interval);
    }, [timeRange]);
  
    // Helper function to get threat icon
    const getThreatIcon = (type) => {
      const typeIcons = {
        'SQL Injection': 'fas fa-database',
        'XSS Attack': 'fas fa-code',
        'Brute Force': 'fas fa-key',
        'DDoS': 'fas fa-network-wired',
        'Malware': 'fas fa-virus',
        'Phishing': 'fas fa-fish',
        'BENIGN': 'fas fa-shield-alt'
      };
      return typeIcons[type] || 'fas fa-shield-alt';
    };
  
    // Helper function to format time ago
    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
    
        if (days > 0) return `${days} days ago`;
        if (hours > 0) return `${hours} hours ago`;
        if (minutes > 0) return `${minutes} minutes ago`;
        return 'just now';
    };
  
    if (loading) {
      return <div className="loading">Loading dashboard data...</div>;
    }
  
    if (error) {
      return <div className="error">{error}</div>;
    }

  return (
    <div className="threat-dashboard">
      <div className="threat-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{threatStats.totalThreats}</div>
            <div className="stat-label">Total Threats</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-shield-alt"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{threatStats.blockedThreats}</div>
            <div className="stat-label">Blocked</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-bolt"></i>
          </div>
          <div className="stat-content">
            <div className="stat-value">{threatStats.activeThreats}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>
      </div>

      <div className="threat-chart">
        <div className="chart-header">
          <h4>Threat Activity</h4>
          <div className="time-filter">
            <button 
              className={timeRange === 'hour' ? 'active' : ''} 
              onClick={() => setTimeRange('hour')}
            >
              1h
            </button>
            <button 
              className={timeRange === 'day' ? 'active' : ''} 
              onClick={() => setTimeRange('day')}
            >
              24h
            </button>
            <button 
              className={timeRange === 'week' ? 'active' : ''} 
              onClick={() => setTimeRange('week')}
            >
              7d
            </button>
            <button 
              className={timeRange === 'month' ? 'active' : ''} 
              onClick={() => setTimeRange('month')}
            >
              30d
            </button>
          </div>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={threatData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff467e" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#ff467e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f2c3" stopOpacity={0.32}/>
                  <stop offset="95%" stopColor="#00f2c3" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#b2becd' }} minTickGap={15} />
              <YAxis tick={{ fontSize: 12, fill: '#b2becd' }} allowDecimals={false} width={40} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  background: '#181c2f', 
                  border: '1.5px solid #ff467e', 
                  borderRadius: 8, 
                  color: '#00f2c3', 
                  fontWeight: 600, 
                  fontSize: '1rem', 
                  boxShadow: '0 2px 12px #ff467e33' 
                }} 
                labelStyle={{ color: '#00f2c3' }} 
              />
              <Area type="monotone" dataKey="detected" stroke="#ff467e" fillOpacity={1} fill="url(#colorThreats)" name="Detected" />
              <Area type="monotone" dataKey="blocked" stroke="#00f2c3" fillOpacity={1} fill="url(#colorBlocked)" name="Blocked" />
              <Line type="monotone" dataKey="detected" stroke="#ff467e" strokeWidth={2.5} dot={false} isAnimationActive={false} name="Detected" />
              <Line type="monotone" dataKey="blocked" stroke="#00f2c3" strokeWidth={2.5} dot={false} isAnimationActive={false} name="Blocked" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <div className="chart-legend-color" style={{ background: '#ff467e' }}></div>
            <span className="chart-legend-label">Detected</span>
          </div>
          <div className="chart-legend-item">
            <div className="chart-legend-color" style={{ background: '#00f2c3' }}></div>
            <span className="chart-legend-label">Blocked</span>
          </div>
        </div>
      </div>

      <div className="threat-details">
        <div className="threat-types">
          <h4>Threat Types</h4>
          <div className="types-list">
            {threatTypes.map((type, index) => (
              <div key={index} className="type-item">
                <div className="type-icon">
                  <i className={type.icon}></i>
                </div>
                <div className="type-info">
                  <div className="type-name">{type.name}</div>
                  <div className="type-count">{type.count}</div>
                </div>
                <div className="type-bar">
                  <div 
                    className="type-progress" 
                    style={{ 
                      width: `${(type.count / threatStats.totalThreats) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="threat-details">
        <div className="threat-types">
          <h4>Threat Types</h4>
          <div className="types-list">
            {threatTypes.map((type, index) => (
              <div key={index} className="type-item">
                <div className="type-icon">
                  <i className={type.icon}></i>
                </div>
                <div className="type-info">
                  <div className="type-name">{type.name}</div>
                  <div className="type-count">{type.count}</div>
                </div>
                <div className="type-bar">
                  <div 
                    className="type-progress" 
                    style={{ 
                      width: `${(type.count / threatStats.totalThreats) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="recent-threats">
          <h4>Recent Threats</h4>
          <div className="threats-list">
            {recentThreats.map((threat, index) => (
              <div key={index} className="threat-item">
                <div className="threat-icon">
                  <i className={threat.icon}></i>
                </div>
                <div className="threat-info">
                  <div className="threat-name">{threat.name}</div>
                  <div className="threat-details">
                    <span className="threat-ip">{threat.ip}</span>
                    <span className="threat-time">{threat.time}</span>
                  </div>
                </div>
                <div className="threat-status">
                  <span className={`status-badge ${threat.status}`}>{threat.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreatDashboard; 