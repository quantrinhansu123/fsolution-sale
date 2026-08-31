// DTO/type dùng chung giữa apps/backend và apps/frontend.
// Nguồn sự thật là docs/api-contract.openapi.yaml — mọi type ở đây phải khớp 1-1 với contract.

export interface HealthCheckResponse {
  status: "ok";
  timestamp: string;
}

export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

export interface Lead {
  id: string;
  code?: string | null; // Mới (Phase 3) — mã Lead 4 ký tự, server-generated
  name: string;
  phone: string;
  source: string;
  productInterest?: string | null; // Mới (Phase 3)
  threadId?: string | null; // Mới (Phase 3)
  status: LeadStatus;
  assignedTo?: string | null;
  sourcedBy?: string | null; // Mới — nhân viên Marketing tạo/nguồn Lead này, tự động round-robin
  score?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadInput {
  name: string;
  phone: string;
  source: string;
  productInterest?: string; // Mới (Phase 3)
  threadId?: string; // Mới (Phase 3)
  sourcedBy?: string; // Mới — chọn tay nhân viên Marketing, bỏ trống thì tự động round-robin
}

// Mới (Phase 2, Giai đoạn 4)
export interface UpdateLeadInput {
  status?: LeadStatus;
  assignedTo?: string | null;
  note?: string;
}

// Mới (Phase 3): mở rộng để ghi được cả khi đổi assignedTo (không chỉ status)
export interface LeadLog {
  id: string;
  leadId: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  fieldChanged?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  note?: string | null;
  changedBy?: string | null;
  createdAt: string;
}

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  customerId: string;
  customerName?: string | null; // Mới — sao chép từ Customer, để FE không cần tự GET /customers
  leadId?: string | null; // Mới (Phase 3)
  leadCode?: string | null; // Mới — sao chép từ Lead.code, để thống kê doanh thu theo Lead
  assignedTo?: string | null; // Mới (Phase 3)
  assignedToName?: string | null; // Mới — sao chép từ Employee, để FE không cần tự GET /employees
  shippingAddress?: string | null; // Mới (Phase 3)
  shippingPhone?: string | null; // Mới (Phase 3)
  note?: string | null; // Mới (Phase 3)
  totalAmount: number;
  status: OrderStatus;
  items?: OrderItem[]; // Mới (Phase 3) — nhúng kèm trong GET /orders
  createdAt: string;
  updatedAt: string;
}

// Mới (Phase 3): customerId trở thành optional — dùng customerName/shippingPhone để tự upsert Customer
export interface CreateOrderInput {
  customerId?: string;
  leadId?: string;
  assignedTo?: string;
  customerName?: string;
  shippingAddress?: string;
  shippingPhone?: string;
  note?: string;
  productId?: string;
  productName?: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  discountPercent?: number;
  totalAmount: number;
}

// Mới (Phase 2, Giai đoạn 4)
export interface UpdateOrderInput {
  status?: OrderStatus;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unit?: string | null;
  quantity: number;
  unitPrice: number;
  discountPercent?: number | null; // Mới (Phase 3)
  isGift: boolean;
  createdAt: string;
}

export interface CreateOrderItemInput {
  productId: string;
  productName: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number; // Mới (Phase 3)
  isGift?: boolean;
}

export interface Inventory {
  id: string;
  productId: string;
  quantity: number;
  warehouse: string;
  updatedAt: string;
}

// Mới (Phase 2, Giai đoạn 4)
export type CustomerType = "new" | "old";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  customerType: CustomerType;
  blacklistStatus: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  customerType?: CustomerType;
}

export interface UpdateCustomerInput {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
  customerType?: CustomerType;
  blacklistStatus?: boolean;
}

export interface SaleReport {
  id: string;
  employeeId: string;
  date: string;
  shift: string;
  product: string;
  market: string;
  messageCount: number;
  orderCount: number;
  revenueActual: number;
  orderCancelCount: number;
  newCustomerCount: number;
  oldCustomerCount: number;
  createdAt: string;
}

export interface CreateSaleReportInput {
  employeeId: string;
  date: string;
  shift: string;
  product: string;
  market: string;
  messageCount: number;
  orderCount: number;
  revenueActual: number;
  orderCancelCount?: number;
  newCustomerCount?: number;
  oldCustomerCount?: number;
}

// Mới (Phase 3) — read-model tính real-time từ Lead/LeadLog/Order/OrderItem/Customer, không lưu DB
export interface SaleReportAuto {
  date: string;
  employeeId: string;
  employeeName: string;
  newLeadsAssigned: number;
  leadsToContacted: number;
  leadsToQualified: number;
  leadsToConverted: number;
  leadsToLost: number;
  orderCount: number;
  productsSold: number;
  revenueTotal: number;
  revenueConfirmed: number;
  newCustomers: number;
  returningCustomers: number;
}

// Mới (Phase 2, Giai đoạn 5)
export type CampaignStatus = "active" | "paused" | "completed";

