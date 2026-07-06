import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BiBell, BiCheckCircle, BiXCircle, BiMessageSquare, BiUserPlus, BiPackage,
  BiCheck, BiTrash2, BiCheckSquare,
} from '../../components/bi';
import ManagerLayout from '../../layouts/ManagerLayout';
import { getNotifications, markRead, markAllRead, deleteNotification } from '../../api/notifications';
import { useBadge } from '../../context/BadgeContext';
import { useToast } from '../../components/Toast';

const typeConfig = {
  product_approved: { icon: BiCheckCircle,  color: 'bg-green-50 border-green-200',   iconColor: 'text-green-600'  },
  product_rejected: { icon: BiXCircle,      color: 'bg-red-50 border-red-200',       iconColor: 'text-red-500'    },
  new_message:      { icon: BiMessageSquare, color: 'bg-blue-50 border-blue-200',    iconColor: 'text-blue-600'   },
  account_created:  { icon: BiUserPlus,     color: 'bg-purple-50 border-purple-200', iconColor: 'text-purple-600' },
  new_listing:      { icon: BiPackage,      color: 'bg-gray-50 border-gray-200',     iconColor: 'text-gray-500'   },
};
const defaultCfg = { icon: BiBell, color: 'bg-gray-50 border-gray-200', iconColor: 'text-gray-400' };

export default function ManagerNotificationsPage() {
  const { refresh } = useBadge();
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
      toast('All notifications marked as read', 'info');
    },
    onError: (err) => toast(err.response?.data?.message || 'Failed to mark all as read', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      invalidateNotifs();
      refresh();
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
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BiBell className="text-orange-500" size={22} /> Notifications
          </h2>
          <p className="text-gray-500 text-sm mt-1">{unread > 0 ? `${unread} unread` : 'All caught up!'}</p>
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAllRead} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium">
            <BiCheckSquare size={14} /> Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
            <BiBell size={28} className="text-orange-400" />
          </div>
          <h3 className="font-bold text-gray-700 mb-2">No notifications yet</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => {
            const cfg = typeConfig[notif.type] || defaultCfg;
            const Icon = cfg.icon;
            return (
              <div key={notif.notification_id} className={`rounded-2xl border p-5 flex gap-4 items-start ${cfg.color} ${!notif.is_read ? 'shadow-sm' : 'opacity-75'}`}>
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <Icon size={18} className={cfg.iconColor} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm leading-relaxed ${!notif.is_read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkRead(notif.notification_id)}
                      title="Mark as read"
                      className="w-8 h-8 flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded-lg transition"
                    >
                      <BiCheck size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif.notification_id)}
                    title="Delete"
                    className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <BiTrash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ManagerLayout>
  );
}
