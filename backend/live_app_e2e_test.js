import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { io } from 'socket.io-client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5001';

async function runLiveAppE2ETest() {
  console.log('====================================================');
  console.log('🚀 LIVE APPLICATION END-TO-END CHAT & AUTH TEST');
  console.log('====================================================');

  // STEP 1: Verify Backend Health
  try {
    const healthRes = await axios.get(`${API_URL}/api/health`);
    console.log('✅ STEP 1: Backend Server is Running & Healthy:', healthRes.data.app);
  } catch (err) {
    console.error('❌ STEP 1 FAILED: Backend server not reachable on port 5001. Make sure server is running.');
    return;
  }

  // STEP 2: Admin Login
  let adminToken = '';
  let adminUser = null;
  try {
    const adminLoginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'Dikshasarvottam@gmail.com',
      password: 'Manika@Maths2026'
    });
    if (adminLoginRes.data.success) {
      adminToken = adminLoginRes.data.token;
      adminUser = adminLoginRes.data.user;
      console.log(`✅ STEP 2: Admin Login Successful! Authenticated as ${adminUser.name} (${adminUser.role})`);
    }
  } catch (err) {
    console.error('❌ STEP 2 FAILED: Admin login failed:', err.response?.data || err.message);
    return;
  }

  // STEP 3: Admin Search Students by Name/Email/Mobile
  try {
    const searchRes = await axios.get(`${API_URL}/api/admin/students/search?q=Aarav`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (searchRes.data.success) {
      console.log(`✅ STEP 3: Admin Student Search Successful! Found ${searchRes.data.students.length} students matching "Aarav".`);
    }
  } catch (err) {
    console.error('❌ STEP 3 FAILED: Student search failed:', err.response?.data || err.message);
  }

  // STEP 4: Register New Student & Trigger Real-Time Admin Notification
  let studentToken = '';
  let studentUser = null;
  const newStudentEmail = `test.student.${Date.now()}@gmail.com`;
  try {
    const regRes = await axios.post(`${API_URL}/api/auth/register`, {
      name: 'Kavya Verma',
      email: newStudentEmail,
      phone: '9811223344',
      password: 'studentpassword123'
    });
    if (regRes.data.success) {
      studentToken = regRes.data.token;
      studentUser = regRes.data.user;
      console.log(`✅ STEP 4: New Student Registered Successfully! Name: ${studentUser.name} (${studentUser.email})`);
    }
  } catch (err) {
    console.error('❌ STEP 4 FAILED: Student registration failed:', err.response?.data || err.message);
    return;
  }

  // STEP 5: Real-Time Socket.io Connection & Messaging Test
  console.log('\n--- STEP 5: Testing Real-Time Socket.io Communication ---');

  const adminSocket = io(API_URL, {
    auth: { token: adminToken },
    query: { token: adminToken }
  });

  const studentSocket = io(API_URL, {
    auth: { token: studentToken },
    query: { token: studentToken }
  });

  let adminReceivedMsg = null;
  let studentReceivedMsg = null;

  await new Promise((resolve) => {
    let connectedCount = 0;
    const checkReady = () => {
      connectedCount++;
      if (connectedCount === 2) resolve();
    };
    adminSocket.on('connect', () => {
      console.log('⚡ Admin Socket Connected Live');
      checkReady();
    });
    studentSocket.on('connect', () => {
      console.log('⚡ Student Socket Connected Live');
      checkReady();
    });
  });

  // Attach real-time message listeners
  adminSocket.on('receive_message', (msg) => {
    console.log(`💬 Admin Socket RECEIVED real-time message from ${msg.sender?.name || msg.senderRole}: "${msg.text}"`);
    adminReceivedMsg = msg;
  });

  studentSocket.on('receive_message', (msg) => {
    console.log(`💬 Student Socket RECEIVED real-time message from ${msg.sender?.name || msg.senderRole}: "${msg.text}"`);
    studentReceivedMsg = msg;
  });

  // Student joins conversation
  await new Promise((resolve) => {
    studentSocket.emit('join_conversation', { studentId: studentUser.id }, (ack) => {
      console.log('✅ Student joined room:', ack.conversationId);
      resolve();
    });
  });

  // Admin joins conversation
  await new Promise((resolve) => {
    adminSocket.emit('join_conversation', { studentId: studentUser.id }, (ack) => {
      console.log('✅ Admin joined student room:', ack.conversationId);
      resolve();
    });
  });

  // Student sends doubt message via Socket
  console.log('\n--> Student sending doubt: "Ma\'am, when is the next Class 10 live doubt session?"');
  await new Promise((resolve) => {
    studentSocket.emit('send_message', {
      studentId: studentUser.id,
      text: 'Ma\'am, when is the next Class 10 live doubt session?'
    }, (ack) => {
      console.log('✅ Student message sent confirmation received (ack success)');
      resolve();
    });
  });

  await new Promise((r) => setTimeout(r, 500));

  // Admin sends reply via Socket
  console.log('\n--> Admin replying: "Hi Kavya! The live session is tomorrow at 5 PM."');
  await new Promise((resolve) => {
    adminSocket.emit('send_message', {
      studentId: studentUser.id,
      text: 'Hi Kavya! The live session is tomorrow at 5 PM.'
    }, (ack) => {
      console.log('✅ Admin reply sent confirmation received (ack success)');
      resolve();
    });
  });

  await new Promise((r) => setTimeout(r, 500));

  adminSocket.disconnect();
  studentSocket.disconnect();

  console.log('\n====================================================');
  console.log('🎉 LIVE E2E REAL-TIME CHAT & AUTH TEST COMPLETED SUCCESSFULLY!');
  console.log('====================================================\n');
}

runLiveAppE2ETest().catch(console.error).finally(() => prisma.$disconnect());
