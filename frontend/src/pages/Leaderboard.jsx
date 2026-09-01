import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, Trophy, Medal, Star, Flame, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get('/api/tests/leaderboard/top');
      if (res.data.success) {
        setLeaderboard(res.data.leaderboard);
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-xs font-black text-amber-800 dark:text-amber-300">
          <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Sarvottam Diksha Hall of Fame</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Mathematics Student Leaderboard</h1>
        <p className="text-sm sm:text-base font-extrabold text-slate-700 dark:text-slate-300">
          Celebrating top-scoring students across CBSE & State Board Mathematics chapterwise MCQ practice tests.
        </p>
      </div>

      {/* Top 3 Podium Cards */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-4">
          
          {/* Rank 2 (Left Podium - Warm Orange Theme) */}
          <div className="bg-gradient-to-br from-orange-50/90 via-white to-amber-50/60 dark:from-slate-900 dark:to-orange-950/40 p-6 rounded-3xl border-2 border-orange-300 dark:border-orange-500/40 shadow-lg text-center space-y-3 relative order-2 md:order-1 transition-all">
            <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 font-black text-xl flex items-center justify-center mx-auto border-2 border-orange-300 dark:border-orange-400/40 shadow-sm">
              🥈 2nd
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{leaderboard[1]?.student?.name}</h3>
            <span className="text-xs font-extrabold text-[#FF6500] dark:text-orange-400 block">{leaderboard[1]?.bestTestTitle || 'Mathematics Practice'}</span>
            <div className="bg-orange-100/60 dark:bg-slate-800 p-3 rounded-2xl text-xs font-black text-orange-950 dark:text-slate-200 space-y-1 border border-orange-200/80 dark:border-slate-700">
              <div>Total Score: {leaderboard[1]?.totalScore} pts ({leaderboard[1]?.testsCount} tests)</div>
              <div className="text-emerald-700 dark:text-emerald-400">Avg Accuracy: {leaderboard[1]?.avgAccuracy}%</div>
            </div>
          </div>

          {/* Rank 1 (Center High Podium - Golden Yellow / Orange Theme) */}
          <div className="bg-gradient-to-b from-amber-500 via-orange-500 to-amber-600 text-white p-8 rounded-3xl shadow-2xl text-center space-y-4 relative transform md:-translate-y-4 order-1 md:order-2 ring-4 ring-amber-300/40">
            <div className="w-16 h-16 rounded-full bg-white text-amber-600 font-black text-2xl flex items-center justify-center mx-auto shadow-lg">
              🥇 1st
            </div>
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-amber-100">OVERALL TOP SCORER</span>
              <h3 className="text-2xl font-black text-white">{leaderboard[0]?.student?.name}</h3>
              <span className="text-xs font-bold text-amber-100 block">{leaderboard[0]?.bestTestTitle || 'Mathematics Practice'}</span>
            </div>
            <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl text-xs font-black text-white space-y-1">
              <div className="text-base">Total Points: {leaderboard[0]?.totalScore} pts ({leaderboard[0]?.testsCount} tests)</div>
              <div className="text-amber-100">Avg Accuracy: {leaderboard[0]?.avgAccuracy}%</div>
            </div>
          </div>

          {/* Rank 3 (Right Podium - Fresh Green Theme) */}
          <div className="bg-gradient-to-br from-emerald-50/90 via-white to-green-50/60 dark:from-slate-900 dark:to-emerald-950/40 p-6 rounded-3xl border-2 border-emerald-300 dark:border-emerald-500/40 shadow-lg text-center space-y-3 relative order-3 transition-all">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-black text-xl flex items-center justify-center mx-auto border-2 border-emerald-300 dark:border-emerald-400/40 shadow-sm">
              🥉 3rd
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{leaderboard[2]?.student?.name}</h3>
            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 block">{leaderboard[2]?.bestTestTitle || 'Mathematics Practice'}</span>
            <div className="bg-emerald-100/60 dark:bg-slate-800 p-3 rounded-2xl text-xs font-black text-emerald-950 dark:text-slate-200 space-y-1 border border-emerald-200/80 dark:border-slate-700">
              <div>Total Score: {leaderboard[2]?.totalScore} pts ({leaderboard[2]?.testsCount} tests)</div>
              <div className="text-emerald-700 dark:text-emerald-400">Avg Accuracy: {leaderboard[2]?.avgAccuracy}%</div>
            </div>
          </div>

        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Medal className="w-6 h-6 text-amber-500" /> Full Common Student Rank Roster
        </h3>

        {loading ? (
          <div className="text-center py-12 text-slate-800 dark:text-slate-200 text-xs font-black">Loading common performance leaderboard...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-bold">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Student Email</th>
                  <th className="py-3 px-4">Tests Taken</th>
                  <th className="py-3 px-4">Total Points Earned</th>
                  <th className="py-3 px-4">Average Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {leaderboard.map((item, idx) => (
                  <tr key={item.student?.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-4 px-4 font-black">
                      {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                    </td>
                    <td className="py-4 px-4 font-black text-slate-900 dark:text-white">{item.student?.name}</td>
                    <td className="py-4 px-4 text-slate-500 dark:text-slate-400">{item.student?.email}</td>
                    <td className="py-4 px-4 font-extrabold text-sky-700 dark:text-sky-400">{item.testsCount} Quizzes</td>
                    <td className="py-4 px-4 font-black">{item.totalScore} pts</td>
                    <td className="py-4 px-4 text-emerald-700 dark:text-emerald-400 font-black">{item.avgAccuracy}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
