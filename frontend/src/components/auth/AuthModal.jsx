import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/logo.png';
import { X, User, ShieldCheck, Mail, Phone, Lock, ArrowRight } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, resetPassword } = useAuth();
  const navigate = useNavigate();
  
  // Login Role: 'STUDENT' or 'ADMIN'
  const [role, setRole] = useState('STUDENT');
  const [isRegister, setIsRegister] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('monisha@gmail.com');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [resetLinkUrl, setResetLinkUrl] = useState('');

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setError('');
    setSuccessMessage('');
    setResetLinkUrl('');
    if (selectedRole === 'ADMIN') {
      setEmail('dikshasarvottam@gmail.com');
      setPassword('admin123');
    } else {
      setEmail('monisha@gmail.com');
      setPassword('student123');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setResetLinkUrl('');
    setLoading(true);

    try {
      const targetEmail = (email || '').trim() || (role === 'ADMIN' ? 'dikshasarvottam@gmail.com' : 'monisha@gmail.com');
      const targetPassword = password || (role === 'ADMIN' ? 'admin123' : 'student123');

      if (role === 'ADMIN') {
        await login(targetEmail, targetPassword);
        onClose();
        navigate('/admin');
      } else {
        if (isRegister) {
          await register(targetEmail, targetPassword, { name: name || 'Monisha K P', phone: phone || '+91 98765 43210' });
        } else {
          await login(targetEmail, targetPassword);
        }
        onClose();
        navigate('/my-courses');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address to reset password.');
      return;
    }
    setError('');
    setSuccessMessage('');
    setResetLinkUrl('');
    try {
      const res = await resetPassword(email);
      setSuccessMessage(res.message || `Password reset link generated for ${email}!`);
      if (res.resetLink) {
        setResetLinkUrl(res.resetLink);
      }
    } catch (err) {
      setError(err.message || 'Failed to send password reset email.');
    }
  };

  const handleQuickDemoAdmin = async () => {
    setLoading(true);
    setError('');
    try {
      await login('dikshasarvottam@gmail.com', 'admin123');
      onClose();
      navigate('/admin');
    } catch (err) {
      setError('Admin demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoStudent = async () => {
    setLoading(true);
    setError('');
    try {
      await login('monisha@gmail.com', 'student123');
      onClose();
      navigate('/my-courses');
    } catch (err) {
      setError('Student demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 relative">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Logo & Title */}
        <div className="text-center space-y-2">
          <img src={logoImg} alt="Sarvottam Diksha Logo" className="h-16 w-auto mx-auto object-contain" />
          <h3 className="text-2xl font-black text-slate-900">
            {role === 'ADMIN' ? 'Admin Teacher Login' : isRegister ? 'Create Student Account' : 'Student Portal Login'}
          </h3>
          <p className="text-xs font-bold text-slate-600">Sarvottam Diksha Mathematics (Grades 6-12)</p>
        </div>

        {/* Role Choice Buttons: Student vs Admin */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-black">
          <button
            type="button"
            onClick={() => handleRoleChange('STUDENT')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'STUDENT' ? 'bg-[#0284C7] text-white shadow-md' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>I am a Student</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('ADMIN')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'ADMIN' ? 'bg-purple-900 text-white shadow-md' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>I am Teacher (Admin)</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-black text-center">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-xs font-black text-center space-y-2 animate-fade-in shadow-xs">
            <div>{successMessage}</div>
            {resetLinkUrl && (
              <a
                href={resetLinkUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => onClose()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 mt-1 cursor-pointer"
              >
                <span>🔑 Click to Reset Password Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
          
          {role === 'STUDENT' && isRegister && (
            <div>
              <label className="block text-slate-800 mb-1">Full Student Name</label>
              <input
                type="text"
                required
                placeholder="Monisha K P"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-semibold focus:outline-none focus:border-[#0284C7]"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-800 mb-1">
              {role === 'ADMIN' ? 'Admin Email' : 'Email Address'}
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 pl-10 text-slate-900 font-semibold focus:outline-none focus:border-[#0284C7]"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          {(isRegister || role === 'ADMIN') && (
            <div>
              <label className="block text-slate-800 mb-1">Phone Number</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 pl-10 text-slate-900 font-semibold focus:outline-none focus:border-[#0284C7]"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-slate-800">
                {role === 'ADMIN' ? 'Special Admin Passcode' : 'Password'}
              </label>
              <button 
                type="button" 
                onClick={handleForgotPassword} 
                className="text-[11px] font-black text-[#0284C7] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                placeholder={isRegister ? "Min 6 characters" : "••••••••"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 pl-10 text-slate-900 font-semibold focus:outline-none focus:border-[#0284C7]"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-black text-xs text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
              role === 'ADMIN' ? 'bg-purple-900 hover:bg-purple-950' : 'bg-[#0284C7] hover:bg-[#0369A1]'
            }`}
          >
            <span>{loading ? 'Authenticating with Firebase...' : role === 'ADMIN' ? 'Login & Open Admin Portal' : isRegister ? 'Register Account' : 'Student Login'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Quick Demo Login */}
        <div className="pt-2 border-t border-slate-200 space-y-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center block">1-Click Instant Login</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleQuickDemoStudent}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-black"
            >
              Demo Student
            </button>
            <button
              type="button"
              onClick={handleQuickDemoAdmin}
              className="py-2.5 px-3 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-[11px] font-black"
            >
              Manika Ma'am (Admin)
            </button>
          </div>
        </div>

        {role === 'STUDENT' && (
          <div className="text-center text-xs font-bold text-slate-600">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); setSuccessMessage(''); }}
              className="text-[#0284C7] font-black hover:underline"
            >
              {isRegister ? 'Sign In' : 'Register Here'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
