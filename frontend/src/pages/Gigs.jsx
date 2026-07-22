import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  DollarSign,
  Briefcase,
  Loader2,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const Gigs = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Search filter states
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [trendingSkills, setTrendingSkills] = useState([]);

  // Gigs list state
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Trigger search on mount and filter changes
  useEffect(() => {
    fetchGigs();
    fetchTrendingSkills();
  }, []);

  const fetchTrendingSkills = async () => {
    try {
      const res = await API.get('/match/trending-skills');
      if (res.data.success) {
        setTrendingSkills(res.data.skills);
      }
    } catch (err) {
      console.error('Failed to load trending skills:', err);
    }
  };

  const handleTrendingClick = (skillName) => {
    setSearch(skillName);
    const queryParams = new URLSearchParams();
    queryParams.append('search', skillName);
    if (location) queryParams.append('location', location);
    if (category) queryParams.append('category', category);
    if (minBudget) queryParams.append('minBudget', minBudget);
    if (maxBudget) queryParams.append('maxBudget', maxBudget);

    setLoading(true);
    API.get(`/gigs?${queryParams.toString()}`)
      .then((res) => {
        if (res.data.success) {
          setGigs(res.data.gigs);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to filter by trending skill.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchGigs = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (location) queryParams.append('location', location);
      if (category) queryParams.append('category', category);
      if (minBudget) queryParams.append('minBudget', minBudget);
      if (maxBudget) queryParams.append('maxBudget', maxBudget);

      const response = await API.get(`/gigs?${queryParams.toString()}`);
      if (response.data.success) {
        setGigs(response.data.gigs);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load marketplace gigs. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setLocation('');
    setCategory('');
    setMinBudget('');
    setMaxBudget('');
    // Re-fetch clean list
    setTimeout(() => {
      fetchGigs();
      fetchTrendingSkills();
    }, 50);
  };

  const categories = [
    'Web Development',
    'Mobile Apps',
    'Design & Creative',
    'Writing & Translation',
    'Marketing & Sales',
    'AI & Data Science',
    'Customer Support',
    'Hardware & IoT'
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Title block */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Gig Marketplace</h1>
          <p className="text-gray-400 text-sm mt-1">Discover verified projects and submit proposals in your neighborhood.</p>
        </div>
        {user?.role === 'client' && (
          <button
            type="button"
            onClick={() => navigate('/create-gig')}
            className="bg-brand-accent hover:bg-orange-600 text-white font-bold text-xs py-3 px-5 rounded-xl transition-all cursor-pointer shadow-lg shadow-orange-500/20 flex items-center gap-2 hover:-translate-y-0.5 shrink-0"
          >
            Post a Gig
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column Sidebar */}
        <div className="space-y-6">
          {/* Filter Panel */}
          <aside className="glass p-6 rounded-3xl h-fit space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-20 h-20 bg-indigo-600/20 rounded-full blur-2xl"></div>
            
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3 relative z-10">
              <SlidersHorizontal size={18} className="text-indigo-400" />
              Filter Search
            </h2>

            <form onSubmit={fetchGigs} className="space-y-4 relative z-10">
              {/* Search string */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Search Keywords</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="e.g. React Developer"
                    className="w-full bg-gray-950/40 border border-gray-800 focus:border-indigo-500 rounded-xl py-2 pl-10 pr-3 text-white text-xs outline-none"
                  />
                </div>
              </div>

              {/* Hyperlocal Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Neighborhood Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Adyar"
                    className="w-full bg-gray-950/40 border border-gray-800 focus:border-indigo-500 rounded-xl py-2 pl-10 pr-3 text-white text-xs outline-none"
                  />
                </div>
              </div>

              {/* Category selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-950/40 border border-gray-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-white text-xs outline-none"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Budget span */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Budget Range ($ USD)</label>
                <div className="flex gap-2">
                  <div className="relative w-1/2">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
                    <input
                      type="number"
                      placeholder="Min"
                      value={minBudget}
                      onChange={(e) => setMinBudget(e.target.value)}
                      className="w-full bg-gray-950/40 border border-gray-800 focus:border-indigo-500 rounded-xl py-2 pl-7 pr-2 text-white text-xs outline-none"
                    />
                  </div>
                  <div className="relative w-1/2">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={12} />
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxBudget}
                      onChange={(e) => setMaxBudget(e.target.value)}
                      className="w-full bg-gray-950/40 border border-gray-800 focus:border-indigo-500 rounded-xl py-2 pl-7 pr-2 text-white text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="w-1/2 bg-gray-950 border border-gray-800 hover:bg-gray-900 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>

            </form>
          </aside>

          {/* Trending Skills Panel */}
          {trendingSkills.length > 0 && (
            <div className="glass p-6 rounded-3xl space-y-4 shadow-xl relative overflow-hidden border border-indigo-500/10">
              <div className="absolute -top-12 -right-12 w-20 h-20 bg-indigo-600/20 rounded-full blur-2xl"></div>
              
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-gray-800 pb-3 relative z-10">
                <Sparkles size={16} className="text-indigo-400" />
                AI Trending Skills
              </h3>
              
              <div className="flex flex-wrap gap-2 relative z-10">
                {trendingSkills.map((ts, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleTrendingClick(ts.name)}
                    className="text-[10px] font-semibold bg-indigo-950/40 border border-indigo-900/30 hover:border-indigo-500/50 text-indigo-300 py-1.5 px-3 rounded-xl transition-all cursor-pointer block"
                  >
                    #{ts.name} <span className="text-[9px] text-gray-500 font-medium">({ts.count})</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gigs List View (Right Columns) */}
        <div className="lg:col-span-3 space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-800 text-red-300 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-[50vh]">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
          ) : gigs.length === 0 ? (
            <div className="glass p-12 text-center rounded-3xl space-y-3">
              <Briefcase className="w-12 h-12 text-gray-600 mx-auto" />
              <h3 className="text-xl font-bold text-white">No Gigs Found</h3>
              <p className="text-gray-400 text-sm max-w-sm mx-auto">
                No matching projects are currently open. Adjust your filters or check back later!
              </p>
            </div>
          ) : (
            /* Cards listing */
            <div className="space-y-4">
              {gigs.map((gig) => (
                <div
                  key={gig._id}
                  onClick={() => navigate(`/gigs/${gig._id}`)}
                  className="glass p-6 rounded-2xl glass-hover cursor-pointer border border-transparent hover:border-indigo-500/20 relative group transition-all flex flex-col md:flex-row justify-between md:items-center gap-6"
                >
                  <div className="space-y-3 max-w-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider bg-indigo-950/40 border border-indigo-900/30 px-2.5 py-0.5 rounded-full">
                        {gig.category}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Calendar size={12} />
                        {new Date(gig.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {gig.title}
                    </h3>
                    
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {gig.description}
                    </p>

                    {/* Skills required */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {gig.skillsRequired.map((skill, idx) => (
                        <span key={idx} className="text-[9px] bg-gray-900 border border-gray-800 text-gray-300 px-2 py-0.5 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price and location blocks */}
                  <div className="flex md:flex-col justify-between items-center md:items-end gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-800">
                    <div className="text-left md:text-right">
                      <span className="block text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Budget Range</span>
                      <span className="block text-lg font-extrabold text-emerald-400">
                        ${gig.budgetMin} - ${gig.budgetMax}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                      <MapPin size={14} className="text-indigo-400" />
                      <span>{gig.location}</span>
                    </div>

                    <div className="hidden md:flex items-center gap-1.5 text-indigo-400 text-xs font-semibold group-hover:translate-x-1 transition-transform pt-2">
                      View details
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Gigs;
