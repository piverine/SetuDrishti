import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, BarChart, Settings as SettingsIcon, LogOut, Moon, Sun } from 'lucide-react';
import { UserButton } from '@clerk/clerk-react';
import { useTheme } from '../context/ThemeContext';

export default function Layout({ mockupAuth }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { path: '/dashboard', label: 'Ward Command', icon: Activity },
    { path: '/analytics', label: 'Clinical Analytics', icon: BarChart },
    { path: '/settings', label: 'Alert Preferences', icon: SettingsIcon },
  ];

  const isDark = theme === 'dark';

  return (
    <div className={`flex h-screen ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-gray-300'
        : 'bg-gradient-to-br from-blue-50 via-white to-blue-50 text-gray-900'
    } font-mono selection:${isDark ? 'bg-blue-900' : 'bg-blue-200'}`}>
      {/* Persistent Sidebar */}
      <div className={`w-64 ${
        isDark
          ? 'bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700'
          : 'bg-gradient-to-b from-white to-gray-50 border-gray-200'
      } border-r flex flex-col shadow-xl`}>
        {/* Logo Section */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'}`}>
          <h1 className={`text-2xl font-bold tracking-widest flex items-center gap-3 ${
            isDark ? 'text-blue-400' : 'text-blue-600'
          }`}>
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600">
              <Activity className="text-white" size={20} />
            </div>
            <span>Setu-Drishti</span>
          </h1>
          <div className={`mt-3 px-3 py-1 rounded-full border text-[10px] uppercase font-bold tracking-widest inline-block ${
            isDark
              ? 'bg-blue-950/40 text-blue-300 border-blue-800'
              : 'bg-blue-100 text-blue-700 border-blue-300'
          }`}>
            Hospital edition
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm uppercase tracking-widest font-bold duration-200 ${
                  isActive
                    ? isDark
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-700 shadow-lg shadow-blue-500/20'
                      : 'bg-blue-100 text-blue-700 border border-blue-300 shadow-md shadow-blue-200'
                    : isDark
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} /> {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Theme Toggle */}
        <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all duration-200 ${
              isDark
                ? 'bg-yellow-900/20 text-yellow-300 hover:bg-yellow-900/40 border border-yellow-800'
                : 'bg-blue-900/20 text-blue-700 hover:bg-blue-900/40 border border-blue-300'
            }`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <span className="text-xs">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        {/* User Section */}
        <div className={`p-4 border-t ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-white/50'} flex flex-col gap-4`}>
          <div className="flex items-center gap-3">
            {mockupAuth ? (
               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${
                 isDark
                   ? 'bg-blue-900 text-blue-300 border-blue-700'
                   : 'bg-blue-100 text-blue-700 border-blue-300'
               }`}>DR</div>
            ) : (
               <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-10 h-10" } }} />
            )}
            <div className="flex flex-col">
               <span className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>Dr. Sarah Jenkins</span>
               <span className={`text-[10px] uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Attending ICU</span>
            </div>
          </div>
          {mockupAuth && (
            <button 
              onClick={() => window.location.href='/'} 
              className={`flex items-center gap-2 text-xs uppercase tracking-widest p-2 rounded-lg transition-all duration-200 font-bold border ${
                isDark
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-950/30 border-red-900/50 hover:border-red-700'
                  : 'text-red-600 hover:text-red-700 hover:bg-red-100 border-red-200 hover:border-red-300'
              }`}
            >
              <LogOut size={14} /> Leave Demo
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 overflow-auto ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <Outlet />
      </div>
    </div>
  );
}
