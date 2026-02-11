// client/src/api.ts
import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL?.trim() ||
  "http://localhost:5000"; // локально

export const api = axios.create({
  baseURL,
  withCredentials: false, // если у тебя JWT в header, куки не нужны
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // или как у тебя хранится
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
