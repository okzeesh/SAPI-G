import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from axios;
import '../styles/Profile.css';

const Profile = () => {
    const [user, setUser] = useState(null);
  