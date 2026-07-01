// src/components/app-content/MessagesContent.jsx
import { useEffect, useState } from 'react';
import { getConversations, getProductMessages, sendMessage } from '../../api/messages';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

export default function MessagesContent() {
  const { user, permissions } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [active, setActive]               = useState(null);
  const [messages, setMessages]           = useState([]);
  const [newMsg, setNewMsg]               = useState('');
  const [loading, setLoading]             = useState(true);
  const [sending, setSending]             = useState(false);

  const { toast } = useToast();
  const canSend = permissions?.includes('message-send') || false;

  useEffect(() => {
    getConversations()
      .then(res => setConversations(res.data.conversations || []))
      .finally(() => setLoading(false));
  }, []);

  const openConversation = async (conv) => {
    setActive(conv);
    const res = await getProductMessages(conv.product_id);
    setMessages(res.data.messages || []);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !active || !canSend) return;
    setSending(true);
    try {
      await sendMessage({ product_id: active.product_id, message_text: newMsg });
      toast('Message sent', 'success');
      setNewMsg('');
      const res = await getProductMessages(active.product_id);
      setMessages(res.data.messages || []);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to send message';
      toast(errorMsg, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="h-[600px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex">
      {/* Conversations list */}
      <div className="w-72 border-r border-gray-100 flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Conversations</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3 animate-pulse">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-24" />
                    <div className="h-3 bg-gray-100 rounded w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-sm text-gray-400">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv, i) => (
              <button
                key={i}
                onClick={() => openConversation(conv)}
                className={`w-full flex gap-3 px-4 py-3 text-left hover:bg-gray-50 transition border-b border-gray-50 ${active?.product_id === conv.product_id ? 'bg-blue-50' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                  {conv.other_person?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-semibold text-gray-800 text-sm truncate">{conv.other_person?.name}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{conv.product_title}</p>
                  <p className="text-xs text-gray-400 truncate">{conv.last_message}</p>
                </div>
                {conv.unread_count > 0 && (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shrink-0 mt-1">
                    {conv.unread_count}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message thread */}
      <div className="flex-1 flex flex-col">
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <p className="text-5xl mb-4">💬</p>
              <p className="font-bold text-gray-700 mb-1">Select a conversation</p>
              <p className="text-gray-400 text-sm">Choose a conversation from the left</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                {active.other_person?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{active.other_person?.name}</p>
                <p className="text-xs text-gray-400">Re: {active.product_title}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div key={msg.message_id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                      <p className="leading-relaxed">{msg.message_text}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {canSend ? (
              <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-100 flex gap-3">
                <input
                  type="text"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={sending || !newMsg.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                >
                  {sending ? '...' : 'Send'}
                </button>
              </form>
            ) : (
              <div className="px-4 py-3 border-t border-gray-100 text-center text-sm text-gray-400 bg-gray-50">
                You don't have permission to send messages.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}