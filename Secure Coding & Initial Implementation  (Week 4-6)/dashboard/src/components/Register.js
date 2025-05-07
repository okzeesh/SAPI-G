import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Register.css';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const Register = ({ setIsLoggedIn }) => {
    const [registerData, setRegisterData] = useState({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
        const { firstName, lastName, username, email, password } = registerData;
        const res = await axios.post(`${API_URL}/api/register`, {
          firstName, lastName, username, email, password
        });
        if (res.data.success) {
            alert('Registration successful!');
            navigate('/login');
        } else {
            setError(res.data.message || 'Registration failed');
        }
    } catch (err) {
        setError(err.response?.data?.message || 'Registration error. Try again.');
      }
    };

    return (
        <div className="login-center-wrapper">
          <div className="login-container">
            <div className="cyber-border"></div>
            <form onSubmit={handleRegister}>
                <div className="login-header">
                    <h1 className="login-title">REGISTER</h1>
                    <p className="login-subtitle">Create new admin account</p>
                </div>
                <div className="name-group">
                    <div className="form-group">
                        <input
                            type="text"
                            className="form-input"
                            required
                            value={registerData.firstName}
                            onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                          />
                          <label className="input-label">First Name</label>
                          </div>
                          <div className="form-group">
                            <input
                                type="text"
                                className="form-input"
                                required
                                value={registerData.lastName}
                                onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                            />
                            <label className="input-label">Last Name</label>
                        </div>
                    </div>
                 <div className="form-group">
                    <input
                        type="text"
                        className="form-input"
                        required
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    />
                    <label className="input-label">Username</label>
                </div>
                <div className="form-group">
                    <input
                        type="email"
                        className="form-input"
                        required
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    />
                    <label className="input-label">Email</label>
                </div>
                <div className="form-group password-container">
                    <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        className="form-input"
                        required
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    />

