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