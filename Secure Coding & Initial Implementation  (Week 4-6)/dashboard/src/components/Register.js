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
            <label className="input-label">Password</label>
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowRegisterPassword(!showRegisterPassword)}
            >
              👁
            </button>
          </div>
          <div className="form-group password-container">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              className="form-input"
              required
              value={registerData.confirmPassword}
              onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
            />
            <label className="input-label">Confirm Password</label>
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              👁
            </button>
          </div>
          {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
          <button type="submit" className="register-btn">Register</button>
          <a
            href={`${API_URL}/auth/google`}
            className="google-login-btn"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.5rem', textDecoration: 'none' }}
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              style={{ width: '20px', height: '20px', marginRight: '10px' }}
            />
            Register with Google
          </a>
          <div className="toggle-form-container">
            <button type="button" className="toggle-form-btn" onClick={() => navigate('/login')}>
              Back to login
            </button>
          </div>
          <div className="security-tag">All credentials are encrypted</div>
        </form>
      </div>
    </div>
  );
};

export default Register; 