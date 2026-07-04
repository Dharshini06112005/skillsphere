import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Lock, Briefcase, UserCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';

const Register = () => {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  // Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('freelancer'); // default: freelancer

  // UI states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const msg = await register(name, email, password, role);
      setSuccess(msg || 'Registration successful! Please check your email to verify your account.');
      // Clear inputs
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
      <div className="glass p-8 md:p-10 rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden transition-all duration-500 my-8">
        
        {/* Orbs */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-purple-600 rounded-full blur-2xl opacity-40"></div>
        <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-indigo-600 rounded-full blur-2xl opacity-40"></div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
              Skill<span className="text-indigo-400">Sphere</span>
            </h1>
            <p className="text-gray-400 text-sm">Join the intelligent hyperlocal freelance ecosystem</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-sm flex items-center gap-3 animate-pulse">
              <ShieldAlert size={18} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-sm flex items-start gap-3">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Account Created!</p>
                <p className="text-gray-300 mt-1">{success}</p>
                <p className="text-xs text-indigo-300 mt-2">Check the developer console log or mock mail url to simulate email verification.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Cards Selector */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Choose Account Type</label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setRole('freelancer')}
                  className={`cursor-pointer p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                    role === 'freelancer'
                      ? 'border-indigo-500 bg-indigo-600/20 text-white ring-1 ring-indigo-500 shadow-md shadow-indigo-500/10'
                      : 'border-gray-800 bg-gray-900/30 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <Briefcase size={22} className={role === 'freelancer' ? 'text-indigo-400' : 'text-gray-500'} />
                  <span className="font-semibold text-sm">Freelancer</span>
                  <span className="text-[10px] text-gray-500 leading-tight hidden md:inline">I want to complete jobs</span>
                </div>

                <div
                  onClick={() => setRole('client')}
                  className={`cursor-pointer p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                    role === 'client'
                      ? 'border-indigo-500 bg-indigo-600/20 text-white ring-1 ring-indigo-500 shadow-md shadow-indigo-500/10'
                      : 'border-gray-800 bg-gray-900/30 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <UserCheck size={22} className={role === 'client' ? 'text-indigo-400' : 'text-gray-500'} />
                  <span className="font-semibold text-sm">Client / Recruiter</span>
                  <span className="text-[10px] text-gray-500 leading-tight hidden md:inline">I want to hire talent</span>
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-800"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase tracking-wider">Or register with</span>
              <div className="flex-grow border-t border-gray-800"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleRegister}
              className="w-full bg-gray-900/80 hover:bg-gray-800/80 border border-gray-800 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Google
            </button>
          </form>

          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
