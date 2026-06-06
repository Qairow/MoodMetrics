import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Android эмулятор (AVD) → 10.0.2.2 это localhost хоста
// iOS симулятор → localhost
// Expo Go на реальном телефоне → замени на IP компьютера в Wi-Fi
// Например: http://192.168.1.100:5000/api
const LOCAL_IP = '10.0.2.2'; // для AVD; замени на свой IP для Expo Go

const BASE =
  Platform.OS === 'android'
    ? `http://${LOCAL_IP}:5000/api`
    : 'http://localhost:5000/api';

export const API_BASE_URL = BASE;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err?.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user']);
    }
    return Promise.reject(err);
  }
);
