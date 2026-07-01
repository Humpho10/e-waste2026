import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const BadgeContext = createContext();

export function BadgeProvider({ children }) {
  const { token } = useAuth();
  const [notifCount, setNotifCount] = useState(0);
  const [msgCount,   setMsgCount]   = useState(0);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      // Both endpoints work for every role since they're in auth:sanctum group
      const [notifRes, msgRes] = await Promise.all([
        fetch('http://localhost:8000/api/notifications/unread-count', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        }),
        fetch('http://localhost:8000/api/messages/unread-count', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        }),
      ]);

      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifCount(notifData.unread_count ?? 0);
      }
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMsgCount(msgData.unread_count ?? 0);
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    if (!token) { setNotifCount(0); setMsgCount(0); return; }
    refresh();
    const interval = setInterval(refresh, 15000); // poll every 15 seconds
    return () => clearInterval(interval);
  }, [token, refresh]);

  return (
    <BadgeContext.Provider value={{ notifCount, msgCount, refresh, setNotifCount, setMsgCount }}>
      {children}
    </BadgeContext.Provider>
  );
}

export const useBadge = () => useContext(BadgeContext);