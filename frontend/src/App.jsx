import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// 📚 นำเข้าหน้าเว็บทั้งหมด
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ReportForm from './pages/ReportForm';
import ReportDetail from './pages/ReportDetail';
import ReportList from './pages/ReportList'; 
import ReportEdit from './pages/ReportEdit';
import Profile from './pages/Profile';
import AddAdmin from './pages/AddAdmin';
import AdminList from './pages/AdminList'; // 🌟 นำเข้าหน้า AdminList

import { Toaster } from 'react-hot-toast'; 
import AFKOverlay from './pages/AFKOverlay'; 

const PageTransition = ({ children }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/report" element={<PageTransition><ReportForm /></PageTransition>} />
        <Route path="/report-detail/:id" element={<PageTransition><ReportDetail /></PageTransition>} />
        <Route path="/report-list" element={<PageTransition><ReportList /></PageTransition>} />
        <Route path="/report-edit/:id" element={<PageTransition><ReportEdit /></PageTransition>} />
        
        {/* 🔐 โซนหน้าต่างของ Admin */}
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/add-admin" element={<PageTransition><AddAdmin /></PageTransition>} />
        <Route path="/admin-list" element={<PageTransition><AdminList /></PageTransition>} /> {/* 🌟 เส้นทางไปหน้า AdminList */}
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <Router>
      <AFKOverlay />
      <Toaster position="top-right" reverseOrder={false} />
      <AnimatedRoutes />
    </Router>
  );
}

export default App;