import React, { useState, useEffect } from 'react';
import { apiRequest } from './lib/api';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Orders from './components/Orders';
import Tasks from './components/Tasks';
import Objectives from './components/Objectives';
import Chat from './components/Chat';
import Notifications from './components/Notifications';
import Staff from './components/Staff';
import Settings from './components/Settings';
import { 
  Briefcase, 
  Users, 
  CheckSquare, 
  Target,
  MessageSquare,
  Bell,
  BarChart2, 
  ShieldAlert, 
  LogOut, 
  User as UserIcon, 
  Menu, 
  X,
  AlertCircle,
  Clock,
  Sparkles,
  Settings as SettingsIcon
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Navigation states
  const [activeTab, setActiveTab] = useState('dashboard');
  const [navigationArg, setNavigationArg] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [studioSettings, setStudioSettings] = useState<any>(null);

  const fetchStudioSettings = async () => {
    try {
      const settings = await apiRequest('/api/studio/settings');
      if (settings && settings.name) {
        setStudioSettings(settings);
      }
    } catch (err) {
      console.error('Failed to fetch studio settings in App:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStudioSettings();
    }
  }, [isAuthenticated]);

  // Check current session on load
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('studio_token');
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const data = await apiRequest('/api/auth/me');
        setUser(data.user);
        setRole(data.role);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Session restoration failed:', err);
        localStorage.removeItem('studio_token');
      } finally {
        setAuthLoading(false);
      }
    };

    checkSession();
  }, []);

  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<{ id: string; title: string; content: string; type: 'notification' | 'chat' }[]>([]);

  const knownNotificationIds = React.useRef<Set<string>>(new Set());
  const knownMessageIds = React.useRef<Set<string>>(new Set());
  const isFirstLoad = React.useRef<boolean>(true);

  const showToast = (title: string, content: string, type: 'notification' | 'chat') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, content, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  // Poll for unread notification count and new messages
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchNotificationsAndChat = async () => {
      try {
        // 1. Fetch notifications
        const notifs = await apiRequest('/api/notifications');
        const unreadNotifs = notifs.filter((n: any) => !n.is_read);
        setUnreadCount(unreadNotifs.length);

        // 2. Fetch general chat messages
        const messages = await apiRequest('/api/chat/messages');

        if (isFirstLoad.current) {
          // First load: Populate known IDs without showing toasts
          notifs.forEach((n: any) => knownNotificationIds.current.add(n.id));
          messages.forEach((m: any) => knownMessageIds.current.add(m.id));
          isFirstLoad.current = false;

          // Alert on starting session if there are unread notifications
          if (unreadNotifs.length > 0) {
            showToast(
              "Chào mừng quay lại!",
              `Bạn có ${unreadNotifs.length} thông báo chưa đọc. Hãy kiểm tra tab Thông báo!`,
              "notification"
            );
          }
        } else {
          // Subsequent polls: Check for new items
          notifs.forEach((n: any) => {
            if (!knownNotificationIds.current.has(n.id)) {
              knownNotificationIds.current.add(n.id);
              // Show toast if not on the notifications tab
              if (activeTab !== 'notifications') {
                showToast(`Thông báo: ${n.title}`, n.content, "notification");
              }
            }
          });

          messages.forEach((m: any) => {
            if (!knownMessageIds.current.has(m.id)) {
              knownMessageIds.current.add(m.id);
              // Show toast if not sent by current user AND not on the chat tab
              if (m.sender_id !== user.id && activeTab !== 'chat') {
                showToast(`Tin nhắn từ ${m.sender_name}`, m.content, "chat");
              }
            }
          });
        }
      } catch (err) {
        console.error('Failed to poll notifications/chat:', err);
      }
    };

    fetchNotificationsAndChat();
    const interval = setInterval(fetchNotificationsAndChat, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user, activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const data = await apiRequest('/api/auth/login', 'POST', { email, password });
      localStorage.setItem('studio_token', data.user.id);
      setUser(data.user);
      setRole(data.role);
      setIsAuthenticated(true);
    } catch (err: any) {
      setLoginError(err.message || 'Sai thông tin đăng nhập, vui lòng kiểm tra lại');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', 'POST');
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('studio_token');
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    setActiveTab('dashboard');
    setNavigationArg(null);
    // Reset toast and refs state
    setToasts([]);
    knownNotificationIds.current.clear();
    knownMessageIds.current.clear();
    isFirstLoad.current = true;
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
  };

  const handleNavigate = (tab: string, arg?: any) => {
    setActiveTab(tab);
    setNavigationArg(arg);
    setMobileMenuOpen(false);
  };

  // Clear navigation args on subsequent tab switches (to avoid repeating modal openings)
  useEffect(() => {
    setNavigationArg(null);
  }, [activeTab]);

  const hasPermission = (permission: string) => {
    if (!role) return false;
    return role.permissions.includes(permission) || role.id === 'role-admin';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gold-500"></div>
          <p className="mt-4 text-slate-500 text-xs font-semibold uppercase tracking-widest">Aura Bridal Studio...</p>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-gold-50 to-gold-100/50 p-8 text-center text-slate-800 relative border-b border-gold-200/40">
            <div className="absolute top-4 right-4 bg-gold-200/30 text-gold-800 border border-gold-300/40 px-2.5 py-0.5 rounded-full text-[9px] font-bold flex items-center tracking-wider">
              <Sparkles className="w-2.5 h-2.5 mr-1 text-gold-600 animate-pulse" /> CLOUD LOCAL
            </div>
            <h1 className="text-3xl font-semibold tracking-widest font-display text-gold-900 italic">AURA BRIDAL</h1>
            <p className="text-gold-700/80 mt-1.5 text-[10px] uppercase tracking-widest font-medium">Hệ thống quản lý Studio cao cấp</p>
          </div>

          <div className="p-6 space-y-5">
            
            {/* Quick login helper dropdown (for reviewers) */}
            {!import.meta.env.PROD && (
              <div className="bg-gold-50/40 border border-gold-200/30 p-4 rounded-xl">
                <p className="text-[10px] font-bold text-gold-800 uppercase tracking-wider mb-2.5 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-gold-600" /> Trình diễn thử nghiệm (Quick Login):
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <button 
                    onClick={() => handleQuickLogin('admin@studio.com', 'admin123')}
                    className="bg-white hover:bg-gold-100/30 border border-gold-200/40 rounded-lg p-2 font-medium text-gold-900 transition-colors shadow-2xs"
                  >
                    Admin (Nguyễn Văn Admin)
                  </button>
                  <button 
                    onClick={() => handleQuickLogin('manager@studio.com', 'manager123')}
                    className="bg-white hover:bg-gold-100/30 border border-gold-200/40 rounded-lg p-2 font-medium text-gold-900 transition-colors shadow-2xs"
                  >
                    Manager (Trần Thị Manager)
                  </button>
                  <button 
                    onClick={() => handleQuickLogin('photo@studio.com', 'staff123')}
                    className="bg-white hover:bg-gold-100/30 border border-gold-200/40 rounded-lg p-2 font-medium text-gold-900 transition-colors shadow-2xs"
                  >
                    Staff (Thợ chụp Hải Nam)
                  </button>
                  <button 
                    onClick={() => handleQuickLogin('editor@studio.com', 'staff123')}
                    className="bg-white hover:bg-gold-100/30 border border-gold-200/40 rounded-lg p-2 font-medium text-gold-900 transition-colors shadow-2xs"
                  >
                    Staff (Thợ ảnh Minh Hoàng)
                  </button>
                </div>
              </div>
            )}

            {/* Normal login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-2.5 rounded-xl text-xs flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                  {loginError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email đăng nhập</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@studio.com"
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2 px-3.5 text-xs focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/20 transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mật khẩu</label>
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-2 px-3.5 text-xs focus:outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400/20 transition-all"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={loginLoading}
                className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all duration-150 disabled:opacity-50 mt-1"
              >
                {loginLoading ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // MAIN LAYOUT
  const isManager = role?.id === 'role-admin' || role?.id === 'role-manager';

  const menuItems = [
    { id: 'dashboard', label: 'Tổng Quan', icon: BarChart2, permission: 'tasks.view_own' },
    { id: 'orders', label: 'Hợp đồng & Đơn hàng', icon: Briefcase, permission: 'orders.view' },
    { id: 'customers', label: 'Quản lý Khách hàng', icon: Users, permission: 'customers.view' },
    { id: 'tasks', label: 'Phân công công việc', icon: CheckSquare, permission: 'tasks.view_own' },
    { id: 'objectives', label: 'Mục tiêu & Tiến độ', icon: Target, permission: 'tasks.view_all' },
    { id: 'chat', label: 'Trò chuyện nội bộ', icon: MessageSquare, permission: 'tasks.view_own' },
    { id: 'notifications', label: 'Thông báo', icon: Bell, permission: 'tasks.view_own' },
    { id: 'staff', label: 'Quản lý Nhân sự', icon: ShieldAlert, permission: 'users.manage' },
    { id: 'settings', label: 'Cài đặt & Hệ thống', icon: SettingsIcon, permission: 'users.manage' },
  ];

  const filteredMenuItems = menuItems.filter(item => hasPermission(item.permission));

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col md:flex-row">
      
      {/* Mobile Header */}
      <header className="md:hidden bg-white text-slate-800 px-4 py-3 flex justify-between items-center z-20 shadow-xs border-b border-slate-200/60">
        <h1 className="text-base font-semibold tracking-widest font-display text-gold-900 italic uppercase truncate max-w-[200px]">
          {studioSettings?.name || 'AURA BRIDAL'}
        </h1>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-500 hover:text-slate-800 p-1"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Navigation Sidebar (Desktop & Mobile drawer) */}
      <aside className={`bg-white text-slate-700 w-full md:w-56 shrink-0 p-4 flex flex-col justify-between z-10 md:sticky md:top-0 md:h-screen border-r border-slate-200/80 transition-all duration-300 ${
        mobileMenuOpen ? 'fixed inset-x-0 top-[48px] bottom-0 bg-white' : 'hidden md:flex'
      }`}>
        <div className="space-y-6 flex-1 flex flex-col">
          {/* Logo */}
          <div className="hidden md:block pb-3 border-b border-slate-100">
            <h1 className="text-lg font-semibold tracking-widest font-display text-gold-900 italic uppercase leading-tight line-clamp-2">
              {studioSettings?.name || 'AURA BRIDAL'}
            </h1>
            <p className="text-[8px] text-slate-400 uppercase tracking-widest mt-1 font-medium truncate" title={studioSettings?.notes || 'Luxury Wedding Studio'}>
              {studioSettings?.notes || 'Luxury Wedding Studio'}
            </p>
          </div>

          {/* User profile capsule */}
          <div className="bg-gold-50/60 border border-gold-200/40 rounded-xl p-3 flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-gold-500 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs font-mono">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs text-slate-800 truncate leading-tight">{user?.full_name}</p>
              <span className="text-[8px] bg-gold-100 text-gold-700 border border-gold-200/50 rounded px-1.5 py-0.5 mt-1 inline-block uppercase font-bold tracking-wider">
                {role?.display_name || 'Nhân viên'}
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1 flex-1 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    isActive 
                      ? 'bg-gold-100/80 text-gold-900 font-bold border border-gold-200/40 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-gold-700' : 'text-slate-400'}`} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center scale-90">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
          <p className="text-[8px] text-slate-400 text-center uppercase tracking-widest font-medium">© 2026 The Will Studio</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && (
          <Dashboard 
            userRole={role?.name} 
            userId={user?.id}
            onNavigate={handleNavigate} 
            studioSettings={studioSettings}
          />
        )}
        
        {activeTab === 'orders' && (
          <Orders 
            userRole={role?.name} 
            onNavigate={handleNavigate}
            initialSelectedOrderId={navigationArg?.selectOrderId}
            initialOpenCreateForCustomerId={navigationArg?.openCreateForCustomerId}
          />
        )}

        {activeTab === 'customers' && (
          <Customers 
            userRole={role?.name} 
            onNavigate={handleNavigate}
            initialSelectedCustomerId={navigationArg?.selectCustomerId}
          />
        )}

        {activeTab === 'tasks' && (
          <Tasks 
            userRole={role?.name} 
            userId={user?.id}
            onNavigate={handleNavigate}
            initialSelectedTaskId={navigationArg?.selectTaskId}
          />
        )}

        {activeTab === 'objectives' && (
          <Objectives 
            userRole={role?.name} 
          />
        )}

        {activeTab === 'chat' && (
          <Chat 
            userId={user?.id}
            userRole={role?.name}
          />
        )}

        {activeTab === 'notifications' && (
          <Notifications 
            userId={user?.id}
            userRole={role?.name}
          />
        )}

        {activeTab === 'staff' && (
          <Staff 
            userRole={role?.name} 
          />
        )}

        {activeTab === 'settings' && (
          <Settings onSettingsSaved={fetchStudioSettings} />
        )}
      </main>

      {/* Floating Toast Notification Balloons */}
      <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full space-y-3 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white rounded-xl border border-gold-200/40 p-4 shadow-lg flex items-start gap-3 relative overflow-hidden transition-all duration-300 transform translate-y-0 opacity-100 animate-slide-in"
          >
            {/* Highlight bar */}
            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${toast.type === 'notification' ? 'bg-gold-500' : 'bg-blue-500'}`}></div>
            
            <div className="flex-1 space-y-1 pl-1.5">
              <h4 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  {toast.type === 'notification' ? (
                    <Bell className="w-3.5 h-3.5 text-gold-600 animate-bounce" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                  )}
                  {toast.title}
                </span>
                <button 
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="text-slate-400 hover:text-slate-600 transition-colors ml-2 text-sm font-bold focus:outline-hidden"
                >
                  ×
                </button>
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed truncate max-w-[280px]" title={toast.content}>
                {toast.content}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
