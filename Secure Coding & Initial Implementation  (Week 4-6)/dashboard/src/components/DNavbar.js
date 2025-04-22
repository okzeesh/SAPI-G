import React from 'react';
import { FaChartLine, FaCog, FaHistory, FaUser } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../styles/DNavbar.css';

const DashboardNavbar = () => {
  return (
    <div className="dashboard-navbar">
      <Link to="/dashboard" className="nav-item">
        <FaChartLine className="nav-icon" />
        <span>Dashboard</span>
      </Link>
      <Link to="/settings" className="nav-item">
        <FaCog className="nav-icon" />
        <span>Settings</span>
      </Link>
      <Link to="/logs" className="nav-item">
        <FaHistory className="nav-icon" />
        <span>Logs</span>
      </Link>
      <Link to="/admin" className="nav-item">
        <FaUser className="nav-icon" />
        <span>Admin</span>
      </Link>
    </div>
  );
};

export default DashboardNavbar;
