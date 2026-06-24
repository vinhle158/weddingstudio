import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Types matching the schema specified in the Workflow Specification
export interface User {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role_id: string;
  is_active: boolean;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  permissions: string[];
}

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_code: string;
  customer_id: string;
  status: 'new' | 'confirmed' | 'shooting' | 'editing' | 'ready' | 'delivered' | 'cancelled';
  shoot_date: string; // YYYY-MM-DD
  shoot_time: string | null; // HH:MM
  package_name: string;
  package_price: number;
  deposit_amount: number;
  total_amount: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status: string;
  to_status: string;
  changed_by: string;
  note: string | null;
  changed_at: string;
}

export interface DressInventory {
  id: string;
  code: string;
  name: string;
  category: string;
  size: string;
  color: string;
  status: 'available' | 'rented' | 'maintenance';
  image_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface DressRental {
  id: string;
  dress_id: string;
  order_id: string;
  rented_date: string; // YYYY-MM-DD
  return_date: string; // YYYY-MM-DD
  returned_at: string | null;
  rental_fee: number;
  status: 'rented' | 'returned' | 'overdue';
  notes: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  order_id: string | null;
  assigned_to: string;
  assigned_by: string;
  status: 'pending' | 'in_progress' | 'done' | 'cancelled';
  priority: 'low' | 'normal' | 'high';
  due_date: string | null; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface TaskUpdate {
  id: string;
  task_id: string;
  updated_by: string;
  status_changed_to: string | null;
  comment: string;
  created_at: string;
}

export interface Objective {
  id: string;
  title: string;
  description: string | null;
  status: 'active' | 'completed' | 'cancelled';
  created_by: string; // user id
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface ObjectiveKeyResult {
  id: string;
  objective_id: string;
  title: string;
  assigned_department: string; // e.g. "Chụp ảnh", "Hậu kỳ", "Tư vấn & CSKH", "Marketing/Quảng cáo", "Tất cả"
  assigned_to_user_id: string | null; // direct user assignment
  status: 'pending' | 'in_progress' | 'completed';
  progress: number; // 0 to 100
  notes: string | null;
  updated_at: string;
}

export interface ObjectiveProgressUpdate {
  id: string;
  key_result_id: string;
  updated_by: string; // user id
  progress_from: number;
  progress_to: number;
  comment: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  sender_id: string; // sender user id
  receiver_id: string | null; // null means public global announcement, otherwise specific user id
  title: string;
  content: string;
  type: 'general' | 'task_assignment' | 'order_update' | 'system';
  related_id: string | null; // e.g., task_id or order_id
  is_read_by: string[]; // List of user IDs who have read this (especially for general announcements and direct notifications)
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string | null; // null means public global group chat, otherwise private to specific user id
  content: string;
  created_at: string;
}

export interface StudioSettings {
  name: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  opening_hours: string;
  notes: string;
  backup_schedule: 'daily' | 'weekly' | 'monthly' | 'none';
  last_backup_time: string;
}

export interface DatabaseBackup {
  id: string;
  filename: string;
  created_at: string;
  size_bytes: number;
  trigger_type: 'manual' | 'scheduled';
  status: 'success' | 'failed';
}

export interface DatabaseSchema {
  users: User[];
  roles: Role[];
  customers: Customer[];
  orders: Order[];
  order_status_history: OrderStatusHistory[];
  dress_inventory: DressInventory[];
  dress_rentals: DressRental[];
  tasks: Task[];
  task_updates: TaskUpdate[];
  objectives?: Objective[];
  objective_key_results?: ObjectiveKeyResult[];
  objective_progress_updates?: ObjectiveProgressUpdate[];
  notifications?: Notification[];
  chat_messages?: ChatMessage[];
  studio_settings?: StudioSettings;
  backups?: DatabaseBackup[];
}

const DB_FILE = path.join(process.cwd(), 'db.json');

const defaultRoles: Role[] = [
  {
    id: 'role-admin',
    name: 'admin',
    display_name: 'Điều hành (Full Quyền)',
    permissions: [
      'orders.view', 'orders.create', 'orders.edit',
      'tasks.view_own', 'tasks.view_all', 'tasks.assign',
      'customers.view', 'customers.edit',
      'inventory.view', 'inventory.edit',
      'reports.view', 'users.manage'
    ]
  },
  {
    id: 'role-manager',
    name: 'manager',
    display_name: 'Quản lý (hợp đồng, đơn hàng, quản lý khách hàng, trò chuyện, nhận thông báo)',
    permissions: [
      'orders.view', 'orders.create', 'orders.edit',
      'tasks.view_own', 'tasks.view_all', 'tasks.assign',
      'customers.view', 'customers.edit',
      'inventory.view', 'inventory.edit',
      'reports.view'
    ]
  },
  {
    id: 'role-staff',
    name: 'staff',
    display_name: 'Nhân viên (nhận thông tin công việc liên quan đến mình, cập nhật tiến độ, trò chuyện, nhận thông báo)',
    permissions: ['tasks.view_own']
  }
];

const defaultUsers: User[] = [
  {
    id: 'user-admin',
    full_name: 'Nguyễn Văn Admin',
    email: 'admin@studio.com',
    password_hash: 'admin123', // stored plain text for simple custom auth login
    role_id: 'role-admin',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user-manager',
    full_name: 'Trần Thị Manager',
    email: 'manager@studio.com',
    password_hash: 'manager123',
    role_id: 'role-manager',
    is_active: true,
    created_at: '2026-01-02T00:00:00Z'
  },
  {
    id: 'user-photo',
    full_name: 'Phạm Hải Nam (Staff)',
    email: 'photo@studio.com',
    password_hash: 'staff123',
    role_id: 'role-staff',
    is_active: true,
    created_at: '2026-01-03T00:00:00Z'
  },
  {
    id: 'user-editor',
    full_name: 'Lê Minh Hoàng (Staff)',
    email: 'editor@studio.com',
    password_hash: 'staff123',
    role_id: 'role-staff',
    is_active: true,
    created_at: '2026-01-04T00:00:00Z'
  }
];

const defaultCustomers: Customer[] = [
  {
    id: 'cust-1',
    full_name: 'Nguyễn Hoàng Long',
    phone: '0901234567',
    email: 'long.nh@gmail.com',
    address: '123 Nguyễn Huệ, Quận 1, TP. HCM',
    notes: 'Khách hàng VIP, kỹ tính, thích phong cách chụp tự nhiên.',
    created_at: '2026-06-10T10:00:00Z',
    updated_at: '2026-06-10T10:00:00Z'
  },
  {
    id: 'cust-2',
    full_name: 'Trần Thu Thảo',
    phone: '0918765432',
    email: 'thao.tt@gmail.com',
    address: '456 Lê Lợi, Quận 3, TP. HCM',
    notes: 'Yêu cầu chỉnh sửa nước ảnh trong sáng, lấy album trước tiệc cưới.',
    created_at: '2026-06-12T11:00:00Z',
    updated_at: '2026-06-12T11:00:00Z'
  },
  {
    id: 'cust-3',
    full_name: 'Lê Văn Tiến',
    phone: '0933445566',
    email: 'tien.lv@gmail.com',
    address: '789 Cách Mạng Tháng 8, Tân Bình, TP. HCM',
    notes: 'Đặt trọn gói chụp studio + thuê váy cưới cao cấp.',
    created_at: '2026-06-15T09:00:00Z',
    updated_at: '2026-06-15T09:00:00Z'
  }
];

const defaultDresses: DressInventory[] = [
  {
    id: 'dress-1',
    code: 'AO-001',
    name: 'Váy Cưới Trễ Vai Satin Luxury',
    category: 'váy cưới',
    size: 'M',
    color: 'Trắng tinh khôi',
    status: 'available',
    image_url: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&q=80&w=400',
    notes: 'Hàng cao cấp đính đá swarovski lấp lánh.',
    created_at: '2026-01-10T10:00:00Z'
  },
  {
    id: 'dress-2',
    code: 'AO-002',
    name: 'Váy Cưới Đuôi Cá Ren Phồng',
    category: 'váy cưới',
    size: 'S',
    color: 'Trắng kem',
    status: 'rented',
    image_url: 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?auto=format&fit=crop&q=80&w=400',
    notes: 'Ren mỏng tinh xảo, may ôm dáng quyến rũ.',
    created_at: '2026-01-11T10:00:00Z'
  },
  {
    id: 'dress-3',
    code: 'AO-003',
    name: 'Vest Chú Rể Hàn Quốc Premium',
    category: 'vest',
    size: 'L',
    color: 'Xanh Navy',
    status: 'available',
    image_url: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&q=80&w=400',
    notes: 'Vải cashmere chống nhăn nhập khẩu.',
    created_at: '2026-01-12T10:00:00Z'
  },
  {
    id: 'dress-4',
    code: 'AO-004',
    name: 'Áo Dài Cặp Long Phụng Đỏ',
    category: 'áo dài',
    size: 'M',
    color: 'Đỏ thêu rồng phượng',
    status: 'available',
    image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400',
    notes: 'Set áo dài nam + nữ thêu tay thủ công dùng cho ăn hỏi.',
    created_at: '2026-01-15T10:00:00Z'
  },
  {
    id: 'dress-5',
    code: 'AO-005',
    name: 'Váy Cưới Công Chúa Voan Xoè',
    category: 'váy cưới',
    size: 'M',
    color: 'Hồng Pastel',
    status: 'maintenance',
    image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&q=80&w=400',
    notes: 'Đang khâu lại phần voan lót ở chân váy.',
    created_at: '2026-01-20T10:00:00Z'
  }
];

const defaultOrders: Order[] = [
  {
    id: 'order-1',
    order_code: 'ORD-2026-001',
    customer_id: 'cust-1',
    status: 'editing',
    shoot_date: '2026-06-20',
    shoot_time: '08:30',
    package_name: 'Gói Album Studio Premium',
    package_price: 15000000,
    deposit_amount: 5000000,
    total_amount: 15000000,
    notes: 'Chụp studio concept Hàn Quốc + Ngoại cảnh Landmark 81',
    created_by: 'user-manager',
    created_at: '2026-06-14T15:30:00Z',
    updated_at: '2026-06-20T18:00:00Z'
  },
  {
    id: 'order-2',
    order_code: 'ORD-2026-002',
    customer_id: 'cust-2',
    status: 'confirmed',
    shoot_date: '2026-06-28',
    shoot_time: '14:00',
    package_name: 'Gói Chụp Tiệc Cưới VIP',
    package_price: 25000000,
    deposit_amount: 10000000,
    total_amount: 25000000,
    notes: 'Thuê thêm 1 váy cưới đuôi cá AO-002',
    created_by: 'user-manager',
    created_at: '2026-06-23T10:00:00Z',
    updated_at: '2026-06-23T10:00:00Z'
  },
  {
    id: 'order-3',
    order_code: 'ORD-2026-003',
    customer_id: 'cust-3',
    status: 'delivered',
    shoot_date: '2026-06-10',
    shoot_time: '09:00',
    package_name: 'Gói Studio Basic',
    package_price: 8000000,
    deposit_amount: 3000000,
    total_amount: 8000000,
    notes: 'Đã nhận ảnh gỗ và bàn giao file gốc. Đã hoàn tất trả đồ.',
    created_by: 'user-manager',
    created_at: '2026-06-05T09:00:00Z',
    updated_at: '2026-06-11T10:00:00Z'
  }
];

const defaultOrderHistory: OrderStatusHistory[] = [
  {
    id: 'hist-1',
    order_id: 'order-1',
    from_status: 'new',
    to_status: 'confirmed',
    changed_by: 'user-manager',
    note: 'Khách đã chuyển khoản đặt cọc 5tr',
    changed_at: '2026-06-14T15:30:00Z'
  },
  {
    id: 'hist-2',
    order_id: 'order-1',
    from_status: 'confirmed',
    to_status: 'shooting',
    changed_by: 'user-manager',
    note: 'Bắt đầu buổi chụp hình',
    changed_at: '2026-06-20T08:00:00Z'
  },
  {
    id: 'hist-3',
    order_id: 'order-1',
    from_status: 'shooting',
    to_status: 'editing',
    changed_by: 'user-manager',
    note: 'Chuyển file chụp sang thợ làm ảnh',
    changed_at: '2026-06-20T18:00:00Z'
  }
];

const defaultRentals: DressRental[] = [
  {
    id: 'rental-1',
    dress_id: 'dress-2',
    order_id: 'order-2',
    rented_date: '2026-06-27',
    return_date: '2026-06-29',
    returned_at: null,
    rental_fee: 2000000,
    status: 'rented',
    notes: 'Mượn trước 1 ngày để thử đồ.'
  },
  {
    id: 'rental-2',
    dress_id: 'dress-4',
    order_id: 'order-3',
    rented_date: '2026-06-09',
    return_date: '2026-06-11',
    returned_at: '2026-06-11T10:00:00Z',
    rental_fee: 1500000,
    status: 'returned',
    notes: 'Trả đồ đúng hạn, không hư hỏng rách ren.'
  }
];

const defaultTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Chụp ảnh Studio ORD-2026-001',
    description: 'Chụp concept 1 (Hàn Quốc) và concept 2 (Vintage). Địa điểm: Phòng Studio 1.',
    order_id: 'order-1',
    assigned_to: 'user-photo',
    assigned_by: 'user-manager',
    status: 'done',
    priority: 'high',
    due_date: '2026-06-20',
    created_at: '2026-06-15T08:00:00Z',
    updated_at: '2026-06-20T17:45:00Z'
  },
  {
    id: 'task-2',
    title: 'Hậu kỳ ảnh ORD-2026-001',
    description: 'Chỉnh sửa 30 ảnh album + 1 ảnh cổng 60x90 satin. Tone màu ấm áp Hàn Quốc.',
    order_id: 'order-1',
    assigned_to: 'user-editor',
    assigned_by: 'user-manager',
    status: 'in_progress',
    priority: 'normal',
    due_date: '2026-06-25',
    created_at: '2026-06-21T09:00:00Z',
    updated_at: '2026-06-22T10:00:00Z'
  },
  {
    id: 'task-3',
    title: 'Chuẩn bị váy cưới AO-002 cho ORD-2026-002',
    description: 'Là ủi phẳng, kiểm tra cúc, khóa váy trước ngày khách thuê.',
    order_id: 'order-2',
    assigned_to: 'user-editor',
    assigned_by: 'user-manager',
    status: 'pending',
    priority: 'normal',
    due_date: '2026-06-27',
    created_at: '2026-06-23T10:00:00Z',
    updated_at: '2026-06-23T10:00:00Z'
  }
];

const defaultTaskUpdates: TaskUpdate[] = [
  {
    id: 'up-1',
    task_id: 'task-1',
    updated_by: 'user-photo',
    status_changed_to: 'in_progress',
    comment: 'Đã đón khách tại studio, đang setup đèn và máy chụp.',
    created_at: '2026-06-20T08:15:00Z'
  },
  {
    id: 'up-2',
    task_id: 'task-1',
    updated_by: 'user-photo',
    status_changed_to: 'done',
    comment: 'Đã chụp xong, tổng cộng 420 file gốc, đã backup lên Drive của Studio.',
    created_at: '2026-06-20T17:45:00Z'
  },
  {
    id: 'up-3',
    task_id: 'task-2',
    updated_by: 'user-editor',
    status_changed_to: 'in_progress',
    comment: 'Đã nhận file từ anh Nam, đang lọc ảnh làm layout album.',
    created_at: '2026-06-22T10:00:00Z'
  }
];

const defaultObjectives: Objective[] = [
  {
    id: 'obj-1',
    title: 'Đạt doanh thu 100 triệu trong tháng 2',
    description: 'Chiến dịch trọng điểm quý đầu năm nhằm tối ưu hóa chuyển đổi từ Marketing và tăng công suất phục vụ khách hàng.',
    status: 'active',
    created_by: 'user-manager',
    created_at: '2026-02-01T08:00:00Z',
    updated_at: '2026-02-15T15:00:00Z',
    completed_at: null
  }
];

const defaultObjectiveKeyResults: ObjectiveKeyResult[] = [
  {
    id: 'kr-1',
    objective_id: 'obj-1',
    title: 'Chạy quảng cáo Facebook & Google',
    assigned_department: 'Marketing/Quảng cáo',
    assigned_to_user_id: null,
    status: 'in_progress',
    progress: 60,
    notes: 'Tập trung tối ưu chi phí tin nhắn khách hàng (CPA) và tiếp cận tập khách hàng tiềm năng cưới trong tháng 3-4.',
    updated_at: '2026-02-15T10:00:00Z'
  },
  {
    id: 'kr-2',
    objective_id: 'obj-1',
    title: 'Tư vấn khách hàng và chốt hợp đồng',
    assigned_department: 'Tư vấn & CSKH',
    assigned_to_user_id: 'user-manager',
    status: 'in_progress',
    progress: 40,
    notes: 'Chăm sóc nóng tập khách hàng từ form đăng ký và inbox Fanpage. Đặt lịch tư vấn trực tiếp tại Studio.',
    updated_at: '2026-02-14T14:30:00Z'
  },
  {
    id: 'kr-3',
    objective_id: 'obj-1',
    title: 'Tìm khách hàng online qua Tiktok',
    assigned_department: 'Marketing/Quảng cáo',
    assigned_to_user_id: 'user-photo',
    status: 'in_progress',
    progress: 25,
    notes: 'Lên 3 video ngắn giới thiệu các bối cảnh chụp và concept mới độc đáo đang hot.',
    updated_at: '2026-02-15T15:00:00Z'
  }
];

const defaultObjectiveProgressUpdates: ObjectiveProgressUpdate[] = [
  {
    id: 'kr-up-1',
    key_result_id: 'kr-1',
    updated_by: 'user-manager',
    progress_from: 0,
    progress_to: 60,
    comment: 'Đã hoàn thành set campaign quảng cáo mới, kết quả thu về 80 inbox chất lượng.',
    created_at: '2026-02-15T10:00:00Z'
  },
  {
    id: 'kr-up-2',
    key_result_id: 'kr-2',
    updated_by: 'user-manager',
    progress_from: 0,
    progress_to: 40,
    comment: 'Đã tư vấn chốt được 6 đơn hàng mới từ tệp khách hàng quảng cáo.',
    created_at: '2026-02-14T14:30:00Z'
  },
  {
    id: 'kr-up-3',
    key_result_id: 'kr-3',
    updated_by: 'user-photo',
    progress_from: 0,
    progress_to: 25,
    comment: 'Đã quay xong video ngắn giới thiệu bối cảnh mới, video đạt 12k view tự nhiên.',
    created_at: '2026-02-15T15:00:00Z'
  }
];

const defaultNotifications: Notification[] = [
  {
    id: 'notif-1',
    sender_id: 'user-admin',
    receiver_id: null,
    title: 'Họp giao ban đầu tuần',
    content: 'Tất cả các bộ phận tập trung tại phòng họp chính lúc 9h00 sáng Thứ Hai để họp giao ban và triển khai kế hoạch tuần mới.',
    type: 'general',
    related_id: null,
    is_read_by: [],
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'notif-2',
    sender_id: 'user-manager',
    receiver_id: 'user-photo',
    title: 'Công việc mới được giao',
    content: 'Bạn đã được giao nhiệm vụ mới: "Chụp bộ ảnh cưới cho khách hàng Nguyễn Thị B tại Studio". Hạn chót: 2026-06-25.',
    type: 'task_assignment',
    related_id: 'task-1',
    is_read_by: [],
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
  }
];

const defaultChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sender_id: 'user-admin',
    receiver_id: null,
    content: 'Chào mừng tất cả mọi người đến với kênh chat nội bộ của Studio! Chúc mọi người một ngày làm việc hiệu quả.',
    created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString()
  },
  {
    id: 'msg-2',
    sender_id: 'user-manager',
    receiver_id: null,
    content: 'Mọi người nhớ cập nhật tiến độ mục tiêu tháng 2 trên hệ thống đầy đủ nhé.',
    created_at: new Date(Date.now() - 35 * 3600 * 1000).toISOString()
  },
  {
    id: 'msg-3',
    sender_id: 'user-admin',
    receiver_id: 'user-manager',
    content: 'Chào Minh, bạn kiểm tra giúp mình hợp đồng của khách hàng Nguyễn Thị B xem đã nhận đủ tiền đặt cọc chưa nhé.',
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
  },
  {
    id: 'msg-4',
    sender_id: 'user-manager',
    receiver_id: 'user-admin',
    content: 'Dạ anh, em kiểm tra thấy khách hàng đã chuyển khoản đủ 5.000.000đ rồi ạ. Đã cập nhật trạng thái đã xác nhận trên hệ thống.',
    created_at: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString()
  }
];

