import React, { useState, useRef, useEffect } from "react";
import { useThemeStore } from "../../store/themeStore";
import {
  Moon,
  Sun,
  LogOut,
  Menu,
  User,
  Settings,
  Plus,
  ShoppingCart,
  PackagePlus,
  ArrowLeftRight,
  AlertTriangle,
  FilePlus,
  DollarSign,
  ChevronDown,
  Bell,
  Search,
  HelpCircle,
  Grid,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import getTimeGreetingInfo from "../../utils/getTimeGreetingInfo";
import Button from "../ui/Button";
import profileImg from "../../assets/profile.jpg";

export default function TopNav({ user, logOut, toggleDrawer }) {
  const { theme, toggle } = useThemeStore();
  const { greeting, icon } = getTimeGreetingInfo();
  const [showProfile, setShowProfile] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const profileRef = useRef(null);
  const quickActionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
      if (
        quickActionsRef.current &&
        !quickActionsRef.current.contains(e.target)
      ) {
        setShowQuickActions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const quickActions = [
    {
      icon: <Plus className="w-4 h-4" />,
      label: "New Sale",
      path: "/sales/create",
      color: "bg-blue-500",
    },
    {
      icon: <PackagePlus className="w-4 h-4" />,
      label: "New Purchase",
      path: "/purchase/create",
      color: "bg-emerald-500",
    },
    {
      icon: <FilePlus className="w-4 h-4" />,
      label: "Add Product",
      path: "/products/create",
      color: "bg-purple-500",
    },
    {
      icon: <ArrowLeftRight className="w-4 h-4" />,
      label: "Stock Transfer",
      path: "/stock-transfer",
      color: "bg-amber-500",
    },
    {
      icon: <DollarSign className="w-4 h-4" />,
      label: "Add Expense",
      path: "/expenses/create",
      color: "bg-rose-500",
    },
  ];

  return (
    <header
      className={`
      w-full sticky top-0 z-50 backdrop-blur-xl border-b
      ${
        theme === "light"
          ? "bg-white/95 border-gray-100 shadow-[0_1px_30px_rgba(0,0,0,0.05)]"
          : "bg-gray-900/95 border-gray-800 shadow-[0_1px_30px_rgba(0,0,0,0.2)]"
      }
      px-6 py-4 flex items-center justify-between transition-all duration-300
    `}>
      {/* LEFT SECTION */}
      <div className="flex items-center gap-6">
        {/* Mobile Menu */}
        <div className="lg:hidden">
          <button
            onClick={toggleDrawer}
            className={`
              p-2 rounded-xl transition-all duration-200
              ${
                theme === "light"
                  ? "hover:bg-gray-100 active:bg-gray-200"
                  : "hover:bg-gray-800 active:bg-gray-700"
              }
            `}>
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Greeting */}
        <div className="hidden md:flex items-center gap-3">
          <div
            className={`
            p-2 rounded-lg
            ${theme === "light" ? "bg-linear-to-br from-amber-50 to-orange-50" : "bg-linear-to-br from-amber-900/20 to-orange-900/20"}
          `}>
            <div className="text-xl">{icon}</div>
          </div>
          <div>
            <p className="font-semibold text-sm">{greeting},</p>
            <p className="text-xs opacity-70">
              <span className="font-medium">{user?.name || "User"}</span> •{" "}
              {user?.roleName || "Staff"}
            </p>
          </div>
        </div>

        {/* Active Branch */}
        {user?.branchName && (
          <div
            className={`
            hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full
            ${
              theme === "light"
                ? "bg-linear-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-100"
                : "bg-linear-to-r from-blue-900/30 to-indigo-900/30 text-blue-300 border border-blue-800/30"
            }
          `}>
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-medium">{user.branchName}</span>
          </div>
        )}
      </div>

      {/* CENTER SECTION - Search */}
      <div className="hidden lg:flex flex-1 max-w-xl mx-8">
        <div className="relative w-full">
          <Search
            className={`
            absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4
            ${theme === "light" ? "text-gray-400" : "text-gray-500"}
          `}
          />
          <input
            type="text"
            placeholder="Search products, orders, customers..."
            className={`
              w-full pl-11 pr-4 py-2.5 rounded-xl border text-sm
              ${
                theme === "light"
                  ? "bg-gray-50 border-gray-200 placeholder-gray-400 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  : "bg-gray-800/50 border-gray-700 placeholder-gray-500 focus:bg-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              }
              transition-all duration-200 outline-none
            `}
          />
          <kbd
            className={`
            absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-1
            rounded text-xs border font-medium
            ${
              theme === "light"
                ? "bg-gray-100 border-gray-200 text-gray-600"
                : "bg-gray-800 border-gray-700 text-gray-400"
            }
          `}>
            ⌘K
          </kbd>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex items-center gap-3">
        {/* Help */}
        <button
          className={`
          hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
          ${
            theme === "light"
              ? "text-gray-600 hover:bg-gray-100"
              : "text-gray-300 hover:bg-gray-800"
          }
        `}>
          <HelpCircle className="w-4 h-4" />
          <span className="hidden xl:inline">Help</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            className={`
            p-2 rounded-xl transition-all duration-200 relative
            ${
              theme === "light"
                ? "hover:bg-gray-100 active:bg-gray-200"
                : "hover:bg-gray-800 active:bg-gray-700"
            }
          `}>
            <Bell className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900"></span>
          </button>
        </div>

        {/* Quick Actions Dropdown */}
        <div className="relative" ref={quickActionsRef}>
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={`
              hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${
                theme === "light"
                  ? "bg-linear-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/25"
                  : "bg-linear-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
              }
            `}>
            <Grid className="w-4 h-4" />
            Quick Actions
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${showQuickActions ? "rotate-180" : ""}`}
            />
          </button>

          {showQuickActions && (
            <div
              className={`
              absolute right-0 mt-2 w-64 rounded-2xl shadow-xl border overflow-hidden
              ${
                theme === "light"
                  ? "bg-white border-gray-200 shadow-2xl shadow-gray-200/50"
                  : "bg-gray-800 border-gray-700 shadow-2xl shadow-black/50"
              }
              animate-in fade-in slide-in-from-top-2 duration-200
            `}>
              <div className="p-4 border-b">
                <p className="font-semibold text-sm">Quick Actions</p>
                <p className="text-xs opacity-60 mt-1">Common workflows</p>
              </div>
              <div className="p-2">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    to={action.path}
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-lg mb-1 last:mb-0 transition-all duration-200
                      ${
                        theme === "light"
                          ? "hover:bg-gray-50"
                          : "hover:bg-gray-700/50"
                      }
                    `}
                    onClick={() => setShowQuickActions(false)}>
                    <div className={`${action.color} p-2 rounded-lg`}>
                      <div className="text-white">{action.icon}</div>
                    </div>
                    <span className="font-medium text-sm">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick POS Button */}
        <Link to="/pos">
          <Button
            className={`
            gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200
            bg-linear-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600
            text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40
          `}>
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Quick POS</span>
          </Button>
        </Link>

        {/* Low Stock Alert */}
        <Link
          to="/inventory/low-stock"
          className={`
            relative p-2 rounded-xl transition-all duration-200
            ${theme === "light" ? "hover:bg-amber-50" : "hover:bg-amber-900/20"}
          `}>
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900 animate-pulse"></span>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggle}
          className={`
            p-2 rounded-xl transition-all duration-200
            ${
              theme === "light"
                ? "hover:bg-gray-100 active:bg-gray-200"
                : "hover:bg-gray-800 active:bg-gray-700"
            }
          `}>
          {theme === "light" ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 p-1 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
            <div className="relative">
              <img
                src={profileImg}
                alt="Profile"
                className="w-9 h-9 rounded-full border-2 border-white dark:border-gray-800 shadow-md"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-800"></div>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${showProfile ? "rotate-180" : ""}`}
            />
          </button>

          {showProfile && (
            <div
              className={`
              absolute right-0 mt-3 w-80 rounded-2xl shadow-2xl border overflow-hidden
              ${
                theme === "light"
                  ? "bg-white border-gray-200 shadow-gray-200/50"
                  : "bg-gray-800 border-gray-700 shadow-black/50"
              }
              animate-in fade-in slide-in-from-top-2 duration-200
            `}>
              {/* User Info */}
              <div className="p-6 bg-linear-to-r from-blue-500/10 to-indigo-500/10">
                <div className="flex items-center gap-4">
                  <img
                    src={profileImg}
                    alt="Profile"
                    className="w-14 h-14 rounded-xl border-2 border-white dark:border-gray-800 shadow-lg"
                  />
                  <div>
                    <p className="font-bold text-lg">{user?.name}</p>
                    <p className="text-sm opacity-70">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`
                        px-2 py-0.5 rounded-full text-xs font-medium
                        ${
                          theme === "light"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-blue-900/30 text-blue-300"
                        }
                      `}>
                        {user?.roleName || "Staff"}
                      </span>
                      <span
                        className={`
                        px-2 py-0.5 rounded-full text-xs font-medium
                        ${
                          theme === "light"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-emerald-900/30 text-emerald-300"
                        }
                      `}>
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-3">
                <Link
                  to="/profile"
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-200
                    ${
                      theme === "light"
                        ? "hover:bg-gray-50"
                        : "hover:bg-gray-700/50"
                    }
                  `}
                  onClick={() => setShowProfile(false)}>
                  <div
                    className={`
                    p-2 rounded-lg
                    ${theme === "light" ? "bg-blue-50" : "bg-blue-900/30"}
                  `}>
                    <User className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">My Profile</p>
                    <p className="text-xs opacity-60">View and edit profile</p>
                  </div>
                </Link>

                <Link
                  to="/settings"
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-200
                    ${
                      theme === "light"
                        ? "hover:bg-gray-50"
                        : "hover:bg-gray-700/50"
                    }
                  `}
                  onClick={() => setShowProfile(false)}>
                  <div
                    className={`
                    p-2 rounded-lg
                    ${theme === "light" ? "bg-gray-100" : "bg-gray-700/30"}
                  `}>
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Settings</p>
                    <p className="text-xs opacity-60">System preferences</p>
                  </div>
                </Link>

                {/* Logout */}
                <button
                  onClick={logOut}
                  className={`
                    w-full flex items-center justify-center gap-2 px-4 py-3.5 mt-3
                    rounded-xl font-medium text-sm transition-all duration-200
                    ${
                      theme === "light"
                        ? "bg-linear-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 text-red-600"
                        : "bg-linear-to-r from-red-900/20 to-rose-900/20 hover:from-red-900/30 hover:to-rose-900/30 text-red-400"
                    }
                  `}>
                  <LogOut className="w-4 h-4" />
                  Logout Session
                </button>
              </div>

              {/* Footer */}
              <div
                className={`
                px-6 py-3 border-t text-xs
                ${theme === "light" ? "border-gray-100 text-gray-500" : "border-gray-700 text-gray-400"}
              `}>
                {/* Last login: Today at 09:42 AM */}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
