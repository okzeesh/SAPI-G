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
