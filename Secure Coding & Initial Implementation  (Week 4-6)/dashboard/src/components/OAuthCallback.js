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
        if (token) {
            localStorage.setItem('token', token);
            if (setIsLoggedIn) {
                console.log("Calling setIsLoggedIn(true)");
                setIsLoggedIn(true);
        }
        console.log("Navigating to /dashboard");
            navigate('/dashboard', { replace: true });
        } else {
            console.log("No token found, navigating to /login");
            navigate('/login');
        }
    }, [location, setIsLoggedIn, navigate]);

    return <div>Logging you in with Google...</div>;
  }

export default OAuthCallback; 