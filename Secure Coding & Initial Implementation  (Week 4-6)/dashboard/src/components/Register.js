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