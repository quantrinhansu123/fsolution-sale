import type {
  HealthCheckResponse,
  Lead,
  CreateLeadInput,
  UpdateLeadInput,
  LeadLog,
  Order,
  CreateOrderInput,
  UpdateOrderInput,
  OrderItem,
  CreateOrderItemInput,
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  SaleReport,
  CreateSaleReportInput,
  SaleReportAuto,
  Campaign,
  CreateCampaignInput,
  UpdateCampaignInput,
  MarketingReport,
  CreateMarketingReportInput,
  MarketingReportAuto,
  CskhLog,
  CreateCskhLogInput,
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductPerformance,
  CreateProductPerformanceInput,
  Feedback,
  CreateFeedbackInput,
  Payment,
  CreatePaymentInput,
  UpdatePaymentInput,
  CashAccount,
  CreateCashAccountInput,
  CashTransaction,
  CreateCashTransactionInput,
  Employee,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  KPI,
  CreateKPIInput,
  SystemConfig,
  UpdateSystemConfigInput,
  AuditLog,
  DashboardOverview,
  DashboardPeriodType,
  LoginInput,
  AuthSession,
  AccountProfile,
  ChangePasswordInput,
  CreateAccountInput,
  UpdateAccountInput,
  Permission
} from "@fsolution/shared-types";
import { getToken, notifyUnauthorized } from "./authToken";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3003/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401) {
    notifyUnauthorized();
    throw new Error(`API ${path} trả về 401`);
  }
  if (!res.ok) {
    throw new Error(`API ${path} trả về ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function jsonInit(method: string, data: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) };
}

export const apiClient = {
  getHealth: () => request<HealthCheckResponse>("/health"),

  login: (data: LoginInput) => request<AuthSession>("/auth/login", jsonInit("POST", data)),
  getMe: () => request<AccountProfile>("/auth/me"),
  changePassword: (data: ChangePasswordInput) =>
    request<{ message: string }>("/auth/change-password", jsonInit("PATCH", data)),

  getAccounts: () => request<AccountProfile[]>("/accounts"),
  createAccount: (data: CreateAccountInput) => request<AccountProfile>("/accounts", jsonInit("POST", data)),
  updateAccount: (id: string, data: UpdateAccountInput) =>
    request<AccountProfile>(`/accounts/${id}`, jsonInit("PATCH", data)),
  deleteAccount: (id: string) => request<void>(`/accounts/${id}`, { method: "DELETE" }),
  getAccountPermissions: (id: string) => request<Permission[]>(`/accounts/${id}/permissions`),
  setAccountPermissions: (id: string, items: Permission[]) =>
    request<Permission[]>(`/accounts/${id}/permissions`, jsonInit("PUT", items)),

  getLeads: (filters?: { status?: string; assignedTo?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.assignedTo) params.set("assignedTo", filters.assignedTo);
    const qs = params.toString();
    return request<Lead[]>(`/leads${qs ? `?${qs}` : ""}`);
  },
  createLead: (data: CreateLeadInput) => request<Lead>("/leads", jsonInit("POST", data)),
  updateLead: (id: string, data: UpdateLeadInput) => request<Lead>(`/leads/${id}`, jsonInit("PATCH", data)),
  getLeadLogs: (id: string) => request<LeadLog[]>(`/leads/${id}/logs`),

  getOrders: () => request<Order[]>("/orders"),
  createOrder: (data: CreateOrderInput) => request<Order>("/orders", jsonInit("POST", data)),
  updateOrder: (id: string, data: UpdateOrderInput) => request<Order>(`/orders/${id}`, jsonInit("PATCH", data)),
  getOrderItems: (id: string) => request<OrderItem[]>(`/orders/${id}/items`),
  addOrderItem: (id: string, data: CreateOrderItemInput) =>
    request<OrderItem>(`/orders/${id}/items`, jsonInit("POST", data)),

  getCustomers: () => request<Customer[]>("/customers"),
  createCustomer: (data: CreateCustomerInput) => request<Customer>("/customers", jsonInit("POST", data)),
  updateCustomer: (id: string, data: UpdateCustomerInput) =>
    request<Customer>(`/customers/${id}`, jsonInit("PATCH", data)),

  getSaleReports: () => request<SaleReport[]>("/sale-reports"),
  createSaleReport: (data: CreateSaleReportInput) =>
    request<SaleReport>("/sale-reports", jsonInit("POST", data)),
  getSaleReportsAuto: (date: string, toDate?: string) =>
    request<SaleReportAuto[]>(`/sale-reports/auto?date=${date}${toDate ? `&toDate=${toDate}` : ""}`),

  getCampaigns: () => request<Campaign[]>("/campaigns"),
  createCampaign: (data: CreateCampaignInput) => request<Campaign>("/campaigns", jsonInit("POST", data)),
  updateCampaign: (id: string, data: UpdateCampaignInput) =>
    request<Campaign>(`/campaigns/${id}`, jsonInit("PATCH", data)),

  getMarketingReports: () => request<MarketingReport[]>("/marketing-reports"),
  createMarketingReport: (data: CreateMarketingReportInput) =>
    request<MarketingReport>("/marketing-reports", jsonInit("POST", data)),
  getMarketingReportsAuto: (date: string, toDate?: string) =>
    request<MarketingReportAuto[]>(`/marketing-reports/auto?date=${date}${toDate ? `&toDate=${toDate}` : ""}`),

  getCskhLogs: () => request<CskhLog[]>("/cskh-logs"),
  createCskhLog: (data: CreateCskhLogInput) => request<CskhLog>("/cskh-logs", jsonInit("POST", data)),

  getProducts: () => request<Product[]>("/products"),
  createProduct: (data: CreateProductInput) => request<Product>("/products", jsonInit("POST", data)),
  updateProduct: (id: string, data: UpdateProductInput) =>
    request<Product>(`/products/${id}`, jsonInit("PATCH", data)),

  getProductPerformance: () => request<ProductPerformance[]>("/product-performance"),
  createProductPerformance: (data: CreateProductPerformanceInput) =>
    request<ProductPerformance>("/product-performance", jsonInit("POST", data)),

  getFeedbacks: () => request<Feedback[]>("/feedbacks"),
  createFeedback: (data: CreateFeedbackInput) => request<Feedback>("/feedbacks", jsonInit("POST", data)),

  getPayments: () => request<Payment[]>("/payments"),
  createPayment: (data: CreatePaymentInput) => request<Payment>("/payments", jsonInit("POST", data)),
  updatePayment: (id: string, data: UpdatePaymentInput) =>
    request<Payment>(`/payments/${id}`, jsonInit("PATCH", data)),

  getCashAccounts: () => request<CashAccount[]>("/cash-accounts"),
  createCashAccount: (data: CreateCashAccountInput) =>
    request<CashAccount>("/cash-accounts", jsonInit("POST", data)),

  getCashTransactions: () => request<CashTransaction[]>("/cash-transactions"),
  createCashTransaction: (data: CreateCashTransactionInput) =>
    request<CashTransaction>("/cash-transactions", jsonInit("POST", data)),

  getEmployees: () => request<Employee[]>("/employees"),
  createEmployee: (data: CreateEmployeeInput) => request<Employee>("/employees", jsonInit("POST", data)),
  updateEmployee: (id: string, data: UpdateEmployeeInput) =>
    request<Employee>(`/employees/${id}`, jsonInit("PATCH", data)),

  getKpis: () => request<KPI[]>("/kpis"),
  createKpi: (data: CreateKPIInput) => request<KPI>("/kpis", jsonInit("POST", data)),

  getSystemConfigs: () => request<SystemConfig[]>("/system-configs"),
  updateSystemConfig: (key: string, data: UpdateSystemConfigInput) =>
    request<SystemConfig>(`/system-configs/${key}`, jsonInit("PATCH", data)),

  getAuditLogs: () => request<AuditLog[]>("/audit-logs"),

  getDashboardOverview: (period: DashboardPeriodType) =>
    request<DashboardOverview>(`/dashboard/overview?period=${period}`)
};
