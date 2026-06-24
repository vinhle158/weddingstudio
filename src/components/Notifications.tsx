import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { Bell, Check, Plus, AlertCircle, Calendar, MessageSquare, Clipboard } from 'lucide-react';
import { motion } from 'motion/react';

interface NotificationItem {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string | null;
  title: string;
  content: string;
  type: 'general' | 'task_assignment' | 'order_update' | 'system';
  related_id: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationsProps {
  userRole?: string;
  userId?: string;
}

export default function Notifications({ userRole, userId }: NotificationsProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Announcement form states (Admin/Manager only)
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isManagerOrAdmin = userRole === 'admin' || userRole === 'manager';

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/api/notifications');
      setNotifications(res);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError('Không thể tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, 'POST');
      // Update local state
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiRequest('/api/notifications/read-all', 'POST');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      await apiRequest('/api/notifications', 'POST', { title, content });
      setTitle('');
      setContent('');
      setSuccessMsg('Đăng thông báo chung thành công!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchNotifications();
    } catch (err: any) {
      console.error('Error posting announcement:', err);
      setError(err.message || 'Lỗi khi đăng thông báo');
    } finally {
      setSubmitting(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'task_assignment':
        return <Clipboard className="w-5 h-5 text-gold-600" />;
      case 'order_update':
        return <Calendar className="w-5 h-5 text-gold-600" />;
      case 'system':
        return <AlertCircle className="w-5 h-5 text-gold-600" />;
      default:
        return <Bell className="w-5 h-5 text-gold-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'task_assignment':
        return <span className="bg-gold-50 text-gold-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-gold-200/50">Giao việc</span>;
      case 'order_update':
        return <span className="bg-gold-50 text-gold-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-gold-200/50">Hợp đồng</span>;
      case 'system':
        return <span className="bg-gold-50 text-gold-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-gold-200/50">Hệ thống</span>;
      default:
        return <span className="bg-gold-50 text-gold-800 text-xs font-semibold px-2 py-0.5 rounded-full border border-gold-200/50">Thông báo chung</span>;
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6" id="notifications-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-wider font-display text-gold-950 italic flex items-center gap-2">
            <Bell className="w-6 h-6 text-gold-600" />
            Thông báo nội bộ
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Nhận thông báo phân công công việc, cập nhật tiến độ hợp đồng và thông báo chung của Studio.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="self-start sm:self-center bg-white border border-gold-200/40 hover:border-gold-300 text-gold-900 hover:bg-gold-50 text-sm font-medium px-4 py-2 rounded-xl inline-flex items-center gap-2 transition-colors duration-150 shadow-2xs"
            id="btn-mark-all-read"
          >
            <Check className="w-4 h-4 text-gold-600" />
            Đánh dấu tất cả đã đọc ({unreadCount})
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg text-rose-700 text-sm" id="error-message">
          {error}
        </div>
      )}

      {/* Admin announcement form */}
      {isManagerOrAdmin && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xs border border-gold-200/30 p-6 space-y-4"
          id="announcement-form-box"
        >
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus className="w-5 h-5 text-gold-600" />
            <h3 className="font-semibold text-gold-950">Tạo thông báo chung mới</h3>
          </div>

          <form onSubmit={handlePostAnnouncement} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tiêu đề thông báo
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ví dụ: Lịch bảo trì phần mềm, Họp đột xuất..."
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-hidden transition-all duration-150 bg-slate-50/40"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nội dung chi tiết
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Nhập nội dung thông báo gửi đến toàn bộ nhân sự..."
                rows={3}
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-gold-500/20 focus:border-gold-500 outline-hidden transition-all duration-150 bg-slate-50/40"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              {successMsg ? (
                <div className="text-emerald-600 text-sm font-medium flex items-center gap-1.5 animate-pulse">
                  <Check className="w-4 h-4" />
                  {successMsg}
                </div>
              ) : <div />}

              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white font-semibold text-xs px-4.5 py-2.5 rounded-xl inline-flex items-center gap-1.5 transition-all duration-150 shadow-2xs hover:shadow-xs disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                id="btn-send-announcement"
              >
                Gửi thông báo toàn bộ nhân viên
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Notifications listing */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden" id="notifications-list-box">
        {loading && notifications.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-slate-400">Đang tải thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6 text-slate-300" />
            </div>
            <div className="space-y-1">
              <p className="text-slate-800 font-medium">Hộp thư trống</p>
              <p className="text-slate-400 text-sm">Bạn chưa nhận được thông báo nào.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                className={`p-4 md:p-5 flex gap-4 transition-colors duration-150 cursor-pointer ${
                  n.is_read ? 'hover:bg-slate-50/50' : 'bg-indigo-50/30 hover:bg-indigo-50/50'
                }`}
                id={`notification-item-${n.id}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    n.is_read ? 'bg-slate-100' : 'bg-indigo-100/80'
                  }`}>
                    {getIcon(n.type)}
                  </div>
                </div>

                <div className="flex-grow space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-semibold text-sm ${n.is_read ? 'text-slate-700' : 'text-slate-900 font-bold'}`}>
                      {n.title}
                    </span>
                    {getTypeBadge(n.type)}
                    {!n.is_read && (
                      <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                    )}
                  </div>

                  <p className={`text-sm text-slate-600 leading-relaxed ${!n.is_read && 'font-medium text-slate-800'}`}>
                    {n.content}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="font-medium text-slate-500">Người gửi: {n.sender_name}</span>
                    <span>•</span>
                    <span>{formatTime(n.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
