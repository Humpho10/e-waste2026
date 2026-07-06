import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMessageCircle,
  FiSend,
  FiUser,
  FiPackage,
  FiClock,
  FiChevronLeft,
  FiSearch,
  FiCheck,
  FiCheckCircle,
  FiAlertCircle,
  FiMoreVertical,
  FiPhone,
  FiMail,
  FiMapPin
} from 'react-icons/fi';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getConversations, getProductMessages, sendMessage } from '../../api/messages';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

export default function MessagesPage() {
  const { user, permissions } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [active, setActive]               = useState(null);
  const [messages, setMessages]           = useState([]);
  const [newMsg, setNewMsg]               = useState('');
  const [loading, setLoading]             = useState(true);
  const [sending, setSending]             = useState(false);
  const [searchTerm, setSearchTerm]       = useState('');
  const messagesEndRef = useRef(null);
  const [isMobileView, setIsMobileView]   = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const { toast } = useToast();

  const canSend = permissions?.includes('message-send') || false;

  useEffect(() => {
    getConversations()
      .then(res => setConversations(res.data.conversations || []))
      .finally(() => setLoading(false));
  }, []);

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv =>
    conv.other_person?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.product_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openConversation = async (conv) => {
    setActive(conv);
    if (isMobileView) setShowMobileChat(true);
    const res = await getProductMessages(conv.product_id);
    setMessages(res.data.messages || []);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !active || !canSend) return; // 👈 Check permission here too
    setSending(true);
    try {
      await sendMessage({
        product_id:   active.product_id,
        message_text: newMsg,
      });
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

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Format time
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for message grouping
  const formatDate = (date) => {
    const msgDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (msgDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (msgDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return msgDate.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header with gradient */}
        <motion.div 
          className="relative mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-gradient-to-br from-slate-50 via-white to-stone-50 rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <FiMessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Messages</h2>
                  <p className="text-slate-500 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    {conversations.length} conversations
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-200">
                  {messages.length} messages
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Messages Container */}
        <motion.div 
          className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex h-[600px]">
            {/* Conversations List - Hidden on mobile when chat is open */}
            <div className={`${
              isMobileView && showMobileChat ? 'hidden' : 'flex'
            } w-full md:w-80 lg:w-96 border-r border-slate-200 flex-col shrink-0`}>
              {/* Search */}
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition"
                  />
                </div>
              </div>

              {/* Conversations list */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-3 animate-pulse">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="flex gap-3 p-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-100 rounded w-24" />
                          <div className="h-3 bg-slate-100 rounded w-32" />
                          <div className="h-3 bg-slate-100 rounded w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                      <FiMessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="font-semibold text-slate-700 text-sm">No conversations</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {searchTerm ? 'Try a different search' : 'Start messaging sellers today'}
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredConversations.map((conv, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => openConversation(conv)}
                      className={`w-full flex gap-3 p-4 text-left hover:bg-slate-50 transition-all duration-200 border-b border-slate-100 ${
                        active?.hash_id === conv.hash_id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 flex items-center justify-center font-bold text-base shadow-sm">
                          {conv.other_person?.name?.charAt(0).toUpperCase()}
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold shadow-sm">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-800 text-sm truncate">
                            {conv.other_person?.name}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                            {conv.last_message_time ? formatTime(conv.last_message_time) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {conv.product_title}
                        </p>
                        <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
                          <FiMessageCircle className="w-3 h-3" />
                          {conv.last_message || 'No messages yet'}
                        </p>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </div>

            {/* Message thread */}
            <div className={`${
              isMobileView && !showMobileChat ? 'hidden' : 'flex'
            } flex-1 flex-col`}>
              {!active ? (
                <div className="flex-1 flex items-center justify-center text-center p-8 bg-gradient-to-br from-slate-50/50 to-white">
                  <div>
                    <FiMessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="font-bold text-slate-700 text-lg mb-1">Select a conversation</p>
                    <p className="text-slate-400 text-sm max-w-sm">
                      Choose a conversation from the left to view messages and start chatting
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      {conversations.length} conversations available
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Thread header */}
                  <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3 bg-white sticky top-0 z-10">
                    {isMobileView && (
                      <button
                        onClick={() => setShowMobileChat(false)}
                        className="p-2 hover:bg-slate-100 rounded-xl transition"
                      >
                        <FiChevronLeft className="w-5 h-5 text-slate-600" />
                      </button>
                    )}
                    <div className="relative">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
                        {active.other_person?.name?.charAt(0).toUpperCase()}
                      </div>
                      {active.other_person?.is_online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">
                        {active.other_person?.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                        <FiPackage className="w-3 h-3" />
                        {active.product_title}
                      </p>
                    </div>
                    <button className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-600">
                      <FiMoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50/30 to-white">
                    {messages.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <FiSend className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm text-slate-500">No messages yet</p>
                          <p className="text-xs text-slate-400">Start the conversation!</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Date separator */}
                        {messages.length > 0 && (
                          <div className="flex justify-center">
                            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                              {formatDate(messages[0]?.created_at)}
                            </span>
                          </div>
                        )}
                        
                        {messages.map((msg, index) => {
                          const isMe = msg.sender_id === user?.id;
                          const showDate = index > 0 && 
                            new Date(msg.created_at).toDateString() !== 
                            new Date(messages[index - 1]?.created_at).toDateString();
                          
                          return (
                            <motion.div
                              key={msg.message_id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.02 }}
                            >
                              {showDate && (
                                <div className="flex justify-center my-4">
                                  <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                    {formatDate(msg.created_at)}
                                  </span>
                                </div>
                              )}
                              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                                  isMe
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-sm shadow-blue-100 shadow-sm'
                                    : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                                }`}>
                                  <p className="leading-relaxed break-words">{msg.message_text}</p>
                                  <div className={`flex items-center gap-1 mt-1 ${
                                    isMe ? 'text-blue-200' : 'text-slate-400'
                                  }`}>
                                    <span className="text-[10px]">{formatTime(msg.created_at)}</span>
                                    {isMe && (
                                      <FiCheck className="w-3 h-3" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </div>

                  {/* Send message */}
                  {canSend ? (
                    <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMsg}
                          onChange={e => setNewMsg(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 hover:bg-white transition"
                        />
                        <motion.button
                          type="submit"
                          disabled={sending || !newMsg.trim()}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50 shadow-blue-100 shadow-lg hover:shadow-xl flex items-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {sending ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <FiSend className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">Send</span>
                        </motion.button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-4 border-t border-slate-200 text-center bg-slate-50">
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                        <FiAlertCircle className="w-4 h-4" />
                        You don't have permission to send messages.
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Mobile conversation indicator */}
        {isMobileView && !showMobileChat && conversations.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-slate-400">
              Select a conversation to start chatting
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}