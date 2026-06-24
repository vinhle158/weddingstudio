import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Tag, 
  DollarSign, 
  FileText, 
  User, 
  Shirt, 
  CheckSquare, 
  History, 
  AlertCircle, 
  X, 
  ChevronRight, 
  RefreshCw,
  Phone,
  Briefcase
} from 'lucide-react';

interface OrdersProps {
  userRole: string;
  onNavigate: (tab: string, arg?: any) => void;
  initialSelectedOrderId?: string;
  initialOpenCreateForCustomerId?: string;
}

export default function Orders({ 
  userRole, 
  onNavigate, 
  initialSelectedOrderId,
  initialOpenCreateForCustomerId 
}: OrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStaff, setFilterStaff] = useState('');

  // Selected Order details
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  // Dropdowns for form
  const [customers, setCustomers] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Order status transition form state
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);

  // New Order form state (including inline customer)
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [formCustomerId, setFormCustomerId] = useState('');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [shootDate, setShootDate] = useState('');
  const [shootTime, setShootTime] = useState('');
  const [packageName, setPackageName] = useState('');
  const [packagePrice, setPackagePrice] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [orderNotes, setOrderNotes] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Internal Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');
  const [taskPriority, setTaskPriority] = useState('normal');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskError, setTaskError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      let query = '';
      const params = [];
      if (filterStatus) params.push(`status=${filterStatus}`);
      if (filterDate) params.push(`date=${filterDate}`);
      if (filterStaff) params.push(`assigned_staff=${filterStaff}`);
      if (params.length > 0) query = '?' + params.join('&');

      const data = await apiRequest(`/api/orders${query}`);
      setOrders(data);

      if (initialSelectedOrderId) {
        const found = data.find((o: any) => o.id === initialSelectedOrderId);
        if (found) {
          fetchOrderDetail(found.id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [custs, users] = await Promise.all([
        apiRequest('/api/customers'),
        apiRequest('/api/users')
      ]);
      setCustomers(custs);
      setStaffUsers(users.filter((u: any) => u.is_active));
    } catch (e) {
      console.error('Error fetching dropdowns:', e);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchDropdowns();
  }, [filterStatus, filterDate, filterStaff]);

  useEffect(() => {
    if (initialOpenCreateForCustomerId && customers.length > 0) {
      setIsNewCustomer(false);
      setFormCustomerId(initialOpenCreateForCustomerId);
      setIsCreateModalOpen(true);
    }
  }, [initialOpenCreateForCustomerId, customers]);

  const fetchOrderDetail = async (orderId: string) => {
    try {
      setOrderDetailLoading(true);
      const detail = await apiRequest(`/api/orders/${orderId}`);
      setSelectedOrder(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setOrderDetailLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setCreateError(null);
    setIsNewCustomer(false);
    setFormCustomerId('');
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setCustAddress('');
    setShootDate('');
    setShootTime('');
    setPackageName('');
    setPackagePrice(0);
    setDepositAmount(0);
    setOrderNotes('');
    setIsCreateModalOpen(true);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    try {
      let finalCustomerId = formCustomerId;

      // Create inline customer if requested
      if (isNewCustomer) {
        if (!custName || !custPhone) {
          setCreateError('Họ tên và SĐT của khách hàng mới là bắt buộc');
          return;
        }
        const newCust = await apiRequest('/api/customers', 'POST', {
          full_name: custName,
          phone: custPhone,
          email: custEmail || null,
          address: custAddress || null
        });
        finalCustomerId = newCust.id;
      }

      if (!finalCustomerId) {
        setCreateError('Vui lòng chọn hoặc tạo mới một khách hàng');
        return;
      }

      if (!shootDate || !packageName) {
        setCreateError('Vui lòng nhập ngày chụp và tên gói dịch vụ');
        return;
      }

      const createdOrder = await apiRequest('/api/orders', 'POST', {
        customer_id: finalCustomerId,
        shoot_date: shootDate,
        shoot_time: shootTime || null,
        package_name: packageName,
        package_price: 0,
        deposit_amount: 0,
        total_amount: 0,
        notes: orderNotes || null
      });

      setIsCreateModalOpen(false);
      fetchOrders();
      fetchOrderDetail(createdOrder.id);
    } catch (err: any) {
      setCreateError(err.message || 'Lỗi khi lưu đơn hàng mới');
    }
  };

  // Status transition form handling
  const handleOpenStatusModal = () => {
    if (!selectedOrder) return;
    setNewStatus(selectedOrder.status);
    setStatusNote('');
    setStatusError(null);
    setIsStatusModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError(null);
    if (newStatus === selectedOrder.status) {
      setIsStatusModalOpen(false);
      return;
    }

    try {
      await apiRequest(`/api/orders/${selectedOrder.id}/status`, 'POST', {
        status: newStatus,
        note: statusNote || undefined
      });
      setIsStatusModalOpen(false);
      fetchOrders();
      fetchOrderDetail(selectedOrder.id);
    } catch (err: any) {
      setStatusError(err.message || 'Lỗi khi thay đổi trạng thái');
    }
  };

  // Internal Task assignment form handling
  const handleOpenTaskModal = () => {
    if (!selectedOrder) return;
    setTaskError(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskAssignedTo('');
    setTaskPriority('normal');
    setTaskDueDate('');
    setIsTaskModalOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskError(null);

    if (!taskTitle || !taskAssignedTo) {
      setTaskError('Tiêu đề công việc và nhân viên chịu trách nhiệm là bắt buộc');
      return;
    }

    try {
      await apiRequest('/api/tasks', 'POST', {
        title: taskTitle,
        description: taskDesc || null,
        order_id: selectedOrder.id,
        assigned_to: taskAssignedTo,
        priority: taskPriority,
        due_date: taskDueDate || null
      });

      setIsTaskModalOpen(false);
      fetchOrderDetail(selectedOrder.id);
    } catch (err: any) {
      setTaskError(err.message || 'Lỗi khi giao công việc');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const statusMap: Record<string, { label: string, color: string }> = {
    new: { label: 'Đơn mới', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    confirmed: { label: 'Đã xác nhận', color: 'bg-sky-50 text-sky-700 border-sky-100' },
    shooting: { label: 'Đang chụp', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    editing: { label: 'Đang hậu kỳ', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    ready: { label: 'Ảnh đã xong', color: 'bg-purple-50 text-purple-700 border-purple-100' },
    delivered: { label: 'Hoàn tất', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    cancelled: { label: 'Đã hủy', color: 'bg-rose-50 text-rose-700 border-rose-100' },
  };

  const canEdit = userRole === 'admin' || userRole === 'manager';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Orders List Sidebar */}
      <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-xs h-fit">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">Đơn hàng</h3>
          {canEdit && (
            <button 
              onClick={handleOpenCreateModal}
              className="bg-gold-500 hover:bg-gold-600 text-white p-2 rounded-xl text-xs font-semibold shadow-xs flex items-center transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" /> Ký hợp đồng
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-3 pt-1">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trạng thái</label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:border-gold-500"
            >
              <option value="">-- Tất cả trạng thái --</option>
              {Object.entries(statusMap).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ngày chụp</label>
              <input 
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-gold-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nhân viên</label>
              <select 
                value={filterStaff}
                onChange={(e) => setFilterStaff(e.target.value)}
                className="w-full mt-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:outline-none"
              >
                <option value="">-- Chọn --</option>
                {staffUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Orders Listing */}
        <div className="pt-2">
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Đang tải danh sách...</div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5" />
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">Không tìm thấy đơn hàng nào.</div>
          ) : (
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {orders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                const badge = statusMap[order.status] || { label: order.status, color: 'bg-gray-100' };
                return (
                  <div 
                    key={order.id}
                    onClick={() => fetchOrderDetail(order.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      isSelected 
                        ? 'bg-gold-50/50 border-gold-300 text-gold-950 shadow-xs' 
                        : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-xs text-gray-700">{order.order_code}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm mt-1.5">{order.customer_name}</h4>
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                      <span className="truncate font-medium text-gray-600">{order.package_name}</span>
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" /> Chụp: {new Date(order.shoot_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Order Detailed Pane */}
      <div className="lg:col-span-2 space-y-6">
        {orderDetailLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-xs h-96 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-gold-500" />
            <span className="ml-3">Đang tải hồ sơ đơn hàng...</span>
          </div>
        ) : selectedOrder ? (
          <div className="space-y-6">
            
            {/* Primary Details Panel */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-xs space-y-6">
              <div className="flex justify-between items-start flex-wrap gap-4 border-b border-gray-100 pb-5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xl font-bold text-gray-800">{selectedOrder.order_code}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${statusMap[selectedOrder.status]?.color}`}>
                      {statusMap[selectedOrder.status]?.label}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold mt-2 text-gray-950">{selectedOrder.package_name}</h2>
                </div>

                {canEdit && (
                  <button 
                    onClick={handleOpenStatusModal}
                    className="bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs flex items-center transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Chuyển trạng thái
                  </button>
                )}
              </div>

              {/* Order Specific Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center">
                    <User className="w-3.5 h-3.5 mr-1 text-gold-500" /> Hồ sơ khách hàng
                  </h4>
                  <div className="pl-4 space-y-2">
                    <p className="text-sm text-gray-900 font-semibold">{selectedOrder.customer?.full_name}</p>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" /> {selectedOrder.customer?.phone}
                    </p>
                    {selectedOrder.customer?.email && (
                      <p className="text-xs text-gray-500 flex items-center">
                        <User className="w-3.5 h-3.5 mr-2 text-gray-400" /> {selectedOrder.customer?.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-gold-500" /> Thông tin lịch chụp
                  </h4>
                  <div className="pl-4 space-y-1.5 text-sm">
                    <p className="text-gray-600">Ngày chụp: <strong className="text-gray-900">{new Date(selectedOrder.shoot_date).toLocaleDateString('vi-VN')} {selectedOrder.shoot_time ? `(${selectedOrder.shoot_time})` : ''}</strong></p>
                    <p className="text-gray-600">Gói dịch vụ: <strong className="text-gold-600 font-semibold">{selectedOrder.package_name}</strong></p>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center mb-1">
                    <FileText className="w-3.5 h-3.5 mr-1.5" /> Ghi chú buổi chụp
                  </p>
                  <p className="text-sm text-gray-600 italic">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            {/* Tasks management */}
            <div className="w-full">
              
              {/* Tasks Assigned */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h4 className="font-bold text-gray-950 flex items-center text-sm">
                    <CheckSquare className="w-4 h-4 text-gold-500 mr-2" /> Việc nội bộ liên quan
                  </h4>
                  {canEdit && (
                    <button 
                      onClick={handleOpenTaskModal}
                      className="text-gold-500 hover:text-gold-600 font-semibold text-xs flex items-center"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Giao việc
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {selectedOrder.tasks?.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center">Chưa phân công công việc nội bộ nào.</p>
                  ) : (
                    selectedOrder.tasks?.map((tsk: any) => (
                      <div 
                        key={tsk.id} 
                        onClick={() => onNavigate('tasks', { selectTaskId: tsk.id })}
                        className="p-3 bg-gray-50/50 rounded-xl border border-gray-100/50 text-xs space-y-1 hover:border-gold-300 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900">{tsk.title}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase ${
                            tsk.status === 'done' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {tsk.status === 'done' ? 'Xong' : 'Đang làm'}
                          </span>
                        </div>
                        <p className="text-gray-500">Người nhận: <strong className="text-gray-700">{tsk.assigned_to_name}</strong></p>
                        {tsk.due_date && <p className="text-gray-400">Hạn chót: {new Date(tsk.due_date).toLocaleDateString('vi-VN')}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* History logs */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
              <h4 className="font-bold text-gray-950 flex items-center pb-2 border-b border-gray-100 text-sm">
                <History className="w-4 h-4 text-gold-500 mr-2" /> Nhật ký trạng thái đơn hàng
              </h4>
              <div className="relative border-l-2 border-gray-100 ml-4 space-y-6 pt-2">
                {selectedOrder.history?.map((hist: any, i: number) => (
                  <div key={hist.id || i} className="relative pl-6">
                    {/* Circle icon marker */}
                    <span className="absolute -left-1.5 top-1 bg-white border-2 border-gold-400 rounded-full w-3.5 h-3.5 flex items-center justify-center"></span>
                    <p className="text-xs text-gray-400">
                      {new Date(hist.changed_at).toLocaleString('vi-VN')} • Thực hiện bởi: <strong className="text-gray-700">{hist.changed_by_name}</strong>
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1 flex items-center">
                      {hist.from_status ? (
                        <>
                          <span className="text-gray-400 text-xs line-through uppercase mr-2">{hist.from_status}</span>
                          <span className="text-gray-500 text-xs mr-2">→</span>
                        </>
                      ) : null}
                      <span className="bg-gold-50 text-gold-800 px-1.5 py-0.5 rounded text-xs uppercase font-bold">{hist.to_status}</span>
                    </p>
                    {hist.note && (
                      <p className="text-xs text-gray-500 italic mt-1 bg-gray-50 p-2 rounded-lg border border-gray-100/50 inline-block">
                        {hist.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-xs flex flex-col items-center justify-center h-80">
            <Briefcase className="w-12 h-12 opacity-30 mb-3" />
            <h3 className="text-base font-semibold text-gray-700">Chọn đơn hàng để xem tài liệu hợp đồng chi tiết</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-sm">Dùng các bộ lọc ở cột trái để tìm kiếm hoặc tạo đơn mới.</p>
          </div>
        )}
      </div>

      {/* Contract/Order creation modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden border border-gray-100 animate-scale-in my-8">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-base">Hợp đồng chụp ảnh cưới mới</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                  {createError}
                </div>
              )}

              {/* Customer Selector Type */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Khách hàng</label>
                  <div className="flex space-x-2">
                    <button 
                      type="button" 
                      onClick={() => setIsNewCustomer(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                        !isNewCustomer ? 'bg-white border-gold-500 text-gold-800' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      Chọn từ danh sách
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsNewCustomer(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                        isNewCustomer ? 'bg-white border-gold-500 text-gold-800' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      + Tạo khách mới
                    </button>
                  </div>
                </div>

                {!isNewCustomer ? (
                  <select 
                    value={formCustomerId}
                    onChange={(e) => setFormCustomerId(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none"
                  >
                    <option value="">-- Chọn khách hàng --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name} ({c.phone})</option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <input 
                      type="text" 
                      placeholder="Họ tên *" 
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none"
                    />
                    <input 
                      type="text" 
                      placeholder="Số điện thoại *" 
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none"
                    />
                    <input 
                      type="email" 
                      placeholder="Email (tùy chọn)" 
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none col-span-2"
                    />
                    <input 
                      type="text" 
                      placeholder="Địa chỉ (tùy chọn)" 
                      value={custAddress}
                      onChange={(e) => setCustAddress(e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg p-2 text-xs focus:outline-none col-span-2"
                    />
                  </div>
                )}
              </div>

              {/* Service details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Ngày chụp *</label>
                  <input 
                    type="date"
                    value={shootDate}
                    onChange={(e) => setShootDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Giờ chụp (nếu có)</label>
                  <input 
                    type="time"
                    value={shootTime}
                    onChange={(e) => setShootTime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Tên gói dịch vụ *</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Gói Album Studio Cao Cấp"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none"
                  required
                />
              </div>



              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Ghi chú, yêu cầu thêm</label>
                <textarea 
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Yêu cầu chụp ngoại cảnh, phụ kiện thuê kèm..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-1/2 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="w-1/2 bg-gold-500 hover:bg-gold-600 text-white py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  Ký & Lưu hợp đồng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status change transition modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden border border-gray-100 animate-scale-in">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-base">Cập nhật tiến độ đơn hàng</h3>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              {statusError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                  {statusError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Trạng thái mới</label>
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none"
                >
                  {Object.entries(statusMap).map(([k, v]) => (
                    <option key={k} value={k}>{v.label} ({k.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Ghi chú lý do / Tiến độ</label>
                <textarea 
                  rows={3}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Ví dụ: Khách đã thanh toán nốt tiền cọc, chuyển sang thợ làm ảnh chỉnh sửa..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsStatusModalOpen(false)}
                  className="w-1/2 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-xl text-xs font-semibold"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="w-1/2 bg-gold-500 hover:bg-gold-600 text-white py-2 rounded-xl text-xs font-semibold shadow-xs"
                >
                  Xác nhận lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Internal Task Delegation Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden border border-gray-100 animate-scale-in">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-base">Giao công việc mới</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              {taskError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                  {taskError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Tiêu đề công việc *</label>
                <input 
                  type="text"
                  placeholder="Ví dụ: Chụp hình studio Hàn Quốc / Hậu kỳ album"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none"
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
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Mô tả công việc chi tiết</label>
                <textarea 
                  rows={2}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Yêu cầu cụ thể, concept chụp, số lượng ảnh photoshop..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsTaskModalOpen(false)}
                  className="w-1/2 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-xl text-xs font-semibold"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="w-1/2 bg-gold-500 hover:bg-gold-600 text-white py-2 rounded-xl text-xs font-semibold shadow-xs"
                >
                  Xác nhận giao việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
