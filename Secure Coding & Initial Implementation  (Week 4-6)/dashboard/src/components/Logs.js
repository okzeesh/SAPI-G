import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Profile.css";
import { API_URL } from "../config";

const LOGS_PER_PAGE = 15;

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const navigate = useNavigate();
  
    useEffect(() => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
    }

    const fetchLogs = () => {
        axios.get(`${API_URL}/api/logs`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            setLogs(res.data);
            setLoading(false);
        })
        .catch(() => {
            setError('Failed to fetch logs');
            setLoading(false);
        });
    };

    fetchLogs(); // Initial fetch
    const interval = setInterval(fetchLogs, 5000); // Fetch every 5 seconds
    return () => clearInterval(interval); // Cleanup on unmount
}, []);

const totalPages = Math.ceil(logs.length / LOGS_PER_PAGE);
const startIdx = (page - 1) * LOGS_PER_PAGE;
const endIdx = startIdx + LOGS_PER_PAGE;
const logsToShow = logs.slice(startIdx, endIdx);

const exportAsPDF = () => {
    // Logic for exporting logs as PDF
  };
  
  const exportAsXLSX = () => {
    // Logic for exporting logs as XLSX
  };

  if (loading) return <div className="profile-page"><h2>Logs</h2><p>Loading...</p></div>;
  if (error) return <div className="profile-page"><h2>Logs</h2><p>{error}</p></div>;

  return (
    <div className="profile-page" style={{maxWidth: '1100px'}}>
    <h2 style={{marginBottom: '2rem'}}>Request Logs</h2>
        <thead>
          <tr style={{background: 'rgba(0,242,195,0.08)'}}>
            <th style={{color: '#00f2c3', position: 'sticky', top: 0, background: 'rgba(30,41,59,0.98)', zIndex: 2, padding: '0.7rem'}}>Timestamp</th>
            <th style={{color: '#00f2c3', position: 'sticky', top: 0, background: 'rgba(30,41,59,0.98)', zIndex: 2, padding: '0.7rem'}}>Method</th>
            <th style={{color: '#00f2c3', position: 'sticky', top: 0, background: 'rgba(30,41,59,0.98)', zIndex: 2, padding: '0.7rem'}}>Endpoint</th>
            <th style={{color: '#00f2c3', position: 'sticky', top: 0, background: 'rgba(30,41,59,0.98)', zIndex: 2, padding: '0.7rem'}}>Status</th>