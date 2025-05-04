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
      <div className="logs-table-container" style={{overflowX: 'auto', background: 'rgba(30,41,59,0.92)', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', padding: '2rem 1.5rem'}}>
        <table className="logs-table" style={{width: '100%', color: '#fff', borderCollapse: 'collapse', fontSize: '1.05rem'}}>
          <thead>
            <tr style={{background: 'rgba(0,242,195,0.08)'}}>
              <th style={{color: '#00f2c3', position: 'sticky', top: 0, background: 'rgba(30,41,59,0.98)', zIndex: 2, padding: '0.7rem'}}>Timestamp</th>
              <th style={{color: '#00f2c3', position: 'sticky', top: 0, background: 'rgba(30,41,59,0.98)', zIndex: 2, padding: '0.7rem'}}>Method</th>
              <th style={{color: '#00f2c3', position: 'sticky', top: 0, background: 'rgba(30,41,59,0.98)', zIndex: 2, padding: '0.7rem'}}>Endpoint</th>
              <th style={{color: '#00f2c3', position: 'sticky', top: 0, background: 'rgba(30,41,59,0.98)', zIndex: 2, padding: '0.7rem'}}>Status</th>
              <th style={{color: '#00f2c3', position: 'sticky', top: 0, background: 'rgba(30,41,59,0.98)', zIndex: 2, padding: '0.7rem'}}>User</th>
            </tr>
          </thead>
          <tbody>
            {logsToShow.map((log, idx) => (
              <tr key={log._id || idx} style={{background: idx % 2 === 0 ? 'rgba(36, 44, 62, 0.95)' : 'rgba(30,41,59,0.85)', borderBottom: '1px solid #334155'}}>
                <td style={{padding: '0.6rem 0.5rem'}}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</td>
                <td style={{padding: '0.6rem 0.5rem'}}>{log.method}</td>
                <td style={{padding: '0.6rem 0.5rem'}}>{log.endpoint}</td>
                <td style={{padding: '0.6rem 0.5rem'}}>{log.status || log.statusCode}</td>
                <td style={{padding: '0.6rem 0.5rem'}}>{log.userEmail || log.user || '-'}</td>
              </tr>
            ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1.5rem', gap: '1.2rem'}}>
            <button onClick={() => setPage(page - 1)} disabled={page === 1} style={{padding: '0.5rem 1.2rem', borderRadius: '6px', border: 'none', background: '#6c5ce7', color: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1}}>Previous</button>
            <span style={{color: '#00f2c3', fontWeight: 600}}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage(page + 1)} disabled={page === totalPages} style={{padding: '0.5rem 1.2rem', borderRadius: '6px', border: 'none', background: '#6c5ce7', color: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1}}>Next</button>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
          <button
            onClick={exportAsPDF}
            style={{
              padding: '0.7rem 1.5rem',
              borderRadius: '8px',
              background: 'linear-gradient(90deg, #6c5ce7, #a29bfe)',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 8px rgba(108, 92, 231, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.05)";
              e.target.style.boxShadow = "0 6px 12px rgba(108, 92, 231, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "0 4px 8px rgba(108, 92, 231, 0.3)";
            }}
          >
            Export as PDF
          </button>
          <button
            onClick={exportAsXLSX}
            style={{
              padding: "0.7rem 1.5rem",
              borderRadius: "8px",
              background: "linear-gradient(90deg, #00f2c3, #81ecec)",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 8px rgba(0, 242, 195, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.05)";
              e.target.style.boxShadow = "0 6px 12px rgba(0, 242, 195, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
              e.target.style.boxShadow = "0 4px 8px rgba(0, 242, 195, 0.3)";
            }}
          >
            Export as XLSX
          </button>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            marginTop: "2.5rem",
            padding: "0.7rem 1.5rem",
            borderRadius: "8px",
            background: "linear-gradient(45deg, #6c5ce7, #00f2c3)",
            color: "#fff",
            border: "none",
            fontWeight: 500,
            fontSize: "1rem",
            boxShadow: "0 2px 8px rgba(0,242,195,0.10)",
            cursor: "pointer",
          }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>