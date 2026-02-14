import { createContext, useContext, useState, useEffect, ReactNode } from "react";

import {api} from "../api";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "hr" | "manager" | "employee";
  department?: string;
  position?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    role: string,
    department?: string,
    position?: string
  ) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);



export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken) {
      setToken(savedToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
    }
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    if (!api) throw new Error("VITE_API_URL is missing (set it in Vercel and client/.env)");

    const response = await api.post("/auth/login", { email, password });
    const { token: newToken, user: newUser } = response.data as { token: string; user: User };

    setToken(newToken);
    setUser(newUser);

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));

    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: string,
    department?: string,
    position?: string
  ) => {
    if (!api) throw new Error("VITE_API_URL is missing (set it in Vercel and client/.env)");

    const response = await api.post("/auth/register", {
      email,
      password,
      name,
      role,
      department,
      position,
    });

    const { token: newToken, user: newUser } = response.data as { token: string; user: User };

    setToken(newToken);
    setUser(newUser);

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));

    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete api.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
