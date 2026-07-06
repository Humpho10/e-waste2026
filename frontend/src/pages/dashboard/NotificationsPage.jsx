import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell,
  FiCheckCircle,
  FiXCircle,
  FiMessageCircle,
  FiUserPlus,
  FiRefreshCw,
  FiPackage,
  FiAlertCircle,
  FiClock,
  FiCheck,
  FiTrash2,
  FiInbox,
  FiStar
} from 'react-icons/fi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getNotifications, markRead, markAllRead, deleteNotification } from '../../api/notifications';
import { useToast } from '../../components/Toast';

const typeConfig = {
  product_approved: { 
    icon: FiCheckCircle, 
    color: 'bg-emerald-50 border-emerald-200',
    textColor: 'text-emerald-700',
    bgGradient: 'from-emerald-50 to-emerald-100/30'
  },
  product_rejected: { 
    icon: FiXCircle, 
    color: 'bg-rose-50 border-rose-200',
    textColor: 'text-rose-700',
    bgGradient: 'from-rose-50 to-rose-100/30'
  },
  new_message: { 
    icon: FiMessageCircle, 
    color: 'bg-blue-50 border-blue-200',
    textColor: 'text-blue-700',
    bgGradient: 'from-blue-50 to-blue-100/30'
  },
  account_created: { 
    icon: FiUserPlus, 
    color: 'bg-purple-50 border-purple-200',
    textColor: 'text-purple-700',
    bgGradient: 'from-purple-50 to-purple-100/30'
  },
  listing_resubmitted: { 
    icon: FiRefreshCw, 
    color: 'bg-amber-50 border-amber-200',
    textColor: 'text-amber-700',
    bgGradient: 'from-amber-50 to-amber-100/30'
  },
  new_listing: { 
    icon: FiPackage, 
    color: 'bg-slate-50 border-slate-200',
    textColor: 'text-slate-700',
    bgGradient: 'from-slate-50 to-slate-100/30'
  },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);

  // 👇 Get toast function
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading: loading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications().then(res => res.data.notifications || []),
  });

  const invalidateNotifs = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });

  const markReadMutation = useMutation({
    mutationFn: markRead,
    onSuccess: invalidateNotifs,
    onError: (err) => toast(err.response?.data?.message || 'Failed to mark as read', 'error'),
  });

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      fetchNotifs();
  const markAllReadMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      invalidateNotifs();
      // 👇 Success toast
      toast('All notifications marked as read', 'info');
    },
    onError: (err) => toast(err.response?.data?.message || 'Failed to mark all as read', 'error'),
  });

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      fetchNotifs();
  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      invalidateNotifs();
      // 👇 Success toast
      toast('Notification removed', 'info');
    },
    onError: (err) => toast(err.response?.data?.message || 'Failed to delete notification', 'error'),
  });

  const handleMarkRead = (id) => markReadMutation.mutate(id);
  const handleMarkAllRead = () => markAllReadMutation.mutate();
  const handleDelete = (id) => deleteMutation.mutate(id);

  const unread = notifications.filter(n => !n.is_read).length;

  // Format time
  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header with gradient */}
        <motion.div 
          className="relative mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-gradient-to-br from-slate-50 via-white to-stone-50 rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <FiBell className="w-6 h-6" />
                  </div>
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg shadow-rose-200">
                      {unread}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    Notifications
                    {unread > 0 && (
                      <span className="text-sm font-normal bg-rose-50 text-rose-600 px-3 py-1 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
                        {unread} new
                      </span>
                    )}
                  </h2>
                  <p className="text-slate-500 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    {unread > 0 
                      ? `${unread} unread notification${unread !== 1 ? 's' : ''}`
                      : 'All caught up!'
                    }
                  </p>
                </div>
              </div>
              {unread > 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition shadow-blue-100 shadow-lg hover:shadow-xl"
                >
                  <FiCheck className="w-4 h-4" />
                  Mark all as read
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Notifications List */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3 animate-pulse"
            >
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : notifications.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center"
            >
              <FiBell className="w-14 h-14 text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-700 text-xl mb-2">No notifications yet</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                You'll be notified about your listings, messages and account activity
              </p>
              <div className="mt-6 inline-flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
                <FiInbox className="w-3 h-3" />
                All caught up
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Unread count banner */}
              {unread > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiBell className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-700 font-medium">
                      {unread} unread notification{unread !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-xs text-blue-600">
                    Newest first
                  </span>
                </div>
              )}

              {notifications.map((notif, index) => {
                const cfg = typeConfig[notif.type] || { 
                  icon: FiBell, 
                  color: 'bg-slate-50 border-slate-200',
                  textColor: 'text-slate-700',
                  bgGradient: 'from-slate-50 to-slate-100/30'
                };
                const Icon = cfg.icon;
                const isUnread = !notif.is_read;

                return (
                  <motion.div
                    key={notif.notification_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group relative rounded-2xl border p-5 flex gap-4 items-start transition-all duration-200 ${
                      isUnread 
                        ? `bg-gradient-to-r ${cfg.bgGradient} border-${cfg.color.split(' ')[1] || 'slate-200'} shadow-sm` 
                        : 'bg-white border-slate-100 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {isUnread && (
                      <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-500 rounded-r-full" />
                    )}

                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-2xl ${cfg.color} flex items-center justify-center text-xl shrink-0 shadow-sm`}>
                      <Icon className={`w-5 h-5 ${cfg.textColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-relaxed ${isUnread ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {formatTime(notif.created_at)}
                        </span>
                        {isUnread && (
                          <span className="text-[10px] font-medium bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isUnread && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleMarkRead(notif.notification_id)}
                          className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition"
                          title="Mark as read"
                        >
                          <FiCheck className="w-4 h-4" />
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(notif.notification_id)}
                        className="p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition"
                        title="Delete notification"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}

              {/* Footer stats */}
              <div className="mt-6 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-4">
                  <span>Total: {notifications.length}</span>
                  <span className="w-px h-3 bg-slate-200" />
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                    Unread: {unread}
                  </span>
                  <span className="w-px h-3 bg-slate-200" />
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                    Read: {notifications.length - unread}
                  </span>
                </div>
                <span>
                  {new Date().toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}