export class LocalDatabase {
  private static data: DatabaseSchema | null = null;

  public static get(): DatabaseSchema {
    if (this.data) return this.data;

    // Fallback: If not initialized yet, try reading from json file (or it will be loaded from Postgres via initialize)
    const defaultStudioSettings: StudioSettings = {
      name: "The Will Studio",
      phone: "0901 234 567",
      email: "contact@thewillstudio.com",
      address: "123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh",
      website: "https://thewillstudio.vn",
      opening_hours: "08:30 - 21:30",
      notes: "Studio ảnh cưới cao cấp & dịch vụ chụp ảnh trọn gói chuyên nghiệp.",
      backup_schedule: "weekly",
      last_backup_time: ""
    };

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        
        // Ensure new arrays are initialized
        if (!this.data!.objectives) this.data!.objectives = defaultObjectives;
        if (!this.data!.objective_key_results) this.data!.objective_key_results = defaultObjectiveKeyResults;
        if (!this.data!.objective_progress_updates) this.data!.objective_progress_updates = defaultObjectiveProgressUpdates;
        if (!this.data!.notifications) this.data!.notifications = defaultNotifications;
        if (!this.data!.chat_messages) this.data!.chat_messages = defaultChatMessages;
        if (!this.data!.studio_settings) this.data!.studio_settings = defaultStudioSettings;
        if (!this.data!.backups) this.data!.backups = [];
        
        return this.data!;
      } catch (e) {
        console.error('Error reading DB, re-initializing...', e);
      }
    }

    // Seed default data
    const seed: DatabaseSchema = {
      users: defaultUsers,
      roles: defaultRoles,
      customers: defaultCustomers,
      orders: defaultOrders,
      order_status_history: defaultOrderHistory,
      dress_inventory: defaultDresses,
      dress_rentals: defaultRentals,
      tasks: defaultTasks,
      task_updates: defaultTaskUpdates,
      objectives: defaultObjectives,
      objective_key_results: defaultObjectiveKeyResults,
      objective_progress_updates: defaultObjectiveProgressUpdates,
      notifications: defaultNotifications,
      chat_messages: defaultChatMessages,
      studio_settings: defaultStudioSettings,
      backups: []
    };
    this.data = seed;
    return this.data;
  }

  public static async initialize() {
    try {
      console.log('Connecting to PostgreSQL database...');
      // Load all tables
      const roles = await prisma.role.findMany();
      const users = await prisma.user.findMany();
      const customers = await prisma.customer.findMany();
      const orders = await prisma.order.findMany();
      const orderStatusHistory = await prisma.orderStatusHistory.findMany();
      const dressInventory = await prisma.dressInventory.findMany();
      const dressRentals = await prisma.dressRental.findMany();
      const tasks = await prisma.task.findMany();
      const taskUpdates = await prisma.taskUpdate.findMany();
      const objectives = await prisma.objective.findMany();
      const objectiveKeyResults = await prisma.objectiveKeyResult.findMany();
      const objectiveProgressUpdates = await prisma.objectiveProgressUpdate.findMany();
      const notifications = await prisma.notification.findMany();
      const chatMessages = await prisma.chatMessage.findMany();
      const studioSettingsList = await prisma.studioSettings.findMany();
      const backups = await prisma.databaseBackup.findMany();

      // If the database is empty (no users or roles), seed default data
      if (users.length === 0 || roles.length === 0) {
        console.log('PostgreSQL database is empty. Seeding default data...');
        const defaultStudioSettings: StudioSettings = {
          name: "The Will Studio",
          phone: "0901 234 567",
          email: "contact@thewillstudio.com",
          address: "123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh",
          website: "https://thewillstudio.vn",
          opening_hours: "08:30 - 21:30",
          notes: "Studio ảnh cưới cao cấp & dịch vụ chụp ảnh trọn gói chuyên nghiệp.",
          backup_schedule: "weekly",
          last_backup_time: ""
        };

        const seed: DatabaseSchema = {
          users: defaultUsers,
          roles: defaultRoles,
          customers: defaultCustomers,
          orders: defaultOrders,
          order_status_history: defaultOrderHistory,
          dress_inventory: defaultDresses,
          dress_rentals: defaultRentals,
          tasks: defaultTasks,
          task_updates: defaultTaskUpdates,
          objectives: defaultObjectives,
          objective_key_results: defaultObjectiveKeyResults,
          objective_progress_updates: defaultObjectiveProgressUpdates,
          notifications: defaultNotifications,
          chat_messages: defaultChatMessages,
          studio_settings: defaultStudioSettings,
          backups: []
        };

        // Write seed data to PostgreSQL
        await this.syncToPostgres(seed);
        this.data = seed;
      } else {
        // Populate from Postgres
        this.data = {
          users,
          roles,
          customers,
          orders: orders as any,
          order_status_history: orderStatusHistory,
          dress_inventory: dressInventory as any,
          dress_rentals: dressRentals as any,
          tasks: tasks as any,
          task_updates: taskUpdates,
          objectives: objectives as any,
          objective_key_results: objectiveKeyResults as any,
          objective_progress_updates: objectiveProgressUpdates,
          notifications: notifications as any,
          chat_messages: chatMessages,
          studio_settings: (studioSettingsList[0] || undefined) as any,
          backups: backups as any
        };
      }
      console.log('LocalDatabase successfully initialized and loaded from PostgreSQL.');
    } catch (err) {
      console.error('Failed to initialize database from PostgreSQL:', err);
      // Fallback to local file if PostgreSQL is unavailable during compilation/dev
      this.get();
    }
  }

  public static save(data: DatabaseSchema) {
    this.data = data;
    // Write asynchronously to local file as backup (optional)
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write backup db.json:', err);
    }
    // Write asynchronously to PostgreSQL in the background
    this.syncToPostgres(data).catch(err => {
      console.error('Error syncing to PostgreSQL in the background:', err);
    });
  }

  public static async syncToPostgres(data: DatabaseSchema) {
    try {
      await prisma.$transaction(async (tx) => {
        // Delete existing records
        await tx.user.deleteMany();
        await tx.role.deleteMany();
        await tx.customer.deleteMany();
        await tx.order.deleteMany();
        await tx.orderStatusHistory.deleteMany();
        await tx.dressInventory.deleteMany();
        await tx.dressRental.deleteMany();
        await tx.task.deleteMany();
        await tx.taskUpdate.deleteMany();
        await tx.objective.deleteMany();
        await tx.objectiveKeyResult.deleteMany();
        await tx.objectiveProgressUpdate.deleteMany();
        await tx.notification.deleteMany();
        await tx.chatMessage.deleteMany();
        await tx.studioSettings.deleteMany();
        await tx.databaseBackup.deleteMany();

        // Insert new records
        if (data.roles && data.roles.length > 0) {
          await tx.role.createMany({ data: data.roles });
        }
        if (data.users && data.users.length > 0) {
          await tx.user.createMany({ data: data.users });
        }
        if (data.customers && data.customers.length > 0) {
          await tx.customer.createMany({ data: data.customers });
        }
        if (data.orders && data.orders.length > 0) {
          await tx.order.createMany({ data: data.orders });
        }
        if (data.order_status_history && data.order_status_history.length > 0) {
          await tx.orderStatusHistory.createMany({ data: data.order_status_history });
        }
        if (data.dress_inventory && data.dress_inventory.length > 0) {
          await tx.dressInventory.createMany({ data: data.dress_inventory });
        }
        if (data.dress_rentals && data.dress_rentals.length > 0) {
          await tx.dressRental.createMany({ data: data.dress_rentals });
        }
        if (data.tasks && data.tasks.length > 0) {
          await tx.task.createMany({ data: data.tasks });
        }
        if (data.task_updates && data.task_updates.length > 0) {
          await tx.taskUpdate.createMany({ data: data.task_updates });
        }
        if (data.objectives && data.objectives.length > 0) {
          await tx.objective.createMany({ data: data.objectives });
        }
        if (data.objective_key_results && data.objective_key_results.length > 0) {
          await tx.objectiveKeyResult.createMany({ data: data.objective_key_results });
        }
        if (data.objective_progress_updates && data.objective_progress_updates.length > 0) {
          await tx.objectiveProgressUpdate.createMany({ data: data.objective_progress_updates });
        }
        if (data.notifications && data.notifications.length > 0) {
          await tx.notification.createMany({ data: data.notifications });
        }
        if (data.chat_messages && data.chat_messages.length > 0) {
          await tx.chatMessage.createMany({ data: data.chat_messages });
        }
        if (data.backups && data.backups.length > 0) {
          await tx.databaseBackup.createMany({ data: data.backups });
        }
        if (data.studio_settings) {
          await tx.studioSettings.create({
            data: {
              id: 'singleton',
              name: data.studio_settings.name,
              phone: data.studio_settings.phone,
              email: data.studio_settings.email,
              address: data.studio_settings.address,
              website: data.studio_settings.website || '',
              opening_hours: data.studio_settings.opening_hours || '',
              notes: data.studio_settings.notes || '',
              backup_schedule: data.studio_settings.backup_schedule || 'weekly',
              last_backup_time: data.studio_settings.last_backup_time || ''
            }
          });
        }
      });
      console.log('PostgreSQL database successfully synchronized.');
    } catch (err) {
      console.error('Error synchronizing database to PostgreSQL:', err);
    }
  }

  // Helper to generate IDs
  public static uuid(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  // Automatically generate order code ORD-YYYY-XXX
  public static generateOrderCode(): string {
    const db = this.get();
    const currentYear = new Date().getFullYear();
    const prefix = `ORD-${currentYear}-`;
    const yearOrders = db.orders.filter(o => o.order_code.startsWith(prefix));
    
    let maxNum = 0;
    yearOrders.forEach(o => {
      const parts = o.order_code.split('-');
      if (parts.length === 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    const nextNum = maxNum + 1;
    const formattedNum = String(nextNum).padStart(3, '0');
    return `${prefix}${formattedNum}`;
  }
}

