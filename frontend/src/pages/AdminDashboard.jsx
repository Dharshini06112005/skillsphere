import React, { useEffect, useState } from 'react';
import API from '../services/api';
import {
  Users,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Lock,
  Unlock,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Briefcase
} from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'disputes'

  const [message, setMessage] = useState({ type: '', text: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const userRes = await API.get('/admin/users');
      if (userRes.data.success) {
        setUsers(userRes.data.users);
      }

      const disputeRes = await API.get('/admin/disputes');
      if (disputeRes.data.success) {
        setDisputes(disputeRes.data.disputes);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to retrieve administrative records.' });
    } finally {
      setLoading(false);
    }
  };

  // Toggle user suspension
  const handleToggleSuspend = async (userId) => {
    setActionLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await API.put(`/admin/users/${userId}/suspend`);
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update user login access.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle freelancer badge verification
  const handleToggleVerification = async (userId) => {
    setActionLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await API.put(`/admin/users/${userId}/verify`);
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to toggle freelancer verification.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Resolve Dispute
  const handleResolveDispute = async (disputeId, resolution) => {
    if (!window.confirm(`Are you sure you want to resolve this dispute by choosing: ${resolution.replace('_', ' ')}?`)) return;

    setActionLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await API.put(`/admin/disputes/${disputeId}/resolve`, { resolution });
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
        loadAdminData();
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Resolution execution failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Admin stats counters
  const totalRevenue = disputes.reduce((sum, d) => sum + d.amount, 0) + 12500; // mock total ledger volume
  const activeDisputesCount = disputes.filter(d => d.status === 'pending').length;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Admin Operations Panel</h1>
        <p className="text-gray-400 text-sm mt-1">Manage platform accounts, verify local professionals, and resolve milestone disputes.</p>
      </div>

      {/* Notifications */}
      {message.text && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
            : 'bg-red-950/30 border-red-800 text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      {/* Admin stats counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-semibold block">Total Users</span>
            <span className="text-3xl font-black text-white">{users.length}</span>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Users size={22} />
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-semibold block">Active Disputes</span>
            <span className="text-3xl font-black text-red-400">{activeDisputesCount}</span>
          </div>
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 uppercase font-semibold block">Escrow Flow Volume</span>
            <span className="text-3xl font-black text-emerald-400">${totalRevenue}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-4 border-b border-gray-950 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          User Accounts
        </button>
        <button
          onClick={() => setActiveTab('disputes')}
          className={`pb-2 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'disputes'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Dispute Tickets ({activeDisputesCount})
        </button>
      </div>

      {/* Tab contents */}
      <div className="glass p-6 rounded-3xl shadow-xl">
        
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-950/40 text-gray-400 font-semibold border-b border-gray-900">
                <tr>
                  <th className="p-4 rounded-tl-xl">User details</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Account status</th>
                  <th className="p-4">Verifications</th>
                  <th className="p-4 rounded-tr-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900/60">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-900/20">
                    <td className="p-4">
                      <div className="font-semibold text-white">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs uppercase font-bold text-indigo-400 bg-indigo-950/30 border border-indigo-900/30 rounded px-2.5 py-0.5">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        u.status === 'active' ? 'bg-emerald-950/20 text-emerald-400' : 'bg-red-950/20 text-red-400'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.role === 'freelancer' ? (
                        <button
                          onClick={() => handleToggleVerification(u._id)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-400 transition-colors"
                        >
                          <ShieldCheck size={14} className={u.isEmailVerified ? 'text-indigo-400' : 'text-gray-600'} />
                          Toggle Badge
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500 italic">Not applicable</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleSuspend(u._id)}
                          disabled={actionLoading}
                          className={`text-xs font-semibold py-1.5 px-3 rounded-lg border transition-all cursor-pointer ${
                            u.status === 'active'
                              ? 'bg-red-950/30 border-red-900/40 text-red-400 hover:bg-red-600 hover:text-white'
                              : 'bg-emerald-950/30 border-emerald-900/40 text-emerald-400 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'disputes' && (
          <div className="space-y-4">
            {disputes.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center py-6">No dispute tickets raised yet.</p>
            ) : (
              disputes.map((d) => (
                <div key={d._id} className="p-5 rounded-2xl bg-gray-950/40 border border-gray-900 flex flex-col md:flex-row justify-between gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-red-400 bg-red-950/20 border border-red-900/30 rounded-full px-2.5 py-0.5 font-bold uppercase tracking-wider">
                        Disputed Milestone
                      </span>
                      <span className="text-xs text-gray-500">
                        Amount contested: <strong className="text-emerald-400">${d.amount}</strong>
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{d.gig?.title}</h3>
                    <p className="text-xs text-gray-400 max-w-xl leading-relaxed whitespace-pre-wrap">
                      <strong>Complaint:</strong> {d.reason}
                    </p>

                    <div className="flex gap-4 text-[10px] text-gray-500 pt-1">
                      <span>Client: <strong>{d.client?.name}</strong></span>
                      <span>Freelancer: <strong>{d.freelancer?.name}</strong></span>
                      <span>Ticket status: <strong className="text-indigo-400 uppercase">{d.status}</strong></span>
                    </div>
                  </div>

                  {d.status === 'pending' && (
                    <div className="flex md:flex-col justify-end gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-900">
                      <button
                        onClick={() => handleResolveDispute(d._id, 'release_freelancer')}
                        disabled={actionLoading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-4 rounded-xl cursor-pointer"
                      >
                        Release to Freelancer
                      </button>
                      <button
                        onClick={() => handleResolveDispute(d._id, 'refund_client')}
                        disabled={actionLoading}
                        className="bg-gray-900 border border-gray-800 hover:border-red-500/30 hover:text-red-400 text-white text-xs font-semibold py-2 px-4 rounded-xl cursor-pointer"
                      >
                        Refund Client
                      </button>
                    </div>
                  )}

                  {d.status !== 'pending' && (
                    <div className="shrink-0 flex items-center">
                      <span className="text-xs font-bold uppercase tracking-wider py-1.5 px-3 rounded-xl bg-gray-900 border border-gray-800 text-gray-500">
                        Resolved: {d.status.replace('resolved_', '')}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
