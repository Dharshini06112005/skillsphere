import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import {
  FileText,
  DollarSign,
  Clock,
  Briefcase,
  Loader2,
  MapPin,
  ArrowRight,
  Layers
} from 'lucide-react';

const Projects = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const fetchMyProjects = async () => {
    try {
      const response = await API.get('/gigs/my-projects');
      if (response.data.success) {
        setGigs(response.data.gigs);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load your projects ledger.');
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

  const isClient = user?.role === 'client';

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-white">My Projects</h1>
        <p className="text-gray-400 text-sm mt-1">
          {isClient
            ? 'Track and manage the workflow of projects you have published in the marketplace.'
            : 'Track the status and active milestones of projects you are hired on.'}
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      {gigs.length === 0 ? (
        <div className="glass p-12 text-center rounded-3xl space-y-3 max-w-lg mx-auto">
          <Layers className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-xl font-bold text-white">No Projects Found</h3>
          <p className="text-gray-400 text-sm">
            {isClient
              ? "You haven't posted any gigs yet. Click 'Post a Gig' to find local professionals!"
              : "You haven't been hired on any projects yet. Submit proposals to open gigs!"}
          </p>
          <div className="pt-4">
            <button
              onClick={() => navigate(isClient ? '/create-gig' : '/gigs')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              {isClient ? 'Post a Gig' : 'Explore Gigs'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gigs.map((gig) => (
            <div
              key={gig._id}
              onClick={() => navigate(`/gigs/${gig._id}`)}
              className="glass p-6 rounded-2xl glass-hover cursor-pointer border border-transparent hover:border-indigo-500/20 relative group transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-all truncate">
                    {gig.title}
                  </h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    gig.status === 'open'
                      ? 'text-indigo-400 bg-indigo-950/20 border-indigo-900/30'
                      : gig.status === 'in_progress'
                      ? 'text-amber-400 bg-amber-950/20 border-amber-900/30'
                      : 'text-emerald-400 bg-emerald-950/20 border-emerald-900/30'
                  }`}>
                    {gig.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                  {gig.description}
                </p>
              </div>

              <div className="border-t border-gray-900 pt-4 flex justify-between items-center text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-500" />
                  <span>{gig.location}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-extrabold text-emerald-400">${gig.budgetMin} - ${gig.budgetMax}</span>
                  <div className="flex items-center text-indigo-400 font-bold gap-0.5 group-hover:translate-x-1 transition-transform">
                    <span>Manage</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
