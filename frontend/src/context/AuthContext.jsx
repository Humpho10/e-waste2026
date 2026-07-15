// src/context/AuthContext.jsx
import { createContext, useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(localStorage.getItem('token'));
  const [role, setRole]       = useState(localStorage.getItem('role'));
  // Hydrate permissions from the last session so route guards don't
  // momentarily see an empty list on hard refresh and bounce the user
  // to "/" before /auth/me has answered. getMe() still refreshes them.
  const [permissions, setPermissions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('permissions')) || []; }
    catch { return []; }
  });

  // Session check on boot / whenever token changes. Kept as a self-contained
  // fetch + inline state sync (mirroring the original's .then()/.catch()
  // shape) rather than a useEffect, so this stays a query the rest of the
  // app can invalidate (e.g. queryClient.invalidateQueries(['me'])) to force
  // a fresh permissions/role check without threading a refetch callback
  // through context.
  const { isPending } = useQuery({
    queryKey: ['me', token],
    enabled: !!token,
    retry: false,
    queryFn: () =>
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
          return u;
        })
        .catch(err => {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('permissions');
          setToken(null);
          setRole(null);
          setPermissions([]);
          throw err;
        }),
  });

  // Route guards must wait only when we truly know nothing yet: a token
  // exists but there are no cached permissions and /auth/me hasn't answered.
  // (isPending alone is unreliable as a gate — it's true forever for
  // disabled queries and can be observed before the fetch even starts.)
  const loading = !!token && isPending && permissions.length === 0;

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
