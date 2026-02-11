import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL?.trim() ||
  "http://localhost:5000/api"; // локально

export const api = axios.create({
  baseURL,            // ВАЖНО: тут уже есть /api
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
