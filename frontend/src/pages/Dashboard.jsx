import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  Briefcase,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Calendar,
  Layers
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await API.get('/profile/me');
        if (response.data.success) {
          setProfile(response.data.profile);
        }
      } catch (err) {
        console.error('Failed to load profile for dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Stat definitions based on role
  const isFreelancer = user?.role === 'freelancer';

  const stats = isFreelancer
    ? [
        { label: 'Gig Applications', value: '12', icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-500/10', path: '/proposals' },
        { label: 'Hourly Rate', value: `$${profile?.hourlyRate || 0}/hr`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', path: '/profile' },
        { label: 'Active Projects', value: '3', icon: Layers, color: 'text-pink-400', bg: 'bg-pink-500/10', path: '/dashboard' },
        { label: 'Profile Views', value: '142', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-500/10', path: '/profile' },
      ]
    : [
        { label: 'Gigs Posted', value: '4', icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-500/10', path: '/gigs' },
        { label: 'Total Spent', value: '$1,250', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', path: '/dashboard' },
        { label: 'Freelancers Hired', value: '2', icon: Users, color: 'text-pink-400', bg: 'bg-pink-500/10', path: '/dashboard' },
        { label: 'Open Gigs', value: '1', icon: Layers, color: 'text-cyan-400', bg: 'bg-cyan-500/10', path: '/gigs' },
      ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="glass p-6 md:p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -right-24 -bottom-24 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-25"></div>
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="text-indigo-400">{user?.name}</span>!
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-xl">
            You're logged into your <span className="text-indigo-300 font-medium">{user?.role}</span> workspace. Manage projects, collaborate, and secure payments in your local area.
          </p>
        </div>

        {/* Verification Status Pills */}
        <div className="flex flex-wrap gap-3 relative z-10 shrink-0">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs font-semibold">
            <ShieldCheck size={14} />
            Email Verified
          </div>
          {profile?.user?.isTwoFactorEnabled ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 text-indigo-400 text-xs font-semibold">
              <ShieldCheck size={14} />
              2FA Secured
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-950/20 border border-amber-900/40 text-amber-400 text-xs font-semibold">
              <ShieldAlert size={14} />
              2FA Inactive
            </div>
          )}
        </div>
      </div>

      {/* Analytics Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx} 
              onClick={() => stat.path && navigate(stat.path)}
              className={`glass p-6 rounded-2xl glass-hover flex items-center justify-between ${
                stat.path ? 'cursor-pointer border border-transparent hover:border-indigo-500/20' : ''
              }`}
            >
              <div className="space-y-1">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">{stat.label}</span>
                <span className="text-2xl font-bold text-white block">{stat.value}</span>
              </div>
              <div className={`p-3.5 rounded-xl ${stat.bg} ${stat.color}`}>
                <Icon size={22} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Module Progress Status */}
        <div className="glass p-6 rounded-3xl lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-indigo-400" />
              Module 1 Implementation Status
            </h3>
            <span className="text-xs bg-indigo-950/40 text-indigo-400 px-3 py-1 rounded-full border border-indigo-900/30 font-semibold uppercase">
              Completed
            </span>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              The first module is fully implemented and running locally! Below are the verified configurations:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-2xl bg-gray-950/40 border border-gray-900 space-y-2">
                <p className="font-semibold text-white">🔑 Authentication System</p>
                <ul className="text-xs text-gray-400 list-disc list-inside space-y-1">
                  <li>JWT Access tokens with automatic refreshes</li>
                  <li>Role-Based Access Control (RBAC) middleware</li>
                  <li>Google OAuth callback route setup</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-gray-950/40 border border-gray-900 space-y-2">
                <p className="font-semibold text-white">🔒 Two-Factor Security</p>
                <ul className="text-xs text-gray-400 list-disc list-inside space-y-1">
                  <li>Google Authenticator secret generator</li>
                  <li>QR code creation via speakeasy & qrcode</li>
                  <li>OTP check code verification endpoints</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-gray-950/40 border border-gray-900 space-y-2">
                <p className="font-semibold text-white">📧 Modular Mail System</p>
                <ul className="text-xs text-gray-400 list-disc list-inside space-y-1">
                  <li>Nodemailer mock system (Ethereal Email)</li>
                  <li>Automatic email test URL developer print</li>
                  <li>Ready to configure standard SMTP / Gmail</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-gray-950/40 border border-gray-900 space-y-2">
                <p className="font-semibold text-white">👤 Profile Management</p>
                <ul className="text-xs text-gray-400 list-disc list-inside space-y-1">
                  <li>Client/Freelancer schema splitting</li>
                  <li>Public views for freelancer details</li>
                  <li>Skill proficiency and pricing storage</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Activity Quick-view */}
        <div className="glass p-6 rounded-3xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-gray-800 pb-4">Profile Overview</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Account Owner</span>
                <span className="text-white font-medium">{user?.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Email</span>
                <span className="text-white font-medium truncate max-w-[160px]">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Role</span>
                <span className="text-indigo-300 font-semibold uppercase">{user?.role}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Hourly Rate</span>
                <span className="text-emerald-400 font-medium">
                  {isFreelancer ? `$${profile?.hourlyRate || 0}/hr` : 'N/A (Client)'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Availability</span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${
                  profile?.availability === 'available' 
                    ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30'
                    : 'bg-amber-950/30 text-amber-400 border border-amber-900/30'
                }`}>
                  {profile?.availability || 'available'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => window.location.href = '/profile'}
              className="w-full bg-gray-900 border border-gray-800 hover:border-indigo-500/30 text-white text-sm font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800/80 transition-all cursor-pointer"
            >
              Update Profile Details
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
