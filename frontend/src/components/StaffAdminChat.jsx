import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Bi from './BsIcon';
import { useAuth } from '../context/AuthContext';
import { useBadge } from '../context/BadgeContext';
import { useToast } from './Toast';
import { getStaffContacts, getStaffConversations, getStaffThread, sendStaffMessage } from '../api/staffMessages';

const ACCENTS = {
  orange: { bubble: 'bg-orange-500', ring: 'focus:ring-orange-400', btn: 'bg-orange-500 hover:bg-orange-600', chip: 'bg-orange-100 text-orange-700', active: 'bg-orange-50 dark:bg-orange-950/30' },
  teal:   { bubble: 'bg-teal-600',   ring: 'focus:ring-teal-500',   btn: 'bg-teal-600 hover:bg-teal-700',   chip: 'bg-teal-100 text-teal-700',   active: 'bg-teal-50 dark:bg-teal-950/30' },
};

function initials(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?';
}

/**
 * Compact "message the Super Admin" panel for Admin and Product-Manager
 * dashboards. Uses the same staff-messages API as the Super Admin's own
 * Messages page, scoped automatically (by the backend) to Super Admins
 * only — this is purely a reply surface for messages the Super Admin
 * initiates, plus the ability to reach out proactively.
 */
export default function StaffAdminChat({ accent = 'orange' }) {
  const { user } = useAuth();
  const { refresh } = useBadge();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const colors = ACCENTS[accent] || ACCENTS.orange;

  const [activeId, setActiveId] = useState(null);
  const [newMsg, setNewMsg] = useState('');

  const { data: contactsData } = useQuery({
    queryKey: ['staff-contacts-superadmins'],
    queryFn: () => getStaffContacts().then(res => res.data),
  });
  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ['staff-conversations'],
    queryFn: () => getStaffConversations().then(res => res.data),
    refetchInterval: 20_000,
  });

  const superAdmins = contactsData?.contacts || [];
  const conversations = convData?.conversations || [];

  // Merge: every Super Admin should be selectable, even before a
  // conversation with them exists yet.
  const people = useMemo(() => {
    const byId = new Map();
    conversations.forEach(c => byId.set(c.user_id, { id: c.user_id, name: c.name, last_message: c.last_message, unread_count: c.unread_count }));
    superAdmins.forEach(s => { if (!byId.has(s.id)) byId.set(s.id, { id: s.id, name: s.name, last_message: null, unread_count: 0 }); });
    return Array.from(byId.values());
  }, [conversations, superAdmins]);

  useEffect(() => {
    if (!activeId && people.length > 0) setActiveId(people[0].id);
  }, [activeId, people]);

  const { data: threadData, isLoading: threadLoading } = useQuery({
    queryKey: ['staff-thread', activeId],
    queryFn: () => getStaffThread(activeId).then(res => res.data),
    enabled: !!activeId,
  });

  useEffect(() => { if (activeId) refresh(); }, [activeId, refresh]);

  const messages = threadData?.messages || [];

  const sendMutation = useMutation({
    mutationFn: (text) => sendStaffMessage({ recipient_id: activeId, message_text: text }),
    onSuccess: () => {
      setNewMsg('');
      queryClient.invalidateQueries({ queryKey: ['staff-thread', activeId] });
      queryClient.invalidateQueries({ queryKey: ['staff-conversations'] });
    },
    onError: (err) => toast(err.response?.data?.message || 'Failed to send message', 'error'),
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeId) return;
    sendMutation.mutate(newMsg);
  };

  if (!convLoading && people.length === 0) return null; // no Super Admin account exists yet

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex h-[380px] mb-6">
      {people.length > 1 && (
        <div className="w-56 border-r border-gray-100 dark:border-slate-800 overflow-y-auto shrink-0">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Super Admins</p>
          </div>
          {people.map(p => (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className={`w-full flex items-center gap-2.5 px-4 py-3 text-left border-b border-gray-50 dark:border-slate-800 transition ${activeId === p.id ? colors.active : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}
            >
              <div className={`w-8 h-8 rounded-lg ${colors.bubble} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                {initials(p.name)}
              </div>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate flex-1">{p.name}</span>
              {p.unread_count > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                  {p.unread_count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2.5">
          <Bi name="shield-fill" size={15} className="text-violet-500" />
          <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
            {people.length > 1 ? (people.find(p => p.id === activeId)?.name || 'Super Admin') : 'Message the Super Admin'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {threadLoading ? (
            <div className="space-y-2.5 animate-pulse">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className={`h-10 rounded-2xl bg-gray-100 dark:bg-slate-800 ${i % 2 ? 'ml-auto w-1/2' : 'w-1/2'}`} />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center">
              <p className="text-gray-400 dark:text-gray-500 text-sm">No messages yet</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div key={msg.staff_message_id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3.5 py-2.5 rounded-2xl text-sm ${isMe ? `${colors.bubble} text-white rounded-br-sm` : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-bl-sm'}`}>
                    <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.message_text}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>
                      {new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSend} className="px-3 py-2.5 border-t border-gray-100 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            placeholder="Type a message..."
            className={`flex-1 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 ${colors.ring}`}
          />
          <button
            type="submit"
            disabled={sendMutation.isPending || !newMsg.trim() || !activeId}
            className={`${colors.btn} text-white px-3.5 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50`}
          >
            {sendMutation.isPending ? '...' : <Bi name="send-fill" size={13} />}
          </button>
        </form>
      </div>
    </div>
  );
}
