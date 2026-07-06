import { useEffect, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import AdminLayout from '../../layouts/AdminLayout';
import Bi from '../../components/BsIcon';
import { getAdminMessages, getAdminMessageThread } from '../../api/admin';

// Small debounce hook so the search box doesn't fire a request per keystroke.
function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function initials(name = '') {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function ConversationRow({ conv, active, onClick }) {
  const names = conv.participants?.map(p => p.name).join(' & ') || 'Unknown participants';
  return (
    <button
      onClick={onClick}
      className={`w-full flex gap-3 px-4 py-3 text-left border-b border-gray-50 dark:border-slate-800 transition ${
        active ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-gray-50 dark:hover:bg-slate-800'
      }`}
    >
      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
        {initials(conv.participants?.[0]?.name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{names}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5 flex items-center gap-1">
          <Bi name="box-seam" size={10} /> {conv.product_title}
        </p>
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
  );
}

export default function MessagesPage() {
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput);
  const [page, setPage] = useState(1);
  const [activeProductId, setActiveProductId] = useState(null);

  useEffect(() => { setPage(1); }, [search]);

  const { data, isLoading: loading, isFetching } = useQuery({
    queryKey: ['admin-messages', { search, page }],
    queryFn: () => getAdminMessages({ search: search || undefined, page, per_page: 15 }).then(res => res.data),
    placeholderData: keepPreviousData,
  });

  const conversations = data?.conversations || [];
  const meta = data?.meta || { current_page: 1, last_page: 1, total: 0 };
  const totalUnread = data?.total_unread ?? 0;

  const activeConv = conversations.find(c => c.product_id === activeProductId) || null;

  const { data: thread, isLoading: threadLoading } = useQuery({
    queryKey: ['admin-message-thread', activeProductId],
    queryFn: () => getAdminMessageThread(activeProductId).then(res => res.data),
    enabled: !!activeProductId,
  });

  const messages = thread?.messages || [];
  const sellerId = thread?.product?.seller_id;

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Bi name="chat-dots-fill" size={20} className="text-blue-600 dark:text-blue-400" />
            Messages
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Platform-wide conversation oversight — read-only visibility into every buyer ↔ seller thread
          </p>
        </div>
        {totalUnread > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-3 py-1.5 rounded-full">
            <Bi name="envelope-exclamation-fill" size={12} />
            {totalUnread} unread across the platform
          </span>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex h-[620px]">

        {/* Conversation list */}
        <div className="w-80 border-r border-gray-100 dark:border-slate-800 flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
            <div className="relative">
              <Bi name="search" size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search product, buyer, or seller..."
                className="w-full pl-8 pr-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3 animate-pulse">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 shrink-0" />
                    <div className="flex-1 space-y-1.5 pt-1">
                      <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-28" />
                      <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-36" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <Bi name="inboxes" size={28} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {search ? 'No conversations match your search' : 'No conversations on the platform yet'}
                </p>
              </div>
            ) : (
              conversations.map(conv => (
                <ConversationRow
                  key={conv.product_id}
                  conv={conv}
                  active={activeProductId === conv.product_id}
                  onClick={() => setActiveProductId(conv.product_id)}
                />
              ))
            )}
          </div>

          {!loading && meta.last_page > 1 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-slate-800 text-xs text-gray-500 dark:text-gray-400">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={meta.current_page <= 1}
                className="disabled:opacity-30 disabled:cursor-not-allowed hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                <Bi name="chevron-left" size={12} />
              </button>
              <span className="flex items-center gap-1">
                Page {meta.current_page}/{meta.last_page}
                {isFetching && <Bi name="arrow-repeat" size={11} className="animate-spin text-blue-500" />}
              </span>
              <button
                onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                disabled={meta.current_page >= meta.last_page}
                className="disabled:opacity-30 disabled:cursor-not-allowed hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                <Bi name="chevron-right" size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Thread */}
        <div className="flex-1 flex flex-col min-w-0">
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <Bi name="chat-square-text" size={40} className="mx-auto mb-4 text-gray-200 dark:text-slate-700" />
                <p className="font-bold text-gray-700 dark:text-gray-200 mb-1">Select a conversation</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Choose a thread from the list to review it</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                  {initials(activeConv.participants?.[0]?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">
                    {activeConv.participants?.map(p => p.name).join(' & ')}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">Re: {activeConv.product_title}</p>
                </div>
                <span className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-full shrink-0">
                  {activeConv.message_count} message{activeConv.message_count === 1 ? '' : 's'}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {threadLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className={`h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 ${i % 2 ? 'ml-auto w-1/2' : 'w-1/2'}`} />
                    ))}
                  </div>
                ) : (
                  messages.map(msg => {
                    const isSeller = sellerId && msg.sender_id === sellerId;
                    return (
                      <div key={msg.message_id} className={`flex flex-col ${isSeller ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 mb-1 px-1 flex items-center gap-1">
                          {msg.sender?.name || 'Unknown'}
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
                            isSeller
                              ? 'bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400'
                              : 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400'
                          }`}>
                            {isSeller ? 'Seller' : 'Buyer'}
                          </span>
                        </span>
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm ${
                          isSeller
                            ? 'bg-teal-600 text-white rounded-br-sm'
                            : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                        }`}>
                          <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.message_text}</p>
                          <p className={`text-xs mt-1 ${isSeller ? 'text-teal-100' : 'text-gray-400 dark:text-gray-500'}`}>
                            {new Date(msg.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            {!msg.is_read && <span className="ml-1.5">· unread</span>}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-slate-800/40">
                <Bi name="eye-fill" size={13} />
                Read-only oversight — Super Admins observe conversations but do not participate in them.
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
