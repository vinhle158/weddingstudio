import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { 
  Calendar, 
  Clock, 
  CheckSquare, 
  Shirt, 
  TrendingUp, 
  AlertCircle, 
  Phone, 
  Tag, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  DollarSign, 
  User as UserIcon,
  MapPin,
  Layers,
  Activity,
  Target,
  Users,
  Search,
  Building,
  Flame,
  Shield,
  FileText,
  Sliders,
  ArrowRight,
  History
} from 'lucide-react';

interface DashboardProps {
  userRole: string;
  userId: string;
  onNavigate: (tab: string, arg?: any) => void;
  studioSettings?: {
    name: string;
    phone: string;
    email: string;
    address: string;
    website: string;
    opening_hours: string;
    notes: string;
  } | null;
}

const ORDER_COLUMNS = [
  { id: 'new', label: 'Mới nhận', color: 'bg-blue-50 border-blue-200 text-blue-700', dot: 'bg-blue-500' },
  { id: 'confirmed', label: 'Đã xác nhận', color: 'bg-indigo-50 border-indigo-200 text-indigo-700', dot: 'bg-indigo-500' },
  { id: 'shooting', label: 'Đang chụp', color: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-500' },
  { id: 'editing', label: 'Hậu kỳ', color: 'bg-violet-50 border-violet-200 text-violet-700', dot: 'bg-violet-500' },
  { id: 'ready', label: 'Sẵn sàng', color: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500' },
  { id: 'delivered', label: 'Đã bàn giao', color: 'bg-slate-50 border-slate-200 text-slate-700', dot: 'bg-slate-500' },
];

const TASK_COLUMNS = [
  { id: 'pending', label: 'Chờ nhận việc', color: 'bg-yellow-50 border-yellow-200 text-yellow-800', dot: 'bg-yellow-500' },
  { id: 'in_progress', label: 'Đang thực hiện', color: 'bg-amber-50 border-amber-200 text-amber-800', dot: 'bg-amber-500' },
  { id: 'done', label: 'Đã hoàn tất', color: 'bg-emerald-50 border-emerald-200 text-emerald-800', dot: 'bg-emerald-500' },
];

export default function Dashboard({ userRole, userId, onNavigate, studioSettings }: DashboardProps) {
  const isStaff = userRole === 'staff' || userRole === 'photographer' || userRole === 'editor';

  const [summary, setSummary] = useState<any>(null);
  const [upcomingShoots, setUpcomingShoots] = useState<any[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [staffTasks, setStaffTasks] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeKanban, setActiveKanban] = useState<'orders' | 'tasks'>(isStaff ? 'tasks' : 'orders');
  const [kanbanError, setKanbanError] = useState<string | null>(null);
  const [kanbanSuccess, setKanbanSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for work history, progress, and task trace
  const [activeTraceTab, setActiveTraceTab] = useState<'pipeline' | 'task' | 'staff'>(isStaff ? 'task' : 'pipeline');
  const [selectedTraceTaskId, setSelectedTraceTaskId] = useState<string>('');
  const [selectedTraceUserId, setSelectedTraceUserId] = useState<string>('');
  const [taskUpdates, setTaskUpdates] = useState<any[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState<boolean>(false);

  const handleSelectTraceTask = async (taskId: string) => {
    setSelectedTraceTaskId(taskId);
    if (!taskId) {
      setTaskUpdates([]);
      return;
    }
    try {
      setUpdatesLoading(true);
      const data = await apiRequest(`/api/tasks/${taskId}/updates`);
      setTaskUpdates(data || []);
    } catch (err) {
      console.error('Failed to fetch task updates for trace:', err);
      setTaskUpdates([]);
    } finally {
      setUpdatesLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [sumData, shootsData, overdueTasksData, ordersData, tasksData, objectivesData, customersData, usersData] = await Promise.all([
        apiRequest('/api/dashboard/summary'),
        apiRequest('/api/dashboard/upcoming-shoots'),
        apiRequest('/api/dashboard/overdue-tasks'),
        apiRequest('/api/orders').catch(() => []),
        apiRequest('/api/tasks').catch(() => []),
        apiRequest('/api/objectives').catch(() => []),
        apiRequest('/api/customers').catch(() => []),
        apiRequest('/api/users').catch(() => [])
      ]);

      setSummary(sumData);
      setUpcomingShoots(shootsData);
      setOverdueTasks(overdueTasksData);
      setOrders(ordersData);
      setTasks(tasksData);
      setObjectives(objectivesData || []);
      setCustomers(customersData || []);
      setUsers(usersData || []);

      // Automatically select first task or staff if any exist for tracing
      if (tasksData && tasksData.length > 0) {
        handleSelectTraceTask(tasksData[0].id);
      }
      if (usersData && usersData.length > 0) {
        // Find first staff user
        const firstStaff = usersData.find((u: any) => u.role_id === 'role-photographer' || u.role_id === 'role-editor' || u.role_id === 'role-staff');
        setSelectedTraceUserId(firstStaff?.id || usersData[0].id);
      }

      // Filter staff tasks locally
      if (userRole === 'staff' || userRole === 'photographer' || userRole === 'editor') {
        const staffTasksData = tasksData.filter((t: any) => t.assigned_to === userId);
        setStaffTasks(staffTasksData);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Không thể tải dữ liệu tổng quan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userRole, userId]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const showFeedback = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setKanbanSuccess(msg);
      setTimeout(() => setKanbanSuccess(null), 3500);
    } else {
      setKanbanError(msg);
      setTimeout(() => setKanbanError(null), 4500);
    }
  };

  const getStageLabel = (status: string) => {
    const col = ORDER_COLUMNS.find(c => c.id === status);
    return col ? col.label : status;
  };

  const getTaskStatusLabel = (status: string) => {
    const col = TASK_COLUMNS.find(c => c.id === status);
    return col ? col.label : status;
  };

  const moveOrder = async (orderId: string, currentStatus: string, direction: 'next' | 'prev') => {
    const statuses = ['new', 'confirmed', 'shooting', 'editing', 'ready', 'delivered'];
    const currentIndex = statuses.indexOf(currentStatus);
    if (currentIndex === -1) return;
    
    let newIndex = currentIndex + (direction === 'next' ? 1 : -1);
    if (newIndex < 0 || newIndex >= statuses.length) return;
    
    const newStatus = statuses[newIndex];
    
    // Safety role check for going backward
    if (newIndex < currentIndex && userRole !== 'admin' && userRole !== 'manager') {
      showFeedback('Chỉ Quản lý hoặc Quản trị viên mới có quyền dời ngược trạng thái đơn hàng.', 'error');
      return;
    }

    try {
      await apiRequest(`/api/orders/${orderId}/status`, 'POST', { 
        status: newStatus, 
        note: 'Cập nhật trực quan trên bảng Kanban' 
      });
      showFeedback(`Đã chuyển trạng thái đơn hàng sang "${getStageLabel(newStatus)}" thành công!`, 'success');
      fetchDashboardData();
    } catch (err: any) {
      showFeedback(err.message || 'Không thể chuyển trạng thái đơn hàng', 'error');
    }
  };

  const moveTask = async (taskId: string, currentStatus: string, direction: 'next' | 'prev') => {
    const statuses = ['pending', 'in_progress', 'done'];
    const currentIndex = statuses.indexOf(currentStatus);
    if (currentIndex === -1) return;
    
    let newIndex = currentIndex + (direction === 'next' ? 1 : -1);
    if (newIndex < 0 || newIndex >= statuses.length) return;
    
    const newStatus = statuses[newIndex];
    
    try {
      await apiRequest(`/api/tasks/${taskId}`, 'PUT', { 
        status: newStatus 
      });
      showFeedback(`Đã cập nhật công việc thành công sang "${getTaskStatusLabel(newStatus)}"!`, 'success');
      fetchDashboardData();
    } catch (err: any) {
      showFeedback(err.message || 'Không thể cập nhật công việc', 'error');
    }
  };

  const getOrderStatusCounts = () => {
    const counts = { new: 0, confirmed: 0, shooting: 0, editing: 0, ready: 0, delivered: 0 };
    orders.forEach(o => {
      if (counts[o.status as keyof typeof counts] !== undefined) {
        counts[o.status as keyof typeof counts]++;
      }
    });
    return counts;
  };

  const orderCounts = getOrderStatusCounts();
  const maxCount = Math.max(...Object.values(orderCounts), 1);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gold-500"></div>
        <span className="ml-3 text-gray-500">Đang tải dữ liệu tổng quan...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg my-6 flex items-center">
        <AlertCircle className="w-5 h-5 mr-2" />
        <span>{error}</span>
        <button onClick={fetchDashboardData} className="ml-auto bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-xs font-medium">Thử lại</button>
      </div>
    );
  }

  const renderOrdersKanban = () => {
    return (
      <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-thin scrollbar-thumb-gray-200" style={{ minHeight: '380px' }}>
        {ORDER_COLUMNS.map(col => {
          const colOrders = orders.filter(o => o.status === col.id);
          return (
            <div key={col.id} className="w-72 shrink-0 flex flex-col bg-gray-50/70 border border-gray-100 rounded-2xl p-4">
              {/* Column Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200/50">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center">
                  <span className={`w-2 h-2 rounded-full ${col.dot} mr-2`}></span>
                  {col.label}
                </span>
                <span className="bg-gray-200/80 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {colOrders.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[420px] pr-1">
                {colOrders.length === 0 ? (
                  <div className="h-28 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-4 text-center text-[11px] text-gray-400">
                    Chưa có đơn hàng
                  </div>
                ) : (
                  colOrders.map(order => (
                    <div 
                      key={order.id} 
                      className="bg-white border border-gray-200/60 hover:border-gold-400 rounded-xl p-3.5 shadow-3xs hover:shadow-2xs transition-all duration-200 space-y-2.5 relative group"
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[11px] font-bold text-gold-600 bg-gold-50 px-1.5 py-0.5 rounded">
                          {order.order_code}
                        </span>
                        
                        <button 
                          onClick={() => onNavigate('orders', { selectOrderId: order.id })}
                          className="text-gray-400 hover:text-gold-500 transition-colors"
                          title="Xem chi tiết đơn hàng"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-gray-900 truncate">{order.customer_name}</h4>
                        <p className="text-[10px] text-gray-400 font-medium flex items-center mt-0.5">
                          <Phone className="w-2.5 h-2.5 mr-1" /> {order.customer_phone}
                        </p>
                      </div>

                      <div className="text-[10px] bg-slate-50 border border-slate-100 rounded-lg p-2 space-y-1 text-gray-600">
                        <div className="flex justify-between">
                          <span>Gói:</span>
                          <span className="font-semibold text-gray-900 truncate max-w-[120px]">{order.package_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ngày chụp:</span>
                          <span className="font-semibold text-gray-900">{new Date(order.shoot_date).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>

                      {/* Quick Move controls */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        {!isStaff ? (
                          <>
                            <button
                              onClick={() => moveOrder(order.id, order.status, 'prev')}
                              disabled={col.id === 'new'}
                              className="p-1 rounded-lg border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                              title="Lùi trạng thái đơn hàng"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[9px] text-gray-400 font-medium tracking-wider uppercase">Tiến độ</span>
                            <button
                              onClick={() => moveOrder(order.id, order.status, 'next')}
                              disabled={col.id === 'delivered'}
                              className="p-1 rounded-lg border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                              title="Tiến trạng thái đơn hàng"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="w-full text-center py-1 text-[9px] text-gray-400 italic">
                            Xem chế độ hành trình đơn
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTasksKanban = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" style={{ minHeight: '380px' }}>
        {TASK_COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className="bg-gray-50/70 border border-gray-100 rounded-2xl p-4 flex flex-col">
              {/* Column Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200/50">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dot} mr-2`}></span>
                  {col.label}
                </span>
                <span className="bg-gray-200/80 text-gray-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {colTasks.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[450px] pr-1">
                {colTasks.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-4 text-center text-xs text-gray-400">
                    Chưa có công việc
                  </div>
                ) : (
                  colTasks.map(task => {
                    const isOverdue = task.due_date && task.status !== 'done' && task.due_date < new Date().toISOString().split('T')[0];
                    const canEdit = !isStaff || task.assigned_to === userId;
                    return (
                      <div 
                        key={task.id} 
                        className="bg-white border border-gray-200/60 hover:border-gold-400 rounded-xl p-4 shadow-3xs hover:shadow-2xs transition-all duration-200 space-y-3"
                      >
                        {/* Header priority */}
                        <div className="flex justify-between items-start">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            task.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-100' :
                            task.priority === 'normal' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-50 text-gray-600 border border-gray-100'
                          }`}>
                            {task.priority === 'high' ? 'Gấp' : task.priority === 'normal' ? 'Thường' : 'Thấp'}
                          </span>

                          <button 
                            onClick={() => onNavigate('tasks', { selectTaskId: task.id })}
                            className="text-gray-400 hover:text-gold-500 transition-colors"
                            title="Xem chi tiết công việc"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Title and details */}
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">{task.title}</h4>
                          {task.description && (
                            <p className="text-gray-400 text-[10px] line-clamp-2 mt-1">{task.description}</p>
                          )}
                        </div>

                        {/* Order connection info */}
                        {task.order_code && (
                          <div className="text-[10px] bg-slate-50 border border-slate-100 rounded-lg p-2 space-y-0.5">
                            <p className="font-semibold text-gray-700">
                              Mã đơn: <strong className="font-mono text-gold-600">{task.order_code}</strong>
                            </p>
                            {task.customer_name && (
                              <p className="text-gray-500">Khách: <strong className="text-gray-600">{task.customer_name}</strong></p>
                            )}
                          </div>
                        )}

                        {/* Assignee & Due Date */}
                        <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-gray-100/60">
                          <div className="flex items-center space-x-1.5 min-w-0">
                            <div className="w-5 h-5 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center font-bold text-[9px] shrink-0">
                              {task.assigned_to_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className="text-gray-600 font-medium truncate max-w-[80px]">{task.assigned_to_name}</span>
                          </div>

                          {task.due_date && (
                            <span className={`flex items-center font-semibold text-[10px] ${isOverdue ? 'text-red-600 animate-pulse' : 'text-gray-400'}`}>
                              <Clock className="w-3 h-3 mr-0.5" />
                              {new Date(task.due_date).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>

                        {/* Transition arrows */}
                        <div className="flex justify-between items-center pt-2.5 border-t border-gray-100/60">
                          {canEdit ? (
                            <>
                              <button
                                onClick={() => moveTask(task.id, task.status, 'prev')}
                                disabled={col.id === 'pending'}
                                className="p-1 rounded-lg border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                title="Lùi tiến độ công việc"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-[9px] text-gray-400 font-medium tracking-wider uppercase">Cập nhật</span>
                              <button
                                onClick={() => moveTask(task.id, task.status, 'next')}
                                disabled={col.id === 'done'}
                                className="p-1 rounded-lg border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                title="Tiến tiến độ công việc"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <div className="w-full text-center py-1 text-[9px] text-gray-400 italic">
                              Chỉ người phụ trách được dời
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-gold-200/40 shadow-2xs p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-br from-white to-gold-50/10">
        <div>
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
            <h2 className="text-2xl font-semibold tracking-widest text-gold-950 md:text-3xl font-display italic">
              {studioSettings?.name || 'The Will Studio'}
            </h2>
            {userRole === 'admin' && (
              <span className="bg-gold-500 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-gold-600/20 shadow-3xs flex items-center shrink-0">
                <Shield className="w-2.5 h-2.5 mr-1" /> Điều hành (Full Quyền)
              </span>
            )}
            {userRole === 'manager' && (
              <span className="bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-blue-700/20 shadow-3xs flex items-center shrink-0">
                <Shield className="w-2.5 h-2.5 mr-1" /> Quản lý (Đơn & Khách)
              </span>
            )}
            {(userRole === 'staff' || userRole === 'photographer' || userRole === 'editor') && (
              <span className="bg-amber-600 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-amber-700/20 shadow-3xs flex items-center shrink-0">
                <Shield className="w-2.5 h-2.5 mr-1" /> Nhân viên (Tiến độ)
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-2 text-xs md:text-sm max-w-2xl font-medium">
            {userRole === 'admin' && 'Hệ thống quản trị tối cao, điều hành toàn diện hợp đồng, khách hàng, nhân sự và mục tiêu studio.'}
            {userRole === 'manager' && 'Hệ thống quản lý hợp đồng, chăm sóc khách hàng, phân phối nhiệm vụ và trao đổi nội bộ.'}
            {(userRole === 'staff' || userRole === 'photographer' || userRole === 'editor') && 'Không gian làm việc nhân viên kỹ thuật: nhận việc được bàn giao, trao đổi trực tiếp và cập nhật tiến độ liên quan.'}
          </p>
        </div>
        <div className="mt-4 md:mt-0 bg-gold-100/60 text-gold-800 px-4 py-2 rounded-full border border-gold-200/40 text-[11px] font-bold tracking-wide flex items-center">
          <Calendar className="w-3.5 h-3.5 mr-2 text-gold-600" />
          Hôm nay: {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      {!isStaff && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Card 1: Active Orders */}
          <div className="bg-white p-6 rounded-2xl border border-gold-200/30 shadow-2xs flex items-center space-x-4">
            <div className="p-3.5 bg-gold-50 text-gold-600 rounded-xl border border-gold-200/40">
              <Clock className="w-5.5 h-5.5 text-gold-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đơn đang hoạt động</p>
              <h3 className="text-lg font-bold text-slate-800 mt-1">
                {summary.orders.by_status.shooting + summary.orders.by_status.editing + summary.orders.by_status.confirmed + summary.orders.by_status.new} Đơn
              </h3>
              <div className="flex gap-2 mt-1 text-[9px] font-bold">
                <span className="bg-gold-50 text-gold-700 px-1.5 py-0.5 rounded border border-gold-200/40">
                  Chụp: {summary.orders.by_status.shooting}
                </span>
                <span className="bg-gold-100/50 text-gold-800 px-1.5 py-0.5 rounded border border-gold-200/40">
                  Hậu kỳ: {summary.orders.by_status.editing}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Task Progress */}
          <div className="bg-white p-6 rounded-2xl border border-gold-200/30 shadow-2xs flex items-center space-x-4">
            <div className="p-3.5 bg-gold-50 text-gold-600 rounded-xl border border-gold-200/40">
              <CheckSquare className="w-5.5 h-5.5 text-gold-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tiến độ công việc</p>
              <h3 className="text-lg font-bold text-slate-800 mt-1">
                {summary.tasks.done}/{summary.tasks.total} Hoàn thành
              </h3>
              <div className="w-28 bg-gold-100/50 rounded-full h-1.5 mt-2.5">
                <div 
                  className="bg-gold-500 h-1.5 rounded-full" 
                  style={{ width: `${summary.tasks.total > 0 ? (summary.tasks.done / summary.tasks.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Card 3: Studio Objectives */}
          <div className="bg-white p-6 rounded-2xl border border-gold-200/30 shadow-2xs flex items-center space-x-4">
            <div className="p-3.5 bg-gold-50 text-gold-600 rounded-xl border border-gold-200/40">
              <Target className="w-5.5 h-5.5 text-gold-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mục tiêu chiến dịch</p>
              <h3 className="text-lg font-bold text-slate-800 mt-1">
                {objectives.filter(o => o.status === 'active').length} Đang hoạt động
              </h3>
              <p className="text-[10px] text-emerald-600 mt-1 font-bold flex items-center">
                <Check className="w-3 h-3 mr-1 shrink-0" />
                {objectives.filter(o => o.status === 'completed').length} mục tiêu đã hoàn thành
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Staff Stats Overview */}
      {isStaff && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gold-200/30 shadow-2xs flex items-center space-x-4">
            <div className="p-3 bg-gold-50/60 text-gold-600 rounded-xl border border-gold-100">
              <Clock className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đang thực hiện</p>
              <h3 className="text-lg font-bold text-slate-800 mt-1">
                {staffTasks.filter(t => t.status === 'in_progress').length} Công việc
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gold-200/30 shadow-2xs flex items-center space-x-4">
            <div className="p-3 bg-gold-50/60 text-gold-600 rounded-xl border border-gold-100">
              <AlertCircle className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chờ nhận việc</p>
              <h3 className="text-lg font-bold text-slate-800 mt-1">
                {staffTasks.filter(t => t.status === 'pending').length} Công việc
              </h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gold-200/30 shadow-2xs flex items-center space-x-4">
            <div className="p-3 bg-gold-50/60 text-gold-600 rounded-xl border border-gold-100">
              <CheckSquare className="w-5.5 h-5.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đã hoàn tất</p>
              <h3 className="text-lg font-bold text-slate-800 mt-1">
                {staffTasks.filter(t => t.status === 'done').length} Công việc
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Animated Vivid Graphics Section */}
      {!isStaff && (
        <div className="space-y-4">
        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400 flex items-center">
          <Layers className="w-4.5 h-4.5 text-gold-500 mr-2" />
          Phân tích & Thống kê trực quan
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Graph 1: Dynamic Tracing & Order Pipeline Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between md:col-span-1 min-h-[400px]">
            <div className="space-y-4">
              {/* Header with Switcher for Admin/Manager */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-gray-100 gap-3">
                <h4 className="font-bold text-gray-950 text-sm flex items-center">
                  <Activity className="w-4 h-4 text-gold-600 mr-2 shrink-0 animate-pulse" />
                  {activeTraceTab === 'pipeline' && "Hành trình đơn hàng đang hoạt động"}
                  {activeTraceTab === 'task' && "Truy dấu công việc chi tiết"}
                  {activeTraceTab === 'staff' && "Lịch sử & Tiến độ nhân sự"}
                </h4>
                
                {/* Selector Tabs for Admin/Manager role */}
                {!isStaff && (
                  <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setActiveTraceTab('pipeline')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        activeTraceTab === 'pipeline'
                          ? 'bg-white text-gold-950 shadow-3xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Hành trình đơn
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTraceTab('task')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        activeTraceTab === 'task'
                          ? 'bg-white text-gold-950 shadow-3xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Truy dấu việc
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTraceTab('staff')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        activeTraceTab === 'staff'
                          ? 'bg-white text-gold-950 shadow-3xs'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      Tiến độ nhân viên
                    </button>
                  </div>
                )}
              </div>

              {/* TAB 1: PIPELINE VIEW (ORIGINAL CHART) */}
              {activeTraceTab === 'pipeline' && (
                <div className="space-y-3.5 pt-1.5 animate-fade-in">
                  {ORDER_COLUMNS.map(col => {
                    const count = orderCounts[col.id as keyof typeof orderCounts] || 0;
                    const percentage = (count / maxCount) * 100;
                    return (
                      <div key={col.id} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-gray-600 flex items-center">
                            <span className={`w-2 h-2 rounded-full ${col.dot} mr-2`}></span>
                            {col.label}
                          </span>
                          <span className="text-gray-900 font-bold">{count} đơn ({summary?.orders?.total > 0 ? Math.round((count / summary.orders.total) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gold-500 transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              opacity: count > 0 ? 1 : 0.15
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: TASK TRACER VIEW */}
              {activeTraceTab === 'task' && (
                <div className="space-y-4 pt-1 animate-fade-in text-xs">
                  {/* Task Selection Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Chọn đầu việc cần truy dấu:</label>
                    <div className="relative">
                      <select
                        value={selectedTraceTaskId}
                        onChange={(e) => handleSelectTraceTask(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 hover:border-gold-400 rounded-xl py-1.5 pl-3 pr-8 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-gold-500 transition-colors cursor-pointer"
                      >
                        <option value="">-- Chọn công việc --</option>
                        {tasks.map(t => (
                          <option key={t.id} value={t.id}>
                            [{t.status === 'done' ? '✓ Hoàn tất' : t.status === 'in_progress' ? '⚡ Đang làm' : '⏳ Chờ nhận'}] {t.title}
                          </option>
                        ))}
                      </select>
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {(() => {
                    const traceTask = tasks.find(t => t.id === selectedTraceTaskId);
                    if (!traceTask) {
                      return <p className="text-center py-10 text-gray-400 italic">Vui lòng chọn một công việc để truy dấu thông tin bộ phận, nhân sự và khách hàng liên quan.</p>;
                    }

                    return (
                      <div className="space-y-3 pt-1">
                        {/* Task Progress & Priority Badge */}
                        <div className="bg-slate-50/70 border border-slate-100 p-3 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-900 text-[11px] line-clamp-1">{traceTask.title}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              traceTask.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-100' :
                              traceTask.priority === 'normal' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-50 text-gray-600 border border-gray-100'
                            }`}>
                              {traceTask.priority === 'high' ? 'Gấp' : 'Thường'}
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] text-gray-400">
                              <span>Trạng thái tiến độ:</span>
                              <strong className="text-slate-700 uppercase font-semibold">
                                {traceTask.status === 'done' ? 'Đã hoàn tất (100%)' : traceTask.status === 'in_progress' ? 'Đang làm (50%)' : 'Chưa bắt đầu (0%)'}
                              </strong>
                            </div>
                            <div className="w-full bg-slate-200/50 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${traceTask.status === 'done' ? 'bg-emerald-500' : 'bg-gold-500'}`}
                                style={{ width: traceTask.status === 'done' ? '100%' : traceTask.status === 'in_progress' ? '50%' : '5%' }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        {/* Connected Personnel & Department */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="border border-slate-100 bg-white p-2.5 rounded-xl flex items-center space-x-2">
                            <div className="p-1.5 bg-gold-50 rounded-lg">
                              <UserIcon className="w-3.5 h-3.5 text-gold-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-tight">Phụ trách</p>
                              <p className="font-bold text-gray-800 text-[11px] truncate mt-0.5">{traceTask.assigned_to_name}</p>
                            </div>
                          </div>

                          <div className="border border-slate-100 bg-white p-2.5 rounded-xl flex items-center space-x-2">
                            <div className="p-1.5 bg-gold-50 rounded-lg">
                              <Building className="w-3.5 h-3.5 text-gold-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-tight">Mã đơn liên kết</p>
                              <p className="font-mono font-bold text-gray-800 text-[11px] truncate mt-0.5">{traceTask.order_code || 'Không có'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Related Customer if exists */}
                        {traceTask.customer_name ? (
                          <div className="border border-gold-100 bg-gold-50/20 p-2.5 rounded-xl flex items-center justify-between">
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-gold-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0 font-mono">
                                {traceTask.customer_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] text-gold-800 font-bold uppercase tracking-wider leading-tight">Khách hàng liên quan</p>
                                <p className="font-bold text-slate-800 text-xs truncate mt-0.5">{traceTask.customer_name}</p>
                                <p className="text-[10px] text-slate-500 font-mono leading-none mt-0.5">{traceTask.customer_phone}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                // Find customer
                                const customerObj = customers.find(c => c.full_name === traceTask.customer_name);
                                if (customerObj) {
                                  onNavigate('customers', { selectCustomerId: customerObj.id });
                                } else {
                                  onNavigate('customers');
                                }
                              }}
                              className="text-gold-600 hover:text-gold-700 font-bold text-[10px] shrink-0 border border-gold-200 bg-white hover:bg-gold-50 px-2.5 py-1 rounded-lg transition-colors flex items-center cursor-pointer"
                            >
                              Xem khách <ArrowRight className="w-3 h-3 ml-0.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="border border-dashed border-slate-200 p-2.5 rounded-xl text-center text-slate-400 text-[10px]">
                            Không tìm thấy khách hàng liên kết trực tiếp với đầu việc này.
                          </div>
                        )}

                        {/* Recent Work Logs Timeline */}
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center">
                            <History className="w-3.5 h-3.5 mr-1 text-gold-500" />
                            Nhật ký báo cáo tiến độ gần nhất:
                          </p>
                          <div className="max-h-24 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100 bg-slate-50/40">
                            {updatesLoading ? (
                              <p className="text-center py-3 text-slate-400">Đang tải nhật ký...</p>
                            ) : taskUpdates.length === 0 ? (
                              <p className="text-center py-3 text-slate-400 italic text-[9px]">Chưa có cập nhật tiến độ nào cho công việc này.</p>
                            ) : (
                              taskUpdates.map((up: any) => (
                                <div key={up.id} className="p-2 flex flex-col gap-0.5">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-bold text-slate-700">{up.created_by_name || traceTask.assigned_to_name}</span>
                                    <span className="text-[9px] text-slate-400">{new Date(up.created_at).toLocaleDateString('vi-VN')}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                                    Cập nhật: <span className="font-medium text-gold-700">[{up.status_from} → {up.status_to}]</span>
                                    {up.comment && ` - "${up.comment}"`}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 3: STAFF PROGRESS VIEW */}
              {activeTraceTab === 'staff' && (
                <div className="space-y-4 pt-1 animate-fade-in text-xs">
                  {/* Staff Selection Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Chọn nhân viên kỹ thuật:</label>
                    <select
                      value={selectedTraceUserId}
                      onChange={(e) => setSelectedTraceUserId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-gold-400 rounded-xl py-1.5 px-3 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-gold-500 transition-colors cursor-pointer"
                    >
                      <option value="">-- Chọn nhân sự --</option>
                      {users
                        .filter(u => u.role_id === 'role-photographer' || u.role_id === 'role-editor' || u.role_id === 'role-staff')
                        .map(u => (
                          <option key={u.id} value={u.id}>
                            {u.full_name} ({u.role_name})
                          </option>
                        ))}
                    </select>
                  </div>

                  {(() => {
                    const traceUser = users.find(u => u.id === selectedTraceUserId);
                    if (!traceUser) {
                      return <p className="text-center py-10 text-gray-400 italic">Vui lòng chọn một nhân viên để giám sát tiến độ hoạt động và lịch sử hoàn thành.</p>;
                    }

                    const userTasks = tasks.filter(t => t.assigned_to === traceUser.id);
                    const doneTasks = userTasks.filter(t => t.status === 'done');
                    const pendingTasks = userTasks.filter(t => t.status === 'pending');
                    const inProgressTasks = userTasks.filter(t => t.status === 'in_progress');

                    const totalCount = userTasks.length;
                    const completionRate = totalCount > 0 ? Math.round((doneTasks.length / totalCount) * 100) : 0;

                    return (
                      <div className="space-y-3">
                        {/* Profile Summary Capsule */}
                        <div className="bg-gold-50/20 border border-gold-200/30 p-3 rounded-xl flex items-center justify-between">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gold-500 text-white font-bold flex items-center justify-center text-xs shrink-0 font-mono">
                              {traceUser.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-xs truncate">{traceUser.full_name}</p>
                              <span className="text-[8px] bg-gold-100 text-gold-700 border border-gold-200/50 rounded px-1 mt-0.5 inline-block uppercase font-bold tracking-wider">
                                {traceUser.role_name}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Tỉ lệ xong việc</p>
                            <p className="text-base font-extrabold text-gold-600">{completionRate}%</p>
                          </div>
                        </div>

                        {/* Task Progress Counter Rings/Bars */}
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-2 rounded-lg">
                            <p className="text-[8px] text-emerald-600 uppercase tracking-wider">Hoàn tất</p>
                            <p className="text-sm mt-1">{doneTasks.length} / {totalCount}</p>
                          </div>
                          <div className="bg-amber-50 border border-amber-100 text-amber-800 p-2 rounded-lg">
                            <p className="text-[8px] text-amber-600 uppercase tracking-wider">Đang làm</p>
                            <p className="text-sm mt-1">{inProgressTasks.length}</p>
                          </div>
                          <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 p-2 rounded-lg">
                            <p className="text-[8px] text-yellow-600 uppercase tracking-wider">Chờ nhận</p>
                            <p className="text-sm mt-1">{pendingTasks.length}</p>
                          </div>
                        </div>

                        {/* List of Tasks assigned to this staff */}
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Danh sách công việc đang đảm nhiệm:</p>
                          <div className="max-h-24 overflow-y-auto space-y-1.5">
                            {userTasks.length === 0 ? (
                              <p className="text-center py-3 text-gray-400 italic text-[9px]">Nhân viên này chưa được phân công công việc nào.</p>
                            ) : (
                              userTasks.map(ut => (
                                <div key={ut.id} className="border border-slate-100 bg-white p-2 rounded-lg flex justify-between items-center text-[10px]">
                                  <div className="min-w-0 flex-1 pr-2">
                                    <p className="font-semibold text-slate-800 truncate">{ut.title}</p>
                                    <p className="text-slate-400 text-[9px] mt-0.5">
                                      Hạn: {ut.due_date ? new Date(ut.due_date).toLocaleDateString('vi-VN') : 'Không hạn'}
                                      {ut.customer_name && ` | Khách: ${ut.customer_name}`}
                                    </p>
                                  </div>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shrink-0 ${
                                    ut.status === 'done' ? 'bg-emerald-50 text-emerald-700' :
                                    ut.status === 'in_progress' ? 'bg-amber-50 text-amber-700' : 'bg-yellow-50 text-yellow-700'
                                  }`}>
                                    {ut.status === 'done' ? 'Xong' : ut.status === 'in_progress' ? 'Làm' : 'Chờ'}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>



          {/* Graph 3: Objectives Progress */}
          {objectives && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-gray-900 text-sm flex items-center mb-4">
                  <Target className="w-4 h-4 text-gold-500 mr-2" />
                  Tiến độ mục tiêu chiến dịch Studio
                </h4>
                
                <div className="space-y-4">
                  {objectives.filter(o => o.status === 'active').length === 0 ? (
                    <div className="py-8 text-center text-gray-400">
                      <Target className="w-10 h-10 mx-auto opacity-30 mb-2" />
                      Chưa thiết lập mục tiêu hoạt động nào.
                      {!isStaff && (
                        <button 
                          onClick={() => onNavigate('objectives')}
                          className="mt-3 block mx-auto text-xs font-bold text-gold-500 hover:text-gold-700"
                        >
                          Thiết lập ngay +
                        </button>
                      )}
                    </div>
                  ) : (
                    objectives.filter(o => o.status === 'active').slice(0, 3).map((obj) => (
                      <div key={obj.id} className="space-y-2">
                        <div className="flex justify-between items-center text-[11px] font-semibold">
                          <span className="text-gray-700 font-medium truncate max-w-[200px]" title={obj.title}>
                            {obj.title}
                          </span>
                          <span className="text-gold-600 font-bold">{obj.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-100 shadow-3xs">
                          <div 
                            className="bg-gold-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${obj.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {objectives.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-gray-400">
                      <span>Tổng số: {objectives.length} mục tiêu chiến dịch</span>
                      <button 
                        onClick={() => onNavigate('objectives')}
                        className="text-gold-500 hover:text-gold-700 font-bold flex items-center"
                      >
                        Chi tiết <ChevronRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )}

      {/* Kanban Board Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 text-gold-500 mr-2" />
              {isStaff ? "Bảng Kanban Tiến độ Công việc" : "Bảng Kanban vận hành & Phân công"}
            </h3>
            <p className="text-gray-500 text-xs mt-0.5">
              {isStaff 
                ? "Cập nhật tiến độ của các công việc được giao bằng cách kéo thả thẻ giữa các trạng thái."
                : "Phát hiện điểm nghẽn cổ chai và quản trị tiến độ theo các làn công việc trực quan."}
            </p>
          </div>
          
          {/* Segmented controls */}
          {!isStaff && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => {
                  setActiveKanban('orders');
                  setKanbanSuccess(null);
                  setKanbanError(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeKanban === 'orders' 
                    ? 'bg-white text-gold-950 shadow-xs' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Hành trình Đơn hàng
              </button>
              <button 
                onClick={() => {
                  setActiveKanban('tasks');
                  setKanbanSuccess(null);
                  setKanbanError(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeKanban === 'tasks' 
                    ? 'bg-white text-gold-950 shadow-xs' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Phân công Công việc
              </button>
            </div>
          )}
        </div>

        {/* Feedback Banners */}
        {kanbanSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs flex items-center animate-fade-in">
            <Check className="w-4 h-4 mr-2 text-emerald-600 shrink-0" /> {kanbanSuccess}
          </div>
        )}
        {kanbanError && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2.5 rounded-xl text-xs flex items-center animate-fade-in">
            <AlertCircle className="w-4 h-4 mr-2 text-red-600 shrink-0" /> {kanbanError}
          </div>
        )}

        {/* Actual Board content */}
        {activeKanban === 'orders' ? renderOrdersKanban() : renderTasksKanban()}
      </div>

      {/* Core Lists - Details sections below Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column - Shoots and Overdue lists */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Upcoming Shoots Table (Manager/Admin Only) */}
          {!isStaff ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-gold-500" />
                  <h3 className="font-bold text-gray-900 text-sm">Lịch chụp 7 ngày tới</h3>
                </div>
                <span className="bg-gold-100 text-gold-800 px-2 py-0.5 rounded-full text-[11px] font-bold">
                  {upcomingShoots.length} Buổi chụp
                </span>
              </div>
              
              <div className="overflow-x-auto text-xs">
                {upcomingShoots.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Calendar className="w-10 h-10 mx-auto opacity-30 mb-2" />
                    Không có lịch chụp nào trong 7 ngày tới.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        <th className="p-4 pl-6">Mã đơn</th>
                        <th className="p-4">Khách hàng</th>
                        <th className="p-4">Ngày chụp</th>
                        <th className="p-4">Gói dịch vụ</th>
                        <th className="p-4">Trạng thái</th>
                        <th className="p-4 text-right pr-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {upcomingShoots.map((shoot) => {
                        const isToday = shoot.shoot_date === new Date().toISOString().split('T')[0];
                        return (
                          <tr key={shoot.id} className={`hover:bg-gray-50/80 transition-colors ${isToday ? 'bg-amber-50/20' : ''}`}>
                            <td className="p-4 pl-6 font-mono font-bold text-gray-700">
                              {shoot.order_code}
                            </td>
                            <td className="p-4">
                              <p className="font-semibold text-gray-900">{shoot.customer_name}</p>
                              <p className="text-gray-400 flex items-center mt-0.5">
                                <Phone className="w-3 h-3 mr-1" /> {shoot.customer_phone}
                              </p>
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-gray-900">
                                {new Date(shoot.shoot_date).toLocaleDateString('vi-VN')}
                              </p>
                              <p className="text-gray-400 flex items-center mt-0.5">
                                <Clock className="w-3 h-3 mr-1" /> {shoot.shoot_time || 'Chưa hẹn giờ'}
                              </p>
                            </td>
                            <td className="p-4 text-gray-600 font-medium">
                              {shoot.package_name}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                shoot.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                shoot.status === 'shooting' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-gray-50 text-gray-700 border border-gray-100'
                              }`}>
                                {shoot.status === 'confirmed' ? 'Đã cọc' : 'Đang chụp'}
                              </span>
                            </td>
                            <td className="p-4 text-right pr-6">
                              <button 
                                onClick={() => onNavigate('orders', { selectOrderId: shoot.id })}
                                className="text-gold-500 hover:text-gold-700 transition-colors p-1"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            /* Staff Active Tasks List */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center space-x-2">
                  <CheckSquare className="w-5 h-5 text-gold-500" />
                  <h3 className="font-bold text-gray-900 text-sm">Danh sách tác vụ chưa làm của tôi</h3>
                </div>
                <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  {staffTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled').length} Chưa xong
                </span>
              </div>
              
              <div className="divide-y divide-gray-100">
                {staffTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled').length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    <Check className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                    Không còn công việc nào chưa hoàn thành. Bạn có thể tự do nghỉ ngơi!
                  </div>
                ) : (
                  staffTasks
                    .filter(t => t.status !== 'done' && t.status !== 'cancelled')
                    .map((task) => (
                      <div key={task.id} className="p-5 hover:bg-gray-50/40 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <h4 className="font-bold text-gray-950 text-sm">{task.title}</h4>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              task.priority === 'high' ? 'bg-red-50 text-red-700 border border-red-100' :
                              task.priority === 'normal' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-50 text-gray-600 border border-gray-100'
                            }`}>
                              {task.priority === 'high' ? 'Gấp' : 'Thường'}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              task.status === 'in_progress' ? 'bg-amber-50 text-amber-700' : 'bg-yellow-50 text-yellow-700'
                            }`}>
                              {task.status === 'in_progress' ? 'Đang làm' : 'Chờ nhận'}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-gray-400 text-xs line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-[11px] text-gray-400">
                            {task.order_code && (
                              <span className="font-mono text-gray-500 font-bold">Đơn: {task.order_code}</span>
                            )}
                            {task.customer_name && (
                              <span>Khách: <strong className="text-gray-600 font-medium">{task.customer_name}</strong></span>
                            )}
                            {task.due_date && (
                              <span className="flex items-center">
                                <Clock className="w-3.5 h-3.5 mr-1" /> Hạn: {new Date(task.due_date).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                          <button 
                            onClick={() => onNavigate('tasks', { selectTaskId: task.id })}
                            className="bg-gold-500 hover:bg-gold-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs flex items-center transition-colors"
                          >
                            Quản lý <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* Overdue Tasks List (Manager/Admin Only) */}
          {!isStaff && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold text-gray-900 text-sm">Công việc quá hạn cần đôn đốc</h3>
                </div>
                <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-[11px] font-bold">
                  {overdueTasks.length} Tác vụ trễ
                </span>
              </div>
              
              <div className="divide-y divide-gray-100 text-xs">
                {overdueTasks.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Check className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                    Không có công việc quá hạn nào. Vận hành tuyệt vời!
                  </div>
                ) : (
                  overdueTasks.map((task) => (
                    <div key={task.id} className="p-5 hover:bg-gray-50/30 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-gray-900 truncate max-w-[200px]">{task.title}</h4>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 border border-red-100">
                            QUÁ HẠN
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-[11px] text-gray-400 mt-1">
                          <span>Kỹ thuật viên: <strong className="text-gray-600 font-medium">{task.assigned_to_name}</strong></span>
                          {task.order_code && (
                            <span className="font-mono font-bold">Đơn: {task.order_code}</span>
                          )}
                          <span className="text-red-600 font-bold">
                            Hạn: {new Date(task.due_date).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => onNavigate('tasks', { selectTaskId: task.id })}
                        className="text-gold-500 hover:text-gold-700 font-semibold text-xs flex items-center transition-colors shrink-0"
                      >
                        Đôn đốc / Xem <ChevronRight className="w-4 h-4 ml-0.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column - Quick info & Recent customers */}
        <div className="space-y-8">
          
          {/* Recent Customers */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden text-xs">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gold-500" />
                <h3 className="font-bold text-gray-900 text-sm">Khách hàng mới</h3>
              </div>
              <span className="bg-gold-50 text-gold-800 px-2 py-0.5 rounded-full text-[11px] font-bold">
                {customers.length} tổng số
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {customers.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Users className="w-10 h-10 mx-auto opacity-30 mb-2" />
                  Chưa có thông tin khách hàng nào.
                </div>
              ) : (
                [...customers]
                  .sort((a, b) => b.created_at.localeCompare(a.created_at))
                  .slice(0, 4)
                  .map((customer) => (
                    <div key={customer.id} className="p-5 hover:bg-gray-50/50 transition-colors space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-gray-950 truncate block text-xs">
                            {customer.full_name}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-0.5">SĐT: <span className="text-gray-700 font-medium">{customer.phone}</span></p>
                          {customer.email && (
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">{customer.email}</p>
                          )}
                        </div>
                        <button 
                          onClick={() => onNavigate('customers', { selectCustomerId: customer.id })}
                          className="text-gold-500 hover:text-gold-700 font-bold shrink-0 text-[11px]"
                        >
                          Chi tiết
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Quick Studio Information & Contact */}
          <div className="bg-gold-50/30 rounded-2xl border border-gold-100/50 p-6 space-y-4">
            <h4 className="font-bold text-gray-900 text-sm flex items-center">
              <MapPin className="w-4.5 h-4.5 text-gold-500 mr-2" />
              Thông tin Chi nhánh Studio
            </h4>
            <div className="space-y-3 text-xs text-gray-600">
              <p>
                <strong>Trụ sở chính:</strong> {studioSettings?.address || '120 Hồ Văn Huê, P. 9, Q. Phú Nhuận, TP. Hồ Chí Minh'}
              </p>
              <p>
                <strong>Hotline CSKH:</strong> {studioSettings?.phone || '1900 8888 (Phím 1)'}
              </p>
              {studioSettings?.email && (
                <p>
                  <strong>Email CSKH:</strong> {studioSettings?.email}
                </p>
              )}
              {studioSettings?.opening_hours && (
                <p>
                  <strong>Giờ hoạt động:</strong> {studioSettings?.opening_hours}
                </p>
              )}
              {studioSettings?.website && (
                <p>
                  <strong>Website:</strong> <a href={studioSettings.website} target="_blank" rel="noreferrer" className="text-gold-600 hover:underline">{studioSettings.website}</a>
                </p>
              )}
            </div>
            <div className="border-t border-gold-100 pt-4 flex justify-between items-center text-[10px] text-gray-400">
              <span>Hệ thống {studioSettings?.name || 'The Will Studio'} v1.0.0</span>
              <span className="text-emerald-600 font-semibold flex items-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                Kết nối Máy chủ Sẵn sàng
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
