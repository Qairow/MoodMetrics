import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";

export const api = axios.create({
  baseURL,                 // если VITE_API_URL нет -> работает через vite proxy "/api"
  withCredentials: false,  // если используешь ТОЛЬКО Bearer токен — оставь false
  headers: { "Content-Type": "application/json" },
});

// ✅ автоматом цепляет токен ко всем запросам
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ если токен умер — чистим и кидаем на логин
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // можно без редиректа, но так нагляднее:
      if (window.location.pathname.startsWith("/app")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
