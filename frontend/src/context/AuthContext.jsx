// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { getMe } from '../api/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(localStorage.getItem('token'));
  const [role, setRole]       = useState(localStorage.getItem('role'));
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      getMe()
        .then(res => {
          const u = res.data.user;
          const perms = res.data.permissions || [];
          setUser(u);
          setPermissions(perms);
          localStorage.setItem('permissions', JSON.stringify(perms));
          const r = u.roles?.[0]?.name ?? 'User';
          setRole(r);
          localStorage.setItem('role', r);
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('permissions');
          setToken(null);
          setRole(null);
          setPermissions([]);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = (userData, userToken, userRole, userPermissions) => {
    setUser(userData);
    setToken(userToken);
    setRole(userRole);
    setPermissions(userPermissions || []);
    localStorage.setItem('token', userToken);
    localStorage.setItem('role', userRole);
    localStorage.setItem('permissions', JSON.stringify(userPermissions || []));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRole(null);
    setPermissions([]);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('permissions');
  };

  // 🔥 REDIRECT LOGIC – NEW ROLES GO TO /app
  const redirectPath = () => {
    const userRole = role || user?.roles?.[0]?.name || 'User';
    switch (userRole) {
      case 'Super-Admin':     return '/admin';
      case 'Admin':           return '/manager';
      case 'Product-Manager': return '/workspace';
      case 'User':            return '/dashboard';
      default:                return '/app';   // ← New roles go here
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      role,
      permissions,
      login,
      logout,
      loading,
      redirectPath
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);