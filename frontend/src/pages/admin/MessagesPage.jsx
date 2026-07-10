import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import Bi from '../../components/BsIcon';
import { useAuth } from '../../context/AuthContext';
import { useBadge } from '../../context/BadgeContext';
import { useToast } from '../../components/Toast';
import {
  getStaffContacts,
  getStaffConversations,
  getStaffThread,
  sendStaffMessage,
} from '../../api/staffMessages';

const ROLE_FILTERS = [
  { key: 'all',              label: 'All staff' },
  { key: 'Admin',            label: 'Admins' },
  { key: 'Product-Manager',  label: 'Product Managers' },
];

const ROLE_STYLE = {
  'Admin':           'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400',
  'Product-Manager': 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400',
};

function initials(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?';
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { refresh } = useBadge();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeUserId, setActiveUserId] = useState(null);
  const [activeContact, setActiveContact] = useState(null); // snapshot of who we're chatting with
  const [newMsg, setNewMsg] = useState('');
  const [showDirectory, setShowDirectory] = useState(false);

  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ['staff-conversations'],
    queryFn: () => getStaffConversations().then(res => res.data),
    refetchInterval: 20_000,
  });

  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['staff-contacts', search, roleFilter],
    queryFn: () => getStaffContacts({
      search: search || undefined,
      role: roleFilter === 'all' ? undefined : roleFilter,
    }).then(res => res.data),
    enabled: showDirectory,
  });

  const conversations = convData?.conversations || [];
  const contacts = contactsData?.contacts || [];

  const { data: threadData, isLoading: threadLoading } = useQuery({
    queryKey: ['staff-thread', activeUserId],
    queryFn: () => getStaffThread(activeUserId).then(res => res.data),
    enabled: !!activeUserId,
  });

  useEffect(() => { if (activeUserId) refresh(); }, [activeUserId, refresh]);

  const messages = threadData?.messages || [];
  const other = threadData?.other || activeContact;

  const openConversation = (userId, contactSnapshot) => {
    setActiveUserId(userId);
    setActiveContact(contactSnapshot || null);
    setShowDirectory(false);
  };

  const sendMutation = useMutation({
    mutationFn: (text) => sendStaffMessage({ recipient_id: activeUserId, message_text: text }),
    onSuccess: () => {
      setNewMsg('');
      queryClient.invalidateQueries({ queryKey: ['staff-thread', activeUserId] });
      queryClient.invalidateQueries({ queryKey: ['staff-conversations'] });
    },
    onError: (err) => toast(err.response?.data?.message || 'Failed to send message', 'error'),
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeUserId) return;
    sendMutation.mutate(newMsg);
  };

  const sending = sendMutation.isPending;

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Bi name="chat-dots-fill" size={20} className="text-blue-600 dark:text-blue-400" />
            Messages
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Message your Admins and Product Managers directly — Super Admins don't message buyers or sellers.
          </p>
        </div>
        <button
          onClick={() => setShowDirectory(d => !d)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition"
        >
          <Bi name={showDirectory ? 'x-lg' : 'plus-lg'} size={14} />
          {showDirectory ? 'Close directory' : 'New message'}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex h-[620px]">

        {/* Left panel */}
        <div className="w-80 border-r border-gray-100 dark:border-slate-800 flex flex-col shrink-0">

          {showDirectory ? (
            <>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 space-y-2.5">
                <div className="relative">
                  <Bi name="search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search staff by name or email..."
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="w-full border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ROLE_FILTERS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </div>
              <div className="flex-1 overflow-y-auto">
                {contactsLoading ? (
                  <div className="p-4 space-y-3 animate-pulse">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 shrink-0" />
                        <div className="flex-1 space-y-1.5 pt-1">
                          <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-28" />
                          <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bi name="people" size={28} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">No staff match your search</p>
                  </div>
                ) : (
                  contacts.map(c => (
                    <button
                      key={c.id}
                      onClick={() => openConversation(c.id, c)}
                      className="w-full flex gap-3 px-4 py-3 text-left border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {initials(c.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{c.email}</p>
                      </div>
                      <span className={`self-center shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${ROLE_STYLE[c.role] || 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300'}`}>
                        {c.role}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Conversations</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {convLoading ? (
                  <div className="p-4 space-y-3 animate-pulse">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 shrink-0" />
                        <div className="flex-1 space-y-1.5 pt-1">
                          <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-24" />
                          <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bi name="inboxes" size={28} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">No conversations yet</p>
                    <button
                      onClick={() => setShowDirectory(true)}
                      className="text-blue-600 dark:text-blue-400 text-xs font-medium hover:underline"
                    >
                      Message an Admin or Product Manager
                    </button>
                  </div>
                ) : (
                  conversations.map(conv => (
                    <button
                      key={conv.user_id}
                      onClick={() => openConversation(conv.user_id, conv)}
                      className={`w-full flex gap-3 px-4 py-3 text-left border-b border-gray-50 dark:border-slate-800 transition ${
                        activeUserId === conv.user_id ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {initials(conv.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{conv.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{conv.last_message}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                          {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                        </span>
                        {conv.unread_count > 0 && (
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                            {conv.unread_count > 9 ? '9+' : conv.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col min-w-0">
          {!activeUserId ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <Bi name="chat-square-text" size={40} className="mx-auto mb-4 text-gray-200 dark:text-slate-700" />
                <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">Select a conversation</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Or start a new message with an Admin or Product Manager</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                  {initials(other?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">{other?.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{other?.email}</p>
                </div>
                {other?.role && (
                  <span className={`text-[11px] px-2 py-1 rounded-full font-semibold shrink-0 ${ROLE_STYLE[other.role] || 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300'}`}>
                    {other.role}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {threadLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className={`h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 ${i % 2 ? 'ml-auto w-1/2' : 'w-1/2'}`} />
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <p className="text-gray-400 dark:text-gray-500 text-sm">No messages yet — say hello 👋</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div key={msg.staff_message_id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                        }`}>
                          <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.message_text}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400 dark:text-gray-500'}`}>
                            {new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 flex gap-3">
                <input
                  type="text"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  placeholder={`Message ${other?.name?.split(' ')[0] || 'staff member'}...`}
                  className="flex-1 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={sending || !newMsg.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2"
                >
                  {sending ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Bi name="send-fill" size={13} />
                  )}
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
