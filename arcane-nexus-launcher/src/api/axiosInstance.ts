import axios from "axios";

const axiosInstance = axios.create({
  // Adjust this to point to your backend server.
  // For an Electron + local server setup, it might be something like:
  baseURL: "http://localhost:3000/api/games",
  // or if you have a proxy set up in your React/Electron config:
  // baseURL: '/api/games',
});

export default axiosInstance;
