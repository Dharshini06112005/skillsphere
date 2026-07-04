import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  User,
  MessageSquare,
  Briefcase,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Sidebar Menu Items based on Roles
  const getMenuItems = () => {
    const commonItems = [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Chats', path: '/chats', icon: MessageSquare },
      { name: 'Profile', path: '/profile', icon: User },
    ];

    if (user?.role === 'freelancer') {
      return [
        ...commonItems.slice(0, 1),
        { name: 'Gigs Marketplace', path: '/gigs', icon: Briefcase },
        { name: 'My Proposals', path: '/proposals', icon: FileText },
        { name: 'Analytics', path: '/analytics', icon: TrendingUp },
        ...commonItems.slice(1)
      ];
    } else if (user?.role === 'client') {
      return [
        ...commonItems.slice(0, 1),
        { name: 'Post a Gig', path: '/create-gig', icon: Briefcase },
        { name: 'My Projects', path: '/projects', icon: FileText, badge: 'Soon' },
        ...commonItems.slice(1)
      ];
    } else if (user?.role === 'admin') {
      return [
        { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Admin Panel', path: '/admin', icon: ShieldCheck },
        ...commonItems.slice(2)
      ];
    }
    return commonItems;
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-dark-bg bg-gradient-mesh text-gray-100 flex flex-col md:flex-row">
      
      {/* Mobile Top Bar */}
      <header className="md:hidden glass px-6 py-4 flex justify-between items-center z-50">
        <h1 className="text-xl font-bold text-white tracking-wider">
          Skill<span className="text-indigo-400">Sphere</span>
        </h1>
        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <Bell size={20} />
          </button>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Sidebar navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 glass z-40 transition-transform duration-300 md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div className="p-6">
          <div className="hidden md:block mb-8">
            <h1 className="text-2xl font-extrabold text-white tracking-widest text-glow">
              Skill<span className="text-indigo-400">Sphere</span>
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Freelance Ecosystem</p>
          </div>

          <div className="flex items-center gap-3 p-3 mb-6 rounded-2xl bg-gray-900/40 border border-gray-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold uppercase text-lg">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</h2>
              <span className="text-[10px] text-indigo-400 font-medium uppercase tracking-wider bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30 inline-block mt-0.5">
                {user?.role || 'Guest'}
              </span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                      : 'text-gray-400 hover:text-white hover:bg-gray-900/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-400 transition-colors'} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-gray-800 text-gray-500'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-gray-800/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-950/20 hover:border-red-900/30 border border-transparent transition-all cursor-pointer"
          >
            <LogOut size={18} />
            <span className="text-sm font-semibold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden min-h-screen">
        {/* Desktop Top Nav */}
        <header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-gray-900/40 z-10 glass">
          <div className="flex items-center max-w-md w-full bg-gray-950/40 border border-gray-900 rounded-xl px-4 py-2 text-gray-400 focus-within:border-indigo-600/50 transition-all">
            <Search size={18} className="mr-3 text-gray-500" />
            <input
              type="text"
              placeholder="Search projects, skills, or clients..."
              className="bg-transparent border-none outline-none w-full text-sm text-gray-200 placeholder-gray-500"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2.5 rounded-xl bg-gray-900/50 border border-gray-800 text-gray-400 hover:text-white hover:border-indigo-500/30 transition-all cursor-pointer">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-gray-900 animate-pulse"></span>
            </button>

            <div className="h-8 w-px bg-gray-800"></div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="block text-sm font-semibold text-white">{user?.name}</span>
                <span className="block text-[10px] text-gray-500 text-right uppercase tracking-wider">{user?.role}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold uppercase">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Content container */}
        <div className="flex-grow p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
