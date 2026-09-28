import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, BarChart, Settings as SettingsIcon, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useApp';

export default function Layout({ mockupAuth }) {
  const location = useLocation();
  const { theme, toggle } = useTheme();

  const navItems = [
    { path: '/dashboard', label: 'Ward Command', icon: Activity },
    { path: '/analytics', label: 'Clinical Analytics', icon: BarChart },
    { path: '/settings', label: 'Alert Preferences', icon: SettingsIcon },
  ];

  const omniMedItems = [
    { path: '/omnimed', label: 'OmniMed AI Suite', icon: Activity },
  ];

  return (
    <div className="flex h-screen bg-[#f0f4f9] dark:bg-[#080c14] text-gray-800 dark:text-gray-300 font-mono selection:bg-cyan-900">
      {/* Persistent Sidebar */}
      <div className="w-64 bg-white dark:bg-[#0f1522] border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-widest flex items-center gap-2">
            <Activity className="text-cyan-500" /> Setu-Drishti
          </h1>
          <span className="text-[10px] uppercase text-cyan-700 dark:text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-900 mt-2 inline-block">Pro Edition</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm uppercase tracking-widest font-bold ${isActive ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900' : 'text-gray-500 hover:text-gray-800 dark:text-gray-300 hover:bg-gray-200/50 dark:bg-gray-800/50'}`}
              >
                <Icon size={18} /> {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="nav-section-label px-4 py-2 mt-4 text-[10px] uppercase text-gray-500 font-bold tracking-widest" aria-hidden="true">Advanced Subsystems</div>
        <nav className="p-4 pt-0 space-y-2">
          {omniMedItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm uppercase tracking-widest font-bold ${isActive ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900' : 'text-gray-500 hover:text-gray-800 dark:text-gray-300 hover:bg-gray-200/50 dark:bg-gray-800/50'}`}
              >
                <Icon size={18} /> {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-4 bg-gray-50 dark:bg-[#0a0f18]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-900 flex items-center justify-center text-cyan-400 font-bold border border-cyan-700">DR</div>
            <div className="flex flex-col">
               <span className="text-xs font-bold text-gray-800 dark:text-gray-300">Dr. Sarah Jenkins</span>
               <span className="text-[10px] text-gray-500 uppercase tracking-widest">Attending ICU</span>
            </div>
          </div>
          <button onClick={() => window.location.href='/'} className="flex flex-1 items-center justify-center gap-2 text-xs text-red-500 hover:text-red-400 uppercase tracking-widest p-2 rounded hover:bg-red-950/30 transition-colors text-left font-bold border border-transparent hover:border-red-900 hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <LogOut size={14} /> Leave Demo
          </button>
          <button onClick={toggle} className="flex items-center justify-center gap-2 text-xs text-cyan-600 dark:text-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-400 uppercase tracking-widest p-2 rounded hover:bg-cyan-100 dark:hover:bg-cyan-950/30 transition-colors w-full text-center font-bold border border-cyan-200 dark:border-cyan-900 shadow-sm">
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto bg-[#f0f4f9] dark:bg-[#080c14]">
        <Outlet />
      </div>
    </div>
  );
}