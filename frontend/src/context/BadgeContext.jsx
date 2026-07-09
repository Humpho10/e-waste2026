import { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

const BadgeContext = createContext();

const fetchUnreadCounts = async (token) => {
  // All three endpoints work for every role since they're in the
  // auth:sanctum group — staff-messages simply returns 0 for anyone who
  // isn't part of a Super Admin <-> staff conversation (e.g. buyers/sellers).
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  };

  const [notifRes, msgRes, staffMsgRes] = await Promise.all([
    fetch('http://localhost:8000/api/notifications/unread-count', { headers: authHeaders }),
    fetch('http://localhost:8000/api/messages/unread-count', { headers: authHeaders }),
    fetch('http://localhost:8000/api/staff-messages/unread-count', { headers: authHeaders }),
  ]);

  const notifCount = notifRes.ok ? (await notifRes.json()).unread_count ?? 0 : 0;
  const listingMsgCount = msgRes.ok ? (await msgRes.json()).unread_count ?? 0 : 0;
  const staffMsgCount = staffMsgRes.ok ? (await staffMsgRes.json()).unread_count ?? 0 : 0;
  return { notifCount, msgCount: listingMsgCount + staffMsgCount };
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
