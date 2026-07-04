import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import {
  FileText,
  MapPin,
  DollarSign,
  Plus,
  Trash2,
  AlertCircle,
  Briefcase,
  CheckCircle,
  PlusCircle,
  ListTodo
} from 'lucide-react';

const CreateGig = () => {
  const navigate = useNavigate();
  
  // General form inputs
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [skillsRequired, setSkillsRequired] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [location, setLocation] = useState('');
  
  // Milestones inputs
  const [milestones, setMilestones] = useState([]);
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mAmount, setMAmount] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Add milestone to temporary list
  const handleAddMilestone = (e) => {
    e.preventDefault();
    if (!mTitle.trim() || !mAmount) {
      setError('Milestone title and price amount are required.');
      return;
    }
    setError('');

    const newMilestone = {
      title: mTitle.trim(),
      description: mDesc.trim(),
      amount: Number(mAmount),
      status: 'pending',
    };

    setMilestones([...milestones, newMilestone]);
    setMTitle('');
    setMDesc('');
    setMAmount('');
  };

  // Remove milestone from list
  const handleRemoveMilestone = (idxToRemove) => {
    setMilestones(milestones.filter((_, idx) => idx !== idxToRemove));
  };

  // Submit gig
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation
    if (milestones.length === 0) {
      setError('Please define at least one payment milestone for the project.');
      return;
    }

    const totalMilestoneBudget = milestones.reduce((sum, m) => sum + m.amount, 0);
    if (totalMilestoneBudget > Number(budgetMax)) {
      setError(`Milestone budget sum ($${totalMilestoneBudget}) cannot exceed the max project budget ($${budgetMax}).`);
      return;
    }

    setIsLoading(true);

    try {
      const skillsArray = skillsRequired
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const response = await API.post('/gigs', {
        title,
        description,
        category,
        skillsRequired: skillsArray,
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        location,
        milestones,
      });

      if (response.data.success) {
        setSuccess('Gig posted successfully in the marketplace!');
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error posting gig.');
    } finally {
      setIsLoading(false);
    }
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
      <div>
        <h1 className="text-3xl font-extrabold text-white">Post a New Gig</h1>
        <p className="text-gray-400 text-sm mt-1">Provide project requirements, hyperlocal locations, and define payment milestones.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800 text-red-300 text-sm flex items-center gap-3 animate-pulse">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Details */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 glass p-6 md:p-8 rounded-3xl space-y-6 shadow-xl">
          
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
            <Briefcase size={20} className="text-indigo-400" />
            Project Details
          </h2>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">Project Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Develop a React Navigation dashboard UI"
              className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 px-4 text-white outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 px-4 text-white outline-none transition-all"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Hyperlocal Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Adyar, Chennai"
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-12 pr-4 text-white outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">Detailed Description</label>
            <textarea
              required
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline project deliverables, requirements, and deadlines..."
              className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 px-4 text-white outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">Skills Required (Comma separated)</label>
            <input
              type="text"
              required
              value={skillsRequired}
              onChange={(e) => setSkillsRequired(e.target.value)}
              placeholder="e.g. React, TailwindCSS, Axios, Redux"
              className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 px-4 text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Min Budget ($ USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="number"
                  min="0"
                  required
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-12 pr-4 text-white outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Max Budget ($ USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="number"
                  min="0"
                  required
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-12 pr-4 text-white outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            {isLoading ? 'Publishing Gig...' : 'Publish Gig to Marketplace'}
          </button>

        </form>

        {/* Milestone Builder */}
        <div className="glass p-6 rounded-3xl space-y-6 shadow-xl h-fit">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
            <ListTodo size={20} className="text-indigo-400" />
            Milestones Setup
          </h2>

          <p className="text-xs text-gray-400">
            Define step-by-step milestones to secure project progression. Payouts will trigger on approval of each milestone.
          </p>

          {/* Form */}
          <div className="p-4 rounded-2xl bg-gray-950/30 border border-gray-900 space-y-4">
            <input
              type="text"
              placeholder="Milestone Title (e.g. Wireframes)"
              value={mTitle}
              onChange={(e) => setMTitle(e.target.value)}
              className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-white text-xs outline-none"
            />
            <input
              type="text"
              placeholder="Brief details..."
              value={mDesc}
              onChange={(e) => setMDesc(e.target.value)}
              className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-white text-xs outline-none"
            />
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
              <input
                type="number"
                placeholder="Milestone Price"
                value={mAmount}
                onChange={(e) => setMAmount(e.target.value)}
                className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 pl-8 pr-3 text-white text-xs outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddMilestone}
              className="w-full bg-gray-900 border border-gray-800 hover:border-indigo-500/30 text-white font-semibold py-2 px-4 rounded-xl text-xs hover:bg-gray-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <PlusCircle size={14} /> Add Milestone
            </button>
          </div>

          {/* Display milestones */}
          <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
            {milestones.length === 0 ? (
              <span className="text-xs text-gray-500 italic">No milestones defined yet. (Minimum 1 required)</span>
            ) : (
              milestones.map((m, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-gray-950/40 border border-gray-900">
                  <div className="overflow-hidden">
                    <span className="block text-xs font-semibold text-white truncate">{m.title}</span>
                    <span className="block text-[10px] text-emerald-400 font-bold mt-0.5">${m.amount}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMilestone(idx)}
                    className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CreateGig;
