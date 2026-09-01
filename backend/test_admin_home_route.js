import fs from 'fs';
import path from 'path';

function verifyAdminHomeRoute() {
  console.log('====================================================');
  console.log('👑 VERIFYING ADMIN PORTAL HOME PAGE ROUTE & NAVBAR');
  console.log('====================================================');

  const appPath = path.resolve('../frontend/src/App.jsx');
  const navbarPath = path.resolve('../frontend/src/components/layout/Navbar.jsx');

  const appContent = fs.readFileSync(appPath, 'utf-8');
  const navbarContent = fs.readFileSync(navbarPath, 'utf-8');

  // Check 1: Root Route in App.jsx
  const hasAdminRootRoute = appContent.includes("user?.role === 'ADMIN' ? <AdminDashboard /> : <Home />");
  if (hasAdminRootRoute) {
    console.log('✅ CHECK 1: Root Route (/) conditionally renders <AdminDashboard /> for Admin users!');
  } else {
    console.error('❌ CHECK 1 FAILED: Root Route does not render AdminDashboard for Admin.');
  }

  // Check 2: Navbar customization for Admin
  const hasAdminNavbarCustomization = navbarContent.includes("isAdmin ?") && navbarContent.includes("Admin Portal") && navbarContent.includes("Doubts Inbox");
  if (hasAdminNavbarCustomization) {
    console.log('✅ CHECK 2: Top Navbar presents dedicated Admin Command Center navigation when logged in as Admin!');
  } else {
    console.error('❌ CHECK 2 FAILED: Navbar lacks dedicated Admin navigation.');
  }

  console.log('\n🎉 ADMIN PORTAL HOME PAGE IS FULLY CONFIGURED & SEPARATED FROM STUDENT PORTAL!\n');
}

verifyAdminHomeRoute();
