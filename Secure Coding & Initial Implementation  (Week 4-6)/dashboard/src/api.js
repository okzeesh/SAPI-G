import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001", // change if your backend uses another port
  withCredentials: true,
});

export default api;
