import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WorkspaceLayout from '../../layouts/WorkspaceLayout';
import { getConversations, getProductMessages, sendMessage } from '../../api/messages';
import { useAuth } from '../../context/AuthContext';
import { useBadge } from '../../context/BadgeContext';
import { useToast } from '../../components/Toast';

export default function WorkspaceMessagesPage() {
  const { user, permissions } = useAuth(); // 👈 Get permissions
  const [active, setActive]               = useState(null);
  const [newMsg, setNewMsg]               = useState('');

  const { refresh } = useBadge();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 👈 Check if user has permission to send messages
  const canSend = permissions?.includes('message-send') || false;

  const { data: conversations = [], isLoading: loading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations().then(res => res.data.conversations || []),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', active?.product_id],
    queryFn: () => getProductMessages(active.product_id).then(res => res.data.messages || []),
    enabled: !!active,
  });

  // Refresh the notification badge whenever a conversation is opened
  // (viewing a thread marks its messages as read server-side).
  useEffect(() => {
    if (active) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const openConversation = (conv) => setActive(conv);

  const sendMutation = useMutation({
    mutationFn: (text) => sendMessage({ product_id: active.product_id, message_text: text }),
    onSuccess: () => {
      toast('Message sent', 'success');
      setNewMsg('');
      queryClient.invalidateQueries({ queryKey: ['messages', active?.product_id] });
    },
    onError: (err) => toast(err.response?.data?.message || 'Failed to send message', 'error'),
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !active || !canSend) return; // 👈 Check permission here too
    sendMutation.mutate(newMsg);
  };

  const sending = sendMutation.isPending;

  return (
    <WorkspaceLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Messages</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Communications regarding listings in your categories</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex h-[600px]">
        {/* Conversations */}
        <div className="w-72 border-r border-gray-100 dark:border-slate-800 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
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
                <p className="text-3xl mb-2">💬</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv, i) => (
                <button
                  key={i}
                  onClick={() => openConversation(conv)}
                  className={`w-full flex gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-800 transition border-b border-gray-50 ${active?.product_id === conv.product_id ? 'bg-teal-50' : ''}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold text-sm shrink-0">
                    {conv.other_person?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{conv.other_person?.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{conv.product_title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{conv.last_message}</p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center shrink-0 mt-1">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <p className="text-5xl mb-4">💬</p>
                <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">Select a conversation</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Choose a conversation from the left</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold text-sm">
                  {active.other_person?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{active.other_person?.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Re: {active.product_title}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.message_id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm ${isMe ? 'bg-teal-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-bl-sm'}`}>
                        <p className="leading-relaxed">{msg.message_text}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-teal-200' : 'text-gray-400 dark:text-gray-500'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* 👇 Only show the send form if user has permission to send messages */}
              {canSend ? (
                <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 flex gap-3">
                  <input
                    type="text" value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="submit" disabled={sending || !newMsg.trim()}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                  >
                    {sending ? '...' : 'Send'}
                  </button>
                </form>
              ) : (
                <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 text-center text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-800/60">
                  You don't have permission to send messages.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </WorkspaceLayout>
  );
}