import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import {
  User,
  Shield,
  Briefcase,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  PlusCircle,
  FileText
} from 'lucide-react';

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  
  // Freelancer specific forms
  const [hourlyRate, setHourlyRate] = useState(0);
  const [availability, setAvailability] = useState('available');
  const [skills, setSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('intermediate');
  
  const [experience, setExperience] = useState([]);
  const [newExpTitle, setNewExpTitle] = useState('');
  const [newExpCompany, setNewExpCompany] = useState('');
  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpStart, setNewExpStart] = useState('');
  const [newExpEnd, setNewExpEnd] = useState('');
  const [newExpCurrent, setNewExpCurrent] = useState(false);

  // Resume states
  const [resumeUrl, setResumeUrl] = useState('');

  // Portfolio states
  const [portfolio, setPortfolio] = useState([]);
  const [newPortTitle, setNewPortTitle] = useState('');
  const [newPortDesc, setNewPortDesc] = useState('');
  const [newPortLink, setNewPortLink] = useState('');
  const [newPortImg, setNewPortImg] = useState('');

  // Certifications states
  const [certifications, setCertifications] = useState([]);
  const [newCertName, setNewCertName] = useState('');
  const [newCertOrg, setNewCertOrg] = useState('');
  const [newCertDate, setNewCertDate] = useState('');
  const [newCertLink, setNewCertLink] = useState('');

  // Scheduler states
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [newSlotDay, setNewSlotDay] = useState('Monday');
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('10:00');

  // Client specific forms
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  // UI Notification States
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSaving, setIsSaving] = useState(false);

  // 2FA Setup states
  const [is2FASetupLoading, setIs2FASetupLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [show2FAForm, setShow2FAForm] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await API.get('/profile/me');
      if (response.data.success) {
        const p = response.data.profile;
        setProfile(p);
        
        // Seed standard inputs
        setName(p.user?.name || '');
        setBio(p.bio || '');

        if (user?.role === 'freelancer') {
          setHourlyRate(p.hourlyRate || 0);
          setAvailability(p.availability || 'available');
          setSkills(p.skills || []);
          setExperience(p.experience || []);
          setResumeUrl(p.resumeUrl || '');
          setPortfolio(p.portfolio || []);
          setCertifications(p.certifications || []);
          setAvailabilitySlots(p.availabilitySlots || []);
          setBookings(p.bookings || []);
        } else if (user?.role === 'client') {
          setCompanyName(p.companyName || '');
          setIndustry(p.industry || '');
          setWebsite(p.website || '');
          setBillingAddress(p.billingAddress || '');
        }
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load profile details.' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    const updatePayload = {
      name,
      bio,
    };

    if (user?.role === 'freelancer') {
      updatePayload.hourlyRate = Number(hourlyRate);
      updatePayload.availability = availability;
      updatePayload.skills = skills;
      updatePayload.experience = experience;
      updatePayload.resumeUrl = resumeUrl;
      updatePayload.portfolio = portfolio;
      updatePayload.certifications = certifications;
      updatePayload.availabilitySlots = availabilitySlots;
      updatePayload.bookings = bookings;
    } else if (user?.role === 'client') {
      updatePayload.companyName = companyName;
      updatePayload.industry = industry;
      updatePayload.website = website;
      updatePayload.billingAddress = billingAddress;
    }

    try {
      const response = await API.put('/profile/me', updatePayload);
      if (response.data.success) {
        setProfile(response.data.profile);
        setUser(response.data.profile.user);
        // Sync header local storage user name
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        localUser.name = name;
        localStorage.setItem('user', JSON.stringify(localUser));

        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error updating profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Add a skill to temp list
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    if (skills.some(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) {
      setMessage({ type: 'error', text: 'Skill already added!' });
      return;
    }

    setSkills([...skills, { name: newSkillName.trim(), level: newSkillLevel }]);
    setNewSkillName('');
  };

  // Remove a skill from list
  const handleRemoveSkill = (idxToRemove) => {
    setSkills(skills.filter((_, idx) => idx !== idxToRemove));
  };

  // Add experience entry
  const handleAddExperience = (e) => {
    e.preventDefault();
    if (!newExpTitle.trim() || !newExpCompany.trim()) return;

    const newExp = {
      title: newExpTitle.trim(),
      company: newExpCompany.trim(),
      description: newExpDesc.trim(),
      startDate: newExpStart ? new Date(newExpStart) : null,
      endDate: newExpCurrent ? null : (newExpEnd ? new Date(newExpEnd) : null),
      current: newExpCurrent
    };

    setExperience([...experience, newExp]);
    setNewExpTitle('');
    setNewExpCompany('');
    setNewExpDesc('');
    setNewExpStart('');
    setNewExpEnd('');
    setNewExpCurrent(false);
  };

  // Remove experience entry
  const handleRemoveExperience = (idxToRemove) => {
    setExperience(experience.filter((_, idx) => idx !== idxToRemove));
  };

  // Add portfolio entry
  const handleAddPortfolio = (e) => {
    e.preventDefault();
    if (!newPortTitle.trim()) return;

    const newPort = {
      title: newPortTitle.trim(),
      description: newPortDesc.trim(),
      link: newPortLink.trim(),
      imageUrl: newPortImg.trim() || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=300&q=80'
    };

    setPortfolio([...portfolio, newPort]);
    setNewPortTitle('');
    setNewPortDesc('');
    setNewPortLink('');
    setNewPortImg('');
  };

  // Remove portfolio entry
  const handleRemovePortfolio = (idxToRemove) => {
    setPortfolio(portfolio.filter((_, idx) => idx !== idxToRemove));
  };

  // Add certification entry
  const handleAddCertification = (e) => {
    e.preventDefault();
    if (!newCertName.trim()) return;

    const newCert = {
      name: newCertName.trim(),
      issuingOrganization: newCertOrg.trim(),
      issueDate: newCertDate ? new Date(newCertDate) : null,
      credentialUrl: newCertLink.trim()
    };

    setCertifications([...certifications, newCert]);
    setNewCertName('');
    setNewCertOrg('');
    setNewCertDate('');
    setNewCertLink('');
  };

  // Remove certification entry
  const handleRemoveCertification = (idxToRemove) => {
    setCertifications(certifications.filter((_, idx) => idx !== idxToRemove));
  };

  // Add availability slot
  const handleAddSlot = (e) => {
    e.preventDefault();
    if (!newSlotDay || !newSlotStart || !newSlotEnd) return;

    const newSlot = {
      day: newSlotDay,
      startHour: newSlotStart,
      endHour: newSlotEnd
    };

    if (availabilitySlots.some(s => s.day === newSlotDay && s.startHour === newSlotStart && s.endHour === newSlotEnd)) {
      setMessage({ type: 'error', text: 'Availability slot already added!' });
      return;
    }

    setAvailabilitySlots([...availabilitySlots, newSlot]);
  };

  // Remove availability slot
  const handleRemoveSlot = (idxToRemove) => {
    setAvailabilitySlots(availabilitySlots.filter((_, idx) => idx !== idxToRemove));
  };

  // 2FA Actions
  const handleSetup2FA = async () => {
    setIs2FASetupLoading(true);
    try {
      const res = await API.post('/auth/2fa/setup');
      setQrCodeUrl(res.data.qrCodeUrl);
      setSecretCode(res.data.secret);
      setShow2FAForm(true);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Could not generate two-factor authenticator secret.' });
    } finally {
      setIs2FASetupLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/2fa/verify', { token: otpToken });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Two-factor authentication enabled successfully!' });
        setShow2FAForm(false);
        setQrCodeUrl('');
        setSecretCode('');
        setOtpToken('');
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Verification of OTP failed.' });
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable two-factor authentication? This reduces your account security.')) return;

    try {
      const res = await API.post('/auth/2fa/disable');
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Two-factor authentication has been disabled.' });
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to disable two-factor authentication.' });
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
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Account Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your public profile information and authentication settings.</p>
      </div>

      {/* Notifications */}
      {message.text && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
            : 'bg-red-950/30 border-red-800 text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Profile Edit Column */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleProfileSave} className="glass p-6 md:p-8 rounded-3xl space-y-6 shadow-xl">
            
            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <User size={20} className="text-indigo-400" />
              General Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 px-4 text-white outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Email Address (Read-only)</label>
                <input
                  type="email"
                  disabled
                  value={profile?.user?.email}
                  className="w-full bg-gray-950/50 border border-gray-900 text-gray-500 rounded-xl py-3 px-4 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Short Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Write a brief professional description..."
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 px-4 text-white outline-none transition-all resize-none"
              />
            </div>

            {/* Freelancer Specific Form Elements */}
            {user?.role === 'freelancer' && (
              <div className="space-y-6 pt-4 border-t border-gray-800/60">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Briefcase size={18} className="text-indigo-400" />
                  Freelancer Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Hourly Rate ($ USD)</label>
                    <input
                      type="number"
                      min="0"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 px-4 text-white outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Availability Status</label>
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 px-4 text-white outline-none transition-all"
                    >
                      <option value="available">Available (Full-time)</option>
                      <option value="part-time">Part-time Available</option>
                      <option value="busy">Busy / Unvailable</option>
                    </select>
                  </div>
                </div>

                {/* Skills Manager */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-gray-300 block">Skills & Proficiency</label>
                  
                  {/* Add skill row */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="e.g. React.js, Python, Figma"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      className="flex-grow bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 px-4 text-white outline-none"
                    />
                    <select
                      value={newSkillLevel}
                      onChange={(e) => setNewSkillLevel(e.target.value)}
                      className="bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 px-4 text-white outline-none"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 font-semibold px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                    >
                      <Plus size={16} /> Add Skill
                    </button>
                  </div>

                  {/* Skills badges */}
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {skills.length === 0 ? (
                      <span className="text-xs text-gray-500 italic">No skills listed yet.</span>
                    ) : (
                      skills.map((skill, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 bg-gray-950/50 border border-gray-800 rounded-xl py-1.5 px-3"
                        >
                          <span className="text-xs font-semibold text-white">{skill.name}</span>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            skill.level === 'expert' 
                              ? 'bg-pink-950/40 text-pink-400 border border-pink-900/30'
                              : skill.level === 'intermediate'
                              ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/30'
                              : 'bg-gray-800 text-gray-400'
                          }`}>
                            {skill.level}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(idx)}
                            className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Experience Timeline */}
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-gray-300 block">Work Experience Timeline</label>
                  
                  {/* Experience Addition Form */}
                  <div className="p-4 rounded-2xl bg-gray-950/30 border border-gray-900 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Job Title (e.g. Frontend Engineer)"
                        value={newExpTitle}
                        onChange={(e) => setNewExpTitle(e.target.value)}
                        className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-white text-sm outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Company / Client (e.g. Google, Upwork)"
                        value={newExpCompany}
                        onChange={(e) => setNewExpCompany(e.target.value)}
                        className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-white text-sm outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">Start Date</span>
                        <input
                          type="date"
                          value={newExpStart}
                          onChange={(e) => setNewExpStart(e.target.value)}
                          className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-white text-xs outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">End Date</span>
                        <input
                          type="date"
                          disabled={newExpCurrent}
                          value={newExpEnd}
                          onChange={(e) => setNewExpEnd(e.target.value)}
                          className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-white text-xs outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="currCheck"
                        checked={newExpCurrent}
                        onChange={(e) => setNewExpCurrent(e.target.checked)}
                        className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                      />
                      <label htmlFor="currCheck" className="text-xs text-gray-400 cursor-pointer">Currently working here</label>
                    </div>

                    <textarea
                      placeholder="Brief job description..."
                      value={newExpDesc}
                      onChange={(e) => setNewExpDesc(e.target.value)}
                      rows={2}
                      className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-white text-sm outline-none resize-none"
                    />

                    <button
                      type="button"
                      onClick={handleAddExperience}
                      className="w-full bg-gray-900 border border-gray-800 hover:border-indigo-500/30 text-white font-semibold py-2 px-4 rounded-xl text-xs hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle size={14} /> Add Experience Record
                    </button>
                  </div>

                  {/* Experience List Render */}
                  <div className="space-y-3.5 pt-2">
                    {experience.length === 0 ? (
                      <span className="text-xs text-gray-500 italic">No experience history logged.</span>
                    ) : (
                      experience.map((exp, idx) => (
                        <div key={idx} className="flex justify-between items-start p-4 rounded-2xl bg-gray-950/40 border border-gray-900 relative">
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-white">{exp.title}</h4>
                            <p className="text-xs text-indigo-400 font-semibold">{exp.company}</p>
                            <p className="text-[10px] text-gray-500">
                              {exp.startDate ? new Date(exp.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'N/A'} -{' '}
                              {exp.current ? 'Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'N/A')}
                            </p>
                            {exp.description && <p className="text-xs text-gray-400 mt-2 max-w-xl leading-relaxed">{exp.description}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveExperience(idx)}
                            className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer shrink-0 absolute right-4 top-4"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                </div>

                {/* Resume URL Field */}
                <div className="space-y-2 border-t border-gray-800/60 pt-4">
                  <label className="text-sm font-semibold text-gray-300">Resume Link</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                      type="url"
                      placeholder="e.g. https://drive.google.com/your-resume-link"
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-12 pr-4 text-white outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Portfolio Gallery Manager */}
                <div className="space-y-4 border-t border-gray-800/60 pt-4">
                  <label className="text-sm font-semibold text-gray-300 block">Portfolio Gallery</label>
                  
                  {/* Portfolio Addition Form */}
                  <div className="p-4 rounded-2xl bg-gray-950/30 border border-gray-900 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Project Title (e.g. E-Commerce Website)"
                        value={newPortTitle}
                        onChange={(e) => setNewPortTitle(e.target.value)}
                        className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-white text-sm outline-none"
                      />
                      <input
                        type="url"
                        placeholder="Project URL Link (optional)"
                        value={newPortLink}
                        onChange={(e) => setNewPortLink(e.target.value)}
                        className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-white text-sm outline-none"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="url"
                        placeholder="Project Image URL (optional)"
                        value={newPortImg}
                        onChange={(e) => setNewPortImg(e.target.value)}
                        className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-white text-sm outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Short Description"
                        value={newPortDesc}
                        onChange={(e) => setNewPortDesc(e.target.value)}
                        className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-white text-sm outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddPortfolio}
                      className="w-full bg-gray-900 border border-gray-800 hover:border-indigo-500/30 text-white font-semibold py-2 px-4 rounded-xl text-xs hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle size={14} /> Add Portfolio Project
                    </button>
                  </div>

                  {/* Portfolio Gallery List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {portfolio.length === 0 ? (
                      <span className="text-xs text-gray-500 italic col-span-2">No portfolio items logged.</span>
                    ) : (
                      portfolio.map((port, idx) => (
                        <div key={idx} className="rounded-2xl overflow-hidden bg-gray-950/40 border border-gray-900 flex flex-col justify-between p-4 relative group">
                          <div className="space-y-2">
                            {port.imageUrl && (
                              <img src={port.imageUrl} alt={port.title} className="w-full h-28 object-cover rounded-xl border border-gray-900" />
                            )}
                            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                              {port.title}
                              {port.link && (
                                <a href={port.link} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </h4>
                            {port.description && <p className="text-xs text-gray-400 leading-relaxed">{port.description}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePortfolio(idx)}
                            className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer absolute right-4 top-4 bg-gray-950/60 p-1.5 rounded-lg shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Certifications Manager */}
                <div className="space-y-4 border-t border-gray-800/60 pt-4">
                  <label className="text-sm font-semibold text-gray-300 block">Certifications</label>
                  
                  {/* Certifications Addition Form */}
                  <div className="p-4 rounded-2xl bg-gray-950/30 border border-gray-900 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Certification Name (e.g. AWS Solution Architect)"
                        value={newCertName}
                        onChange={(e) => setNewCertName(e.target.value)}
                        className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-white text-sm outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Issuing Organization (e.g. Amazon Web Services)"
                        value={newCertOrg}
                        onChange={(e) => setNewCertOrg(e.target.value)}
                        className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-white text-sm outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">Issue Date</span>
                        <input
                          type="date"
                          value={newCertDate}
                          onChange={(e) => setNewCertDate(e.target.value)}
                          className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-white text-xs outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">Credential Verification URL</span>
                        <input
                          type="url"
                          placeholder="e.g. https://aws.credentials.com/verify-123"
                          value={newCertLink}
                          onChange={(e) => setNewCertLink(e.target.value)}
                          className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2 px-3 text-white text-sm outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCertification}
                      className="w-full bg-gray-900 border border-gray-800 hover:border-indigo-500/30 text-white font-semibold py-2 px-4 rounded-xl text-xs hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle size={14} /> Add Certification Record
                    </button>
                  </div>

                  {/* Certifications List */}
                  <div className="space-y-3.5 pt-2">
                    {certifications.length === 0 ? (
                      <span className="text-xs text-gray-500 italic">No certifications history logged.</span>
                    ) : (
                      certifications.map((cert, idx) => (
                        <div key={idx} className="flex justify-between items-start p-4 rounded-2xl bg-gray-950/40 border border-gray-900 relative">
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                              {cert.name}
                              {cert.credentialUrl && (
                                <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">
                                  <ExternalLink size={12} />
                                </a>
                              )}
                            </h4>
                            <p className="text-xs text-gray-400 font-semibold">{cert.issuingOrganization}</p>
                            {cert.issueDate && (
                              <p className="text-[10px] text-gray-500">
                                Issued: {new Date(cert.issueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCertification(idx)}
                            className="text-gray-500 hover:text-red-400 transition-colors cursor-pointer shrink-0 absolute right-4 top-4"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Availability Scheduler slots manager */}
                <div className="space-y-4 border-t border-gray-800/60 pt-4">
                  <label className="text-sm font-semibold text-gray-300 block">Availability Calendar Slots</label>
                  
                  {/* Slots Addition Form */}
                  <div className="p-4 rounded-2xl bg-gray-950/30 border border-gray-900 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">Day of Week</span>
                        <select
                          value={newSlotDay}
                          onChange={(e) => setNewSlotDay(e.target.value)}
                          className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-white text-xs outline-none"
                        >
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">Start Time</span>
                        <input
                          type="text"
                          placeholder="e.g. 09:00"
                          value={newSlotStart}
                          onChange={(e) => setNewSlotStart(e.target.value)}
                          className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-white text-xs outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">End Time</span>
                        <input
                          type="text"
                          placeholder="e.g. 12:00"
                          value={newSlotEnd}
                          onChange={(e) => setNewSlotEnd(e.target.value)}
                          className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 rounded-xl py-2 px-3 text-white text-xs outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddSlot}
                      className="w-full bg-gray-900 border border-gray-800 hover:border-indigo-500/30 text-white font-semibold py-2 px-4 rounded-xl text-xs hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle size={14} /> Add Calendar Slot
                    </button>
                  </div>

                  {/* Active Slots list */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {availabilitySlots.length === 0 ? (
                      <span className="text-xs text-gray-500 italic">No availability slots set. Set slots so clients can book consultations!</span>
                    ) : (
                      availabilitySlots.map((slot, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-900/40 text-indigo-300 px-3 py-1.5 rounded-xl text-xs">
                          <span>{slot.day}: {slot.startHour} - {slot.endHour}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(idx)}
                            className="text-gray-500 hover:text-red-400 cursor-pointer text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Booked Consultations */}
                <div className="space-y-4 border-t border-gray-800/60 pt-4">
                  <label className="text-sm font-semibold text-gray-300 block">Scheduled Consultation Bookings</label>
                  <div className="space-y-3">
                    {bookings.length === 0 ? (
                      <span className="text-xs text-gray-500 italic block">No consultation bookings scheduled.</span>
                    ) : (
                      bookings.map((booking, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 rounded-2xl bg-gray-950/40 border border-gray-900">
                          <div>
                            <h4 className="text-sm font-bold text-white">Consultation with {booking.clientName}</h4>
                            <p className="text-xs text-indigo-400 font-semibold">{booking.day} | {booking.timeSlot}</p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/20 text-emerald-400 border border-emerald-900/30">
                            {booking.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* Client Specific Form Elements */}
            {user?.role === 'client' && (
              <div className="space-y-6 pt-4 border-t border-gray-800/60">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Briefcase size={18} className="text-indigo-400" />
                  Client Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Acme Corporation"
                      className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 px-4 text-white outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Industry</label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g. IT Services, Design, Marketing"
                      className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 px-4 text-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Website URL</label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="e.g. https://www.company.com"
                      className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 px-4 text-white outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Billing Address</label>
                    <input
                      type="text"
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      placeholder="e.g. New York, NY"
                      className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 px-4 text-white outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save Buttons */}
            <div className="pt-4 border-t border-gray-800 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {isSaving ? 'Saving Changes...' : 'Save Settings'}
                <Save size={18} />
              </button>
            </div>

          </form>
        </div>

        {/* Security / 2FA Column */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-20 h-20 bg-indigo-600 rounded-full blur-2xl opacity-30"></div>
            
            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3 relative z-10">
              <Shield size={20} className="text-indigo-400" />
              Two-Factor Auth (2FA)
            </h2>

            <p className="text-sm text-gray-400 relative z-10">
              Increase your account protection by requiring a 6-digit Google Authenticator OTP token on login attempts.
            </p>

            {/* 2FA State Display */}
            {profile?.user?.isTwoFactorEnabled ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800 text-emerald-400 text-sm flex items-center gap-3 font-semibold">
                  <CheckCircle size={18} />
                  Two-Factor authentication is active.
                </div>
                <button
                  type="button"
                  onClick={handleDisable2FA}
                  className="w-full bg-red-950/30 border border-red-900/40 text-red-400 hover:bg-red-600 hover:text-white text-sm font-semibold py-3 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  Disable 2FA Security
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800 text-amber-400 text-sm flex items-center gap-3 font-semibold">
                  <AlertTriangle size={18} />
                  2FA is currently disabled.
                </div>

                {!show2FAForm ? (
                  <button
                    type="button"
                    onClick={handleSetup2FA}
                    disabled={is2FASetupLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {is2FASetupLoading ? 'Initializing 2FA...' : 'Setup Authenticator 2FA'}
                  </button>
                ) : (
                  /* Setup form QR Code display */
                  <form onSubmit={handleVerify2FA} className="space-y-5 pt-3 border-t border-gray-800 animate-fade-in">
                    <p className="text-xs text-gray-400">
                      1. Scan this QR code using Google Authenticator, Authy, or similar Authenticator applications:
                    </p>

                    {qrCodeUrl && (
                      <div className="bg-white p-3 rounded-2xl max-w-[170px] mx-auto border border-gray-200">
                        <img src={qrCodeUrl} alt="2FA QR Code" className="w-full h-auto" />
                      </div>
                    )}

                    <div className="text-center space-y-1">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest block">Manual Secret Key</span>
                      <code className="text-indigo-300 text-xs font-mono bg-gray-950 px-2.5 py-1 rounded border border-gray-900 select-all block break-all">
                        {secretCode}
                      </code>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-300">
                        2. Enter the generated 6-digit confirmation code:
                      </label>
                      <input
                        type="text"
                        required
                        maxLength="6"
                        pattern="\d{6}"
                        value={otpToken}
                        onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 text-center text-xl font-mono tracking-widest text-white placeholder-gray-600 outline-none transition-all"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShow2FAForm(false)}
                        className="w-1/2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold py-2.5 px-3 rounded-xl border border-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="w-1/2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors"
                      >
                        Verify & Enable
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
