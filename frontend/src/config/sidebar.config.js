// src/config/sidebar.config.js
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Truck,
  Calculator,
  BookOpen,
  BarChart3,
  FileText,
  Users,
  UserCheck,
  Briefcase,
  Wallet,
  CalendarCheck,
  GitBranch,
  Settings,
  Activity,
} from "lucide-react";

export const SIDEBAR_MENU = [
  /* =======================
     DASHBOARD
  ======================== */
  {
    header: "Main",
    items: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        to: "/dashboard",
      },
    ],
  },

  /* =======================
     BRANCH MANAGEMENT
  ======================== */
  {
    header: "Branches",
    items: [
      {
        title: "Branch Manage",
        icon: GitBranch,
        to: "/branches",
      },
    ],
  },

  /* =======================
     SALES & POS
  ======================== */
  {
    header: "Sales & POS",
    items: [
      {
        title: "POS Create",
        icon: ShoppingCart,
        to: "/pos",
      },
      {
        title: "Sales",
        icon: FileText,
        submenu: [
          { title: "Sales Manage", to: "/sales" },
          { title: "Sales Return", to: "/sales/return" },
          { title: "Customer Statement", to: "/sales/statements" },
        ],
      },
    ],
  },

  /* =======================
     PRODUCTS
  ======================== */
  {
    header: "Products",
    items: [
      {
        title: "Categories",
        icon: Boxes,
        to: "/categories",
      },
      {
        title: "Products",
        icon: Package,
        submenu: [
          { title: "Product Manage", to: "/products" },
          { title: "Variants Manage", to: "/variants" },
        ],
      },
    ],
  },

  /* =======================
     PURCHASES
  ======================== */
  {
    header: "Purchases",
    items: [
      {
        title: "Purchase",
        icon: Truck,
        submenu: [
          { title: "Purchase Create", to: "/purchases/create" },
          { title: "Purchase Manage", to: "/purchases" },
          { title: "Purchase Return", to: "/purchases/return" },
        ],
      },
    ],
  },

  /* =======================
     INVENTORY
  ======================== */
  {
    header: "Inventory",
    items: [
      {
        title: "Stock",
        icon: Boxes,
        submenu: [
          { title: "Stock Details", to: "/inventory/stock" },
          { title: "Stock In", to: "/inventory/in" },
          { title: "Stock Out", to: "/inventory/out" },
          { title: "Low Stock Report", to: "/inventory/low-stock" },
        ],
      },
    ],
  },

  /* =======================
     USERS & PARTIES
  ======================== */
  {
    header: "Users & Parties",
    items: [
      {
        title: "Customers",
        icon: Users,
        to: "/customers",
      },
      {
        title: "Suppliers",
        icon: Truck,
        to: "/suppliers",
      },
      {
        title: "Employees",
        icon: UserCheck,
        to: "/employees",
      },
    ],
  },

  /* =======================
     ACCOUNTING
  ======================== */
  {
    header: "Accounting",
    items: [
      {
        title: "Accounts",
        icon: Calculator,
        submenu: [
          { title: "Chart of Accounts", to: "/accounting/coa" },
          { title: "Journal Entry", to: "/accounting/journal/create" },
          { title: "Journal Manage", to: "/accounting/journal" },
          { title: "Ledger Manage", to: "/accounting/ledger" },
        ],
      },
      {
        title: "Reports",
        icon: BarChart3,
        submenu: [
          { title: "Trial Balance", to: "/reports/trial-balance" },
          { title: "Profit & Loss", to: "/reports/profit-loss" },
          { title: "Balance Sheet", to: "/reports/balance-sheet" },
          { title: "Ledger Report", to: "/reports/ledger" },
          { title: "Party Statement", to: "/reports/statements" },
          { title: "Cash Flow", to: "/reports/cash-flow" },
        ],
      },
    ],
  },

  /* =======================
     HR & PAYROLL
  ======================== */
  {
    header: "HR & Payroll",
    items: [
      {
        title: "Attendance",
        icon: CalendarCheck,
        to: "/hr/attendance",
      },
      {
        title: "Commission",
        icon: Wallet,
        to: "/hr/commission",
      },
      {
        title: "Payroll",
        icon: Briefcase,
        to: "/hr/payroll",
      },
    ],
  },

  /* =======================
     ADMINISTRATION
  ======================== */
  {
    header: "Administration",
    items: [
      {
        title: "Settings",
        icon: Settings,
        to: "/settings",
      },
      {
        title: "User Management",
        icon: Users,
        to: "/settings/users",
      },
      {
        title: "Activity Logs",
        icon: Activity,
        to: "/settings/logs",
      },
    ],
  },
];
