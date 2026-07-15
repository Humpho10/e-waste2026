import { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import api from '../api/axios';

const BadgeContext = createContext();

const fetchUnreadCounts = async () => {
  // All three endpoints work for every role since they're in the
  // auth:sanctum group — staff-messages simply returns 0 for anyone who
  // isn't part of a Super Admin <-> staff conversation (e.g. buyers/sellers).
  // The shared api client supplies the base URL and auth header.
  const count = (p) => api.get(p).then(r => r.data.unread_count ?? 0).catch(() => 0);

  const [notifCount, listingMsgCount, staffMsgCount] = await Promise.all([
    count('/notifications/unread-count'),
    count('/messages/unread-count'),
    count('/staff-messages/unread-count'),
  ]);

  return { notifCount, msgCount: listingMsgCount + staffMsgCount };
};

export function BadgeProvider({ children }) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['unread-counts'],
    queryFn: fetchUnreadCounts,
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
