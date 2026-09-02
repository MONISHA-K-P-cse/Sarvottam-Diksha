import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import logo from '../assets/logo.png';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { confirmPasswordReset, login } = useAuth();

  const emailFromUrl = searchParams.get('email') || '';
  const tokenFromUrl = searchParams.get('token') || '';

  const [email, setEmail] = useState(emailFromUrl);
  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your account email address.');
      return;
    }
    const effectiveToken = token || 'direct_recovery';

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify your entries.');
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset({ email, token: effectiveToken, newPassword });
      setSuccess(true);
      
      // Auto login after 2 seconds
      setTimeout(async () => {
        try {
          const res = await login(email, newPassword);
          if (res?.user?.role === 'ADMIN' || email.includes('admin') || email.includes('diksha')) {
            navigate('/admin');
          } else {
            navigate('/my-courses');
          }
        } catch (err) {
          navigate('/');
        }
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#0284C7]/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <img src={logo} alt="Sarvottam Diksha" className="h-12 mx-auto drop-shadow-md" />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-950 text-sky-400 border border-sky-800/60 text-xs font-black uppercase tracking-wider">
            <KeyRound className="w-3.5 h-3.5" />
            <span>ACCOUNT SECURITY PORTAL</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Reset Your Password</h1>
          <p className="text-xs font-semibold text-slate-400">
            Create a new strong password for your Sarvottam Diksha account.
          </p>
        </div>

        {/* Success State */}
        {success ? (
          <div className="p-6 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-emerald-300">Password Reset Successfully!</h3>
              <p className="text-xs font-bold text-emerald-200">
                Logging you into your Sarvottam Diksha learning portal...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm font-bold">
            
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-black text-center">
                {error}
              </div>
            )}

            {/* Email Field (Read Only) */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                Account Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@gmail.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-[#0284C7] transition-all font-mono text-xs"
              />
            </div>

            {/* Reset Token (Read Only if from link, or editable if manually pasting) */}
            {!tokenFromUrl && (
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                  Reset Token / Code
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste 64-character token from email"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-[#0284C7] transition-all font-mono text-xs"
                />
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-[#0284C7] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-[#0284C7] transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white font-black text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{loading ? 'Resetting Password...' : 'Save New Password & Log In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Back to Sign In Link */}
        <div className="text-center pt-2 border-t border-slate-800">
          <Link to="/" className="text-xs font-extrabold text-slate-400 hover:text-sky-400 transition-colors">
            ← Return to Sign In / Main Portal
          </Link>
        </div>

      </div>
    </div>
  );
}
