import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import {
  FileText,
  DollarSign,
  Clock,
  Briefcase,
  Loader2,
  MapPin,
  ArrowRight
} from 'lucide-react';

const Proposals = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyProposals();
  }, []);

  const fetchMyProposals = async () => {
    try {
      const response = await API.get('/proposals/my-proposals');
      if (response.data.success) {
        setProposals(response.data.proposals);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load your bids history.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-white">My Proposals</h1>
        <p className="text-gray-400 text-sm mt-1">Track the status of your bids on marketplace projects.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      {proposals.length === 0 ? (
        <div className="glass p-12 text-center rounded-3xl space-y-3 max-w-lg mx-auto">
          <FileText className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-xl font-bold text-white">No Bids Submitted</h3>
          <p className="text-gray-400 text-sm">
            You haven't bid on any gigs yet. Visit the Gig Marketplace to find work!
          </p>
          <div className="pt-4">
            <button
              onClick={() => navigate('/gigs')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              Explore Gigs
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {proposals.map((prop) => (
            <div
              key={prop._id}
              onClick={() => navigate(`/gigs/${prop.gig?._id}`)}
              className="glass p-6 rounded-2xl glass-hover cursor-pointer border border-transparent hover:border-indigo-500/20 relative group transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-all truncate">
                    {prop.gig?.title}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    prop.status === 'accepted'
                      ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30'
                      : prop.status === 'rejected'
                      ? 'bg-red-950/30 text-red-400 border border-red-900/30'
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    {prop.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                  <MapPin size={12} className="text-indigo-400" />
                  <span>{prop.gig?.location}</span>
                </div>

                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {prop.description}
                </p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-900 mt-2">
                <div className="flex gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><DollarSign size={13} className="text-emerald-400" /> Bid: <strong className="text-emerald-400 font-bold">${prop.bidAmount}</strong></span>
                  <span className="flex items-center gap-1"><Clock size={13} className="text-indigo-400" /> Time: <strong>{prop.completionTime} days</strong></span>
                </div>
                <div className="text-indigo-400 text-xs font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View Gig <ArrowRight size={12} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Proposals;
