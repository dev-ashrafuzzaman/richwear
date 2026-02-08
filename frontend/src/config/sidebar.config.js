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
  DollarSignIcon,
  DiscIcon,
} from "lucide-react";
import { ROLES } from "../constants/roles";

export const SIDEBAR_MENU = [
  /* =======================
     DASHBOARD
  ======================== */
  {
    header: "Main",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    items: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        to: "/dashboard",
      },
    ],
  },

  /* =======================
     SALES & POS
  ======================== */
  {
    header: "Sales & POS",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.CASHIER],
    items: [
      {
        title: "POS Create",
        icon: ShoppingCart,
        to: "/pos",
        roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.CASHIER],
      },
      {
        title: "Sales",
        roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.CASHIER],
        icon: FileText,
        submenu: [
          {
            title: "Sales Manage",
            roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.CASHIER],
            to: "/sales",
          },
          {
            title: "Sales Return",
            roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.CASHIER],
            to: "/sales/return",
          },
          // { title: "Customer Statement", to: "/sales/statements" },
        ],
      },
    ],
  },

  /* =======================
     PRODUCTS
  ======================== */
  {
    header: "Products",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
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
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    items: [
      {
        title: "Purchase",
        icon: Truck,
        submenu: [
          { title: "Purchase Create", to: "/purchases/create" },
          { title: "Purchase Manage", to: "/purchases" },
          { title: "Purchase Return", to: "/purchase-returns/create" },
          { title: "Purchase Return Manage", to: "/purchase-returns" },
        ],
      },
    ],
  },

  /* =======================
     INVENTORY
  ======================== */
  {
    header: "Inventory",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    items: [
      {
        title: "Stock",
        icon: Boxes,
        submenu: [
          { title: "Stock Details", to: "/inventory/stock" },
          { title: "Stock Transfer", to: "/inventory/stock-transfer" },
          { title: "Low Stock Report", to: "/inventory/low-stock" },
        ],
      },
      {
        title: "Discount",
        icon: DiscIcon,
        submenu: [
          { title: "Discount Create", to: "/inventory/discount-create" },
          { title: "Discounts Manage", to: "/inventory/discounts" },
        ],
      },
    ],
  },

  /* =======================
     USERS & PARTIES
  ======================== */
  {
    header: "Customer",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.CASHIER],
    items: [
      {
        title: "Customers",
        icon: Users,
        to: "/customers",
      },
      {
        title: "Memberships",
        icon: Users,
        to: "/memberships",
      },
    ],
  },
  {
    header: "Parties",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    items: [
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
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    items: [
      // {
      //   title: "Accounts",
      //   icon: Calculator,
      //   submenu: [
      //     { title: "Chart of Accounts", to: "/accounting/coa" },
      //     // { title: "Journal Entry", to: "/journal/entries" },
      //     { title: "Journal Manage", to: "/accounting/journal" },
      //     { title: "Ledger Manage", to: "/accounting/ledger" },
      //   ],
      // },
      {
        title: "Reports",
        roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
        icon: BarChart3,
        submenu: [
          { title: "Trial Balance", to: "/reports/trial-balance" },
          { title: "Profit & Loss", to: "/reports/profit-loss" },
          { title: "Balance Sheet", to: "/reports/balance-sheet" },
          // { title: "Ledger Report", to: "/reports/ledger" },
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
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    items: [
      {
        title: "Attendance",
        icon: CalendarCheck,
        to: "/hr/attendance",
      },
      // {
      //   title: "Commission",
      //   icon: Wallet,
      //   to: "/hr/commission",
      // },
      // {
      //   title: "Payroll",
      //   icon: Briefcase,
      //   to: "/hr/payroll",
      // },
    ],
  },

  /* =======================
     ADMINISTRATION
  ======================== */
  {
    header: "Administration",
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    items: [
      {
        title: "Settings",
        icon: Settings,
        to: "/settings/loyalty",
      },
      {
        title: "User Management",
        icon: Users,
        to: "/settings/users",
      },

      // {
      //   title: "Activity Logs",
      //   icon: Activity,
      //   to: "/settings/logs",
      // },
    ],
  },

  /* =======================
     BRANCH MANAGEMENT
  ======================== */
  {
    header: "Business Operations",
    roles: [ROLES.SUPER_ADMIN],
    items: [
      {
        title: "Branch Manage",
        icon: GitBranch,
        to: "/branches",
      },
      {
        title: "Opening Balance",
        icon: DollarSignIcon,
        to: "/settings/opening-balance",
      },
    ],
  },
];
