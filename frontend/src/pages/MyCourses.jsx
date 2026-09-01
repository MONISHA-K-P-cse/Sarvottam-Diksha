import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, PlayCircle, BookOpen, Clock } from 'lucide-react';
import { getCourseThumbnailSrc, getCourseThemeColor, getClassThumbnail } from '../utils/courseHelpers';

export default function MyCourses() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const res = await axios.get('/api/courses/my-courses');
      if (res.data.success) {
        setPurchases(res.data.myCourses);
      }
    } catch (err) {
      console.error('Failed to load my courses:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-800 dark:text-slate-200 text-sm font-extrabold">
        Loading your enrolled courses...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* High Contrast Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-xs font-black text-emerald-800 dark:text-emerald-300">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Student Learning Portal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          My Unlocked Courses
        </h1>
        <p className="text-sm sm:text-base font-extrabold text-slate-700 dark:text-slate-300">
          Access video lectures, formula sheets, and chapterwise MCQ tests.
        </p>
      </div>

      {/* Course List or Empty State */}
      {purchases.length === 0 ? (
        <div className="bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60 dark:from-slate-900 dark:to-slate-950 rounded-3xl p-12 text-center space-y-6 border-2 border-amber-200/90 dark:border-slate-800 shadow-lg max-w-3xl mx-auto transition-colors">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-r from-[#FF6500] to-amber-500 text-white flex items-center justify-center shadow-xl">
            <BookOpen className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">No Courses Unlocked Yet</h3>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              You haven't enrolled in any courses yet. Browse our course catalog to select a course and unlock full access.
            </p>
          </div>

          <button
            onClick={() => navigate('/store')}
            className="px-8 py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-600 hover:from-orange-600 hover:to-emerald-700 shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            Browse All Courses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {purchases.map(p => (
            <div
              key={p.purchaseId}
              className="bg-gradient-to-br from-emerald-50/90 via-white to-green-50/60 dark:from-slate-900 dark:to-emerald-950/40 rounded-3xl overflow-hidden border-2 border-emerald-200/90 dark:border-emerald-500/30 shadow-md hover:shadow-2xl hover:border-emerald-400 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div 
                  className="relative h-48 overflow-hidden border-b border-slate-200 dark:border-slate-800 flex items-center justify-center"
                  style={{ backgroundColor: getCourseThemeColor(p.course) }}
                >
                  <img 
                    src={getCourseThumbnailSrc(p.course)} 
                    alt="" 
                    onError={(e) => {
                      const fallback = getClassThumbnail(p.course.title, p.course.category, p.course.grade);
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = fallback;
                      }
                    }}
                    className="w-full h-full object-contain" 
                  />
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                    UNLOCKED
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {p.course.title}
                  </h3>
                  <p className="text-xs font-extrabold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    Enrolled Date: {new Date(p.purchaseDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2">
                <button
                  onClick={() => navigate(`/learn/${p.course.id}`)}
                  className="w-full py-3.5 rounded-xl font-black text-sm text-white bg-[#0284C7] hover:bg-[#0369A1] shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <PlayCircle className="w-5 h-5" />
                  Start Learning & Practice MCQs
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
