import React, { useState, createContext, useContext } from 'react';
import { AUTH_URL } from '../../utils/constants';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [user, setUser] = useState(null);
  const [selectedDb, setSelectedDb] = useState(localStorage.getItem('selected_db') || 'core');

  const login = async (username, password) => {
    try {
      const response = await fetch(`${AUTH_URL}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        setToken(data.access);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('selected_db');
    setToken(null);
    setUser(null);
  };

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Selected-DB': selectedDb,
  });

  // Persist database selection
  React.useEffect(() => {
    if (selectedDb) {
      localStorage.setItem('selected_db', selectedDb);
    }
  }, [selectedDb]);

  return (
    <AuthContext.Provider value={{
      token,
      user,
      selectedDb,
      setSelectedDb,
      login,
      logout,
      getAuthHeaders,
      isAuthenticated: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
