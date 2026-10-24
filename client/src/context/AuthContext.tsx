'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';

export interface User {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'superadmin' | 'admin' | 'teacher' | 'student' | 'guardian' | 'employee';
  avatarUrl?: string;
  customPermissions?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = Cookies.get('grav_token');
    const savedUser = Cookies.get('grav_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        Cookies.remove('grav_token');
        Cookies.remove('grav_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    Cookies.set('grav_token', newToken, { expires: 7, secure: true, sameSite: 'strict' });
    Cookies.set('grav_user', JSON.stringify(newUser), { expires: 7, secure: true, sameSite: 'strict' });
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    Cookies.remove('grav_token');
    Cookies.remove('grav_user');
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
