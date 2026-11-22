import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, User as UserIcon, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user && user.role === 'student') {
      api.get('/student/notifications')
        .then(res => {
          if (res.data.success) {
            setNotifications(res.data.notifications);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id) => {
    try {
      await api.patch(`/student/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (e) {}
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">Admin</span>;
      case 'teacher':
        return <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">Faculty</span>;
      case 'student':
        return <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">Student</span>;
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Portal Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-primary-600 text-white p-2 rounded-xl shadow-md flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 tracking-tight text-lg leading-tight flex items-center gap-2">
                SmartSMS <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono">SCD 2.0</span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">Smart Student Management System</p>
            </div>
          </div>

          {/* User Nav */}
          <div className="flex items-center space-x-4">
            {/* Notifications for Students */}
            {user?.role === 'student' && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                      <span className="font-semibold text-sm text-slate-800">Notifications ({unreadCount} new)</span>
                      <button onClick={() => setShowNotifications(false)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 p-4 text-center">No notifications yet.</p>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => markAsRead(n.id)}
                            className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              {n.type === 'warning' ? (
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <p className={`font-semibold ${n.type === 'warning' ? 'text-amber-800' : 'text-slate-800'}`}>{n.title}</p>
                                <p className="text-slate-600 mt-0.5">{n.message}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Info */}
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  {getRoleBadge(user?.role)}
                  <span className="text-xs text-slate-400">{user?.email}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-700">
                {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5 text-slate-400" />}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
