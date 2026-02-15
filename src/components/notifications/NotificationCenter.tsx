import { Bell } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useData';
import { markNotificationRead } from '@/lib/db';

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const { authUser } = useAuth();
  const { data: notifications = [] } = useNotifications(authUser?.uid);

  const unread = notifications.filter((item) => !item.readAt).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-lg border border-slate-300 bg-white p-2"
      >
        <Bell size={18} />
        {unread > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-rose-600 px-1 text-center text-xs text-white">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute top-16 right-4 z-40 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
          <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
          <div className="mt-2 max-h-80 space-y-2 overflow-auto">
            {notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => !item.readAt && markNotificationRead(item.id)}
                className="w-full rounded-md border border-slate-100 p-2 text-left"
              >
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-600">{item.body}</p>
              </button>
            ))}
            {notifications.length === 0 ? <p className="text-sm text-slate-500">No notifications yet.</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
