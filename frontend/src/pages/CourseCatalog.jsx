import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import logoImg from '../assets/logo.png';
import { Search, BookOpen, Award, FileText, PlayCircle, Star, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { getCourseThumbnailSrc, getCourseThemeColor, getClassThumbnail } from '../utils/courseHelpers';

export default function CourseCatalog() {
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      let remoteCourses = [];
      try {
        const res = await axios.get('/api/courses', { timeout: 8000 });
        if (res.data && res.data.success && Array.isArray(res.data.courses)) {
          remoteCourses = res.data.courses;
        }
      } catch (err) {
        console.warn('Backend API courses request failed or timed out, loading local courses...', err);
      }

      // Merge custom created courses from localStorage
      try {
        const storedCustomCourses = JSON.parse(localStorage.getItem('sd_custom_courses') || '[]');
        if (storedCustomCourses.length > 0) {
          const merged = [...storedCustomCourses, ...remoteCourses];
          const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
          setCourses(unique);
          return;
        }
      } catch (e) {}

      setCourses(remoteCourses);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(c => {
    const searchLower = (searchQuery || '').trim().toLowerCase();
    const matchesSearch = !searchLower || 
                          (c.title || '').toLowerCase().includes(searchLower) || 
                          (c.description || '').toLowerCase().includes(searchLower) ||
                          (c.category || '').toLowerCase().includes(searchLower);

    const gradeUpper = (selectedGrade || 'ALL').toUpperCase();
    const matchesGrade = gradeUpper === 'ALL' || 
                         (c.category || '').toUpperCase().includes(gradeUpper) ||
                         (c.title || '').toUpperCase().includes(gradeUpper) ||
                         (c.grade || '').toUpperCase().includes(gradeUpper);

    return matchesSearch && matchesGrade;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Store Header Banner */}
      <div className="bg-gradient-to-r from-[#0284C7] via-[#0369A1] to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border-2 border-sky-700">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 text-xs font-black text-white backdrop-blur-xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Official Mathematics Store</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Mathematics Course Batches</h1>
          <p className="text-xs sm:text-sm font-extrabold text-sky-100">
            Grades 7, 8, 9, 10, 11 & 12 CBSE & State Board Mathematics programs curated by Manika Maheshwari.
          </p>
        </div>

        {/* Quick Search Input */}
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            placeholder="Search Mathematics batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-2xl px-4 py-3 pl-11 text-xs text-white placeholder-sky-200 font-extrabold focus:outline-none focus:bg-white focus:text-slate-900 focus:placeholder-slate-400 transition-all shadow-md"
          />
          <Search className="w-5 h-5 text-sky-200 absolute left-3.5 top-3.5" />
        </div>
      </div>

      {/* Grade Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-black">
        <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-2">
          <Filter className="w-4 h-4 text-[#0284C7] dark:text-sky-400" /> Filter Grade:
        </span>
        {['ALL', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map(grade => (
          <button
            key={grade}
            onClick={() => setSelectedGrade(grade)}
            className={`px-4 py-2.5 rounded-xl transition-all shrink-0 ${
              selectedGrade === grade
                ? 'bg-[#0284C7] text-white shadow-md font-black scale-105'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {grade === 'ALL' ? 'All Grades (6-12)' : grade}
          </button>
        ))}
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-800 dark:text-slate-200 text-sm font-black">Loading Mathematics store...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border-2 border-slate-200 dark:border-slate-800 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-xl font-black text-slate-900 dark:text-white">No Mathematics batches found</h3>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Try adjusting your search query or grade filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map(course => (
            <div 
              key={course.id}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-md hover:shadow-2xl hover:border-[#0284C7] dark:hover:border-sky-500 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div 
                  className="relative h-48 overflow-hidden border-b border-slate-200 dark:border-slate-800 flex items-center justify-center"
                  style={{ backgroundColor: getCourseThemeColor(course) }}
                >
                  <img 
                    src={getCourseThumbnailSrc(course)} 
                    alt=""
                    onError={(e) => {
                      const fallback = getClassThumbnail(course.title, course.category, course.grade);
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = fallback;
                      }
                    }}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-[#0284C7] dark:text-sky-400 border border-slate-200 dark:border-slate-700 shadow-xs">
                    {course.category}
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-1 rounded-md shadow-xs">
                    <img src={logoImg} alt="Logo" className="h-5 w-auto" />
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-[#0284C7] dark:group-hover:text-sky-400 transition-colors line-clamp-2 leading-snug">
                    {course.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="pt-2 flex items-center gap-3 text-xs font-black text-slate-700 dark:text-slate-300">
                    {course.validityDays ? (
                      <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {course.validityDays} Days Validity
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Full Access
                      </span>
                    )}
                    {course.category && (
                      <span className="flex items-center gap-1 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                        <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> {course.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">₹{course.price}</span>
                  {course.originalPrice && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 line-through ml-2 font-bold">₹{course.originalPrice}</span>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="px-5 py-3 rounded-xl text-xs font-black text-white bg-[#0284C7] hover:bg-[#0369A1] transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <span>View & Enroll</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
