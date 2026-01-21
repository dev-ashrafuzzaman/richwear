import React, { useState, useRef, useEffect } from "react";
import { useThemeStore } from "../../store/themeStore";
import { Moon, Sun, LogOut, Menu, User, Settings } from "lucide-react";
import getTimeGreetingInfo from "../../utils/getTimeGreetingInfo";
import Button from "../ui/Button";
import profileImg from "../../assets/profile.jpg";

export default function TopNav({ user, logOut, toggleDrawer }) {
  console.log("Rendering TopNav with user:", user);
  const { theme, toggle } = useThemeStore();
  const { greeting, icon } = getTimeGreetingInfo();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);  
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={`w-full  top-0 z-30 backdrop-blur-md 
      border-b border-gray-200/60 
      ${theme === "light" ? "bg-white/80" : "bg-gray-900/70 text-white"}
      px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm transition-all`}>
      {/* LEFT SIDE */}
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden relative z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => toggleDrawer("dda")}
            className="p-2 border border-gray-300 dark:border-gray-700 rounded-md">
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Greeting */}
        <div className="flex items-center gap-2">
          <div className="text-2xl sm:text-3xl">{icon}</div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100">
              {greeting},
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.name || "User"}
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-4 relative">
        {/* Profile Section */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile((prev) => !prev)}
            className="relative flex items-center justify-center">
            {/* Avatar */}
            <img
              src={profileImg}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700 shadow-sm"
            />

            {/* Online Badge */}
            <span className="absolute top-0 right-0 block w-3 h-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900"></span>
          </button>

          {/* Hover/Click Dropdown */}
          {showProfile && (
            <div
              className={`absolute right-0 mt-3 w-60 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700
              ${theme === "light" ? "bg-white" : "bg-gray-800"} 
              transition-all animate-in fade-in slide-in-from-top-2 p-3`}>
              {/* USER HEADER */}
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 pb-3">
                <img
                  src={profileImg}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                />
                <div>
                  <p className="text-sm font-semibold">
                    {user?.name || "John Doe"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
              </div>

              {/* MENU OPTIONS */}
              <div className="mt-3 text-sm space-y-1">
                <button
                  onClick={toggle}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  {theme === "light" ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                  Change Theme
                </button>

                <button className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <User className="w-4 h-4" />
                  Profile
                </button>

                <button className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </div>

              {/* LOGOUT */}
              <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                <button
                  onClick={logOut}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium 
                  rounded-md bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 
                  text-red-600 dark:text-red-400 transition">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
