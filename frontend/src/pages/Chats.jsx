import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Send, MessageSquare, CheckCheck, Clock, Sparkles, Wifi, WifiOff, Plus, UserPlus, Search, X, Reply } from 'lucide-react';

export default function Chats() {
  const { user, isAdmin, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [activeConversationId, setActiveConversationId] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Admin "Start New Chat" Search States
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Quick Math Shortcuts for easy doubt typing
  const mathSymbols = ['x²', '√x', 'π', '±', 'θ', '∫', '∑', 'Δ', 'α', 'β', '∞', '≠', '≤', '≥', '÷', 'D = b² - 4ac', 'sin²θ + cos²θ = 1'];

  const [activeStudent, setActiveStudent] = useState(null);

  // 1. Setup Socket.io Real-Time Connection
  useEffect(() => {
    if (!user) return;

    const activeToken = token || localStorage.getItem('sd_token') || 'demo_token';
    const socket = io('/', {
      auth: { token: activeToken },
      query: { token: activeToken },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ [Socket.io] Real-time chat connected!');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 [Socket.io] Disconnected. Attempting reconnect...');
      setIsConnected(false);
    });

    // Real-time listener: Instant incoming message (0ms delay)
    socket.on('receive_message', (newMsg) => {
      console.log('💬 [Real-Time] Incoming message received:', newMsg);
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      // Mark message read if receiver is current user
      if (newMsg.receiverId === user.id && socketRef.current) {
        socketRef.current.emit('mark_read', { conversationId: newMsg.conversationId });
      }
    });

    // Real-time listener: Conversation roster updated
    socket.on('conversation_updated', (updatedConv) => {
      console.log('📋 [Real-Time] Conversation roster updated:', updatedConv);
      if (isAdmin) {
        setConversations(prev => {
          const index = prev.findIndex(c => c.conversationId === updatedConv.conversationId || c.student?.id === updatedConv.student?.id);
          if (index > -1) {
            const copy = [...prev];
            copy[index] = {
              ...copy[index],
              lastMessage: updatedConv.lastMessage,
              unreadCount: updatedConv.unreadCount,
              lastActive: updatedConv.lastActive
            };
            copy.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
            return copy;
          }
          return [updatedConv, ...prev];
        });
      }
    });

    // Real-time listener: Messages read receipt
    socket.on('messages_read', ({ conversationId }) => {
      setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    });

    return () => {
      socket.disconnect();
    };
  }, [user, token, isAdmin]);

  // 2. Fetch Initial Messages & Join Socket Room
  useEffect(() => {
    if (!user) return;

    if (isAdmin) {
      fetchAdminConversations();
    } else {
      fetchMessages();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (targetStudentId = selectedStudentId) => {
    try {
      setLoading(true);
      const studentIdToUse = targetStudentId || selectedStudentId;

      // Load local storage messages using both Email and ID for bulletproof recovery across logouts
      const emailKey = (activeStudent?.email || user?.email || '').toLowerCase().trim();
      const idKey = studentIdToUse || user?.id;
      let storedMsgs = [];
      try {
        if (emailKey) {
          const emailMsgs = JSON.parse(localStorage.getItem(`sd_messages_${emailKey}`) || '[]');
          storedMsgs = [...storedMsgs, ...emailMsgs];
        }
        if (idKey) {
          const idMsgs = JSON.parse(localStorage.getItem(`sd_messages_${idKey}`) || '[]');
          storedMsgs = [...storedMsgs, ...idMsgs];
        }
      } catch (e) {}

      const queryParam = isAdmin && studentIdToUse ? `?studentId=${studentIdToUse}` : '';
      const res = await axios.get(`/api/chat/messages${queryParam}`);
      
      let finalMsgs = [];
      if (res.data.success && Array.isArray(res.data.messages) && res.data.messages.length > 0) {
        const msgMap = new Map();
        [...storedMsgs, ...res.data.messages].forEach(m => {
          if (m && m.text) msgMap.set(m.id || (m.createdAt + m.text), m);
        });
        finalMsgs = Array.from(msgMap.values());
        setActiveConversationId(res.data.conversationId || '');
        if (res.data.teacher) setTeacher(res.data.teacher);
        if (res.data.conversation?.student) {
          setActiveStudent(res.data.conversation.student);
          setSelectedStudentId(res.data.conversation.student.id);
        }
      } else {
        const msgMap = new Map();
        storedMsgs.forEach(m => {
          if (m && m.text) msgMap.set(m.id || (m.createdAt + m.text), m);
        });
        finalMsgs = Array.from(msgMap.values());
      }

      if (finalMsgs.length === 0) {
        finalMsgs = [
          {
            id: 'welcome_1',
            senderId: 'teacher_manika',
            text: 'Welcome to Sarvottam Diksha 1-on-1 Doubt Inbox! 👋 Send your Mathematics doubts, equations, or question photos here anytime.',
            createdAt: new Date().toISOString(),
            isRead: true,
            sender: { name: "Manika Maheshwari (Senior Faculty)", role: "TEACHER" }
          }
        ];
      }

      setMessages(finalMsgs);

      // Join socket room for real-time listener
      if (socketRef.current) {
        socketRef.current.emit('join_conversation', {
          studentId: isAdmin ? studentIdToUse : user?.id
        }, (ack) => {
          if (ack && ack.success) {
            setActiveConversationId(ack.conversationId);
            socketRef.current.emit('mark_read', { conversationId: ack.conversationId });
          }
        });
      }
    } catch (err) {
      console.error('Failed to load chat messages:', err);
      const emailKey = (activeStudent?.email || user?.email || '').toLowerCase().trim();
      const idKey = selectedStudentId || user?.id;
      let storedMsgs = [];
      try {
        if (emailKey) {
          storedMsgs = [...storedMsgs, ...JSON.parse(localStorage.getItem(`sd_messages_${emailKey}`) || '[]')];
        }
        if (idKey) {
          storedMsgs = [...storedMsgs, ...JSON.parse(localStorage.getItem(`sd_messages_${idKey}`) || '[]')];
        }
      } catch (e) {}

      const msgMap = new Map();
      storedMsgs.forEach(m => {
        if (m && m.text) msgMap.set(m.id || (m.createdAt + m.text), m);
      });
      const finalMsgs = Array.from(msgMap.values());

      setMessages(finalMsgs.length > 0 ? finalMsgs : [
        {
          id: 'welcome_1',
          senderId: 'teacher_manika',
          text: 'Welcome to Sarvottam Diksha 1-on-1 Doubt Inbox! 👋 Send your Mathematics doubts, equations, or question photos here anytime.',
          createdAt: new Date().toISOString(),
          isRead: true,
          sender: { name: "Manika Maheshwari (Senior Faculty)", role: "TEACHER" }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminConversations = async () => {
    try {
      const res = await axios.get('/api/chat/admin/conversations');
      if (res.data.success) {
        let convList = res.data.conversations || [];
        const allStudents = res.data.students || [];

        // Include all registered students in the roster so Admin can message any student
        const existingStudentIds = new Set(convList.map(c => c.student?.id).filter(Boolean));
        for (const s of allStudents) {
          if (!existingStudentIds.has(s.id)) {
            convList.push({
              conversationId: 'temp_' + s.id,
              student: s,
              lastMessage: null,
              unreadCount: 0,
              lastActive: new Date(0)
            });
          }
        }

        setConversations(convList);
        if (convList.length > 0) {
          const currentSelectedId = selectedStudentId || (activeStudent ? activeStudent.id : convList[0].student?.id);
          const targetStudent = convList.find(c => c.student?.id === currentSelectedId)?.student || convList[0].student;
          if (targetStudent && targetStudent.id) {
            setSelectedStudentId(targetStudent.id);
            setActiveStudent(targetStudent);
            fetchMessages(targetStudent.id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load admin student conversations:', err);
      fetchMessages();
    }
  };

  const handleSelectStudentChat = (student) => {
    if (!student || !student.id) return;
    setSelectedStudentId(student.id);
    setActiveStudent(student);
    fetchMessages(student.id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    let messageText = inputText.trim();
    if (replyingTo) {
      const senderLabel = replyingTo.sender?.name || (replyingTo.senderId === user.id ? 'You' : 'Teacher');
      const snippet = replyingTo.text ? (replyingTo.text.length > 50 ? replyingTo.text.slice(0, 50) + '...' : replyingTo.text) : 'Message';
      messageText = `↪ Replying to ${senderLabel}: "${snippet}"\n${messageText}`;
      setReplyingTo(null);
    }

    setInputText('');
    setSending(true);

    // Try socket emit first for 0ms real-time delivery
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_message', {
        conversationId: activeConversationId,
        studentId: selectedStudentId,
        text: messageText
      }, (ack) => {
        setSending(false);
        if (ack && ack.success && ack.message) {
          setMessages(prev => {
            if (prev.some(m => m.id === ack.message.id)) return prev;
            return [...prev, ack.message];
          });
        } else {
          // Fallback HTTP POST
          fallbackHttpSend(messageText);
        }
      });
    } else {
      fallbackHttpSend(messageText);
    }
  };

  const fallbackHttpSend = async (textToSend) => {
    const tempMsg = {
      id: 'msg_' + Date.now(),
      senderId: user?.id || 'student_demo',
      receiverId: isAdmin ? selectedStudentId : (teacher?.id || 'teacher_manika'),
      text: textToSend,
      createdAt: new Date().toISOString(),
      isRead: true,
      sender: user
    };

    // Optimistically update UI immediately
    setMessages(prev => [...prev, tempMsg]);
    setSending(false);

    // Sync with local storage using both Email & ID for bulletproof persistence across logouts
    try {
      const studentEmail = (user?.email || '').toLowerCase().trim();
      const studentId = user?.id || 'student_demo';
      const storedConvs = JSON.parse(localStorage.getItem('sd_conversations') || '[]');
      const studentInfo = {
        id: studentId,
        name: user?.name || 'Monisha K P',
        email: studentEmail || 'monisha@gmail.com'
      };
      const newConv = {
        conversationId: activeConversationId || `conv_${studentId}`,
        student: studentInfo,
        lastMessage: { text: textToSend, createdAt: new Date().toISOString() },
        unreadCount: 1,
        lastActive: new Date().toISOString()
      };
      const updatedConvs = [newConv, ...storedConvs.filter(c => (c.student?.email || '').toLowerCase() !== studentEmail && (c.student?.id || c.studentId) !== studentId)];
      localStorage.setItem('sd_conversations', JSON.stringify(updatedConvs));

      if (studentEmail) {
        const emailMsgKey = `sd_messages_${studentEmail}`;
        const storedMsgs = JSON.parse(localStorage.getItem(emailMsgKey) || '[]');
        if (!storedMsgs.some(m => m.id === tempMsg.id || (m.text === tempMsg.text && m.createdAt === tempMsg.createdAt))) {
          localStorage.setItem(emailMsgKey, JSON.stringify([...storedMsgs, tempMsg]));
        }
      }

      if (studentId) {
        const idMsgKey = `sd_messages_${studentId}`;
        const storedMsgs = JSON.parse(localStorage.getItem(idMsgKey) || '[]');
        if (!storedMsgs.some(m => m.id === tempMsg.id || (m.text === tempMsg.text && m.createdAt === tempMsg.createdAt))) {
          localStorage.setItem(idMsgKey, JSON.stringify([...storedMsgs, tempMsg]));
        }
      }
    } catch (e) {}

    try {
      const payload = {
        text: textToSend,
        conversationId: activeConversationId,
        receiverId: isAdmin ? selectedStudentId : (teacher?.id || '')
      };

      const res = await axios.post('/api/chat/send', payload);
      if (res.data && res.data.success && res.data.message) {
        setMessages(prev => prev.map(m => m.id === tempMsg.id ? res.data.message : m));
        if (isAdmin) fetchAdminConversations();
        return;
      }
    } catch (err) {
      console.warn('Backend chat API offline:', err);
    }
  };

  const handleOpenNewChatModal = async () => {
    setShowNewChatModal(true);
    setSearchQuery('');
    fetchStudentSearchResults('');
  };

  const fetchStudentSearchResults = async (query) => {
    setSearching(true);
    try {
      const res = await axios.get(`/api/admin/students/search?q=${encodeURIComponent(query)}`);
      if (res.data.success) {
        setSearchResults(res.data.students || []);
      }
    } catch (err) {
      console.error('Failed to search students:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectStudentForNewChat = (student) => {
    setSelectedStudentId(student.id);
    setShowNewChatModal(false);
    fetchMessages();
  };

  const insertMathSymbol = (symbol) => {
    setInputText(prev => prev + (prev ? ' ' : '') + symbol);
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-sky-100 dark:bg-sky-950 text-[#0284C7] dark:text-sky-400 rounded-full flex items-center justify-center mx-auto">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Student Doubts & Direct Chat</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">
          Please sign in to chat directly with Manika Maheshwari.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px] max-h-[780px] transition-colors">
        
        {/* Admin Student Selector Sidebar (Only for Teacher/Admin) */}
        {isAdmin && (
          <div className="md:col-span-4 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-3 overflow-y-auto">
            {/* Start New Chat Button */}
            <button
              onClick={handleOpenNewChatModal}
              className="w-full py-3 px-4 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-2xl font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 mb-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Message Any Student</span>
            </button>

            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Student Doubts Roster
              </h3>
              <span className="text-[10px] font-black text-[#0284C7] dark:text-sky-400 bg-sky-100 dark:bg-sky-950/80 px-2 py-0.5 rounded-full">
                {conversations.length} Active
              </span>
            </div>

            <div className="space-y-2">
              {conversations.map(c => {
                const s = c.student;
                const isSelected = selectedStudentId === s?.id;
                const timeStr = c.lastMessage ? new Date(c.lastMessage.createdAt || c.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                return (
                  <button
                    key={s?.id || c.conversationId}
                    onClick={() => handleSelectStudentChat(s)}
                    className={`w-full p-3.5 rounded-2xl text-left text-xs font-bold transition-all relative border flex flex-col justify-between gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-md border-slate-900 ring-2 ring-sky-500/20'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                          isSelected ? 'bg-[#0284C7] text-white' : 'bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300'
                        }`}>
                          {s?.name?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div className="truncate">
                          <div className="truncate font-black text-xs">{s?.name}</div>
                          <div className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                            {s?.email}
                          </div>
                        </div>
                      </div>

                      {c.unreadCount > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 animate-bounce">
                          {c.unreadCount} new
                        </span>
                      )}
                    </div>

                    {c.lastMessage ? (
                      <div className="flex items-center justify-between text-[10px] font-medium pt-1 border-t border-slate-200/20">
                        <span className={`truncate ${isSelected ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                          {c.lastMessage.text}
                        </span>
                        <span className={`shrink-0 ml-1.5 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`}>
                          {timeStr}
                        </span>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Chat Thread Area */}
        <div className={`${isAdmin ? 'md:col-span-8' : 'md:col-span-12'} flex flex-col justify-between bg-white dark:bg-slate-900`}>
          
          {/* Chat Header */}
          <div className="p-4 border-b border-amber-200/90 dark:border-slate-800 bg-gradient-to-r from-amber-100/90 via-orange-50/80 to-emerald-100/90 dark:from-slate-800 dark:to-slate-850 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF6500] to-amber-500 text-white flex items-center justify-center font-black text-sm border-2 border-white shadow-md">
                {isAdmin ? (activeStudent?.name?.charAt(0).toUpperCase() || 'S') : 'MM'}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{isAdmin ? (activeStudent?.name || 'Student Doubts Thread') : 'Manika Maheshwari'}</span>
                  {isAdmin && activeStudent && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                      Student
                    </span>
                  )}
                </h3>
                <span className="text-[11px] font-black text-orange-800 dark:text-orange-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {isAdmin 
                    ? (activeStudent?.email ? `${activeStudent.email}${activeStudent.phone ? ' • Ph: ' + activeStudent.phone : ''}` : 'Direct Student Doubt Thread') 
                    : 'Mathematics Doubts & Concepts Teacher'}
                </span>
              </div>
            </div>

            {/* Connection Status Badge */}
            <div className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="flex items-center gap-1 font-bold">
                {isConnected ? <Wifi className="w-3 h-3" /> : <Sparkles className="w-3 h-3 text-amber-500" />}
                {isConnected ? 'Real-time Live' : 'Active Doubt Sync'}
              </span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-gradient-to-b from-amber-50/40 via-orange-50/20 to-emerald-50/30 dark:from-slate-950/80 dark:to-slate-900/80 min-h-[380px]">
            {loading ? (
              <div className="text-center py-10 text-xs text-slate-400 font-bold">Loading real-time doubt thread...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <MessageSquare className="w-10 h-10 mx-auto text-amber-500 dark:text-amber-400" />
                <p className="text-xs font-black text-slate-700 dark:text-slate-300">No previous doubt messages.</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                  Type your Mathematics doubt below to send it directly to Manika Maheshwari!
                </p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.senderId === user.id;

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      onClick={() => setReplyingTo(msg)}
                      title="Click message to reply"
                      className={`max-w-md p-4 rounded-2xl text-xs space-y-1 cursor-pointer transition-all hover:scale-[1.01] relative group ${
                      isMe 
                        ? 'bg-gradient-to-r from-[#FF6500] to-amber-500 text-white font-black rounded-br-none shadow-md border border-orange-400/40' 
                        : 'bg-gradient-to-br from-amber-50/95 via-white to-orange-50/80 dark:from-slate-800 dark:to-slate-850 border-2 border-amber-200/90 dark:border-slate-700 text-slate-900 dark:text-white font-bold rounded-bl-none shadow-xs'
                    }`}>
                      <div className={`font-black text-[10px] uppercase tracking-wider mb-0.5 flex items-center justify-between gap-2 ${
                        isMe ? 'text-amber-100' : 'text-orange-800 dark:text-orange-300'
                      }`}>
                        <span>{isMe ? 'You' : msg.sender?.name || (msg.senderRole === 'ADMIN' ? 'Manika Ma\'am' : 'Student')}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[9px] font-extrabold text-amber-500 dark:text-amber-300">
                          <Reply className="w-3 h-3" /> Reply
                        </span>
                      </div>
                      <p className="leading-relaxed text-xs whitespace-pre-wrap font-extrabold">{msg.text}</p>
                      <div className={`text-[9px] text-right flex items-center justify-end gap-1 pt-1 ${
                        isMe ? 'text-amber-100' : 'text-slate-500 dark:text-slate-400 font-bold'
                      }`}>
                        <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && (
                          <CheckCheck className={`w-3.5 h-3.5 ${msg.isRead ? 'text-white font-black' : 'text-amber-200/80'}`} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Active Reply Banner */}
          {replyingTo && (
            <div className="px-4 py-2 bg-amber-50 dark:bg-slate-800 border-t border-amber-200 dark:border-slate-700 flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200 animate-fadeIn">
              <div className="flex items-center gap-2 truncate">
                <Reply className="w-4 h-4 text-[#FF6500] shrink-0" />
                <span className="truncate">
                  Replying to <strong className="font-black">{replyingTo.sender?.name || (replyingTo.senderId === user.id ? 'You' : 'Teacher')}</strong>: "{replyingTo.text?.slice(0, 45)}{replyingTo.text?.length > 45 ? '...' : ''}"
                </span>
              </div>
              <button type="button" onClick={() => setReplyingTo(null)} className="p-1 hover:bg-amber-200/50 dark:hover:bg-slate-700 rounded-full cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          )}

          {/* Quick Math Toolbar */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-amber-100/90 via-orange-100/80 to-emerald-100/90 dark:from-slate-800 dark:to-slate-850 border-t border-amber-200/90 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-900 dark:text-amber-300 shrink-0">Math Symbols:</span>
            {mathSymbols.map(sym => (
              <button
                key={sym}
                type="button"
                onClick={() => insertMathSymbol(sym)}
                className="px-3 py-1 bg-white/90 dark:bg-slate-700 hover:bg-orange-200/80 dark:hover:bg-slate-600 border border-orange-200 dark:border-slate-600 rounded-xl text-xs font-black text-slate-900 dark:text-amber-300 transition-all shrink-0 active:scale-95 shadow-xs hover:scale-105 cursor-pointer"
              >
                {sym}
              </button>
            ))}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-amber-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900 flex items-center gap-3">
            <input
              type="text"
              placeholder={replyingTo ? `Type reply to ${replyingTo.sender?.name || 'message'}...` : (isAdmin ? "Type reply to student doubt as Manika Ma'am..." : "Ask a Mathematics doubt or message Manika Maheshwari...")}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border-2 border-amber-200/90 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#FF6500] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#FF6500] to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white font-black text-xs flex items-center gap-2 shadow-lg transition-all shrink-0 active:scale-95 cursor-pointer"
            >
              <span>{replyingTo ? 'Send Reply' : 'Send'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>

      </div>

      {/* Admin Student Search Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0284C7]" /> Start Chat with Registered Student
              </h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                autoFocus
                placeholder="Search student by name, email, or mobile..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchStudentSearchResults(e.target.value);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            {/* Student Search Results List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pt-1">
              {searching ? (
                <div className="text-center py-8 text-xs font-bold text-slate-400">Searching student database...</div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-xs font-bold text-slate-400">No registered students found matching search.</div>
              ) : (
                searchResults.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectStudentForNewChat(s)}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#0284C7] bg-white dark:bg-slate-800 text-left flex items-center justify-between transition-all group hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-black text-xs">
                        {s.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-xs text-slate-900 dark:text-white group-hover:text-[#0284C7] transition-colors">
                          {s.name}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                          {s.email} {s.phone ? `• Ph: ${s.phone}` : ''}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-[#0284C7] bg-sky-50 dark:bg-sky-950 px-2.5 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                      Start Chat →
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
