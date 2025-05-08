import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import '../styles/Profile.css';
import '../styles/Responsive.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';