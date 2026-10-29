import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Doctor } from '../types';
import { api } from '../api';

interface AuthContextType {
  user: User | null;
  doctor: Doctor | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  quickLogin: (role: 'admin' | 'receptionist' | 'doctor') => Promise<void>;
  logout: () => void;
  refreshDoctorInfo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_CREDENTIALS = {
  admin: { email: 'admin@medicare.com', pass: 'admin123' },
  receptionist: { email: 'reception@medicare.com', pass: 'reception123' },
  doctor: { email: 'doctor@medicare.com', pass: 'doctor123' }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage session
    const savedUser = localStorage.getItem('medicare_user');
    const savedDoc = localStorage.getItem('medicare_doctor');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        if (savedDoc) setDoctor(JSON.parse(savedDoc));
      } catch (e) {
        console.error('Failed to parse saved session', e);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, pass);
      setUser(res.user);
      setDoctor(res.doctor || null);
      localStorage.setItem('medicare_user', JSON.stringify(res.user));
      if (res.doctor) {
        localStorage.setItem('medicare_doctor', JSON.stringify(res.doctor));
      } else {
        localStorage.removeItem('medicare_doctor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (role: 'admin' | 'receptionist' | 'doctor') => {
    const creds = DEMO_CREDENTIALS[role];
    await login(creds.email, creds.pass);
  };

  const logout = () => {
    setUser(null);
    setDoctor(null);
    localStorage.removeItem('medicare_user');
    localStorage.removeItem('medicare_doctor');
  };

  const refreshDoctorInfo = async () => {
    if (user?.doctorId) {
      try {
        const doctors = await api.getDoctors();
        const doc = doctors.find(d => d.id === user.doctorId);
        if (doc) {
          setDoctor(doc);
          localStorage.setItem('medicare_doctor', JSON.stringify(doc));
        }
      } catch (err) {
        console.error('Error refreshing doctor info', err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, doctor, isLoading, login, quickLogin, logout, refreshDoctorInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
