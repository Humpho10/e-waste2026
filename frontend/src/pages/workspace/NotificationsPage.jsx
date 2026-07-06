import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import WorkspaceLayout from '../../layouts/WorkspaceLayout';
import { getPMNotifications, markPMNotifRead, markAllPMNotifsRead } from '../../api/productManager';
import { useBadge } from '../../context/BadgeContext';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext'; // 👈 Import useAuth

const typeConfig = {
  product_approved:    { icon: '✅', color: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800/50'   },
  product_rejected:    { icon: '❌', color: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50'       },
  new_message:         { icon: '💬', color: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50'     },
  account_created:     { icon: '🎉', color: 'bg-purple-50 border-purple-200' },
  listing_resubmitted: { icon: '🔄', color: 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800/50' },
  new_listing:         { icon: '📦', color: 'bg-teal-50 border-teal-200'     },
};

export default function WorkspaceNotificationsPage() {
  // 👇 Get permissions
  const { permissions } = useAuth();

  const { refresh } = useBadge();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 👇 Check if user has permission to mark notifications as read
  const canMarkRead = permissions?.includes('notification-mark-read') || false;

  const { data: notifications = [], isLoading: loading } = useQuery({
    queryKey: ['pm-notifications'],
    queryFn: () => getPMNotifications().then(res => res.data.notifications || []),
  });

  const invalidateNotifs = () => queryClient.invalidateQueries({ queryKey: ['pm-notifications'] });

  const markReadMutation = useMutation({
    mutationFn: markPMNotifRead,
    onSuccess: () => {
      invalidateNotifs();
      refresh();
      toast('Notification marked as read', 'info');
    },
    onError: (err) => toast(err.response?.data?.message || 'Failed to mark as read', 'error'),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllPMNotifsRead,
    onSuccess: () => {
      invalidateNotifs();
      refresh();
      toast('All notifications marked as read', 'info');
    },
    onError: (err) => toast(err.response?.data?.message || 'Failed to mark all as read', 'error'),
  });

  const handleMarkRead = (id) => {
    if (!canMarkRead) {
      toast('You do not have permission to mark notifications as read', 'error');
      return;
    }
    markReadMutation.mutate(id);
  };

  const handleMarkAllRead = () => {
    if (!canMarkRead) {
      toast('You do not have permission to mark notifications as read', 'error');
      return;
    }
    markAllReadMutation.mutate();
  };

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <WorkspaceLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Notifications</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {unread > 0 ? `${unread} unread` : 'All caught up!'}
          </p>
        </div>
        {/* 👇 "Mark all as read" button only if user has permission AND there are unread notifications */}
        {canMarkRead && unread > 0 && (
          <button onClick={handleMarkAllRead} className="text-sm text-teal-600 dark:text-teal-400 hover:underline font-medium">
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
          <p className="text-gray-400 dark:text-gray-500 text-sm">You'll be notified about new listings and messages</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => {
            const cfg = typeConfig[notif.type] || { icon: '🔔', color: 'bg-gray-50 dark:bg-slate-800/60 border-gray-200 dark:border-slate-700' };
            return (
              <div
                key={notif.notification_id}
                className={`rounded-2xl border p-5 flex gap-4 items-start transition ${cfg.color} ${!notif.is_read ? 'shadow-sm' : 'opacity-75'}`}
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-xl shrink-0 shadow-sm">
                  {cfg.icon}
                </div>
                <div className="flex-1">
                  <p className={`text-sm leading-relaxed ${!notif.is_read ? 'font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(notif.created_at).toLocaleString('en-UG', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                {/* 👇 "Mark read" button only if user has permission AND notification is unread */}
                {!notif.is_read && canMarkRead && (
                  <button
                    onClick={() => handleMarkRead(notif.notification_id)}
                    className="text-xs text-teal-600 dark:text-teal-400 hover:underline shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </WorkspaceLayout>
  );
}