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
}