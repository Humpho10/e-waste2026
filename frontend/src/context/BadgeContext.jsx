import { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

const BadgeContext = createContext();

const fetchUnreadCounts = async (token) => {
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

  const notifCount = notifRes.ok ? (await notifRes.json()).unread_count ?? 0 : 0;
  const msgCount = msgRes.ok ? (await msgRes.json()).unread_count ?? 0 : 0;
  return { notifCount, msgCount };
};

export function BadgeProvider({ children }) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['unread-counts'],
    queryFn: () => fetchUnreadCounts(token),
    enabled: !!token,
    refetchInterval: token ? 15000 : false, // poll every 15 seconds
  });

  const notifCount = token ? (data?.notifCount ?? 0) : 0;
  const msgCount = token ? (data?.msgCount ?? 0) : 0;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['unread-counts'] });

  const setNotifCount = (value) => queryClient.setQueryData(['unread-counts'], (old) => ({
    notifCount: typeof value === 'function' ? value(old?.notifCount ?? 0) : value,
    msgCount: old?.msgCount ?? 0,
  }));

  const setMsgCount = (value) => queryClient.setQueryData(['unread-counts'], (old) => ({
    notifCount: old?.notifCount ?? 0,
    msgCount: typeof value === 'function' ? value(old?.msgCount ?? 0) : value,
  }));

  return (
    <BadgeContext.Provider value={{ notifCount, msgCount, refresh, setNotifCount, setMsgCount }}>
      {children}
    </BadgeContext.Provider>
  );
}

export const useBadge = () => useContext(BadgeContext);
