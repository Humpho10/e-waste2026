import { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from './AuthContext';


const BadgeContext = createContext();

// Both endpoints work for every role since they're in the auth:sanctum
// group. Messages already covers staff-to-staff conversations too (they're
// just messages with no product attached), so there's no separate count to
// add on top.
const fetchUnreadCounts = async () => {
  const [notifRes, msgRes] = await Promise.all([
    api.get('/notifications/unread-count'),
    api.get('/messages/unread-count'),
  ]);

  return {
    notifCount: notifRes.data?.unread_count ?? 0,
    msgCount: msgRes.data?.unread_count ?? 0,
  };
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
