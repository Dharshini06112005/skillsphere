import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, ShieldAlert, LogIn } from 'lucide-react';

const Login = () => {
  const { login, validate2FA } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  
  // UI states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [tempUserId, setTempUserId] = useState('');

  // Check URL parameters for errors/success
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'session_expired') {
      setError('Your session has expired. Please log in again.');
    } else if (params.get('error') === 'oauth_failed') {
      setError('Google Authentication failed. Please try again.');
    } else if (params.get('error') === 'account_suspended') {
      setError('Your account has been suspended. Please contact admin.');
    }
  }, [location]);

  // Main login submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.twoFactorRequired) {
        setTwoFactorRequired(true);
        setTempUserId(res.userId);
      } else {
        setSuccess('Logged in successfully! Redirecting...');
        setTimeout(() => navigate('/dashboard'), 1000);
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2FA OTP submission
  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await validate2FA(tempUserId, otpToken);
      setSuccess('Authenticated successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger Google Login
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
      <div className="glass p-8 md:p-10 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden transition-all duration-500">
        
        {/* Decorative Blur Orbs */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-600 rounded-full blur-2xl opacity-40"></div>
        <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-purple-600 rounded-full blur-2xl opacity-40"></div>

        <div className="relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
              Skill<span className="text-indigo-400">Sphere</span>
            </h1>
            <p className="text-gray-400 text-sm">
              {twoFactorRequired ? 'Two-Factor Verification' : 'Intelligent Hyperlocal Freelance Ecosystem'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-sm flex items-center gap-3">
              <ShieldAlert size={18} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
              <span>{success}</span>
            </div>
          )}

          {!twoFactorRequired ? (
            /* Regular Credentials Form */
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

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-300">Password</label>
                  <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    Forgot password?
                  </Link>
                </div>
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
                {isLoading ? 'Signing In...' : 'Sign In'}
                <LogIn size={18} />
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-800"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase tracking-wider">Or continue with</span>
                <div className="flex-grow border-t border-gray-800"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
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
          ) : (
            /* 2FA Verification Form */
            <form onSubmit={handle2FASubmit} className="space-y-6">
              <div className="text-center mb-4">
                <p className="text-gray-300 text-sm">
                  Please enter the 6-digit verification code generated by your Authenticator app.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Google Authenticator Code</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength="6"
                    pattern="\d{6}"
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                    placeholder="000 000"
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-4 text-center text-2xl font-mono tracking-widest text-white placeholder-gray-600 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTwoFactorRequired(false);
                  setError('');
                }}
                className="w-full text-center text-xs text-gray-500 hover:text-gray-400 py-2 transition-colors"
              >
                Back to normal login
              </button>
            </form>
          )}

          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
