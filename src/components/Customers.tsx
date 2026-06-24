import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { 
  Search, 
  Plus, 
  UserPlus, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Edit, 
  History, 
  Calendar, 
  Tag, 
  ChevronRight,
  X,
  AlertCircle
} from 'lucide-react';

interface CustomersProps {
  userRole: string;
  onNavigate: (tab: string, arg?: any) => void;
  initialSelectedCustomerId?: string;
}

export default function Customers({ userRole, onNavigate, initialSelectedCustomerId }: CustomersProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiRequest(`/api/customers?q=${encodeURIComponent(searchQuery)}`);
      setCustomers(data);

      if (initialSelectedCustomerId) {
        const found = data.find((c: any) => c.id === initialSelectedCustomerId);
        if (found) {
          handleSelectCustomer(found);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery]);

  const handleSelectCustomer = async (cust: any) => {
    setSelectedCustomer(cust);
    setOrdersLoading(true);
    try {
      const orders = await apiRequest(`/api/customers/${cust.id}/orders`);
      setCustomerOrders(orders);
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleOpenCreateForm = () => {
    setIsEditing(false);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormNotes('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (cust: any) => {
    setIsEditing(true);
    setFormName(cust.full_name);
    setFormPhone(cust.phone);
    setFormEmail(cust.email || '');
    setFormAddress(cust.address || '');
    setFormNotes(cust.notes || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone) {
      setFormError('Vui lòng điền đầy đủ họ tên và số điện thoại');
      return;
    }

    try {
      if (isEditing && selectedCustomer) {
        const updated = await apiRequest(`/api/customers/${selectedCustomer.id}`, 'PUT', {
          full_name: formName,
          phone: formPhone,
          email: formEmail,
          address: formAddress,
          notes: formNotes
        });
        setSelectedCustomer(updated);
        setIsFormOpen(false);
        fetchCustomers();
      } else {
        const created = await apiRequest('/api/customers', 'POST', {
          full_name: formName,
          phone: formPhone,
          email: formEmail,
          address: formAddress,
          notes: formNotes
        });
        setIsFormOpen(false);
        fetchCustomers();
        handleSelectCustomer(created);
      }
    } catch (err: any) {
      setFormError(err.message || 'Lỗi lưu thông tin khách hàng');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const canEdit = userRole === 'admin' || userRole === 'manager';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Customers List Sidebar */}
      <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-xs h-fit">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-lg">Khách hàng</h3>
          {canEdit && (
            <button 
              onClick={handleOpenCreateForm}
              className="bg-gold-500 hover:bg-gold-600 text-white p-2 rounded-xl text-xs font-semibold shadow-xs flex items-center transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input 
            type="text" 
            placeholder="Tìm tên, SĐT, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-gold-500 transition-colors"
          />
        </div>

        {/* Loading / Error states */}
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Đang tải danh sách...</div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs flex items-center">
            <AlertCircle className="w-4 h-4 mr-1.5" />
            {error}
          </div>
        ) : customers.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Không tìm thấy khách hàng nào.</div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {customers.map((cust) => {
              const isSelected = selectedCustomer?.id === cust.id;
              return (
                <div 
                  key={cust.id}
                  onClick={() => handleSelectCustomer(cust)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${
                    isSelected 
                      ? 'bg-gold-50/50 border-gold-300 text-gold-950 shadow-xs' 
                      : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <h4 className="font-semibold text-sm">{cust.full_name}</h4>
                  <p className="text-xs text-gray-400 flex items-center mt-1">
                    <Phone className="w-3 h-3 mr-1" /> {cust.phone}
                  </p>
                  {cust.email && (
                    <p className="text-xs text-gray-400 flex items-center mt-0.5 truncate">
                      <Mail className="w-3 h-3 mr-1" /> {cust.email}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer details & History panel */}
      <div className="lg:col-span-2 space-y-6">
        {selectedCustomer ? (
          <div className="space-y-6">
            {/* Customer detail card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-xs space-y-6">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900">{selectedCustomer.full_name}</h2>
                  <p className="text-xs text-gray-400 mt-1 font-mono uppercase">ID: {selectedCustomer.id}</p>
                </div>
                {canEdit && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleOpenEditForm(selectedCustomer)}
                      className="border border-gray-200 hover:bg-gray-50 text-gray-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1.5 text-gray-500" /> Sửa thông tin
                    </button>
                    <button 
                      onClick={() => onNavigate('orders', { openCreateForCustomerId: selectedCustomer.id })}
                      className="bg-gold-500 hover:bg-gold-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Tạo đơn hàng mới
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-6">
                <div className="space-y-3.5">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
                    <strong>Điện thoại:</strong>
                    <span className="ml-2 text-gray-900 font-medium">{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
                    <strong>Email:</strong>
                    <span className="ml-2 text-gray-950">{selectedCustomer.email || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2.5 mt-0.5 shrink-0" />
                    <strong>Địa chỉ:</strong>
                    <span className="ml-2 text-gray-950">{selectedCustomer.address || 'Chưa cập nhật'}</span>
                  </div>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center mb-2">
                    <FileText className="w-3.5 h-3.5 mr-1 text-gray-500" /> Ghi chú nội bộ
                  </p>
                  <p className="text-sm text-gray-600 italic whitespace-pre-line">
                    {selectedCustomer.notes || 'Không có ghi chú.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Orders History */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs">
              <h3 className="font-bold text-gray-900 text-lg flex items-center pb-4 border-b border-gray-100">
                <History className="w-5 h-5 text-gold-500 mr-2" /> Lịch sử đơn hàng
              </h3>

              {ordersLoading ? (
                <div className="py-12 text-center text-gray-400 text-sm">Đang tải lịch sử đơn hàng...</div>
              ) : customerOrders.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  <Calendar className="w-10 h-10 mx-auto opacity-30 mb-2" />
                  Chưa có đơn hàng nào cho khách hàng này.
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {customerOrders.map((order) => (
                    <div 
                      key={order.id} 
                      onClick={() => onNavigate('orders', { selectOrderId: order.id })}
                      className="py-4 hover:bg-gray-50/50 cursor-pointer transition-colors flex items-center justify-between group px-2 rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-semibold text-xs text-gray-700">{order.order_code}</span>
                          <span className="text-sm font-semibold text-gray-900">{order.package_name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                            order.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-gold-50 text-gold-700'
                          }`}>
                            {order.status === 'new' ? 'Mới' :
                             order.status === 'confirmed' ? 'Đã xác nhận' :
                             order.status === 'shooting' ? 'Đang chụp' :
                             order.status === 'editing' ? 'Hậu kỳ' :
                             order.status === 'ready' ? 'Xong ảnh' :
                             order.status === 'delivered' ? 'Đã giao' : 'Đã hủy'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <span>Ngày chụp: {new Date(order.shoot_date).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gold-500 transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-xs flex flex-col items-center justify-center h-80">
            <UserPlus className="w-12 h-12 opacity-30 mb-3" />
            <h3 className="text-base font-semibold text-gray-700">Chọn khách hàng để xem thông tin chi tiết</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-sm">Hoặc nhấn nút cộng ở danh sách bên trái để tạo hồ sơ khách hàng mới.</p>
          </div>
        )}
      </div>

      {/* Customer Edit / Create Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden border border-gray-100 animate-scale-in">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 text-base">
                {isEditing ? 'Cập nhật thông tin khách hàng' : 'Thêm khách hàng mới'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Họ và tên *</label>
                <input 
                  type="text" 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-gold-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Số điện thoại *</label>
                <input 
                  type="text" 
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Ví dụ: 0901234567"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-gold-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Email (nếu có)</label>
                <input 
                  type="email" 
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Ví dụ: example@domain.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Địa chỉ</label>
                <input 
                  type="text" 
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Ví dụ: 123 Đường ABC, Quận XYZ"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Ghi chú thêm</label>
                <textarea 
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Sở thích, yêu cầu đặc biệt của khách..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-gold-500 resize-none"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="w-1/2 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2 rounded-xl text-xs font-semibold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="w-1/2 bg-gold-500 hover:bg-gold-600 text-white py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  Lưu hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
