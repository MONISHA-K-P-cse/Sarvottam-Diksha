import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, X, Check, ShoppingBag, Award, MessageSquare, Sparkles } from 'lucide-react';

export default function NotificationModal({ isOpen, onClose, user }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.post('/api/notifications/mark-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-end p-4 sm:p-6 animate-fade-in">
      
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden space-y-4 max-h-[85vh] flex flex-col justify-between mt-16 transition-colors">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Notifications Center</h3>
              <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400">Real-Time Platform Alerts</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-black text-[#0284C7] dark:text-sky-400 hover:underline"
            >
              Mark Read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications Body */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/40">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-500 dark:text-slate-400 font-extrabold">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No notifications yet.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all text-xs font-bold space-y-1.5 ${
                  n.isRead 
                    ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300' 
                    : 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-800 text-slate-900 dark:text-white shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between font-black text-slate-900 dark:text-white">
                  <span className="flex items-center gap-1.5">
                    {n.type === 'PURCHASE' && <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    {n.type === 'QUIZ' && <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                    {n.type === 'DOUBT' && <MessageSquare className="w-4 h-4 text-[#0284C7] dark:text-sky-400" />}
                    {n.title}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">{n.message}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-[10px] text-slate-400 dark:text-slate-500 font-bold">
          Sarvottam Diksha Mathematics Notifications
        </div>

      </div>
    </div>
  );
}