export interface Campaign {
  id: string;
  name: string;
  budget: number;
  market?: string | null;
  product?: string | null;
  status: CampaignStatus;
  createdAt: string;
}

export interface CreateCampaignInput {
  name: string;
  budget: number;
  market?: string;
  product?: string;
}

export interface UpdateCampaignInput {
  name?: string;
  budget?: number;
  status?: CampaignStatus;
  market?: string;
  product?: string;
}

export interface MarketingReport {
  id: string;
  campaignId?: string | null;
  date: string;
  shift: string;
  product: string;
  market: string;
  team: string;
  adCost: number;
  messageCount: number;
  orderCount: number;
  revenue: number;
  revenueActual: number;
  warning?: string | null;
  createdAt: string;
}

export interface CreateMarketingReportInput {
  campaignId?: string;
  date: string;
  shift: string;
  product: string;
  market: string;
  team: string;
  adCost: number;
  messageCount: number;
  orderCount: number;
  revenue: number;
  revenueActual: number;
  warning?: string;
}

// Mới — Báo cáo tự động Marketing, tính real-time (KHÔNG lưu bảng riêng) từ Lead.sourcedBy + Order,
// khớp cách SaleReportAuto tính doanh thu Sale.
export interface MarketingReportAuto {
  employeeId: string;
  employeeName: string;
  leadCount: number;
  orderCount: number;
  revenue: number;
}

// Mới (Phase 2, Giai đoạn 6)
export type ShipmentStatus = "preparing" | "shipping" | "delivered" | "returned";

export interface Shipment {
  id: string;
  orderId: string;
  trackingCode?: string | null;
  carrier?: string | null;
  status: ShipmentStatus;
  estimatedDeliveryDate?: string | null;
  packedAt?: string | null;
  dispatchedAt?: string | null;
  shippingFee?: number | null;
  warehouseFee?: number | null;
  createdAt: string;
}

export interface CreateShipmentInput {
  orderId: string;
  carrier?: string;
  trackingCode?: string;
}

export interface UpdateShipmentInput {
  trackingCode?: string;
  carrier?: string;
  status?: ShipmentStatus;
  estimatedDeliveryDate?: string;
  packedAt?: string;
  dispatchedAt?: string;
  shippingFee?: number;
  warehouseFee?: number;
}

export interface TrackingLog {
  id: string;
  shipmentId: string;
  status: string;
  note?: string | null;
  recordedBy?: string | null;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location?: string | null;
  createdAt: string;
}

export interface CreateWarehouseInput {
  name: string;
  code: string;
  location?: string;
}

export type InventoryTransactionType = "receipt" | "issue" | "adjustment";
export type InventoryReferenceType = "purchase_order" | "order" | "manual";

export interface InventoryTransaction {
  id: string;
  productId: string;
  warehouseId: string;
  type: InventoryTransactionType;
  quantity: number;
  unitCost?: number | null;
  referenceType?: InventoryReferenceType | null;
  referenceId?: string | null;
  reason?: string | null;
  performedBy?: string | null;
  createdAt: string;
}

export interface CreateInventoryTransactionInput {
  productId: string;
  warehouseId: string;
  type: InventoryTransactionType;
  quantity: number;
  unitCost?: number;
  referenceType?: InventoryReferenceType;
  referenceId?: string;
  reason?: string;
}

export interface InventoryBatch {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  unitCost: number;
  receivedAt: string;
}

// Mới (Phase 2, Giai đoạn 7)
export interface CskhLog {
  id: string;
  orderId: string;
  customerId: string;
  staffId?: string | null;
  status: string;
  note?: string | null;
  createdAt: string;
}

export interface CreateCskhLogInput {
  orderId: string;
  customerId: string;
  staffId?: string;
  status: string;
  note?: string;
}

// Đơn vị tính sản phẩm — F-Solution bán phần mềm theo gói thuê bao (phải khớp
// apps/backend/src/modules/products/product-units.ts PRODUCT_UNITS).
export type ProductUnit =
  | "gói"
  | "gói hàng tháng"
  | "gói 3 tháng"
  | "gói 6 tháng"
  | "gói 12 tháng"
  | "gói 18 tháng"
  | "gói 24 tháng";

export interface Product {
  id: string;
  name: string;
  sku: string;
  unit: ProductUnit;
  price: number;
  category?: string | null;
  createdAt: string;
}

export interface CreateProductInput {
  name: string;
  sku: string;
  unit: ProductUnit;
  price: number;
  category?: string;
}

export interface UpdateProductInput {
  name?: string;
  unit?: ProductUnit;
  price?: number;
  category?: string;
}

export type ProductPerformanceEvaluation = "win" | "fail" | "pending";

export interface ProductPerformance {
  id: string;
  productId: string;
  stage: string;
  messageCount?: number | null;
  adCost?: number | null;
  orderCount?: number | null;
  revenue?: number | null;
  adCostRatio?: number | null;
  conversionRate?: number | null;
  paymentRate?: number | null;
  evaluation: ProductPerformanceEvaluation;
  createdAt: string;
}

