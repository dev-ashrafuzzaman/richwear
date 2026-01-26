import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./routes/PrivateRoute";
import Spinner from "./components/common/Spinner";
import LayoutWrapper from "./layouts/LayoutWrapper";

const Login = React.lazy(() => import("./pages/auth/Login"));
const Dashboard = React.lazy(() => import("./pages/dashboard/Dashboard"));
const Unauthorized = React.lazy(() => import("./pages/errors/Unauthorized"));

const CompanyListPage = React.lazy(
  () => import("./pages/setting/company/CompanyListPage"),
);
const CompanyCreatePage = React.lazy(
  () => import("./pages/setting/company/CompanyDetailsPage"),
);
const UsersCreatePage = React.lazy(
  () => import("./pages/setting/user/UserCreateModalPage"),
);
const UsersListPage = React.lazy(() => import("./pages/setting/user/UserPage"));

const TypesListPage = React.lazy(
  () => import("./pages/accounting/types/TypesListPage"),
);
const LedgerListPage = React.lazy(
  () => import("./pages/accounting/ledger/LedgerListPage"),
);
const SubsidiryListPage = React.lazy(
  () => import("./pages/accounting/subsidiary/SubsidiarysListPage"),
);
const JournalEntriesPage = React.lazy(
  () => import("./pages/accounting/journal/JournalEntries"),
);
const JournalInvoices = React.lazy(
  () => import("./pages/accounting/journal/JournalInvoices"),
);
const JournalSinglePage = React.lazy(
  () => import("./pages/accounting/journal/JournalSinglePage"),
);
const ChartOfAccReport = React.lazy(
  () => import("./pages/report/ChartOfAccounts"),
);
const LedgerReport = React.lazy(() => import("./pages/report/ledger/Ledger"));
const CustomerBalance = React.lazy(
  () => import("./pages/report/CustomerBalance"),
);
const SupplierBalance = React.lazy(
  () => import("./pages/report/SupplierBalance"),
);
const EmployeeAdvance = React.lazy(
  () => import("./pages/report/EmoloyeeAdvance"),
);
const TrialBalance = React.lazy(() => import("./pages/report/TrialBalance"));
const JournalVoucher = React.lazy(
  () => import("./pages/report/JournalVoucher"),
);

// POS ROUTE
const BranchesPage = React.lazy(
  () => import("./pages/setting/branches/branchesPage"),
);
const CategoriesPage = React.lazy(
  () => import("./pages/products/category/CategoriesPage"),
);
const ProductsPage = React.lazy(() => import("./pages/products/ProductsPage"));
const VariantsPage = React.lazy(
  () => import("./pages/products/variant/VariantPage"),
);
const PurchaseCreatePage = React.lazy(
  () => import("./pages/purchase/PurchaseCreatePage"),
);
const PurchasesPage = React.lazy(
  () => import("./pages/purchase/PurchasesPage"),
);
const PurchasesInvoicePage = React.lazy(
  () => import("./pages/purchase/invoices/PurchaseInvoice"),
);
const PurchasesReturnInvoicePage = React.lazy(
  () => import("./pages/purchase/invoices/PurchaseReturnInvoice"),
);
const PurchaseReturnCreatePage = React.lazy(
  () => import("./pages/purchase/PurchaseReturnCreatePage"),
);
const PurchaseReturnPage = React.lazy(
  () => import("./pages/purchase/PurchasesReturnPage"),
);
const CustomerPage = React.lazy(
  () => import("./pages/parties/customer/CustomerPage"),
);
const SupplierPage = React.lazy(
  () => import("./pages/parties/supplier/SupplierPage"),
);
const EmployeePage = React.lazy(
  () => import("./pages/parties/employee/EmployeePage"),
);

const StockPage = React.lazy(
  () => import("./pages/inventory/StockPage"),
);
const AttendancePage = React.lazy(
  () => import("./pages/hr/AttendancePage"),
);
const ActivityPage = React.lazy(
  () => import("./pages/setting/activity/ActivityPage"),
);
const POSCreatePage = React.lazy(
  () => import("./pages/sales/PosPage"),
);
const SalesPage = React.lazy(
  () => import("./pages/sales/SalesPage"),
);
const SalesReturnPage = React.lazy(
  () => import("./pages/sales/SalesReturnPage"),
);

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
      }>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route
          element={
            <LayoutWrapper layout="main">
              <PrivateRoute />
            </LayoutWrapper>
          }>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/pos" element={<POSCreatePage />} />
          <Route path="/sales/return" element={<SalesReturnPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/settings/logs" element={<ActivityPage />} />
          <Route path="/hr/attendance" element={<AttendancePage />} />
          <Route path="/branches" element={<BranchesPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/variants" element={<VariantsPage />} />

          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/purchases/create" element={<PurchaseCreatePage />} />
          <Route
            path="/purchases/:id/invoice"
            element={<PurchasesInvoicePage />}
          />

          <Route path="/purchase-returns" element={<PurchaseReturnPage />} />
          <Route
            path="/purchase-returns/create"
            element={<PurchaseReturnCreatePage />}
          />
          <Route
            path="/purchase-returns/:id/invoice"
            element={<PurchasesReturnInvoicePage />}
          />

          <Route path="/customers" element={<CustomerPage />} />
          <Route path="/suppliers" element={<SupplierPage />} />
          <Route path="/employees" element={<EmployeePage />} />

          <Route path="/inventory/stock" element={<StockPage />} />

          {/* company */}
          <Route
            path="/settings/companies/create"
            element={<CompanyCreatePage />}
          />
          <Route path="/settings/companies" element={<CompanyListPage />} />
          {/* face */}

          {/* account type */}
          <Route path="/accounting/types" element={<TypesListPage />} />
          {/* general ledger */}
          <Route path="/accounting/ledgers" element={<LedgerListPage />} />

          {/* subsidiary */}
          <Route
            path="/subsidiaries/customers"
            element={<SubsidiryListPage type={"customer"} />}
          />
          <Route
            path="/subsidiaries/suppliers"
            element={<SubsidiryListPage type={"supplier"} />}
          />
          <Route
            path="/subsidiaries/employees"
            element={<SubsidiryListPage type={"employee"} />}
          />

          {/* journal */}
          <Route path="/journal/entries" element={<JournalEntriesPage />} />
          <Route path="/journal/invoices" element={<JournalInvoices />} />
          <Route path="/journal" element={<JournalSinglePage />} />

          {/* reports */}
          <Route path="/reports/coa" element={<ChartOfAccReport />} />
          <Route path="/reports/ledger" element={<LedgerReport />} />
          <Route
            path="/reports/customer-balance"
            element={<CustomerBalance />}
          />
          <Route
            path="/reports/supplier-balance"
            element={<SupplierBalance />}
          />
          <Route
            path="/reports/employee-advance"
            element={<EmployeeAdvance />}
          />
          <Route path="/reports/trial-balance" element={<TrialBalance />} />
          <Route path="/reports/journal-voucher" element={<JournalVoucher />} />

          {/*user */}
          <Route path="/settings/users/create" element={<UsersCreatePage />} />
          <Route path="/settings/users" element={<UsersListPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
