import React, { useState, useEffect, useRef } from "react";
import logo from "../../assets/logo.png";
import {
  MessageCircle,
  Youtube,
  Linkedin,
  PhoneCall,
  ShoppingBag,
} from "lucide-react";
import { SIDEBAR_MENU } from "../../config/sidebar.config";
import SidebarItem from "./SidebarItem";

export default function Sidebar({ isDrawerOpen, closeDrawer }) {
  const [openMenu, setOpenMenu] = useState(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        closeDrawer();
      }
    };

    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.body.style.overflow = "auto";
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDrawerOpen, closeDrawer]);



  return (
    <>
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={closeDrawer}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed md:static top-0 left-0 h-screen bg-white border-r border-gray-200 flex flex-col shadow-md-r z-50 w-64
        transform transition-all duration-300 ease-in-out
        ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="Logo"
              className="h-11 mx-auto"
            />
            <span className="text-lg font-semibold"></span>
          </div>
        </div>

        <div className="px-4 py-2">
          <div className="flex items-center justify-center border border-blue-100 bg-blue-50 text-blue-600 cursor-pointer rounded-md py-2 text-sm font-medium">
            <ShoppingBag className="w-4 h-4 mr-2" />
            CREATE POS SALES
          </div>
        </div>

        
        <div className="flex-1 overflow-y-auto px-1 custom-scroll">
          {SIDEBAR_MENU.map((section) => (
            <div key={section.header}>
              <p className="px-3 mt-3 mb-2 text-xs text-gray-400 uppercase">
                {section.header}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <SidebarItem
                    key={item.title}
                    item={item}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    closeDrawer={closeDrawer}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Support */}
        <div className="m-4 p-3 border border-dashed border-green-400 rounded-lg bg-green-50/30">
          <p className="text-sm font-medium text-gray-800 text-center">
            Having any problem?
          </p>

          <div className="flex items-center justify-center gap-2 mt-3">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`https://wa.me/${"+8801711990848".replace(
                /\D/g,
                ""
              )}?text=${encodeURIComponent(`Hello Codivoo Support 👋  
I'm contacting from the Chart of Account software (sidebar → Contact Support).  
I need some help regarding the Report section. Could you please assist me with this?`)}`}
              title="Send WhatsApp Message"
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700
                text-white text-xs px-3 py-1.5 rounded-md"
            >
              <MessageCircle className="w-4 h-4" />
              Report
            </a>
            <button className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-md">
              <Youtube className="w-4 h-4" />
              Tutorials
            </button>
          </div>

          <div className="border-t border-gray-200 my-3"></div>
          <p className="text-xs text-center text-gray-500 mb-2">
            For Instant Support
          </p>

          <div className="flex items-center justify-center gap-3">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`https://wa.me/${"+8801711990848".replace(
                /\D/g,
                ""
              )}?text=${encodeURIComponent(`Hello Codivoo Support 👋  
I'm contacting from the *Chart of Account* software (sidebar → Contact Support).  
I need some assistance regarding my account setup. Could you please help me?`)}`}
              className="bg-[#00B2FF]/10 text-[#00B2FF] p-2 rounded-full"
              title="Send WhatsApp Message"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <a
              href="tel:+8801711990848"
              className="bg-green-100 text-green-600 p-2 rounded-full"
              title="Call Now"
            >
              <PhoneCall className="w-4 h-4" />
            </a>
            <a
              target="_blank"
              href="https://www.linkedin.com/company/codivoo/"
              className="bg-blue-100 text-blue-600 p-2 rounded-full"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}