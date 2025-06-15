import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { DATABASES, MENU_ITEMS } from '../../utils/constants';
import { 
  Menu, X, ChevronDown, LogOut, Users, Building, FileText, 
  UserCheck, Settings 
} from 'lucide-react';

const iconMap = {
  Users,
  Building,
  FileText,
  UserCheck,
  Settings
};

const Navigation = ({ currentView, setCurrentView, sidebarOpen, setSidebarOpen }) => {
  const { logout, selectedDb, setSelectedDb } = useAuth();
  const [dbDropdownOpen, setDbDropdownOpen] = useState(false);

  const menuItems = MENU_ITEMS.map(item => ({
    ...item,
    icon: iconMap[item.icon] || Users
  }));

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md bg-white shadow-md"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-gray-800">homeAlign</h1>
            <p className="text-sm text-gray-600">Admin Portal</p>
          </div>

          {/* Database Selector */}
          <div className="p-4 border-b">
            <div className="relative">
              <button
                onClick={() => setDbDropdownOpen(!dbDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm border rounded-md bg-gray-50 hover:bg-gray-100"
              >
                <span>DB: {DATABASES.find(db => db.id === selectedDb)?.name}</span>
                <ChevronDown size={16} />
              </button>
              {dbDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10">
                  {DATABASES.map((db) => (
                    <button
                      key={db.id}
                      onClick={() => {
                        setSelectedDb(db.id);
                        setDbDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      {db.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setCurrentView(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                        currentView === item.id
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={18} className="mr-3" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t">
            <button
              onClick={logout}
              className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
            >
              <LogOut size={18} className="mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Navigation;
