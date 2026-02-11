import React from 'react'
import ReactDOM from 'react-dom/client'
import {createRoot} from "react-dom/client"

import App from './App.tsx'
import './index.css'
import './styles/theme.css';
import './styles/ui.css';
import './styles/global.css';

import { api } from './api.ts'

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

createRoot(document.getElementById("root")!).render(<App/>)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
