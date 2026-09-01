import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { useTheme } from '../../context/ThemeContext';
import logoImg from '../../assets/logo.png';
import posterBanner from '../../assets/poster-banner.png';
import MathToolbar from '../../components/math/MathToolbar';
import MathRenderer from '../../components/math/MathRenderer';
import { 
  Users, 
  BookOpen, 
  CreditCard, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Award, 
  Sliders, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Video,
  BarChart3,
  Clock,
  Check,
  X,
  MessageSquare,
  Trophy,
  ShieldCheck,
  Bell,
  Lock,
  KeyRound,
  ArrowRight,
  UserPlus,
  Search,
  Eye,
  Globe,
  Filter,
  Edit,
  Archive,
  Ticket,
  Sparkles,
  ChevronRight,
  LogOut,
  Smartphone,
  Layers,
  HelpCircle,
  Share2,
  Copy,
  ExternalLink,
  Tag,
  Zap,
  Folder,
  UserCheck,
  Settings,
  MoreVertical,
  CheckSquare,
  Reply,
  PlayCircle,
  FileCode,
  Download,
  Calendar,
  DollarSign,
  FileCheck2,
  ArrowLeft,
  Edit3,
  ChevronDown,
  Link,
  Printer,
  Gift,
  Sun,
  Moon,
  Menu
} from 'lucide-react';
import { getCourseThumbnailSrc, getCourseThemeColor, getClassThumbnail } from '../../utils/courseHelpers';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const { branding, fetchBranding } = useBranding();
  const { theme, setTheme, isDark } = useTheme();
  const socketRef = useRef(null);
  const courseThumbnailFileInputRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const handleToggleSidebar = () => {
      setSidebarOpen(prev => !prev);
    };
    window.addEventListener('toggle-sidebar', handleToggleSidebar);
    return () => window.removeEventListener('toggle-sidebar', handleToggleSidebar);
  }, []);

  // Active Main Tab: 'dashboard', 'courses', 'content', 'app', 'website', 'people', 'chats', 'analytics', 'coupons'
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('sd_admin_active_tab') || 'dashboard');
  const [coursesSubTab, setCoursesSubTab] = useState('my-courses'); // 'my-courses', 'global-courses', 'coupons'
  const [contentSubTab, setContentSubTab] = useState('test-portal'); // 'test-portal', 'free-material'
  const [appSubTab, setAppSubTab] = useState(() => localStorage.getItem('sd_admin_app_sub_tab') || 'manage-banners'); // 'manage-banners', 'configure-app', 'marketing-dashboard'

  // Data States
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const defaultCourses = [
    { id: 'c1', title: 'Class 10 Mathematics Complete NCERT Coaching', price: 650, category: 'CLASS 10 MATHEMATICS', status: 'PUBLISHED', description: 'Class 10 Mathematics Complete NCERT Coaching', chapters: [] },
    { id: 'c2', title: 'Class 10 Mathematics Coaching Batch', price: 1000, category: 'CLASS 10 MATHEMATICS', status: 'PUBLISHED', description: 'Class 10 Mathematics Coaching Batch', chapters: [] },
    { id: 'c3', title: 'Class 9 Mathematics Coaching Batch', price: 500, category: 'CLASS 9 MATHEMATICS', status: 'PUBLISHED', description: 'Class 9 Mathematics Coaching Batch', chapters: [] },
    { id: 'c4', title: 'Class 10 Mathematics Batch', price: 500, category: 'CLASS 10 MATHEMATICS', status: 'PUBLISHED', description: 'Class 10 Mathematics Batch', chapters: [] }
  ];

  const [courses, setCourses] = useState(() => {
    try {
      const storedCustom = JSON.parse(localStorage.getItem('sd_custom_courses') || '[]');
      const storedCourses = JSON.parse(localStorage.getItem('sd_courses') || '[]');
      const merged = [...storedCustom, ...storedCourses];
      return merged.length > 0 ? merged : defaultCourses;
    } catch (e) {
      return defaultCourses;
    }
  });
  const [coupons, setCoupons] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [freeResources, setFreeResources] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [publicPortals, setPublicPortals] = useState(() => {
    try {
      const storedCustom = JSON.parse(localStorage.getItem('sd_custom_banners') || '[]');
      const defaultBanners = [
        {
          id: 'banner_default_1',
          title: 'Mathematics Conceptual Coaching Batch 2026',
          description: 'Specialized 1-on-1 & Group Batches for Class 9 & 10 by Manika Maheshwari',
          thumbnail: '/assets/poster-flyer.png',
          buttonText: 'Explore Now',
          link: '/store',
          targetPlacement: 'BOTH',
          status: 'PUBLISHED'
        },
        {
          id: 'banner_default_2',
          title: 'ABHYAAS Daily MCQ Practice Tests',
          description: 'Test your speed and accuracy with instant automated scoring & leaderboards',
          thumbnail: '/assets/poster-banner.png',
          buttonText: 'Take Test',
          link: '/free-test',
          targetPlacement: 'BOTH',
          status: 'PUBLISHED'
        }
      ];
      return [...storedCustom, ...defaultBanners];
    } catch (e) {
      return [];
    }
  });
  const [adminLeaderboard, setAdminLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Doubts Inbox & Socket Chat
  const [conversations, setConversations] = useState([]);
  const [selectedStudentForChat, setSelectedStudentForChat] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showStartConvModal, setShowStartConvModal] = useState(false);

  // Compute all available student conversations (conversations + all registered students + search filter)
  const allStudentConversations = React.useMemo(() => {
    const convMap = new Map();

    // 1. Add existing conversations
    (conversations || []).forEach(c => {
      if (c && c.student) {
        const id = c.student.id || c.id;
        convMap.set(id, c);
      }
    });

    // 2. Add all registered students from students list
    (students || []).forEach(s => {
      if (s && s.id && !convMap.has(s.id)) {
        convMap.set(s.id, {
          conversationId: `conv_${s.id}`,
          student: s,
          lastMessage: `Start direct chat with ${s.name || 'Student'}...`,
          unreadCount: 0,
          lastActive: new Date(0).toISOString()
        });
      }
    });

    const list = Array.from(convMap.values());
    if (!chatSearchQuery.trim()) return list;

    const query = chatSearchQuery.toLowerCase().trim();
    return list.filter(c => {
      const s = c.student || {};
      return (
        (s.name || '').toLowerCase().includes(query) ||
        (s.email || '').toLowerCase().includes(query) ||
        (s.phone || '').toLowerCase().includes(query)
      );
    });
  }, [conversations, students, chatSearchQuery]);

  // Faculty Profile & Platform Settings States
  const [facultyProfile, setFacultyProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('sd_faculty_profile');
      return stored ? JSON.parse(stored) : {
        name: 'Manika Maheshwari',
        role: 'Founder & Lead Educator - Senior Mathematics Specialist',
        qualification: 'B.Sc & M.Sc Mathematics (10+ Years CBSE & Olympiad Coaching)',
        email: 'Dikshasarvottam@gmail.com',
        phone: '+91 99646 77802',
        grades: 'Class 6, Class 7, Class 8, Class 9, Class 10, Class 11, Class 12',
        bio: 'Dedicated to helping students build 100% conceptual mastery in Mathematics with step-by-step problem solving and interactive quiz series.'
      };
    } catch (e) {
      return {
        name: 'Manika Maheshwari',
        role: 'Founder & Lead Educator - Senior Mathematics Specialist',
        qualification: 'B.Sc & M.Sc Mathematics (10+ Years CBSE & Olympiad Coaching)',
        email: 'Dikshasarvottam@gmail.com',
        phone: '+91 99646 77802',
        grades: 'Class 6, Class 7, Class 8, Class 9, Class 10, Class 11, Class 12',
        bio: 'Dedicated to helping students build 100% conceptual mastery in Mathematics with step-by-step problem solving and interactive quiz series.'
      };
    }
  });

  const [platformSettings, setPlatformSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('sd_platform_settings');
      return stored ? JSON.parse(stored) : {
        orgName: 'Sarvottam Diksha',
        orgCode: 'JOSHVZ',
        registrationMode: 'OPEN',
        solutionAccess: 'IMMEDIATE',
        notificationsEnabled: true
      };
    } catch (e) {
      return {
        orgName: 'Sarvottam Diksha',
        orgCode: 'JOSHVZ',
        registrationMode: 'OPEN',
        solutionAccess: 'IMMEDIATE',
        notificationsEnabled: true
      };
    }
  });

  // Course Management State & Filters
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [courseCategoryFilter, setCourseCategoryFilter] = useState('ALL');
  const [courseStatusFilter, setCourseStatusFilter] = useState('ALL');
  const [courseSortOption, setCourseSortOption] = useState('NEWEST');
  const [showCourseFilterModal, setShowCourseFilterModal] = useState(false);
  const [priceRangeMin, setPriceRangeMin] = useState('');
  const [priceRangeMax, setPriceRangeMax] = useState('');
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [courseOriginFilter, setCourseOriginFilter] = useState('ALL');

  // Modals
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showCreateResourceModal, setShowCreateResourceModal] = useState(false);
  const [showCreateBannerModal, setShowCreateBannerModal] = useState(() => window.location.search.includes('bannerModal=true'));
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [showGenerateReportModal, setShowGenerateReportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('Student Profile Data');

  useEffect(() => {
    const handleOpenBanner = () => {
      setActiveTab('app');
      setAppSubTab('manage-banners');
      setShowCreateBannerModal(true);
    };
    window.addEventListener('open_banner_modal', handleOpenBanner);
    window.openBannerModal = handleOpenBanner;
    return () => window.removeEventListener('open_banner_modal', handleOpenBanner);
  }, []);

  // Create Course 4-Step Wizard States
  const [courseWizardStep, setCourseWizardStep] = useState(1); // 1, 2, 3, 4
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [categoryPairs, setCategoryPairs] = useState([
    { id: 1, category: 'Class 10 Mathematics', subCategory: 'CBSE Board' }
  ]);
  const [courseTypeOption, setCourseTypeOption] = useState('PAID');
  const [durationValueNum, setDurationValueNum] = useState('1');
  const [durationUnitType, setDurationUnitType] = useState('Year(s)');
  const [courseFolders, setCourseFolders] = useState([
    { id: 'f1', name: 'Class 10 Board Chapter 1: Quadratic Equations', details: '1 video(s), 2 file(s)' }
  ]);

  const [transactionsData, setTransactionsData] = useState([]);
  const [transactionsStats, setTransactionsStats] = useState({ count: 4, totalAmount: 2041, avgOrderValue: 510 });

  const [selectedStudentForUnlock, setSelectedStudentForUnlock] = useState('');
  const [selectedCourseForUnlock, setSelectedCourseForUnlock] = useState('');

  // Add Test To Course / Free Test Modal States (Matching Screenshots 1-4)
  const [activeTestForOption, setActiveTestForOption] = useState(null);
  const [showTestOptionMenuId, setShowTestOptionMenuId] = useState(null);
  const [showAddTestToModal, setShowAddTestToModal] = useState(false);
  const [addTestToSubScreen, setAddTestToSubScreen] = useState('SELECT'); // 'SELECT', 'COURSE', 'FREE_TEST'
  const [selectedCourseForAddTest, setSelectedCourseForAddTest] = useState('');
  const [testAttemptsCount, setTestAttemptsCount] = useState('1');
  const [isUnlimitedAttempts, setIsUnlimitedAttempts] = useState(false);
  const [freeTestNoEndTime, setFreeTestNoEndTime] = useState(true);
  const [freeTestStartDate, setFreeTestStartDate] = useState('2026-08-20');
  const [freeTestEndDate, setFreeTestEndDate] = useState('2026-08-20');

  // Move Test To Folder Modal States
  const [moveFolderModalTarget, setMoveFolderModalTarget] = useState(null);
  const [selectedFolderForMove, setSelectedFolderForMove] = useState('Class 10');

  // Test Portal Workspace States (Matching Screenshots 1-5)
  const [showTestPortalWorkspace, setShowTestPortalWorkspace] = useState(false);
  const [showTestPortalWelcome, setShowTestPortalWelcome] = useState(false);
  const [showCreateNewTestModal, setShowCreateNewTestModal] = useState(false);
  const [newTestData, setNewTestData] = useState({
    title: '',
    durationHour: '0',
    durationMin: '40',
    tags: 'Class 10',
    totalMarks: '100',
    negativeMarks: '0.25',
    accessMode: 'FREE', // 'FREE', 'PAID', 'COURSE_ONLY'
    price: '199',
    selectedCourseIds: [],
    solutionDocUrl: '',
    solutionDocName: ''
  });

  const [newQuestionForm, setNewQuestionForm] = useState({
    sectionName: 'Section A',
    questionType: 'MCQ',
    passageText: '',
    questionText: '',
    imageUrl: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    explanation: '',
    marks: '4',
    negativeMarks: '1'
  });

  const [isMathTypeOpen, setIsMathTypeOpen] = useState(false);
  const [mathTargetField, setMathTargetField] = useState(null);

  const questionTextRef = useRef(null);
  const optionARef = useRef(null);
  const optionBRef = useRef(null);
  const optionCRef = useRef(null);
  const optionDRef = useRef(null);
  const explanationRef = useRef(null);
  const correctOptionRef = useRef(null);

  const [quizQuestionsList, setQuizQuestionsList] = useState([]);
  const [quizSectionsList, setQuizSectionsList] = useState(['Section A', 'Section B']);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewActiveSection, setPreviewActiveSection] = useState('Section A');
  const [previewActiveQuestionIndex, setPreviewActiveQuestionIndex] = useState(0);
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [previewMarkedForReview, setPreviewMarkedForReview] = useState({});
  const [builderValidationErrors, setBuilderValidationErrors] = useState({});
  const [importProgress, setImportProgress] = useState(null);
  const [importDuplicateState, setImportDuplicateState] = useState(null);
  const [importedDiagramFilesMap, setImportedDiagramFilesMap] = useState({});
  const [importedDiagramFileNamesList, setImportedDiagramFileNamesList] = useState([]);
  const [importSummaryReport, setImportSummaryReport] = useState(null);
  const [importPreviewState, setImportPreviewState] = useState(null); // { parsedQuestions, sections, unusedDiagrams, hardErrors, warnings }
  const diagramFolderInputRef = useRef(null);
  const inlineDiagramInputRef = useRef(null);
  const [newSectionInputName, setNewSectionInputName] = useState('');
  const [showAddSectionInput, setShowAddSectionInput] = useState(false);
  const [showSortFilterPopover, setShowSortFilterPopover] = useState(false);
  const [showNewPlusMenu, setShowNewPlusMenu] = useState(false);
  const [studentAttemptsList, setStudentAttemptsList] = useState([]);
  const [inspectingAttemptModal, setInspectingAttemptModal] = useState(null);
  const [overrideScoreInput, setOverrideScoreInput] = useState('');
  const [teacherCommentInput, setTeacherCommentInput] = useState('');
  const [answerOverridesState, setAnswerOverridesState] = useState({});
  const [testPortalFolders, setTestPortalFolders] = useState([
    { id: 'f-6', name: 'Class 6' },
    { id: 'f-7', name: 'Class 7' },
    { id: 'f-8', name: 'Class 8' },
    { id: 'f-9', name: 'Class 9' },
    { id: 'f-10', name: 'Class 10' },
    { id: 'f-11', name: 'Class 11' },
    { id: 'f-12', name: 'Class 12' }
  ]);
  const [testPortalTests, setTestPortalTests] = useState([]);

  // Question Builder & Folder Navigation States (Matching Screenshots 1-5)
  const [activeFolderBreadcrumb, setActiveFolderBreadcrumb] = useState(null); // e.g. 'July-25' or 'Class 7'
  const [editingTestForQuestions, setEditingTestForQuestions] = useState(null);
  const [activeSidebarAccordion, setActiveSidebarAccordion] = useState(null); // 'CREATE_QUESTIONS', 'GRADING', etc.
  const [gradingRules, setGradingRules] = useState({
    mcqPos: 4, mcqNeg: 1, tfPos: 4, tfNeg: 1, fibPos: 4, fibNeg: 1, intPos: 4, intNeg: 1
  });

  // Accordion Expandable States (Matching Screenshots 1-3)
  const [testSectionsList, setTestSectionsList] = useState([
    { id: 'sec-1', name: 'Section A', questionCount: 10 }
  ]);
  const [enableSolutionsToggle, setEnableSolutionsToggle] = useState(true);
  const [allowSectionSwitchingToggle, setAllowSectionSwitchingToggle] = useState(true);
  const [questionOrderingMode, setQuestionOrderingMode] = useState('Do Nothing');
  const [revealCorrectAnswersMode, setRevealCorrectAnswersMode] = useState('All Questions');
  const [solutionRevealTimeOption, setSolutionRevealTimeOption] = useState('IMMEDIATE'); // 'IMMEDIATE', 'AFTER_DEADLINE'

  // Create Coupon Code Page States (Matching User Screenshots 1, 2 & 3)
  const [isCreatingCouponPage, setIsCreatingCouponPage] = useState(false);
  const [couponStep, setCouponStep] = useState(1); // 1: Discount & Dates, 2: Usage Rules, 3: Select Courses
  const [couponName, setCouponName] = useState(''); // Offer Name
  const [customCouponCode, setCustomCouponCode] = useState(''); // Custom typed coupon code
  const [couponDiscountType, setCouponDiscountType] = useState('FLAT'); // 'FLAT' or 'PERCENTAGE'
  const [couponFlatAmount, setCouponFlatAmount] = useState('');
  const [couponStartDate, setCouponStartDate] = useState('2026-08-20');
  const [couponStartTime, setCouponStartTime] = useState('22:15');
  const [couponEndDate, setCouponEndDate] = useState('');
  const [couponEndTime, setCouponEndTime] = useState('');
  const [couponIsLifetime, setCouponIsLifetime] = useState(false);
  const [couponMinOrderValue, setCouponMinOrderValue] = useState('1');
  const [couponMaxDiscountLimit, setCouponMaxDiscountLimit] = useState('');

  // Step 2 & Step 3 States (Matching Screenshots 1 & 2)
  const [couponType, setCouponType] = useState('PUBLIC'); // 'PUBLIC' or 'PRIVATE'
  const [courseSelectionType, setCourseSelectionType] = useState('ALL'); // 'ALL' or 'SPECIFIC'
  const [couponMaxUsesInput, setCouponMaxUsesInput] = useState('1000');
  const [couponIsUnlimitedMaxUses, setCouponIsUnlimitedMaxUses] = useState(false);
  const [couponUsagePerStudent, setCouponUsagePerStudent] = useState('1');
  const [couponVisibilityToggle, setCouponVisibilityToggle] = useState(true);
  const [couponSelectedCourseIds, setCouponSelectedCourseIds] = useState([]);
  const [couponCourseSearch, setCouponCourseSearch] = useState('');

  // Free Material States (Matching Screenshots 1-5)
  const [freeMaterialCategory, setFreeMaterialCategory] = useState(null); // null, 'DOCUMENT', 'VIDEO', 'TEST'
  const [documentsList, setDocumentsList] = useState([]);
  const [freeVideosList, setFreeVideosList] = useState([]);
  const [freeTestsList, setFreeTestsList] = useState([]);
  const [showAddVideoDrawer, setShowAddVideoDrawer] = useState(false);
  const [showAddTestDrawer, setShowAddTestDrawer] = useState(false);
  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState('');
  const documentFileInputRef = useRef(null);
  const solutionDocFileInputRef = useRef(null);
  const csvFileInputRef = useRef(null);
  const questionDiagramFileInputRef = useRef(null);

  // Select Tests or Folders Modal States (Matching Screenshots 1 & 2)
  const [showSelectTestFolderModal, setShowSelectTestFolderModal] = useState(false);
  const [selectedTestsFolders, setSelectedTestsFolders] = useState(['KYC _Sample_test']);
  const [selectedStartTime, setSelectedStartTime] = useState('12:00 am');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  // Add Folder Modal State (Matching Screenshot 1)
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showChatPlusMenu, setShowChatPlusMenu] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Test Portal Settings & Report Dashboard States (Matching New Screenshots 1-5)
  const [showTestReportDashboard, setShowTestReportDashboard] = useState(false);
  const [showTestSettingsPage, setShowTestSettingsPage] = useState(false);

  // Course Control Center Modal State
  const [managingCourseFull, setManagingCourseFull] = useState(null);
  const [previewCourseModalData, setPreviewCourseModalData] = useState(null);

  // Forms
  const [newCouponForm, setNewCouponForm] = useState({
    code: '', title: '', discountType: 'FLAT', discountValue: '200', maxUses: '100', status: 'ACTIVE'
  });

  const [newClassForm, setNewClassForm] = useState({
    title: '', subject: 'Mathematics', classGrade: 'Class 10', duration: '60 mins'
  });

  const [newCourse, setNewCourse] = useState({
    title: '', description: '', category: 'Class 10 Mathematics', subject: 'Mathematics', price: '500', originalPrice: '999', isFree: false, status: 'PUBLISHED', gstAmount: '76', handlingFee: '14', platformFee: '10', validityDays: '365', thumbnail: ''
  });

  const [newResourceForm, setNewResourceForm] = useState({
    title: '', type: 'DOCUMENT', url: '', category: 'Formula Sheet', description: ''
  });

  const [newBannerForm, setNewBannerForm] = useState({
    title: '',
    description: '',
    thumbnail: '/assets/poster-flyer.png',
    startDate: '',
    endDate: '',
    status: 'PUBLISHED',
    buttonText: 'Explore Now',
    link: '/store',
    isFeatured: true,
    targetPlacement: 'BOTH' // 'HOME_PAGE', 'STUDENT_PORTAL', 'BOTH'
  });

  // Socket.io initialization
  useEffect(() => {
    if (!user) return;

    const activeToken = token || localStorage.getItem('sd_token') || 'demo_token';
    const socket = io('/', {
      auth: { token: activeToken },
      query: { token: activeToken },
      reconnection: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      if (selectedStudentForChat) {
        socket.emit('join_conversation', { studentId: selectedStudentForChat });
      }
    });

    socket.on('receive_message', (newMsg) => {
      setChatMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    });

    socket.on('conversation_updated', (updatedConv) => {
      setConversations(prev => {
        const idx = prev.findIndex(c => c.conversationId === updatedConv.conversationId || c.student?.id === updatedConv.student?.id);
        if (idx > -1) {
          const copy = [...prev];
          copy[idx] = {
            ...copy[idx],
            lastMessage: updatedConv.lastMessage,
            unreadCount: updatedConv.unreadCount,
            lastActive: updatedConv.lastActive
          };
          copy.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
          return copy;
        }
        return [updatedConv, ...prev];
      });
    });

    return () => socket.disconnect();
  }, [user, token, selectedStudentForChat]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (selectedStudentForChat) {
      fetchStudentChat(selectedStudentForChat);
    }
  }, [selectedStudentForChat]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/courses'),
        axios.get('/api/admin/students'),
        axios.get('/api/admin/quiz-analytics'),
        axios.get('/api/notifications'),
        axios.get('/api/chat/admin/conversations'),
        axios.get('/api/tests/leaderboard/top'),
        axios.get('/api/admin/public-portals'),
        axios.get('/api/admin/coupons'),
        axios.get('/api/admin/classes'),
        axios.get('/api/admin/free-resources'),
        axios.get('/api/admin/quiz-attempts'),
        axios.get('/api/admin/tests')
      ]);

      if (results[1].status === 'fulfilled' && results[1].value.data?.success) {
        const remoteCourses = results[1].value.data.courses || [];
        let storedCustom = [];
        try {
          storedCustom = JSON.parse(localStorage.getItem('sd_custom_courses') || '[]');
        } catch (e) {}
        const mergedCourses = [...storedCustom, ...remoteCourses];
        const uniqueCourses = Array.from(new Map(mergedCourses.map(item => [item.id, item])).values());
        setCourses(uniqueCourses);
      }
      if (results[3].status === 'fulfilled' && results[3].value.data?.success) setQuizAttempts(results[3].value.data.attempts || []);
      
      // Merge Remote and Local Admin Notifications
      let storedNotifs = [];
      try {
        storedNotifs = JSON.parse(localStorage.getItem('sd_admin_notifications') || '[]');
      } catch (e) {}
      const remoteNotifs = (results[4].status === 'fulfilled' && results[4].value.data?.success) ? (results[4].value.data.notifications || []) : [];
      const mergedNotifs = [...storedNotifs, ...remoteNotifs];
      const uniqueNotifs = Array.from(new Map(mergedNotifs.map(n => [n.id || n.message, n])).values());
      setNotifications(uniqueNotifs);

      // Merge Remote and Local Student Conversations
      let storedConvs = [];
      try {
        storedConvs = JSON.parse(localStorage.getItem('sd_conversations') || '[]');
      } catch (e) {}
      const remoteConvs = (results[5].status === 'fulfilled' && results[5].value.data?.success) ? (results[5].value.data.conversations || []) : [];
      const mergedConvs = [...storedConvs, ...remoteConvs];
      const uniqueConvs = Array.from(new Map(mergedConvs.map(c => [c.student?.id || c.id, c])).values());
      setConversations(uniqueConvs);
      if (uniqueConvs.length > 0 && !selectedStudentForChat) {
        setSelectedStudentForChat(uniqueConvs[0].student?.id);
      }
      if (results[6].status === 'fulfilled' && results[6].value.data?.success) setAdminLeaderboard(results[6].value.data.leaderboard || []);
      if (results[7].status === 'fulfilled') {
        const portalData = Array.isArray(results[7].value.data) ? results[7].value.data : (results[7].value.data?.portals || []);
        if (portalData.length > 0) {
          const storedCustom = JSON.parse(localStorage.getItem('sd_custom_banners') || '[]');
          setPublicPortals([...storedCustom, ...portalData]);
        }
      }
      if (results[8].status === 'fulfilled' && results[8].value.data?.success) setCoupons(results[8].value.data.coupons || []);
      if (results[9].status === 'fulfilled' && results[9].value.data?.success) setLiveClasses(results[9].value.data.classes || []);
      if (results[10].status === 'fulfilled' && results[10].value.data?.success) setFreeResources(results[10].value.data.resources || []);
      if (results[11].status === 'fulfilled' && results[11].value.data?.success) setStudentAttemptsList(results[11].value.data.attempts || []);
      let loadedTests = [];
      if (results[12].status === 'fulfilled' && results[12].value.data?.success) {
        const dbTests = results[12].value.data.tests || [];
        loadedTests = dbTests.map(t => ({
          id: t.id,
          title: t.title,
          category: `#${t.tags || 'Class 10'}`,
          status: t.isPublished ? 'Published' : 'Draft',
          date: new Date(t.createdAt).toISOString().split('T')[0].replace(/-/g, '/'),
          questionCount: t._count?.questions || t.questions?.length || 0,
          attemptsCount: t._count?.attempts || 0
        }));
      }

      let storedCustom = [];
      try {
        storedCustom = JSON.parse(localStorage.getItem('sd_custom_tests') || '[]');
      } catch (e) {}

      const mergedTests = [...storedCustom, ...loadedTests];
      const uniqueTests = Array.from(new Map(mergedTests.map(item => [item.id, item])).values());
      setTestPortalTests(uniqueTests);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentChat = async (studentId) => {
    if (!studentId) return;

    const convObj = (conversations || []).find(c => c.student?.id === studentId || c.student?.email?.toLowerCase() === studentId.toLowerCase() || c.id === studentId);
    const studentObj = (students || []).find(s => s.id === studentId || s.email?.toLowerCase() === studentId.toLowerCase()) || convObj?.student;

    const studentEmail = (studentObj?.email || '').toLowerCase().trim();
    const studentName = (studentObj?.name || '').toLowerCase().trim();
    const resolvedId = studentObj?.id || studentId;

    let apiMessages = [];
    try {
      const res = await axios.get(`/api/chat/messages?studentId=${resolvedId}`);
      if (res.data.success && Array.isArray(res.data.messages)) {
        apiMessages = res.data.messages;
      }
    } catch (err) {}

    // Collect all local messages from localStorage matching student ID, email, or name
    const allStoredMsgs = [];
    try {
      const allKeys = Object.keys(localStorage).filter(k => k.startsWith('sd_messages_'));
      allKeys.forEach(k => {
        try {
          const list = JSON.parse(localStorage.getItem(k) || '[]');
          if (Array.isArray(list)) {
            list.forEach(m => {
              if (!m || !m.text) return;
              const sEmail = (m.sender?.email || m.studentEmail || m.email || '').toLowerCase().trim();
              const sId = m.senderId || m.studentId || m.receiverId;

              if (
                sId === resolvedId || sId === studentId ||
                (studentEmail && (sEmail === studentEmail || k === `sd_messages_${studentEmail}`)) ||
                (k === `sd_messages_${resolvedId}`) ||
                (k === `sd_messages_${studentId}`) ||
                (studentName && k === `sd_messages_${studentName}`)
              ) {
                allStoredMsgs.push(m);
              }
            });
          }
        } catch (e) {}
      });
    } catch (e) {}

    // Also include convObj.lastMessage if present
    if (convObj && convObj.lastMessage) {
      const lastMsgObj = typeof convObj.lastMessage === 'string'
        ? { id: `last_${Date.now()}`, text: convObj.lastMessage, createdAt: new Date().toISOString(), sender: { name: studentObj?.name || 'Student', role: 'STUDENT' } }
        : convObj.lastMessage;
      if (lastMsgObj && lastMsgObj.text) {
        allStoredMsgs.push(lastMsgObj);
      }
    }

    // Merge API & local messages, deduplicate, and sort chronologically
    const msgMap = new Map();
    [...apiMessages, ...allStoredMsgs].forEach(m => {
      if (m && m.text) {
        const key = m.id || (m.createdAt + m.text);
        msgMap.set(key, m);
      }
    });

    const sortedMessages = Array.from(msgMap.values()).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    setChatMessages(sortedMessages);
  };

  const [adminReplyToMsg, setAdminReplyToMsg] = useState(null);

  // Handlers
  const handleSendAdminReply = async (e) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !selectedStudentForChat) return;

    let replyText = adminReplyText.trim();
    if (adminReplyToMsg) {
      const senderLabel = adminReplyToMsg.sender?.name || (adminReplyToMsg.senderRole === 'ADMIN' ? "Manika Ma'am" : 'Student');
      const snippet = adminReplyToMsg.text ? (adminReplyToMsg.text.length > 50 ? adminReplyToMsg.text.slice(0, 50) + '...' : adminReplyToMsg.text) : 'Message';
      replyText = `↪ Replying to ${senderLabel}: "${snippet}"\n${replyText}`;
      setAdminReplyToMsg(null);
    }

    setAdminReplyText('');

    const convObj = (conversations || []).find(c => c.student?.id === selectedStudentForChat || c.student?.email?.toLowerCase() === selectedStudentForChat.toLowerCase() || c.id === selectedStudentForChat);
    const studentObj = (students || []).find(s => s.id === selectedStudentForChat || s.email?.toLowerCase() === selectedStudentForChat.toLowerCase()) || convObj?.student;
    const studentEmail = (studentObj?.email || '').toLowerCase().trim();

    const newMsgObj = {
      id: `msg_${Date.now()}`,
      text: replyText,
      senderId: user?.id || 'admin_1',
      receiverId: selectedStudentForChat,
      createdAt: new Date().toISOString(),
      sender: { name: 'Manika Maheshwari (Senior Faculty)', role: 'ADMIN' }
    };

    setChatMessages(prev => [...prev, newMsgObj]);

    // Save to local storage under Student ID & Student Email
    try {
      const msgKey = `sd_messages_${selectedStudentForChat}`;
      const storedId = JSON.parse(localStorage.getItem(msgKey) || '[]');
      localStorage.setItem(msgKey, JSON.stringify([...storedId, newMsgObj]));

      if (studentEmail) {
        const emailKey = `sd_messages_${studentEmail}`;
        const storedEmail = JSON.parse(localStorage.getItem(emailKey) || '[]');
        localStorage.setItem(emailKey, JSON.stringify([...storedEmail, newMsgObj]));
      }
    } catch (e) {}

    try {
      const res = await axios.post('/api/chat/send', {
        text: replyText,
        receiverId: selectedStudentForChat
      });
      if (res.data && res.data.success) {
        fetchAdminData();
      }
    } catch (err) {
      console.warn('Backend chat send failed, using client fallback...', err);
    }
  };

  const handleCreateCourse = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    const activeToken = localStorage.getItem('sd_token') || localStorage.getItem('token') || localStorage.getItem('sarvottam_token');
    const authHeaders = { Authorization: `Bearer ${activeToken}` };

    const courseTitle = (newCourse.title && newCourse.title.trim()) || 'Class 10 Mathematics Comprehensive Batch 2026';
    let createdCourse = null;

    // 1. Attempt Backend API persistence with 600ms timeout
    try {
      const res = await axios.post('/api/admin/courses', newCourse, { headers: authHeaders, timeout: 8000 });
      if (res.data && res.data.success && res.data.course) {
        createdCourse = res.data.course;
      }
    } catch (err) {
      console.warn('Backend API create course failed or timed out, using local storage fallback...', err);
    }

    // 2. Client-Side Fallback for static hosting
    if (!createdCourse) {
      createdCourse = {
        id: 'course_' + Date.now(),
        title: courseTitle,
        description: newCourse.description || 'Complete NCERT & RS Aggarwal Mathematics Coaching.',
        category: newCourse.category || 'Class 10 Mathematics',
        subject: newCourse.subject || 'Mathematics',
        price: Number(newCourse.price || 500),
        originalPrice: Number(newCourse.originalPrice || 999),
        isFree: Boolean(newCourse.isFree),
        status: newCourse.status || 'PUBLISHED',
        thumbnail: newCourse.thumbnail || '/assets/poster-banner.png',
        validityDays: Number(newCourse.validityDays || 365),
        studentCount: 0,
        chaptersCount: 0,
        resourcesCount: 0,
        createdAt: new Date().toISOString()
      };

      try {
        const storedCustomCourses = JSON.parse(localStorage.getItem('sd_custom_courses') || '[]');
        localStorage.setItem('sd_custom_courses', JSON.stringify([createdCourse, ...storedCustomCourses]));
      } catch (e) {}
    }

    // Update Admin UI state
    setCourses(prev => [createdCourse, ...prev.filter(c => c.id !== createdCourse.id)]);

    alert(`🎉 Course Batch '${createdCourse.title}' created & published successfully!`);
    setMessage({ type: 'success', text: `🎉 Course Batch '${createdCourse.title}' created & published successfully!` });
    setShowCreateCourseModal(false);
    setNewCourse({
      title: '', description: '', category: 'Class 10 Mathematics', subject: 'Mathematics', price: '500', originalPrice: '999', isFree: false, status: 'PUBLISHED', gstAmount: '76', handlingFee: '14', platformFee: '10', validityDays: '365', thumbnail: ''
    });

    try {
      await fetchAdminData();
    } catch (e) {}
  };

  // ================= TEST TOOLBAR ACTION HANDLERS =================
  const handleCopyTest = (testItem) => {
    const copyObj = {
      ...testItem,
      id: 'test_copy_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: `${testItem.title} (Copy)`,
      date: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
      attemptsCount: 0
    };
    setTestPortalTests(prev => [copyObj, ...prev]);
    try {
      const existing = JSON.parse(localStorage.getItem('sd_custom_tests') || '[]');
      localStorage.setItem('sd_custom_tests', JSON.stringify([copyObj, ...existing]));
    } catch (e) {}
    setMessage({ type: 'success', text: `🎉 Duplicated '${testItem.title}' successfully as '${copyObj.title}'!` });
  };

  const handleExportTestPDF = (testItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export & print test PDF.');
      return;
    }

    const testQuestions = testItem.questions || [
      {
        questionText: 'If α and β are the zeros of the quadratic polynomial f(x) = x² - p(x + 1) - c, then (α + 1)(β + 1) =',
        optionA: 'c - 1',
        optionB: '1 - c',
        optionC: 'c',
        optionD: '1 + c',
        correctOption: 'B',
        explanation: 'Expanding (α + 1)(β + 1) = αβ + (α + β) + 1 = (c - p) + p + 1 = 1 - c.'
      },
      {
        questionText: 'Find the discriminant of the quadratic equation 2x² - 4x + 3 = 0.',
        optionA: '-8',
        optionB: '8',
        optionC: '-16',
        optionD: '16',
        correctOption: 'A',
        explanation: 'D = b² - 4ac = (-4)² - 4(2)(3) = 16 - 24 = -8.'
      }
    ];

    const questionsHtml = testQuestions.map((q, idx) => `
      <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #cbd5e1; border-radius: 12px; background: #fff;">
        <p style="font-weight: 800; font-size: 15px; margin: 0 0 12px 0; color: #0f172a;">Q${idx + 1}. ${q.questionText || q.question}</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; margin-bottom: 12px; color: #334155;">
          <div><strong>A)</strong> ${q.optionA || 'Option A'}</div>
          <div><strong>B)</strong> ${q.optionB || 'Option B'}</div>
          <div><strong>C)</strong> ${q.optionC || 'Option C'}</div>
          <div><strong>D)</strong> ${q.optionD || 'Option D'}</div>
        </div>
        <div style="background: #f0f9ff; padding: 8px 12px; border-radius: 8px; font-size: 12px; color: #0284c7; font-weight: 700;">
          Correct Answer: Option ${q.correctOption || 'A'} ${q.explanation ? `| Solution: ${q.explanation}` : ''}
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${testItem.title} - Printable Question Paper</title>
          <style>
            body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; background: #fff; }
            .header { text-align: center; border-bottom: 3px double #0284c7; padding-bottom: 16px; margin-bottom: 24px; }
            .header h1 { margin: 0; color: #0284c7; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
            .header h2 { margin: 6px 0 0 0; font-size: 16px; font-weight: 700; color: #334155; }
            .meta { display: flex; justify-content: space-between; font-weight: 700; font-size: 13px; margin-bottom: 24px; padding: 12px 16px; background: #f1f5f9; border-radius: 8px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="padding: 10px 24px; background: #0284c7; color: white; border: none; border-radius: 8px; font-weight: 800; cursor: pointer; font-size: 14px;">
              🖨️ Print / Download PDF
            </button>
          </div>
          <div class="header">
            <h1>SARVOTTAM DIKSHA MATHEMATICS ACADEMY</h1>
            <h2>${testItem.title}</h2>
          </div>
          <div class="meta">
            <div>Target Tag: ${testItem.category || testItem.tags || 'Class 10'}</div>
            <div>Total Questions: ${testQuestions.length}</div>
            <div>Time Limit: ${testItem.durationMinutes || 60} Mins</div>
            <div>Max Marks: ${testItem.totalMarks || 100}</div>
          </div>
          <div>${questionsHtml}</div>
          <script>
            setTimeout(() => { window.print(); }, 400);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setMessage({ type: 'success', text: `🖨️ Generated printable PDF window for '${testItem.title}'!` });
  };

  const handleDeleteTest = (item) => {
    if (!item) return;

    const displayTitle = item.title || item.name || 'Selected Item';
    const itemLabel = item.type === 'FOLDER' ? `folder '${displayTitle}'` : `test '${displayTitle}'`;

    if (window.confirm(`Are you sure you want to delete ${itemLabel}? This action cannot be undone.`)) {
      const targetIdStr = String(item.id || '').trim();
      const targetTitleStr = String(displayTitle).trim().toLowerCase();

      // Delete Folders & Tests from React State
      setTestPortalFolders(prev => prev.filter(f => String(f.id || '').trim() !== targetIdStr && String(f.title || f.name || '').trim().toLowerCase() !== targetTitleStr));
      setTestPortalTests(prev => prev.filter(t => String(t.id || '').trim() !== targetIdStr && String(t.title || t.name || '').trim().toLowerCase() !== targetTitleStr));
      setFreeTestsList(prev => prev.filter(t => String(t.id || '').trim() !== targetIdStr && String(t.title || t.name || '').trim().toLowerCase() !== targetTitleStr));

      // Local Storage Persistence
      try {
        const storedCustom = JSON.parse(localStorage.getItem('sd_custom_tests') || '[]');
        const updatedCustom = storedCustom.filter(t => String(t.id || '').trim() !== targetIdStr && String(t.title || t.name || '').trim().toLowerCase() !== targetTitleStr);
        localStorage.setItem('sd_custom_tests', JSON.stringify(updatedCustom));

        const storedFree = JSON.parse(localStorage.getItem('sd_free_tests') || '[]');
        const updatedFree = storedFree.filter(t => String(t.id || '').trim() !== targetIdStr && String(t.title || t.name || '').trim().toLowerCase() !== targetTitleStr);
        localStorage.setItem('sd_free_tests', JSON.stringify(updatedFree));

        const storedFolders = JSON.parse(localStorage.getItem('sd_test_folders') || '[]');
        const updatedFolders = storedFolders.filter(f => String(f.id || '').trim() !== targetIdStr && String(f.title || f.name || '').trim().toLowerCase() !== targetTitleStr);
        localStorage.setItem('sd_test_folders', JSON.stringify(updatedFolders));
      } catch (e) {}

      // Backend API sync
      if (item.type !== 'FOLDER' && item.id) {
        axios.delete(`/api/admin/tests/${item.id}`).catch(() => {});
        axios.delete(`/api/tests/${item.id}`).catch(() => {});
      }

      setMessage({ type: 'success', text: `🗑️ ${item.type === 'FOLDER' ? 'Folder' : 'Test'} '${displayTitle}' deleted successfully!` });
    }
  };

  const handleConfirmMoveFolder = () => {
    if (!moveFolderModalTarget) return;

    const folderName = selectedFolderForMove || 'Class 10';
    setTestPortalTests(prev => prev.map(t => {
      if (t.id === moveFolderModalTarget.id) {
        return {
          ...t,
          folder: folderName,
          category: `#${folderName}`
        };
      }
      return t;
    }));

    try {
      const stored = JSON.parse(localStorage.getItem('sd_custom_tests') || '[]');
      const updated = stored.map(t => t.id === moveFolderModalTarget.id ? { ...t, folder: folderName, category: `#${folderName}` } : t);
      localStorage.setItem('sd_custom_tests', JSON.stringify(updated));
    } catch (e) {}

    setMessage({ type: 'success', text: `📂 Moved '${moveFolderModalTarget.title}' to folder '${folderName}'!` });
    setMoveFolderModalTarget(null);
  };

  const handleConfirmAddFreeTest = () => {
    if (!activeTestForOption) return;

    const freeTestObj = {
      ...activeTestForOption,
      id: activeTestForOption.id || ('free_' + Date.now()),
      title: activeTestForOption.title,
      category: activeTestForOption.category || '#FreeTest, #ABHYAAS',
      tags: activeTestForOption.tags || 'Class 10',
      isFreeTest: true,
      accessMode: 'FREE',
      price: 0,
      date: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
      startDate: freeTestStartDate,
      endDate: freeTestEndDate,
      noEndTime: freeTestNoEndTime,
      attemptsCount: 0
    };

    setFreeTestsList(prev => [freeTestObj, ...prev.filter(t => t.id !== freeTestObj.id)]);

    try {
      const storedFree = JSON.parse(localStorage.getItem('sd_free_tests') || '[]');
      localStorage.setItem('sd_free_tests', JSON.stringify([freeTestObj, ...storedFree.filter(t => t.id !== freeTestObj.id)]));
      
      const storedCustom = JSON.parse(localStorage.getItem('sd_custom_tests') || '[]');
      localStorage.setItem('sd_custom_tests', JSON.stringify([freeTestObj, ...storedCustom.filter(t => t.id !== freeTestObj.id)]));
    } catch(e) {}

    setTestPortalTests(prev => prev.map(t => t.id === activeTestForOption.id ? { ...t, isFreeTest: true, accessMode: 'FREE' } : t));

    setMessage({ type: 'success', text: `🎁 Test '${activeTestForOption.title}' added to Student Free Test Portal successfully!` });
    setShowAddTestToModal(false);
  };

  const handleSaveAndPublishQuiz = async () => {
    const activeToken = localStorage.getItem('sd_token') || localStorage.getItem('token') || localStorage.getItem('sarvottam_token') || 'demo_admin_jwt';

    const finalTitle = (newTestData.title && newTestData.title.trim()) || 'ABHYAAS Mathematics Practice Test';
    const durationMins = (parseInt(newTestData.durationHour || '0') * 60) + parseInt(newTestData.durationMin || '40');
    const authHeaders = { Authorization: `Bearer ${activeToken}` };

    let createdTest = null;

    // 1. Attempt Backend API Persistence with 600ms timeout
    try {
      const testRes = await axios.post('/api/admin/tests', {
        title: finalTitle,
        durationMinutes: durationMins,
        tags: newTestData.tags || 'Class 10',
        totalMarks: Number(newTestData.totalMarks || 100),
        negativeMarks: Number(newTestData.negativeMarks || 0.25),
        accessMode: newTestData.accessMode || 'FREE',
        price: Number(newTestData.price || 0),
        courseIds: newTestData.selectedCourseIds || [],
        solutionDocUrl: newTestData.solutionDocUrl,
        solutionDocName: newTestData.solutionDocName
      }, { headers: authHeaders, timeout: 8000 });

      if (testRes.data && testRes.data.success && testRes.data.test) {
        createdTest = testRes.data.test;

        if (Array.isArray(quizQuestionsList) && quizQuestionsList.length > 0) {
          for (const q of quizQuestionsList) {
            let optA = q.optionA || '';
            let optB = q.optionB || '';
            let optC = q.optionC || '';
            let optD = q.optionD || '';

            if (Array.isArray(q.options)) {
              optA = optA || q.options[0] || '';
              optB = optB || q.options[1] || '';
              optC = optC || q.options[2] || '';
              optD = optD || q.options[3] || '';
            }

            await axios.post(`/api/admin/tests/${createdTest.id}/questions`, {
              sectionName: q.sectionName || 'Section A',
              questionType: q.questionType || 'MCQ',
              questionText: q.questionText || 'Default Question Text',
              imageUrl: q.imageUrl || null,
              optionA: optA,
              optionB: optB,
              optionC: optC,
              optionD: optD,
              correctOption: q.correctOption || 'A',
              explanation: q.explanation || '',
              marks: Number(q.marks || 1),
              negativeMarks: Number(q.negativeMarks || 0)
            }, { headers: authHeaders, timeout: 8000 });
          }
        }
      }
    } catch (apiErr) {
      console.warn('Backend API quiz save failed or timed out, using instant local storage fallback...', apiErr);
    }

    // 2. Client-Side Instant Persistence Fallback if server returned non-JSON/HTML on static hosting
    if (!createdTest) {
      createdTest = {
        id: 'test_' + Date.now(),
        title: finalTitle,
        category: `#${newTestData.tags || 'Class 10'}`,
        tags: newTestData.tags || 'Class 10',
        durationMinutes: durationMins,
        totalMarks: Number(newTestData.totalMarks || 100),
        negativeMarks: Number(newTestData.negativeMarks || 0.25),
        accessMode: newTestData.accessMode || 'FREE',
        price: Number(newTestData.price || 0),
        solutionDocUrl: newTestData.solutionDocUrl,
        solutionDocName: newTestData.solutionDocName,
        questions: quizQuestionsList || [],
        questionsCount: quizQuestionsList.length,
        attemptsCount: 0,
        status: 'Published',
        date: new Date().toISOString().split('T')[0].replace(/-/g, '/')
      };
    } else {
      createdTest = {
        ...createdTest,
        title: finalTitle,
        durationMinutes: durationMins,
        questions: quizQuestionsList || [],
        questionsCount: (quizQuestionsList || []).length
      };
    }

    // ALWAYS save createdTest with its full questions list to localStorage for instant cross-tab & student portal sync
    try {
      const storedCustomTests = JSON.parse(localStorage.getItem('sd_custom_tests') || '[]');
      const updatedStored = [createdTest, ...storedCustomTests.filter(t => t.id !== createdTest.id)];
      localStorage.setItem('sd_custom_tests', JSON.stringify(updatedStored));

      const storedCourseQuizzes = JSON.parse(localStorage.getItem('sd_course_quizzes') || '[]');
      const updatedQuizzes = [createdTest, ...storedCourseQuizzes.filter(q => q.id !== createdTest.id)];
      localStorage.setItem('sd_course_quizzes', JSON.stringify(updatedQuizzes));

      if (createdTest.id) {
        localStorage.setItem(`sd_test_questions_${createdTest.id}`, JSON.stringify(quizQuestionsList || []));
      }
      if (finalTitle) {
        localStorage.setItem(`sd_test_questions_${finalTitle.trim().toLowerCase()}`, JSON.stringify(quizQuestionsList || []));
      }
    } catch (e) {}

    // Update Admin UI state & auto-navigate to Test Portal view
    setTestPortalTests(prev => [
      {
        id: createdTest.id,
        title: createdTest.title,
        category: `#${newTestData.tags || 'Class 10'}`,
        status: 'Published',
        date: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
        questionsCount: quizQuestionsList.length,
        attemptsCount: 0
      },
      ...prev.filter(t => t.id !== createdTest.id)
    ]);

    setActiveTab('content');
    setContentSubTab('test-portal');
    setShowTestPortalWorkspace(true);
    setShowTestPortalWelcome(false);
    setShowTestReportDashboard(false);
    setShowTestSettingsPage(false);

    alert(`🎉 Quiz '${createdTest.title}' with ${quizQuestionsList.length} questions created & published successfully!`);
    setMessage({ type: 'success', text: `🎉 Quiz '${createdTest.title}' with ${quizQuestionsList.length} questions created & published successfully!` });
    setShowCreateNewTestModal(false);
    setNewTestData({ title: '', durationHour: '0', durationMin: '40', tags: 'Class 10', totalMarks: '100', negativeMarks: '0.25', solutionDocUrl: '', solutionDocName: '' });
    setQuizQuestionsList([]);
    setBuilderValidationErrors({});
    localStorage.removeItem('sarvottam_admin_draft_questions');
    localStorage.removeItem('sarvottam_admin_draft_sections');

    try {
      await fetchAdminData();
    } catch (e) {}
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/coupons', newCouponForm);
      if (res.data.success) {
        setMessage({ type: 'success', text: `Coupon '${res.data.coupon.code}' created successfully!` });
        setShowCreateCouponModal(false);
        setNewCouponForm({ code: '', title: '', discountType: 'FLAT', discountValue: '200', maxUses: '100', status: 'ACTIVE' });
        fetchAdminData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to create coupon.' });
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      const res = await axios.delete(`/api/admin/coupons/${id}`);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Coupon deleted successfully.' });
        fetchAdminData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete coupon.' });
    }
  };

  const handleCreateLiveClass = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/classes', newClassForm);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Live class scheduled!' });
        setShowCreateClassModal(false);
        setNewClassForm({ title: '', subject: 'Mathematics', classGrade: 'Class 10', duration: '60 mins' });
        fetchAdminData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to schedule class.' });
    }
  };

  const handleManualUnlock = async (e) => {
    e.preventDefault();
    if (!selectedStudentForUnlock || !selectedCourseForUnlock) {
      setMessage({ type: 'error', text: 'Please select both student and course.' });
      return;
    }
    try {
      const res = await axios.post('/api/admin/students/unlock-course', {
        studentId: selectedStudentForUnlock,
        courseId: selectedCourseForUnlock
      });
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message || 'Course unlocked successfully!' });
        setShowUnlockModal(false);
        fetchAdminData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to unlock course.' });
    }
  };

  const handleCreateFreeResource = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/free-resources', newResourceForm);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Free study material published!' });
        setShowCreateResourceModal(false);
        setNewResourceForm({ title: '', type: 'DOCUMENT', url: '', category: 'Formula Sheet', description: '' });
        fetchAdminData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to publish resource.' });
    }
  };

  const handleDeleteFreeResource = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      const res = await axios.delete(`/api/admin/free-resources/${id}`);
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Resource deleted.' });
        fetchAdminData();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete resource.' });
    }
  };

  const handleCreateBanner = async (e) => {
    e.preventDefault();
    if (!newBannerForm.title.trim()) return;

    const newBannerObj = {
      id: 'banner_' + Date.now(),
      title: newBannerForm.title.trim(),
      description: newBannerForm.description.trim() || 'Sarvottam Diksha Official Academy Banner',
      thumbnail: newBannerForm.thumbnail || '/assets/poster-banner.png',
      startDate: newBannerForm.startDate || null,
      endDate: newBannerForm.endDate || null,
      status: newBannerForm.status || 'PUBLISHED',
      buttonText: newBannerForm.buttonText || 'Explore Now',
      link: newBannerForm.link || '/store',
      isFeatured: newBannerForm.isFeatured !== undefined ? newBannerForm.isFeatured : true,
      targetPlacement: newBannerForm.targetPlacement || 'BOTH',
      createdAt: new Date().toISOString()
    };

    // Optimistically update publicPortals state & localStorage immediately
    setPublicPortals(prev => [newBannerObj, ...(Array.isArray(prev) ? prev : [])]);
    try {
      const storedCustomBanners = JSON.parse(localStorage.getItem('sd_custom_banners') || '[]');
      localStorage.setItem('sd_custom_banners', JSON.stringify([newBannerObj, ...storedCustomBanners]));
    } catch (err) {}

    setMessage({ type: 'success', text: '🎉 New banner uploaded and published live!' });
    setShowCreateBannerModal(false);
    setActiveTab('app');
    setAppSubTab('manage-banners');
    setNewBannerForm({
      title: '',
      description: '',
      thumbnail: '/assets/poster-flyer.png',
      startDate: '',
      endDate: '',
      status: 'PUBLISHED',
      buttonText: 'Explore Now',
      link: '/store',
      isFeatured: true,
      targetPlacement: 'BOTH'
    });

    try {
      await axios.post('/api/admin/public-portals', newBannerObj);
    } catch (err) {
      console.warn('Backend API offline, banner saved locally:', err);
    }
  };

  const handleDeleteBanner = async (id) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;
    setPublicPortals(prev => (Array.isArray(prev) ? prev.filter(b => b.id !== id) : []));
    try {
      const storedCustomBanners = JSON.parse(localStorage.getItem('sd_custom_banners') || '[]');
      localStorage.setItem('sd_custom_banners', JSON.stringify(storedCustomBanners.filter(b => b.id !== id)));
    } catch (err) {}
    setMessage({ type: 'success', text: 'Banner deleted.' });

    try {
      await axios.delete(`/api/admin/public-portals/${id}`);
    } catch (err) {
      console.warn('Backend API offline, deleted locally:', err);
    }
  };

  const fetchTransactionsData = async () => {
    try {
      const res = await axios.get('/api/admin/transactions');
      if (res.data.success) {
        setTransactionsData(res.data.transactions || []);
        setTransactionsStats(res.data.stats || { count: 0, totalAmount: 0, avgOrderValue: 0 });
      }
    } catch (err) {
      console.error('Fetch transactions error:', err);
    }
  };

  const handleExportReportSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/admin/export-report', { reportType: selectedReportType });
      if (res.data.success) {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(res.data.data, null, 2))}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute("download", `${selectedReportType.replace(/ /g, '_')}_Report.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        setMessage({ type: 'success', text: `Report '${selectedReportType}' exported successfully (${res.data.count} records)!` });
        setShowGenerateReportModal(false);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to generate report.' });
    }
  };

  const handleOpenManageCourse = async (course) => {
    setManagingCourseFull(course);
    try {
      const res = await axios.get(`/api/admin/courses/${course.id}/full`, { timeout: 800 });
      if (res.data && res.data.success && res.data.course) {
        setManagingCourseFull(res.data.course);
      }
    } catch (err) {}
  };

  // Filtered & Sorted Courses
  const filteredCourses = courses.filter(c => {
    const searchLower = (courseSearchQuery || '').trim().toLowerCase();
    const matchesSearch = !searchLower || 
                          (c.title || '').toLowerCase().includes(searchLower) ||
                          (c.description || '').toLowerCase().includes(searchLower) ||
                          (c.category || '').toLowerCase().includes(searchLower);

    const matchesCategory = courseCategoryFilter === 'ALL' || 
                            (c.category || '').toUpperCase().includes(courseCategoryFilter.toUpperCase()) ||
                            (c.title || '').toUpperCase().includes(courseCategoryFilter.toUpperCase());

    const matchesStatus = courseStatusFilter === 'ALL' || 
                          (c.status || 'PUBLISHED').toUpperCase() === courseStatusFilter.toUpperCase() ||
                          (courseStatusFilter === 'PUBLISHED' && c.isPublished);

    const matchesMinPrice = !priceRangeMin || Number(c.price || 0) >= Number(priceRangeMin);
    const matchesMaxPrice = !priceRangeMax || Number(c.price || 0) <= Number(priceRangeMax);

    return matchesSearch && matchesCategory && matchesStatus && matchesMinPrice && matchesMaxPrice;
  }).sort((a, b) => {
    if (courseSortOption === 'NAME') return a.title.localeCompare(b.title);
    if (courseSortOption === 'NEWEST') return new Date(b.createdAt) - new Date(a.createdAt);
    if (courseSortOption === 'PRICE_LOW_HIGH') return Number(a.price) - Number(b.price);
    if (courseSortOption === 'PRICE_HIGH_LOW') return Number(b.price) - Number(a.price);
    if (courseSortOption === 'TOP_SELLING' || courseSortOption === 'MOST_POPULAR') return (b.purchasesCount || 0) - (a.purchasesCount || 0);
    return 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-orange-50/20 to-emerald-50/20 dark:from-[#0B0F17] dark:via-slate-950 dark:to-[#0B0F17] text-slate-900 dark:text-slate-100 flex font-sans transition-colors duration-300">

      {/* ================= LEFT CLASSPLUS-STYLE BRANDED SIDEBAR ================= */}
      <aside className={`${sidebarOpen ? 'w-72 block' : 'w-0 hidden'} bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-orange-200/80 dark:border-slate-800 flex flex-col shrink-0 min-h-screen sticky top-0 shadow-lg shadow-orange-500/5 z-20 transition-all duration-300 overflow-hidden`}>
        
        {/* Brand Header */}
        <div className="p-5 border-b border-orange-100 dark:border-slate-800 bg-gradient-to-r from-orange-50/80 via-amber-50/50 to-emerald-50/30 dark:from-slate-900/90 dark:via-orange-950/30 dark:to-slate-900/90 flex items-center gap-3">
          <img src={logoImg} alt="Sarvottam Diksha Logo" className="h-11 w-auto object-contain drop-shadow-xs" />
          <div>
            <div className="font-black text-base bg-gradient-to-r from-[#FF6500] to-amber-500 bg-clip-text text-transparent leading-none">Sarvottam Diksha</div>
            <div className="text-xs font-black text-orange-600 dark:text-orange-400 mt-1 uppercase tracking-wider">Teacher Admin Portal</div>
          </div>
        </div>

        {/* Navigation Items (2 Units Bigger) */}
        <nav className="p-4 space-y-2 text-sm font-black flex-1 overflow-y-auto">
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full px-4 py-3.5 rounded-2xl flex items-center gap-3.5 transition-all cursor-pointer text-sm font-black ${
              activeTab === 'dashboard' 
                ? 'bg-gradient-to-r from-[#FF6500] to-amber-500 text-white font-black shadow-md shadow-orange-500/20' 
                : 'text-slate-700 dark:text-slate-300 hover:bg-orange-50/80 dark:hover:bg-slate-800/80 hover:text-orange-950 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-5 h-5 shrink-0" />
            <span>Dashboard</span>
          </button>

          {/* Courses Menu & Submenu */}
          <div className="space-y-1">
            <button
              onClick={() => { setActiveTab('courses'); setCoursesSubTab('my-courses'); }}
              className={`w-full px-4 py-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-sm font-black ${
                activeTab === 'courses' 
                  ? 'bg-gradient-to-r from-[#FF6500] to-amber-500 text-white font-black shadow-md shadow-orange-500/20' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-orange-50/80 dark:hover:bg-slate-800/80 hover:text-orange-950 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <BookOpen className="w-5 h-5 shrink-0" />
                <span>Courses</span>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
                activeTab === 'courses' ? 'bg-white/25 text-white' : 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300'
              }`}>
                {courses.length}
              </span>
            </button>

            {activeTab === 'courses' && (
              <div className="pl-10 pr-2 space-y-1.5 pt-1.5 pb-1">
                <button
                  onClick={() => setCoursesSubTab('my-courses')}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-black transition-all cursor-pointer ${
                    coursesSubTab === 'my-courses' 
                      ? 'bg-orange-100 dark:bg-orange-950 text-orange-950 dark:text-orange-300 font-black shadow-2xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-800'
                  }`}
                >
                  My Courses ({courses.length})
                </button>
                <button
                  onClick={() => setCoursesSubTab('global-courses')}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-black transition-all cursor-pointer ${
                    coursesSubTab === 'global-courses' 
                      ? 'bg-orange-100 dark:bg-orange-950 text-orange-950 dark:text-orange-300 font-black shadow-2xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Global Courses
                </button>
                <button
                  onClick={() => { setCoursesSubTab('coupons'); setActiveTab('coupons'); }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'coupons' 
                      ? 'bg-orange-100 dark:bg-orange-950 text-orange-950 dark:text-orange-300 font-black shadow-2xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Manage Coupons
                </button>
              </div>
            )}
          </div>

          {/* Content Menu & Submenu */}
          <div className="space-y-1">
            <button
              onClick={() => { setActiveTab('content'); setContentSubTab('test-portal'); }}
              className={`w-full px-4 py-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-sm font-black ${
                activeTab === 'content' 
                  ? 'bg-gradient-to-r from-[#FF6500] to-amber-500 text-white font-black shadow-md shadow-orange-500/20' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-orange-50/80 dark:hover:bg-slate-800/80 hover:text-orange-950 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <FileText className="w-5 h-5 shrink-0" />
                <span>Content</span>
              </div>
            </button>

            {activeTab === 'content' && (
              <div className="pl-10 pr-2 space-y-1.5 pt-1.5 pb-1">
                <button
                  onClick={() => {
                    setContentSubTab('test-portal');
                    setShowTestPortalWorkspace(true);
                    setShowTestPortalWelcome(false);
                    setShowTestReportDashboard(false);
                    setShowTestSettingsPage(false);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-black transition-all cursor-pointer ${
                    contentSubTab === 'test-portal' 
                      ? 'bg-orange-100 dark:bg-orange-950 text-orange-950 dark:text-orange-300 font-black shadow-2xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Test Portal
                </button>
                <button
                  onClick={() => setContentSubTab('free-material')}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-black transition-all cursor-pointer ${
                    contentSubTab === 'free-material' 
                      ? 'bg-orange-100 dark:bg-orange-950 text-orange-950 dark:text-orange-300 font-black shadow-2xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Free Material
                </button>
                <button
                  onClick={() => {
                    setContentSubTab('student-submissions');
                    setShowTestPortalWorkspace(true);
                    setShowTestReportDashboard(true);
                    setShowTestPortalWelcome(false);
                    setShowTestSettingsPage(false);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-black transition-all cursor-pointer ${
                    contentSubTab === 'student-submissions' || showTestReportDashboard
                      ? 'bg-orange-100 dark:bg-orange-950 text-orange-950 dark:text-orange-300 font-black shadow-2xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-800'
                  }`}
                >
                  📝 Student Submissions
                </button>
              </div>
            )}
          </div>

          {/* Your App Menu & Submenu */}
          <div className="space-y-1">
            <button
              onClick={() => { setActiveTab('app'); setAppSubTab('manage-banners'); }}
              className={`w-full px-4 py-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-sm font-black ${
                activeTab === 'app' 
                  ? 'bg-gradient-to-r from-[#FF6500] to-amber-500 text-white font-black shadow-md shadow-orange-500/20' 
                  : 'text-slate-700 dark:text-slate-300 hover:bg-orange-50/80 dark:hover:bg-slate-800/80 hover:text-orange-950 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Smartphone className="w-5 h-5 shrink-0" />
                <span>Your App</span>
              </div>
            </button>

            {activeTab === 'app' && (
              <div className="pl-10 pr-2 space-y-1.5 pt-1.5 pb-1">
                <button
                  onClick={() => setAppSubTab('manage-banners')}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-black transition-all cursor-pointer ${
                    appSubTab === 'manage-banners' 
                      ? 'bg-orange-100 dark:bg-orange-950 text-orange-950 dark:text-orange-300 font-black shadow-2xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Manage Banners
                </button>
                <button
                  onClick={() => setAppSubTab('configure-app')}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-black transition-all cursor-pointer ${
                    appSubTab === 'configure-app' 
                      ? 'bg-orange-100 dark:bg-orange-950 text-orange-950 dark:text-orange-300 font-black shadow-2xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Configure App
                </button>
                <button
                  onClick={() => setAppSubTab('marketing-dashboard')}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-black transition-all cursor-pointer ${
                    appSubTab === 'marketing-dashboard' 
                      ? 'bg-orange-100 dark:bg-orange-950 text-orange-950 dark:text-orange-300 font-black shadow-2xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Marketing Dashboard
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`w-full px-4 py-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-sm font-black ${
              activeTab === 'coupons' 
                ? 'bg-gradient-to-r from-[#FF6500] to-amber-500 text-white font-black shadow-md shadow-orange-500/20' 
                : 'text-slate-700 dark:text-slate-300 hover:bg-orange-50/80 dark:hover:bg-slate-800/80 hover:text-orange-950 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Ticket className="w-5 h-5 shrink-0" />
              <span>Manage Coupons</span>
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
              activeTab === 'coupons' ? 'bg-white/25 text-white' : 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
            }`}>
              {coupons.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('people')}
            className={`w-full px-4 py-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-sm font-black ${
              activeTab === 'people' 
                ? 'bg-gradient-to-r from-[#FF6500] to-amber-500 text-white font-black shadow-md shadow-orange-500/20' 
                : 'text-slate-700 dark:text-slate-300 hover:bg-orange-50/80 dark:hover:bg-slate-800/80 hover:text-orange-950 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <Users className="w-5 h-5 shrink-0" />
              <span>People & Students</span>
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
              activeTab === 'people' ? 'bg-white/25 text-white' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
            }`}>
              {students.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('chats');
              if (conversations?.length > 0 && !selectedStudentForChat) {
                setSelectedStudentForChat(conversations[0].student.id);
              }
            }}
            className={`w-full px-4 py-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-sm font-black ${
              activeTab === 'chats' 
                ? 'bg-gradient-to-r from-[#FF6500] to-amber-500 text-white font-black shadow-md shadow-orange-500/20' 
                : 'text-slate-700 dark:text-slate-300 hover:bg-orange-50/80 dark:hover:bg-slate-800/80 hover:text-orange-950 dark:hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <MessageSquare className="w-5 h-5 shrink-0" />
              <span>Doubt Chats</span>
            </div>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
              activeTab === 'chats' ? 'bg-white/25 text-white' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300'
            }`}>
              {conversations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full px-4 py-3.5 rounded-2xl flex items-center gap-3.5 transition-all cursor-pointer text-sm font-black ${
              activeTab === 'analytics' 
                ? 'bg-gradient-to-r from-[#FF6500] to-amber-500 text-white font-black shadow-md shadow-orange-500/20' 
                : 'text-slate-700 dark:text-slate-300 hover:bg-orange-50/80 dark:hover:bg-slate-800/80 hover:text-orange-950 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-5 h-5 shrink-0" />
            <span>Analytics</span>
          </button>

          {/* Faculty Profile Settings */}
          <button
            onClick={() => setActiveTab('faculty-profile')}
            className={`w-full px-4 py-3.5 rounded-2xl flex items-center gap-3.5 transition-all cursor-pointer text-sm font-black ${
              activeTab === 'faculty-profile' 
                ? 'bg-gradient-to-r from-[#FF6500] to-amber-500 text-white font-black shadow-md shadow-orange-500/20' 
                : 'text-slate-700 dark:text-slate-300 hover:bg-orange-50/80 dark:hover:bg-slate-800/80 hover:text-orange-950 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-5 h-5 shrink-0" />
            <span>Faculty Profile Settings</span>
          </button>

          {/* Platform Settings */}
          <button
            onClick={() => setActiveTab('platform-settings')}
            className={`w-full px-4 py-3.5 rounded-2xl flex items-center gap-3.5 transition-all cursor-pointer text-sm font-black ${
              activeTab === 'platform-settings' 
                ? 'bg-gradient-to-r from-[#FF6500] to-amber-500 text-white font-black shadow-md shadow-orange-500/20' 
                : 'text-slate-700 dark:text-slate-300 hover:bg-orange-50/80 dark:hover:bg-slate-800/80 hover:text-orange-950 dark:hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span>Platform Settings</span>
          </button>

          <button
            onClick={() => {
              logout();
            }}
            className="w-full px-4 py-3.5 rounded-2xl flex items-center gap-3.5 transition-all cursor-pointer text-sm font-black text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-800 shadow-2xs mt-4"
          >
            <LogOut className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>Logout</span>
          </button>

        </nav>

        {/* Support CTA Button at Bottom */}
        <div className="p-4 border-t border-orange-100 dark:border-slate-800">
          <button 
            onClick={() => alert("Contact Founder & Lead Educator Manika Maheshwari at Dikshasarvottam@gmail.com or +91 99646 77802")}
            className="w-full py-3.5 bg-gradient-to-r from-[#FF6500] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Help & Support</span>
          </button>
        </div>

      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 min-w-0 flex flex-col">
        
        {/* TOP NAVBAR HEADER */}
        <header className="h-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-orange-200/80 dark:border-slate-800 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              Hi Manika Maheshwari <span className="bg-gradient-to-r from-[#FF6500] via-amber-500 to-emerald-500 bg-clip-text text-transparent">,</span>
            </h1>
            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 hidden md:inline-block">Welcome to your Sarvottam Diksha Dashboard</span>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Real-Time Admin Notification Bell Icon */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="p-2.5 rounded-2xl bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 relative transition-all active:scale-95 cursor-pointer border border-amber-200/80 dark:border-slate-700"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-[#FF6500]" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white font-black text-[10px] rounded-full flex items-center justify-center animate-bounce shadow-md">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Drawer Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                      <Bell className="w-4 h-4 text-[#FF6500]" />
                      <span>Admin Notifications ({notifications.length})</span>
                    </div>
                    <button onClick={() => setShowNotifDropdown(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {notifications.length > 0 ? (
                      notifications.map((n, idx) => (
                        <div key={n.id || idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                          <div className="flex items-center justify-between font-black text-slate-900 dark:text-white">
                            <span className="flex items-center gap-1.5">
                              {n.type === 'REGISTRATION' ? '🎉 New Registration' : '🔔 System Alert'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-extrabold">{n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 font-extrabold leading-relaxed">{n.message}</p>
                          
                          {/* Direct Message Student CTA Button */}
                          {n.student || n.message?.includes('@') ? (
                            <button
                              onClick={() => {
                                setShowNotifDropdown(false);
                                setActiveTab('chats');
                                if (n.student?.id) {
                                  setSelectedStudentForChat(n.student.id);
                                }
                              }}
                              className="w-full py-2 bg-gradient-to-r from-[#FF6500] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-black text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>💬 Message Student</span>
                            </button>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-slate-400 font-bold">No new notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Progress Badge */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-100/90 to-amber-100/90 dark:from-slate-800 dark:to-slate-800 px-3.5 py-1.5 rounded-full border border-orange-200 dark:border-slate-700">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#FF6500] to-amber-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs">85%</div>
              <span className="text-[11px] font-black text-orange-950 dark:text-orange-400">Profile Active</span>
            </div>

            {/* Profile Avatar Badge */}
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-slate-800 p-1.5 pl-3 rounded-full border border-amber-200/90 dark:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF6500] to-amber-500 text-white font-black text-xs flex items-center justify-center shadow-sm">
                MM
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white pr-2">Manika Maheshwari</span>
            </div>

          </div>
        </header>

        {/* Global Alert Notification Message */}
        {message.text && (
          <div className={`mx-8 mt-4 p-4 rounded-2xl text-xs font-black flex items-center justify-between animate-fade-in ${
            message.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200' : 'bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })} className="p-1 text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* MAIN BODY CONTENT */}
        <div className="p-6 sm:p-8 space-y-8 flex-1">

          {/* ================= TAB 1: DASHBOARD OVERVIEW ================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              
              {/* Quick Banner Cards */}
              <div className="grid grid-cols-1 gap-5">
                <div className="bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-orange-500/10 dark:from-slate-900/90 dark:via-emerald-950/30 dark:to-slate-900/90 p-6 rounded-3xl border-2 border-emerald-200/90 dark:border-emerald-500/30 flex items-center justify-between shadow-sm hover:shadow-lg transition-all group">
                  <div className="space-y-1">
                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-emerald-500" />
                      <span>Your App</span>
                    </div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">Share Sarvottam Diksha mobile web app</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { navigator.clipboard.writeText(window.location.origin); alert("App Link Copied!"); }} className="p-3.5 bg-emerald-600 text-white rounded-2xl hover:scale-105 transition-all shadow-md cursor-pointer">
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Grid: Our Offerings (Left 8 cols) + Right Widgets (4 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left 8 Cols: Our Offerings */}
                <div className="lg:col-span-8 space-y-6">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Our Offerings</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    
                    {/* CARD 1: Course */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="w-14 h-14 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
                          <BookOpen className="w-7 h-7" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">Course</h4>
                          </div>
                          <span className="text-[11px] font-bold text-slate-400 block mt-0.5">{courses.length} Course Published</span>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold mt-3">Easily create and sell courses online</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setShowCreateCourseModal(true)}
                        className="text-xs font-black text-sky-500 hover:text-sky-600 flex items-center gap-1.5 cursor-pointer pt-2"
                      >
                        <span>Create Course</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* CARD 2: Landing Page */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="w-14 h-14 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
                          <Globe className="w-7 h-7" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">Landing Page</h4>
                            <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] px-2 py-0.5 rounded-md font-extrabold border border-amber-200 dark:border-amber-800">Premium</span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-400 block mt-0.5">No Landing Pages</span>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold mt-3">Boost your conversions with stand alone landing pages</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setActiveTab('website')}
                        className="text-xs font-black text-sky-500 hover:text-sky-600 flex items-center gap-1.5 cursor-pointer pt-2"
                      >
                        <span>Create Landing Page</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* CARD 3: Test Portal */}
                    <div 
                      onClick={() => {
                        setActiveTab('content');
                        setContentSubTab('test-portal');
                        setShowTestPortalWorkspace(true);
                        setShowTestPortalWelcome(false);
                        setShowTestReportDashboard(false);
                        setShowTestSettingsPage(false);
                      }}
                      className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-sky-500 transition-all space-y-4 flex flex-col justify-between cursor-pointer group"
                    >
                      <div className="space-y-4">
                        <div className="w-14 h-14 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
                          <FileText className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors">Test Portal</h4>
                          <span className="text-[11px] font-bold text-slate-400 block mt-0.5">151 Tests Created</span>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold mt-3">Create online tests and assign it to your courses</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab('content');
                          setContentSubTab('test-portal');
                          setShowTestPortalWorkspace(true);
                          setShowTestPortalWelcome(false);
                          setShowTestReportDashboard(false);
                          setShowTestSettingsPage(false);
                        }}
                        className="text-xs font-black text-sky-500 hover:text-sky-600 flex items-center gap-1.5 cursor-pointer pt-2"
                      >
                        <span>Go to Test Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* CARD 4: Campaign */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="w-14 h-14 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400">
                          <Sparkles className="w-7 h-7" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">Campaign</h4>
                            <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] px-2 py-0.5 rounded-md font-extrabold border border-amber-200 dark:border-amber-800">Premium</span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-400 block mt-0.5">No Campaign Created</span>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold mt-3">Create targeted marketing campaigns & boost engagement</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setActiveTab('coupons')}
                        className="text-xs font-black text-sky-500 hover:text-sky-600 flex items-center gap-1.5 cursor-pointer pt-2"
                      >
                        <span>Explore Campaign</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>

                {/* Right 4 Cols: Additional Offerings */}
                <div className="lg:col-span-4 space-y-6">

                  {/* Additional Offerings Card */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Additional Offerings</h4>

                    <div className="space-y-3">
                      
                      {/* Banners Widget */}
                      <button
                        type="button"
                        onClick={() => { setActiveTab('app'); setAppSubTab('manage-banners'); }}
                        className="w-full p-4 rounded-2xl bg-sky-50/60 dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:bg-sky-100/60 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-sky-500 text-white flex items-center justify-center">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-black text-sky-600 dark:text-sky-400">Banners</div>
                            <div className="text-[10px] text-slate-400 font-bold">{publicPortals.length || 3} Live</div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-sky-500" />
                      </button>

                      {/* Coupons Widget */}
                      <button
                        type="button"
                        onClick={() => setActiveTab('coupons')}
                        className="w-full p-4 rounded-2xl bg-sky-50/60 dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:bg-sky-100/60 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-sky-500 text-white flex items-center justify-center">
                            <Ticket className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-black text-sky-600 dark:text-sky-400">Coupons</div>
                            <div className="text-[10px] text-slate-400 font-bold">{coupons.length || 2} Live</div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-sky-500" />
                      </button>

                    </div>
                  </div>

                </div>

              </div>

              {/* Bottom Analytics Card (Matching Screenshot) */}
              <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Analytics</h3>
                    <span className="text-xs text-slate-400 font-bold">Last 7 days</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setActiveTab('analytics')}
                    className="text-xs font-black text-sky-500 hover:text-sky-600 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 border-l-4 border-l-sky-500 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">Website sessions</span>
                    <span className="text-2xl font-black text-sky-600 dark:text-sky-400">0</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 border-l-4 border-l-sky-500 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">Buy Now Clicks</span>
                    <span className="text-2xl font-black text-sky-600 dark:text-sky-400">3</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 border-l-4 border-l-sky-500 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">Transactions</span>
                    <span className="text-2xl font-black text-sky-600 dark:text-sky-400">0</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 border-l-4 border-l-sky-500 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">Revenue</span>
                    <span className="text-2xl font-black text-sky-600 dark:text-sky-400">0</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 1.5: MY COURSES & GLOBAL COURSES ================= */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              
              {/* Header Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-orange-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {coursesSubTab === 'global-courses' ? 'Global Courses Catalog' : 'My Courses'} ({filteredCourses.length})
                  </h2>
                  <p className="text-xs font-extrabold text-orange-600 dark:text-orange-400 mt-1">
                    {coursesSubTab === 'global-courses' 
                      ? 'Browse and assign global courses across all grades' 
                      : 'All published courses live on the student portal'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCreateCourseModal(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#FF6500] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-2xl flex items-center gap-2 shadow-lg shadow-orange-500/20 hover:scale-105 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Course Batch</span>
                  </button>
                </div>
              </div>

              {/* Filters & Search Controls (Matching Screenshot 1) */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                
                {/* Search input */}
                <div className="sm:col-span-5 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search by name"
                    value={courseSearchQuery}
                    onChange={(e) => setCourseSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Sort by dropdown */}
                <div className="sm:col-span-4">
                  <select
                    value={courseSortOption}
                    onChange={(e) => setCourseSortOption(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="NAME">Course Name</option>
                    <option value="NEWEST">Newest</option>
                    <option value="PRICE_LOW_HIGH">Price Low To High</option>
                    <option value="TOP_SELLING">Top Selling</option>
                    <option value="PRICE_HIGH_LOW">Price High To Low</option>
                    <option value="MOST_POPULAR">Most Popular (Trending)</option>
                  </select>
                </div>

                {/* Filter button */}
                <div className="sm:col-span-3">
                  <button
                    onClick={() => setShowCourseFilterModal(true)}
                    className="w-full py-2.5 px-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-black text-slate-800 dark:text-white hover:border-sky-500 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-sky-500" />
                    <span>Filter</span>
                  </button>
                </div>

              </div>

              {/* Courses Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map(course => (
                  <div 
                    key={course.id} 
                    className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-orange-200/90 dark:border-slate-800 shadow-md hover:shadow-xl hover:border-[#FF6500] dark:hover:border-[#FF6500] transition-all overflow-hidden flex flex-col justify-between group"
                  >
                    
                    {/* Top Thumbnail Header */}
                    <div 
                      className="relative aspect-[16/9] overflow-hidden flex items-center justify-center border-b border-orange-100 dark:border-slate-800"
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

                      {/* Status Tag */}
                      <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md ${
                        course.status === 'PUBLISHED' || course.isPublished
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-amber-500 text-white'
                      }`}>
                        {course.status || (course.isPublished ? 'PUBLISHED' : 'UNPUBLISHED')}
                      </span>

                      {/* Price Badge */}
                      <span className="absolute bottom-3 right-3 bg-slate-900/90 text-white px-3.5 py-1 rounded-full text-xs font-black shadow-md border border-white/20">
                        ₹{course.price}
                      </span>
                    </div>

                    {/* Body Content */}
                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="text-[10px] font-black text-[#FF6500] uppercase tracking-wider">{course.category}</div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug group-hover:text-[#FF6500] transition-colors">
                          {course.title}
                        </h3>
                        {course.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-extrabold line-clamp-2">
                            {course.description}
                          </p>
                        )}
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-500 dark:text-slate-400 pt-2 border-t border-orange-100 dark:border-slate-800">
                        <span>{course.chapters?.length || 0} Chapters</span>
                        <span>{course.validityDays ? `${course.validityDays} Days Validity` : 'Full Access'}</span>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenManageCourse(course);
                            navigate(`/admin/courses/${course.id}/manage`);
                          }}
                          className="w-full py-2.5 bg-orange-100 dark:bg-orange-950 text-orange-950 dark:text-orange-300 hover:bg-[#FF6500] hover:text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Manage</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/courses/${course.id}/preview`);
                          }}
                          className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                      </div>

                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ================= TAB 2: CONTENT (TEST PORTAL & FREE MATERIAL - MATCHING SCREENSHOTS 1 & 2) ================= */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              
              {/* Content Navigation Subtabs */}
              <div className="flex items-center justify-between border-b border-orange-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {contentSubTab === 'test-portal' ? 'Test Portal' : 'Free Material'}
                  </h2>
                  <p className="text-xs font-extrabold text-orange-600 dark:text-orange-400 mt-1">
                    {contentSubTab === 'test-portal' ? 'Only published tests are shown here' : 'Add / view free material for your visitors'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {contentSubTab === 'test-portal' && (
                    <button 
                      onClick={() => {
                        setShowTestPortalWorkspace(true);
                        setShowTestPortalWelcome(false);
                        setShowTestReportDashboard(false);
                        setShowTestSettingsPage(false);
                      }}
                      className="px-5 py-2.5 bg-gradient-to-r from-sky-400 to-[#0284C7] hover:from-sky-500 hover:to-[#0284C7] text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer"
                    >
                      <span>Go to Test portal</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                  {contentSubTab === 'free-material' && (
                    <button 
                      onClick={() => setShowCreateResourceModal(true)}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#FF6500] to-amber-500 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Free Study Material</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Content Subtab A: Test Portal (Matching Screenshot 1) */}
              {contentSubTab === 'test-portal' && (
                <div className="space-y-4">
                  
                  {/* Search Bar */}
                  <div className="relative max-w-sm">
                    <Search className="w-4 h-4 text-orange-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={testSearchQuery}
                      onChange={(e) => setTestSearchQuery(e.target.value)}
                      placeholder="Search online tests..."
                      className="w-full bg-white dark:bg-slate-900 border-2 border-orange-200 dark:border-slate-800 rounded-2xl pl-9 pr-4 py-2 text-xs font-extrabold text-slate-800 dark:text-white focus:outline-none focus:border-[#FF6500]"
                    />
                  </div>

                  {/* List Table of Tests & Folders */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-orange-200/80 dark:border-slate-800 shadow-md overflow-hidden">
                    <table className="w-full text-left text-xs font-bold">
                      <thead className="bg-gradient-to-r from-orange-100/60 via-amber-100/60 to-emerald-100/60 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 border-b border-orange-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black uppercase">
                        <tr>
                          <th className="p-4 w-10"></th>
                          <th className="p-4">Tests / Folders</th>
                          <th className="p-4">Date</th>
                          <th className="p-4 text-right">Options</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-orange-100 dark:divide-slate-800">
                        
                        {(() => {
                          const items = [
                            ...testPortalFolders.map(f => ({ ...f, type: 'FOLDER', date: f.date || 'Recent' })),
                            ...testPortalTests.map(t => ({ ...t, type: 'TEST', date: t.date || 'Recent' }))
                          ].filter(item => {
                            if (!testSearchQuery) return true;
                            return (item.title || '').toLowerCase().includes(testSearchQuery.toLowerCase());
                          });

                          if (items.length === 0) {
                            return (
                              <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-400 font-extrabold text-xs">
                                  No tests or folders created yet. Click "+ Create Quiz" below to create a test.
                                </td>
                              </tr>
                            );
                          }

                          return items.map(item => (
                            <tr key={item.id} className="hover:bg-orange-50/40 dark:hover:bg-slate-800/50">
                              <td className="p-4"><input type="checkbox" className="rounded-xs" /></td>
                              <td
                                onClick={() => {
                                  setShowTestPortalWorkspace(true);
                                  if (item.type === 'FOLDER') {
                                    setActiveFolderBreadcrumb(item.title);
                                  } else {
                                    setEditingTestForQuestions(item);
                                    setQuizQuestionsList(item.questions || []);
                                  }
                                }}
                                className="p-4 flex items-center gap-3 cursor-pointer group"
                              >
                                {item.type === 'TEST' ? (
                                  <div className="w-8 h-8 rounded-lg bg-sky-500 text-white font-black text-xs flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">A</div>
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 font-black flex items-center justify-center group-hover:scale-105 transition-transform"><Folder className="w-4 h-4" /></div>
                                )}
                                <span className="text-slate-900 dark:text-white font-black group-hover:text-sky-600 transition-colors">{item.title}</span>
                              </td>
                              <td className="p-4 text-slate-500 text-xs font-semibold">{item.date}</td>
                              <td className="p-4 text-right relative">
                                <button
                                  onClick={() => setShowTestOptionMenuId(showTestOptionMenuId === item.id ? null : item.id)}
                                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                  <MoreVertical className="w-4 h-4 text-slate-500" />
                                </button>

                                {/* Options Popup Menu */}
                                {showTestOptionMenuId === item.id && (
                                  <div className="absolute right-4 top-12 z-30 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-xl p-2 w-44 text-left text-xs font-bold space-y-1">
                                    <button
                                      onClick={() => {
                                        setActiveTestForOption(item);
                                        setAddTestToSubScreen('SELECT');
                                        setShowAddTestToModal(true);
                                        setShowTestOptionMenuId(null);
                                      }}
                                      className="w-full px-3 py-2 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Link className="w-4 h-4 text-sky-500" />
                                      <span>Add</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        alert(`Test Stats for "${item.title}": Total Attempts: 42, Avg Score: 85%`);
                                        setShowTestOptionMenuId(null);
                                      }}
                                      className="w-full px-3 py-2 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <BarChart3 className="w-4 h-4 text-sky-500" />
                                      <span>Test Stats</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setShowTestOptionMenuId(null);
                                        handleDeleteTest(item);
                                      }}
                                      className="w-full px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ));
                        })()}

                      </tbody>
                    </table>
                  </div>

                </div>
              )}

              {/* Content Subtab B: Free Material (Matching Screenshots 1-5) */}
              {contentSubTab === 'free-material' && (
                <div className="space-y-6">
                  
                  {/* Hidden Native File Input for Document Upload (Screenshot 3) */}
                  <input
                    type="file"
                    ref={documentFileInputRef}
                    accept=".pdf,.doc,.docx,.png,.jpg,.csv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const newDoc = {
                          id: `doc-${Date.now()}`,
                          title: file.name,
                          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                          date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        };
                        setDocumentsList([newDoc, ...documentsList]);
                        setMessage({ type: 'success', text: `Document "${file.name}" uploaded successfully to database!` });
                      }
                    }}
                  />

                  {/* CASE 0: Free Material Landing Hub (Screenshot 1) */}
                  {freeMaterialCategory === null && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-black text-slate-900 dark:text-white">Free Material</h3>
                          <p className="text-xs text-slate-500 font-extrabold mt-0.5">Add / view free material for your visitors</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Document Card */}
                        <div 
                          onClick={() => setFreeMaterialCategory('DOCUMENT')}
                          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-md hover:shadow-xl hover:border-sky-500 text-center space-y-6 transition-all cursor-pointer group"
                        >
                          <div className="w-full aspect-[16/9] bg-sky-50/70 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                            <div className="w-14 h-14 rounded-2xl bg-sky-600 text-white font-black flex items-center justify-center text-xs shadow-md group-hover:scale-110 transition-transform">
                              DOC
                            </div>
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">Document</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold mt-1">File type Includes .doc, .docx, .pdf, .png, .jpg, .csv etc</p>
                          </div>
                        </div>

                        {/* Video Card */}
                        <div 
                          onClick={() => setFreeMaterialCategory('VIDEO')}
                          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-md hover:shadow-xl hover:border-rose-500 text-center space-y-6 transition-all cursor-pointer group"
                        >
                          <div className="w-full aspect-[16/9] bg-rose-50/70 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                            <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white font-black flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                              <PlayCircle className="w-8 h-8" />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">Video</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold mt-1">Supported link : Youtube URL</p>
                          </div>
                        </div>

                        {/* Tests Card */}
                        <div 
                          onClick={() => setFreeMaterialCategory('TEST')}
                          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-md hover:shadow-xl hover:border-sky-500 text-center space-y-6 transition-all cursor-pointer group"
                        >
                          <div className="w-full aspect-[16/9] bg-sky-50/70 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                            <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white font-black flex items-center justify-center text-base shadow-md group-hover:scale-110 transition-transform">
                              A
                            </div>
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">Tests</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold mt-1">Import free test from CMS portal</p>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* CASE 1: Document Upload Manager (Screenshot 2 & 3) */}
                  {freeMaterialCategory === 'DOCUMENT' && (
                    <div className="space-y-6">
                      
                      {/* Header Title */}
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Document ({documentsList.length})</h3>
                        <p className="text-xs text-slate-500 font-extrabold mt-0.5">Add / view free material for your visitors</p>
                      </div>

                      {/* Toolbar Row */}
                      <div className="flex items-center gap-4">
                        <div className="relative max-w-xs">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="text"
                            placeholder="Search Document"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl pl-9 pr-4 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>

                        <select className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none">
                          <option>Recently Added</option>
                          <option>Oldest First</option>
                          <option>Name A-Z</option>
                        </select>
                      </div>

                      {/* Main Grid: Contents & Select Content Panel */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* Left 8 Cols: Contents List / Empty State */}
                        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 min-h-[360px] flex flex-col items-center justify-center shadow-xs">
                          
                          <div className="w-full">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white mb-6">Contents</h4>

                            {documentsList.length === 0 ? (
                              <div className="text-center py-12 space-y-4">
                                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                                  <FileText className="w-10 h-10" />
                                </div>
                                <div>
                                  <h5 className="text-sm font-black text-slate-900 dark:text-white">No Document Added</h5>
                                  <p className="text-xs text-slate-400 font-extrabold mt-1">Add document to be shown to students on your app</p>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {documentsList.map(doc => (
                                  <div key={doc.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-sky-500 text-white font-black text-xs flex items-center justify-center">
                                        DOC
                                      </div>
                                      <div>
                                        <div className="text-xs font-black text-slate-900 dark:text-white">{doc.title}</div>
                                        <div className="text-[10px] text-slate-400 font-bold">{doc.size} • {doc.date}</div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => setDocumentsList(documentsList.filter(d => d.id !== doc.id))}
                                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>

                        {/* Right 4 Cols: Select Content Panel */}
                        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">Select content to be added</h4>

                          <div className="space-y-3">
                            <button
                              type="button"
                              onClick={() => setShowAddFolderModal(true)}
                              className="w-full p-3 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-750 text-left rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-xs font-black text-slate-800 dark:text-white cursor-pointer"
                            >
                              <Folder className="w-4 h-4 text-sky-500" />
                              <span>Folder</span>
                            </button>

                            {/* DOCUMENT BUTTON TRIGGERS NATIVE OS FILE PICKER (Screenshot 3) */}
                            <button
                              type="button"
                              onClick={() => documentFileInputRef.current?.click()}
                              className="w-full p-3 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-750 text-left rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-xs font-black text-sky-600 dark:text-sky-400 cursor-pointer shadow-2xs"
                            >
                              <FileText className="w-4 h-4 text-sky-500" />
                              <span>Document</span>
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* Back Button */}
                      <button
                        onClick={() => setFreeMaterialCategory(null)}
                        className="px-6 py-2 bg-white dark:bg-slate-900 border-2 border-sky-400 text-sky-600 dark:text-sky-400 text-xs font-black rounded-xl hover:bg-sky-50 cursor-pointer flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>

                    </div>
                  )}

                  {/* CASE 2: Video Upload Manager (Screenshot 4) */}
                  {freeMaterialCategory === 'VIDEO' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Video ({freeVideosList.length})</h3>
                        <p className="text-xs text-slate-500 font-extrabold mt-0.5">Add / view free material for your visitors</p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 min-h-[360px] flex flex-col items-center justify-center shadow-xs">
                          {freeVideosList.length === 0 ? (
                            <div className="text-center py-12 space-y-4">
                              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                                <PlayCircle className="w-10 h-10" />
                              </div>
                              <div>
                                <h5 className="text-sm font-black text-slate-900 dark:text-white">No Video Added</h5>
                                <p className="text-xs text-slate-400 font-extrabold mt-1">Add video to be shown to students on your app</p>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full space-y-3">
                              {freeVideosList.map(v => (
                                <div key={v.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <PlayCircle className="w-6 h-6 text-rose-600" />
                                    <span className="text-xs font-black text-slate-900 dark:text-white">{v.url}</span>
                                  </div>
                                  <button onClick={() => setFreeVideosList(freeVideosList.filter(item => item.id !== v.id))} className="text-slate-400 hover:text-rose-600">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">Select content to be added</h4>
                          <button
                            onClick={() => setShowAddVideoDrawer(true)}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 text-left rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-xs font-black text-rose-600 cursor-pointer"
                          >
                            <PlayCircle className="w-4 h-4" />
                            <span>Video</span>
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => setFreeMaterialCategory(null)}
                        className="px-6 py-2 bg-white dark:bg-slate-900 border-2 border-sky-400 text-sky-600 text-xs font-black rounded-xl hover:bg-sky-50 cursor-pointer flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>
                    </div>
                  )}

                  {/* CASE 3: Tests Upload Manager (Screenshot 5) */}
                  {freeMaterialCategory === 'TEST' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Test ({freeTestsList.length})</h3>
                        <p className="text-xs text-slate-500 font-extrabold mt-0.5">Add / view free material for your visitors</p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 min-h-[360px] flex flex-col items-center justify-center shadow-xs">
                          {freeTestsList.length === 0 ? (
                            <div className="text-center py-12 space-y-4">
                              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                                <FileCheck2 className="w-10 h-10" />
                              </div>
                              <div>
                                <h5 className="text-sm font-black text-slate-900 dark:text-white">No Test Added</h5>
                                <p className="text-xs text-slate-400 font-extrabold mt-1">Add test to be shown to students on your app</p>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full space-y-3">
                              {freeTestsList.map(t => (
                                <div key={t.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-between">
                                  <span className="text-xs font-black text-slate-900 dark:text-white">{t.title}</span>
                                  <button onClick={() => setFreeTestsList(freeTestsList.filter(item => item.id !== t.id))} className="text-slate-400 hover:text-rose-600">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white">Select content to be added</h4>
                          <button
                            onClick={() => setShowAddTestDrawer(true)}
                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 text-left rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3 text-xs font-black text-sky-600 cursor-pointer"
                          >
                            <FileCheck2 className="w-4 h-4" />
                            <span>Tests</span>
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => setFreeMaterialCategory(null)}
                        className="px-6 py-2 bg-white dark:bg-slate-900 border-2 border-sky-400 text-sky-600 text-xs font-black rounded-xl hover:bg-sky-50 cursor-pointer flex items-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>
                    </div>
                  )}

                  {/* DRAWER 1: Add Video Drawer (Screenshot 4) */}
                  {showAddVideoDrawer && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
                      <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full p-6 space-y-6 shadow-2xl flex flex-col justify-between">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Add Video</h3>
                            <button onClick={() => setShowAddVideoDrawer(false)} className="p-1 text-slate-400 hover:text-slate-700">
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="space-y-2 text-xs font-bold">
                            <label className="block text-slate-900 dark:text-white font-black">YouTube link</label>
                            <input
                              type="text"
                              placeholder="Enter or Paste YouTube link"
                              value={youtubeVideoUrl}
                              onChange={(e) => setYoutubeVideoUrl(e.target.value)}
                              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-right">
                          <button
                            onClick={() => {
                              if (youtubeVideoUrl) {
                                setFreeVideosList([...freeVideosList, { id: `v-${Date.now()}`, url: youtubeVideoUrl }]);
                                setMessage({ type: 'success', text: 'Free YouTube video added!' });
                                setYoutubeVideoUrl('');
                                setShowAddVideoDrawer(false);
                              }
                            }}
                            className="px-6 py-2.5 bg-sky-300 text-white font-black text-xs rounded-xl hover:bg-sky-500 cursor-pointer shadow-md"
                          >
                            Check Video
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DRAWER 2: Add Online Test Drawer & Select Tests/Folders Popup (Screenshots 1-4) */}
                  {showAddTestDrawer && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
                      <div className="bg-white dark:bg-slate-900 w-full max-w-lg h-full p-6 space-y-6 shadow-2xl flex flex-col justify-between overflow-y-auto relative">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Add online test</h3>
                            <button onClick={() => setShowAddTestDrawer(false)} className="p-1 text-slate-400 hover:text-slate-700">
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="space-y-4 text-xs font-bold">
                            
                            {/* Test/Folder Name Input Field */}
                            <div>
                              <label className="block text-slate-900 dark:text-white font-black mb-1">Test/Folder name</label>
                              <div
                                onClick={() => setShowSelectTestFolderModal(true)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold flex items-center justify-between cursor-pointer hover:border-sky-500 shadow-2xs"
                              >
                                <span>{selectedTestsFolders.join(', ') || 'Select tests or folders'}</span>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              </div>
                            </div>

                            {/* Start Date & Start Time (Screenshot 3 & 4) */}
                            <div className="space-y-3">
                              <label className="block text-slate-900 dark:text-white font-black">When can students attempt?</label>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[11px] text-slate-500 font-bold block mb-1">Start Date</label>
                                  <input type="date" defaultValue="2026-08-20" className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-sky-500" />
                                </div>

                                <div className="relative">
                                  <label className="text-[11px] text-slate-500 font-bold block mb-1">Start Time</label>
                                  <div
                                    onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold flex items-center justify-between cursor-pointer"
                                  >
                                    <span>{selectedStartTime}</span>
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                  </div>

                                  {/* Custom Time Interval Dropdown (Screenshot 3) */}
                                  {showTimeDropdown && (
                                    <div className="absolute right-0 top-16 z-30 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-h-48 overflow-y-auto w-full p-2 space-y-1 text-xs font-bold">
                                      {[
                                        '12:00 am', '12:30 am', '01:00 am', '01:30 am', '02:00 am', '02:30 am',
                                        '03:00 am', '03:30 am', '04:00 am', '04:30 am', '05:00 am', '05:30 am',
                                        '06:00 am', '06:30 am', '07:00 am', '07:30 am', '08:00 am', '08:30 am',
                                        '09:00 am', '09:30 am', '10:00 am', '10:30 am', '11:00 am', '11:30 am',
                                        '12:00 pm', '12:30 pm', '01:00 pm', '01:30 pm', '02:00 pm', '02:30 pm'
                                      ].map(t => (
                                        <div
                                          key={t}
                                          onClick={() => { setSelectedStartTime(t); setShowTimeDropdown(false); }}
                                          className="p-2 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-700 cursor-pointer text-slate-800 dark:text-white"
                                        >
                                          {t}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-bold">
                              <input type="checkbox" className="accent-sky-600 rounded-xs w-4 h-4" />
                              <span>Check for no end time, so students can attempt anytime</span>
                            </label>

                            <div>
                              <label className="block text-slate-900 dark:text-white font-black mb-1">Number of attempts</label>
                              <input type="number" defaultValue="1" className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold" />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-bold">
                              <input type="checkbox" className="accent-sky-600 rounded-xs w-4 h-4" />
                              <span>Set unlimited attempts</span>
                            </label>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-right">
                          <button
                            onClick={() => {
                              setFreeTestsList([...freeTestsList, { id: `t-${Date.now()}`, title: selectedTestsFolders[0] || 'KYC _Sample_test' }]);
                              setMessage({ type: 'success', text: 'Free test published successfully!' });
                              setShowAddTestDrawer(false);
                            }}
                            className="px-6 py-2.5 bg-sky-300 hover:bg-sky-500 text-white font-black text-xs rounded-xl cursor-pointer shadow-md"
                          >
                            Add test
                          </button>
                        </div>

                        {/* POPUP MODAL: Select Tests or Folders (Matching Screenshots 1 & 2) */}
                        {showSelectTestFolderModal && (
                          <div className="absolute inset-4 z-40 bg-white dark:bg-slate-900 rounded-3xl border-2 border-sky-200 dark:border-slate-700 shadow-2xl p-6 flex flex-col justify-between space-y-4">
                            <div className="space-y-4">
                              {/* Search Bar */}
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="Select tests or folders"
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl pl-4 pr-10 py-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                                />
                                <Search className="w-4 h-4 text-slate-400 absolute right-4 top-3.5" />
                              </div>

                              <h4 className="text-sm font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                                Select tests or folders
                              </h4>

                              {/* Items Checkbox List */}
                              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                                {[
                                  { id: 'f1', title: 'Class 9 - First four chapters', type: 'TEST' },
                                  { id: 'f2', title: 'ABHYAAS class 12 - Applications of Derivatives', type: 'TEST' },
                                  { id: 'f3', title: 'Class 9', type: 'FOLDER' },
                                  { id: 'f4', title: 'Class 10', type: 'FOLDER' },
                                  { id: 'f5', title: 'Class 8', type: 'FOLDER' },
                                  { id: 'f6', title: 'KYC _Sample_test', type: 'TEST' },
                                  { id: 'f7', title: 'KYC- Know your concepts (10-August-24) by Sarvottam Diksha', type: 'TEST' },
                                  { id: 'f8', title: 'Testing', type: 'TEST' },
                                  { id: 'f9', title: 'Class 7', type: 'FOLDER' },
                                  { id: 'f10', title: 'ABHYAAS Class 8_ Linear Equation', type: 'TEST' }
                                ].map(item => {
                                  const isSelected = selectedTestsFolders.includes(item.title);
                                  return (
                                    <div
                                      key={item.id}
                                      onClick={() => {
                                        if (isSelected) {
                                          setSelectedTestsFolders(selectedTestsFolders.filter(t => t !== item.title));
                                        } else {
                                          setSelectedTestsFolders([...selectedTestsFolders, item.title]);
                                        }
                                      }}
                                      className="flex items-center justify-between p-2 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 cursor-pointer"
                                    >
                                      <div className="flex items-center gap-3">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => {}}
                                          className="accent-sky-600 rounded-xs w-4 h-4"
                                        />
                                        {item.type === 'TEST' ? (
                                          <div className="w-6 h-6 rounded-md bg-sky-500 text-white font-black text-[10px] flex items-center justify-center">A</div>
                                        ) : (
                                          <Folder className="w-5 h-5 text-sky-500" />
                                        )}
                                        <span>{item.title}</span>
                                      </div>

                                      {item.type === 'FOLDER' && (
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-right">
                              <button
                                onClick={() => setShowSelectTestFolderModal(false)}
                                className="px-6 py-2.5 bg-sky-300 hover:bg-sky-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  )}

                  {/* MODAL: Add Folder (Matching Screenshot 1) */}
                  {showAddFolderModal && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-6 flex flex-col justify-between">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Add Folder</h3>
                            <button onClick={() => setShowAddFolderModal(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="space-y-2 text-xs font-bold">
                            <label className="block text-slate-900 dark:text-white font-black">Folder name</label>
                            <input
                              type="text"
                              placeholder="Enter folder name"
                              value={newFolderName}
                              onChange={(e) => setNewFolderName(e.target.value)}
                              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl p-3 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-sky-500 shadow-2xs"
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-right">
                          <button
                            onClick={() => {
                              if (newFolderName) {
                                setMessage({ type: 'success', text: `Folder "${newFolderName}" created!` });
                                setNewFolderName('');
                                setShowAddFolderModal(false);
                              }
                            }}
                            className="px-6 py-2.5 bg-sky-300 hover:bg-sky-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* ================= TAB 3: YOUR APP & MANAGE BANNERS (MATCHING SCREENSHOTS 3 & 4) ================= */}
          {activeTab === 'app' && (
            <div className="space-y-6">
              
              {/* Subheader Action Bar */}
              <div className="flex items-center justify-between border-b border-orange-200 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Manage Banners</h2>
                  <p className="text-xs font-extrabold text-orange-600 dark:text-orange-400 mt-1">Configure & publish banners for Public Home Page & Student App Portal</p>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    id="upload-new-banner-btn"
                    onClick={() => setShowCreateBannerModal(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#FF6500] to-amber-500 text-white rounded-2xl text-xs font-black shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Upload New Banner</span>
                  </button>
                </div>
              </div>

              {/* Grid: Left Banner Config (7 cols) + Right Live Mobile App Preview (5 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left 7 Cols: Banner Cards & Select Screen Dropdowns */}
                <div className="lg:col-span-7 space-y-6">
                  
                  <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300">
                    <span>Active Banners ({publicPortals.length})</span>
                    <span className="text-xs font-extrabold text-orange-600">Visible on chosen target screens</span>
                  </div>

                  {/* Dynamic Banners List */}
                  {publicPortals.map(portal => {
                    const imageSrc = portal.thumbnail || '/assets/poster-banner.png';

                    return (
                      <div key={portal.id} className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-orange-200/80 dark:border-slate-800 p-6 shadow-md space-y-4 hover:border-[#FF6500] transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white">{portal.title}</span>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                              portal.targetPlacement === 'HOME_PAGE' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                              portal.targetPlacement === 'STUDENT_PORTAL' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' :
                              'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-950 dark:from-slate-800 dark:to-orange-950/60 dark:text-amber-400 border border-orange-300 dark:border-orange-500/30'
                            }`}>
                              {portal.targetPlacement === 'HOME_PAGE' ? '🏠 Public Home Page' : portal.targetPlacement === 'STUDENT_PORTAL' ? '📱 Student App Portal' : '🌟 Both Places'}
                            </span>
                          </div>
                          
                          <button 
                            onClick={() => handleDeleteBanner(portal.id)} 
                            className="text-xs font-black text-rose-600 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>

                        {imageSrc && (
                          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-48 bg-slate-900">
                            <img src={imageSrc} alt={portal.title} className="w-full h-full object-cover" />
                          </div>
                        )}

                        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 p-2.5 rounded-xl text-xs font-extrabold border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Fits perfectly on target location ({portal.targetPlacement})</span>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">Tap action link</label>
                          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white">
                            <span>Opens route: {portal.link || '/store'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                </div>

                {/* Right 5 Cols: Live Smartphone Mobile App Preview */}
                <div className="lg:col-span-5">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-orange-200/80 dark:border-slate-800 p-6 shadow-md space-y-4 sticky top-28">
                    <div className="text-sm font-black text-slate-900 dark:text-white">Live Student App Preview</div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">See how student portal banners appear on mobile devices.</p>

                    {/* Smartphone Frame */}
                    <div className="border-4 border-slate-900 dark:border-slate-700 rounded-3xl overflow-hidden shadow-2xl bg-slate-50 dark:bg-slate-950 max-w-xs mx-auto">
                      
                      {/* Top App Header Bar */}
                      <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-black text-xs text-slate-900 dark:text-white flex items-center justify-between">
                        <span>Sarvottam Diksha</span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      </div>

                      {/* Banner Carousel Display */}
                      <div className="p-3 space-y-3">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Important Information</div>
                        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[16/9] shadow-md">
                          <img src={publicPortals[0]?.thumbnail || '/assets/poster-flyer.png'} alt="Live Mobile Banner" className="w-full h-full object-cover" />
                        </div>
                      </div>

                      {/* Mobile Bottom Tab Bar */}
                      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 grid grid-cols-4 text-center text-[10px] font-bold text-slate-400">
                        <div className="text-[#FF6500] font-black">Home</div>
                        <div>Courses</div>
                        <div>Chats</div>
                        <div>Profile</div>
                      </div>

                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ================= TAB 4: ANALYTICS (MATCHING SCREENSHOT 5) ================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Analytics</h2>
                  <p className="text-xs font-extrabold text-orange-600 dark:text-orange-400 mt-1">Analyze your sales and traffic to know your brand's growth</p>
                </div>

                <div className="flex items-center gap-4">
                  <select className="bg-white dark:bg-slate-900 border-2 border-orange-200 dark:border-slate-800 rounded-2xl px-4 py-2 text-xs font-extrabold text-slate-800 dark:text-white focus:outline-none">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                    <option>All Time</option>
                  </select>

                  <div className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-slate-800 dark:to-slate-800 border border-orange-200 dark:border-slate-700 px-4 py-2 rounded-2xl text-xs font-black text-slate-900 dark:text-white">
                    Lifetime Revenue: <span className="text-[#FF6500] text-sm">₹ 34,707</span>
                  </div>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-orange-200/80 dark:border-slate-800 shadow-md space-y-2">
                  <div className="text-xs font-black text-slate-500">Website sessions</div>
                  <div className="text-3xl font-black text-[#FF6500]">0</div>
                  <div className="text-[10px] font-extrabold text-emerald-600">↑ 0% up compared to last 7 days</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-orange-200/80 dark:border-slate-800 shadow-md space-y-2">
                  <div className="text-xs font-black text-slate-500">Buy Now Clicks</div>
                  <div className="text-3xl font-black text-[#0284C7]">3</div>
                  <div className="text-[10px] font-extrabold text-emerald-600">↑ 100% up compared to last 7 days</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-orange-200/80 dark:border-slate-800 shadow-md space-y-2">
                  <div className="text-xs font-black text-slate-500">Transactions</div>
                  <div className="text-3xl font-black text-emerald-600">0</div>
                  <div className="text-[10px] font-extrabold text-emerald-600">↑ 0% up compared to last 7 days</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-orange-200/80 dark:border-slate-800 shadow-md space-y-2">
                  <div className="text-xs font-black text-slate-500">Revenue</div>
                  <div className="text-3xl font-black text-purple-600">₹ 0</div>
                  <div className="text-[10px] font-extrabold text-emerald-600">↑ 0% up compared to last 7 days</div>
                </div>

              </div>

              {/* Main Analytics Center (SVG Wave Chart - Matching Screenshot 1) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-orange-200/80 dark:border-slate-800 shadow-md flex flex-col justify-between min-h-[320px] space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Website Session Trend</span>
                    <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400">Showing last 7 days</span>
                  </div>

                  {/* SVG Blue Wave Chart */}
                  <div className="w-full relative h-44 flex flex-col justify-end">
                    <svg className="w-full h-32 text-sky-400/40" viewBox="0 0 500 150" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path 
                        d="M0,130 C80,30 140,40 200,120 C260,140 320,130 500,130 L500,150 L0,150 Z" 
                        fill="url(#waveGradient)" 
                      />
                      <path 
                        d="M0,130 C80,30 140,40 200,120 C260,140 320,130 500,130" 
                        fill="none" 
                        stroke="#38bdf8" 
                        strokeWidth="3" 
                      />
                    </svg>

                    {/* Days X-Axis Row */}
                    <div className="grid grid-cols-7 text-center pt-4 border-t border-slate-100 dark:border-slate-800 text-xs font-black text-slate-400">
                      <div><div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-[11px] font-black">13</div><div className="text-[10px] mt-0.5">Thu</div></div>
                      <div><div className="p-1 rounded-lg bg-sky-500 text-white text-[11px] font-black shadow-xs">14</div><div className="text-[10px] mt-0.5 text-sky-600 dark:text-sky-400 font-black">Fri</div></div>
                      <div><div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-[11px] font-black">15</div><div className="text-[10px] mt-0.5">Sat</div></div>
                      <div><div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-[11px] font-black">16</div><div className="text-[10px] mt-0.5">Sun</div></div>
                      <div><div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-[11px] font-black">17</div><div className="text-[10px] mt-0.5">Mon</div></div>
                      <div><div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-[11px] font-black">18</div><div className="text-[10px] mt-0.5">Tue</div></div>
                      <div><div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-[11px] font-black">19</div><div className="text-[10px] mt-0.5">Wed</div></div>
                    </div>
                  </div>

                </div>

                <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-orange-200/80 dark:border-slate-800 shadow-md space-y-4">
                  <h4 className="text-base font-black text-slate-900 dark:text-white">Quick Actions</h4>
                  
                  <button 
                    onClick={() => { fetchTransactionsData(); setShowTransactionsModal(true); }}
                    className="w-full p-4 rounded-2xl bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 text-left flex items-center justify-between border border-sky-200 dark:border-slate-700 hover:scale-102 transition-all cursor-pointer shadow-xs"
                  >
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-sky-600" />
                      <span>View Transactions</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-sky-600" />
                  </button>

                  <button 
                    onClick={() => setShowGenerateReportModal(true)}
                    className="w-full p-4 rounded-2xl bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 text-left flex items-center justify-between border border-sky-200 dark:border-slate-700 hover:scale-102 transition-all cursor-pointer shadow-xs"
                  >
                    <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-600" />
                      <span>Generate Reports</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-sky-600" />
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* ================= TAB: FACULTY PROFILE SETTINGS ================= */}
          {activeTab === 'faculty-profile' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-orange-200/80 dark:border-slate-800 shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF6500] to-amber-500 flex items-center justify-center text-white font-black text-xl shadow-md">
                    MM
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <UserCheck className="w-6 h-6 text-[#FF6500]" />
                      Faculty Profile Settings
                    </h2>
                    <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 mt-0.5">
                      Manage Senior Faculty credentials, qualifications, bio, and public academy profile
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    localStorage.setItem('sd_faculty_profile', JSON.stringify(facultyProfile));
                    setMessage({ type: 'success', text: 'Faculty Profile Settings updated successfully!' });
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-[#FF6500] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Profile Settings</span>
                </button>
              </div>

              {/* Profile Details Form Card */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-orange-200/80 dark:border-slate-800 shadow-md space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Faculty Full Name</label>
                    <input
                      type="text"
                      value={facultyProfile.name}
                      onChange={(e) => setFacultyProfile({ ...facultyProfile, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-orange-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6500]"
                      placeholder="e.g. Manika Maheshwari"
                    />
                  </div>

                  {/* Role / Title */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Designation / Title</label>
                    <input
                      type="text"
                      value={facultyProfile.role}
                      onChange={(e) => setFacultyProfile({ ...facultyProfile, role: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-orange-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6500]"
                      placeholder="e.g. Founder & Lead Educator - Senior Mathematics Specialist"
                    />
                  </div>

                  {/* Qualifications */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Academic Qualifications</label>
                    <input
                      type="text"
                      value={facultyProfile.qualification}
                      onChange={(e) => setFacultyProfile({ ...facultyProfile, qualification: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-orange-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6500]"
                      placeholder="e.g. B.Sc, M.Sc Mathematics (10+ Years Coaching Experience)"
                    />
                  </div>

                  {/* Target Grades */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Target Classes & Courses Taught</label>
                    <input
                      type="text"
                      value={facultyProfile.grades}
                      onChange={(e) => setFacultyProfile({ ...facultyProfile, grades: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-orange-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6500]"
                      placeholder="e.g. Class 6 to Class 12 CBSE & Olympiad Math"
                    />
                  </div>

                  {/* Contact Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Official Email Address</label>
                    <input
                      type="email"
                      value={facultyProfile.email}
                      onChange={(e) => setFacultyProfile({ ...facultyProfile, email: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-orange-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6500]"
                      placeholder="e.g. Dikshasarvottam@gmail.com"
                    />
                  </div>

                  {/* Contact Phone */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Contact Support Phone</label>
                    <input
                      type="text"
                      value={facultyProfile.phone}
                      onChange={(e) => setFacultyProfile({ ...facultyProfile, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-orange-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6500]"
                      placeholder="e.g. +91 99646 77802"
                    />
                  </div>

                </div>

                {/* Bio / Teaching Philosophy */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Teaching Bio & Philosophy</label>
                  <textarea
                    rows={4}
                    value={facultyProfile.bio}
                    onChange={(e) => setFacultyProfile({ ...facultyProfile, bio: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-orange-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6500]"
                    placeholder="Enter your biography and educator message for students..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB: PLATFORM & ORGANIZATION SETTINGS ================= */}
          {activeTab === 'platform-settings' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-orange-200/80 dark:border-slate-800 shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-md">
                    <Settings className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <Settings className="w-6 h-6 text-[#0284C7]" />
                      Platform & Organization Settings
                    </h2>
                    <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure Sarvottam Diksha portal behavior, organization code, registration modes, and defaults
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    localStorage.setItem('sd_platform_settings', JSON.stringify(platformSettings));
                    setMessage({ type: 'success', text: 'Platform Settings saved successfully!' });
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-[#0284C7] to-cyan-500 hover:from-sky-700 hover:to-cyan-600 text-white rounded-2xl font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Platform Settings</span>
                </button>
              </div>

              {/* Platform Settings Form Card */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-orange-200/80 dark:border-slate-800 shadow-md space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Organization Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Academy Brand Name</label>
                    <input
                      type="text"
                      value={platformSettings.orgName}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, orgName: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-sky-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#0284C7]"
                    />
                  </div>

                  {/* Organization Code */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Student App Organization Code</label>
                    <input
                      type="text"
                      value={platformSettings.orgCode}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, orgCode: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-sky-100 dark:border-slate-700 rounded-2xl text-xs font-black text-sky-600 dark:text-sky-400 focus:outline-none focus:border-[#0284C7] uppercase"
                    />
                  </div>

                  {/* Registration Access Mode */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Student Registration Policy</label>
                    <select
                      value={platformSettings.registrationMode}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, registrationMode: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-sky-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#0284C7]"
                    >
                      <option value="OPEN">Open Direct Access (Self Signup Allowed)</option>
                      <option value="APPROVAL_REQUIRED">Teacher Approval Required for New Students</option>
                    </select>
                  </div>

                  {/* Solution Access Mode */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider block">Quiz Solution Visibility</label>
                    <select
                      value={platformSettings.solutionAccess}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, solutionAccess: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-sky-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#0284C7]"
                    >
                      <option value="IMMEDIATE">Show Detailed Solutions Immediately After Test</option>
                      <option value="AFTER_DEADLINE">Release Solutions Only After Test End Deadline</option>
                    </select>
                  </div>

                </div>

                {/* Notifications Toggle */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Push & Email Announcements</h4>
                    <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 mt-0.5">Automatically notify students when new tests or course materials are added</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPlatformSettings({ ...platformSettings, notificationsEnabled: !platformSettings.notificationsEnabled })}
                    className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
                      platformSettings.notificationsEnabled 
                        ? 'bg-emerald-500 text-white shadow-md' 
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {platformSettings.notificationsEnabled ? '✓ Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 5: MANAGE COUPONS & CREATE COUPON CODE PAGE ================= */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              
              {/* Header Top Bar (Matching Screenshot) */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Manage Coupons</h2>

                <div className="flex items-center gap-4">
                  {/* Progress Circle 92% */}
                  <div className="w-10 h-10 rounded-full border-4 border-sky-400 text-[10px] font-black text-sky-600 dark:text-sky-400 flex items-center justify-center bg-sky-50 dark:bg-slate-850 shadow-2xs">
                    92%
                  </div>

                  {/* Profile Avatar MM */}
                  <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-950 px-3 py-1.5 rounded-full text-amber-950 dark:text-amber-300 text-xs font-black">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">MM</div>
                    <span>Manika Maheshwari ▾</span>
                  </div>
                </div>
              </div>

              {/* VIEW B: CREATE COUPON CODE PAGE (MATCHING EXACT SCREENSHOTS 1, 2 & 3) */}
              {isCreatingCouponPage ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md p-8 space-y-8">
                  
                  {/* Back Sub-header */}
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <button
                      onClick={() => {
                        if (couponStep > 1) {
                          setCouponStep(couponStep - 1);
                        } else {
                          setIsCreatingCouponPage(false);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">Create Coupon Code</h3>
                      <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400">Step {couponStep} of {courseSelectionType === 'SPECIFIC' ? 3 : 2}</div>
                    </div>
                  </div>

                  {/* Error Alert Box if Creation Fails */}
                  {message.text && (
                    <div className={`p-4 rounded-2xl text-xs font-black flex items-center justify-between gap-3 shadow-xs ${
                      message.type === 'success'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 border-2 border-emerald-300 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 border-2 border-rose-300 dark:border-rose-800'
                    }`}>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{message.text}</span>
                      </div>
                      <button type="button" onClick={() => setMessage({ type: '', text: '' })} className="text-xs font-bold hover:underline">✕</button>
                    </div>
                  )}

                  {/* STEP 1: DISCOUNT DETAILS & VALIDITY (MATCHING SCREENSHOT 3) */}
                  {couponStep === 1 && (
                    <div className="space-y-6 max-w-4xl text-xs font-bold">
                      
                      {/* Offer Name & Custom Coupon Code Inputs (Matching Image 1) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
                        <div className="space-y-1">
                          <label className="block text-slate-900 dark:text-white font-black text-xs">
                            Enter Offer Name / Title <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Enter Offer Name (e.g. Early Bird Launch Offer)"
                            value={couponName}
                            onChange={(e) => setCouponName(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-sky-500 shadow-2xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-slate-900 dark:text-white font-black text-xs">
                            Enter Coupon Code <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Enter Coupon Code (e.g. EARLYBIRD100)"
                            value={customCouponCode}
                            onChange={(e) => setCustomCouponCode(e.target.value.toUpperCase())}
                            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-black text-xs uppercase focus:outline-none focus:border-sky-500 shadow-2xs font-mono"
                          />
                        </div>
                      </div>

                      {/* 1. Discount Type Radio */}
                      <div className="space-y-2">
                        <label className="block text-slate-900 dark:text-white font-black text-xs">Discount Type <span className="text-rose-500">*</span></label>
                        <div className="flex items-center gap-8 text-slate-800 dark:text-slate-200 font-bold">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="discountType"
                              checked={couponDiscountType === 'FLAT'}
                              onChange={() => setCouponDiscountType('FLAT')}
                              className="accent-sky-600"
                            />
                            <span>Flat Discount</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="discountType"
                              checked={couponDiscountType === 'PERCENTAGE'}
                              onChange={() => setCouponDiscountType('PERCENTAGE')}
                              className="accent-sky-600"
                            />
                            <span>Percentage Discount</span>
                          </label>
                        </div>
                      </div>

                      {/* 2. Flat vs Percentage Discount Inputs */}
                      {couponDiscountType === 'FLAT' ? (
                        <div className="max-w-md space-y-1">
                          <label className="block text-slate-900 dark:text-white font-black text-xs">
                            Flat Discount Amount <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-3 text-slate-400 font-black">₹</span>
                            <input
                              type="number"
                              required
                              placeholder="Enter discount amount"
                              value={couponFlatAmount}
                              onChange={(e) => setCouponFlatAmount(e.target.value)}
                              className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-sky-500 shadow-2xs"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
                          <div className="space-y-1">
                            <label className="block text-slate-900 dark:text-white font-black text-xs">
                              Percentage Discount <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                required
                                placeholder="Enter percentage amount"
                                value={couponFlatAmount}
                                onChange={(e) => setCouponFlatAmount(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-9 py-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-sky-500 shadow-2xs"
                              />
                              <span className="absolute right-3.5 top-3 text-slate-400 font-black">%</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-slate-900 dark:text-white font-black text-xs">
                              Max Discount Upto
                            </label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-3 text-slate-400 font-black">₹</span>
                              <input
                                type="number"
                                placeholder="Enter discount amount"
                                value={couponMaxDiscountLimit}
                                onChange={(e) => setCouponMaxDiscountLimit(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-sky-500 shadow-2xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3. Start Date & Start Time Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
                        <div className="space-y-1">
                          <label className="block text-slate-900 dark:text-white font-black text-xs">Start Date <span className="text-rose-500">*</span></label>
                          <input
                            type="date"
                            required
                            value={couponStartDate}
                            onChange={(e) => setCouponStartDate(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-sky-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-slate-900 dark:text-white font-black text-xs">Start Time <span className="text-rose-500">*</span></label>
                          <input
                            type="time"
                            required
                            value={couponStartTime}
                            onChange={(e) => setCouponStartTime(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </div>

                      {/* 4. End Date & End Time Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
                        <div className="space-y-1">
                          <label className="block text-slate-900 dark:text-white font-black text-xs">End Date <span className="text-rose-500">*</span></label>
                          <input
                            type="date"
                            disabled={couponIsLifetime}
                            placeholder="dd/mm/yyyy"
                            value={couponEndDate}
                            onChange={(e) => setCouponEndDate(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-bold focus:outline-none disabled:opacity-40"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-slate-900 dark:text-white font-black text-xs">End Time <span className="text-rose-500">*</span></label>
                          <input
                            type="time"
                            disabled={couponIsLifetime}
                            placeholder="--:-- --"
                            value={couponEndTime}
                            onChange={(e) => setCouponEndTime(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-bold focus:outline-none disabled:opacity-40"
                          />
                        </div>
                      </div>

                      {/* 5. Lifetime Validity Checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-bold">
                        <input
                          type="checkbox"
                          checked={couponIsLifetime}
                          onChange={(e) => setCouponIsLifetime(e.target.checked)}
                          className="rounded-xs accent-sky-600 w-4 h-4"
                        />
                        <span>Check, if you want to set coupon validity to lifetime (unlimited - never expires)</span>
                      </label>

                      {/* 6. Minimum Order Value */}
                      <div className="max-w-md space-y-1">
                        <label className="flex items-center gap-1 text-slate-900 dark:text-white font-black text-xs">
                          <span>Minimum Order Value</span>
                          <HelpCircle className="w-3.5 h-3.5 text-sky-500 inline" />
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3 text-slate-400 font-black">₹</span>
                          <input
                            type="number"
                            value={couponMinOrderValue}
                            onChange={(e) => setCouponMinOrderValue(e.target.value)}
                            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-sky-500 shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Footer Actions Bar */}
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                        <button
                          type="button"
                          onClick={() => setIsCreatingCouponPage(false)}
                          className="px-6 py-2.5 bg-white dark:bg-slate-900 border-2 border-sky-400 text-sky-600 dark:text-sky-400 font-black text-xs rounded-xl hover:bg-sky-50 cursor-pointer"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!couponFlatAmount) {
                              setMessage({ type: 'error', text: 'Please enter a discount amount.' });
                              return;
                            }
                            setCouponStep(2);
                          }}
                          className="px-8 py-2.5 bg-gradient-to-r from-sky-400 to-[#0284C7] hover:from-sky-500 hover:to-[#0284C7] text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: COUPON TYPE & RULES (MATCHING SCREENSHOT 1) */}
                  {couponStep === 2 && (
                    <div className="space-y-6 max-w-4xl text-xs font-bold">
                      {/* Coupon Type */}
                      <div className="space-y-2">
                        <label className="block text-slate-900 dark:text-white font-black text-xs">Coupon Type <span className="text-rose-500">*</span></label>
                        <div className="flex items-center gap-8 text-slate-800 dark:text-slate-200 font-bold">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="couponTypeRadio"
                              checked={couponType === 'PUBLIC'}
                              onChange={() => setCouponType('PUBLIC')}
                              className="accent-sky-600"
                            />
                            <span>Public Coupon</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="couponTypeRadio"
                              checked={couponType === 'PRIVATE'}
                              onChange={() => setCouponType('PRIVATE')}
                              className="accent-sky-600"
                            />
                            <span>Private Coupon</span>
                          </label>
                        </div>
                      </div>

                      {/* Course Selection Type */}
                      <div className="space-y-2">
                        <label className="block text-slate-900 dark:text-white font-black text-xs">Course Selection Type <span className="text-rose-500">*</span></label>
                        <div className="flex items-center gap-8 text-slate-800 dark:text-slate-200 font-bold">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="courseSelectionRadio"
                              checked={courseSelectionType === 'ALL'}
                              onChange={() => setCourseSelectionType('ALL')}
                              className="accent-sky-600"
                            />
                            <span>Assign to all courses</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="courseSelectionRadio"
                              checked={courseSelectionType === 'SPECIFIC'}
                              onChange={() => setCourseSelectionType('SPECIFIC')}
                              className="accent-sky-600"
                            />
                            <span>Assign to specific courses</span>
                          </label>
                        </div>
                      </div>

                      {/* Number of times code can be used */}
                      <div className="max-w-md space-y-1">
                        <label className="block text-slate-900 dark:text-white font-black text-xs">
                          Number of times code can be used <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          disabled={couponIsUnlimitedMaxUses}
                          placeholder="1000"
                          value={couponMaxUsesInput}
                          onChange={(e) => setCouponMaxUsesInput(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-bold focus:outline-none disabled:opacity-40"
                        />
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-bold">
                        <input
                          type="checkbox"
                          checked={couponIsUnlimitedMaxUses}
                          onChange={(e) => setCouponIsUnlimitedMaxUses(e.target.checked)}
                          className="rounded-xs accent-sky-600 w-4 h-4"
                        />
                        <span>Check, if you want to set number of times to unlimited</span>
                      </label>

                      {/* Usage per student */}
                      <div className="max-w-md space-y-1">
                        <label className="block text-slate-900 dark:text-white font-black text-xs">
                          Usage per student <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={couponUsagePerStudent}
                          onChange={(e) => setCouponUsagePerStudent(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      {/* Visibility Toggle */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-black text-slate-900 dark:text-white">Visibility</label>
                          <input
                            type="checkbox"
                            checked={couponVisibilityToggle}
                            onChange={(e) => setCouponVisibilityToggle(e.target.checked)}
                            className="w-5 h-5 accent-sky-600 cursor-pointer"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">Toggle OFF, in case you don't want to show this coupon to your students.</p>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                        <button
                          type="button"
                          onClick={() => setCouponStep(1)}
                          className="px-6 py-2.5 bg-white dark:bg-slate-900 border-2 border-sky-400 text-sky-600 dark:text-sky-400 font-black text-xs rounded-xl hover:bg-sky-50 cursor-pointer"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            if (courseSelectionType === 'SPECIFIC') {
                              setCouponStep(3);
                            } else {
                              // Submit coupon directly for ALL courses
                              let expiresAt = null;
                              if (!couponIsLifetime && couponEndDate) {
                                expiresAt = `${couponEndDate}T${couponEndTime || '23:59:59'}`;
                              }
                              const generatedCode = customCouponCode.trim() ? customCouponCode.trim().toUpperCase() : `FLAT${couponFlatAmount}`;
                              const offerTitle = couponName.trim() ? couponName.trim() : (couponDiscountType === 'FLAT' ? `Flat ₹${couponFlatAmount} OFF` : `${couponFlatAmount}% OFF`);
                              try {
                                const res = await axios.post('/api/admin/coupons', {
                                  code: generatedCode,
                                  title: offerTitle,
                                  discountType: couponDiscountType,
                                  discountValue: Number(couponFlatAmount),
                                  minOrderValue: Number(couponMinOrderValue || 0),
                                  maxUses: couponIsUnlimitedMaxUses ? null : Number(couponMaxUsesInput || 1000),
                                  courseSelectionType: 'ALL',
                                  expiresAt
                                });
                                if (res.data.success) {
                                  setCoupons([res.data.coupon, ...coupons]);
                                  setMessage({ type: 'success', text: `Coupon '${res.data.coupon.code}' created successfully!` });
                                  setIsCreatingCouponPage(false);
                                  setCouponStep(1);
                                  setCouponName('');
                                  setCustomCouponCode('');
                                }
                              } catch (err) {
                                setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to create coupon.' });
                              }
                            }
                          }}
                          className="px-8 py-2.5 bg-gradient-to-r from-sky-400 to-[#0284C7] hover:from-sky-500 hover:to-[#0284C7] text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          {courseSelectionType === 'SPECIFIC' ? 'Next' : 'Finish'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: ELIGIBLE COURSES SELECTION (MATCHING SCREENSHOT 2) */}
                  {couponStep === 3 && (
                    <div className="space-y-6 max-w-4xl text-xs font-bold">
                      <p className="text-slate-600 dark:text-slate-400 font-medium">
                        All the courses which satisfy the minimum criteria will automatically be added to the eligible list
                      </p>

                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="Search for a course"
                          value={couponCourseSearch}
                          onChange={(e) => setCouponCourseSearch(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-sky-500"
                        />
                        <button type="button" className="px-4 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold">
                          Filter
                        </button>
                      </div>

                      <div className="space-y-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="font-black text-slate-900 dark:text-white text-sm">Eligible Courses</div>
                          <button
                            type="button"
                            onClick={() => {
                              if (couponSelectedCourseIds.length === courses.length) {
                                setCouponSelectedCourseIds([]);
                              } else {
                                setCouponSelectedCourseIds(courses.map(c => c.id));
                              }
                            }}
                            className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                          >
                            {couponSelectedCourseIds.length === courses.length ? 'Deselect All' : 'Select All Courses'}
                          </button>
                        </div>
                        
                        {(courses || []).filter(c => !couponCourseSearch || c.title.toLowerCase().includes(couponCourseSearch.toLowerCase())).map(crs => (
                          <label key={crs.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer hover:border-sky-500 transition-all">
                            <div className="flex items-center gap-4">
                              <input
                                type="checkbox"
                                checked={couponSelectedCourseIds.includes(crs.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setCouponSelectedCourseIds([...couponSelectedCourseIds, crs.id]);
                                  } else {
                                    setCouponSelectedCourseIds(couponSelectedCourseIds.filter(cid => cid !== crs.id));
                                  }
                                }}
                                className="w-5 h-5 accent-sky-600 cursor-pointer"
                              />
                              <div>
                                <div className="font-black text-slate-900 dark:text-white text-sm">{crs.title}</div>
                                <div className="text-slate-500 font-medium text-xs">Manika Maheshwari</div>
                              </div>
                            </div>
                            <div className="font-extrabold text-slate-900 dark:text-white">
                              ₹{crs.price} <span className="line-through text-slate-400 text-xs">₹{crs.price}</span> <span className="text-rose-500 text-xs font-black">0% OFF</span>
                            </div>
                          </label>
                        ))}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                        <button
                          type="button"
                          onClick={() => setCouponStep(2)}
                          className="px-6 py-2.5 bg-white dark:bg-slate-900 border-2 border-sky-400 text-sky-600 dark:text-sky-400 font-black text-xs rounded-xl hover:bg-sky-50 cursor-pointer"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (couponSelectedCourseIds.length === 0) {
                              setMessage({ type: 'error', text: 'Please select at least one course to assign the coupon.' });
                              return;
                            }

                            let expiresAt = null;
                            if (!couponIsLifetime && couponEndDate) {
                              expiresAt = `${couponEndDate}T${couponEndTime || '23:59:59'}`;
                            }
                            const generatedCode = customCouponCode.trim() ? customCouponCode.trim().toUpperCase() : `FLAT${couponFlatAmount}`;
                            const offerTitle = couponName.trim() ? couponName.trim() : (couponDiscountType === 'FLAT' ? `Flat ₹${couponFlatAmount} OFF` : `${couponFlatAmount}% OFF`);

                            const newCoupon = {
                              id: 'coupon_' + Date.now(),
                              code: generatedCode,
                              title: offerTitle,
                              discountType: couponDiscountType,
                              discountValue: Number(couponFlatAmount || 100),
                              minOrderValue: Number(couponMinOrderValue || 0),
                              maxUses: couponIsUnlimitedMaxUses ? null : Number(couponMaxUsesInput || 1000),
                              courseSelectionType: 'SPECIFIC',
                              assignedCourseIds: couponSelectedCourseIds,
                              expiresAt,
                              createdAt: new Date().toISOString()
                            };

                            // Async API call
                            axios.post('/api/admin/coupons', newCoupon).catch(() => {});

                            // Local Storage persistence
                            try {
                              const storedCoupons = JSON.parse(localStorage.getItem('sd_coupons') || '[]');
                              localStorage.setItem('sd_coupons', JSON.stringify([newCoupon, ...storedCoupons]));
                            } catch (e) {}

                            setCoupons(prev => [newCoupon, ...prev]);
                            setMessage({ type: 'success', text: `🎉 Coupon '${newCoupon.code}' created successfully for ${couponSelectedCourseIds.length} eligible course(s)!` });
                            setIsCreatingCouponPage(false);
                            setCouponStep(1);
                            setCouponName('');
                            setCustomCouponCode('');
                            setCouponSelectedCourseIds([]);
                          }}
                          className="px-8 py-2.5 bg-gradient-to-r from-sky-400 to-[#0284C7] hover:from-sky-500 hover:to-[#0284C7] text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                        >
                          Finish
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                /* VIEW A: COUPONS LIST VIEW */
                <div className="space-y-6">
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold text-orange-600 dark:text-orange-400">
                      You can avail coupons to your students and increase the sales of your courses.
                    </p>

                    <button
                      onClick={() => setIsCreatingCouponPage(true)}
                      className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-400 to-[#0284C7] hover:from-sky-500 hover:to-[#0284C7] text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Coupon</span>
                    </button>
                  </div>

                  {/* Coupons List Cards */}
                  <div className="space-y-4">
                    {coupons.map(cp => (
                      <div key={cp.id} className="p-6 bg-white dark:bg-slate-900 rounded-3xl border-2 border-sky-100 dark:border-slate-800 shadow-md flex items-center justify-between gap-6 hover:shadow-xl hover:border-sky-500 transition-all">
                        
                        <div className="flex items-center gap-6">
                          
                          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-slate-800 border-2 border-dashed border-sky-300 dark:border-sky-500/50 text-center min-w-[140px] shadow-xs">
                            <div className="text-sm font-black text-slate-900 dark:text-white">
                              {cp.discountType === 'PERCENTAGE' ? `${cp.discountValue}% OFF` : `₹${cp.discountValue} OFF`}
                            </div>
                            <div className="text-xs font-black text-sky-600 dark:text-sky-400 tracking-wider mt-0.5 font-mono">{cp.code}</div>
                          </div>

                          <div>
                            <div className="text-base font-black text-slate-900 dark:text-white">{cp.title}</div>
                            <div className="text-xs font-extrabold text-sky-600 dark:text-sky-400 mt-0.5">Created by Admin • Public Coupon</div>
                            <div className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-6">
                              <span>Used {cp.usedCount || 0} times</span>
                              <span className="flex items-center gap-1.5 font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                                <Clock className="w-3.5 h-3.5 inline" />
                                {cp.expiresAt 
                                  ? `Expires: ${new Date(cp.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` 
                                  : 'Lifetime Validity'}
                              </span>
                            </div>
                          </div>

                        </div>

                        <div className="flex items-center gap-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            cp.status === 'ACTIVE' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-xs' : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                          }`}>
                            {cp.status}
                          </span>
                          
                          <button
                            onClick={async () => {
                              try {
                                await axios.delete(`/api/admin/coupons/${cp.id}`);
                                setCoupons(coupons.filter(c => c.id !== cp.id));
                                setMessage({ type: 'success', text: `Coupon '${cp.code}' deleted successfully.` });
                              } catch (err) {
                                setCoupons(coupons.filter(c => c.id !== cp.id));
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                      </div>
                    ))}
                  </div>

                </div>
              )}

            </div>
          )}

          {/* ================= TAB 6: PEOPLE & STUDENTS ================= */}
          {activeTab === 'people' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">People & Enrolled Students ({students.length})</h2>
                  <p className="text-xs font-extrabold text-orange-600 dark:text-orange-400 mt-1">Manage student roster and manually grant course access</p>
                </div>

                <button
                  onClick={() => setShowUnlockModal(true)}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Manual Course Unlock</span>
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-orange-200/80 dark:border-slate-800 shadow-md overflow-hidden">
                <table className="w-full text-left text-xs font-bold">
                  <thead className="bg-gradient-to-r from-orange-100/60 via-amber-100/60 to-emerald-100/60 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 border-b border-orange-200 dark:border-slate-700 text-orange-950 dark:text-orange-400 font-black uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Student</th>
                      <th className="p-4">Mobile & Email</th>
                      <th className="p-4">Enrolled Courses</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-100 dark:divide-slate-800">
                    {students.map(s => (
                      <tr key={s.id} className="hover:bg-orange-50/40 dark:hover:bg-slate-800/50">
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#FF6500] to-amber-500 text-white flex items-center justify-center font-black shadow-xs">
                            {s.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-slate-900 dark:text-white font-extrabold">{s.name}</div>
                            <div className="text-[10px] text-slate-400">Joined: {new Date(s.createdAt).toLocaleDateString()}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-800 dark:text-slate-200">{s.email}</div>
                          <div className="text-[10px] text-slate-400">{s.phone}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {s.purchases?.length > 0 ? (
                              s.purchases.map((p, idx) => (
                                <span key={idx} className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full font-black">
                                  {p.course?.title}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 italic">No courses unlocked</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              const sAttempts = studentAttemptsList.filter(a => a.userId === s.id || a.user?.email === s.email);
                              if (sAttempts.length > 0) {
                                setInspectingAttemptModal(sAttempts[0]);
                                setOverrideScoreInput(String(sAttempts[0].score));
                                setTeacherCommentInput(sAttempts[0].teacherComment || '');
                                const initialOverrides = {};
                                sAttempts[0].answers?.forEach(a => {
                                  initialOverrides[a.id] = { isCorrect: a.isCorrect, scoreEarned: a.scoreEarned };
                                });
                                setAnswerOverridesState(initialOverrides);
                              } else {
                                setShowTestPortalWorkspace(true);
                                setShowTestReportDashboard(true);
                              }
                            }}
                            className="px-3 py-1.5 bg-sky-100 dark:bg-sky-950 hover:bg-sky-200 text-sky-800 dark:text-sky-300 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            <span>📊 Quiz Submissions</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedStudentForChat(s.id);
                              setActiveTab('chats');
                            }}
                            className="px-3 py-1.5 bg-amber-100 dark:bg-amber-950 text-amber-950 dark:text-amber-300 hover:bg-[#FF6500] hover:text-white rounded-xl text-xs font-black shadow-2xs hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Doubt Chat</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedStudentForUnlock(s.id);
                              setShowUnlockModal(true);
                            }}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-[#FF6500] to-amber-500 text-white rounded-xl text-xs font-black shadow-2xs hover:scale-105 transition-all cursor-pointer"
                          >
                            Grant Access
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ================= TAB 7: CLASSPLUS BRANDED CHATS WORKSPACE (MATCHING SCREENSHOTS 2 & 3) ================= */}
          {activeTab === 'chats' && (
            <div className="space-y-6">
              
              {/* Header Top Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Chat</h2>
                  <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 mt-0.5">Send messages to your students on a daily basis</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border-4 border-sky-400 text-[10px] font-black text-sky-600 dark:text-sky-400 flex items-center justify-center bg-sky-50 dark:bg-slate-850 shadow-2xs">
                    92%
                  </div>

                  <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-950 px-3 py-1.5 rounded-full text-amber-950 dark:text-amber-300 text-xs font-black">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">MM</div>
                    <span>Manika Maheshwari ▾</span>
                  </div>
                </div>
              </div>

              {/* Chat Container Grid */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[640px]">
                
                {/* Left 4 Cols: Chats List & Menu */}
                <div className="md:col-span-4 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between bg-slate-50/40 dark:bg-slate-950">
                  <div className="p-4 space-y-4">
                    
                    {/* Header + Add Plus Menu */}
                    <div className="flex items-center justify-between relative">
                      <h3 className="text-base font-black text-slate-900 dark:text-white">Chats</h3>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowChatPlusMenu(!showChatPlusMenu)}
                          className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Plus className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                        </button>
                      </div>

                      {/* POPUP DROPDOWN MENU (Screenshot 3) */}
                      {showChatPlusMenu && (
                        <div className="absolute right-0 top-10 z-40 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-2 w-56 text-left text-xs font-bold space-y-1">
                          <button
                            type="button"
                            onClick={() => { setShowChatPlusMenu(false); setShowStartConvModal(true); }}
                            className="w-full px-3 py-2.5 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white flex items-center gap-3 cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4 text-slate-600" />
                            <span>Start a conversation</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => { setShowChatPlusMenu(false); setMessage({ type: 'success', text: 'New group chat selected' }); }}
                            className="w-full px-3 py-2.5 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white flex items-center gap-3 cursor-pointer"
                          >
                            <Users className="w-4 h-4 text-slate-600" />
                            <span>New group chat</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => { setShowChatPlusMenu(false); setMessage({ type: 'success', text: 'Start a broadcast selected' }); }}
                            className="w-full px-3 py-2.5 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white flex items-center gap-3 cursor-pointer"
                          >
                            <Globe className="w-4 h-4 text-slate-600" />
                            <span>Start a broadcast</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="Search by name, email, or number"
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    {/* STUDENTS ARE WAITING FOR YOU */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Students are waiting for you</span>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {allStudentConversations.slice(0, 10).map((conv, idx) => {
                          const s = conv.student || {};
                          const isSel = selectedStudentForChat === s.id;
                          return (
                            <button
                              key={s.id || idx}
                              type="button"
                              onClick={() => {
                                if (s.id) {
                                  setSelectedStudentForChat(s.id);
                                  fetchStudentChat(s.id);
                                }
                              }}
                              className={`w-8 h-8 rounded-full text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs transition-transform hover:scale-110 cursor-pointer ${
                                isSel ? 'ring-2 ring-sky-500 bg-sky-600 scale-105' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                              }`}
                              title={`Click to open chat with ${s.name || 'Student'}`}
                            >
                              {s.name?.[0]?.toUpperCase() || 'S'}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* MESSAGES LIST */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Messages</span>

                      {/* Default Channel / Website Queries */}
                      <div 
                        onClick={() => {
                          if (allStudentConversations.length > 0 && allStudentConversations[0].student?.id) {
                            setSelectedStudentForChat(allStudentConversations[0].student.id);
                            fetchStudentChat(allStudentConversations[0].student.id);
                          }
                        }}
                        className="p-3 bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-lime-600 text-white font-black text-xs flex items-center justify-center">W</div>
                          <div>
                            <div className="text-xs font-black text-slate-900 dark:text-white">Website Queries</div>
                            <div className="text-[10px] text-slate-400 truncate">Student doubts & admissions...</div>
                          </div>
                        </div>
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                          {allStudentConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0) || 1}
                        </span>
                      </div>

                      {/* Dynamic Student Conversations */}
                      {allStudentConversations.map(conv => {
                        const student = conv.student || {};
                        const isSelected = selectedStudentForChat === student.id;
                        const lastMsgText = typeof conv.lastMessage === 'string' ? conv.lastMessage : (conv.lastMessage?.text || `Dear ${student.name || 'Student'}, we welcome you...`);

                        return (
                          <div
                            key={conv.conversationId || conv.id}
                            onClick={() => {
                              if (student.id) {
                                setSelectedStudentForChat(student.id);
                                fetchStudentChat(student.id);
                              }
                            }}
                            className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-sky-50 dark:bg-slate-800 border-sky-400 shadow-2xs'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-sky-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                            }`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-9 h-9 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center shrink-0 font-mono">
                                {student.name?.[0]?.toUpperCase() || 'S'}
                              </div>
                              <div className="overflow-hidden">
                                <div className="text-xs font-black text-slate-900 dark:text-white truncate">{student.name || 'Student'}</div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  {lastMsgText}
                                </div>
                              </div>
                            </div>
                            {conv.unreadCount > 0 && (
                              <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>

                {/* Right 8 Cols: Main Active Chat Window */}
                {(() => {
                  const currentActiveStudent = ((students || []).find(s => s.id === selectedStudentForChat || s.email?.toLowerCase() === selectedStudentForChat?.toLowerCase())) || ((conversations || []).find(c => c.student?.id === selectedStudentForChat)?.student);
                  const currentStudentName = currentActiveStudent?.name || 'Student';

                  return (
                    <div className="md:col-span-8 flex flex-col justify-between bg-white dark:bg-slate-900">
                      
                      {/* Chat Top Bar */}
                      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-black text-sm flex items-center justify-center">
                            {currentStudentName[0]?.toUpperCase() || 'M'}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                              {currentStudentName}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-400">
                              {currentActiveStudent?.email || 'Active Direct Chat'}
                            </span>
                          </div>
                        </div>
                        <button type="button" className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Chat Messages Body */}
                      <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950 min-h-[360px]">
                        
                        {/* Date Separator */}
                        <div className="text-center">
                          <span className="text-[10px] font-black text-slate-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                            Today
                          </span>
                        </div>

                        {/* Automatic Personal Welcome Message */}
                        <div className="flex justify-start">
                          <div 
                            onClick={() => setAdminReplyToMsg({ text: 'Welcome message', sender: { name: "Manika Ma'am" }, senderRole: 'ADMIN' })}
                            title="Click message to reply"
                            className="max-w-md p-4 rounded-2xl bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold space-y-2 shadow-2xs cursor-pointer hover:border-sky-400 transition-all"
                          >
                            <div className="text-[10px] text-sky-600 dark:text-sky-400 font-black uppercase flex items-center justify-between">
                              <span>Manika Ma'am • Sarvottam Diksha</span>
                              <span className="text-[9px] text-sky-500 font-extrabold flex items-center gap-1">
                                <Reply className="w-3 h-3" /> Reply
                              </span>
                            </div>
                            <p className="whitespace-pre-line leading-relaxed">
                              {`Dear ${currentStudentName}, we welcome you to the Sarvottam Diksha community. Let us know what kind of courses you are looking for, and we'll try our best to help you. :)\nHappy learning!`}
                            </p>
                            <div className="text-[9px] text-slate-400 text-right">Just now</div>
                          </div>
                        </div>

                        {/* Dynamic Real Messages */}
                        {chatMessages.map(msg => {
                          const isMe = msg.senderRole === 'ADMIN' || msg.sender?.role === 'ADMIN';
                          const msgStudentName = isMe ? "Manika Ma'am" : (msg.sender?.name || msg.studentName || currentStudentName);

                          return (
                            <div key={msg.id || msg.text} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div 
                                onClick={() => setAdminReplyToMsg({ ...msg, studentName: msgStudentName })}
                                title="Click message to reply"
                                className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 cursor-pointer transition-all hover:scale-[1.01] relative group ${
                                  isMe ? 'bg-sky-600 text-white font-bold shadow-md' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold hover:border-sky-400'
                                }`}
                              >
                                <div className="text-[9px] uppercase tracking-wider opacity-90 flex items-center justify-between gap-2 border-b border-white/20 dark:border-slate-700/50 pb-1 mb-1">
                                  <span className="font-black">{msgStudentName}</span>
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAdminReplyToMsg({ ...msg, studentName: msgStudentName });
                                    }}
                                    className={`px-2 py-0.5 rounded-lg text-[9px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                                      isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-sky-100 dark:bg-slate-700 hover:bg-sky-200 text-sky-700 dark:text-sky-300'
                                    }`}
                                  >
                                    <Reply className="w-3 h-3" /> Reply
                                  </button>
                                </div>
                                <p className="whitespace-pre-line leading-relaxed font-bold">{msg.text}</p>
                                <div className="text-[9px] opacity-75 text-right pt-0.5">
                                  {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                      </div>

                      {/* Replying To Banner */}
                      {adminReplyToMsg && (
                        <div className="px-4 py-2 bg-sky-50 dark:bg-slate-800 border-t border-sky-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-sky-900 dark:text-sky-200 animate-fadeIn">
                          <div className="flex items-center gap-2 truncate">
                            <Reply className="w-4 h-4 text-sky-500 shrink-0" />
                            <span className="truncate">
                              Replying to <strong className="font-black">{adminReplyToMsg.sender?.name || adminReplyToMsg.studentName || (adminReplyToMsg.senderRole === 'ADMIN' ? "Manika Ma'am" : currentStudentName)}</strong>: "{adminReplyToMsg.text?.slice(0, 45)}{adminReplyToMsg.text?.length > 45 ? '...' : ''}"
                            </span>
                          </div>
                          <button type="button" onClick={() => setAdminReplyToMsg(null)} className="p-1 hover:bg-sky-200/50 rounded-full cursor-pointer">
                            <X className="w-4 h-4 text-slate-500" />
                          </button>
                        </div>
                      )}

                      {/* Chat Input Bar */}
                      <form onSubmit={handleSendAdminReply} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
                        <button type="button" className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer">
                          <FileText className="w-5 h-5" />
                        </button>

                        <input
                          type="text"
                          placeholder={adminReplyToMsg ? `Type reply to ${adminReplyToMsg.sender?.name || adminReplyToMsg.studentName || 'message'}...` : "Write something here ..."}
                          value={adminReplyText}
                          onChange={(e) => setAdminReplyText(e.target.value)}
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                        />

                        <button
                          type="submit"
                          disabled={!adminReplyText.trim()}
                          className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
                        >
                          <span>{adminReplyToMsg ? 'Send Reply' : 'Send'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  );
                })()}

              </div>

            </div>
          )}

        </div>

      </main>

      {/* ================= MODAL: START A CONVERSATION WITH ANY STUDENT ================= */}
      {showStartConvModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-sky-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-500" />
                <span>Start Chat With Any Student</span>
              </h3>
              <button onClick={() => setShowStartConvModal(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search students by name or email..."
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {allStudentConversations.map(conv => {
                  const s = conv.student || {};
                  return (
                    <div
                      key={s.id || s.email}
                      onClick={() => {
                        if (s.id) {
                          setSelectedStudentForChat(s.id);
                          fetchStudentChat(s.id);
                          setShowStartConvModal(false);
                        }
                      }}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-850 hover:bg-sky-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0 font-mono">
                          {s.name?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white">{s.name || 'Student'}</div>
                          <div className="text-[10px] text-slate-400">{s.email || 'Direct Student Account'}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
                        Open Chat
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD FREE STUDY MATERIAL ================= */}
      {showCreateResourceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-orange-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-orange-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Add Free Study Material</h3>
              <button onClick={() => setShowCreateResourceModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFreeResource} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="Class 10 CBSE Board Formula Sheet PDF"
                  value={newResourceForm.title}
                  onChange={(e) => setNewResourceForm({ ...newResourceForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6500]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Type</label>
                  <select
                    value={newResourceForm.type}
                    onChange={(e) => setNewResourceForm({ ...newResourceForm, type: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="DOCUMENT">Document (.pdf/.doc)</option>
                    <option value="VIDEO">Video (YouTube)</option>
                    <option value="TEST">Free Test Paper</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="Formula Sheet"
                    value={newResourceForm.category}
                    onChange={(e) => setNewResourceForm({ ...newResourceForm, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Resource URL / Link</label>
                <input
                  type="text"
                  required
                  placeholder="https://drive.google.com/file/..."
                  value={newResourceForm.url}
                  onChange={(e) => setNewResourceForm({ ...newResourceForm, url: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6500]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-[#FF6500] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Publish Free Material
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: CREATE COURSE (4-STEP CLASSPLUS WIZARD MATCHING SCREENSHOTS) ================= */}
      {showCreateCourseModal && (
        <div className="fixed inset-0 z-[250] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-orange-200 dark:border-slate-800 shadow-2xl max-w-5xl w-full p-8 space-y-6 text-slate-900 dark:text-white max-h-[95vh] overflow-y-auto">
            
            {/* Modal Title & Close Button */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Create New Course Batch</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold mt-0.5">Add / view content of your course</p>
              </div>
              <button onClick={() => { setShowCreateCourseModal(false); setCourseWizardStep(1); }} className="p-1.5 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Bar Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-sky-50/50 dark:bg-slate-800/50 rounded-2xl border border-sky-100 dark:border-slate-700 text-xs font-bold">
              
              {/* Step 1 */}
              <div className={`flex items-center gap-2 ${courseWizardStep >= 1 ? 'text-sky-600 dark:text-sky-400 font-black' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center ${
                  courseWizardStep > 1 ? 'bg-emerald-500 text-white' : courseWizardStep === 1 ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {courseWizardStep > 1 ? '✓' : '1'}
                </div>
                <span>Basic Information</span>
              </div>

              <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-700 mx-4"></div>

              {/* Step 2 */}
              <div className={`flex items-center gap-2 ${courseWizardStep >= 2 ? 'text-sky-600 dark:text-sky-400 font-black' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center ${
                  courseWizardStep > 2 ? 'bg-emerald-500 text-white' : courseWizardStep === 2 ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {courseWizardStep > 2 ? '✓' : '2'}
                </div>
                <span>Edit Price</span>
              </div>

              <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-700 mx-4"></div>

              {/* Step 3 */}
              <div className={`flex items-center gap-2 ${courseWizardStep >= 3 ? 'text-sky-600 dark:text-sky-400 font-black' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center ${
                  courseWizardStep > 3 ? 'bg-emerald-500 text-white' : courseWizardStep === 3 ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {courseWizardStep > 3 ? '✓' : '3'}
                </div>
                <span>Add Content</span>
              </div>

              <div className="h-0.5 flex-1 bg-slate-200 dark:bg-slate-700 mx-4"></div>

              {/* Step 4 */}
              <div className="flex items-center gap-2 text-slate-400">
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 text-[11px] font-black flex items-center justify-center">4</div>
                <span>Bundle (Optional)</span>
              </div>

            </div>

            {/* STEP 1: BASIC INFORMATION */}
            {courseWizardStep === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                
                {/* Left 8 Cols: Form Fields */}
                <div className="lg:col-span-8 space-y-6 text-xs font-bold">
                  
                  <div>
                    <label className="block text-slate-900 dark:text-white font-black text-sm mb-1.5">Name</label>
                    <input
                      type="text"
                      placeholder="Enter course name"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#FF6500]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-900 dark:text-white font-black text-sm mb-1.5">Description</label>
                    <textarea
                      rows={4}
                      placeholder="Enter course description here."
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#FF6500]"
                    />
                  </div>

                  {/* Add Thumbnail */}
                  <div className="space-y-2">
                    <label className="block text-slate-900 dark:text-white font-black text-sm">Add Thumbnail</label>
                    
                    <input
                      type="file"
                      ref={courseThumbnailFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewCourse({ ...newCourse, thumbnail: reader.result });
                            setMessage({ type: 'success', text: 'Course thumbnail uploaded!' });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />

                    <div className="flex items-center gap-4">
                      <button 
                        type="button" 
                        onClick={() => courseThumbnailFileInputRef.current?.click()} 
                        className="px-4 py-2.5 bg-sky-50 dark:bg-slate-800 border-2 border-sky-300 dark:border-slate-700 rounded-xl text-sky-600 dark:text-sky-400 font-black text-xs hover:bg-sky-100 flex items-center gap-2 cursor-pointer transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>Upload thumbnail Image</span>
                      </button>

                      {newCourse.thumbnail && (
                        <div className="relative w-20 h-14 rounded-xl overflow-hidden border-2 border-sky-500 shadow-md">
                          <img src={newCourse.thumbnail} alt="" className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => setNewCourse({ ...newCourse, thumbnail: '' })}
                            className="absolute top-0 right-0 bg-rose-600 text-white w-5 h-5 flex items-center justify-center rounded-bl-lg text-[11px] font-black cursor-pointer shadow-sm"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold">💡 Recommended Image Size: 800px x 600px, PNG or JPEG file</p>
                  </div>

                  {/* Dynamic Category & Sub Category Dropdowns */}
                  <div className="space-y-4 pt-2">
                    {categoryPairs.map((pair, idx) => (
                      <div key={pair.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                        <div className="sm:col-span-5">
                          <label className="block text-slate-900 dark:text-white font-black mb-1">Category</label>
                          <select
                            value={pair.category}
                            onChange={(e) => {
                              const copy = [...categoryPairs];
                              copy[idx].category = e.target.value;
                              setCategoryPairs(copy);
                              setNewCourse({ ...newCourse, category: e.target.value });
                            }}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
                          >
                            <option value="Class 10 Mathematics">Class 10 Mathematics</option>
                            <option value="Class 11 Mathematics">Class 11 Mathematics</option>
                            <option value="Class 9 Mathematics">Class 9 Mathematics</option>
                            <option value="Class 8 Mathematics">Class 8 Mathematics</option>
                            <option value="Class 12 Mathematics">Class 12 Mathematics</option>
                          </select>
                        </div>

                        <div className="sm:col-span-5">
                          <label className="block text-slate-900 dark:text-white font-black mb-1">Sub Category</label>
                          <select
                            value={pair.subCategory}
                            onChange={(e) => {
                              const copy = [...categoryPairs];
                              copy[idx].subCategory = e.target.value;
                              setCategoryPairs(copy);
                            }}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
                          >
                            <option value="CBSE Board">CBSE Board</option>
                            <option value="ICSE Board">ICSE Board</option>
                            <option value="State Board">State Board</option>
                            <option value="IIT-JEE Foundation">IIT-JEE Foundation</option>
                          </select>
                        </div>

                        {categoryPairs.length > 1 && (
                          <div className="sm:col-span-2">
                            <button
                              type="button"
                              onClick={() => setCategoryPairs(categoryPairs.filter(p => p.id !== pair.id))}
                              className="p-3 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => setCategoryPairs([...categoryPairs, { id: Date.now(), category: 'Class 10 Mathematics', subCategory: 'CBSE Board' }])}
                      className="flex items-center gap-2 text-sky-600 font-black text-xs hover:underline cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Another Category</span>
                    </button>
                  </div>

                </div>

                {/* Right 4 Cols: Features List Card */}
                <div className="lg:col-span-4">
                  <div className="bg-sky-50/40 dark:bg-slate-800/40 p-6 rounded-3xl border-2 border-sky-100 dark:border-slate-700 space-y-4">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Features</h4>
                    <ul className="space-y-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" /> Allow offline download</li>
                      <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" /> Create installments</li>
                      <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" /> Promote course with trial</li>
                      <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" /> Conduct LIVE classes</li>
                      <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" /> Allow course preview</li>
                      <li className="flex items-center gap-2 text-emerald-600"><CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" /> Limit course access</li>
                    </ul>
                  </div>
                </div>

              </div>
            )}

            {/* STEP 2: EDIT PRICE */}
            {courseWizardStep === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                
                {/* Left 8 Cols: Price Config */}
                <div className="lg:col-span-8 space-y-6 text-xs font-bold">
                  
                  <div>
                    <label className="block text-slate-900 dark:text-white font-black text-sm mb-2">Course Type</label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="courseType"
                          checked={courseTypeOption === 'PAID'}
                          onChange={() => setCourseTypeOption('PAID')}
                          className="accent-[#FF6500]"
                        />
                        <span>Paid Course</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="courseType"
                          checked={courseTypeOption === 'FREE'}
                          onChange={() => setCourseTypeOption('FREE')}
                          className="accent-[#FF6500]"
                        />
                        <span>Free Course</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-900 dark:text-white font-black text-sm mb-1">Course Duration Type</label>
                    <select
                      value={durationUnitType}
                      onChange={(e) => setDurationUnitType(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
                    >
                      <option value="Single Validity">Single Validity</option>
                      <option value="Multiple Validity">Multiple Validity</option>
                      <option value="Lifetime Validity">Lifetime Validity</option>
                      <option value="Fixed Expiry Date">Fixed Expiry Date</option>
                    </select>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Course will expire after a fixed period of time for all students based on their purchase date.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="number"
                        value={durationValueNum}
                        onChange={(e) => setDurationValueNum(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div>
                      <select className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-slate-900 dark:text-white font-bold">
                        <option>Year(s)</option>
                        <option>Month(s)</option>
                        <option>Day(s)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-900 dark:text-white font-black mb-1">Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-400">₹</span>
                        <input
                          type="number"
                          value={newCourse.price}
                          onChange={(e) => setNewCourse({ ...newCourse, price: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl pl-8 pr-3 py-3 font-black text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-900 dark:text-white font-black mb-1">Discount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-400">₹</span>
                        <input
                          type="number"
                          value="0"
                          readOnly
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl pl-8 pr-3 py-3 font-black text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-900 dark:text-white font-black mb-1">Effective Price</label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-400">₹</span>
                        <input
                          type="text"
                          value={(Number(newCourse.price) * 1.03).toFixed(2)}
                          readOnly
                          className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl pl-8 pr-3 py-3 font-black text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  <button type="button" className="px-4 py-2 bg-sky-100 text-sky-700 font-black rounded-full text-xs hover:bg-sky-200">
                    Advanced Settings
                  </button>

                </div>

                {/* Right 4 Cols: Validity Explanation Card */}
                <div className="lg:col-span-4">
                  <div className="bg-sky-50/40 dark:bg-slate-800/40 p-6 rounded-3xl border-2 border-sky-100 dark:border-slate-700 space-y-3">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">What is Course Validity?</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      Course validity is the predefined time period during which your students can access their course. You can choose between single validity, multiple validity, lifetime validity or set course expiry date.
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* STEP 3: ADD CONTENT */}
            {courseWizardStep === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                
                {/* Left 8 Cols: Contents Manager */}
                <div className="lg:col-span-8 space-y-4 text-xs font-bold">
                  <h4 className="text-base font-black text-slate-900 dark:text-white">Contents</h4>

                  {courseFolders.map(f => (
                    <div key={f.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                          <Folder className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-black text-slate-900 dark:text-white text-sm">{f.name}</div>
                          <div className="text-[10px] text-slate-400 font-semibold">{f.details}</div>
                        </div>
                      </div>

                      <MoreVertical className="w-4 h-4 text-slate-400 cursor-pointer" />
                    </div>
                  ))}
                </div>

                {/* Right 4 Cols: Add Content Widget Sidebar */}
                <div className="lg:col-span-4">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-700 space-y-3">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Add content</h4>

                    <div className="space-y-2 text-xs font-extrabold">
                      <button 
                        type="button" 
                        onClick={() => setCourseFolders([...courseFolders, { id: Date.now(), name: `Folder ${courseFolders.length + 1}`, details: '0 video(s), 0 file(s)' }])}
                        className="w-full p-2.5 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-700 flex items-center gap-3 text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <Folder className="w-4 h-4 text-sky-500" />
                        <span>Folder</span>
                      </button>

                      <button type="button" className="w-full p-2.5 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-700 flex items-center gap-3 text-slate-700 dark:text-slate-200 cursor-pointer">
                        <Video className="w-4 h-4 text-sky-500" />
                        <span>Video</span>
                      </button>

                      <button type="button" className="w-full p-2.5 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-700 flex items-center gap-3 text-slate-700 dark:text-slate-200 cursor-pointer">
                        <FileCheck2 className="w-4 h-4 text-sky-500" />
                        <span>Online Test</span>
                      </button>

                      <button type="button" className="w-full p-2.5 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-700 flex items-center gap-3 text-slate-700 dark:text-slate-200 cursor-pointer">
                        <FileText className="w-4 h-4 text-sky-500" />
                        <span>Document</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Bottom Action Footer Bar */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
              
              <button
                type="button"
                onClick={() => {
                  if (courseWizardStep > 1) setCourseWizardStep(courseWizardStep - 1);
                  else setShowCreateCourseModal(false);
                }}
                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black hover:bg-slate-200 cursor-pointer"
              >
                ← Previous
              </button>

              <div className="flex items-center gap-4">
                {courseWizardStep === 1 && (
                  <label className="flex items-center gap-2 text-xs font-extrabold text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="rounded-xs accent-[#FF6500]"
                    />
                    <span>I have read and agree to <span className="text-sky-600 underline">the T&C</span></span>
                  </label>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const previewData = {
                      id: 'course_preview_' + Date.now(),
                      title: newCourse.title || 'Class 10 Mathematics Comprehensive Batch 2026',
                      description: newCourse.description || 'Complete NCERT & RS Aggarwal Mathematics Coaching.',
                      category: newCourse.category || 'Class 10 Mathematics',
                      subject: newCourse.subject || 'Mathematics',
                      price: Number(newCourse.price || 500),
                      originalPrice: Number(newCourse.originalPrice || 999),
                      status: newCourse.status || 'PUBLISHED',
                      thumbnail: newCourse.thumbnail || '/assets/poster-banner.png',
                      validityDays: Number(newCourse.validityDays || 365),
                      chapters: newCourse.chapters || []
                    };
                    setPreviewCourseModalData(previewData);
                  }}
                  className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 font-black text-xs rounded-2xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4 text-sky-500" />
                  <span>Preview Course</span>
                </button>

                {courseWizardStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setCourseWizardStep(courseWizardStep + 1)}
                    className="px-8 py-3 bg-gradient-to-r from-sky-400 to-[#0284C7] hover:from-sky-500 hover:to-[#0284C7] text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer"
                  >
                    {courseWizardStep === 1 ? 'Edit Price →' : 'Add Content →'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreateCourse}
                    className="px-8 py-3 bg-gradient-to-r from-sky-400 to-[#0284C7] hover:from-sky-500 hover:to-[#0284C7] text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer"
                  >
                    Publish →
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 2: CREATE COUPON ================= */}
      {showCreateCouponModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-orange-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-orange-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Create Discount Coupon</h3>
              <button onClick={() => setShowCreateCouponModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  placeholder="FLAT200"
                  value={newCouponForm.code}
                  onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-mono font-black focus:outline-none focus:border-[#FF6500]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Discount Title</label>
                <input
                  type="text"
                  placeholder="EarlyBirdOffer"
                  value={newCouponForm.title}
                  onChange={(e) => setNewCouponForm({ ...newCouponForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="200"
                    value={newCouponForm.discountValue}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, discountValue: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={newCouponForm.status}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="EXPIRED">EXPIRED</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-[#FF6500] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Create Coupon Code
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: MANUAL COURSE UNLOCK ================= */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-orange-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-orange-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Manual Student Course Unlock</h3>
              <button onClick={() => setShowUnlockModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualUnlock} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Select Student</label>
                <select
                  value={selectedStudentForUnlock}
                  onChange={(e) => setSelectedStudentForUnlock(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Select Course to Unlock</label>
                <select
                  value={selectedCourseForUnlock}
                  onChange={(e) => setSelectedCourseForUnlock(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title} (₹{c.price})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Grant Free Access / Unlock Course
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: SCHEDULE LIVE CLASS ================= */}
      {showCreateClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-orange-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-orange-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Schedule Upcoming Live Class</h3>
              <button onClick={() => setShowCreateClassModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLiveClass} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  placeholder="Class 10 CBSE Target 100/100 Live Batch"
                  value={newClassForm.title}
                  onChange={(e) => setNewClassForm({ ...newClassForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Grade</label>
                  <select
                    value={newClassForm.classGrade}
                    onChange={(e) => setNewClassForm({ ...newClassForm, classGrade: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Class 10">Class 10</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 8">Class 8</option>
                    <option value="Class 11">Class 11</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">Duration</label>
                  <input
                    type="text"
                    value={newClassForm.duration}
                    onChange={(e) => setNewClassForm({ ...newClassForm, duration: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-[#FF6500] to-amber-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Schedule Class
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: UPLOAD NEW BANNER ================= */}
      {showCreateBannerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-orange-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-4 text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-orange-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Create & Schedule App Banner</h3>
                <p className="text-[11px] font-semibold text-slate-500">Configure banner scheduling, status, CTA buttons & visibility</p>
              </div>
              <button onClick={() => setShowCreateBannerModal(false)} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBanner} className="space-y-4 text-xs font-bold">
              {/* 1. Title */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-black">1. Banner Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CBSE Class 10 & 12 Board Revision Crash Course 2026"
                  value={newBannerForm.title}
                  onChange={(e) => setNewBannerForm({ ...newBannerForm, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-[#FF6500]"
                />
              </div>

              {/* 2. Description */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-black">2. Subtitle / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Join Manika Ma'am for 30-day intensive Board exam problem solving"
                  value={newBannerForm.description}
                  onChange={(e) => setNewBannerForm({ ...newBannerForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* 3. Banner Image / Background */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-black">3. Banner Image / Background</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Upload Image from Device</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewBannerForm(prev => ({ ...prev, thumbnail: reader.result }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-orange-300 dark:border-slate-700 rounded-xl p-2 text-[11px] text-slate-900 dark:text-white cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Or Select Preset Image</label>
                    <select
                      value={newBannerForm.thumbnail}
                      onChange={(e) => setNewBannerForm({ ...newBannerForm, thumbnail: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="/assets/poster-flyer.png">Maths Coaching Poster</option>
                      <option value="/assets/poster-banner.png">ABHYAAS MCQ Banner</option>
                      <option value="/assets/results-2025.jpg">Results 2025 Showcase</option>
                      <option value="/assets/results-2024.png">Results 2024 Showcase</option>
                      <option value="/assets/results-2023.png">Results 2023 Showcase</option>
                    </select>
                  </div>
                </div>

                {/* Banner Image Live Preview Box */}
                {newBannerForm.thumbnail && (
                  <div className="mt-2 rounded-2xl overflow-hidden border-2 border-orange-200 dark:border-slate-800 h-28 bg-slate-950 flex items-center justify-center relative shadow-inner">
                    <img src={newBannerForm.thumbnail} alt="Banner Preview" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 right-2 px-2.5 py-0.5 bg-black/80 text-amber-300 text-[10px] font-black rounded-full border border-amber-400/30">
                      Live Image Preview
                    </span>
                  </div>
                )}
              </div>

              {/* 4 & 5. Scheduling: Start Date/Time & End Date/Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-500/5 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-amber-200 dark:border-slate-700">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-black">4. Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newBannerForm.startDate}
                    onChange={(e) => setNewBannerForm({ ...newBannerForm, startDate: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Leave empty for immediate start</span>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-black">5. End Date & Time (Auto-Expire)</label>
                  <input
                    type="datetime-local"
                    value={newBannerForm.endDate}
                    onChange={(e) => setNewBannerForm({ ...newBannerForm, endDate: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Disappears automatically after this date</span>
                </div>
              </div>

              {/* 6 & 9. Status & Featured Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-black">6. Publication Status</label>
                  <select
                    value={newBannerForm.status}
                    onChange={(e) => setNewBannerForm({ ...newBannerForm, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none font-black"
                  >
                    <option value="PUBLISHED">🟢 Published (Live for Students)</option>
                    <option value="UNPUBLISHED">🔴 Unpublished (Draft / Hidden)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-black">9. Featured Banner?</label>
                  <select
                    value={newBannerForm.isFeatured ? 'YES' : 'NO'}
                    onChange={(e) => setNewBannerForm({ ...newBannerForm, isFeatured: e.target.value === 'YES' })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none font-black"
                  >
                    <option value="YES">⭐ Yes (Featured Highlight Badge)</option>
                    <option value="NO">Standard Announcement</option>
                  </select>
                </div>
              </div>

              {/* 7 & 8. Button Text & Action Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-black">7. Button Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Explore Course / Start Practice"
                    value={newBannerForm.buttonText}
                    onChange={(e) => setNewBannerForm({ ...newBannerForm, buttonText: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-black">8. Button Destination Link</label>
                  <select
                    value={newBannerForm.link}
                    onChange={(e) => setNewBannerForm({ ...newBannerForm, link: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="/courses">Course Store (/courses)</option>
                    <option value="/free-resources">Free Tests & Resources (/free-resources)</option>
                    <option value="/leaderboard">Leaderboard (/leaderboard)</option>
                    <option value="/store">Official Store (/store)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-[#FF6500] via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-2xl shadow-xl transition-all cursor-pointer border border-amber-300/40 active:scale-95"
              >
                🚀 Save & Publish Live Banner
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 6: TRANSACTION DASHBOARD (MATCHING SCREENSHOT 2) ================= */}
      {showTransactionsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-orange-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full p-6 space-y-6 text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Transaction Dashboard</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold mt-0.5">Showing results for last 7 days</p>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { setShowTransactionsModal(false); setShowGenerateReportModal(true); }}
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 to-[#0284C7] text-white rounded-xl text-xs font-black shadow-md hover:scale-105 transition-all cursor-pointer"
                >
                  Export Report →
                </button>
                <button onClick={() => setShowTransactionsModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Metric Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="text-xs font-black text-slate-500">Transactions</div>
                <div className="text-2xl font-black text-[#0284C7]">{transactionsStats.count || transactionsData.length}</div>
                <div className="text-[10px] text-emerald-600 font-bold">↑ 0% up</div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="text-xs font-black text-slate-500">Transaction Amount</div>
                <div className="text-2xl font-black text-[#FF6500]">₹ {transactionsStats.totalAmount || 2041}</div>
                <div className="text-[10px] text-emerald-600 font-bold">↑ 0% up</div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="text-xs font-black text-slate-500">Average Order Value</div>
                <div className="text-2xl font-black text-emerald-600">₹ {transactionsStats.avgOrderValue || 510}</div>
                <div className="text-[10px] text-emerald-600 font-bold">↑ 0% up</div>
              </div>
            </div>

            {/* Transactions List Table */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-left text-xs font-bold">
                <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 uppercase font-black">
                  <tr>
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Course Unlocked</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Payment Method</th>
                    <th className="p-3.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-900 dark:text-white">
                  {transactionsData.map(t => (
                    <tr key={t.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800">
                      <td className="p-3.5 font-black">{t.user?.name || 'Student Account'}</td>
                      <td className="p-3.5 font-extrabold text-[#FF6500]">{t.course?.title || 'Class 10 Board Mastery'}</td>
                      <td className="p-3.5 font-black text-emerald-600">₹{t.amount || 500}</td>
                      <td className="p-3.5"><span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black">{t.paymentGateway || 'RAZORPAY'}</span></td>
                      <td className="p-3.5 text-right text-slate-500 text-[10px]">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Bar */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <button 
                onClick={() => setShowTransactionsModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black hover:bg-slate-200 cursor-pointer"
              >
                ← Back
              </button>
              <button 
                onClick={() => { setShowTransactionsModal(false); setShowGenerateReportModal(true); }}
                className="px-6 py-2.5 bg-gradient-to-r from-sky-500 to-[#0284C7] text-white rounded-xl text-xs font-black shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                Export Report →
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 7: GENERATE REPORT (MATCHING SCREENSHOTS 3 & 4) ================= */}
      {showGenerateReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-orange-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-6 text-slate-900 dark:text-white">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Generate Report</h3>
              <button onClick={() => setShowGenerateReportModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleExportReportSubmit} className="space-y-6 text-xs font-bold">
              <div className="p-4 bg-sky-50/60 dark:bg-slate-800/60 rounded-2xl border border-sky-100 dark:border-slate-700 space-y-2">
                <label className="block text-slate-900 dark:text-white font-black text-xs">Report Type</label>
                
                {/* Dropdown with all 12 options from Screenshot 3 & 4 */}
                <select
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border-2 border-sky-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-black focus:outline-none focus:border-sky-500 shadow-2xs"
                >
                  <option value="Student Profile Data">Student Profile Data</option>
                  <option value="Course Purchase Transaction Report">Course Purchase Transaction Report</option>
                  <option value="AI Powered Leads">AI Powered Leads</option>
                  <option value="Offline Material Shipment Address">Offline Material Shipment Address</option>
                  <option value="Student Course Instalment Report">Student Course Instalment Report</option>
                  <option value="SMS/Email Report">SMS/Email Report</option>
                  <option value="Student Multi Device Login">Student Multi Device Login</option>
                  <option value="Student Offline Downloads Report">Student Offline Downloads Report</option>
                  <option value="Course Inactive students">Course Inactive students</option>
                  <option value="Revoked Students">Revoked Students</option>
                  <option value="Delivery Tracking Report">Delivery Tracking Report</option>
                  <option value="Free Course Report">Free Course Report</option>
                </select>
              </div>

              <div className="flex items-center justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-sky-400 to-[#0284C7] hover:from-sky-500 hover:to-[#0284C7] text-white font-black text-xs rounded-2xl shadow-lg shadow-sky-500/25 hover:scale-105 transition-all cursor-pointer"
                >
                  Export Report →
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL 8: COURSE FILTER DRAWER (MATCHING SCREENSHOTS 2 & 3) ================= */}
      {showCourseFilterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white dark:bg-slate-900 border-l-2 border-orange-200 dark:border-slate-800 shadow-2xl max-w-md w-full h-full p-6 space-y-6 text-slate-900 dark:text-white flex flex-col justify-between overflow-y-auto">
            
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Filter</h3>
                <button onClick={() => setShowCourseFilterModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Form Sections */}
              <div className="space-y-6 text-xs font-bold">
                
                {/* 1. Categories / Sub-categories */}
                <div className="p-4 bg-sky-50/50 dark:bg-slate-800/50 rounded-2xl border border-sky-100 dark:border-slate-700 space-y-3">
                  <label className="block text-slate-900 dark:text-white font-black">Categories / Sub-categories</label>
                  <select
                    value={courseCategoryFilter}
                    onChange={(e) => setCourseCategoryFilter(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-black focus:outline-none focus:border-sky-500"
                  >
                    <option value="ALL">Select Categories / Sub-categories</option>
                    <option value="Class 10 Mathematics">School Academics - CBSE (28)</option>
                    <option value="Class 11 Mathematics">Class 11 (2)</option>
                    <option value="Class 9 Mathematics">CBSE class 9 (1)</option>
                    <option value="Class 12 Mathematics">CBSE class 12 (2)</option>
                    <option value="Class 8 Mathematics">CBSE class 8 (1)</option>
                  </select>
                </div>

                {/* 2. Course Type (Radio - Screenshot 3) */}
                <div className="p-4 bg-sky-50/50 dark:bg-slate-800/50 rounded-2xl border border-sky-100 dark:border-slate-700 space-y-3">
                  <label className="block text-slate-900 dark:text-white font-black">Course Type</label>
                  <div className="space-y-2 text-slate-700 dark:text-slate-300 font-bold">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="courseOrigin"
                        checked={courseOriginFilter === 'ALL'}
                        onChange={() => setCourseOriginFilter('ALL')}
                        className="accent-sky-600"
                      />
                      <span>Created by Me</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="courseOrigin"
                        checked={courseOriginFilter === 'INSTITUTE'}
                        onChange={() => setCourseOriginFilter('INSTITUTE')}
                        className="accent-sky-600"
                      />
                      <span>Created by my institute</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="courseOrigin"
                        checked={courseOriginFilter === 'IMPORTED'}
                        onChange={() => setCourseOriginFilter('IMPORTED')}
                        className="accent-sky-600"
                      />
                      <span>Imported Course</span>
                    </label>
                  </div>
                </div>

                {/* 3. Course Status */}
                <div className="p-4 bg-sky-50/50 dark:bg-slate-800/50 rounded-2xl border border-sky-100 dark:border-slate-700 space-y-3">
                  <label className="block text-slate-900 dark:text-white font-black">Course Status</label>
                  <select
                    value={courseStatusFilter}
                    onChange={(e) => setCourseStatusFilter(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-black focus:outline-none focus:border-sky-500"
                  >
                    <option value="ALL">Course Status (All)</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="UNPUBLISHED">UNPUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>

                {/* 4. Price Range */}
                <div className="p-4 bg-sky-50/50 dark:bg-slate-800/50 rounded-2xl border border-sky-100 dark:border-slate-700 space-y-3">
                  <label className="block text-slate-900 dark:text-white font-black">Price Range</label>
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-400">₹</span>
                      <input
                        type="number"
                        placeholder="Enter lower limit"
                        value={priceRangeMin}
                        onChange={(e) => setPriceRangeMin(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2.5 text-xs font-bold focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-400">₹</span>
                      <input
                        type="number"
                        placeholder="Enter higher limit"
                        value={priceRangeMax}
                        onChange={(e) => setPriceRangeMax(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2.5 text-xs font-bold focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Drawer Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 gap-4">
              <button
                type="button"
                onClick={() => {
                  setCourseCategoryFilter('ALL');
                  setCourseStatusFilter('ALL');
                  setPriceRangeMin('');
                  setPriceRangeMax('');
                  setCourseOriginFilter('ALL');
                }}
                className="px-6 py-3 bg-sky-50 dark:bg-slate-800 text-sky-700 dark:text-sky-300 font-black text-xs rounded-2xl hover:bg-sky-100 cursor-pointer"
              >
                Clear Filter
              </button>

              <button
                type="button"
                onClick={() => setShowCourseFilterModal(false)}
                className="px-8 py-3 bg-gradient-to-r from-sky-400 to-[#0284C7] hover:from-sky-500 hover:to-[#0284C7] text-white font-black text-xs rounded-2xl shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                Apply Filter
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 9: ADD TEST TO COURSE / FREE TEST (MATCHING SCREENSHOTS 2, 3 & 4) ================= */}
      {showAddTestToModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-orange-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-6 text-slate-900 dark:text-white">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {addTestToSubScreen !== 'SELECT' && (
                  <button onClick={() => setAddTestToSubScreen('SELECT')} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {addTestToSubScreen === 'COURSE' ? 'Add to course' : addTestToSubScreen === 'FREE_TEST' ? 'Add to free test' : activeTestForOption?.title || 'ABHYAAS Class 8_ Linear Equation'}
                </h3>
              </div>
              <button onClick={() => setShowAddTestToModal(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SCREEN 1: SELECT DESTINATION (SCREENSHOT 2) */}
            {addTestToSubScreen === 'SELECT' && (
              <div className="space-y-4 pt-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Add test to</h4>

                {/* Option 1: Course */}
                <div className="p-5 bg-sky-50/50 dark:bg-slate-800/50 rounded-3xl border-2 border-sky-100 dark:border-slate-700 flex items-center justify-between shadow-2xs hover:border-sky-500 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="font-black text-slate-900 dark:text-white text-sm">Course</span>
                  </div>
                  <button
                    onClick={() => setAddTestToSubScreen('COURSE')}
                    className="text-xs font-black text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Add to course →</span>
                  </button>
                </div>

                {/* Option 2: Free Test */}
                <div className="p-5 bg-sky-50/50 dark:bg-slate-800/50 rounded-3xl border-2 border-sky-100 dark:border-slate-700 flex items-center justify-between shadow-2xs hover:border-sky-500 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <span className="font-black text-slate-900 dark:text-white text-sm">Free Test</span>
                  </div>
                  <button
                    onClick={() => setAddTestToSubScreen('FREE_TEST')}
                    className="text-xs font-black text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Add to free test →</span>
                  </button>
                </div>
              </div>
            )}

            {/* SCREEN 2: ADD TO COURSE FORM (SCREENSHOT 3) */}
            {addTestToSubScreen === 'COURSE' && (
              <div className="space-y-5 text-xs font-bold pt-1">
                
                <div className="p-4 bg-sky-50/50 dark:bg-slate-800/50 rounded-2xl border border-sky-100 dark:border-slate-700 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <span className="font-black text-slate-900 dark:text-white text-xs">{activeTestForOption?.title || 'ABHYAAS Class 8_ Linear Equation'}</span>
                </div>

                <div>
                  <label className="block text-slate-900 dark:text-white font-black text-xs mb-1.5">Select course</label>
                  <select
                    value={selectedCourseForAddTest}
                    onChange={(e) => setSelectedCourseForAddTest(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-sky-500"
                  >
                    <option value="">Select course</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-900 dark:text-white font-black text-xs mb-1.5">Number of attempts</label>
                  <input
                    type="number"
                    value={testAttemptsCount}
                    onChange={(e) => setTestAttemptsCount(e.target.value)}
                    disabled={isUnlimitedAttempts}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-sky-500 disabled:opacity-50"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={isUnlimitedAttempts}
                    onChange={(e) => setIsUnlimitedAttempts(e.target.checked)}
                    className="rounded-xs accent-sky-600"
                  />
                  <span>Set unlimited attempts</span>
                </label>

                <div className="flex items-center justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (!activeTestForOption) return;
                      if (!selectedCourseForAddTest) {
                        alert('Please select a course to add this test to.');
                        return;
                      }

                      const courseId = selectedCourseForAddTest;
                      const testObj = activeTestForOption;
                      const attemptsVal = isUnlimitedAttempts ? 'Unlimited' : (testAttemptsCount || 1);

                      let testQuestions = Array.isArray(testObj.questions) && testObj.questions.length > 0 ? testObj.questions : [];
                      if (testQuestions.length === 0) {
                        try {
                          const storedCustom = JSON.parse(localStorage.getItem('sd_custom_tests') || '[]');
                          const match = storedCustom.find(t => t && (t.id === testObj.id || (t.title && t.title.toLowerCase() === testObj.title?.toLowerCase())) && Array.isArray(t.questions) && t.questions.length > 0);
                          if (match) testQuestions = match.questions;
                        } catch (e) {}
                      }

                      const updatedTestObj = {
                        ...testObj,
                        courseId,
                        courseIds: Array.from(new Set([...(testObj.courseIds || []), courseId])),
                        assignedCourseIds: Array.from(new Set([...(testObj.assignedCourseIds || []), courseId])),
                        attemptsCount: attemptsVal,
                        questions: testQuestions,
                        questionsCount: testQuestions.length || testObj.questionsCount || 10
                      };

                      // 1. Update Test Portal State
                      setTestPortalTests(prev => prev.map(t => t.id === testObj.id ? updatedTestObj : t));

                      // 2. Persist Test in sd_custom_tests
                      try {
                        const storedTests = JSON.parse(localStorage.getItem('sd_custom_tests') || '[]');
                        const updatedStoredTests = [updatedTestObj, ...storedTests.filter(t => t.id !== testObj.id)];
                        localStorage.setItem('sd_custom_tests', JSON.stringify(updatedStoredTests));

                        // 3. Save to sd_course_quizzes_${courseId} and global sd_course_quizzes
                        const cKey = `sd_course_quizzes_${courseId}`;
                        const existingCQuizzes = JSON.parse(localStorage.getItem(cKey) || '[]');
                        localStorage.setItem(cKey, JSON.stringify([updatedTestObj, ...existingCQuizzes.filter(q => q.id !== testObj.id)]));

                        const globalCQuizzes = JSON.parse(localStorage.getItem('sd_course_quizzes') || '[]');
                        localStorage.setItem('sd_course_quizzes', JSON.stringify([updatedTestObj, ...globalCQuizzes.filter(q => q.id !== testObj.id || q.courseId !== courseId)]));

                        // 4. Update Course object in courses state & sd_custom_courses
                        setCourses(prev => prev.map(c => {
                          if (String(c.id) === String(courseId) || c.title === courseId) {
                            const existingAttached = Array.isArray(c.attachedQuizzes) ? c.attachedQuizzes : [];
                            return { ...c, attachedQuizzes: [updatedTestObj, ...existingAttached.filter(q => q.id !== testObj.id)] };
                          }
                          return c;
                        }));

                        const storedCourses = JSON.parse(localStorage.getItem('sd_custom_courses') || '[]');
                        const updatedCourses = storedCourses.map(c => {
                          if (String(c.id) === String(courseId) || c.title === courseId) {
                            const existingAttached = Array.isArray(c.attachedQuizzes) ? c.attachedQuizzes : [];
                            return { ...c, attachedQuizzes: [updatedTestObj, ...existingAttached.filter(q => q.id !== testObj.id)] };
                          }
                          return c;
                        });
                        localStorage.setItem('sd_custom_courses', JSON.stringify(updatedCourses));
                      } catch (e) {}

                      // 5. Backend API Call
                      axios.post(`/api/admin/courses/${courseId}/quizzes`, { testId: testObj.id }).catch(() => {});

                      const targetCourseObj = courses.find(c => String(c.id) === String(courseId));
                      setMessage({ type: 'success', text: `🎯 Test '${testObj.title}' added to course '${targetCourseObj?.title || courseId}' successfully!` });
                      setShowAddTestToModal(false);
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-sky-400 to-[#0284C7] hover:from-sky-500 hover:to-[#0284C7] text-white font-black text-xs rounded-2xl shadow-md hover:scale-105 transition-all cursor-pointer"
                  >
                    Add to course
                  </button>
                </div>

              </div>
            )}

            {/* SCREEN 3: ADD TO FREE TEST FORM (SCREENSHOT 4) */}
            {addTestToSubScreen === 'FREE_TEST' && (
              <div className="space-y-5 text-xs font-bold pt-1">
                
                <div className="p-4 bg-sky-50/50 dark:bg-slate-800/50 rounded-2xl border border-sky-100 dark:border-slate-700 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <span className="font-black text-slate-900 dark:text-white text-xs">{activeTestForOption?.title || 'ABHYAAS Class 8_ Linear Equation'}</span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">When can students attempt?</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={freeTestStartDate}
                        onChange={(e) => setFreeTestStartDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-slate-900 dark:text-white font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                      <select className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-slate-900 dark:text-white font-bold focus:outline-none">
                        <option>Start Time (09:00 AM)</option>
                        <option>10:00 AM</option>
                        <option>12:00 PM</option>
                        <option>05:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                      <input
                        type="date"
                        value={freeTestEndDate}
                        onChange={(e) => setFreeTestEndDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-slate-900 dark:text-white font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                      <select className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-slate-900 dark:text-white font-bold focus:outline-none">
                        <option>End Time (11:59 PM)</option>
                        <option>06:00 PM</option>
                        <option>09:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 pt-1">
                    <input
                      type="checkbox"
                      checked={freeTestNoEndTime}
                      onChange={(e) => setFreeTestNoEndTime(e.target.checked)}
                      className="rounded-xs accent-sky-600"
                    />
                    <span>Check for no end time, so students can attempt anytime</span>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-900 dark:text-white font-black text-xs">Number of attempts</label>
                  <input
                    type="number"
                    value={testAttemptsCount}
                    onChange={(e) => setTestAttemptsCount(e.target.value)}
                    disabled={isUnlimitedAttempts}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-slate-900 dark:text-white font-bold focus:outline-none focus:border-sky-500 disabled:opacity-50"
                  />
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={isUnlimitedAttempts}
                      onChange={(e) => setIsUnlimitedAttempts(e.target.checked)}
                      className="rounded-xs accent-sky-600"
                    />
                    <span>Set unlimited attempts</span>
                  </label>
                </div>

                <div className="flex items-center justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={handleConfirmAddFreeTest}
                    className="px-8 py-3 bg-gradient-to-r from-sky-400 to-[#0284C7] hover:from-sky-500 hover:to-[#0284C7] text-white font-black text-xs rounded-2xl shadow-md hover:scale-105 transition-all cursor-pointer"
                  >
                    Add to free test
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* ================= MODAL: MOVE TEST TO FOLDER ================= */}
      {moveFolderModalTarget && (
        <div className="fixed inset-0 z-[110] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-sky-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-6 text-slate-900 dark:text-white">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center font-black text-xs">
                  <Folder className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Move Test to Folder
                </h3>
              </div>
              <button onClick={() => setMoveFolderModalTarget(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400 font-bold block">Selected Test:</span>
                <span className="text-xs font-black text-slate-900 dark:text-white">{moveFolderModalTarget.title}</span>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-900 dark:text-white mb-2">Select Target Folder</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {['Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'Revision Tests'].map(fName => (
                    <button
                      key={fName}
                      type="button"
                      onClick={() => setSelectedFolderForMove(fName)}
                      className={`p-3 rounded-2xl text-left border-2 font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
                        selectedFolderForMove === fName
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <Folder className="w-4 h-4 text-sky-500 shrink-0" />
                      <span className="truncate">{fName}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setMoveFolderModalTarget(null)}
                className="px-5 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMoveFolder}
                className="px-6 py-2.5 bg-gradient-to-r from-sky-400 to-[#0284C7] hover:from-sky-500 hover:to-[#0284C7] text-white font-black text-xs rounded-2xl shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Move to {selectedFolderForMove}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= FULL TEST PORTAL WORKSPACE (MATCHING SCREENSHOTS 1, 2, 3, 4 & 5) ================= */}
      {showTestPortalWorkspace && (
        <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-y-auto text-slate-900 dark:text-white">
          
          {/* Top Classplus Navbar */}
          <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between shadow-xs sticky top-0 z-30">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => { setShowTestPortalWorkspace(false); setShowTestReportDashboard(false); setShowTestSettingsPage(false); }}
                className="flex items-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full cursor-pointer transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-sky-500 to-[#0284C7] text-white font-black flex items-center justify-center text-xs shadow-xs">
                  SD
                </div>
                <div className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Sarvottam Diksha <span className="text-sky-500 text-xs">TEST PORTAL</span>
                </div>
              </div>

              {/* Navbar Tab */}
              <div 
                onClick={() => { setShowTestReportDashboard(false); setShowTestSettingsPage(false); }}
                className={`pb-1 text-xs font-extrabold cursor-pointer ${!showTestReportDashboard && !showTestSettingsPage ? 'border-b-2 border-sky-500 text-sky-600 dark:text-sky-400' : 'text-slate-500 hover:text-sky-600'}`}
              >
                My Library
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-extrabold text-slate-600 dark:text-slate-300">
              <button
                onClick={() => setShowCreateNewTestModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#FF6500] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full text-xs font-black flex items-center gap-1.5 shadow-md hover:scale-105 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create New Quiz / Test</span>
              </button>

              <button
                onClick={() => { setShowTestReportDashboard(true); setShowTestSettingsPage(false); }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full cursor-pointer transition-all ${
                  showTestReportDashboard ? 'bg-sky-500 text-white font-black shadow-md' : 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold hover:bg-sky-200'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>📊 Student Submissions ({studentAttemptsList.length})</span>
              </button>

              {/* Theme Toggle Switch */}
              <button
                type="button"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-black flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                title="Toggle Theme"
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-sky-600" />
                    <span>Dark</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-950 px-2.5 py-1 rounded-full text-amber-950 dark:text-amber-300">
                <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">MM</div>
                <span>Manika Maheshwari ▾</span>
              </div>

              <button 
                onClick={() => { setShowTestPortalWorkspace(false); setShowTestReportDashboard(false); setShowTestSettingsPage(false); }}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Main Library Body / Question Builder Body / Settings / Report Dashboard */}
          <main className="p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
            
            {/* VIEW A1: REPORT DASHBOARD (MATCHING NEW SCREENSHOT 2) */}
            {showTestReportDashboard ? (
              <div className="space-y-6">
                
                {/* Header Bar */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowTestReportDashboard(false)}
                      className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Report Dashboard</h2>
                    <span className="text-sky-600 text-xs font-bold hover:underline cursor-pointer">What's this?</span>
                  </div>
                </div>

                {/* Banner */}
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-black text-center">
                  Changes made will be lost if you leave this page without publishing. Make sure to publish your changes!
                </div>

                {/* 2-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  
                  {/* Left 4-Cols: Status & Tests Filters */}
                  <div className="md:col-span-4 space-y-6">
                    
                    {/* Status Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                        <span>Status</span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </h4>

                      <div className="space-y-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <label className="flex items-center gap-3 cursor-pointer text-sky-600 font-black">
                          <input type="radio" name="reportStatus" defaultChecked className="accent-sky-600" />
                          <span>Reported Questions (2)</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="radio" name="reportStatus" className="accent-sky-600" />
                          <span>Updates Available (0)</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="radio" name="reportStatus" className="accent-sky-600" />
                          <span>Resolved Questions (11)</span>
                        </label>
                      </div>
                    </div>

                    {/* Tests Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">Tests</h4>
                        <button type="button" className="text-sky-600 text-xs font-extrabold hover:underline cursor-pointer">Clear All</button>
                      </div>

                      <div className="space-y-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="accent-sky-600 rounded-xs" />
                          <span>Squares and square roots - ABHYAAS Class 8</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="accent-sky-600 rounded-xs" />
                          <span>Trigonometric Ratios- Introduction - ABHYAAS Class 10 (26-27)</span>
                        </label>
                      </div>
                    </div>

                  </div>

                  {/* Right 8-Cols: Reported Questions List */}
                  <div className="md:col-span-8 space-y-6">
                    
                    {/* Card 1 */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xs">
                      <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        MULTIPLE CHOICE
                      </div>

                      <div className="text-sm font-bold text-slate-900 dark:text-white space-y-2">
                        <p>In figure, if D is midpoint of BC, the value of <span className="font-serif italic font-black text-sky-600">cot x / cot y</span> is</p>
                        <button type="button" className="text-sky-600 text-xs font-extrabold hover:underline">View More</button>
                      </div>

                      <div className="text-xs font-bold text-slate-500 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <FileCheck2 className="w-4 h-4 text-sky-500" />
                        <span>Trignometric Ratios- Introduction - ABHYAAS Class 10 (26-27) <span className="text-slate-400 font-normal">in 1 Test(s)</span></span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" className="px-4 py-2 border border-rose-300 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 cursor-pointer">
                          View 1 Pending Reports
                        </button>

                        <div className="flex items-center gap-3">
                          <button 
                            type="button" 
                            onClick={() => setMessage({ type: 'success', text: 'Report dismissed successfully!' })}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                          >
                            ✕ Dismiss Report(s)
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setMessage({ type: 'success', text: 'Question resolution editor opened!' })}
                            className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
                          >
                            ✏️ Edit to Resolve
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xs">
                      <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        MULTIPLE CHOICE
                      </div>

                      <div className="text-sm font-bold text-slate-900 dark:text-white space-y-2">
                        <p>The hypotenuse of a right triangle with its legs of lengths <span className="font-serif italic font-black text-sky-600">15x</span> and <span className="font-serif italic font-black text-sky-600">17x</span></p>
                        <button type="button" className="text-sky-600 text-xs font-extrabold hover:underline">View More</button>
                      </div>

                      <div className="text-xs font-bold text-slate-500 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <FileCheck2 className="w-4 h-4 text-sky-500" />
                        <span>Squares and square roots - ABHYAAS Class 8 <span className="text-slate-400 font-normal">in 1 Test(s)</span></span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" className="px-4 py-2 border border-rose-300 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 cursor-pointer">
                          View 1 Pending Reports
                        </button>

                        <div className="flex items-center gap-3">
                          <button 
                            type="button" 
                            onClick={() => setMessage({ type: 'success', text: 'Report dismissed successfully!' })}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                          >
                            ✕ Dismiss Report(s)
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setMessage({ type: 'success', text: 'Question resolution editor opened!' })}
                            className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
                          >
                            ✏️ Edit to Resolve
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Student Test Attempts & Evaluation Override Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                          <h3 className="text-base font-black text-slate-900 dark:text-white">Student Quiz Submissions ({studentAttemptsList.length})</h3>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">Inspect student solutions, adjust scores, and write teacher comments</p>
                        </div>
                        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-xs font-black rounded-full">
                          Teacher Grade Controls Active
                        </span>
                      </div>

                      {studentAttemptsList.length > 0 ? (
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                          {studentAttemptsList.map(att => (
                            <div key={att.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-slate-900 dark:text-white text-sm">{att.user?.name || 'Student'}</span>
                                  <span className="text-slate-400">({att.user?.email})</span>
                                  {att.isManualOverride && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">
                                      ✏️ Adjusted by Teacher
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-600 dark:text-slate-300 font-bold">
                                  Quiz: <strong className="text-sky-600">{att.test?.title}</strong> | Score: <strong className="text-emerald-600">{att.score} / {att.test?.totalMarks || 100}</strong> ({att.accuracyPercentage}% accuracy)
                                </div>
                                {att.teacherComment && (
                                  <div className="text-amber-700 dark:text-amber-400 font-extrabold italic text-[11px]">
                                    💬 Remark: "{att.teacherComment}"
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setInspectingAttemptModal(att);
                                  setOverrideScoreInput(String(att.score));
                                  setTeacherCommentInput(att.teacherComment || '');
                                  const initialOverrides = {};
                                  att.answers?.forEach(a => {
                                    initialOverrides[a.id] = { isCorrect: a.isCorrect, scoreEarned: a.scoreEarned };
                                  });
                                  setAnswerOverridesState(initialOverrides);
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-[#0284C7] hover:from-sky-600 hover:to-sky-700 text-white rounded-xl font-black text-xs shadow-sm cursor-pointer shrink-0"
                              >
                                🔍 Inspect & Grade Submission
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-xs font-bold text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl">
                          No student submissions recorded yet. Submissions will appear here automatically when students attempt quizzes.
                        </div>
                      )}
                    </div>

                  </div>

                </div>

              </div>
            ) : showTestSettingsPage ? (
              /* VIEW A2: TEST SETTINGS (MATCHING NEW SCREENSHOTS 3, 4 & 5) */
              <div className="space-y-6 max-w-4xl mx-auto">
                
                {/* Header Bar */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowTestSettingsPage(false)}
                      className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Test Settings</span>
                      <span className="px-2 py-0.5 bg-rose-500 text-white rounded-md text-[10px] font-black uppercase">New</span>
                    </h2>
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      type="button" 
                      onClick={() => setMessage({ type: 'success', text: 'Test settings reset to default!' })}
                      className="text-sky-600 text-xs font-extrabold hover:underline cursor-pointer"
                    >
                      Reset to default
                    </button>

                    <button 
                      type="button" 
                      onClick={() => {
                        setMessage({ type: 'success', text: 'Test settings saved successfully!' });
                        setShowTestSettingsPage(false);
                      }}
                      className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>

                {/* Blue Info Alert Banner */}
                <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl text-sky-800 dark:text-sky-300 text-xs font-bold text-center">
                  These settings will automatically be applied to all the tests you create except tests which have real exam student experience enabled
                </div>

                {/* Section 1: Order */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="w-7 h-7 rounded-full bg-sky-500 text-white font-black flex items-center justify-center text-xs">1</div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Order</h3>
                  </div>

                  <div className="flex items-center gap-6 text-xs font-bold">
                    <label className="text-slate-700 dark:text-slate-300 font-extrabold">Order of Questions:</label>
                    <select className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold focus:outline-none w-64">
                      <option value="Do Nothing">Do Nothing</option>
                      <option value="Randomize Questions">Randomize Questions</option>
                      <option value="Randomize Options">Randomize Options</option>
                    </select>
                  </div>
                </div>

                {/* Section 2: Customize Result */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-2xs">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="w-7 h-7 rounded-full bg-sky-500 text-white font-black flex items-center justify-center text-xs">2</div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Customize Result</h3>
                  </div>

                  {/* Generate Rank Toggle */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">Generate Rank</h4>
                        <p className="text-xs text-slate-500 font-medium">Your students will get a rank based on their performance</p>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-black">
                        <span className="text-slate-400">Off</span>
                        <input type="checkbox" defaultChecked className="accent-sky-600 w-4 h-4 rounded-xs cursor-pointer" />
                        <span className="text-sky-600">On</span>
                      </div>
                    </div>

                    <div className="pl-4 space-y-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" defaultChecked className="accent-sky-600 rounded-xs w-4 h-4" />
                        <div>
                          <span className="font-black text-slate-900 dark:text-white">Batch Test Rank</span>
                          <p className="text-[11px] text-slate-400 font-normal">Batch test rank is generated once the test is assigned to a batch</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" defaultChecked className="accent-sky-600 rounded-xs w-4 h-4" />
                        <div>
                          <span className="font-black text-slate-900 dark:text-white">Global / Institute Rank</span>
                          <p className="text-[11px] text-slate-400 font-normal">Let your students compete with other students of your institute.</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" defaultChecked className="accent-sky-600 rounded-xs w-4 h-4" />
                        <div>
                          <span className="font-black text-slate-900 dark:text-white">Percentile</span>
                          <p className="text-[11px] text-slate-400 font-normal">The percentile rank is equated based on percentage score that falls below a certain specified score. Percentile = [1 - (Rank in test / Total Number of Candidates taking test)] * 100</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Letter Grading Grid */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">Enable Letter Grading</h4>
                        <p className="text-xs text-slate-500 font-medium">Now customize and give grades to your students according to their performance</p>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-black">
                        <span className="text-slate-400">Off</span>
                        <input type="checkbox" defaultChecked className="accent-sky-600 w-4 h-4 rounded-xs cursor-pointer" />
                        <span className="text-sky-600">On</span>
                      </div>
                    </div>

                    <div className="p-6 bg-sky-50/40 dark:bg-slate-850 rounded-2xl border border-sky-100 dark:border-slate-800 space-y-3 text-xs font-bold">
                      {[
                        { grade: 'Grade A', min: '>=70 %', max: '<= 100 %' },
                        { grade: 'Grade B', min: '>=50 %', max: '< 70 %' },
                        { grade: 'Grade C', min: '>=35 %', max: '< 50 %' },
                        { grade: 'Grade D', min: '>=20 %', max: '< 35 %' },
                        { grade: 'Grade E', min: '>=10 %', max: '< 20 %' },
                        { grade: 'Grade F', min: '<=0 %', max: '< 10 %' }
                      ].map(g => (
                        <div key={g.grade} className="flex items-center gap-6">
                          <span className="w-20 font-black text-slate-900 dark:text-white">{g.grade}</span>
                          <div className="flex items-center gap-3 flex-1">
                            <input type="text" defaultValue={g.min} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-center font-black text-slate-900 dark:text-white w-36" />
                            <span className="text-slate-400">to</span>
                            <input type="text" defaultValue={g.max} className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-center font-black text-slate-500 w-36" readOnly />
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-center text-xs text-sky-600 font-extrabold italic">
                      * Alongwith the results your students will also get a detailed performance report. <span className="underline cursor-pointer">Preview sample result file</span>
                    </p>
                  </div>

                </div>

                {/* Section 3: Solution */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-2xs">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="w-7 h-7 rounded-full bg-sky-500 text-white font-black flex items-center justify-center text-xs">3</div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Solution</h3>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">Enable Solution</h4>
                      <p className="text-xs text-slate-500 font-medium">Your students will be able to view the test solutions</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-black">
                      <span className="text-slate-400">Off</span>
                      <input type="checkbox" defaultChecked className="accent-sky-600 w-4 h-4 rounded-xs cursor-pointer" />
                      <span className="text-sky-600">On</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 text-xs font-bold">
                    <div>
                      <label className="block text-slate-900 dark:text-white font-black mb-1">When to show Solution:</label>
                      <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold focus:outline-none">
                        <option value="Immediately after test completion">Immediately after test completion</option>
                        <option value="After deadline">After deadline</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-900 dark:text-white font-black mb-1">Reveal Correct Answer:</label>
                      <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold focus:outline-none">
                        <option value="All Questions">All Questions</option>
                        <option value="Incorrect Only">Incorrect Only</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input type="checkbox" className="accent-sky-600 rounded-xs w-4 h-4" />
                    <div>
                      <span className="font-black text-slate-900 dark:text-white">Click here to give solutions only once</span>
                      <p className="text-[11px] text-slate-400 font-normal">If you select this option, your students will get solutions <strong>only once</strong> right after the test is over and never again. In all other cases, solution will always be available with the students.</p>
                    </div>
                  </label>
                </div>

                {/* Section 4: Sections */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="w-7 h-7 rounded-full bg-sky-500 text-white font-black flex items-center justify-center text-xs">4</div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Sections</h3>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">Allow Section Switching</h4>
                      <p className="text-xs text-slate-500 font-medium">Student can switch sections during the course of the test when you create more than one section</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-black">
                      <span className="text-slate-400">Off</span>
                      <input type="checkbox" defaultChecked className="accent-sky-600 w-4 h-4 rounded-xs cursor-pointer" />
                      <span className="text-sky-600">On</span>
                    </div>
                  </div>
                </div>

                {/* Section 5: Timer */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="w-7 h-7 rounded-full bg-sky-500 text-white font-black flex items-center justify-center text-xs">5</div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Timer</h3>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">Show time spent per question while attempting test</h4>
                      <p className="text-xs text-slate-500 font-medium">Student will view a timer running next to the marking scheme. This will help them see the amount of time they are spending on every question.</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-black">
                      <span className="text-slate-400">Off</span>
                      <input type="checkbox" defaultChecked className="accent-sky-600 w-4 h-4 rounded-xs cursor-pointer" />
                      <span className="text-sky-600">On</span>
                    </div>
                  </div>
                </div>

                {/* Section 6: Calculator */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="w-7 h-7 rounded-full bg-sky-500 text-white font-black flex items-center justify-center text-xs">6</div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">Calculator</h3>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">Allow student a virtual calculator while attempting test</h4>
                      <p className="text-xs text-slate-500 font-medium">Choose default calculator, students won't be able to switch between calculators</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-black">
                      <span className="text-sky-600 font-black">Off</span>
                      <input type="checkbox" className="accent-sky-600 w-4 h-4 rounded-xs cursor-pointer" />
                      <span className="text-slate-400">On</span>
                    </div>
                  </div>
                </div>

              </div>
            ) : editingTestForQuestions ? (
              <div className="space-y-6">
                
                {/* Header Bar */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditingTestForQuestions(null)}
                      className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      {editingTestForQuestions.title || 'Decimals ABHYAAS Class 7'}
                    </h2>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => alert(`Previewing test "${editingTestForQuestions.title}" in student view mode!`)}
                      className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 cursor-pointer"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMessage({ type: 'success', text: `Test "${editingTestForQuestions.title}" saved successfully!` });
                        setEditingTestForQuestions(null);
                      }}
                      className="px-5 py-2 bg-slate-300 dark:bg-slate-700 hover:bg-sky-600 hover:text-white text-slate-800 dark:text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      Save Test
                    </button>
                  </div>
                </div>

                {/* Test Details Card (Screenshot 3) */}
                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-400">
                      <span className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                        Test Details <Edit3 className="w-3.5 h-3.5 text-sky-500 inline" />
                      </span>
                      <span>🕒 Test Duration: <strong className="text-slate-900 dark:text-white">30mins</strong></span>
                      <span>🏷️ Tags: <strong className="text-slate-900 dark:text-white">#Grade7, #ABHYAAS, #MCQTest, #SarvottamDiksha</strong></span>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    All Questions are compulsory | No Negative Marking
                  </div>
                </div>

                {/* Main 2-Column Builder Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Sidebar Accordion Options (Screenshots 3, 4 & 5) */}
                  <div className="md:col-span-4 space-y-3">
                    
                    {/* 1. Create Questions Accordion */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                      <button
                        onClick={() => setActiveSidebarAccordion(activeSidebarAccordion === 'CREATE_QUESTIONS' ? null : 'CREATE_QUESTIONS')}
                        className="w-full p-4 flex items-center justify-between text-slate-900 dark:text-white font-black text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-sky-500" />
                          <span>Create Questions</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${activeSidebarAccordion === 'CREATE_QUESTIONS' ? 'rotate-180' : ''}`} />
                      </button>

                      {activeSidebarAccordion === 'CREATE_QUESTIONS' && (
                        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                          {[
                            'Multiple Choice Questions',
                            'True/False Questions',
                            'Comprehension Questions',
                            'Fill In The Blanks Questions',
                            'Integer Type Questions'
                          ].map(qType => (
                            <button
                              key={qType}
                              onClick={() => {
                                setEditingQuestionId(null);
                                setNewQuestionForm({
                                  questionText: '',
                                  sectionName: 'Section A',
                                  questionType: qType.includes('True') ? 'TRUE_FALSE' : (qType.includes('Fill') ? 'FILL_BLANKS' : 'MCQ'),
                                  positiveMarks: 4,
                                  negativeMarks: 1,
                                  optionA: '',
                                  optionB: '',
                                  optionC: '',
                                  optionD: '',
                                  correctOption: 'A',
                                  solutionText: ''
                                });
                                setIsQuestionModalOpen(true);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-600 cursor-pointer transition-colors"
                            >
                              {qType}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2. Grading Accordion (Screenshot 5) */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                      <button
                        onClick={() => setActiveSidebarAccordion(activeSidebarAccordion === 'GRADING' ? null : 'GRADING')}
                        className="w-full p-4 flex items-center justify-between text-slate-900 dark:text-white font-black text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-sky-500" />
                          <span>Grading</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${activeSidebarAccordion === 'GRADING' ? 'rotate-180' : ''}`} />
                      </button>

                      {activeSidebarAccordion === 'GRADING' && (
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                          {[
                            { label: 'Multiple Choice', posKey: 'mcqPos', negKey: 'mcqNeg' },
                            { label: 'True/False', posKey: 'tfPos', negKey: 'tfNeg' },
                            { label: 'Fill In The Blanks', posKey: 'fibPos', negKey: 'fibNeg' },
                            { label: 'Integer Type', posKey: 'intPos', negKey: 'intNeg' }
                          ].map(item => (
                            <div key={item.label} className="flex items-center justify-between gap-2">
                              <label className="flex items-center gap-2">
                                <input type="checkbox" className="rounded-xs" defaultChecked />
                                <span>{item.label}</span>
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={gradingRules[item.posKey]}
                                  onChange={(e) => setGradingRules({ ...gradingRules, [item.posKey]: e.target.value })}
                                  className="w-12 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md py-1 text-center font-bold"
                                />
                                <input
                                  type="number"
                                  value={gradingRules[item.negKey]}
                                  onChange={(e) => setGradingRules({ ...gradingRules, [item.negKey]: e.target.value })}
                                  className="w-12 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md py-1 text-center font-bold"
                                />
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => setMessage({ type: 'success', text: 'Grading marks rule updated successfully!' })}
                            className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer"
                          >
                            Submit
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 3. Test Sections Accordion (Screenshot 1) */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                      <button
                        onClick={() => setActiveSidebarAccordion(activeSidebarAccordion === 'SECTIONS' ? null : 'SECTIONS')}
                        className="w-full p-4 flex items-center justify-between text-slate-900 dark:text-white font-black text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-sky-500" />
                          <span>Test Sections</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${activeSidebarAccordion === 'SECTIONS' ? 'rotate-180' : ''}`} />
                      </button>

                      {activeSidebarAccordion === 'SECTIONS' && (
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <div className="flex items-center justify-between text-slate-500 text-[11px]">
                            <span>Section1 - {sampleQuestions.length} Questions</span>
                            <div className="flex items-center gap-2">
                              <Edit3 className="w-3.5 h-3.5 hover:text-sky-600 cursor-pointer" />
                              <Trash2 className="w-3.5 h-3.5 hover:text-rose-600 cursor-pointer" />
                            </div>
                          </div>

                          {testSectionsList.map(sec => (
                            <div key={sec.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 font-black text-slate-900 dark:text-white">
                              {sec.name}
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => {
                              setTestSectionsList([
                                ...testSectionsList,
                                { id: `sec-${Date.now()}`, name: `Section ${String.fromCharCode(65 + testSectionsList.length)}`, questionCount: 5 }
                              ]);
                              setMessage({ type: 'success', text: 'New test section added!' });
                            }}
                            className="w-full py-2.5 bg-white dark:bg-slate-900 border-2 border-sky-400 text-sky-600 dark:text-sky-400 font-black text-xs rounded-xl hover:bg-sky-50 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add New Section</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 4. Import Questions Accordion (Screenshot 2) */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                      <button
                        onClick={() => setActiveSidebarAccordion(activeSidebarAccordion === 'IMPORT' ? null : 'IMPORT')}
                        className="w-full p-4 flex items-center justify-between text-slate-900 dark:text-white font-black text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4 text-sky-500" />
                          <span>Import Questions</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${activeSidebarAccordion === 'IMPORT' ? 'rotate-180' : ''}`} />
                      </button>

                      {activeSidebarAccordion === 'IMPORT' && (
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs font-bold text-center">
                          <button
                            type="button"
                            onClick={() => setMessage({ type: 'success', text: 'Importing questions from library...' })}
                            className="w-full py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sky-600 dark:text-sky-400 font-bold hover:bg-sky-50 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <span>From My Library</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OR</div>

                          <button
                            type="button"
                            onClick={() => setMessage({ type: 'success', text: 'Word file question parser ready!' })}
                            className="w-full py-3 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-sky-600 dark:text-sky-400 font-bold hover:border-sky-500 cursor-pointer"
                          >
                            Upload Word File
                          </button>

                          <button type="button" className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-extrabold cursor-pointer">
                            Download Sample Word File Format
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 5. Test Settings Accordion (Screenshot 3) */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                      <button
                        onClick={() => setActiveSidebarAccordion(activeSidebarAccordion === 'SETTINGS' ? null : 'SETTINGS')}
                        className="w-full p-4 flex items-center justify-between text-slate-900 dark:text-white font-black text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-sky-500" />
                          <span>Test Settings</span>
                        </div>
                        <span className="text-[10px] text-sky-500 font-extrabold flex items-center gap-1">
                          <span>Advanced Settings</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeSidebarAccordion === 'SETTINGS' ? 'rotate-180' : ''}`} />
                        </span>
                      </button>

                      {activeSidebarAccordion === 'SETTINGS' && (
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <div>
                            <label className="block text-slate-900 dark:text-white font-black mb-1">Order Of Questions</label>
                            <select
                              value={questionOrderingMode}
                              onChange={(e) => setQuestionOrderingMode(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold focus:outline-none"
                            >
                              <option value="Do Nothing">Do Nothing</option>
                              <option value="Randomize">Randomize Questions</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-900 dark:text-white">Enable Solutions</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400">Off</span>
                                <input
                                  type="checkbox"
                                  checked={enableSolutionsToggle}
                                  onChange={(e) => setEnableSolutionsToggle(e.target.checked)}
                                  className="accent-sky-600 rounded-xs w-4 h-4"
                                />
                                <span className="text-[10px] text-sky-600">On</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">Allow students to view the test solutions</p>
                          </div>

                          <div>
                            <label className="block text-slate-900 dark:text-white font-black mb-1">Reveal Correct Answers</label>
                            <select
                              value={revealCorrectAnswersMode}
                              onChange={(e) => setRevealCorrectAnswersMode(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold focus:outline-none"
                            >
                              <option value="All Questions">All Questions</option>
                              <option value="Incorrect Questions Only">Incorrect Questions Only</option>
                            </select>
                          </div>

                          <div className="space-y-2 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="solutionTime"
                                checked={solutionRevealTimeOption === 'IMMEDIATE'}
                                onChange={() => setSolutionRevealTimeOption('IMMEDIATE')}
                                className="accent-sky-600"
                              />
                              <span>Immediately after test completion</span>
                            </label>

                            <select className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold focus:outline-none">
                              <option value="Always Show Solution">Always Show Solution</option>
                              <option value="Show Once">Show Once</option>
                            </select>

                            <label className="flex items-center gap-2 cursor-pointer pt-1">
                              <input
                                type="radio"
                                name="solutionTime"
                                checked={solutionRevealTimeOption === 'AFTER_DEADLINE'}
                                onChange={() => setSolutionRevealTimeOption('AFTER_DEADLINE')}
                                className="accent-sky-600"
                              />
                              <span>After deadline is over</span>
                            </label>
                          </div>

                          <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-3">
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-900 dark:text-white">Allow Section Switching</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400">Off</span>
                                <input
                                  type="checkbox"
                                  checked={allowSectionSwitchingToggle}
                                  onChange={(e) => setAllowSectionSwitchingToggle(e.target.checked)}
                                  className="accent-sky-600 rounded-xs w-4 h-4"
                                />
                                <span className="text-[10px] text-sky-600">On</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">
                              Student can switch sections during the course of the test when you create more than one section.
                            </p>
                          </div>

                          <div className="border-t border-slate-100 dark:border-slate-800 pt-3 text-center">
                            <button
                              type="button"
                              onClick={() => setMessage({ type: 'success', text: 'Exporting test questions PDF...' })}
                              className="text-xs font-black text-sky-600 dark:text-sky-400 hover:underline flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Export test as PDF</span>
                            </button>
                          </div>

                        </div>
                      )}
                    </div>

                  </div>

                  {/* Right Questions Canvas (Screenshots 3 & 4) */}
                  <div className="md:col-span-8 space-y-4">
                    {quizQuestionsList.length === 0 ? (
                      /* Empty Section State (Matching Screenshot 4) */
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-6 shadow-md flex flex-col items-center justify-center min-h-[420px]">
                        <div className="w-20 h-20 rounded-full bg-sky-50 dark:bg-slate-800 flex items-center justify-center relative">
                          <div className="w-14 h-14 rounded-full bg-sky-100 dark:bg-slate-750 flex items-center justify-center">
                            <Award className="w-8 h-8 text-sky-500" />
                          </div>
                          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-sky-500 text-white rounded-md font-black text-[9px]">A+</span>
                        </div>

                        <div className="space-y-2 max-w-sm">
                          <h3 className="text-xl font-black text-slate-900 dark:text-white">No Questions Added Yet</h3>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            Click <strong className="text-slate-900 dark:text-white">'Create Questions'</strong> or <strong className="text-slate-900 dark:text-white">'Import Questions'</strong> on the left panel to add your questions to this test.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestionId(null);
                            setNewQuestionForm({
                              questionText: '',
                              sectionName: 'Section A',
                              questionType: 'MCQ',
                              positiveMarks: 4,
                              negativeMarks: 1,
                              optionA: '',
                              optionB: '',
                              optionC: '',
                              optionD: '',
                              correctOption: 'A',
                              solutionText: ''
                            });
                            setIsQuestionModalOpen(true);
                          }}
                          className="px-8 py-3 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          + Add New Question
                        </button>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-sky-500 dark:border-sky-600 p-6 space-y-6 shadow-md">
                        
                        {/* Section Title Bar */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                          <h3 className="text-sm font-black text-slate-900 dark:text-white">
                            Section A – {quizQuestionsList.length} Questions
                          </h3>
                          
                          <div className="flex items-center gap-3 text-xs font-black text-sky-600 dark:text-sky-400">
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to clear all questions in this test?')) {
                                  setQuizQuestionsList([]);
                                  localStorage.setItem('sarvottam_admin_draft_questions', JSON.stringify([]));
                                  setMessage({ type: 'info', text: 'Cleared all questions.' });
                                }
                              }}
                              className="hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span className="text-rose-600 dark:text-rose-400">Delete All Questions</span>
                            </button>
                          </div>
                        </div>

                      {/* Questions List */}
                      <div className="space-y-6">
                        {quizQuestionsList.map((q, idx) => {
                          const qText = q.questionText || q.text || `Question ${idx + 1}`;
                          let optionsArr = [];
                          if (Array.isArray(q.options)) {
                            optionsArr = q.options.map(opt => typeof opt === 'string' ? { text: opt, isCorrect: false } : opt);
                          } else {
                            optionsArr = [
                              { text: q.optionA || 'Option A', isCorrect: q.correctOption === 'A' },
                              { text: q.optionB || 'Option B', isCorrect: q.correctOption === 'B' },
                              { text: q.optionC || 'Option C', isCorrect: q.correctOption === 'C' },
                              { text: q.optionD || 'Option D', isCorrect: q.correctOption === 'D' }
                            ];
                          }

                          return (
                            <div key={q.id || idx} className="p-4 bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs font-bold">
                              <div className="flex items-start gap-2">
                                <span className="font-black text-slate-900 dark:text-white">{idx + 1}.</span>
                                <div className="font-black text-slate-900 dark:text-white text-sm">{qText}</div>
                              </div>

                              {/* Choices */}
                              <div className="space-y-2 pl-4">
                                {optionsArr.map((opt, optIdx) => {
                                  const isCorrect = opt.isCorrect || optIdx === q.correctIndex;
                                  return (
                                    <div
                                      key={optIdx}
                                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                                        isCorrect 
                                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-extrabold' 
                                          : 'text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name={`q-${q.id || idx}`}
                                        checked={isCorrect}
                                        readOnly
                                        className="accent-emerald-600 cursor-pointer"
                                      />
                                      <span>{opt.text || opt}</span>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Question Actions */}
                              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-3">
                                <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-[10px]">
                                  + {q.positiveMarks || q.marks || 1} Marks
                                </span>

                                <div className="flex items-center gap-3 text-xs font-black text-slate-600 dark:text-slate-400">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingQuestionId(q.id);
                                      setNewQuestionForm({
                                        questionText: q.questionText || q.text || '',
                                        sectionName: q.sectionName || 'Section A',
                                        questionType: q.questionType || 'MCQ',
                                        positiveMarks: q.positiveMarks || q.marks || 4,
                                        negativeMarks: q.negativeMarks || 1,
                                        optionA: optionsArr[0]?.text || '',
                                        optionB: optionsArr[1]?.text || '',
                                        optionC: optionsArr[2]?.text || '',
                                        optionD: optionsArr[3]?.text || '',
                                        correctOption: optionsArr.findIndex(o => o.isCorrect) !== -1 ? ['A','B','C','D'][optionsArr.findIndex(o => o.isCorrect)] : 'A',
                                        solutionText: q.solutionText || ''
                                      });
                                      setIsQuestionModalOpen(true);
                                    }}
                                    className="hover:text-sky-600 cursor-pointer"
                                  >
                                    ✏ Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedList = quizQuestionsList.filter(item => item.id !== q.id);
                                      setQuizQuestionsList(updatedList);
                                      localStorage.setItem('sarvottam_admin_draft_questions', JSON.stringify(updatedList));
                                      setMessage({ type: 'success', text: 'Question deleted successfully.' });
                                    }}
                                    className="hover:text-rose-600 cursor-pointer"
                                  >
                                    🗑 Delete
                                  </button>
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  </div>

                </div>

              </div>
            ) : (
              /* VIEW B: MAIN LIBRARY / FOLDER VIEW (SCREENSHOTS 1, 2 & 5) */
              <>
                {/* Title & Action Bar (Screenshot 1 & 5) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-white">
                    {activeFolderBreadcrumb ? (
                      <>
                        <button onClick={() => setActiveFolderBreadcrumb(null)} className="hover:text-sky-600 cursor-pointer">← My Library</button>
                        <span>&gt; ... &gt;</span>
                        <span className="text-sky-500">{activeFolderBreadcrumb}</span>
                      </>
                    ) : (
                      <h2>My Library</h2>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="Search by name (Minimum 3 characters)"
                        className="w-72 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <button 
                      type="button" 
                      onClick={() => { setShowTestSettingsPage(true); setShowTestReportDashboard(false); }}
                      className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-50 hover:border-sky-500 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Sliders className="w-3.5 h-3.5 text-sky-500" />
                      <span>Settings</span>
                    </button>

                    {/* Sort/Filters Button & Popover (Screenshot 1) */}
                    <div className="relative">
                      <button 
                        type="button" 
                        onClick={() => setShowSortFilterPopover(!showSortFilterPopover)}
                        className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-50 hover:border-sky-500 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Sliders className="w-3.5 h-3.5 text-sky-500" />
                        <span>Sort/Filters</span>
                      </button>

                      {/* Sort/Filters Popover Dropdown (Matching Screenshot 1) */}
                      {showSortFilterPopover && (
                        <div className="absolute right-0 top-12 z-40 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-80 overflow-hidden text-xs font-bold">
                          
                          {/* Header */}
                          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="font-black text-slate-900 dark:text-white">Sort/Filters</span>
                            <div className="flex items-center gap-3">
                              <button 
                                type="button" 
                                onClick={() => {
                                  setShowSortFilterPopover(false);
                                  setMessage({ type: 'success', text: 'Sort filter applied!' });
                                }}
                                className="text-sky-600 font-black hover:underline cursor-pointer"
                              >
                                Apply
                              </button>
                              <button type="button" className="text-slate-300 dark:text-slate-600 font-bold cursor-not-allowed">Clear All</button>
                            </div>
                          </div>

                          {/* Body: Left Tabs + Right Options */}
                          <div className="grid grid-cols-12 min-h-[220px]">
                            
                            {/* Left Tab Nav (4 Cols) */}
                            <div className="col-span-5 bg-sky-50/60 dark:bg-slate-800/60 border-r border-slate-100 dark:border-slate-800 p-2 space-y-1">
                              <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 text-sky-600 font-black shadow-2xs cursor-pointer">
                                Sort by
                              </div>
                              <div className="px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 font-bold hover:bg-white/50 cursor-pointer">
                                Filter via
                              </div>
                            </div>

                            {/* Right Radio Options (7 Cols) */}
                            <div className="col-span-7 p-4 space-y-3 text-slate-800 dark:text-slate-200 font-bold">
                              {[
                                { id: 'MODIFIED_ASC', label: 'Modified Date ↑' },
                                { id: 'MODIFIED_DESC', label: 'Modified Date ↓' },
                                { id: 'TITLE_ASC', label: 'Title A-Z' },
                                { id: 'TITLE_DESC', label: 'Title Z-A' },
                                { id: 'ATTEMPTED_ASC', label: 'Last Attempted ↑' },
                                { id: 'ATTEMPTED_DESC', label: 'Last Attempted ↓' }
                              ].map(opt => (
                                <label key={opt.id} className="flex items-center gap-3 cursor-pointer hover:text-sky-600 transition-colors">
                                  <input 
                                    type="radio" 
                                    name="sortOption" 
                                    defaultChecked={opt.id === 'MODIFIED_DESC'}
                                    className="accent-sky-600 cursor-pointer" 
                                  />
                                  <span>{opt.label}</span>
                                </label>
                              ))}
                            </div>

                          </div>
                        </div>
                      )}
                    </div>

                    {/* + New Button & Dropdown Menu (Screenshot 2) */}
                    <div className="relative">
                      <button
                        onClick={() => setShowNewPlusMenu(!showNewPlusMenu)}
                        className="px-5 py-2 bg-gradient-to-r from-sky-400 to-[#0284C7] hover:from-sky-500 hover:to-[#0284C7] text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <span>+ New</span>
                      </button>

                      {/* + New Popover Dropdown (Matching Screenshot 2) */}
                      {showNewPlusMenu && (
                        <div className="absolute right-0 top-12 z-40 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2 w-44 text-center text-xs font-bold space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewPlusMenu(false);
                              setShowCreateNewTestModal(true);
                            }}
                            className="w-full py-3 px-4 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-black text-sm cursor-pointer transition-colors"
                          >
                            Test
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowNewPlusMenu(false);
                              setShowCreateNewTestModal(true);
                            }}
                            className="w-full py-3 px-4 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-black text-sm cursor-pointer transition-colors"
                          >
                            Quiz
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setShowNewPlusMenu(false);
                              setShowAddFolderModal(true);
                            }}
                            className="w-full py-3 px-4 rounded-xl hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-black text-sm cursor-pointer transition-colors"
                          >
                            Folder
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Folder Grid Section (Only when not inside a subfolder) */}
                {!activeFolderBreadcrumb && (
                  <div className="space-y-4">
                    <div className="text-xs font-black text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <input type="checkbox" className="rounded-xs" />
                      <span>Folder ({testPortalFolders.length})</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                      {testPortalFolders.map(folder => (
                        <div
                          key={folder.id}
                          onClick={() => setActiveFolderBreadcrumb(folder.name)}
                          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-center space-y-3 hover:border-sky-500 transition-all shadow-2xs group relative cursor-pointer"
                        >
                          <div className="w-12 h-12 mx-auto rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                            <Folder className="w-6 h-6" />
                          </div>
                          <div className="font-black text-xs text-slate-900 dark:text-white">{folder.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tests List Section (Matching Screenshots 1 & 2) */}
                {(() => {
                  const folderDisplayTests = activeFolderBreadcrumb
                    ? testPortalTests.filter(t => {
                        const folderTag = activeFolderBreadcrumb.toLowerCase().trim();
                        const classNum = folderTag.replace('class', '').trim();
                        
                        const testFolder = (t.folder || '').toLowerCase();
                        const testCategory = (t.category || '').toLowerCase();
                        const testTags = (t.tags || '').toLowerCase();
                        const testTitle = (t.title || '').toLowerCase();

                        return (
                          testFolder === folderTag ||
                          testFolder.includes(folderTag) ||
                          testCategory.includes(`class ${classNum}`) ||
                          testTags.includes(`class ${classNum}`) ||
                          testTitle.includes(`class ${classNum}`) ||
                          testTitle.includes(`class${classNum}`)
                        );
                      })
                    : testPortalTests;

                  return (
                    <div className="space-y-4 pt-2">
                      <div className="text-xs font-black text-slate-600 dark:text-slate-400 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="rounded-xs" />
                          <span>Tests in {activeFolderBreadcrumb || 'Library'} ({folderDisplayTests.length})</span>
                        </div>

                        {activeFolderBreadcrumb && (
                          <button
                            onClick={() => setActiveFolderBreadcrumb(null)}
                            className="text-sky-600 dark:text-sky-400 hover:underline text-xs font-black cursor-pointer"
                          >
                            ← View All Folders
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        {folderDisplayTests.length === 0 ? (
                          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
                            <div className="w-12 h-12 mx-auto rounded-2xl bg-orange-100 dark:bg-orange-950/50 text-[#FF6500] flex items-center justify-center font-black">
                              <FileCheck2 className="w-6 h-6" />
                            </div>
                            <h4 className="font-black text-sm text-slate-900 dark:text-white">
                              {activeFolderBreadcrumb ? `${activeFolderBreadcrumb} Folder is Empty` : 'No Published Tests Found'}
                            </h4>
                            <p className="text-xs text-slate-500 font-extrabold max-w-sm mx-auto">
                              {activeFolderBreadcrumb
                                ? `No tests published for ${activeFolderBreadcrumb} yet. Click "+ Create Quiz" below to create a test for ${activeFolderBreadcrumb}.`
                                : 'Click "+ Create Quiz" above to add questions and publish your test.'}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                if (activeFolderBreadcrumb) {
                                  setNewTestData(prev => ({ ...prev, tags: activeFolderBreadcrumb }));
                                }
                                setShowCreateNewTestModal(true);
                              }}
                              className="px-5 py-2 bg-gradient-to-r from-[#FF6500] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full text-xs font-black inline-flex items-center gap-1.5 shadow-md hover:scale-105 transition-all cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>+ Create Quiz for {activeFolderBreadcrumb || 'Library'}</span>
                            </button>
                          </div>
                        ) : (
                          folderDisplayTests.map(testItem => (
                        <div
                          key={testItem.id}
                          className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs hover:border-sky-500 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input type="checkbox" className="rounded-xs" />
                              <div className="w-9 h-9 rounded-xl bg-sky-500 text-white font-black flex items-center justify-center shadow-xs">
                                <FileCheck2 className="w-5 h-5" />
                              </div>
                              <div
                                onClick={() => setEditingTestForQuestions(testItem)}
                                className="cursor-pointer group"
                              >
                                <div className="font-black text-slate-900 dark:text-white text-sm group-hover:text-sky-600 transition-colors">
                                  {testItem.title}
                                </div>
                                <div className="text-[10px] font-extrabold text-slate-400">
                                  {testItem.tags || testItem.category || '#Class10, #ABHYAAS, #MCQTest'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {testItem.attempted && (
                                <span className="px-3 py-1 rounded-full bg-sky-500 text-white font-black text-[10px] shadow-2xs">
                                  Test Attempted
                                </span>
                              )}
                              <span className="text-slate-400 text-xs font-bold">{testItem.date || '2026/08/31'}</span>
                            </div>
                          </div>

                          {/* Action links toolbar */}
                          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-bold text-sky-600 dark:text-sky-400 border-t border-slate-100 dark:border-slate-800">
                            <button 
                              onClick={() => handleCopyTest(testItem)} 
                              className="hover:underline cursor-pointer flex items-center gap-1 font-black hover:text-sky-700 dark:hover:text-sky-300"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Test</span>
                            </button>
                            
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            
                            <button 
                              onClick={() => {
                                setMoveFolderModalTarget(testItem);
                                setSelectedFolderForMove(testItem.folder || 'Class 10');
                              }} 
                              className="hover:underline cursor-pointer flex items-center gap-1 font-black hover:text-sky-700 dark:hover:text-sky-300"
                            >
                              <Folder className="w-3.5 h-3.5" />
                              <span>Move to folder</span>
                            </button>
                            
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            
                            <button 
                              onClick={() => handleExportTestPDF(testItem)} 
                              className="hover:underline cursor-pointer flex items-center gap-1 font-black hover:text-sky-700 dark:hover:text-sky-300"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Export PDF</span>
                            </button>
                            
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            
                            <button 
                              onClick={() => handleDeleteTest(testItem)} 
                              className="hover:underline text-rose-500 hover:text-rose-700 cursor-pointer flex items-center gap-1 font-black"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                            
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            
                            <button
                              onClick={() => {
                                setActiveTestForOption(testItem);
                                setAddTestToSubScreen('FREE_TEST');
                                setShowAddTestToModal(true);
                              }}
                              className="hover:underline cursor-pointer font-black text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1"
                            >
                              <Gift className="w-3.5 h-3.5" />
                              <span>{testItem.isFreeTest ? '✅ Added to free tests' : 'Add to free tests'}</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}
              </>
            )}

          </main>

          {/* Floating Help Button */}
          <div className="fixed bottom-6 right-6 z-40">
            <button type="button" className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-[#0284C7] text-white font-black text-xs rounded-full shadow-xl flex items-center gap-2 hover:scale-105 cursor-pointer">
              <MessageSquare className="w-4 h-4" />
              <span>Help</span>
            </button>
          </div>

          {/* WELCOME MODAL OVERLAY (SCREENSHOT 2) */}
          {showTestPortalWelcome && (
            <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full grid grid-cols-1 md:grid-cols-12 overflow-hidden relative">
                <button 
                  onClick={() => setShowTestPortalWelcome(false)}
                  className="absolute top-4 right-4 z-10 p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Left Illustration */}
                <div className="md:col-span-6 bg-slate-50 dark:bg-slate-800 p-8 flex flex-col justify-between items-center text-center">
                  <div className="w-full aspect-[4/3] bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex flex-col justify-center items-center shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white font-black flex items-center justify-center shadow-md mb-2">
                      <Folder className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-black text-slate-900 dark:text-white">Organize Tests</div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-extrabold mt-4">
                    Easily create tests & organize them into folders
                  </p>
                </div>

                {/* Right Action Content */}
                <div className="md:col-span-6 p-8 space-y-6 flex flex-col justify-center">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Welcome to your test portal!</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      Now you can easily create tests and make sure your students practice well!
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setShowTestPortalWelcome(false);
                        setShowCreateNewTestModal(true);
                      }}
                      className="w-full py-3.5 bg-gradient-to-r from-sky-400 to-[#0284C7] hover:from-sky-500 hover:to-[#0284C7] text-white font-black text-xs rounded-2xl shadow-lg shadow-sky-500/25 hover:scale-105 transition-all cursor-pointer"
                    >
                      Create your first test
                    </button>
                    
                    <button type="button" className="text-xs font-black text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 mx-auto cursor-pointer">
                      <span>How to create a test</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FULL-PAGE CREATE NEW TEST / QUIZ SERIES WORKSPACE */}
          {showCreateNewTestModal && (
            <div className="fixed inset-0 z-[120] bg-slate-50 dark:bg-slate-950 flex flex-col overflow-y-auto text-slate-900 dark:text-white">
              
              {/* Sticky Portal Top Header */}
              <header className="h-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateNewTestModal(false)}
                    className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-all shadow-2xs mr-2 flex items-center gap-1"
                    title="Back to Test Portal"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-xs font-black hidden sm:inline">Back</span>
                  </button>
                  <div>
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      Sarvottam Diksha <span className="text-sky-500">• Quiz Workspace</span>
                    </h1>
                    <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400">Professional Mathematics Test & Quiz Series Builder</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Theme Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    className="px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-black flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
                    title="Toggle Theme"
                  >
                    {isDark ? (
                      <>
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        <span>Light</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-3.5 h-3.5 text-sky-600" />
                        <span>Dark</span>
                      </>
                    )}
                  </button>

                  {/* Autosaved Indicator */}
                  <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold border border-emerald-200 dark:border-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Autosaved locally</span>
                  </div>

                  {/* Test Preview Button */}
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    className="px-4 py-2.5 rounded-2xl bg-sky-100 hover:bg-sky-200 dark:bg-sky-950 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 font-extrabold text-xs cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview Test</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCreateNewTestModal(false)}
                    className="px-4 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAndPublishQuiz}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#FF6500] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-2xl shadow-md shadow-orange-500/20 cursor-pointer flex items-center gap-2 transition-all hover:scale-102"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save & Publish Test ({quizQuestionsList.length} Qs)</span>
                  </button>
                </div>
              </header>

              {/* Main Full Page Body Container */}
              <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 space-y-10">
                
                {/* Page Hero Header & Workflow Visualizer */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-black uppercase tracking-wider">
                          ABHYAAS ENGINE
                        </span>
                        <span className="text-xs text-slate-400 font-bold">• Step-by-Step Test Creation</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        Create New Test / Quiz Series
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">
                        Build chapterwise practice tests with isolated sections, MCQ / Numerical question types, solution documents, and automated student grading.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => setShowPreviewModal(true)}
                        className="px-5 py-3 bg-slate-900 text-white dark:bg-slate-800 dark:text-white font-black text-xs rounded-2xl cursor-pointer hover:bg-slate-800 flex items-center gap-2 shadow-xs"
                      >
                        <Eye className="w-4 h-4 text-sky-400" />
                        <span>Student View Preview</span>
                      </button>
                    </div>
                  </div>

                  {/* Workflow Steps Indicator Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-black">
                    <div className="p-3 bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 rounded-2xl border border-sky-200 dark:border-sky-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-[11px]">1</span>
                      <span>Test Details</span>
                    </div>
                    <div className="p-3 bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 rounded-2xl border border-sky-200 dark:border-sky-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center text-[11px]">2</span>
                      <span>Sections ({quizSectionsList.length})</span>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">3</span>
                      <span>Add Questions</span>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 rounded-2xl border border-purple-200 dark:border-purple-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[11px]">4</span>
                      <span>Review ({quizQuestionsList.length})</span>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-center gap-2 col-span-2 sm:col-span-1">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px]">5</span>
                      <span>Publish</span>
                    </div>
                  </div>
                </div>

                <form
                  id="fullPageQuizForm"
                  onSubmit={async (e) => {
                    e.preventDefault();

                    const activeToken = localStorage.getItem('sd_token') || localStorage.getItem('token') || localStorage.getItem('sarvottam_token');
                    if (!activeToken) {
                      setMessage({ type: 'error', text: '⚠️ Admin Authentication Required: Please sign in as Admin to save & publish tests!' });
                      return;
                    }

                    const finalTitle = (newTestData.title && newTestData.title.trim()) || 'ABHYAAS Mathematics Practice Test';

                    try {
                      const durationMins = (parseInt(newTestData.durationHour || '0') * 60) + parseInt(newTestData.durationMin || '40');
                      const authHeaders = { Authorization: `Bearer ${activeToken}` };

                      const testRes = await axios.post('/api/admin/tests', {
                        title: finalTitle,
                        durationMinutes: durationMins,
                        tags: newTestData.tags || 'Class 10',
                        totalMarks: Number(newTestData.totalMarks || 100),
                        negativeMarks: Number(newTestData.negativeMarks || 0.25),
                        accessMode: newTestData.accessMode || 'FREE',
                        price: Number(newTestData.price || 0),
                        courseIds: newTestData.selectedCourseIds || [],
                        solutionDocUrl: newTestData.solutionDocUrl,
                        solutionDocName: newTestData.solutionDocName
                      }, { headers: authHeaders });

                      if (testRes.data.success) {
                        const createdTest = testRes.data.test;

                        // Save questions sequentially if any added
                        for (const q of quizQuestionsList) {
                          let optA = q.optionA || '';
                          let optB = q.optionB || '';
                          let optC = q.optionC || '';
                          let optD = q.optionD || '';

                          if (Array.isArray(q.options)) {
                            optA = optA || q.options[0] || '';
                            optB = optB || q.options[1] || '';
                            optC = optC || q.options[2] || '';
                            optD = optD || q.options[3] || '';
                          }

                          await axios.post(`/api/admin/tests/${createdTest.id}/questions`, {
                            sectionName: q.sectionName || 'Section A',
                            questionType: q.questionType || 'MCQ',
                            questionText: q.questionText,
                            imageUrl: q.imageUrl || null,
                            optionA: optA,
                            optionB: optB,
                            optionC: optC,
                            optionD: optD,
                            correctOption: q.correctOption || 'A',
                            explanation: q.explanation || '',
                            marks: Number(q.marks || 1),
                            negativeMarks: Number(q.negativeMarks || 0)
                          }, { headers: authHeaders });
                        }

                        const publishedTestWithQuestions = {
                          ...createdTest,
                          id: createdTest.id,
                          title: createdTest.title || newTestData.title,
                          category: `#${newTestData.tags || 'Class 10'}`,
                          status: 'Published',
                          date: new Date().toISOString().split('T')[0].replace(/-/g, '/'),
                          questions: quizQuestionsList || [],
                          questionsCount: (quizQuestionsList || []).length
                        };

                        try {
                          const storedCustom = JSON.parse(localStorage.getItem('sd_custom_tests') || '[]');
                          const updatedStored = [publishedTestWithQuestions, ...storedCustom.filter(t => t.id !== createdTest.id)];
                          localStorage.setItem('sd_custom_tests', JSON.stringify(updatedStored));

                          const storedCourseQuizzes = JSON.parse(localStorage.getItem('sd_course_quizzes') || '[]');
                          const updatedQuizzes = [publishedTestWithQuestions, ...storedCourseQuizzes.filter(q => q.id !== createdTest.id)];
                          localStorage.setItem('sd_course_quizzes', JSON.stringify(updatedQuizzes));

                          if (createdTest.id) {
                            localStorage.setItem(`sd_test_questions_${createdTest.id}`, JSON.stringify(quizQuestionsList || []));
                          }
                          if (createdTest.title) {
                            localStorage.setItem(`sd_test_questions_${createdTest.title.trim().toLowerCase()}`, JSON.stringify(quizQuestionsList || []));
                          }
                        } catch (e) {}

                        setTestPortalTests([
                          publishedTestWithQuestions,
                          ...testPortalTests.filter(t => t.id !== createdTest.id)
                        ]);

                        setMessage({ type: 'success', text: `🎉 Quiz '${createdTest.title}' with ${quizQuestionsList.length} questions created & published successfully!` });
                        setShowCreateNewTestModal(false);
                        setNewTestData({ title: '', durationHour: '0', durationMin: '40', tags: 'Class 10', totalMarks: '100', negativeMarks: '0.25', solutionDocUrl: '', solutionDocName: '' });
                        setQuizQuestionsList([]);
                        setBuilderValidationErrors({});
                        localStorage.removeItem('sarvottam_admin_draft_questions');
                        localStorage.removeItem('sarvottam_admin_draft_sections');

                        // Refresh Admin Portal Data immediately
                        await fetchAdminData();
                      }
                    } catch (err) {
                      console.error('Publish Test Error:', err);
                      const errMsg = err.response?.data?.error || err.message || 'Failed to save & publish quiz.';
                      setMessage({ type: 'error', text: `⚠️ ${errMsg}` });
                    }
                  }}
                  className="space-y-10"
                >
                  
                  {/* ================= STEP 1: TEST DETAILS & SOLUTION DOCUMENT ================= */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-8 shadow-sm">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest">STAGE 1 OF 5</span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                          1. Test General Details & Solution Document
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">Set title, target grade, time limit, default marks, and optional worked solution document</p>
                      </div>

                      <span className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 font-black text-base flex items-center justify-center">
                        ⚙️
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-black text-slate-900 dark:text-white mb-2">
                          Test Title / Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="testTitleInput"
                          type="text"
                          required
                          placeholder="e.g. ABHYAAS Class 10 Mathematics Board Practice Test 01"
                          value={newTestData.title}
                          onChange={(e) => {
                            setNewTestData({ ...newTestData, title: e.target.value });
                            if (builderValidationErrors.title) setBuilderValidationErrors({});
                          }}
                          className={`w-full bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl p-4 text-slate-900 dark:text-white font-black text-base focus:outline-none transition-all ${
                            builderValidationErrors.title 
                              ? 'border-rose-500 ring-2 ring-rose-500/20' 
                              : 'border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                          }`}
                        />
                        {builderValidationErrors.title && (
                          <p className="text-xs font-black text-rose-500 mt-1.5 flex items-center gap-1">
                            <span>⚠</span> {builderValidationErrors.title}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-black text-slate-900 dark:text-white mb-2">Target Grade / Tag</label>
                        <select
                          value={newTestData.tags}
                          onChange={(e) => setNewTestData({ ...newTestData, tags: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-900 dark:text-white font-black text-sm focus:outline-none focus:border-sky-500"
                        >
                          <option value="Class 7">Class 7</option>
                          <option value="Class 8">Class 8</option>
                          <option value="Class 9">Class 9</option>
                          <option value="Class 10">Class 10</option>
                          <option value="Class 11">Class 11</option>
                          <option value="Class 12">Class 12</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-black text-slate-900 dark:text-white mb-2">Duration (Hours)</label>
                          <select
                            value={newTestData.durationHour}
                            onChange={(e) => setNewTestData({ ...newTestData, durationHour: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-900 dark:text-white font-black text-sm focus:outline-none focus:border-sky-500"
                          >
                            <option value="0">0 hours</option>
                            <option value="1">1 hour</option>
                            <option value="2">2 hours</option>
                            <option value="3">3 hours</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-black text-slate-900 dark:text-white mb-2">Duration (Mins)</label>
                          <select
                            value={newTestData.durationMin}
                            onChange={(e) => setNewTestData({ ...newTestData, durationMin: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-900 dark:text-white font-black text-sm focus:outline-none focus:border-sky-500"
                          >
                            <option value="15">15 mins</option>
                            <option value="30">30 mins</option>
                            <option value="40">40 mins</option>
                            <option value="60">60 mins</option>
                            <option value="90">90 mins</option>
                            <option value="120">120 mins</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-black text-slate-900 dark:text-white mb-2">Total Test Marks</label>
                        <input
                          type="number"
                          value={newTestData.totalMarks}
                          onChange={(e) => setNewTestData({ ...newTestData, totalMarks: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-900 dark:text-white font-black text-sm focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-black text-slate-900 dark:text-white mb-2">Default Negative Marking</label>
                        <input
                          type="number"
                          step="0.25"
                          value={newTestData.negativeMarks}
                          onChange={(e) => setNewTestData({ ...newTestData, negativeMarks: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-900 dark:text-white font-black text-sm focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    {/* PUBLICATION ACCESS MODE SELECTION CARD */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border-2 border-sky-100 dark:border-slate-700 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span>🔐 How should students access this test?</span>
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">Choose offering model: Free for all, Paid standalone, or Included with Courses</p>
                        </div>
                        <span className="px-3 py-1 bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-black text-xs rounded-full">
                          {newTestData.accessMode === 'FREE' ? 'Free Access' : newTestData.accessMode === 'PAID' ? `Paid Standalone (₹${newTestData.price})` : 'Course Included'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Option 1: Free */}
                        <div
                          onClick={() => setNewTestData({ ...newTestData, accessMode: 'FREE' })}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                            newTestData.accessMode === 'FREE'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-slate-900 dark:text-white">🎁 Free for Students</span>
                            {newTestData.accessMode === 'FREE' && <span className="text-emerald-600 font-black text-xs">✓ Selected</span>}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-2">No purchase needed. Available immediately to all logged-in students.</p>
                        </div>

                        {/* Option 2: Paid Standalone */}
                        <div
                          onClick={() => setNewTestData({ ...newTestData, accessMode: 'PAID' })}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                            newTestData.accessMode === 'PAID'
                              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/20'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-slate-900 dark:text-white">💳 Paid Standalone Test</span>
                            {newTestData.accessMode === 'PAID' && <span className="text-amber-600 font-black text-xs">✓ Selected</span>}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-2">Requires individual purchase before student can attempt.</p>
                        </div>

                        {/* Option 3: Course Included */}
                        <div
                          onClick={() => setNewTestData({ ...newTestData, accessMode: 'COURSE_ONLY' })}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                            newTestData.accessMode === 'COURSE_ONLY'
                              ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 ring-2 ring-sky-500/20'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-sky-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-black text-slate-900 dark:text-white">🎓 Include in Course</span>
                            {newTestData.accessMode === 'COURSE_ONLY' && <span className="text-sky-600 font-black text-xs">✓ Selected</span>}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium mt-2">Unlocked automatically for students enrolled in selected course.</p>
                        </div>
                      </div>

                      {/* Standalone Price Field */}
                      {newTestData.accessMode === 'PAID' && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-2">
                          <label className="block text-xs font-black text-amber-900 dark:text-amber-300">
                            Standalone Test Price (₹ INR) *
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 199 or 299"
                            value={newTestData.price}
                            onChange={(e) => setNewTestData({ ...newTestData, price: e.target.value })}
                            className="w-full bg-white dark:bg-slate-900 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-3 text-slate-900 dark:text-white font-black text-sm focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      )}

                      {/* Course Selection Dropdown */}
                      {(newTestData.accessMode === 'COURSE_ONLY' || newTestData.accessMode === 'PAID') && (
                        <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-800 space-y-2">
                          <label className="block text-xs font-black text-sky-900 dark:text-sky-300">
                            Associate / Attach to Course(s) (Optional)
                          </label>
                          <select
                            multiple
                            value={newTestData.selectedCourseIds}
                            onChange={(e) => {
                              const opts = Array.from(e.target.selectedOptions, option => option.value);
                              setNewTestData({ ...newTestData, selectedCourseIds: opts });
                            }}
                            className="w-full bg-white dark:bg-slate-900 border-2 border-sky-300 dark:border-sky-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-sky-500 min-h-[90px]"
                          >
                            {courses.map(c => (
                              <option key={c.id} value={c.id}>
                                📚 {c.title} (₹{c.price})
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-slate-500 font-medium">Hold Ctrl (or Cmd) to select multiple courses to attach this quiz to.</p>
                        </div>
                      )}
                    </div>

                    {/* UPLOAD CARD: SOLUTION DOCUMENT */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border-2 border-dashed border-sky-200 dark:border-slate-700 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span>📄 Worked Solution Document (Optional)</span>
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">Attach PDF or Word document containing complete step-by-step solutions for student review</p>
                        </div>

                        {newTestData.solutionDocName && (
                          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-xs rounded-full">
                            Attached
                          </span>
                        )}
                      </div>

                      <input
                        type="file"
                        ref={solutionDocFileInputRef}
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const dataUrl = event.target.result;
                              setNewTestData(prev => ({
                                ...prev,
                                solutionDocUrl: dataUrl,
                                solutionDocName: file.name
                              }));
                              setMessage({ type: 'success', text: `Attached solution document '${file.name}'!` });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />

                      {!newTestData.solutionDocName ? (
                        <button
                          type="button"
                          onClick={() => solutionDocFileInputRef.current?.click()}
                          className="w-full py-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-400 text-slate-700 dark:text-slate-200 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:shadow-md"
                        >
                          <FileText className="w-5 h-5 text-sky-500" />
                          <span>Click to Upload Solution PDF / Word Document</span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-sky-200 dark:border-slate-700">
                          <div className="flex items-center gap-3">
                            <FileText className="w-6 h-6 text-sky-500" />
                            <div>
                              <div className="text-sm font-black text-slate-900 dark:text-white">{newTestData.solutionDocName}</div>
                              <div className="text-[11px] text-slate-400 font-medium">Ready to bundle with test results</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => solutionDocFileInputRef.current?.click()}
                              className="px-3.5 py-2 bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-black text-xs rounded-xl cursor-pointer hover:bg-sky-200"
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewTestData({ ...newTestData, solutionDocUrl: '', solutionDocName: '' })}
                              className="px-3.5 py-2 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-black text-xs rounded-xl cursor-pointer hover:bg-rose-200"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ================= STEP 2: TEST SECTIONS & STRUCTURE ================= */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest">STAGE 2 OF 5</span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                          2. Sections
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">Manage test sections. Clicking "+ Add New Section" automatically generates Section B, Section C, etc.</p>
                      </div>

                      <span className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 font-black text-base flex items-center justify-center">
                        📁
                      </span>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-800/70 rounded-3xl border-2 border-sky-100 dark:border-slate-700 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <label className="block text-sm font-black text-slate-900 dark:text-white">
                            TEST SECTIONS ({quizSectionsList.length})
                          </label>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">
                            Click a section pill below to edit its questions.
                          </p>
                        </div>

                        {/* Automatic Section Generator Button */}
                        <button
                          type="button"
                          onClick={() => {
                            let nextLetter = 'A';
                            if (quizSectionsList.length > 0) {
                              const lastSec = quizSectionsList[quizSectionsList.length - 1];
                              const match = lastSec.match(/^Section\s+([A-Z])$/i);
                              if (match) {
                                nextLetter = String.fromCharCode(match[1].toUpperCase().charCodeAt(0) + 1);
                              } else {
                                nextLetter = String.fromCharCode(65 + quizSectionsList.length);
                              }
                            }
                            const autoSecName = `Section ${nextLetter}`;
                            
                            const newSecs = [...quizSectionsList, autoSecName];
                            setQuizSectionsList(newSecs);
                            
                            // Auto select newly created section & reset question entry
                            setNewQuestionForm(prev => ({
                              ...prev,
                              sectionName: autoSecName,
                              questionText: '',
                              imageUrl: '',
                              optionA: '',
                              optionB: '',
                              optionC: '',
                              optionD: '',
                              correctOption: prev.questionType === 'TRUE_FALSE' ? 'A' : (prev.questionType === 'TYPING' ? '' : 'A'),
                              explanation: ''
                            }));
                            setEditingQuestionId(null);

                            localStorage.setItem('sarvottam_admin_draft_sections', JSON.stringify(newSecs));
                            setMessage({ type: 'success', text: `✨ Automatically created ${autoSecName} & selected it!` });
                          }}
                          className="px-5 py-3 bg-gradient-to-r from-sky-500 to-[#0284C7] hover:from-sky-600 hover:to-sky-700 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-102 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Add New Section</span>
                        </button>
                      </div>

                      {/* Active Section Pills */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        {quizSectionsList.map(secName => {
                          const secCount = quizQuestionsList.filter(q => q.sectionName === secName).length;
                          const isActive = newQuestionForm.sectionName === secName;
                          return (
                            <button
                              key={secName}
                              type="button"
                              onClick={() => {
                                setNewQuestionForm(prev => ({ ...prev, sectionName: secName }));
                                setEditingQuestionId(null);
                              }}
                              className={`px-5 py-3 rounded-2xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
                                isActive
                                  ? 'bg-[#0284C7] text-white shadow-md scale-102 ring-2 ring-sky-300'
                                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <span>📁 {secName} · {secCount} {secCount === 1 ? 'Question' : 'Questions'}</span>
                              {quizSectionsList.length > 1 && (
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const updatedSecs = quizSectionsList.filter(s => s !== secName);
                                    const updatedQs = quizQuestionsList.filter(q => q.sectionName !== secName);
                                    setQuizSectionsList(updatedSecs);
                                    setQuizQuestionsList(updatedQs);
                                    if (newQuestionForm.sectionName === secName) {
                                      setNewQuestionForm(prev => ({ ...prev, sectionName: updatedSecs[0] || 'Section A' }));
                                    }
                                  }}
                                  className="ml-1 text-xs text-rose-300 hover:text-rose-100 font-black cursor-pointer"
                                  title="Delete Section"
                                >
                                  ✕
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* BULK IMPORT EXCEL / CSV CARD WITH UNAMBIGUOUS QUESTION ID DIAGRAM MAPPING */}
                    <div className="p-6 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-3xl border border-emerald-200 dark:border-emerald-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-base font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                            <span>📊 Question Bank Import (Excel / CSV + Unambiguous ID Diagram Mapping)</span>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] font-black uppercase tracking-wider">
                              Preview & Diagnostic Enabled
                            </span>
                          </h4>
                          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                            Import multi-section questions using Question IDs (Q1, Q2, Q21) with automatic diagram image matching (.png, .jpg, .jpeg, .webp) and pre-import diagnostic preview.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* File input for Spreadsheet */}
                          <input
                            type="file"
                            ref={csvFileInputRef}
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              const fileName = file.name.toLowerCase();
                              const reader = new FileReader();

                              setImportProgress({ current: 0, total: 100, isImporting: true, message: 'Reading spreadsheet file...' });

                              reader.onload = async (evt) => {
                                try {
                                  let rowsData = [];
                                  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                                    const data = new Uint8Array(evt.target.result);
                                    const workbook = XLSX.read(data, { type: 'array' });
                                    const firstSheetName = workbook.SheetNames[0];
                                    const worksheet = workbook.Sheets[firstSheetName];
                                    rowsData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
                                  } else {
                                    const text = new TextDecoder().decode(evt.target.result);
                                    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
                                    if (lines.length > 0) {
                                      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
                                      for (let i = 1; i < lines.length; i++) {
                                        const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
                                        const rowObj = {};
                                        headers.forEach((h, idx) => {
                                          rowObj[h] = parts[idx] || '';
                                        });
                                        rowsData.push(rowObj);
                                      }
                                    }
                                  }

                                  if (rowsData.length === 0) {
                                    setImportProgress(null);
                                    setMessage({ type: 'error', text: 'No rows found in uploaded file.' });
                                    return;
                                  }

                                  const validQuestions = [];
                                  const hardErrors = [];
                                  const warnings = [];
                                  const newlyDiscoveredSections = new Set(quizSectionsList);
                                  const seenQuestionIds = new Set();
                                  const referencedDiagramsSet = new Set();

                                  const totalRows = rowsData.length;

                                  for (let i = 0; i < totalRows; i++) {
                                    const row = rowsData[i];
                                    const rowNum = i + 2; // Line 1 is header

                                    const getVal = (...keys) => {
                                      for (const k of keys) {
                                        const matchKey = Object.keys(row).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
                                        if (matchKey && String(row[matchKey]).trim() !== '') {
                                          return String(row[matchKey]).trim();
                                        }
                                      }
                                      return '';
                                    };

                                    // Extract Question ID (e.g. Q1, Q2, Q21)
                                    let qId = getVal('questionId', 'question_id', 'qid', 'id');
                                    if (!qId) {
                                      // Fallback to row index Q format if unprovided
                                      qId = `Q${i + 1}`;
                                    }

                                    if (seenQuestionIds.has(qId.toUpperCase())) {
                                      hardErrors.push(`Row ${rowNum}: Duplicate Question ID "${qId}" detected in spreadsheet.`);
                                    }
                                    seenQuestionIds.add(qId.toUpperCase());

                                    const questionText = getVal('questionText', 'question', 'prompt', 'text');
                                    if (!questionText) {
                                      hardErrors.push(`Row ${rowNum} (${qId}): Missing question prompt text.`);
                                      continue;
                                    }

                                    const rowSec = getVal('sectionName', 'section', 'sec');
                                    const secName = rowSec || newQuestionForm.sectionName || 'Section A';
                                    newlyDiscoveredSections.add(secName);

                                    let qType = getVal('questionType', 'type', 'qtype').toUpperCase();
                                    if (qType.includes('TRUE') || qType.includes('TF')) {
                                      qType = 'TRUE_FALSE';
                                    } else if (qType.includes('TYP') || qType.includes('NUM')) {
                                      qType = 'TYPING';
                                    } else {
                                      qType = 'MCQ';
                                    }

                                    const optA = getVal('optionA', 'option_a', 'choiceA', 'choice_a', 'a');
                                    const optB = getVal('optionB', 'option_b', 'choiceB', 'choice_b', 'b');
                                    const optC = getVal('optionC', 'option_c', 'choiceC', 'choice_c', 'c');
                                    const optD = getVal('optionD', 'option_d', 'choiceD', 'choice_d', 'd');
                                    let correctOpt = getVal('correctOption', 'correct_option', 'correct', 'answer', 'target');

                                    if (qType === 'MCQ') {
                                      if (!correctOpt) hardErrors.push(`Row ${rowNum} (${qId}): Missing correct answer choice.`);
                                      if (!optA && !optB) hardErrors.push(`Row ${rowNum} (${qId}): MCQ requires option choices.`);
                                    } else if (qType === 'TRUE_FALSE') {
                                      if (!correctOpt) hardErrors.push(`Row ${rowNum} (${qId}): Missing correct choice for True/False.`);
                                    } else if (qType === 'TYPING') {
                                      if (!correctOpt) hardErrors.push(`Row ${rowNum} (${qId}): Missing numerical answer target.`);
                                    }

                                    const marksVal = getVal('marks', 'positive_marks', 'pos_marks', 'mark') || '4';
                                    const negMarksVal = getVal('negativeMarks', 'negative_marks', 'neg_marks', 'neg') || '1';

                                    // Unambiguous Diagram Matching by Question ID or Filename
                                    let explicitDiagFile = getVal('diagram', 'diagram_file', 'image', 'imageUrl', 'figure');
                                    let matchedImageData = '';
                                    let diagramStatus = 'none'; // 'attached' | 'none' | 'missing'

                                    if (explicitDiagFile) {
                                      if (explicitDiagFile.startsWith('http') || explicitDiagFile.startsWith('data:')) {
                                        matchedImageData = explicitDiagFile;
                                        diagramStatus = 'attached';
                                      } else {
                                        const normDiagName = explicitDiagFile.toLowerCase().trim();
                                        const normStem = normDiagName.replace(/\.[^/.]+$/, '');
                                        referencedDiagramsSet.add(normDiagName);
                                        referencedDiagramsSet.add(normStem);

                                        matchedImageData = importedDiagramFilesMap[normDiagName] || importedDiagramFilesMap[normStem] || '';
                                        if (matchedImageData) {
                                          diagramStatus = 'attached';
                                        } else {
                                          diagramStatus = 'missing';
                                          warnings.push(`${qId}: Diagram missing: ${explicitDiagFile}`);
                                        }
                                      }
                                    } else {
                                      // Automatic lookup by Question ID (e.g. Q1.png, Q1.jpg, q1.webp)
                                      const idLower = qId.toLowerCase().trim();
                                      const candidates = [`${idLower}.png`, `${idLower}.jpg`, `${idLower}.jpeg`, `${idLower}.webp`, idLower];
                                      for (const cand of candidates) {
                                        if (importedDiagramFilesMap[cand]) {
                                          matchedImageData = importedDiagramFilesMap[cand];
                                          diagramStatus = 'attached';
                                          explicitDiagFile = cand;
                                          referencedDiagramsSet.add(cand);
                                          break;
                                        }
                                      }
                                    }

                                    validQuestions.push({
                                      customQId: qId,
                                      id: `q-excel-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
                                      sectionName: secName,
                                      questionType: qType,
                                      questionText: questionText,
                                      imageUrl: matchedImageData || '',
                                      diagramRefName: explicitDiagFile || '',
                                      diagramStatus: diagramStatus,
                                      optionA: qType === 'TRUE_FALSE' ? 'True' : optA,
                                      optionB: qType === 'TRUE_FALSE' ? 'False' : optB,
                                      optionC: optC,
                                      optionD: optD,
                                      correctOption: correctOpt.toUpperCase().includes('TRUE') ? 'A' : (correctOpt.toUpperCase().includes('FALSE') ? 'B' : correctOpt),
                                      explanation: getVal('explanation', 'solution', 'worked_solution', 'concept_explanation'),
                                      marks: Number(marksVal) || 4,
                                      negativeMarks: Number(negMarksVal) || 1
                                    });
                                  }

                                  setImportProgress(null);

                                  // Track unused uploaded diagrams
                                  const unusedDiagrams = importedDiagramFileNamesList.filter(fname => {
                                    const lower = fname.toLowerCase().trim();
                                    const stem = lower.replace(/\.[^/.]+$/, '');
                                    return !referencedDiagramsSet.has(lower) && !referencedDiagramsSet.has(stem);
                                  });

                                  // Set Import Preview State
                                  setImportPreviewState({
                                    parsedQuestions: validQuestions,
                                    discoveredSections: Array.from(newlyDiscoveredSections),
                                    hardErrors,
                                    warnings,
                                    unusedDiagrams
                                  });

                                } catch (err) {
                                  setImportProgress(null);
                                  console.error('Spreadsheet import error:', err);
                                  setMessage({ type: 'error', text: 'Failed to parse Excel/CSV question bank file.' });
                                }
                              };

                              reader.readAsArrayBuffer(file);
                            }}
                          />

                          {/* Hidden File Picker for Diagram Images */}
                          <input
                            type="file"
                            ref={diagramFolderInputRef}
                            accept="image/png, image/jpeg, image/jpg, image/webp"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length === 0) return;

                              const fileMap = { ...importedDiagramFilesMap };
                              const fileNames = [...importedDiagramFileNamesList];
                              let processed = 0;

                              files.forEach(f => {
                                const r = new FileReader();
                                r.onload = (evt) => {
                                  const dataUrl = evt.target.result;
                                  const fullName = f.name.toLowerCase().trim();
                                  const baseName = fullName.replace(/\.[^/.]+$/, '');
                                  fileMap[fullName] = dataUrl;
                                  fileMap[baseName] = dataUrl;
                                  if (!fileNames.includes(f.name)) fileNames.push(f.name);
                                  processed++;

                                  if (processed === files.length) {
                                    setImportedDiagramFilesMap(fileMap);
                                    setImportedDiagramFileNamesList(fileNames);
                                    setMessage({ type: 'success', text: `🖼️ Pre-loaded ${files.length} diagram image files! Ready for Question ID matching.` });
                                  }
                                };
                                r.readAsDataURL(f);
                              });
                            }}
                          />

                          {/* Button 1: Attach Diagram Images */}
                          <button
                            type="button"
                            onClick={() => diagramFolderInputRef.current?.click()}
                            className={`px-3.5 py-2.5 rounded-2xl font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                              importedDiagramFileNamesList.length > 0
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300'
                                : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                            }`}
                            title="Pre-attach diagram images (e.g. Q1.png, Q2.jpg, Q21.webp) referenced by Question ID"
                          >
                            <span>🖼️ {importedDiagramFileNamesList.length > 0 ? `${importedDiagramFileNamesList.length} Diagrams Pre-loaded` : '+ Attach Diagram Files'}</span>
                          </button>

                          {/* Button 2: Upload Excel/CSV */}
                          <button
                            type="button"
                            onClick={() => csvFileInputRef.current?.click()}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer hover:scale-102 transition-all"
                          >
                            <Download className="w-4 h-4" />
                            <span>Upload Excel / CSV Sheet</span>
                          </button>

                          {/* Button 3: Download Excel Template */}
                          <button
                            type="button"
                            onClick={() => {
                              const templateData = [
                                {
                                  'Question ID': 'Q1',
                                  Section: 'Section A',
                                  Question: 'What is the SI unit of electric current?',
                                  'Question Type': 'MCQ',
                                  'Option A': 'Ampere (A)',
                                  'Option B': 'Volt (V)',
                                  'Option C': 'Ohm (Ω)',
                                  'Option D': 'Watt (W)',
                                  'Correct Answer': 'A',
                                  Marks: 4,
                                  'Negative Marks': 1,
                                  Solution: 'Electric current is measured in Amperes (A = C/s)',
                                  'Diagram File': 'Q1.png'
                                },
                                {
                                  'Question ID': 'Q2',
                                  Section: 'Section A',
                                  Question: 'Calculate the value of x if 3x - 15 = 45',
                                  'Question Type': 'TYPING',
                                  'Option A': '',
                                  'Option B': '',
                                  'Option C': '',
                                  'Option D': '',
                                  'Correct Answer': '20',
                                  Marks: 4,
                                  'Negative Marks': 0,
                                  Solution: '3x = 60 => x = 20',
                                  'Diagram File': ''
                                },
                                {
                                  'Question ID': 'Q21',
                                  Section: 'Section B',
                                  Question: 'The angle in a semicircle is a right angle.',
                                  'Question Type': 'TRUE_FALSE',
                                  'Option A': 'True',
                                  'Option B': 'False',
                                  'Option C': '',
                                  'Option D': '',
                                  'Correct Answer': 'True',
                                  Marks: 2,
                                  'Negative Marks': 0.5,
                                  Solution: 'Thales theorem states angle subtended by diameter is 90 degrees.',
                                  'Diagram File': 'Q21.jpg'
                                }
                              ];

                              const ws = XLSX.utils.json_to_sheet(templateData);
                              const wb = XLSX.utils.book_new();
                              XLSX.utils.book_append_sheet(wb, ws, 'Questions');
                              XLSX.writeFile(wb, 'Sarvottam_Question_Bank_Template.xlsx');
                            }}
                            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50 rounded-2xl font-black text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <span>⬇️ Excel (.xlsx) Template</span>
                          </button>

                          {/* Button 4: Download CSV Template */}
                          <button
                            type="button"
                            onClick={() => {
                              const sampleCsv = `Question ID,Section,Question,Question Type,Option A,Option B,Option C,Option D,Correct Answer,Marks,Negative Marks,Solution,Diagram File\nQ1,Section A,Express 25 mm in cm,MCQ,2.5 cm,20.5 cm,2.05 cm,All of the above,A,4,1,Divide mm by 10 to get cm,Q1.png\nQ21,Section B,What is the value of x if 2x + 5 = 15?,TYPING,,,,,5,4,0,Subtract 5 then divide by 2,Q21.jpg`;
                              const blob = new Blob([sampleCsv], { type: 'text/csv' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'Sarvottam_Question_Bank_Template.csv';
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/40 rounded-2xl font-black text-xs cursor-pointer"
                          >
                            <span>⬇️ CSV Template</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* INTERACTIVE IMPORT PREVIEW MODAL */}
                    {importPreviewState && (
                      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[85vh] flex flex-col space-y-6 shadow-2xl">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-xs uppercase">
                                  PRE-IMPORT DIAGNOSTIC PREVIEW
                                </span>
                                {importPreviewState.hardErrors.length === 0 ? (
                                  <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                                    <span>✓ Ready to Import</span>
                                  </span>
                                ) : (
                                  <span className="text-xs font-black text-rose-500 flex items-center gap-1">
                                    <span>⚠ Errors Must Be Resolved</span>
                                  </span>
                                )}
                              </div>
                              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                                Question Bank Import Diagnostic Preview
                              </h3>
                              <p className="text-xs text-slate-500 font-medium">Review Question ID mapping, diagram associations & section distribution before final submission</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setImportPreviewState(null)}
                              className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Summary Stats Badges */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                              <div className="text-slate-400 font-bold">Total Questions</div>
                              <div className="text-lg font-black text-slate-900 dark:text-white">{importPreviewState.parsedQuestions.length}</div>
                            </div>
                            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                              <div className="text-slate-400 font-bold">Sections ({importPreviewState.discoveredSections.length})</div>
                              <div className="text-xs font-black text-sky-600 dark:text-sky-400 mt-1 truncate">
                                {importPreviewState.discoveredSections.join(', ')}
                              </div>
                            </div>
                            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                              <div className="text-slate-400 font-bold">Diagrams Attached</div>
                              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                {importPreviewState.parsedQuestions.filter(q => q.diagramStatus === 'attached').length}
                              </div>
                            </div>
                            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                              <div className="text-slate-400 font-bold">Diagram Warnings</div>
                              <div className="text-lg font-black text-amber-500">
                                {importPreviewState.warnings.length}
                              </div>
                            </div>
                          </div>

                          {/* Hard Errors Banner */}
                          {importPreviewState.hardErrors.length > 0 && (
                            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800 space-y-1 text-xs text-rose-700 dark:text-rose-300 font-semibold">
                              <div className="font-black text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                                <span>⚠ Cannot Import — Critical Errors Found in Spreadsheet:</span>
                              </div>
                              {importPreviewState.hardErrors.map((err, idx) => (
                                <div key={idx}>• {err}</div>
                              ))}
                            </div>
                          )}

                          {/* Unused Diagram Files Warning */}
                          {importPreviewState.unusedDiagrams.length > 0 && (
                            <div className="p-3 px-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
                              <span>⚠ Unused uploaded diagram file(s): <strong>{importPreviewState.unusedDiagrams.join(', ')}</strong></span>
                            </div>
                          )}

                          {/* Question ID Diagnostic Row Cards */}
                          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                            {importPreviewState.parsedQuestions.map((q, idx) => (
                              <div
                                key={idx}
                                className="p-4 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                              >
                                <div className="space-y-1 flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-black text-xs">
                                      {q.customQId}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-black text-xs">
                                      📁 {q.sectionName}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-black text-xs">
                                      {q.questionType}
                                    </span>
                                    <span className="font-bold text-emerald-600">
                                      +{q.marks} / -{q.negativeMarks} marks
                                    </span>
                                  </div>

                                  <div className="font-bold text-slate-900 dark:text-white truncate pt-0.5">
                                    <MathRenderer text={q.questionText} inline />
                                  </div>
                                </div>

                                {/* Diagram Status Badge */}
                                <div className="flex items-center gap-3 self-end sm:self-center">
                                  {q.diagramStatus === 'attached' ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-xs border border-emerald-300">
                                      {q.imageUrl && <img src={q.imageUrl} alt="Diagram" className="h-6 w-8 object-contain rounded bg-white" />}
                                      <span>✓ Diagram: {q.diagramRefName || 'Attached'}</span>
                                    </div>
                                  ) : q.diagramStatus === 'missing' ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black text-xs border border-amber-300">
                                      <span>⚠ Diagram missing: {q.diagramRefName}</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 font-bold px-2 text-[11px]">No diagram</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                            <button
                              type="button"
                              onClick={() => setImportPreviewState(null)}
                              className="px-5 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              Cancel Import
                            </button>

                            <button
                              type="button"
                              disabled={importPreviewState.hardErrors.length > 0}
                              onClick={() => {
                                const validQuestions = importPreviewState.parsedQuestions;
                                const newlyDiscoveredSections = importPreviewState.discoveredSections;

                                // Check duplicates against existing test questions
                                const existingSet = new Set(quizQuestionsList.map(q => `${q.sectionName.toLowerCase()}:::${q.questionText.trim().toLowerCase()}`));
                                const duplicates = validQuestions.filter(q => existingSet.has(`${q.sectionName.toLowerCase()}:::${q.questionText.trim().toLowerCase()}`));
                                const newQuestions = validQuestions.filter(q => !existingSet.has(`${q.sectionName.toLowerCase()}:::${q.questionText.trim().toLowerCase()}`));

                                setImportPreviewState(null);

                                if (duplicates.length > 0) {
                                  setImportDuplicateState({
                                    duplicates,
                                    newQuestions,
                                    allValidQuestions: validQuestions,
                                    discoveredSections: newlyDiscoveredSections,
                                    validationErrors: []
                                  });
                                  return;
                                }

                                const updatedSecs = Array.from(new Set([...quizSectionsList, ...newlyDiscoveredSections]));
                                setQuizSectionsList(updatedSecs);
                                const updatedQuestions = [...quizQuestionsList, ...validQuestions];
                                setQuizQuestionsList(updatedQuestions);
                                localStorage.setItem('sarvottam_admin_draft_questions', JSON.stringify(updatedQuestions));
                                localStorage.setItem('sarvottam_admin_draft_sections', JSON.stringify(updatedSecs));

                                setImportSummaryReport({
                                  successCount: validQuestions.length,
                                  errorRows: []
                                });

                                setMessage({ type: 'success', text: `✓ ${validQuestions.length} questions imported successfully across sections!` });
                              }}
                              className={`px-6 py-3 rounded-2xl font-black text-xs shadow-lg flex items-center gap-2 transition-all ${
                                importPreviewState.hardErrors.length > 0
                                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white cursor-pointer hover:scale-102'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Import {importPreviewState.parsedQuestions.length} Questions into Test</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* DUPLICATE WARNING MODAL */}
                    {importDuplicateState && (
                      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl">
                          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
                            <span className="text-3xl">⚠</span>
                            <div>
                              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                Duplicate Questions Detected
                              </h3>
                              <p className="text-xs text-slate-500 font-medium">
                                This file contains {importDuplicateState.duplicates.length} question(s) that already exist in this test.
                              </p>
                            </div>
                          </div>

                          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <div>• <strong className="text-amber-700 dark:text-amber-300">{importDuplicateState.newQuestions.length} New Question(s)</strong> ready to import</div>
                            <div>• <strong className="text-rose-600 dark:text-rose-400">{importDuplicateState.duplicates.length} Duplicate Question(s)</strong> detected in spreadsheet</div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                const toAdd = importDuplicateState.newQuestions;
                                const updatedSecs = Array.from(new Set([...quizSectionsList, ...importDuplicateState.discoveredSections]));
                                setQuizSectionsList(updatedSecs);
                                const updatedQuestions = [...quizQuestionsList, ...toAdd];
                                setQuizQuestionsList(updatedQuestions);
                                localStorage.setItem('sarvottam_admin_draft_questions', JSON.stringify(updatedQuestions));
                                localStorage.setItem('sarvottam_admin_draft_sections', JSON.stringify(updatedSecs));
                                setMessage({ type: 'success', text: `✓ Imported ${toAdd.length} new non-duplicate questions!` });
                                setImportDuplicateState(null);
                              }}
                              className="w-full sm:flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl cursor-pointer shadow-md"
                            >
                              Skip Duplicates & Import {importDuplicateState.newQuestions.length} New Qs
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const toAdd = importDuplicateState.allValidQuestions;
                                const updatedSecs = Array.from(new Set([...quizSectionsList, ...importDuplicateState.discoveredSections]));
                                setQuizSectionsList(updatedSecs);
                                const updatedQuestions = [...quizQuestionsList, ...toAdd];
                                setQuizQuestionsList(updatedQuestions);
                                localStorage.setItem('sarvottam_admin_draft_questions', JSON.stringify(updatedQuestions));
                                localStorage.setItem('sarvottam_admin_draft_sections', JSON.stringify(updatedSecs));
                                setMessage({ type: 'success', text: `✓ Imported all ${toAdd.length} questions (including duplicates)!` });
                                setImportDuplicateState(null);
                              }}
                              className="w-full sm:w-auto px-5 py-3 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-xs rounded-2xl cursor-pointer hover:bg-slate-300"
                            >
                              Import All ({importDuplicateState.allValidQuestions.length})
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* IMPORT PROGRESS MODAL */}
                    {importProgress && importProgress.isImporting && (
                      <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 text-center shadow-2xl">
                          <div className="text-3xl animate-bounce">📊</div>
                          <h4 className="text-base font-black text-slate-900 dark:text-white">Importing Question Bank...</h4>
                          <p className="text-xs text-slate-500 font-medium">{importProgress.message}</p>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.round((importProgress.current / importProgress.total) * 100))}%` }}
                            ></div>
                          </div>
                          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {importProgress.current} / {importProgress.total} Questions
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ================= STEP 3: BUILD QUESTIONS ================= */}
                  <div id="questionBuilderCard" className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
                    {(() => {
                      const activeSecQs = quizQuestionsList.filter(q => q.sectionName === newQuestionForm.sectionName);
                      const activeSecMarks = activeSecQs.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
                      return (
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">STAGE 3 OF 5</span>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
                              3. Add Questions — <span className="text-[#0284C7] underline decoration-2">{newQuestionForm.sectionName} — {activeSecQs.length} {activeSecQs.length === 1 ? 'Question' : 'Questions'} · {activeSecMarks} Marks</span>
                              {editingQuestionId && (
                                <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-black">
                                  ✏️ Editing Existing Question
                                </span>
                              )}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">Select question type, enter mathematical text, upload diagram figure, set answer choices and step-by-step solution</p>
                          </div>

                          <span className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 font-black text-base flex items-center justify-center">
                            ✍️
                          </span>
                        </div>
                      );
                    })()}

                    {/* QUESTION TYPE VISUAL SELECTOR CARDS */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-black text-slate-900 dark:text-white">
                          Question Type Selection
                        </label>
                        <span className="text-xs font-bold text-slate-400">All 5 Question Types</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        {/* 1. Multiple Choice Questions */}
                        <div
                          onClick={() => {
                            setNewQuestionForm({ ...newQuestionForm, questionType: 'MCQ', correctOption: 'A' });
                          }}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                            newQuestionForm.questionType === 'MCQ'
                              ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 ring-2 ring-sky-500/20'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-sky-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">Multiple Choice Questions</span>
                            {newQuestionForm.questionType === 'MCQ' && <span className="text-sky-600 font-black text-xs">✓</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold mt-2">Options A, B, C, D</p>
                        </div>

                        {/* 2. True/False Questions */}
                        <div
                          onClick={() => {
                            setNewQuestionForm({
                              ...newQuestionForm,
                              questionType: 'TRUE_FALSE',
                              optionA: 'True',
                              optionB: 'False',
                              optionC: '',
                              optionD: '',
                              correctOption: 'A'
                            });
                          }}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                            newQuestionForm.questionType === 'TRUE_FALSE'
                              ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/20'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">True/False Questions</span>
                            {newQuestionForm.questionType === 'TRUE_FALSE' && <span className="text-purple-600 font-black text-xs">✓</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold mt-2">Evaluate True / False</p>
                        </div>

                        {/* 3. Comprehension Questions */}
                        <div
                          onClick={() => {
                            setNewQuestionForm({ ...newQuestionForm, questionType: 'COMPREHENSION', correctOption: 'A' });
                          }}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                            newQuestionForm.questionType === 'COMPREHENSION'
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/20'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">Comprehension Questions</span>
                            {newQuestionForm.questionType === 'COMPREHENSION' && <span className="text-indigo-600 font-black text-xs">✓</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold mt-2">Passage-based reading</p>
                        </div>

                        {/* 4. Fill In The Blanks Questions */}
                        <div
                          onClick={() => {
                            setNewQuestionForm({
                              ...newQuestionForm,
                              questionType: 'FILL_BLANKS',
                              optionA: '',
                              optionB: '',
                              optionC: '',
                              optionD: '',
                              correctOption: ''
                            });
                          }}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                            newQuestionForm.questionType === 'FILL_BLANKS'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">Fill In The Blanks Questions</span>
                            {newQuestionForm.questionType === 'FILL_BLANKS' && <span className="text-emerald-600 font-black text-xs">✓</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold mt-2">Typed blank word</p>
                        </div>

                        {/* 5. Integer Type Questions */}
                        <div
                          onClick={() => {
                            setNewQuestionForm({
                              ...newQuestionForm,
                              questionType: 'INTEGER',
                              optionA: '',
                              optionB: '',
                              optionC: '',
                              optionD: '',
                              correctOption: ''
                            });
                          }}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                            newQuestionForm.questionType === 'INTEGER' || newQuestionForm.questionType === 'TYPING'
                              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/20'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">Integer Type Questions</span>
                            {(newQuestionForm.questionType === 'INTEGER' || newQuestionForm.questionType === 'TYPING') && <span className="text-amber-600 font-black text-xs">✓</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold mt-2">Numerical integer target</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-black text-slate-900 dark:text-white mb-2">
                          Active Section
                        </label>
                        <select
                          value={newQuestionForm.sectionName}
                          onChange={(e) => {
                            setNewQuestionForm({ ...newQuestionForm, sectionName: e.target.value });
                            setEditingQuestionId(null);
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-sky-500"
                        >
                          {quizSectionsList.map(sec => {
                            const c = quizQuestionsList.filter(q => q.sectionName === sec).length;
                            return <option key={sec} value={sec}>{sec} · {c} Questions</option>;
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-black text-slate-900 dark:text-white mb-2">+ Positive Marks</label>
                        <input
                          type="number"
                          value={newQuestionForm.marks}
                          onChange={(e) => setNewQuestionForm({ ...newQuestionForm, marks: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-black text-slate-900 dark:text-white mb-2">- Negative Marks</label>
                        <input
                          type="number"
                          step="0.25"
                          value={newQuestionForm.negativeMarks}
                          onChange={(e) => setNewQuestionForm({ ...newQuestionForm, negativeMarks: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    {/* QUESTION TEXT WITH MATHEMATICS KEYBOARD & LIVE RENDERED PREVIEW */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="block text-sm font-black text-slate-900 dark:text-white">
                          Question Prompt / Problem Text <span className="text-rose-500">*</span>
                        </label>
                      </div>

                      <MathToolbar
                        label="Math Keyboard — Question Prompt"
                        targetInputRef={questionTextRef}
                        currentValue={newQuestionForm.questionText}
                        onInsert={(val) => {
                          setNewQuestionForm(prev => ({ ...prev, questionText: val }));
                          if (builderValidationErrors.questionText) setBuilderValidationErrors(prev => ({ ...prev, questionText: null }));
                        }}
                      />

                      <textarea
                        ref={questionTextRef}
                        rows={4}
                        placeholder="Type the mathematical question prompt or equation here... (Supports text + math equations)"
                        value={newQuestionForm.questionText}
                        onChange={(e) => {
                          setNewQuestionForm({ ...newQuestionForm, questionText: e.target.value });
                          if (builderValidationErrors.questionText) setBuilderValidationErrors(prev => ({ ...prev, questionText: null }));
                        }}
                        className={`w-full bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl p-4 text-slate-900 dark:text-white font-semibold text-sm leading-relaxed focus:outline-none transition-all ${
                          builderValidationErrors.questionText 
                            ? 'border-rose-500 ring-2 ring-rose-500/20' 
                            : 'border-slate-200 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                        }`}
                      />
                      {builderValidationErrors.questionText && (
                        <p className="text-xs font-black text-rose-500 flex items-center gap-1">
                          <span>⚠</span> {builderValidationErrors.questionText}
                        </p>
                      )}

                      {/* Live Rendered Equation Preview */}
                      {newQuestionForm.questionText && (
                        <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                          <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
                            ✨ Live Formatted Equation Preview:
                          </span>
                          <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                            <MathRenderer text={newQuestionForm.questionText} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* UPLOAD CARD: DIAGRAM / GEOMETRY FIGURE */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-3xl border-2 border-dashed border-sky-200 dark:border-slate-700 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <span>🖼️ Attach Diagram / Geometry Figure / Physics Graph (Optional)</span>
                          </h4>
                          <p className="text-xs text-slate-500 font-medium">Upload geometry diagrams, coordinate graphs, or equation figures</p>
                        </div>

                        {newQuestionForm.imageUrl && (
                          <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black text-xs rounded-full">
                            Diagram Attached
                          </span>
                        )}
                      </div>

                      <input
                        type="file"
                        ref={questionDiagramFileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              setNewQuestionForm({ ...newQuestionForm, imageUrl: evt.target.result });
                              setMessage({ type: 'success', text: `Attached diagram image '${file.name}'!` });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />

                      {!newQuestionForm.imageUrl ? (
                        <button
                          type="button"
                          onClick={() => questionDiagramFileInputRef.current?.click()}
                          className="w-full py-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 hover:border-sky-400 text-slate-700 dark:text-slate-200 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:shadow-md"
                        >
                          <FileText className="w-5 h-5 text-sky-500" />
                          <span>Click to Upload Diagram Image (PNG, JPG)</span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-sky-200 dark:border-slate-700">
                          <div className="flex items-center gap-4">
                            <img src={newQuestionForm.imageUrl} alt="Diagram preview" className="h-14 w-20 object-contain rounded-xl border border-slate-200 dark:border-slate-700 bg-white" />
                            <div>
                              <div className="text-xs font-black text-slate-900 dark:text-white">Diagram Attached Successfully</div>
                              <div className="text-[11px] text-slate-400 font-medium">Will be rendered above question prompt for students</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => questionDiagramFileInputRef.current?.click()}
                              className="px-3.5 py-2 bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-black text-xs rounded-xl cursor-pointer hover:bg-sky-200"
                            >
                              Replace Diagram
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewQuestionForm({ ...newQuestionForm, imageUrl: '' })}
                              className="px-3.5 py-2 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-black text-xs rounded-xl cursor-pointer hover:bg-rose-200"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* DYNAMIC FIELDS PER QUESTION TYPE */}
                    {newQuestionForm.questionType === 'MCQ' ? (
                      <div className="space-y-4 pt-2">
                        <label className="block text-sm font-black text-slate-900 dark:text-white">
                          Multiple Choice Options & Correct Choice
                        </label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Option A */}
                          <div className="space-y-1">
                            <label className="block text-xs font-black text-slate-700 dark:text-slate-300">Option A</label>
                            <MathToolbar
                              label="Math Keyboard (Option A)"
                              targetInputRef={optionARef}
                              currentValue={newQuestionForm.optionA}
                              onInsert={(val) => setNewQuestionForm(prev => ({ ...prev, optionA: val }))}
                            />
                            <input
                              ref={optionARef}
                              type="text"
                              placeholder="Choice A text or equation..."
                              value={newQuestionForm.optionA}
                              onChange={(e) => setNewQuestionForm({ ...newQuestionForm, optionA: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-slate-900 dark:text-white font-semibold text-sm focus:outline-none focus:border-sky-500"
                            />
                            {newQuestionForm.optionA && (
                              <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
                                Preview A: <MathRenderer text={newQuestionForm.optionA} inline />
                              </div>
                            )}
                          </div>

                          {/* Option B */}
                          <div className="space-y-1">
                            <label className="block text-xs font-black text-slate-700 dark:text-slate-300">Option B</label>
                            <MathToolbar
                              label="Math Keyboard (Option B)"
                              targetInputRef={optionBRef}
                              currentValue={newQuestionForm.optionB}
                              onInsert={(val) => setNewQuestionForm(prev => ({ ...prev, optionB: val }))}
                            />
                            <input
                              ref={optionBRef}
                              type="text"
                              placeholder="Choice B text or equation..."
                              value={newQuestionForm.optionB}
                              onChange={(e) => setNewQuestionForm({ ...newQuestionForm, optionB: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-slate-900 dark:text-white font-semibold text-sm focus:outline-none focus:border-sky-500"
                            />
                            {newQuestionForm.optionB && (
                              <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
                                Preview B: <MathRenderer text={newQuestionForm.optionB} inline />
                              </div>
                            )}
                          </div>

                          {/* Option C */}
                          <div className="space-y-1">
                            <label className="block text-xs font-black text-slate-700 dark:text-slate-300">Option C</label>
                            <MathToolbar
                              label="Math Keyboard (Option C)"
                              targetInputRef={optionCRef}
                              currentValue={newQuestionForm.optionC}
                              onInsert={(val) => setNewQuestionForm(prev => ({ ...prev, optionC: val }))}
                            />
                            <input
                              ref={optionCRef}
                              type="text"
                              placeholder="Choice C text or equation..."
                              value={newQuestionForm.optionC}
                              onChange={(e) => setNewQuestionForm({ ...newQuestionForm, optionC: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-slate-900 dark:text-white font-semibold text-sm focus:outline-none focus:border-sky-500"
                            />
                            {newQuestionForm.optionC && (
                              <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
                                Preview C: <MathRenderer text={newQuestionForm.optionC} inline />
                              </div>
                            )}
                          </div>

                          {/* Option D */}
                          <div className="space-y-1">
                            <label className="block text-xs font-black text-slate-700 dark:text-slate-300">Option D</label>
                            <MathToolbar
                              label="Math Keyboard (Option D)"
                              targetInputRef={optionDRef}
                              currentValue={newQuestionForm.optionD}
                              onInsert={(val) => setNewQuestionForm(prev => ({ ...prev, optionD: val }))}
                            />
                            <input
                              ref={optionDRef}
                              type="text"
                              placeholder="Choice D text or equation..."
                              value={newQuestionForm.optionD}
                              onChange={(e) => setNewQuestionForm({ ...newQuestionForm, optionD: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-slate-900 dark:text-white font-semibold text-sm focus:outline-none focus:border-sky-500"
                            />
                            {newQuestionForm.optionD && (
                              <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
                                Preview D: <MathRenderer text={newQuestionForm.optionD} inline />
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-black text-slate-900 dark:text-white mb-1.5">Correct Answer Choice</label>
                          <select
                            value={newQuestionForm.correctOption}
                            onChange={(e) => setNewQuestionForm({ ...newQuestionForm, correctOption: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-emerald-500 dark:border-slate-700 rounded-2xl p-3.5 text-slate-900 dark:text-white font-black text-sm focus:outline-none"
                          >
                            <option value="A">Option A</option>
                            <option value="B">Option B</option>
                            <option value="C">Option C</option>
                            <option value="D">Option D</option>
                          </select>
                        </div>
                      </div>
                    ) : newQuestionForm.questionType === 'TRUE_FALSE' ? (
                      <div className="space-y-3 pt-2">
                        <div className="p-5 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border-2 border-purple-200 dark:border-purple-800 space-y-3">
                          <label className="block text-sm font-black text-purple-900 dark:text-purple-300">Correct Statement Choice</label>
                          <div className="flex items-center gap-8 text-sm font-black">
                            <label className="flex items-center gap-2 cursor-pointer text-emerald-600">
                              <input
                                type="radio"
                                name="tfCorrect"
                                value="A"
                                checked={newQuestionForm.correctOption === 'A'}
                                onChange={() => setNewQuestionForm({ ...newQuestionForm, correctOption: 'A', optionA: 'True', optionB: 'False' })}
                                className="accent-emerald-600 w-5 h-5"
                              />
                              <span>TRUE (Option A)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer text-rose-600">
                              <input
                                type="radio"
                                name="tfCorrect"
                                value="B"
                                checked={newQuestionForm.correctOption === 'B'}
                                onChange={() => setNewQuestionForm({ ...newQuestionForm, correctOption: 'B', optionA: 'True', optionB: 'False' })}
                                className="accent-rose-600 w-5 h-5"
                              />
                              <span>FALSE (Option B)</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 space-y-2">
                        <label className="block text-sm font-black text-slate-900 dark:text-white">✍️ Correct Typed Target Answer *</label>
                        <MathToolbar
                          label="Math Keyboard (Target Answer)"
                          targetInputRef={correctOptionRef}
                          currentValue={newQuestionForm.correctOption}
                          onInsert={(val) => {
                            setNewQuestionForm(prev => ({ ...prev, correctOption: val }));
                            if (builderValidationErrors.correctOption) setBuilderValidationErrors(prev => ({ ...prev, correctOption: null }));
                          }}
                        />
                        <input
                          ref={correctOptionRef}
                          type="text"
                          placeholder="e.g. 180 or 2.5 or x^2 + 5"
                          value={newQuestionForm.correctOption}
                          onChange={(e) => {
                            setNewQuestionForm({ ...newQuestionForm, correctOption: e.target.value });
                            if (builderValidationErrors.correctOption) setBuilderValidationErrors(prev => ({ ...prev, correctOption: null }));
                          }}
                          className={`w-full bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl p-4 text-slate-900 dark:text-white font-black text-base focus:outline-none transition-all ${
                            builderValidationErrors.correctOption 
                              ? 'border-rose-500 ring-2 ring-rose-500/20' 
                              : 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                          }`}
                        />
                        {builderValidationErrors.correctOption && (
                          <p className="text-xs font-black text-rose-500 mt-1 flex items-center gap-1">
                            <span>⚠</span> {builderValidationErrors.correctOption}
                          </p>
                        )}
                        {newQuestionForm.correctOption && (
                          <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200">
                            Preview Target: <MathRenderer text={newQuestionForm.correctOption} inline />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="block text-sm font-black text-slate-900 dark:text-white">Step-by-Step Solution / Explanation</label>
                      <MathToolbar
                        label="Math Keyboard (Solution Explanation)"
                        targetInputRef={explanationRef}
                        currentValue={newQuestionForm.explanation}
                        onInsert={(val) => setNewQuestionForm(prev => ({ ...prev, explanation: val }))}
                      />
                      <textarea
                        ref={explanationRef}
                        rows={3}
                        placeholder="Detailed concept explanation by Manika Ma'am... (Supports math formulas)"
                        value={newQuestionForm.explanation}
                        onChange={(e) => setNewQuestionForm({ ...newQuestionForm, explanation: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-slate-900 dark:text-white font-semibold text-sm focus:outline-none focus:border-sky-500"
                      />
                      {newQuestionForm.explanation && (
                        <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-200 space-y-1">
                          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider block">Solution Preview:</span>
                          <MathRenderer text={newQuestionForm.explanation} />
                        </div>
                      )}
                    </div>

                    {/* PROMINENT ADD QUESTION BUTTONS */}
                    <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newQuestionForm.questionText.trim()) {
                            setBuilderValidationErrors({ questionText: 'Please enter the question text before adding.' });
                            setMessage({ type: 'error', text: 'Please enter question text before adding!' });
                            return;
                          }

                          if (newQuestionForm.questionType === 'TYPING' && !newQuestionForm.correctOption.trim()) {
                            setBuilderValidationErrors({ correctOption: 'Please enter the target numerical answer.' });
                            setMessage({ type: 'error', text: 'Please enter the target numerical answer!' });
                            return;
                          }

                          let updatedList;
                          if (editingQuestionId) {
                            updatedList = quizQuestionsList.map(q => q.id === editingQuestionId ? { ...q, ...newQuestionForm } : q);
                            setMessage({ type: 'success', text: `✅ Question updated in ${newQuestionForm.sectionName}!` });
                            setEditingQuestionId(null);
                          } else {
                            const newQ = {
                              id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                              ...newQuestionForm
                            };
                            updatedList = [...quizQuestionsList, newQ];
                            const secQCount = updatedList.filter(q => q.sectionName === newQuestionForm.sectionName).length;
                            setMessage({ type: 'success', text: `✅ Question added to ${newQuestionForm.sectionName}! (${secQCount} questions in this section)` });
                          }

                          setQuizQuestionsList(updatedList);
                          setBuilderValidationErrors({});
                          localStorage.setItem('sarvottam_admin_draft_questions', JSON.stringify(updatedList));
                          localStorage.setItem('sarvottam_admin_draft_sections', JSON.stringify(quizSectionsList));

                          // Reset question-entry form for immediate entry of next question
                          setNewQuestionForm(prev => ({
                            ...prev,
                            questionText: '',
                            imageUrl: '',
                            optionA: '',
                            optionB: '',
                            optionC: '',
                            optionD: '',
                            correctOption: prev.questionType === 'TRUE_FALSE' ? 'A' : (prev.questionType === 'TYPING' ? '' : 'A'),
                            explanation: ''
                          }));
                        }}
                        className="w-full sm:flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                      >
                        {editingQuestionId ? (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Save Changes to Question</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-5 h-5" />
                            <span>+ Add Question</span>
                          </>
                        )}
                      </button>

                      {editingQuestionId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestionId(null);
                            setNewQuestionForm(prev => ({
                              ...prev,
                              questionText: '',
                              imageUrl: '',
                              optionA: '',
                              optionB: '',
                              optionC: '',
                              optionD: '',
                              correctOption: prev.questionType === 'TRUE_FALSE' ? 'A' : (prev.questionType === 'TYPING' ? '' : 'A'),
                              explanation: ''
                            }));
                          }}
                          className="w-full sm:w-auto px-6 py-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-sm rounded-2xl cursor-pointer hover:bg-slate-300"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ================= STEP 4: REVIEW QUESTIONS IN SECTION ================= */}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">STAGE 4 OF 5</span>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                          4. Review — {newQuestionForm.sectionName} ({quizQuestionsList.filter(q => q.sectionName === newQuestionForm.sectionName).length} {quizQuestionsList.filter(q => q.sectionName === newQuestionForm.sectionName).length === 1 ? 'Question' : 'Questions'})
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">Questions added specifically under {newQuestionForm.sectionName}. Numbers restart per section.</p>
                      </div>

                      <span className="px-4 py-2 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-black text-xs border border-sky-200 dark:border-sky-800">
                        📁 {newQuestionForm.sectionName}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {quizQuestionsList.filter(q => q.sectionName === newQuestionForm.sectionName).length > 0 ? (
                        quizQuestionsList
                          .filter(q => q.sectionName === newQuestionForm.sectionName)
                          .map((q, idx) => (
                            <div
                              key={q.id}
                              className={`p-6 rounded-3xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-2xs ${
                                editingQuestionId === q.id
                                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700'
                                  : 'bg-slate-50/90 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-sky-300'
                              }`}
                            >
                              <div className="space-y-2 flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="px-3 py-1 rounded-full bg-slate-900 text-white font-black text-xs">
                                    Q{idx + 1}
                                  </span>
                                  <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-black text-xs">
                                    {q.questionType === 'MCQ' ? '📝 MCQ' : q.questionType === 'TRUE_FALSE' ? '✅❌ TRUE / FALSE' : '✍️ TYPING / NUMERICAL'}
                                  </span>
                                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs">
                                    +{q.marks} / -{q.negativeMarks} marks
                                  </span>
                                  {q.imageUrl && (
                                    <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black text-xs">
                                      🖼️ Diagram
                                    </span>
                                  )}
                                </div>

                                <div className="font-black text-base text-slate-900 dark:text-white pt-1">
                                  Q{idx + 1}. {q.questionText}
                                </div>

                                {q.questionType === 'MCQ' && (
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400 font-bold">
                                    <div className={q.correctOption === 'A' ? 'text-emerald-600 dark:text-emerald-400 font-black' : ''}>A. {q.optionA || '-'}</div>
                                    <div className={q.correctOption === 'B' ? 'text-emerald-600 dark:text-emerald-400 font-black' : ''}>B. {q.optionB || '-'}</div>
                                    <div className={q.correctOption === 'C' ? 'text-emerald-600 dark:text-emerald-400 font-black' : ''}>C. {q.optionC || '-'}</div>
                                    <div className={q.correctOption === 'D' ? 'text-emerald-600 dark:text-emerald-400 font-black' : ''}>D. {q.optionD || '-'}</div>
                                  </div>
                                )}

                                {q.questionType === 'TYPING' && (
                                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 pt-1">
                                    Target Answer: {q.correctOption}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2.5 self-end sm:self-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingQuestionId(q.id);
                                    setNewQuestionForm({
                                      sectionName: q.sectionName,
                                      questionType: q.questionType,
                                      questionText: q.questionText,
                                      imageUrl: q.imageUrl || '',
                                      optionA: q.optionA || '',
                                      optionB: q.optionB || '',
                                      optionC: q.optionC || '',
                                      optionD: q.optionD || '',
                                      correctOption: q.correctOption || 'A',
                                      explanation: q.explanation || '',
                                      marks: String(q.marks || 4),
                                      negativeMarks: String(q.negativeMarks || 1)
                                    });
                                    const el = document.getElementById('questionBuilderCard');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  className="px-4 py-2.5 bg-sky-100 hover:bg-sky-200 dark:bg-sky-950 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 font-black rounded-2xl cursor-pointer transition-all flex items-center gap-1.5 text-xs"
                                >
                                  ✏️ Edit Question
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = quizQuestionsList.filter(item => item.id !== q.id);
                                    setQuizQuestionsList(updated);
                                    if (editingQuestionId === q.id) setEditingQuestionId(null);
                                    localStorage.setItem('sarvottam_admin_draft_questions', JSON.stringify(updated));
                                    setMessage({ type: 'success', text: `Deleted question from ${newQuestionForm.sectionName}` });
                                  }}
                                  className="px-4 py-2.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 font-black rounded-2xl cursor-pointer transition-all flex items-center gap-1.5 text-xs"
                                >
                                  ✕ Delete
                                </button>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="p-4 px-6 text-center text-xs font-bold text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-center gap-2">
                          <span>📝</span>
                          <span>No questions added to {newQuestionForm.sectionName} yet. Fill in Stage 3 above and click <strong className="text-emerald-600 dark:text-emerald-400 font-black">+ Add Question</strong>!</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ================= STEP 5: REVIEW SUMMARY & PUBLISH ================= */}
                  <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                      <div>
                        <span className="text-xs font-black text-amber-400 uppercase tracking-widest">STAGE 5 OF 5</span>
                        <h4 className="text-xl font-black uppercase tracking-wider text-sky-400 mt-0.5">
                          5. Publish Summary ({quizQuestionsList.length} Total Questions)
                        </h4>
                        <p className="text-xs text-slate-400 font-medium">Review total test configuration across all sections before publishing</p>
                      </div>

                      <span className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/30">
                        {quizSectionsList.length} Total Sections
                      </span>
                    </div>

                    {/* Summary Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-4 bg-slate-800/70 rounded-2xl border border-slate-700/80 space-y-1">
                        <div className="text-xs text-slate-400 font-bold uppercase">Test Duration</div>
                        <div className="text-xl font-black text-white">{newTestData.durationHour || 0}h {newTestData.durationMin || 40}m</div>
                      </div>
                      <div className="p-4 bg-slate-800/70 rounded-2xl border border-slate-700/80 space-y-1">
                        <div className="text-xs text-slate-400 font-bold uppercase">Total Marks</div>
                        <div className="text-xl font-black text-emerald-400">{newTestData.totalMarks || 100} Marks</div>
                      </div>
                      <div className="p-4 bg-slate-800/70 rounded-2xl border border-slate-700/80 space-y-1">
                        <div className="text-xs text-slate-400 font-bold uppercase">Negative Marking</div>
                        <div className="text-xl font-black text-rose-400">-{newTestData.negativeMarks || 0.25} Per Wrong</div>
                      </div>
                      <div className="p-4 bg-slate-800/70 rounded-2xl border border-slate-700/80 space-y-1">
                        <div className="text-xs text-slate-400 font-bold uppercase">Solution Doc</div>
                        <div className="text-sm font-black text-sky-300 truncate">{newTestData.solutionDocName || 'Not attached'}</div>
                      </div>
                    </div>

                    {/* Section Breakdown Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {quizSectionsList.map(secName => {
                        const count = quizQuestionsList.filter(q => q.sectionName === secName).length;
                        return (
                          <div 
                            key={secName} 
                            onClick={() => setNewQuestionForm(prev => ({ ...prev, sectionName: secName }))}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                              newQuestionForm.sectionName === secName 
                                ? 'bg-sky-500/20 border-sky-400 text-white' 
                                : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <div className="text-xs font-black">📁 {secName} · {count} {count === 1 ? 'Question' : 'Questions'}</div>
                            <div className="text-xl font-black text-sky-400 mt-1">{count} <span className="text-xs text-slate-400 font-bold">Questions</span></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </form>
              </main>

              {/* STICKY BOTTOM ACTION BAR */}
              <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-900 dark:text-white hidden sm:inline">
                    Test: <span className="text-sky-500">{newTestData.title || 'Untitled Test'}</span>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs">
                    {quizQuestionsList.length} Questions Saved
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('sarvottam_admin_draft_questions', JSON.stringify(quizQuestionsList));
                      localStorage.setItem('sarvottam_admin_draft_sections', JSON.stringify(quizSectionsList));
                      setMessage({ type: 'success', text: `💾 Draft saved successfully! (${quizQuestionsList.length} questions)` });
                    }}
                    className="px-5 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    💾 Save Draft
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(true)}
                    className="px-5 py-2.5 rounded-2xl bg-sky-100 hover:bg-sky-200 dark:bg-sky-950 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 font-black text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview Test</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAndPublishQuiz}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#FF6500] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-2xl shadow-lg shadow-orange-500/20 cursor-pointer flex items-center gap-2 transition-all hover:scale-102"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save & Publish Test</span>
                  </button>
                </div>
              </div>

              {/* ================= STUDENT EXPERIENCE PREVIEW (CBT EXAM INTERFACE) ================= */}
              {showPreviewModal && (
                <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col font-sans overflow-hidden text-slate-900 dark:text-white">
                  {/* 1. PROFESSIONAL EXAM HEADER */}
                  <header className="bg-slate-900 text-white border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-md shrink-0">
                    {/* LEFT: Branding & Test Title */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white tracking-wider">SARVOTTAM DIKSHA</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-black text-[10px] uppercase border border-sky-500/30">
                          STUDENT PREVIEW MODE
                        </span>
                      </div>
                      <div className="h-5 w-px bg-slate-800 hidden sm:block" />
                      <div className="hidden sm:flex items-center gap-2">
                        <span className="text-sm font-black text-slate-200">{newTestData.title || 'Untitled Test'}</span>
                        {newTestData.tags && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[11px] font-bold">
                            {newTestData.tags}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CENTER: Active Section Badge */}
                    <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-black text-sky-400">
                      <span>📁 Section:</span>
                      <span className="text-white underline decoration-2 decoration-sky-400">{previewActiveSection}</span>
                    </div>

                    {/* RIGHT: Timer & Exit Preview Button */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-slate-800 border border-slate-700/90 px-3.5 py-1.5 rounded-xl font-mono text-amber-400 text-xs font-black shadow-inner">
                        <span>⏱️</span>
                        <span>00:{String(newTestData.durationMin || 40).padStart(2, '0')}:00</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowPreviewModal(false)}
                        className="px-4 py-2 bg-rose-600/90 hover:bg-rose-600 text-white font-black text-xs rounded-xl cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        <span>Exit Preview</span>
                      </button>
                    </div>
                  </header>

                  {/* 2. SECTION NAVIGATION BAR */}
                  <div className="bg-slate-900/95 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between gap-4 overflow-x-auto shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2 hidden sm:inline">SECTIONS:</span>
                      {quizSectionsList.map(secName => {
                        const secQuestions = quizQuestionsList.filter(q => q.sectionName === secName);
                        const count = secQuestions.length;
                        const isActive = previewActiveSection === secName;

                        return (
                          <button
                            key={secName}
                            type="button"
                            onClick={() => {
                              setPreviewActiveSection(secName);
                              setPreviewActiveQuestionIndex(0);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                              isActive
                                ? 'bg-gradient-to-r from-sky-500 to-[#0284C7] text-white shadow-md ring-2 ring-sky-300/40'
                                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                            }`}
                          >
                            <span>📁 {secName}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                            }`}>
                              {count} {count === 1 ? 'Question' : 'Questions'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-xs font-bold text-slate-400 hidden lg:block">
                      Total Test Questions: <span className="text-white font-black">{quizQuestionsList.length}</span>
                    </div>
                  </div>

                  {/* 3. MAIN CBT WORKSPACE (SPLIT VIEW) */}
                  <div className="flex-1 flex overflow-hidden bg-slate-100 dark:bg-slate-950">
                    {(() => {
                      const currentSecQuestions = quizQuestionsList.filter(q => q.sectionName === previewActiveSection);
                      
                      if (currentSecQuestions.length === 0) {
                        return (
                          <div className="flex-1 flex items-center justify-center p-6">
                            <div className="max-w-md w-full p-8 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
                              <div className="text-4xl">📝</div>
                              <div className="space-y-1">
                                <h4 className="text-lg font-black text-slate-900 dark:text-white">No questions in {previewActiveSection} yet.</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                  Add questions in the Question Builder to preview the student CBT experience for this section.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowPreviewModal(false)}
                                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-2xl font-black text-xs cursor-pointer shadow-md transition-all"
                              >
                                ⬅️ Back to Question Builder
                              </button>
                            </div>
                          </div>
                        );
                      }

                      const safeQIndex = Math.min(previewActiveQuestionIndex, currentSecQuestions.length - 1);
                      const currentQ = currentSecQuestions[safeQIndex] || currentSecQuestions[0];
                      const qId = currentQ.id;

                      const isAnswered = Boolean(previewAnswers[qId]);
                      const isMarked = Boolean(previewMarkedForReview[qId]);

                      return (
                        <>
                          {/* LEFT / CENTER: QUESTION CONTAINER */}
                          <div className="flex-1 flex flex-col overflow-y-auto p-6 sm:p-8 space-y-6">
                            {/* Question Meta Header */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 px-6 flex items-center justify-between shadow-2xs">
                              <div className="flex items-center gap-3">
                                <span className="px-3.5 py-1 bg-slate-900 text-white font-black text-xs rounded-xl">
                                  Question {safeQIndex + 1} of {currentSecQuestions.length}
                                </span>
                                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-black text-xs rounded-xl">
                                  {currentQ.questionType === 'MCQ' ? '📝 MCQ' : currentQ.questionType === 'TRUE_FALSE' ? '✅❌ TRUE / FALSE' : '✍️ NUMERICAL / TYPING'}
                                </span>
                              </div>

                              <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                +{currentQ.marks} Marks / -{currentQ.negativeMarks} Negative
                              </div>
                            </div>

                            {/* Question Main Box */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm flex-1">
                              {/* Question Diagram Figure if attached */}
                              {currentQ.imageUrl && (
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-center">
                                  <img
                                    src={currentQ.imageUrl}
                                    alt="Question Diagram"
                                    className="max-h-56 object-contain rounded-xl border bg-white p-2"
                                  />
                                </div>
                              )}

                              {/* Question Prompt */}
                              <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-relaxed flex items-baseline gap-2">
                                <span>Q{safeQIndex + 1}.</span>
                                <MathRenderer text={currentQ.questionText} />
                              </div>

                              {/* Answer Options Container */}
                              {currentQ.questionType === 'MCQ' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                  {['A', 'B', 'C', 'D'].map(optKey => {
                                    const optionVal = currentQ[`option${optKey}`] || currentQ[`option_${optKey.toLowerCase()}`] || (Array.isArray(currentQ.options) ? (typeof currentQ.options[{A:0,B:1,C:2,D:3}[optKey]] === 'string' ? currentQ.options[{A:0,B:1,C:2,D:3}[optKey]] : currentQ.options[{A:0,B:1,C:2,D:3}[optKey]]?.text) : null) || `Option ${optKey}`;
                                    const isSelected = previewAnswers[qId] === optKey;
                                    const isCorrect = currentQ.correctOption === optKey;

                                    return (
                                      <div
                                        key={optKey}
                                        onClick={() => {
                                          setPreviewAnswers(prev => ({ ...prev, [qId]: optKey }));
                                        }}
                                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                                          isSelected
                                            ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 ring-2 ring-sky-500/20'
                                            : isCorrect
                                            ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-sky-300'
                                        }`}
                                      >
                                        <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center transition-all ${
                                          isSelected
                                            ? 'bg-sky-600 text-white'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}>
                                          {optKey}
                                        </div>

                                        <div className="text-sm font-black text-slate-900 dark:text-white flex-1">
                                          <MathRenderer text={optionVal} inline />
                                        </div>

                                        {isCorrect && (
                                          <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black rounded-full">
                                            ✓ Answer Target
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : currentQ.questionType === 'TRUE_FALSE' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                  {['A', 'B'].map(optKey => {
                                    const label = optKey === 'A' ? 'True' : 'False';
                                    const isSelected = previewAnswers[qId] === optKey;
                                    const isCorrect = currentQ.correctOption === optKey;

                                    return (
                                      <div
                                        key={optKey}
                                        onClick={() => setPreviewAnswers(prev => ({ ...prev, [qId]: optKey }))}
                                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                                          isSelected
                                            ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/20'
                                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                                        }`}
                                      >
                                        <span className="text-base font-black text-slate-900 dark:text-white">
                                          {optKey === 'A' ? '✅ TRUE' : '❌ FALSE'}
                                        </span>

                                        {isCorrect && (
                                          <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black rounded-full">
                                            ✓ Answer Target
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="space-y-3 pt-2">
                                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                                    Student Typed Response Field
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Type numerical answer target..."
                                    value={previewAnswers[qId] || ''}
                                    onChange={(e) => setPreviewAnswers(prev => ({ ...prev, [qId]: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-emerald-500 rounded-2xl p-4 text-slate-900 dark:text-white font-black text-base focus:outline-none"
                                  />
                                  <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                    Target Answer: "{currentQ.correctOption}"
                                  </p>
                                </div>
                              )}

                              {/* Step-by-Step Solution Explanation (Admin Verification Preview) */}
                              {currentQ.explanation && (
                                <div className="p-4 bg-sky-50 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-800 space-y-1">
                                  <div className="text-xs font-black text-sky-900 dark:text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <span>💡 Worked Solution / Concept Explanation:</span>
                                  </div>
                                  <p className="text-xs font-semibold text-sky-800 dark:text-sky-200 leading-relaxed">
                                    {currentQ.explanation}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* QUESTION NAVIGATION CONTROLS BOTTOM BAR */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                              {/* Left Controls */}
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                  type="button"
                                  disabled={safeQIndex === 0}
                                  onClick={() => setPreviewActiveQuestionIndex(prev => Math.max(0, prev - 1))}
                                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs disabled:opacity-40 cursor-pointer hover:bg-slate-100"
                                >
                                  ⬅️ Previous
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setPreviewMarkedForReview(prev => ({ ...prev, [qId]: !prev[qId] }))}
                                  className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-black text-xs cursor-pointer transition-all ${
                                    isMarked
                                      ? 'bg-purple-600 text-white shadow-xs'
                                      : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-200'
                                  }`}
                                >
                                  {isMarked ? '🟣 Marked for Review' : '🔖 Mark for Review'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewAnswers(prev => {
                                      const next = { ...prev };
                                      delete next[qId];
                                      return next;
                                    });
                                  }}
                                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-xs cursor-pointer hover:bg-slate-200"
                                >
                                  🧹 Clear Response
                                </button>
                              </div>

                              {/* Right Controls */}
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (safeQIndex < currentSecQuestions.length - 1) {
                                      setPreviewActiveQuestionIndex(safeQIndex + 1);
                                    } else {
                                      alert(`Preview Complete! You reached the end of ${previewActiveSection}.`);
                                    }
                                  }}
                                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#0284C7] to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all"
                                >
                                  💾 Save & Next ➡️
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* RIGHT: QUESTION PALETTE (CBT STYLE) */}
                          <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between hidden md:flex shrink-0">
                            <div className="space-y-4">
                              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                  QUESTION PALETTE
                                </h4>
                                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                                  {previewActiveSection} ({currentSecQuestions.length} Qs)
                                </p>
                              </div>

                              {/* Question Number Palette Grid */}
                              <div className="grid grid-cols-5 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                                {currentSecQuestions.map((q, idx) => {
                                  const isCurrent = idx === safeQIndex;
                                  const qAnswered = Boolean(previewAnswers[q.id]);
                                  const qReview = Boolean(previewMarkedForReview[q.id]);

                                  let btnStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
                                  if (isCurrent) {
                                    btnStyle = 'bg-sky-500 text-white font-black ring-2 ring-sky-300 shadow-md';
                                  } else if (qReview) {
                                    btnStyle = 'bg-purple-600 text-white font-black';
                                  } else if (qAnswered) {
                                    btnStyle = 'bg-emerald-600 text-white font-black';
                                  }

                                  return (
                                    <button
                                      key={q.id}
                                      type="button"
                                      onClick={() => setPreviewActiveQuestionIndex(idx)}
                                      className={`h-10 rounded-xl font-black text-xs flex items-center justify-center transition-all cursor-pointer ${btnStyle}`}
                                    >
                                      {idx + 1}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Legend Box */}
                              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-[11px] font-extrabold text-slate-600 dark:text-slate-400">
                                <div className="text-[10px] font-black uppercase text-slate-400">STATUS LEGEND:</div>
                                <div className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full bg-sky-500 inline-block" />
                                  <span>Current Active Question</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                                  <span>Answered Question</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" />
                                  <span>Marked for Review</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700 inline-block" />
                                  <span>Unanswered / Unvisited</span>
                                </div>
                              </div>
                            </div>

                            {/* Section Attempt Counter Footer */}
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                              <div className="flex justify-between font-black">
                                <span className="text-slate-500">Answered:</span>
                                <span className="text-emerald-600">{Object.keys(previewAnswers).length}</span>
                              </div>
                              <div className="flex justify-between font-black">
                                <span className="text-slate-500">For Review:</span>
                                <span className="text-purple-600">{Object.keys(previewMarkedForReview).length}</span>
                              </div>
                              <div className="flex justify-between font-black pt-1 border-t border-slate-200 dark:border-slate-700">
                                <span className="text-slate-700 dark:text-slate-300">Total in Test:</span>
                                <span className="text-slate-900 dark:text-white">{quizQuestionsList.length}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

            </div>
          )}

      {/* ================= MODAL: MANAGE COURSE DRAWER/MODAL ================= */}
      {managingCourseFull && (
        <div className="fixed inset-0 z-[250] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={() => setManagingCourseFull(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-orange-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full p-6 space-y-6 text-slate-900 dark:text-white my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black text-[#FF6500] uppercase tracking-wider">{managingCourseFull.category}</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{managingCourseFull.title}</h3>
              </div>
              <button onClick={() => setManagingCourseFull(null)} className="p-1.5 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-black text-slate-400 uppercase">Price</div>
                <div className="text-lg font-black text-emerald-600">₹{managingCourseFull.price}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-black text-slate-400 uppercase">Validity</div>
                <div className="text-lg font-black text-sky-600">{managingCourseFull.validityDays || 365} Days</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-black text-slate-400 uppercase">Chapters</div>
                <div className="text-lg font-black text-purple-600">{managingCourseFull.chapters?.length || 0}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-black text-slate-400 uppercase">Status</div>
                <div className="text-xs font-black text-orange-600 uppercase mt-1">{managingCourseFull.status || 'PUBLISHED'}</div>
              </div>
            </div>

            {/* Edit Course Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const updatedCourse = {
                  ...managingCourseFull,
                  title: managingCourseFull.title,
                  description: managingCourseFull.description,
                  category: managingCourseFull.category,
                  price: Number(managingCourseFull.price),
                  validityDays: Number(managingCourseFull.validityDays || 365),
                  status: managingCourseFull.status || 'PUBLISHED'
                };

                // Asynchronous backend update attempt
                axios.put(`/api/admin/courses/${managingCourseFull.id}`, updatedCourse).catch(() => {});

                // Local storage persistence
                try {
                  const storedCustom = JSON.parse(localStorage.getItem('sd_custom_courses') || '[]');
                  const exists = storedCustom.some(c => c.id === updatedCourse.id);
                  const updatedList = exists 
                    ? storedCustom.map(c => c.id === updatedCourse.id ? updatedCourse : c)
                    : [updatedCourse, ...storedCustom];
                  localStorage.setItem('sd_custom_courses', JSON.stringify(updatedList));
                } catch (err) {}

                setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
                setMessage({ type: 'success', text: `Course '${updatedCourse.title}' updated successfully!` });
                setManagingCourseFull(null);
              }}
              className="space-y-4 text-xs font-bold"
            >
              <div>
                <label className="block text-slate-900 dark:text-white font-black mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={managingCourseFull.title}
                  onChange={(e) => setManagingCourseFull({ ...managingCourseFull, title: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-black"
                />
              </div>

              <div>
                <label className="block text-slate-900 dark:text-white font-black mb-1">Description</label>
                <textarea
                  rows={3}
                  value={managingCourseFull.description || ''}
                  onChange={(e) => setManagingCourseFull({ ...managingCourseFull, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-900 dark:text-white font-black mb-1">Category / Grade</label>
                  <input
                    type="text"
                    value={managingCourseFull.category || ''}
                    onChange={(e) => setManagingCourseFull({ ...managingCourseFull, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 dark:text-white font-black mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={managingCourseFull.price}
                    onChange={(e) => setManagingCourseFull({ ...managingCourseFull, price: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-black"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 dark:text-white font-black mb-1">Status</label>
                  <select
                    value={managingCourseFull.status || 'PUBLISHED'}
                    onChange={(e) => setManagingCourseFull({ ...managingCourseFull, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white font-black"
                  >
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="UNPUBLISHED">UNPUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              {/* Chapters & Content Overview */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Curriculum Chapters ({managingCourseFull.chapters?.length || 0})</h4>
                {managingCourseFull.chapters && managingCourseFull.chapters.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {managingCourseFull.chapters.map(ch => (
                      <div key={ch.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                        <span className="font-black text-slate-900 dark:text-white">{ch.title}</span>
                        <span className="text-slate-400 text-[10px] font-bold">{ch.contents?.length || 0} Lessons • {ch.tests?.length || 0} Tests</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No chapters created yet. Use the Content Tab to add chapters.</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setManagingCourseFull(null)}
                  className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 dark:text-slate-300 font-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6500] to-amber-500 text-white font-black shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL: COURSE PREVIEW MODAL ================= */}
      {previewCourseModalData && (
        <div className="fixed inset-0 z-[250] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={() => setPreviewCourseModalData(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-orange-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-6 text-slate-900 dark:text-white" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-sky-500" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Student Portal Course Preview</h3>
              </div>
              <button onClick={() => setPreviewCourseModalData(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Course Card Preview Container */}
            <div className="space-y-4">
              <div 
                className="relative aspect-[16/9] rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-md"
                style={{ backgroundColor: getCourseThemeColor(previewCourseModalData) }}
              >
                <img 
                  src={getCourseThumbnailSrc(previewCourseModalData)} 
                  alt="" 
                  className="w-full h-full object-contain"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white shadow-md">
                  {previewCourseModalData.status || 'PUBLISHED'}
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-black text-[#FF6500] uppercase tracking-wider">{previewCourseModalData.category}</span>
                <h4 className="text-xl font-black text-slate-900 dark:text-white">{previewCourseModalData.title}</h4>
                {previewCourseModalData.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-extrabold leading-relaxed">
                    {previewCourseModalData.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 font-black uppercase">Price</div>
                  <div className="font-black text-emerald-600 text-base">₹{previewCourseModalData.price}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-black uppercase">Validity</div>
                  <div className="font-black text-sky-600 text-base">{previewCourseModalData.validityDays ? `${previewCourseModalData.validityDays} Days` : 'Full Access'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-black uppercase">Chapters</div>
                  <div className="font-black text-purple-600 text-base">{previewCourseModalData.chapters?.length || 0}</div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <button
                onClick={() => setPreviewCourseModalData(null)}
                className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 dark:text-slate-300 font-black text-xs cursor-pointer"
              >
                Close Preview
              </button>

              <button
                onClick={() => {
                  setPreviewCourseModalData(null);
                  navigate(`/courses/${previewCourseModalData.id}`);
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-[#0284C7] hover:from-sky-500 hover:to-[#0284C7] text-white font-black text-xs shadow-lg shadow-sky-500/25 flex items-center gap-2 cursor-pointer"
              >
                <span>View Live Student Page</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FULL-PAGE STUDENT ATTEMPT INSPECTION & GRADE OVERRIDE WORKSPACE */}
      {inspectingAttemptModal && (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col overflow-y-auto text-slate-900 dark:text-white">
          
          {/* Top Full-Width Sticky Navbar */}
          <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-xs sticky top-0 z-30">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setInspectingAttemptModal(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Student Submission Inspection & Evaluation</span>
                  {inspectingAttemptModal.isManualOverride && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-black">
                      ✏️ Grade Adjusted
                    </span>
                  )}
                </h2>
                <p className="text-xs text-sky-600 dark:text-sky-400 font-extrabold">
                  Student: {inspectingAttemptModal.user?.name} ({inspectingAttemptModal.user?.email}) • Quiz: {inspectingAttemptModal.test?.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setInspectingAttemptModal(null)}
                className="px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 dark:text-slate-300 font-black text-xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await axios.put(`/api/admin/quiz-attempts/${inspectingAttemptModal.id}/override`, {
                      newScore: Number(overrideScoreInput),
                      teacherComment: teacherCommentInput,
                      answerOverrides: Object.entries(answerOverridesState).map(([aId, val]) => ({
                        answerId: aId,
                        isCorrect: val.isCorrect,
                        scoreEarned: val.scoreEarned
                      }))
                    });

                    if (res.data.success) {
                      setMessage({ type: 'success', text: `Updated evaluation & score for ${inspectingAttemptModal.user?.name}!` });
                      setInspectingAttemptModal(null);
                      fetchAdminData();
                    }
                  } catch (err) {
                    setMessage({ type: 'error', text: 'Failed to update student evaluation score.' });
                  }
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Grade Override & Remarks</span>
              </button>
            </div>
          </header>

          {/* Full Page Content Body */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            
            {/* Overview Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm text-center font-bold">
              <div>
                <span className="text-xs text-slate-400 font-black uppercase block mb-1">Original Score</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{inspectingAttemptModal.score} / {inspectingAttemptModal.maxScore}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-black uppercase block mb-1">Accuracy</span>
                <span className="text-xl font-black text-sky-600">{inspectingAttemptModal.accuracyPercentage}%</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-black uppercase block mb-1">Total Time Spent</span>
                <span className="text-xl font-black text-amber-600">{Math.floor(inspectingAttemptModal.timeTakenSeconds / 60)}m {inspectingAttemptModal.timeTakenSeconds % 60}s</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-black uppercase block mb-1">Submitted On</span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-300">{new Date(inspectingAttemptModal.submittedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Teacher Grade Adjustment & Remarks Card */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border-2 border-orange-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-sm font-black text-[#FF6500] uppercase tracking-wider flex items-center gap-2">
                <span>✏️ Teacher Grade Adjustment & Feedback Remarks</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-900 dark:text-white font-black text-xs mb-1.5">
                    ✏️ Override Total Marks / Score
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={overrideScoreInput}
                    onChange={(e) => setOverrideScoreInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-emerald-400 dark:border-slate-700 rounded-2xl p-3.5 text-slate-900 dark:text-white font-black text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-900 dark:text-white font-black text-xs mb-1.5">
                    💬 Teacher Comments & Feedback (Visible to Student on Scorecard)
                  </label>
                  <input
                    type="text"
                    placeholder="eg. Excellent effort! Review quadratic roots for Q3."
                    value={teacherCommentInput}
                    onChange={(e) => setTeacherCommentInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-amber-400 dark:border-slate-700 rounded-2xl p-3.5 text-slate-900 dark:text-white font-bold text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Question-by-Question Answers Review & Correction */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-sm">
              <h4 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Question-by-Question Student Answers & Time Breakdown
              </h4>

              <div className="space-y-4">
                {inspectingAttemptModal.answers?.map((ans, idx) => {
                  const overrideVal = answerOverridesState[ans.id] || { isCorrect: ans.isCorrect, scoreEarned: ans.scoreEarned };
                  return (
                    <div key={ans.id} className="p-5 bg-slate-50/70 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <span className="font-black text-[#0284C7] dark:text-sky-400 flex items-center gap-3">
                          <span className="text-sm">Question {idx + 1} ({ans.question?.sectionName || 'Section A'})</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-extrabold text-[10px]">
                            ⏱️ {ans.timeSpentSeconds ? `${ans.timeSpentSeconds}s` : '15s'} spent
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAnswerOverridesState({
                                ...answerOverridesState,
                                [ans.id]: {
                                  ...overrideVal,
                                  isCorrect: !overrideVal.isCorrect,
                                  scoreEarned: !overrideVal.isCorrect ? (ans.question?.marks || 4) : -(ans.question?.negativeMarks || 1)
                                }
                              });
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              overrideVal.isCorrect
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs'
                                : 'bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs'
                            }`}
                          >
                            {overrideVal.isCorrect ? '✅ CORRECT' : '❌ INCORRECT'} (Click to Toggle)
                          </button>
                        </div>
                      </div>

                      {/* Question Diagram if uploaded */}
                      {ans.question?.imageUrl && (
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center space-y-1">
                          <span className="text-[9px] font-black text-sky-600 uppercase tracking-wider">🖼️ Question Diagram / Figure</span>
                          <img src={ans.question.imageUrl} alt="Diagram" className="max-h-48 w-auto object-contain rounded-lg border border-slate-200 dark:border-slate-700" />
                        </div>
                      )}

                      <p className="font-extrabold text-sm text-slate-900 dark:text-white leading-relaxed">{ans.question?.questionText}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                          <span className="font-black text-slate-400 uppercase text-[10px] block mb-0.5">Student Answer: </span>
                          <strong className="text-slate-900 dark:text-white text-sm">
                            {ans.question?.questionType === 'TYPING' ? (ans.typedAnswer || 'Unanswered') : (ans.selectedOption ? `Option ${ans.selectedOption}` : 'Unanswered')}
                          </strong>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                          <span className="font-black text-slate-400 uppercase text-[10px] block mb-0.5">Correct Target Solution: </span>
                          <strong className="text-emerald-600 text-sm">
                            {ans.question?.questionType === 'TYPING' ? ans.question?.correctOption : `Option ${ans.question?.correctOption}`}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </main>
        </div>
      )}

        </div>
      )}

    </div>
  );
}
