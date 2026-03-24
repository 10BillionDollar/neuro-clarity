import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuthToken, parseJwt, JwtPayload } from '@/lib/utils';

interface UserInfo {
  name?: string;
  email?: string;
  [key: string]: any;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserInfo | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      const decoded = parseJwt<JwtPayload>(token);
      if (decoded) {
        setUser({ name: decoded.name, email: decoded.email, ...decoded });
      }
      setIsAuthenticated(true);
    }
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    const decoded = parseJwt<JwtPayload>(token);
    if (decoded) {
      setUser({ name: decoded.name, email: decoded.email, ...decoded });
    }
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};