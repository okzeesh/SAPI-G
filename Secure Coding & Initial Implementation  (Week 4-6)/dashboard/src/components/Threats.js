import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import '../styles/Profile.css';
import '../styles/Responsive.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { API_URL, SOCKET_URL } from '../config';

const THREATS_PER_PAGE = 15;

const Threats = () => {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    // Initial fetch of threats
    const fetchThreats = () => {
      axios.get(`${API_URL}/api/threats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          setThreats(res.data);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to fetch threats');
          setLoading(false);
        });
    };

    fetchThreats();

    // Set up WebSocket connection
    const socket = io(SOCKET_URL, {
      auth: {
        token: token
      }
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('newThreat', (newThreat) => {
      setThreats(prevThreats => [newThreat, ...prevThreats]);
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const totalPages = Math.ceil(threats.length / THREATS_PER_PAGE);
  const startIdx = (page - 1) * THREATS_PER_PAGE;
  const endIdx = startIdx + THREATS_PER_PAGE;
  const threatsToShow = threats.slice(startIdx, endIdx);

  const getThreatColor = (threatType) => {
    switch(threatType) {
      case 'SQL Injection':
        return '#ff467e';
      case 'XSS Attack':
        return '#f9ca24';
      case 'Brute Force':
        return '#6c5ce7';
      case 'Port scan':
        return '#00f2c3';
      default:
        return '#fff';
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Threat Monitoring Report', 14, 15);
    
    const tableColumn = ['Detected At', 'Threat Type', 'IP Address', 'Status', 'Confidence'];
    const tableRows = threats.map(threat => [
      new Date(threat.detectedAt).toLocaleString(),
      threat.threatType,
      threat.ip,
      threat.status,
      `${(threat.confidence * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [108, 92, 231] }
    });

    doc.save('threats-report.pdf');
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      threats.map(threat => ({
        'Detected At': new Date(threat.detectedAt).toLocaleString(),
        'Threat Type': threat.threatType,
        'IP Address': threat.ip,
        'Status': threat.status,
        'Confidence': `${(threat.confidence * 100).toFixed(1)}%`
      }))
    );
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Threats');
    XLSX.writeFile(workbook, 'threats-report.xlsx');
  };

  if (loading) return <div className="profile-page"><h2>Threats</h2><p>Loading...</p></div>;
  if (error) return <div className="profile-page"><h2>Threats</h2><p>{error}</p></div>;

  return (
    <div className="profile-page" style={{maxWidth: '1100px'}}>
      <h2 style={{marginBottom: '2rem'}}>Threat Monitoring</h2>
      <div className="logs-table-container" style={{overflowX: 'auto', background: 'rgba(30,41,59,0.92)', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', padding: '2rem 1.5rem'}}>
        <table className="logs-table" style={{width: '100%', color: '#fff', borderCollapse: 'collapse', fontSize: '1.05rem'}}>
          <thead>
            <tr style={{background: 'rgba(0,242,195,0.08)'}}>
              <th style={{color: '#00f2c3', position: 'sticky', top: 0, background: 'rgba(30,41,59,0.98)', zIndex: 2, padding: '0.7rem'}}>Detected At</th>
              <th style={{color: '#00f2c3', position: 'sticky', top: 0, background: 'rgba(30,41,59,0.98)', zIndex: 2, padding: '0.7rem'}}>Threat Type</th>
              <th style={{color: '#00f2c3', position: 'sticky', top: 0, background: 'rgba(30,41,59,0.98)', zIndex: 2, padding: '0.7rem'}}>IP Address</th>
              <th style={{color: '#00f2c3', position: 'sticky', top: 0, background: 'rgba(30,41,59,0.98)', zIndex: 2, padding: '0.7rem'}}>Status</th>
              <th style={{color: '#00f2c3', position: 'sticky', top: 0, background: 'rgba(30,41,59,0.98)', zIndex: 2, padding: '0.7rem'}}>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {threatsToShow.map((threat, idx) => (
              <tr key={threat._id || idx} style={{background: idx % 2 === 0 ? 'rgba(36, 44, 62, 0.95)' : 'rgba(30,41,59,0.85)', borderBottom: '1px solid #334155'}}>
                <td style={{padding: '0.6rem 0.5rem'}}>{threat.detectedAt ? new Date(threat.detectedAt).toLocaleString() : ''}</td>
                <td style={{padding: '0.6rem 0.5rem', color: getThreatColor(threat.threatType)}}>{threat.threatType}</td>
                <td style={{padding: '0.6rem 0.5rem'}}>{threat.ip}</td>
                <td style={{padding: '0.6rem 0.5rem'}}>
                  <span className={`status-badge ${threat.status}`}>
                    {threat.status}
                  </span>
                </td>
                <td style={{padding: '0.6rem 0.5rem'}}>
                  <span className="status-badge" style={{
                    background: 'rgba(108,92,231,0.15)',
                    color: 'var(--primary-color)'
                  }}>
                    {(threat.confidence * 100).toFixed(1)}%
                  </span>
                </td>
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
            onClick={exportToPDF}
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
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 6px 12px rgba(108, 92, 231, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 8px rgba(108, 92, 231, 0.3)';
            }}
          >
            Export as PDF
          </button>
          <button
            onClick={exportToExcel}
            style={{
              padding: '0.7rem 1.5rem',
              borderRadius: '8px',
              background: 'linear-gradient(90deg, #00f2c3, #81ecec)',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 8px rgba(0, 242, 195, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 6px 12px rgba(0, 242, 195, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 8px rgba(0, 242, 195, 0.3)';
            }}
          >
            Export as XLSX
          </button>
        </div>
        <button onClick={() => navigate('/dashboard')} style={{marginTop: '2.5rem', padding: '0.7rem 1.5rem', borderRadius: '8px', background: 'linear-gradient(45deg, #6c5ce7, #00f2c3)', color: '#fff', border: 'none', fontWeight: 500, fontSize: '1rem', boxShadow: '0 2px 8px rgba(0,242,195,0.10)', cursor: 'pointer'}}>Back to Dashboard</button>
      </div>
    </div>
  );
};

export default Threats; 