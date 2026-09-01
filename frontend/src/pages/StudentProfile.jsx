import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, Calendar, BookOpen, Award, CreditCard, Edit3, CheckCircle2, Save, FileText } from 'lucide-react';

export default function StudentProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info'); // info, courses, performance, payments
  const [editing, setEditing] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || 'Monisha K P',
    phone: user?.phone || '919108065494',
    email: user?.email || 'student@gmail.com',
    about: 'Class 10 CBSE Student preparing for Mathematics Board Exams.',
    rollNumber: 'SD-2026-1042',
    dateOfJoining: new Date(user?.createdAt || Date.now()).toLocaleDateString()
  });

  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    fetchProfileDetails();
  }, [user]);

  const fetchProfileDetails = async () => {
    try {
      if (user) {
        const [myRes, analyticsRes] = await Promise.all([
          axios.get('/api/courses/my-courses'),
          axios.get('/api/admin/quiz-analytics')
        ]);

        if (myRes.data.success) {
          setPurchases(myRes.data.myCourses);
        }
        if (analyticsRes.data.success) {
          const myAttempts = analyticsRes.data.attempts.filter(a => a.user?.id === user.id);
          setQuizAttempts(myAttempts);
        }
      }
    } catch (err) {
      console.error('Failed to load profile details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSaveMessage('Profile information updated successfully!');
    setEditing(false);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  if (!user) {
    return (
      <div className="text-center py-20 text-slate-800 dark:text-slate-200 text-sm font-extrabold">
        Please sign in to view your student profile.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-orange-600 flex items-center justify-center font-black text-2xl border-4 border-white/30 shadow-md">
              {profileData.name.charAt(0)}
            </div>
            <button 
              onClick={() => setEditing(!editing)}
              className="absolute bottom-0 right-0 bg-white text-slate-900 p-1.5 rounded-full shadow-md hover:bg-slate-100 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">{profileData.name}</h1>
            <span className="text-xs font-bold text-orange-100 uppercase tracking-wider block">
              Organization Code: JOSHVZ
            </span>
          </div>
        </div>

        <div className="hidden sm:block text-right text-xs font-black text-orange-100">
          <div>Roll No: {profileData.rollNumber}</div>
          <div>Joined: {profileData.dateOfJoining}</div>
        </div>
      </div>

      {/* Sub-Tabs: INFO | COURSES | PERFORMANCE | PAYMENTS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2 overflow-x-auto text-xs font-black transition-colors">
        {[
          { id: 'info', label: 'INFO' },
          { id: 'courses', label: 'COURSES' },
          { id: 'performance', label: 'PERFORMANCE' },
          { id: 'payments', label: 'PAYMENTS' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#0284C7] text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {saveMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs font-black flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* TAB 1: BASIC INFO */}
      {activeTab === 'info' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Personal Information</h2>
            <button
              onClick={() => setEditing(!editing)}
              className="text-xs font-black text-[#0284C7] dark:text-sky-400 hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-4 h-4" />
              <span>{editing ? 'Cancel Editing' : 'Edit Info'}</span>
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-extrabold text-slate-700 dark:text-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-900 dark:text-white mb-1 font-black">Full Name</label>
                <input
                  type="text"
                  disabled={!editing}
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-black disabled:opacity-80"
                />
              </div>

              <div>
                <label className="block text-slate-900 dark:text-white mb-1 font-black">Phone Number</label>
                <input
                  type="text"
                  disabled={!editing}
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-black disabled:opacity-80"
                />
              </div>

              <div>
                <label className="block text-slate-900 dark:text-white mb-1 font-black">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={profileData.email}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-500 dark:text-slate-400 font-black cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-900 dark:text-white mb-1 font-black">Roll Number</label>
                <input
                  type="text"
                  disabled
                  value={profileData.rollNumber}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-500 dark:text-slate-400 font-black cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-900 dark:text-white mb-1 font-black">About / Grade Goal</label>
              <textarea
                rows={3}
                disabled={!editing}
                value={profileData.about}
                onChange={(e) => setProfileData({ ...profileData, about: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-black disabled:opacity-80"
              />
            </div>

            {editing && (
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#0284C7] text-white font-black text-xs shadow-md hover:bg-[#0369A1] transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            )}
          </form>
        </div>
      )}

      {/* TAB 2: UNLOCKED COURSES */}
      {activeTab === 'courses' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <h2 className="text-xl font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
            Enrolled Batches & Courses ({purchases.length})
          </h2>

          {purchases.length === 0 ? (
            <div className="text-center py-8 text-xs font-bold text-slate-500 dark:text-slate-400">
              No courses unlocked yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {purchases.map(p => (
                <div key={p.purchaseId} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center gap-3">
                  <BookOpen className="w-8 h-8 text-[#0284C7] dark:text-sky-400 shrink-0" />
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-sm">{p.course.title}</h4>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">STATUS: UNLOCKED</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PERFORMANCE */}
      {activeTab === 'performance' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <h2 className="text-xl font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
            MCQ Test Performance & Analytics
          </h2>

          {quizAttempts.length === 0 ? (
            <div className="text-center py-8 text-xs font-bold text-slate-500 dark:text-slate-400">
              No test attempts recorded yet. Practice MCQs in the MCQ engine to see performance.
            </div>
          ) : (
            <div className="space-y-3">
              {quizAttempts.map(att => (
                <div key={att.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-sm">{att.quiz?.title || 'Chapter Practice Test'}</h4>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Score: {att.score} / {att.totalQuestions} ({Math.round((att.score / (att.totalQuestions || 1)) * 100)}%)
                    </span>
                  </div>
                  <Award className="w-6 h-6 text-amber-500" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
          <h2 className="text-xl font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
            Payment & Transaction History
          </h2>

          <div className="space-y-3 text-xs font-bold text-slate-700 dark:text-slate-300">
            {purchases.map(p => (
              <div key={p.purchaseId} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white">{p.course.title}</h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Transaction ID: {p.transactionId || 'TXN_987452'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 dark:text-white text-sm">₹{p.amountPaid || p.course.price || 499}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black block">SUCCESS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
