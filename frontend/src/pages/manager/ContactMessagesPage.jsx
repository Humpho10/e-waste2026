import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BiMail, BiSend } from '../../components/bi';
import ManagerLayout from '../../layouts/ManagerLayout';
import { getContactMessages, getContactMessage, replyToContactMessage } from '../../api/contactMessages';
import { useToast } from '../../components/Toast';

const statusConfig = {
  new:     { label: 'New',     color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' },
  read:    { label: 'Read',    color: 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300' },
  replied: { label: 'Replied', color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' },
};

function StatusPill({ status }) {
  const cfg = statusConfig[status] || statusConfig.new;
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export default function ContactMessagesPage() {
  const [status, setStatus] = useState('all');
  const [activeId, setActiveId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['contact-messages', status],
    queryFn: () => getContactMessages(status !== 'all' ? { status } : {}).then(res => res.data),
  });

  const messages = data?.messages?.data ?? [];
  const counts   = data?.counts ?? { new: 0, read: 0, replied: 0 };

  const { data: activeData } = useQuery({
    queryKey: ['contact-message', activeId],
    queryFn: () => getContactMessage(activeId).then(res => res.data.message),
    enabled: !!activeId,
  });

  const active = activeData;

  // Opening a message marks it read server-side — refresh the list so the
  // New/Read counts and pill update immediately.
  useEffect(() => {
    if (activeId) queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => { setReplyText(''); }, [activeId]);

  const replyMutation = useMutation({
    mutationFn: (text) => replyToContactMessage(activeId, text),
    onSuccess: () => {
      toast('Reply sent', 'success');
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      queryClient.invalidateQueries({ queryKey: ['contact-message', activeId] });
    },
    onError: (err) => {
      toast(err.response?.data?.message || 'Failed to send reply', 'error');
    },
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeId) return;
    replyMutation.mutate(replyText);
  };

  const sending = replyMutation.isPending;

  const tabs = [
    { key: 'all',     label: 'All' },
    { key: 'new',     label: 'New',     count: counts.new },
    { key: 'read',    label: 'Read',    count: counts.read },
    { key: 'replied', label: 'Replied', count: counts.replied },
  ];

  return (
    <ManagerLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 dark:text-gray-100">
          <BiMail className="text-orange-500 dark:text-orange-400" size={22} /> Contact Messages
        </h2>
        <p className="text-gray-500 text-sm mt-1 dark:text-gray-400">Submissions from the public contact form</p>
      </div>

      <div className="flex flex-wrap gap-1 bg-gray-50 dark:bg-slate-800/60 p-1 rounded-xl mb-4 w-fit">
        {tabs.map(t => {
          const isActive = status === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition
                ${isActive ? 'bg-white text-orange-700 shadow-sm dark:bg-slate-900 dark:text-orange-400' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'}`}
            >
              {t.label}
              {typeof t.count === 'number' && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${isActive ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' : 'bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-gray-400'}`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex h-[600px]">
        {/* List */}
        <div className="w-80 border-r border-gray-100 dark:border-slate-800 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-gray-50 dark:border-slate-800">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Submissions</p>
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
            ) : messages.length === 0 ? (
              <div className="p-6 text-center">
                <BiMail size={32} className="mx-auto mb-2 text-gray-200" />
                <p className="text-sm text-gray-400 dark:text-gray-500">No messages yet</p>
              </div>
            ) : (
              messages.map(msg => (
                <button
                  key={msg.contact_message_id}
                  onClick={() => setActiveId(msg.contact_message_id)}
                  className={`w-full flex gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-800/60 transition border-b border-gray-50 dark:border-slate-800 ${activeId === msg.contact_message_id ? 'bg-orange-50 dark:bg-orange-950/40' : ''}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm shrink-0 dark:bg-orange-900/40">
                    {msg.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{msg.name}</p>
                      <StatusPill status={msg.status} />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{msg.topic}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{msg.message}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="flex-1 flex flex-col">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <BiMail size={48} className="mx-auto mb-4 text-gray-200" />
                <p className="font-bold text-gray-700 mb-1 dark:text-gray-200">Select a message</p>
                <p className="text-gray-400 text-sm dark:text-gray-500">Choose a submission from the left</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm dark:bg-orange-900/40">
                    {active.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{active.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{active.email} &middot; {active.topic}</p>
                  </div>
                </div>
                <StatusPill status={active.status} />
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="bg-gray-50 dark:bg-slate-800/60 rounded-2xl p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{active.message}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                    {new Date(active.created_at).toLocaleString()}
                  </p>
                </div>

                {active.status === 'replied' && (
                  <div className="bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-900/50 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">Your reply</p>
                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{active.reply_message}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                      Sent {new Date(active.replied_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {active.status !== 'replied' && (
                <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 flex gap-3">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    rows={2}
                    className="flex-1 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-slate-900 resize-none"
                  />
                  <button
                    type="submit" disabled={sending || !replyText.trim()}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2 self-end"
                  >
                    {sending ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <BiSend size={14} />
                    )}
                    Send Reply
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </ManagerLayout>
  );
}
