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