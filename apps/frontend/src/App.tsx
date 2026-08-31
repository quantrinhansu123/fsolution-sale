import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import LeadsPage from "./pages/LeadsPage";
import OrdersPage from "./pages/OrdersPage";

import AccountsPage from "./pages/AccountsPage";
import CustomersPage from "./pages/CustomersPage";
import SaleReportsPage from "./pages/SaleReportsPage";
import CampaignsPage from "./pages/CampaignsPage";
import MarketingReportsPage from "./pages/MarketingReportsPage";

import CskhLogsPage from "./pages/CskhLogsPage";
import ProductsPage from "./pages/ProductsPage";
import FeedbacksPage from "./pages/FeedbacksPage";
import PaymentsPage from "./pages/PaymentsPage";
import CashAccountsPage from "./pages/CashAccountsPage";
import CashTransactionsPage from "./pages/CashTransactionsPage";
import EmployeesPage from "./pages/EmployeesPage";
import KPIsPage from "./pages/KPIsPage";
import SystemConfigsPage from "./pages/SystemConfigsPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import { useAuthStore } from "./store/useAuthStore";

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="sale-reports" element={<SaleReportsPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="marketing-reports" element={<MarketingReportsPage />} />
          <Route path="cskh-logs" element={<CskhLogsPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="feedbacks" element={<FeedbacksPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="cash-accounts" element={<CashAccountsPage />} />
          <Route path="cash-transactions" element={<CashTransactionsPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="kpis" element={<KPIsPage />} />
          <Route path="system-configs" element={<SystemConfigsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="accounts" element={<AccountsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
