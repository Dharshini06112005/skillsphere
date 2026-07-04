import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await API.get(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification link is invalid or has expired.');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
      <div className="glass p-8 rounded-3xl max-w-md w-full text-center shadow-2xl relative overflow-hidden">
        
        {status === 'verifying' && (
          <div className="space-y-4">
            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto" />
            <h2 className="text-2xl font-bold text-white">Verifying Email</h2>
            <p className="text-gray-400">Verifying security token. Please wait...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-5">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Email Verified!</h2>
            <p className="text-gray-300">{message}</p>
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-8 rounded-xl transition-colors shadow-lg shadow-indigo-600/30"
              >
                Proceed to Login
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Verification Failed</h2>
            <p className="text-gray-300">{message}</p>
            <div className="pt-4">
              <Link
                to="/register"
                className="inline-block bg-gray-900 border border-gray-800 hover:bg-gray-800 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
              >
                Back to Sign Up
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyEmail;
