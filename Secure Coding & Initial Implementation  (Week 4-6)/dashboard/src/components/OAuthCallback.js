import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function OAuthCallback({ setIsLoggedIn }) {
    const navigate = useNavigate();
    const location = useLocation();