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