import React, { useCallback, useEffect, useMemo, useState } from "react";
import TopNav from "../components/layout/TopNav";
import Sidebar from "../components/layout/Sidebar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../context/useAuth";
import { useLocation } from "react-router-dom";

export default function MainLayout({ children }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();
  const { user, logOut } = useAuth();

  /* ---------------- POS Route Detect ---------------- */
  const isPosScreen = useMemo(() => {
    return location.pathname.startsWith("/pos");
  }, [location.pathname]);

  /* ---------------- Drawer Controls ---------------- */
  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  /* Auto close drawer on route change */
  useEffect(() => {
    closeDrawer();
  }, [location.pathname, closeDrawer]);

  return (
    <div className="min-h-screen flex bg-gray-50 relative">
      {/* ---------------- Sidebar ---------------- */}
      {!isPosScreen && (
        <div className="bg-white border-r border-gray-200 shadow-md">
          <Sidebar isDrawerOpen closeDrawer={closeDrawer} />
        </div>
      )}

      {/* POS Drawer Sidebar (Overlay) */}
      {isPosScreen && isDrawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={closeDrawer}
          />

          {/* Drawer */}
          <div className="fixed left-0 top-0 h-full w-64 bg-white z-50 shadow-xl">
            <Sidebar isDrawerOpen closeDrawer={closeDrawer} />
          </div>
        </>
      )}

      {/* ---------------- Main Content ---------------- */}
      <div className="flex-1 flex flex-col">
        <TopNav
          user={user}
          logOut={logOut}
          toggleDrawer={toggleDrawer}
          isDrawerOpen={isDrawerOpen}
          isPosScreen={isPosScreen}
        />

        <main className="flex-1 p-3 overflow-y-auto">
          {children}
        </main>

        {!isPosScreen && <Footer />}
      </div>
    </div>
  );
}
