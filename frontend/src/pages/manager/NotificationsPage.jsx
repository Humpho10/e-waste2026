import ManagerLayout from '../../layouts/ManagerLayout';
import { getNotifications, markRead, markAllRead, deleteNotification } from '../../api/notifications';
import { useBadge } from '../../context/BadgeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// 👇 Import toast hook
import { useToast } from '../../components/Toast'; // or '../../context/ToastContext' if that's where it lives

const typeConfig = {
  product_approved:    { icon: '✅', color: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800/50'   },
  product_rejected:    { icon: '❌', color: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50'       },
  new_message:         { icon: '💬', color: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50'     },
  account_created:     { icon: '🎉', color: 'bg-purple-50 border-purple-200' },
  new_listing:         { icon: '📦', color: 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700'     },
};

export default function AdminNotificationsPage() {
  const { refresh } = useBadge();
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
    onSuccess: () => { invalidateNotifs(); refresh(); },
    onError: (err) => toast(err.response?.data?.message || 'Failed to mark as read', 'error'),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      invalidateNotifs();
      refresh();
      // 👇 Success toast
      toast('All notifications marked as read', 'info');
    },
    onError: (err) => toast(err.response?.data?.message || 'Failed to mark all as read', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      invalidateNotifs();
      refresh();
      // 👇 Success toast
      toast('Notification removed', 'info');
    },
    onError: (err) => toast(err.response?.data?.message || 'Failed to delete notification', 'error'),
  });

  const handleMarkRead = (id) => markReadMutation.mutate(id);
  const handleMarkAllRead = () => markAllReadMutation.mutate();
  const handleDelete = (id) => deleteMutation.mutate(id);

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <ManagerLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Notifications</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{unread > 0 ? `${unread} unread` : 'All caught up!'}</p>
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAllRead} className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-16 text-center">
          <div className="text-5xl mb-4">🔔</div>
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2">No notifications yet</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => {
            const cfg = typeConfig[notif.type] || { icon: '🔔', color: 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700' };
            return (
              <div key={notif.notification_id} className={`rounded-2xl border p-5 flex gap-4 items-start ${cfg.color} ${!notif.is_read ? 'shadow-sm' : 'opacity-75'}`}>
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-xl shrink-0 shadow-sm">{cfg.icon}</div>
                <div className="flex-1">
                  <p className={`text-sm leading-relaxed ${!notif.is_read ? 'font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>{notif.message}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!notif.is_read && (
                    <button onClick={() => handleMarkRead(notif.notification_id)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Mark read</button>
                  )}
                  <button onClick={() => handleDelete(notif.notification_id)} className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500">✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ManagerLayout>
  );
}