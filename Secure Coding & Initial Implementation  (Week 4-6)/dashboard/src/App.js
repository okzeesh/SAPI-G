// App.js
import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const App = () => {
    const location = useLocation();
    const hideNavbarRoutes = ['/'];
    const [isLoggedIn, setIsLoggedIn] = useState(false);
  
    useEffect(() => {
        localStorage.removeItem('token');
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token); // If token exists, user is logged in
      }, []);
    
