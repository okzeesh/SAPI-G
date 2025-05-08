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