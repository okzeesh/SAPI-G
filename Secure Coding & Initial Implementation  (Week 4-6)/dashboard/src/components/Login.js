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

        


  