export interface CreateProductPerformanceInput {
  productId: string;
  stage: string;
  messageCount?: number;
  adCost?: number;
  orderCount?: number;
  revenue?: number;
  adCostRatio?: number;
  conversionRate?: number;
  paymentRate?: number;
  evaluation: ProductPerformanceEvaluation;
}

export type FeedbackSource = "MKT" | "Sale" | "CSKH";

export interface Feedback {
  id: string;
  customerId: string;
  orderId?: string | null;
  source: FeedbackSource;
  content: string;
  rating: number;
  createdAt: string;
}

export interface CreateFeedbackInput {
  customerId: string;
  orderId?: string;
  source: FeedbackSource;
  content: string;
  rating: number;
}

// Mới (Phase 2, Giai đoạn 8)
export type PaymentStatus = "pending" | "completed" | "failed";

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
  method?: string | null;
  feeBreakdown?: Record<string, number> | null;
  reconciledAt?: string | null;
  createdAt: string;
}

export interface CreatePaymentInput {
  orderId: string;
  amount: number;
  method?: string;
}

export interface UpdatePaymentInput {
  status?: PaymentStatus;
  feeBreakdown?: Record<string, number>;
  reconciledAt?: string;
}

export type CashAccountType = "income" | "expense";

export interface CashAccount {
  id: string;
  code: string;
  name: string;
  type: CashAccountType;
  branch?: string | null;
  market?: string | null;
  active: boolean;
  createdAt: string;
}

export interface CreateCashAccountInput {
  code: string;
  name: string;
  type: CashAccountType;
  branch?: string;
  market?: string;
}

export interface CashTransaction {
  id: string;
  cashAccountId: string;
  type: CashAccountType;
  branch?: string | null;
  market?: string | null;
  content: string;
  amount: number;
  source?: string | null;
  evidenceUrl?: string | null;
  transactionDate: string;
  createdAt: string;
}

export interface CreateCashTransactionInput {
  cashAccountId: string;
  type: CashAccountType;
  branch?: string;
  market?: string;
  content: string;
  amount: number;
  source?: string;
  evidenceUrl?: string;
  transactionDate: string;
}

// Mới (Phase 2, Giai đoạn 9)
export type EmployeeRole = "MKT" | "Sale" | "CS" | "CSKH" | "KeToan" | "Admin";
export type EmployeeStatus = "active" | "inactive";

export interface Employee {
  id: string;
  name: string;
  email: string;
  team?: string | null;
  branch?: string | null;
  role: EmployeeRole;
  status: EmployeeStatus;
  accountId?: string | null;
  createdAt: string;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  team?: string;
  branch?: string;
  role: EmployeeRole;
  accountId?: string;
}

export interface UpdateEmployeeInput {
  name?: string;
  team?: string;
  branch?: string;
  role?: EmployeeRole;
  status?: EmployeeStatus;
  accountId?: string | null;
}

export interface KPI {
  id: string;
  employeeId: string;
  period: string;
  score: number;
  bonus?: number | null;
  createdAt: string;
}

export interface CreateKPIInput {
  employeeId: string;
  period: string;
  score: number;
  bonus?: number;
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description?: string | null;
  updatedAt: string;
}

export interface UpdateSystemConfigInput {
  value: string;
}

export interface AuditLog {
  id: string;
  tableName: string;
  recordId: string;
  fieldChanged?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  changedBy?: string | null;
  createdAt: string;
}

// Mới — Dashboard Tổng Quan, chỉ admin xem được (xem skills/build/auth-and-permissions/SKILL.md).
export type DashboardPeriodType = "day" | "week" | "month";

export interface DashboardEmployeeSeries {
  employeeId: string | null; // null cho nhóm gộp "Khác"
  employeeName: string;
  values: number[]; // cùng độ dài với DashboardOverview.periods
}

export interface DashboardPeriodStats {
  period: string;
  total: number;
  byStatus: Record<string, number>;
}

export interface DashboardOverview {
  periods: string[];
  revenueCostProfit: { period: string; revenue: number; cost: number; profit: number }[];
  salesRevenue: DashboardEmployeeSeries[];
  marketingRevenue: DashboardEmployeeSeries[];
  leadStats: DashboardPeriodStats[];
  orderStats: DashboardPeriodStats[];
  cskhStats: DashboardPeriodStats[];
  cashFlow: { period: string; income: number; expense: number }[];
}

// Đăng nhập + phân quyền — baseline có sẵn của mọi dự án, xem
// skills/build/auth-and-permissions/SKILL.md.
export interface Permission {
  module: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface AccountProfile {
  id: string;
  username: string;
  isAdmin: boolean;
  employeeName?: string | null; // Mới (Phase 3) — join ngược Employee.accountId, không lưu DB
  createdAt: string;
  permissions?: Permission[];
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  account: AccountProfile;
}

export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export interface CreateAccountInput {
  username: string;
  password?: string;
}

export interface UpdateAccountInput {
  username?: string;
  resetPassword?: boolean;
  newPassword?: string;
}
