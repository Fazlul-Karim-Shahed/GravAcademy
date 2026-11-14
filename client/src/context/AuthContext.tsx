'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';

export interface User {
  id: string;
  gravId?: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'superadmin' | 'admin' | 'teacher' | 'student' | 'guardian' | 'employee';
  avatarUrl?: string;
  bio?: string;
  teacherDetails?: {
    institution?: string;
    department?: string;
    experience?: string;
    specialistSubjects?: string[];
    badge?: string;
    cvUrl?: string;
    classesCount?: string;
    studentsCount?: string;
  };
  studentDetails?: {
    schoolOrCollege?: string;
    gradeLevel?: string;
    group?: string;
    guardianName?: string;
    guardianPhone?: string;
  };
  customPermissions?: string[];
  effectivePermissions?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updatedFields: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
    const savedToken = Cookies.get('grav_token') || (typeof window !== 'undefined' ? localStorage.getItem('grav_token') : null);
    const savedUser = Cookies.get('grav_user') || (typeof window !== 'undefined' ? localStorage.getItem('grav_user') : null);

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        const parsedUser = JSON.parse(savedUser) as User;
        setUser(parsedUser);
        // Ensure both cookies and localStorage are synced
        Cookies.set('grav_token', savedToken, { expires: 7, sameSite: 'lax' });
        Cookies.set('grav_user', savedUser, { expires: 7, sameSite: 'lax' });

        // Login responses intentionally stay small, so refresh the profile here.
        // This keeps role-specific fields (for example studentDetails) current
        // after a refresh and lets forms safely prefill registered users.
        try {
          const meResponse = await api.get('/auth/me');
          const freshUser = meResponse.data?.data?.user as User | undefined;
          if (freshUser) {
            setUser(freshUser);
            const serializedUser = JSON.stringify(freshUser);
            Cookies.set('grav_user', serializedUser, { expires: 7, sameSite: 'lax' });
            localStorage.setItem('grav_user', serializedUser);
          }
        } catch {
          // Keep the cached user if a temporary profile refresh fails.
        }
      } catch (e) {
        Cookies.remove('grav_token');
        Cookies.remove('grav_user');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('grav_token');
          localStorage.removeItem('grav_user');
        }
      }
    }
    setLoading(false);
    };

    void restoreSession();
  }, []);

  const login = (newToken: string, newUser: User) => {
    Cookies.set('grav_token', newToken, { expires: 7, sameSite: 'lax' });
    Cookies.set('grav_user', JSON.stringify(newUser), { expires: 7, sameSite: 'lax' });
    if (typeof window !== 'undefined') {
      localStorage.setItem('grav_token', newToken);
      localStorage.setItem('grav_user', JSON.stringify(newUser));
    }
    setToken(newToken);
    setUser(newUser);

    // Fetch the complete profile after login as well. The login payload is
    // intentionally compact and may not include student-specific fields.
    void api.get('/auth/me').then((response) => {
      const freshUser = response.data?.data?.user as User | undefined;
      if (!freshUser) return;
      setUser(freshUser);
      const serializedUser = JSON.stringify(freshUser);
      Cookies.set('grav_user', serializedUser, { expires: 7, sameSite: 'lax' });
      if (typeof window !== 'undefined') localStorage.setItem('grav_user', serializedUser);
    }).catch(() => {
      // The compact login user remains usable if profile refresh is unavailable.
    });
  };

  const logout = () => {
    Cookies.remove('grav_token');
    Cookies.remove('grav_user');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('grav_token');
      localStorage.removeItem('grav_user');
    }
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updatedFields };
      Cookies.set('grav_user', JSON.stringify(merged), { expires: 7, sameSite: 'lax' });
      if (typeof window !== 'undefined') {
        localStorage.setItem('grav_user', JSON.stringify(merged));
      }
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
