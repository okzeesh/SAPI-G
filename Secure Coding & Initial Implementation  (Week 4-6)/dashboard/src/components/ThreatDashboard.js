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