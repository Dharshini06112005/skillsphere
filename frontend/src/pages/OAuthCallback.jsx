import React, { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const OAuthCallback = () => {
  const { loginWithOAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const role = params.get('role');
    const name = params.get('name');
    const email = params.get('email');

    if (token) {
      // Complete OAuth login session
      loginWithOAuth(token, { name, email, role });
      navigate('/dashboard', { replace: true });
    } else {
      // Authentication failed
      navigate('/login?error=oauth_failed', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-dark-bg bg-gradient-mesh flex items-center justify-center">
      <div className="glass p-8 rounded-2xl max-w-md w-full text-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold text-white mb-2">Authenticating</h2>
        <p className="text-gray-400">Completing login secure authorization. Please wait...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
