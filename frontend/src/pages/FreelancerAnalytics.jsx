import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  Users,
  Star,
  Loader2,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';

const FreelancerAnalytics = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const profileRes = await API.get('/profile/me');
        if (profileRes.data.success) {
          setProfile(profileRes.data.profile);
        }

        const reviewRes = await API.get(`/reviews/user/${user?._id}`);
        if (reviewRes.data.success) {
          setReviews(reviewRes.data.reviews);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Simulated monthly earnings data for bar chart
  const monthlyEarnings = [
    { month: 'Jan', amount: 450 },
    { month: 'Feb', amount: 800 },
    { month: 'Mar', amount: 1200 },
    { month: 'Apr', amount: 950 },
    { month: 'May', amount: 1500 },
    { month: 'Jun', amount: 2100 },
  ];

  const maxEarning = Math.max(...monthlyEarnings.map(m => m.amount));
  const totalEarningsSum = monthlyEarnings.reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Freelance Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Monitor profile traffic, monthly income statements, and client satisfaction indexes.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Total Earnings</span>
            <span className="text-2xl font-bold text-white block">${totalEarningsSum}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Gig Bids</span>
            <span className="text-2xl font-bold text-white block">12</span>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Briefcase size={20} />
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Profile Traffic</span>
            <span className="text-2xl font-bold text-white block">142 views</span>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <Users size={20} />
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Reputation Score</span>
            <span className="text-2xl font-bold text-white block">
              {profile?.reputationScore || 5.0} / 5.0
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Star size={20} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Earnings Chart Card (Left Columns) */}
        <div className="lg:col-span-2 glass p-6 md:p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
            <TrendingUp size={20} className="text-indigo-400" />
            Monthly Revenue timeline
          </h2>

          <div className="h-64 flex items-end justify-between gap-4 pt-8 px-2 border-b border-gray-800">
            {monthlyEarnings.map((item, idx) => {
              const heightPercentage = (item.amount / maxEarning) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  
                  {/* Tooltip */}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white text-[10px] font-bold py-1 px-2 rounded-lg translate-y-1 block shadow">
                    ${item.amount}
                  </span>

                  {/* Animated Bar */}
                  <div
                    style={{ height: `${heightPercentage * 0.7}%` }}
                    className="w-full bg-gradient-to-t from-indigo-600/80 to-indigo-500 rounded-t-xl group-hover:from-indigo-500 group-hover:to-purple-500 transition-all duration-500 shadow-md shadow-indigo-600/10"
                  ></div>

                  {/* Axis Label */}
                  <span className="text-xs text-gray-500 font-medium pt-2">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Client Reviews breakdown (Right Column) */}
        <div className="glass p-6 rounded-3xl space-y-6 shadow-xl h-fit">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
            <Star size={20} className="text-indigo-400" />
            Feedback History
          </h2>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {reviews.length === 0 ? (
              <span className="text-xs text-gray-500 italic block text-center py-6">No client reviews submitted yet.</span>
            ) : (
              reviews.map((rev) => (
                <div key={rev._id} className="p-4 rounded-2xl bg-gray-950/40 border border-gray-900 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="block text-xs font-bold text-white truncate max-w-[120px]">{rev.reviewer?.name}</span>
                      <span className="text-[9px] text-gray-500">Client / Recruiter</span>
                    </div>
                    
                    <div className="flex text-amber-400 gap-0.5">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} size={11} fill="currentColor" />
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 italic leading-relaxed">
                    "{rev.comment}"
                  </p>

                  <span className="block text-[9px] text-gray-500 text-right">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FreelancerAnalytics;
