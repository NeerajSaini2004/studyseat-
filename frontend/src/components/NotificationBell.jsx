import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const bellRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/notifications');
      if (res.data.status === 'success') setNotifications(res.data.data.notifications);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id) => {
    try {
      await axios.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 text-textMuted hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V5a1 1 0 10-2 0v.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-error text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-glow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 glass-card rounded-2xl border border-white/10 shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all">
          <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center bg-white/5">
            <span className="text-sm font-bold text-white">Notifications</span>
            <span className="text-xs text-textMuted">{unreadCount} unread</span>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-textMuted text-xs py-8">No notifications yet.</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => markRead(n._id)}
                  className={`px-4 py-3 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5 ${!n.isRead ? 'bg-primary/5 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'}`}
                >
                  <p className={`text-xs font-semibold ${!n.isRead ? 'text-white' : 'text-textMuted'}`}>{n.title}</p>
                  <p className="text-xs text-textMuted mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-textAccent mt-1.5">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
