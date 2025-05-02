import React, { useState } from 'react';
import '../styles/Login.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = ({ setIsLoggedIn }) => {
  const [showLogin, setShowLogin] = useState(true);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const toggleForm = () => setShowLogin(!showLogin);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5001/api/login', loginData);
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setIsLoggedIn(true);
        navigate('/Dashboard');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5001/api/register', registerData);
      if (res.data.success) {
        alert('Registration successful!');
        setShowLogin(true);
      } else {
        setError('Registration failed');
      }
    } catch (err) {
      setError('Registration error. Try again.');
    }
  };,

  return (
    <div className="login-container">
     <div className="cyber-border"></div>

     {showLogin ? (
       <form onSubmit={handleLogin}>
       <div className="login-header">
          <h1 className="login-title">SAPI-G</h1>
          <p className="login-subtitle">Admin Login</p>
       </div>

       <div className="form-group">
            <input
              type="email"
              className="form-input"
              required
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
            />
            <label className="input-label">Email</label>
          </div>

          <div className="form-group password-container">
            <input
               type={showLoginPassword ? 'text' : 'password'}
              className="form-input"
              required
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            />
            <label className="input-label">Password</label>
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowLoginPassword(!showLoginPassword)}
            >
            👁
            </button>
          </div>

          {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

          <button type="submit" className="login-btn">Login</button>

          <div className="toggle-form-container">
            <button type="button" className="toggle-form-btn" onClick={toggleForm}>
              Create new admin account
            </button>
          </div>

          <div className="security-tag">AI-Powered Threat Detection Active</div>
        </form>
      ) : (
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
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
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
              onChange={(e) =>
              setRegisterData({ ...registerData, confirmPassword: e.target.value })
              }
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

          

      
          
      

        


  
