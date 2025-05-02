import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from axios;
import '../styles/Profile.css';

const Profile = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            return;
          }
          axios.get('http://localhost:5001/api/user/profile', {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then(res => setUser(res.data))
          .catch(() => setUser(null));
      }, []);
      if (!user) {
        return (
          <div className="profile-page">