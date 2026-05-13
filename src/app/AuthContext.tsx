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
  login: (token: string, userData?: UserInfo) => void;
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
      console.log(decoded,"decorde")
      if (decoded) {
        const userInfo = { name: decoded.name, email: decoded.email, ...decoded };
        // Restore hospital_name from sessionStorage if not in token
        const hospitalName = sessionStorage.getItem('hospital_name');
        if (hospitalName && !userInfo.hospital_name) {
          userInfo.hospital_name = hospitalName;
        }
        setUser(userInfo);
      }
      setIsAuthenticated(true);
    }
  }, []);

  const login = (token: string, userData?: UserInfo) => {
    localStorage.setItem('token', token);
    // If userData is provided from login API response, use it
    // Otherwise, decode from JWT token
    if (userData) {
      setUser(userData);
      // Store hospital_name in sessionStorage for persistence
      if (userData.hospital_name) {
        sessionStorage.setItem('hospital_name', userData.hospital_name);
      }
    } else {
      const decoded = parseJwt<JwtPayload>(token);
      if (decoded) {
        const userInfo = { name: decoded.name, email: decoded.email, ...decoded };
        setUser(userInfo);
        // Store hospital_name in sessionStorage for persistence
        if (userInfo.hospital_name) {
          sessionStorage.setItem('hospital_name', userInfo.hospital_name);
        }
      }
    }
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('hospital_name');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};