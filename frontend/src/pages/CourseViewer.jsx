import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  PlayCircle, 
  FileText, 
  Award, 
  ChevronRight, 
  ChevronDown, 
  CheckCircle2, 
  Lock, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';

export default function CourseViewer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openChapters, setOpenChapters] = useState({});

  useEffect(() => {
    fetchCourseContent();
  }, [id]);

  const fetchCourseContent = async () => {
    try {
      const res = await axios.get(`/api/courses/${id}`);
      if (res.data.success) {
        setCourse(res.data.course);
        // Default open first chapter and set active first item
        if (res.data.course.chapters?.length > 0) {
          const firstCh = res.data.course.chapters[0];
          setOpenChapters({ [firstCh.id]: true });
          if (firstCh.contents?.length > 0) {
            setActiveItem(firstCh.contents[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load course viewer:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleChapter = (chId) => {
    setOpenChapters(prev => ({ ...prev, [chId]: !prev[chId] }));
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading course player...</div>;
  if (!course) return <div className="text-center py-20 text-slate-400">Course content unavailable.</div>;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      
      {/* Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/my-courses')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Courses
          </button>
          <div className="truncate">
            <h1 className="text-sm sm:text-base font-extrabold text-white truncate">{course.title}</h1>
            <p className="text-xs text-lime-400 font-medium">Manika Ma'am Learning Environment</p>
          </div>
        </div>
      </div>

      {/* Main Learning Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left Sidebar Chapter Accordion */}
        <div className="lg:col-span-4 bg-slate-900/90 border-r border-slate-800 p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-80px)]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">Table of Contents</h3>

          {course.chapters?.map((chapter, idx) => (
            <div key={chapter.id} className="rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden">
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="w-full p-3 text-left font-bold text-xs text-orange-400 flex items-center justify-between bg-slate-900/50 hover:bg-slate-900"
              >
                <span>{chapter.title}</span>
                {openChapters[chapter.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {openChapters[chapter.id] && (
                <div className="p-2 space-y-1 bg-slate-950">
                  
                  {/* Videos & PDFs */}
                  {chapter.contents?.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveItem(item)}
                      className={`w-full p-2.5 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-all ${
                        activeItem?.id === item.id 
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' 
                          : 'text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {item.type === 'VIDEO' ? <PlayCircle className="w-4 h-4 text-lime-400 shrink-0" /> : <FileText className="w-4 h-4 text-amber-400 shrink-0" />}
                        <span className="truncate">{item.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{item.duration}</span>
                    </button>
                  ))}

                  {/* MCQ Tests */}
                  {chapter.tests?.map(test => (
                    <button
                      key={test.id}
                      onClick={() => navigate(`/test/${test.id}`)}
                      className="w-full p-2.5 rounded-lg text-left text-xs font-bold text-lime-300 bg-lime-500/10 hover:bg-lime-500/20 border border-lime-500/30 flex items-center justify-between transition-all mt-2"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Award className="w-4 h-4 text-lime-400 shrink-0" />
                        <span className="truncate">{test.title}</span>
                      </div>
                      <span className="text-[10px] bg-lime-500 text-slate-950 px-1.5 py-0.5 rounded font-black">START TEST</span>
                    </button>
                  ))}

                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Stage Display Player */}
        <div className="lg:col-span-8 p-6 overflow-y-auto flex flex-col items-center justify-center">
          
          {activeItem ? (
            <div className="w-full max-w-4xl space-y-6">
              
              {/* Media Viewport */}
              <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center">
                {activeItem.type === 'VIDEO' ? (
                  <iframe
                    src={activeItem.url}
                    title={activeItem.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="text-center p-8 space-y-4">
                    <FileText className="w-16 h-16 text-amber-400 mx-auto" />
                    <h3 className="text-lg font-bold text-white">{activeItem.title}</h3>
                    <p className="text-xs text-slate-400">Handcrafted Study Material PDF by Manika Ma'am</p>
                    <a
                      href={activeItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-orange-500 to-lime-600"
                    >
                      Download PDF Notes
                    </a>
                  </div>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-lime-400">{activeItem.type} CONTENT</span>
                  <span className="text-xs text-slate-400">{activeItem.duration}</span>
                </div>
                <h2 className="text-xl font-extrabold text-white">{activeItem.title}</h2>
              </div>

            </div>
          ) : (
            <div className="text-center text-slate-400 space-y-3">
              <Sparkles className="w-12 h-12 text-orange-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Select a video or note from the chapter menu</h3>
              <p className="text-xs text-slate-500">Or launch one of the chapterwise MCQ practice tests.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
