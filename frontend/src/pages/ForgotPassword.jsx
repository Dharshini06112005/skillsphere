import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { Mail, ShieldAlert, CheckCircle, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await API.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setSuccess('If that email exists, a password reset link has been dispatched to it.');
        setEmail('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
      <div className="glass p-8 md:p-10 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden transition-all duration-500">
        
        {/* Decorative Blur Orbs */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-600 rounded-full blur-2xl opacity-40"></div>
        <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-purple-600 rounded-full blur-2xl opacity-40"></div>

        <div className="relative z-10 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Forgot Password</h1>
            <p className="text-gray-400 text-xs">
              Enter your email address and we'll send you an authorization link to reset your password.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-sm flex items-center gap-3">
              <ShieldAlert size={18} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-3">
              <CheckCircle size={18} className="shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Sending Link...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
