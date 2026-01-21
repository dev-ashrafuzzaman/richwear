import React, { useCallback, useEffect, useState } from "react";
import TopNav from "../components/layout/TopNav";
import Sidebar from "../components/layout/Sidebar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../context/useAuth";
import { useLocation } from "react-router-dom";
 
export default function MainLayout({ children }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();
  const { user, logOut } = useAuth();

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  // Close sidebar automatically on route change
  useEffect(() => {
    closeDrawer();
  }, [location.pathname, closeDrawer]);

  return (
    <div className="min-h-screen flex bg-gray-50 ">
     <div className="bg-white border-r border-gray-200 shadow-md">
       <Sidebar isDrawerOpen={isDrawerOpen} closeDrawer={closeDrawer} />
     </div>
      <div className="flex-1 flex flex-col">
        <TopNav
          user={user}
          logOut={logOut}
          toggleDrawer={toggleDrawer}
          isDrawerOpen={isDrawerOpen}
        />
        <main className="flex-1 p-3 overflow-y-auto">{children}</main>
        {/* <Footer /> */}
      </div>
    </div>
  );
}
