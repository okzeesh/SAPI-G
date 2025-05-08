import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function OAuthCallback({ setIsLoggedIn }) {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        console.log("OAuthCallback mounted");
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        console.log("Token from URL:", token);