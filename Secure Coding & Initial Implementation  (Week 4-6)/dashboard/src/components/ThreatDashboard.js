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