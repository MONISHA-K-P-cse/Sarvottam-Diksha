import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, Save, Eye, Plus, Trash2, Video, FileText, 
  HelpCircle, CheckCircle2, Sliders, Clock, Tag, Layout, BookOpen
} from 'lucide-react';

export default function CourseManagerPage() {
  const { id, courseId } = useParams();
  const targetId = courseId || id;
  const navigate = useNavigate();

  const defaultPresets = [
    { id: 'c1', title: 'Class 10 Mathematics Complete NCERT Coaching', price: 650, category: 'CLASS 10 MATHEMATICS', status: 'PUBLISHED', description: 'Class 10 Mathematics Complete NCERT Coaching', chapters: [] },
    { id: 'c2', title: 'Class 10 Mathematics Coaching Batch', price: 1000, category: 'CLASS 10 MATHEMATICS', status: 'PUBLISHED', description: 'Class 10 Mathematics Coaching Batch', chapters: [] },
    { id: 'c3', title: 'Class 9 Mathematics Coaching Batch', price: 500, category: 'CLASS 9 MATHEMATICS', status: 'PUBLISHED', description: 'Class 9 Mathematics Coaching Batch', chapters: [] },
    { id: 'c4', title: 'Class 10 Mathematics Batch', price: 500, category: 'CLASS 10 MATHEMATICS', status: 'PUBLISHED', description: 'Class 10 Mathematics Batch', chapters: [] },
    { id: 'EFGH', title: 'Class 10 Mathematics Complete NCERT Coaching', price: 650, category: 'CLASS 10 MATHEMATICS', status: 'PUBLISHED', description: 'Class 10 Mathematics Complete NCERT Coaching', chapters: [] },
    { id: 'abcd', title: 'Class 10 Mathematics Coaching Batch', price: 1000, category: 'CLASS 10 MATHEMATICS', status: 'PUBLISHED', description: 'Class 10 Mathematics Coaching Batch', chapters: [] },
    { id: 'Abhyaas', title: 'Class 9 Mathematics Coaching Batch', price: 500, category: 'CLASS 9 MATHEMATICS', status: 'PUBLISHED', description: 'Class 9 Mathematics Coaching Batch', chapters: [] },
    { id: 'Abhyaas class 10', title: 'Class 10 Mathematics Batch', price: 500, category: 'CLASS 10 MATHEMATICS', status: 'PUBLISHED', description: 'Class 10 Mathematics Batch', chapters: [] }
  ];

  const findCourseMatch = (targetId, sources) => {
    if (!targetId) return null;
    const normTarget = String(targetId).trim().toLowerCase();
    const found = sources.find(c => {
      if (!c) return false;
      const cId = String(c.id || '').trim().toLowerCase();
      const cTitle = String(c.title || '').trim().toLowerCase();
      return cId === normTarget || cTitle === normTarget || normTarget.includes(cId) || cId.includes(normTarget);
    });

    if (found) return found;

    // Dynamic fallback for any course ID created now or in the future
    return {
      id: targetId,
      title: String(targetId).replace(/[-_]/g, ' ').toUpperCase() + ' Batch',
      price: 500,
      category: 'MATHEMATICS',
      status: 'PUBLISHED',
      description: 'Complete NCERT & Board Exam Coaching Batch',
      chapters: []
    };
  };

  const [course, setCourse] = useState(() => {
    try {
      const storedCustom = JSON.parse(localStorage.getItem('sd_custom_courses') || '[]');
      const storedCourses = JSON.parse(localStorage.getItem('sd_courses') || '[]');
      const allLocal = [...storedCustom, ...storedCourses, ...defaultPresets];
      return findCourseMatch(targetId, allLocal);
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(!course);
  const [notFound, setNotFound] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('settings'); // 'settings' | 'curriculum' | 'quizzes'
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [availableQuizzes, setAvailableQuizzes] = useState([]);

  // New Chapter Form state
  const [newChapterTitle, setNewChapterTitle] = useState('');
  
  // New Lesson Form state
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoDuration, setNewVideoDuration] = useState('15 Mins');

  // New PDF Note Form state
  const [newPdfTitle, setNewPdfTitle] = useState('');
  const [newPdfUrl, setNewPdfUrl] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    loadCourseDetails();
    loadQuizzes();
  }, [targetId]);

  const loadCourseDetails = async () => {
    if (!course) setLoading(true);
    setNotFound(false);
    let loadedCourse = null;

    try {
      const res = await axios.get(`/api/admin/courses/${targetId}/full`);
      if (res.data && res.data.success && res.data.course) {
        loadedCourse = res.data.course;
      }
    } catch (e) {}

    if (!loadedCourse) {
      try {
        const res = await axios.get(`/api/courses/${targetId}`);
        if (res.data && res.data.success && res.data.course) {
          loadedCourse = res.data.course;
        }
      } catch (e) {}
    }

    if (!loadedCourse) {
      try {
        const storedCustom = JSON.parse(localStorage.getItem('sd_custom_courses') || '[]');
        const storedCourses = JSON.parse(localStorage.getItem('sd_courses') || '[]');
        const allLocal = [...storedCustom, ...storedCourses, ...defaultPresets];
        loadedCourse = findCourseMatch(targetId, allLocal);
      } catch (e) {}
    }

    if (loadedCourse) {
      setCourse(loadedCourse);
      if (loadedCourse.chapters && loadedCourse.chapters.length > 0) {
        setSelectedChapterId(loadedCourse.chapters[0].id);
      }
    } else {
      setCourse(null);
      setNotFound(true);
    }
    setLoading(false);
  };

  const loadQuizzes = async () => {
    try {
      const res = await axios.get('/api/admin/tests');
      if (res.data && res.data.success) {
        setAvailableQuizzes(res.data.tests || []);
      }
    } catch (e) {}

    if (availableQuizzes.length === 0) {
      try {
        const localTests = JSON.parse(localStorage.getItem('sd_custom_tests') || '[]');
        setAvailableQuizzes(localTests);
      } catch (e) {}
    }
  };

  const handleSaveCourseSettings = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!course) return;

    // Async backend update
    axios.put(`/api/admin/courses/${course.id}`, course).catch(() => {});

    // Save to local storage
    try {
      const storedCustom = JSON.parse(localStorage.getItem('sd_custom_courses') || '[]');
      const exists = storedCustom.some(c => c.id === course.id);
      const updatedList = exists 
        ? storedCustom.map(c => c.id === course.id ? course : c)
        : [course, ...storedCustom];
      localStorage.setItem('sd_custom_courses', JSON.stringify(updatedList));
    } catch (e) {}

    setMessage({ type: 'success', text: `🎉 Course '${course.title}' saved successfully!` });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) return;
    const newCh = {
      id: 'ch_' + Date.now(),
      title: newChapterTitle.trim(),
      videos: [],
      pdfs: [],
      tests: []
    };
    const updatedChapters = [...(course.chapters || []), newCh];
    const updatedCourse = { ...course, chapters: updatedChapters };
    setCourse(updatedCourse);
    setSelectedChapterId(newCh.id);
    setNewChapterTitle('');

    // Save
    saveCourseState(updatedCourse);
  };

  const handleAddVideoToChapter = (chapterId) => {
    if (!newVideoTitle.trim()) return;
    const newVideo = {
      id: 'v_' + Date.now(),
      title: newVideoTitle.trim(),
      videoUrl: newVideoUrl.trim() || 'https://www.youtube.com/watch?v=demo',
      duration: newVideoDuration || '20 Mins'
    };

    const updatedChapters = (course.chapters || []).map(ch => {
      if (ch.id === chapterId) {
        return { ...ch, videos: [...(ch.videos || []), newVideo] };
      }
      return ch;
    });

    const updatedCourse = { ...course, chapters: updatedChapters };
    setCourse(updatedCourse);
    setNewVideoTitle('');
    setNewVideoUrl('');
    saveCourseState(updatedCourse);
  };

  const handleAddPdfToChapter = (chapterId) => {
    if (!newPdfTitle.trim()) return;
    const newPdf = {
      id: 'pdf_' + Date.now(),
      title: newPdfTitle.trim(),
      fileUrl: newPdfUrl.trim() || '#'
    };

    const updatedChapters = (course.chapters || []).map(ch => {
      if (ch.id === chapterId) {
        return { ...ch, pdfs: [...(ch.pdfs || []), newPdf] };
      }
      return ch;
    });

    const updatedCourse = { ...course, chapters: updatedChapters };
    setCourse(updatedCourse);
    setNewPdfTitle('');
    setNewPdfUrl('');
    saveCourseState(updatedCourse);
  };

  const handleLinkQuizToChapter = (chapterId, quiz) => {
    const newTest = {
      id: quiz.id || ('test_' + Date.now()),
      title: quiz.title,
      questionsCount: quiz.questions?.length || quiz.questionsCount || 10,
      durationMinutes: quiz.timeLimitMinutes || quiz.durationMinutes || 30,
      totalMarks: quiz.totalMarks || 40
    };

    const updatedChapters = (course.chapters || []).map(ch => {
      if (ch.id === chapterId) {
        const exists = (ch.tests || []).some(t => t.id === newTest.id);
        if (exists) return ch;
        return { ...ch, tests: [...(ch.tests || []), newTest] };
      }
      return ch;
    });

    const updatedCourse = { ...course, chapters: updatedChapters };
    setCourse(updatedCourse);
    saveCourseState(updatedCourse);
  };

  const saveCourseState = (updatedCourse) => {
    try {
      const storedCustom = JSON.parse(localStorage.getItem('sd_custom_courses') || '[]');
      const exists = storedCustom.some(c => c.id === updatedCourse.id);
      const updatedList = exists 
        ? storedCustom.map(c => c.id === updatedCourse.id ? updatedCourse : c)
        : [updatedCourse, ...storedCustom];
      localStorage.setItem('sd_custom_courses', JSON.stringify(updatedList));
    } catch (e) {}
    axios.put(`/api/admin/courses/${updatedCourse.id}`, updatedCourse).catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-sm font-black tracking-wide text-slate-300 animate-pulse">Loading Course Management Workspace...</div>
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-slate-900 border-2 border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-rose-500/10 border-2 border-rose-500/30 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
            <Sliders className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Course not found</h2>
            <p className="text-xs font-bold text-slate-400">
              The requested course ID <span className="font-mono text-rose-400">"{targetId}"</span> could not be found or has been removed.
            </p>
          </div>
          <button 
            onClick={() => navigate('/admin')} 
            className="w-full py-3 bg-gradient-to-r from-sky-400 to-[#0284C7] hover:from-sky-500 hover:to-[#0284C7] text-white rounded-xl font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to Course Catalog</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 pb-20 font-sans">
      
      {/* Top Sticky Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {course.status || 'PUBLISHED'}
              </span>
              <span className="text-xs font-black text-[#FF6500] uppercase tracking-wider">{course.category}</span>
            </div>
            <h1 className="text-xl font-black text-white leading-tight mt-0.5">{course.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/courses/${course.id}`)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-700"
          >
            <Eye className="w-4 h-4 text-sky-400" />
            <span>Preview Live Student Page</span>
          </button>

          <button
            onClick={handleSaveCourseSettings}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-[#FF6500] hover:from-orange-600 hover:to-orange-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Course Changes</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {message.text && (
          <div className={`p-4 rounded-2xl text-xs font-black flex items-center justify-between ${
            message.type === 'success' ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-300' : 'bg-rose-950/80 border border-rose-500 text-rose-300'
          }`}>
            <span>{message.text}</span>
          </div>
        )}

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Course Price</div>
            <div className="text-xl font-black text-emerald-400 mt-1">₹{course.price}</div>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Validity Period</div>
            <div className="text-xl font-black text-sky-400 mt-1">{course.validityDays || 365} Days</div>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Curriculum Chapters</div>
            <div className="text-xl font-black text-purple-400 mt-1">{course.chapters?.length || 0} Chapters</div>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Enrolled Students</div>
            <div className="text-xl font-black text-amber-400 mt-1">{course.studentCount || 0} Active</div>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-slate-800 gap-8">
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`pb-3 text-xs font-black transition-all flex items-center gap-2 border-b-2 ${
              activeSubTab === 'settings' ? 'border-[#FF6500] text-[#FF6500]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>1. Basic Info & Pricing</span>
          </button>

          <button
            onClick={() => setActiveSubTab('curriculum')}
            className={`pb-3 text-xs font-black transition-all flex items-center gap-2 border-b-2 ${
              activeSubTab === 'curriculum' ? 'border-[#FF6500] text-[#FF6500]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>2. Chapter Videos & PDFs ({course.chapters?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('quizzes')}
            className={`pb-3 text-xs font-black transition-all flex items-center gap-2 border-b-2 ${
              activeSubTab === 'quizzes' ? 'border-[#FF6500] text-[#FF6500]' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>3. Attach Test Series & Quizzes</span>
          </button>
        </div>

        {/* TAB 1: BASIC INFO & PRICING */}
        {activeSubTab === 'settings' && (
          <div className="bg-slate-900/60 rounded-3xl p-6 border border-slate-800 space-y-6">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-400" />
              <span>Edit Course Information & Pricing</span>
            </h3>

            <form onSubmit={handleSaveCourseSettings} className="space-y-6 text-xs font-bold">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-300 font-black mb-1.5">Course Batch Title</label>
                  <input
                    type="text"
                    required
                    value={course.title}
                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-3.5 text-white font-black focus:border-[#FF6500] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-black mb-1.5">Category / Grade</label>
                  <select
                    value={course.category}
                    onChange={(e) => setCourse({ ...course, category: e.target.value })}
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-3.5 text-white font-black focus:border-[#FF6500] focus:outline-none"
                  >
                    <option value="Class 10 Mathematics">Class 10 Mathematics</option>
                    <option value="Class 9 Mathematics">Class 9 Mathematics</option>
                    <option value="Class 11 Mathematics">Class 11 Mathematics</option>
                    <option value="Class 12 Mathematics">Class 12 Mathematics</option>
                    <option value="Special Revision Batch">Special Revision Batch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-black mb-1.5">Course Description</label>
                <textarea
                  rows={4}
                  value={course.description || ''}
                  onChange={(e) => setCourse({ ...course, description: e.target.value })}
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-3.5 text-white font-extrabold focus:border-[#FF6500] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-slate-300 font-black mb-1.5">Discounted Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={course.price}
                    onChange={(e) => setCourse({ ...course, price: Number(e.target.value) })}
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-3.5 text-white font-black text-sm focus:border-[#FF6500] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-black mb-1.5">Original Price / MRP (₹)</label>
                  <input
                    type="number"
                    value={course.originalPrice || ''}
                    onChange={(e) => setCourse({ ...course, originalPrice: Number(e.target.value) })}
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-3.5 text-white font-black text-sm focus:border-[#FF6500] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-black mb-1.5">Validity (Days)</label>
                  <input
                    type="number"
                    value={course.validityDays || 365}
                    onChange={(e) => setCourse({ ...course, validityDays: Number(e.target.value) })}
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-3.5 text-white font-black text-sm focus:border-[#FF6500] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-300 font-black mb-1.5">Course Status</label>
                  <select
                    value={course.status || 'PUBLISHED'}
                    onChange={(e) => setCourse({ ...course, status: e.target.value })}
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-3.5 text-white font-black focus:border-[#FF6500] focus:outline-none"
                  >
                    <option value="PUBLISHED">PUBLISHED (Live on Student Portal)</option>
                    <option value="DRAFT">DRAFT (Hidden)</option>
                    <option value="UNPUBLISHED">UNPUBLISHED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-black mb-1.5">Thumbnail Image URL</label>
                  <input
                    type="text"
                    placeholder="/assets/poster-banner.png"
                    value={course.thumbnail || ''}
                    onChange={(e) => setCourse({ ...course, thumbnail: e.target.value })}
                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl p-3.5 text-white font-bold focus:border-[#FF6500] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-[#FF6500] hover:from-orange-600 hover:to-orange-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Course Settings</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: CHAPTER VIDEOS & PDFS */}
        {activeSubTab === 'curriculum' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left 4 Cols: Chapters List Sidebar */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-slate-900/60 rounded-3xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-black text-white">Chapters ({course.chapters?.length || 0})</h4>
                </div>

                {/* Add Chapter Form */}
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Enter chapter title (e.g. Chapter 2: Polynomials)"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold focus:outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={handleAddChapter}
                    className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Chapter</span>
                  </button>
                </div>

                {/* Chapters Nav List */}
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 pt-2">
                  {course.chapters && course.chapters.length > 0 ? (
                    course.chapters.map(ch => (
                      <button
                        key={ch.id}
                        onClick={() => setSelectedChapterId(ch.id)}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                          selectedChapterId === ch.id
                            ? 'bg-sky-500/20 border-sky-500 text-white font-black'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 font-bold hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate text-xs">{ch.title}</span>
                        <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-md font-mono text-slate-400">
                          {(ch.videos?.length || 0) + (ch.pdfs?.length || 0)} items
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic p-2 text-center">No chapters created yet. Use the form above to add your first chapter.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right 8 Cols: Selected Chapter Workspace */}
            <div className="lg:col-span-8 space-y-6">
              {selectedChapterId ? (
                (() => {
                  const currentCh = (course.chapters || []).find(c => c.id === selectedChapterId);
                  if (!currentCh) return <div className="text-xs text-slate-400 p-4">Select a chapter from the left to manage content.</div>;

                  return (
                    <div className="bg-slate-900/60 rounded-3xl p-6 border border-slate-800 space-y-6">
                      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                        <h3 className="text-base font-black text-white">{currentCh.title}</h3>
                        <span className="text-xs font-black text-sky-400 bg-sky-950 px-3 py-1 rounded-full border border-sky-800">
                          Chapter Workspace
                        </span>
                      </div>

                      {/* 1. Add Video Lecture Box */}
                      <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/60 space-y-3">
                        <div className="text-xs font-black text-white flex items-center gap-2">
                          <Video className="w-4 h-4 text-sky-400" />
                          <span>Add Video Lecture to {currentCh.title}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder="Lecture Title (e.g. Lecture 1: Concept & Theorem)"
                            value={newVideoTitle}
                            onChange={(e) => setNewVideoTitle(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold"
                          />
                          <input
                            type="text"
                            placeholder="YouTube or MP4 URL"
                            value={newVideoUrl}
                            onChange={(e) => setNewVideoUrl(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold"
                          />
                          <button
                            onClick={() => handleAddVideoToChapter(currentCh.id)}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Video</span>
                          </button>
                        </div>
                      </div>

                      {/* 2. Add PDF Notes Box */}
                      <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/60 space-y-3">
                        <div className="text-xs font-black text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-400" />
                          <span>Add PDF Formula Sheet to {currentCh.title}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder="PDF Title (e.g. NCERT Formula Sheet PDF)"
                            value={newPdfTitle}
                            onChange={(e) => setNewPdfTitle(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold"
                          />
                          <input
                            type="text"
                            placeholder="PDF Document URL"
                            value={newPdfUrl}
                            onChange={(e) => setNewPdfUrl(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold"
                          />
                          <button
                            onClick={() => handleAddPdfToChapter(currentCh.id)}
                            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add PDF Note</span>
                          </button>
                        </div>
                      </div>

                      {/* Content Items List */}
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">Current Chapter Content</h4>
                        
                        {/* Videos */}
                        {currentCh.videos && currentCh.videos.length > 0 && (
                          <div className="space-y-2">
                            {currentCh.videos.map(v => (
                              <div key={v.id} className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3">
                                  <Video className="w-4 h-4 text-sky-400 shrink-0" />
                                  <div>
                                    <div className="font-black text-white">{v.title}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">{v.duration || '20 Mins'} • Video Lecture</div>
                                  </div>
                                </div>
                                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-md text-[10px] font-black">ACTIVE</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* PDFs */}
                        {currentCh.pdfs && currentCh.pdfs.length > 0 && (
                          <div className="space-y-2">
                            {currentCh.pdfs.map(p => (
                              <div key={p.id} className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                                  <div>
                                    <div className="font-black text-white">{p.title}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">PDF Document Sheet</div>
                                  </div>
                                </div>
                                <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 rounded-md text-[10px] font-black">PDF READY</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {(!currentCh.videos || currentCh.videos.length === 0) && (!currentCh.pdfs || currentCh.pdfs.length === 0) && (
                          <p className="text-xs text-slate-500 italic p-3 text-center bg-slate-800/40 rounded-xl">No video lectures or PDFs added to this chapter yet.</p>
                        )}
                      </div>

                    </div>
                  );
                })()
              ) : (
                <div className="bg-slate-900/60 rounded-3xl p-8 border border-slate-800 text-center text-xs text-slate-400">
                  Select a chapter from the left menu to manage its videos and PDF notes.
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: ATTACH TEST SERIES & QUIZZES */}
        {activeSubTab === 'quizzes' && (
          <div className="bg-slate-900/60 rounded-3xl p-6 border border-slate-800 space-y-6">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>Link Platform Quizzes & Test Series to this Course</span>
            </h3>

            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Below are all online timed quizzes created on the platform. Click <strong>"Link to Course"</strong> to attach any quiz series directly to the chapters of <strong>{course.title}</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {availableQuizzes.length > 0 ? (
                availableQuizzes.map(quiz => (
                  <div key={quiz.id} className="p-4 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-between text-xs space-y-1">
                    <div>
                      <div className="font-black text-white text-sm">{quiz.title}</div>
                      <div className="text-[11px] text-slate-400 font-extrabold flex items-center gap-3 mt-1">
                        <span>{quiz.questions?.length || quiz.questionsCount || 10} Questions</span>
                        <span>•</span>
                        <span>{quiz.timeLimitMinutes || quiz.durationMinutes || 30} Mins</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const firstChId = course.chapters && course.chapters.length > 0 ? course.chapters[0].id : null;
                        if (firstChId) {
                          handleLinkQuizToChapter(firstChId, quiz);
                          setMessage({ type: 'success', text: `🎉 Linked '${quiz.title}' to ${course.title}!` });
                        } else {
                          setMessage({ type: 'error', text: 'Please create at least 1 chapter before linking a quiz.' });
                        }
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      Link to Course
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center text-slate-500 text-xs italic py-6">
                  No online tests found. Create test series in the Doubts & Quizzes section to link them here.
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
