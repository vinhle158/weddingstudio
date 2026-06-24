import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  User, 
  Plus, 
  X, 
  History, 
  MessageSquare, 
  ChevronRight, 
  Tag, 
  Briefcase,
  Play,
  CheckCircle,
  XCircle,
  FileText,
  RefreshCw
} from 'lucide-react';

interface TasksProps {
  userRole: string;
  userId: string;
  onNavigate: (tab: string, arg?: any) => void;
  initialSelectedTaskId?: string;
}

export default function Tasks({ 
  userRole, 
  userId, 
  onNavigate, 
  initialSelectedTaskId 
}: TasksProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStaff, setFilterStaff] = useState('');

  // Selected Task details
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Task creation state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskOrderId, setTaskOrderId] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');
  const [taskPriority, setTaskPriority] = useState('normal');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Add Comment/Update log state
  const [commentText, setCommentText] = useState('');
  const [commentStatusChange, setCommentStatusChange] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      let query = '';
      const params = [];
      if (filterStatus) params.push(`status=${filterStatus}`);
      if (filterPriority) params.push(`priority=${filterPriority}`);
      if (filterStaff) params.push(`assigned_to=${filterStaff}`);
      if (params.length > 0) query = '?' + params.join('&');

      const data = await apiRequest(`/api/tasks${query}`);
      setTasks(data);

      if (initialSelectedTaskId) {
        const found = data.find((t: any) => t.id === initialSelectedTaskId);
        if (found) {
          fetchTaskDetail(found.id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách công việc');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [users, ords] = await Promise.all([
        apiRequest('/api/users'),
        apiRequest('/api/orders')
      ]);
      setStaffUsers(users.filter((u: any) => u.is_active));
      setOrders(ords);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchDropdowns();
  }, [filterStatus, filterPriority, filterStaff]);

  const fetchTaskDetail = async (taskId: string) => {
    try {
      setDetailLoading(true);
      const detail = await apiRequest(`/api/tasks/${taskId}`);
      setSelectedTask(detail);
      setCommentStatusChange(detail.status);
    } catch (err: any) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setCreateError(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskOrderId('');
    setTaskAssignedTo('');
    setTaskPriority('normal');
    setTaskDueDate('');
    setIsCreateOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!taskTitle || !taskAssignedTo) {
      setCreateError('Tiêu đề công việc và nhân viên chịu trách nhiệm là bắt buộc');
      return;
    }

    try {
      const created = await apiRequest('/api/tasks', 'POST', {
        title: taskTitle,
        description: taskDesc || null,
        order_id: taskOrderId || null,
        assigned_to: taskAssignedTo,
        priority: taskPriority,
        due_date: taskDueDate || null
      });

      setIsCreateOpen(false);
      fetchTasks();
      fetchTaskDetail(created.id);
    } catch (err: any) {
      setCreateError(err.message || 'Không thể tạo công việc');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);

    if (!commentText) {
      setCommentError('Vui lòng điền nội dung báo cáo tiến độ');
      return;
    }

    try {
      await apiRequest(`/api/tasks/${selectedTask.id}/updates`, 'POST', {
        comment: commentText,
        status_changed_to: commentStatusChange || undefined
      });

      setCommentText('');
      fetchTaskDetail(selectedTask.id);
      fetchTasks(); // Refresh left sidebar list to update status pill
    } catch (err: any) {
      setCommentError(err.message || 'Lỗi lưu bình luận');
    }
  };

  const handleQuickStatusChange = async (targetStatus: string) => {
    try {
      await apiRequest(`/api/tasks/${selectedTask.id}/updates`, 'POST', {
        comment: `Đã thay đổi trạng thái công việc sang: ${targetStatus.toUpperCase()}`,
        status_changed_to: targetStatus
      });
      fetchTaskDetail(selectedTask.id);
      fetchTasks();
    } catch (err: any) {
      alert(err.message || 'Không thể đổi nhanh trạng thái');
    }
  };

  const isStaff = userRole === 'staff' || userRole === 'photographer' || userRole === 'editor';
  const canAssign = userRole === 'admin' || userRole === 'manager';

  const statusMap: Record<string, { label: string, color: string }> = {
    pending: { label: 'Chờ nhận việc', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    in_progress: { label: 'Đang làm', color: 'bg-gold-50 text-gold-800 border-gold-200/50' },
    done: { label: 'Đã hoàn thành', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  };

  const priorityMap: Record<string, { label: string, color: string }> = {
    low: { label: 'Thấp', color: 'bg-gray-100 text-gray-600' },
    normal: { label: 'Thường', color: 'bg-gold-50/50 text-gold-800' },
    high: { label: 'KHẨN CẤP', color: 'bg-red-50 text-red-700 font-bold animate-pulse' },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Task Listing Sidebar */}
      <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-xs h-fit">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">Phân công việc</h3>
          {canAssign && (
            <button 
              onClick={handleOpenCreateModal}
              className="bg-gold-500 hover:bg-gold-600 text-white p-2 rounded-xl text-xs font-semibold shadow-xs flex items-center transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" /> Giao việc
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trạng thái</label>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-gold-500"
              >
                <option value="">-- Tất cả --</option>
                {Object.entries(statusMap).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Độ ưu tiên</label>
              <select 
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-gold-500"
              >
                <option value="">-- Tất cả --</option>
                {Object.entries(priorityMap).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {!isStaff && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lọc nhân viên</label>
              <select 
                value={filterStaff}
                onChange={(e) => setFilterStaff(e.target.value)}
                className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-gold-500"
              >
                <option value="">-- Tất cả nhân viên --</option>
                {staffUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Task List */}
        <div className="pt-2">
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Đang tải danh sách...</div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5" />
              {error}
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">Không tìm thấy công việc nào.</div>
          ) : (
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {tasks.map((task) => {
                const isSelected = selectedTask?.id === task.id;
                const badge = statusMap[task.status] || { label: task.status, color: 'bg-gray-100' };
                const prio = priorityMap[task.priority] || { label: task.priority, color: 'bg-gray-100' };
                return (
                  <div 
                    key={task.id}
                    onClick={() => fetchTaskDetail(task.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border text-left ${
                      isSelected 
                        ? 'bg-gold-50/50 border-gold-300 text-gold-950 shadow-xs' 
                        : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${prio.color}`}>
                        {prio.label}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm mt-2">{task.title}</h4>
                    {!isStaff && (
                      <p className="text-[10px] text-gray-400 mt-1 flex items-center">
                        <User className="w-3.5 h-3.5 mr-1 text-gray-400" /> Phụ trách: <strong className="ml-1 text-gray-500">{task.assigned_to_name}</strong>
                      </p>
                    )}
                    <div className="text-[10px] text-gray-400 mt-1 flex justify-between items-center">
                      {task.order_code && <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[9px]">Đơn: {task.order_code}</span>}
                      {task.due_date && <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> Hạn: {new Date(task.due_date).toLocaleDateString('vi-VN')}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Task Details and Log pane */}
      <div className="lg:col-span-2 space-y-6">
        {detailLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-xs h-96 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-gold-500" />
            <span className="ml-3">Đang tải chi tiết công việc...</span>
          </div>
        ) : selectedTask ? (
          <div className="space-y-6">
            
            {/* Primary Details Panel */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-xs space-y-6">
              <div className="flex justify-between items-start flex-wrap gap-4 border-b border-gray-100 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${statusMap[selectedTask.status]?.color}`}>
                      {statusMap[selectedTask.status]?.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${priorityMap[selectedTask.priority]?.color}`}>
                      Độ ưu tiên: {priorityMap[selectedTask.priority]?.label}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-950 mt-3">{selectedTask.title}</h2>
                </div>

                {/* Quick actions for staff/users to work task */}
                <div className="flex gap-2">
                  {selectedTask.status === 'pending' && (
                    <button 
                      onClick={() => handleQuickStatusChange('in_progress')}
                      className="bg-gold-500 hover:bg-gold-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center transition-colors shadow-xs"
                    >
                      <Play className="w-4 h-4 mr-1.5" /> Nhận việc ngay
                    </button>
                  )}
                  {selectedTask.status === 'in_progress' && (
                    <button 
                      onClick={() => handleQuickStatusChange('done')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center transition-colors shadow-xs"
                    >
                      <CheckCircle className="w-4 h-4 mr-1.5" /> Hoàn thành việc
                    </button>
                  )}
                </div>
              </div>

              {/* Task info grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thông tin phân công</h4>
                  <p className="text-sm text-gray-600">Được phân công cho: <strong className="text-gray-900">{selectedTask.assigned_to_name}</strong></p>
                  <p className="text-sm text-gray-600">Người giao việc: <span className="text-gray-800">{selectedTask.assigned_by_name}</span></p>
                  <p className="text-sm text-gray-600 flex items-center">
                    <Clock className="w-4 h-4 text-gray-400 mr-1.5" /> Hạn chót: 
                    <span className={`ml-1 font-semibold ${selectedTask.due_date && selectedTask.due_date < new Date().toISOString().split('T')[0] && selectedTask.status !== 'done' ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                      {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString('vi-VN') : 'Không giới hạn'}
                    </span>
                  </p>
                </div>

                {selectedTask.order && (
                  <div className="bg-gold-50/20 p-4 rounded-xl border border-gold-100/50 space-y-2">
                    <h4 className="text-xs font-bold text-gold-700 uppercase tracking-wider flex items-center">
                      <Briefcase className="w-3.5 h-3.5 mr-1" /> Hợp đồng liên quan
                    </h4>
                    <p className="text-sm">
                      Mã đơn hàng: <strong 
                        onClick={() => onNavigate('orders', { selectOrderId: selectedTask.order.id })}
                        className="text-gold-600 hover:underline cursor-pointer font-mono"
                      >
                        {selectedTask.order.order_code}
                      </strong>
                    </p>
                    <p className="text-xs text-gray-600">Khách hàng: <strong>{selectedTask.customer?.full_name}</strong></p>
                    <p className="text-xs text-gray-600">Gói dịch vụ: {selectedTask.order.package_name}</p>
                    <button 
                      onClick={() => onNavigate('orders', { selectOrderId: selectedTask.order.id })}
                      className="text-[10px] text-gold-600 hover:text-gold-700 font-bold uppercase tracking-wider flex items-center mt-1"
                    >
                      Xem toàn bộ hợp đồng <ChevronRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                )}
              </div>

              {selectedTask.description && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center mb-1">
                    <FileText className="w-3.5 h-3.5 mr-1.5" /> Chỉ dẫn chi tiết công việc
                  </p>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{selectedTask.description}</p>
                </div>
              )}
            </div>

            {/* Updates timeline & comments log */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-6">
              <h3 className="font-bold text-gray-950 flex items-center pb-3 border-b border-gray-100 text-lg">
                <MessageSquare className="w-5 h-5 text-gold-500 mr-2" /> Báo cáo tiến độ & Nhật ký công việc
              </h3>

              {/* Comment submission form */}
              <form onSubmit={handleAddComment} className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                {commentError && (
                  <div className="bg-red-50 text-red-600 p-2 rounded-lg text-xs flex items-center">
                    <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                    {commentError}
                  </div>
                )}
                
                <div className="flex gap-4 flex-col sm:flex-row">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Báo cáo cập nhật tiến độ chi tiết *</label>
                    <textarea 
                      rows={2}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Ví dụ: Đã nhận file ảnh gốc, đang làm layout ảnh album demo..."
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-gold-500 resize-none"
                      required
                    />
                  </div>

                  <div className="w-full sm:w-48 shrink-0">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Cập nhật trạng thái</label>
                    <select 
                      value={commentStatusChange}
                      onChange={(e) => setCommentStatusChange(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none"
                    >
                      <option value="">-- Giữ nguyên --</option>
                      {Object.entries(statusMap).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button 
                    type="submit"
                    className="bg-gold-500 hover:bg-gold-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
                  >
                    Gửi báo cáo cập nhật
                  </button>
                </div>
              </form>

              {/* Log updates history listing */}
              <div className="relative border-l-2 border-gray-100 ml-4 space-y-6 pt-2">
                {selectedTask.updates?.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 pl-4 italic">Chưa có cập nhật tiến độ nào.</p>
                ) : (
                  selectedTask.updates?.map((up: any) => (
                    <div key={up.id} className="relative pl-6">
                      <span className="absolute -left-1.5 top-1 bg-white border-2 border-gold-400 rounded-full w-3.5 h-3.5"></span>
                      <p className="text-xs text-gray-400">
                        {new Date(up.created_at).toLocaleString('vi-VN')} • Báo cáo bởi: <strong className="text-gray-700">{up.updated_by_name}</strong>
                      </p>
                      
                      {up.status_changed_to && (
                        <p className="text-xs mt-1.5 flex items-center">
                          <span className="text-gray-400 uppercase mr-1">Chuyển sang trạng thái:</span>
                          <span className="bg-gold-50 text-gold-800 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">{up.status_changed_to}</span>
                        </p>
                      )}

                      <p className="text-sm text-gray-800 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100/50">
                        {up.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-xs flex flex-col items-center justify-center h-80">
            <CheckSquare className="w-12 h-12 opacity-30 mb-3" />
            <h3 className="text-base font-semibold text-gray-700">Chọn công việc để xem chi tiết tiến độ</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-sm">Bộ lọc trạng thái và nhân viên giúp bạn phân loại dễ dàng hơn.</p>
          </div>
        )}
      </div>

      {/* Task Creation Modal Form (Manager/Admin Only) */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden border border-gray-100 animate-scale-in">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-base">Giao công việc nội bộ</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                  {createError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Tiêu đề công việc *</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Chụp ảnh Album tiệc cưới"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-gold-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Nhân viên chịu trách nhiệm *</label>
                <select 
                  value={taskAssignedTo}
                  onChange={(e) => setTaskAssignedTo(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none"
                  required
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {staffUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Liên kết Đơn hàng / Hợp đồng (nếu có)</label>
                <select 
                  value={taskOrderId}
                  onChange={(e) => setTaskOrderId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none"
                >
                  <option value="">-- Không liên kết --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>[{o.order_code}] - {o.customer_name} ({o.package_name})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Mức độ ưu tiên</label>
                  <select 
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none"
                  >
                    <option value="low">Thấp</option>
                    <option value="normal">Bình thường</option>
                    <option value="high">Khẩn cấp</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Hạn chót hoàn thành</label>
                  <input 
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Mô tả công việc</label>
                <textarea 
                  rows={2}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Lưu ý cụ thể, file concept..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsCreateOpen(false)}
                  className="w-1/2 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-xl text-xs font-semibold"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="w-1/2 bg-gold-500 hover:bg-gold-600 text-white py-2 rounded-xl text-xs font-semibold shadow-xs"
                >
                  Giao công việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
