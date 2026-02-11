import axios from "axios";

const base=import.meta.env.VITE_API_URL||"/api";

export const api=axios.create({
  baseURL:base,
  withCredentials:true,
});

api.interceptors.request.use(cfg=>{
  const t=localStorage.getItem("token");
  if(t)cfg.headers.Authorization=`Bearer ${t}`;
  return cfg;
});
